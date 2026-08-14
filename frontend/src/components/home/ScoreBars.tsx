"use client";

import { motion } from "framer-motion";
import { bandColorVar } from "@/lib/band";
import type { RiskBand } from "@/lib/types";

export type ScoreBarRow = {
  name: string;
  score: number;
  band: RiskBand;
};

/**
 * Horizontal bar chart of each project's activation score, colored by risk
 * band. Built from plain divs + framer width — no chart library, no icons.
 */
export function ScoreBars({ rows }: { rows: ScoreBarRow[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const pct = Math.max(0, Math.min(100, row.score));
        return (
          <div key={row.name} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-sm text-ink">
              {row.name}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: bandColorVar[row.band] }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="w-7 shrink-0 text-right text-sm font-medium tabular-nums text-ink">
              {row.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
