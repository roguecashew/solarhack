"use client";

import { Card } from "@/components/ui/Card";
import { useProject } from "@/components/project/ProjectContext";
import { useEvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { clsx } from "@/lib/clsx";
import { useAssistant } from "./useAssistant";
import { MessageBubble } from "./MessageBubble";
import { ImpactPill } from "./ImpactPill";
import { AssistantComposer } from "./AssistantComposer";
import type { PriorityAction } from "@/lib/types";

function ActionEvidenceLink({ evidenceLink }: { evidenceLink: string }) {
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

function PriorityActionItem({ action }: { action: PriorityAction }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
        {action.rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{action.title}</p>
        <p className="mt-0.5 text-sm text-muted">{action.detail}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <ImpactPill impact={action.impact} />
          {action.evidenceLink && (
            <ActionEvidenceLink evidenceLink={action.evidenceLink} />
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * Compact Sentinel assistant rail for the Overview column (~360px). Leads with
 * the numbered priority actions and the projected-score line, then a lighter,
 * secondary conversation area (suggested questions + input).
 */
export function SentinelRail() {
  const {
    project,
    priorityActions,
    projectedScoreAfterMitigation,
    suggestedQuestions,
    chatHistory,
  } = useProject();
  const { messages, ask } = useAssistant(chatHistory, suggestedQuestions);

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-ink">Sentinel assistant</h2>
        <p className="mt-0.5 text-sm text-muted">
          Prioritized next moves for {project.name}.
        </p>
      </div>

      {priorityActions.length > 0 && (
        <ol className="space-y-4">
          {priorityActions.map((action) => (
            <PriorityActionItem key={action.id} action={action} />
          ))}
        </ol>
      )}

      <div className="rounded-[12px] bg-surface-2 p-3.5">
        <p className="text-xs text-muted">
          Projected activation score after these actions
        </p>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-faint">
            {project.activationScore}
          </span>
          <span className="text-faint">→</span>
          <span className="text-2xl font-semibold text-ink">
            {projectedScoreAfterMitigation}
          </span>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{
              width: `${Math.min(100, Math.max(0, projectedScoreAfterMitigation))}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-3 border-t border-hairline pt-4">
        <p className="text-sm font-medium text-muted">Ask Sentinel</p>

        <div
          className={clsx(
            "max-h-64 space-y-2.5 overflow-y-auto",
            messages.length === 0 && "hidden",
          )}
        >
          {messages.map((message, i) => (
            <MessageBubble key={i} message={message} size="sm" />
          ))}
        </div>

        <AssistantComposer
          suggestedQuestions={suggestedQuestions}
          onAsk={ask}
        />
      </div>
    </Card>
  );
}
