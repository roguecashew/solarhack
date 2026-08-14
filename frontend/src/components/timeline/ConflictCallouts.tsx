"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  buildTimelineModel,
  formatNiceDate,
  type ConflictPair,
} from "./timelineUtils";
import type { TimelineEvent } from "@/lib/types";

function conflictSentence(pair: ConflictPair): string {
  // Derived entirely from the two dates, so the claim is always true: the
  // earlier milestone lands N weeks ahead of the later one it is flagged
  // against, when the schedule treats them as needing to clear in sequence.
  return `${pair.earlier.event.label} is scheduled about ${pair.weeks} weeks before ${pair.later.event.label} — the two overlap instead of clearing in sequence on the critical path.`;
}

function ConflictCard({ pair, index }: { pair: ConflictPair; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.08, duration: 0.35 }}
    >
      <Card className="border-l-2 border-risk">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-ink">
            {pair.from.event.label}
          </p>
          <StatusPill band="risk" label="Scheduling conflict" size="sm" />
        </div>
        <p className="mt-2 text-sm text-muted">{conflictSentence(pair)}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[12px] bg-risk-soft px-3 py-2">
            <p className="text-xs text-risk-ink">{pair.earlier.event.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-risk-ink">
              {formatNiceDate(pair.earlier.event.date)}
            </p>
          </div>
          <div className="rounded-[12px] bg-surface-2 px-3 py-2">
            <p className="text-xs text-faint">{pair.later.event.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">
              {formatNiceDate(pair.later.event.date)}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function ConflictCallouts({ events }: { events: TimelineEvent[] }) {
  const { conflicts } = buildTimelineModel(events);
  if (conflicts.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Scheduling conflicts</h2>
        <span className="text-sm text-muted">
          {conflicts.length} flagged on the critical path
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {conflicts.map((pair, i) => (
          <ConflictCard
            key={`${pair.from.event.label}-${pair.to.event.label}`}
            pair={pair}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
