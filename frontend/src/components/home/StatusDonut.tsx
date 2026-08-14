"use client";

import { motion } from "framer-motion";
import { bandColorVar } from "@/lib/band";
import type { RiskBand } from "@/lib/types";

export type DonutSegment = {
  label: string;
  value: number;
  band: RiskBand;
};

type StatusDonutProps = {
  segments: DonutSegment[];
  total: number;
  size?: number;
  stroke?: number;
};

/**
 * Lightweight inline-SVG donut of the portfolio status mix. Segments use the
 * status palette only (strong/watch/risk) — no chart library, no icons.
 */
export function StatusDonut({
  segments,
  total,
  size = 176,
  stroke = 20,
}: StatusDonutProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sum = segments.reduce((a, s) => a + s.value, 0) || 1;

  // Precompute each segment's cumulative start fraction functionally
  // (React 19 flags any render-time reassignment).
  const fracs = segments.map((seg) => seg.value / sum);
  const arcs = segments.map((seg, i) => ({
    seg,
    frac: fracs[i],
    start: fracs.slice(0, i).reduce((a, f) => a + f, 0),
  }));

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative inline-flex shrink-0 items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-surface-2)"
            strokeWidth={stroke}
          />
          {arcs.map(({ seg, frac, start }) => {
            const segLen = frac * c;
            const offset = -start * c;
            if (seg.value === 0) return null;
            return (
              <motion.circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={bandColorVar[seg.band]}
                strokeWidth={stroke}
                strokeDasharray={`${segLen} ${c - segLen}`}
                initial={{ strokeDashoffset: offset + c }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold leading-none text-ink tabular-nums">
            {total}
          </span>
          <span className="mt-1 text-xs text-muted">projects</span>
        </div>
      </div>

      <ul className="space-y-2">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: bandColorVar[seg.band] }}
            />
            <span className="text-ink tabular-nums">{seg.value}</span>
            <span className="text-muted">{seg.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
