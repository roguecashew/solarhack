"""The shared agent loop: plan -> tool call -> observe -> repeat until the
agent emits its contract JSON. Every specialist agent uses this exact loop
with a different role prompt, tool whitelist, and output schema."""
from __future__ import annotations

import json
import os
import re
from typing import Any, Callable

import anthropic
from pydantic import BaseModel, ValidationError

MAX_STEPS = int(os.getenv("AGENT_MAX_STEPS", "8"))

# Provider selection: "anthropic" (direct Claude, default) or "openai" — any
# OpenAI-compatible endpoint, e.g. the Fireworks bridge the Daytona bots use.
PROVIDER = os.getenv("LLM_PROVIDER", "anthropic")

# Claude Opus 5 — the most capable model for long-horizon agentic work, which
# is what this pipeline is. Override per-role if a cheaper tier suffices.
LLM_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-opus-5")

# OpenAI-compatible bridge config (PROVIDER=openai).
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://hackathon.josephbissell.com/v1")
LLM_OPENAI_MODEL = os.getenv("LLM_MODEL", "kimi-latest")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")

# Caps thinking *and* response text together. Adaptive thinking is on by
# default on Opus 5, so a budget sized only for the answer truncates mid-turn.
MAX_TOKENS = int(os.getenv("AGENT_MAX_TOKENS", "16000"))

# low | medium | high | xhigh | max. `high` is the API default and a sane
# starting point; `xhigh` buys more tool use and deeper planning per turn but
# wants a much larger MAX_TOKENS to go with it.
EFFORT = os.getenv("AGENT_EFFORT", "high")

ToolFn = Callable[..., Any]

# Reads ANTHROPIC_API_KEY from the environment. One client for the process:
# it pools connections across every agent in the fan-out.
_client = anthropic.AsyncAnthropic()

_JSON_FENCE = re.compile(r"^\s*```(?:json)?\s*|\s*```\s*$")


