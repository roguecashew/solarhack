"use client";

import { motion } from "framer-motion";

type ScanProgressProps = {
  /** 0–100. */
  percent: number;
  /** Filename currently in focus. */
  file: string;
  done: boolean;
};

/**
 * The moving progress indicator: a rounded bar that visibly fills left→right,
 * with the document currently being read and a live percentage. Vista marks
 * work-in-progress — a structural accent, never a status or the reserved brand
 * orange.
 */
export function ScanProgress({ percent, file, done }: ScanProgressProps) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {!done && (
            <motion.span
              aria-hidden
              className="inline-block h-2 w-2 shrink-0 rounded-full bg-vista"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <span className="truncate text-sm text-muted">
            {done ? "Analysis complete" : "Reading"}{" "}
            <span className="text-ink">{file}</span>
          </span>
        </div>
        <span className="shrink-0 text-sm font-medium tabular-nums text-ink">
          {pct}%
        </span>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full rounded-full bg-vista"
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.25, ease: "linear" }}
        />
      </div>
    </div>
  );
}
