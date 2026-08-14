"use client";

import { clsx } from "@/lib/clsx";
import { useEvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { ImpactPill } from "./ImpactPill";
import type { ChatAction, ChatMessage } from "@/lib/types";

function EvidenceLink({ evidenceLink }: { evidenceLink: string }) {
  const { openEvidence, hasEvidence } = useEvidenceDrawer();
  if (!hasEvidence(evidenceLink)) return null;
  return (
    <button
      type="button"
      onClick={() => openEvidence(evidenceLink)}
      className="text-xs font-medium text-brand underline-offset-2 hover:underline focus-visible:outline-2"
    >
      Evidence
    </button>
  );
}

function ActionRow({ action }: { action: ChatAction }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-[12px] bg-white/70 px-3 py-2">
      <span className="text-sm font-medium text-ink">{action.name}</span>
      <ImpactPill impact={action.impact} />
      {action.evidenceLink && <EvidenceLink evidenceLink={action.evidenceLink} />}
    </div>
  );
}

/**
 * One conversation turn as a bounded, rounded bubble. User turns are
 * brand-tinted and right-aligned; assistant turns sit left in a neutral
 * surface. Both share the same visual weight.
 */
export function MessageBubble({
  message,
  size = "sm",
}: {
  message: ChatMessage;
  /** "md" gives the roomier Chat-tab treatment; "sm" fits the rail. */
  size?: "sm" | "md";
}) {
  const isUser = message.role === "user";
  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "rounded-[18px] text-sm leading-relaxed",
          size === "md" ? "max-w-[80%] px-4 py-3" : "max-w-[88%] px-3.5 py-2.5",
          isUser ? "bg-brand-soft text-ink" : "bg-surface-2 text-ink",
        )}
      >
        <p>{message.text}</p>
        {message.actions && message.actions.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            {message.actions.map((action, i) => (
              <ActionRow key={i} action={action} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