async def _openai_chat(messages: list[dict], role_prompt: str, tools: dict) -> dict:
    """One call against an OpenAI-compatible endpoint (the Fireworks bridge)."""
    import httpx
    payload: dict[str, Any] = {
        "model": LLM_OPENAI_MODEL,
        "messages": [{"role": "system", "content": role_prompt}] + messages,
        "temperature": 0,
    }
    if tools:
        payload["tools"] = [
            {
                "type": "function",
                "function": {
                    "name": name,
                    "description": (fn.__doc__ or name).strip(),
                    "parameters": getattr(fn, "schema", {"type": "object", "properties": {}}),
                },
            }
            for name, fn in tools.items()
        ]
    headers = {"Authorization": f"Bearer {LLM_API_KEY}"} if LLM_API_KEY else {}
    async with httpx.AsyncClient(timeout=180) as client:
        r = await client.post(
            f"{LLM_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]


class AgentDidNotConverge(Exception):
    pass


class AgentRefused(Exception):
    """Safety classifiers declined the request. Not a bug in the pipeline —
    the cyber and bio classifiers occasionally fire on benign diligence text."""


class Agent:
    def __init__(
        self,
        name: str,
        role_prompt: str,
        contract: type[BaseModel],
        tools: dict[str, ToolFn] | None = None,
        on_status: Callable[[str], None] | None = None,
    ):
        self.name = name
        self.role_prompt = role_prompt
        self.contract = contract
        self.tools = tools or {}
        self.on_status = on_status or (lambda msg: None)

    def _tool_specs(self) -> list[dict]:
        return [
            {
                "name": name,
                "description": (fn.__doc__ or name).strip(),
                "input_schema": getattr(fn, "schema", {"type": "object", "properties": {}}),
            }
            for name, fn in self.tools.items()
        ]

    async def _chat(self, messages: list[dict]):
        kwargs: dict[str, Any] = {
            "model": LLM_MODEL,
            "max_tokens": MAX_TOKENS,
            "system": self.role_prompt,
            "messages": messages,
            # Adaptive rather than a fixed token budget: Claude sizes its own
            # reasoning per turn. Fixed `budget_tokens` is rejected on Opus 5.
            "thinking": {"type": "adaptive"},
            "output_config": {"effort": EFFORT},
        }
        if self.tools:
            kwargs["tools"] = self._tool_specs()
        # No `temperature`: sampling parameters return a 400 on Opus 5.
        # Steer behaviour through the role prompt instead.
        return await _client.messages.create(**kwargs)

    async def _run_openai(self, task: str, context: dict[str, Any] | None) -> BaseModel:
        """Same loop over an OpenAI-compatible endpoint (message format differs:
        system rides as a message, tool results are role=tool messages)."""
        self.on_status(f"[{self.name}] starting ({LLM_OPENAI_MODEL})")
        messages: list[dict[str, Any]] = [
            {
                "role": "user",
                "content": (
                    f"{task}\n\nContext:\n{json.dumps(context or {}, default=str)[:12000]}\n\n"
                    f"Use tools if you need more information. When done, reply with ONLY JSON "
                    f"matching this schema:\n{json.dumps(self.contract.model_json_schema())}"
                ),
            },
        ]
        for _ in range(MAX_STEPS):
            msg = await _openai_chat(messages, self.role_prompt, self.tools)
            tool_calls = msg.get("tool_calls") or []

            if not tool_calls:
                text = _JSON_FENCE.sub("", msg.get("content") or "")
                try:
                    result = self.contract.model_validate(json.loads(text))
                    self.on_status(f"[{self.name}] done")
                    return result
                except (json.JSONDecodeError, ValidationError, TypeError) as e:
                    messages.append({"role": "assistant", "content": msg.get("content") or ""})
                    messages.append({
                        "role": "user",
                        "content": f"Invalid output ({e}). Return ONLY valid JSON matching the schema.",
                    })
                    continue

            messages.append(msg)
            for call in tool_calls:
                fn_name = call["function"]["name"]
                args = json.loads(call["function"].get("arguments") or "{}")
                self.on_status(f"[{self.name}] {fn_name}({json.dumps(args, default=str)[:80]})")
                try:
                    output = (
                        self.tools[fn_name](**args)
                        if fn_name in self.tools
                        else f"unknown tool {fn_name}"
                    )
                except Exception as e:  # tool failures are observations, not crashes
                    output = f"tool error: {e}"
                messages.append({
                    "role": "tool",
                    "tool_call_id": call["id"],
                    "content": str(output)[:8000],
                })

        raise AgentDidNotConverge(self.name)

    async def run(self, task: str, context: dict[str, Any] | None = None) -> BaseModel:
        if PROVIDER == "openai":
            return await self._run_openai(task, context)
        self.on_status(f"[{self.name}] starting")
        # The role prompt rides in `system`, not as a message — that keeps the
        # cached prefix stable across every turn of the loop.
        messages: list[dict[str, Any]] = [
            {
                "role": "user",
                "content": (
                    f"{task}\n\nContext:\n{json.dumps(context or {}, default=str)[:12000]}\n\n"
                    f"Use tools if you need more information. When done, reply with ONLY JSON "
                    f"matching this schema:\n{json.dumps(self.contract.model_json_schema())}"
                ),
            },
        ]

        for _ in range(MAX_STEPS):
            response = await self._chat(messages)

            if response.stop_reason == "refusal":
                detail = getattr(response.stop_details, "category", None)
                raise AgentRefused(f"{self.name}: refused ({detail})")

            # Echo the whole assistant turn back — thinking blocks included and
            # unmodified. Editing or dropping them breaks the next turn.
            messages.append({"role": "assistant", "content": response.content})

            tool_uses = [b for b in response.content if b.type == "tool_use"]

            if not tool_uses:
                text = "".join(b.text for b in response.content if b.type == "text")
                try:
                    result = self.contract.model_validate(
                        json.loads(_JSON_FENCE.sub("", text))
                    )
                    self.on_status(f"[{self.name}] done")
                    return result
                except (json.JSONDecodeError, ValidationError, TypeError) as e:
                    messages.append({
                        "role": "user",
                        "content": f"Invalid output ({e}). Return ONLY valid JSON matching the schema.",
                    })
                    continue

            results = []
            for call in tool_uses:
                args = call.input or {}
                self.on_status(f"[{self.name}] {call.name}({json.dumps(args, default=str)[:80]})")
                is_error = False
                try:
                    output = (
                        self.tools[call.name](**args)
                        if call.name in self.tools
                        else f"unknown tool {call.name}"
                    )
                except Exception as e:  # tool failures are observations, not crashes
                    output, is_error = f"tool error: {e}", True
                results.append({
                    "type": "tool_result",
                    "tool_use_id": call.id,
                    "content": str(output)[:8000],
                    "is_error": is_error,
                })

            # Every tool_result for a turn goes back in ONE user message —
            # splitting them trains the model out of parallel tool calls.
            messages.append({"role": "user", "content": results})

        raise AgentDidNotConverge(self.name)
