"""The shared agent loop: plan -> tool call -> observe -> repeat until the
agent emits its contract JSON. Every specialist agent uses this exact loop
with a different role prompt, tool whitelist, and output schema."""
from __future__ import annotations

import json
import os
from typing import Any, Callable

import httpx
from pydantic import BaseModel, ValidationError

MAX_STEPS = int(os.getenv("AGENT_MAX_STEPS", "8"))
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")

ToolFn = Callable[..., Any]


class AgentDidNotConverge(Exception):
    pass


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
                "type": "function",
                "function": {
                    "name": name,
                    "description": (fn.__doc__ or name).strip(),
                    "parameters": getattr(fn, "schema", {"type": "object", "properties": {}}),
                },
            }
            for name, fn in self.tools.items()
        ]

    async def _chat(self, messages: list[dict]) -> dict:
        payload: dict[str, Any] = {"model": LLM_MODEL, "messages": messages, "temperature": 0}
        if self.tools:
            payload["tools"] = self._tool_specs()
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(
                f"{LLM_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {LLM_API_KEY}"},
                json=payload,
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]

    async def run(self, task: str, context: dict[str, Any] | None = None) -> BaseModel:
        self.on_status(f"[{self.name}] starting")
        messages = [
            {"role": "system", "content": self.role_prompt},
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
            msg = await self._chat(messages)
            tool_calls = msg.get("tool_calls") or []
            if not tool_calls:
                try:
                    data = json.loads(msg["content"])
                    result = self.contract.model_validate(data)
                    self.on_status(f"[{self.name}] done")
                    return result
                except (json.JSONDecodeError, ValidationError, KeyError, TypeError) as e:
                    messages.append({"role": "assistant", "content": msg.get("content") or ""})
                    messages.append({"role": "user", "content": f"Invalid output ({e}). Return ONLY valid JSON matching the schema."})
                    continue
            messages.append(msg)
            for call in tool_calls:
                fn_name = call["function"]["name"]
                args = json.loads(call["function"]["arguments"] or "{}")
                self.on_status(f"[{self.name}] {fn_name}({json.dumps(args)[:80]})")
                try:
                    result = self.tools[fn_name](**args) if fn_name in self.tools else f"unknown tool {fn_name}"
                except Exception as e:  # tool failures are observations, not crashes
                    result = f"tool error: {e}"
                messages.append({
                    "role": "tool",
                    "tool_call_id": call["id"],
                    "content": str(result)[:8000],
                })
        raise AgentDidNotConverge(self.name)
