"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { clsx } from "@/lib/clsx";
import type { ScriptedQA } from "@/lib/types";

/**
 * Suggested-question chips plus a free-text input. Both routes call `onAsk`,
 * which appends the turn and its scripted answer to the thread.
 */
export function AssistantComposer({
  suggestedQuestions,
  onAsk,
  className,
}: {
  suggestedQuestions: ScriptedQA[];
  onAsk: (text: string) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState("");

  function submit() {
    const text = draft.trim();
    if (!text) return;
    onAsk(text);
    setDraft("");
  }

  return (
    <div className={clsx("space-y-3", className)}>
      {suggestedQuestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((qa) => (
            <Chip key={qa.question} onClick={() => onAsk(qa.question)}>
              {qa.question}
            </Chip>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask Sentinel about this project"
          aria-label="Ask Sentinel a question"
          className="min-w-0 flex-1 rounded-full bg-surface-2 px-4 py-2 text-sm text-ink placeholder:text-faint focus-visible:outline-2"
        />
        <Button variant="primary" type="submit" disabled={!draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
