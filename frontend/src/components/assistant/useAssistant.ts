"use client";

import { useCallback, useState } from "react";
import type { ChatMessage, ScriptedQA } from "@/lib/types";

/** Returned when the input doesn't match any scripted question. */
const FALLBACK_ANSWER: ChatMessage = {
  role: "assistant",
  text: "I can help with land, law, finance, materials or demand for this project — try one of the suggested questions.",
};

/** Match free text to a scripted question (case-insensitive, trimmed). */
function resolveAnswer(input: string, qa: ScriptedQA[]): ChatMessage {
  const norm = input.trim().toLowerCase();
  const match = qa.find((q) => q.question.trim().toLowerCase() === norm);
  return match ? match.answer : FALLBACK_ANSWER;
}

/**
 * Shared conversation state + scripted-answer resolution for both the compact
 * Sentinel rail and the full Chat tab. No LLM/API — answers are scripted.
 */
export function useAssistant(seed: ChatMessage[], qa: ScriptedQA[]) {
  const [messages, setMessages] = useState<ChatMessage[]>(seed);

  const ask = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      const user: ChatMessage = { role: "user", text };
      const answer = resolveAnswer(text, qa);
      setMessages((prev) => [...prev, user, answer]);
    },
    [qa],
  );

  return { messages, ask };
}
