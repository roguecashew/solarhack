"use client";

import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { clsx } from "@/lib/clsx";
import { buildTimelineModel, formatNiceDate } from "./timelineUtils";
import type { TimelineEvent } from "@/lib/types";

export function MilestoneList({ events }: { events: TimelineEvent[] }) {
  const { milestones, deadline } = buildTimelineModel(events);
  const rows = [...milestones, ...(deadline ? [deadline] : [])];

  return (
    <Card padded={false}>
      <div className="px-5 pb-3 pt-5">
        <h2 className="text-lg font-semibold text-ink">Milestones</h2>
        <p className="mt-0.5 text-sm text-muted">
          Every dated event on the critical path, in order.
        </p>
      </div>
      <ul>
        {rows.map((node, i) => (
          <li
            key={node.event.label}
            className={clsx(
              "flex items-center gap-4 px-5 py-3",
              i > 0 && "border-t border-hairline",
            )}
          >
            <span className="w-28 shrink-0 text-sm text-muted">
              {formatNiceDate(node.event.date)}
            </span>
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor: node.isDeadline
                  ? "var(--color-ink)"
                  : node.conflicted
                    ? "var(--color-risk)"
                    : "var(--color-vista)",
              }}
            />
            <span
              className={clsx(
                "flex-1 text-sm",
                node.conflicted ? "font-medium text-risk-ink" : "text-ink",
              )}
            >
              {node.event.label}
            </span>
            {node.isDeadline ? (
              <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">
                Hard deadline
              </span>
            ) : node.conflicted ? (
              <StatusPill band="risk" label="Conflict" size="sm" />
            ) : (
              <span className="text-sm text-faint">Milestone</span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
