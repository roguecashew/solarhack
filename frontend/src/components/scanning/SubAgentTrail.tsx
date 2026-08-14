"use client";

import { clsx } from "@/lib/clsx";
import { SCAN_SUBAGENTS } from "./scanScript";

type SubAgentTrailProps = {
  /** 0–100. Sub-agents activate as the run progresses. */
  percent: number;
  done: boolean;
};

/**
 * A subtle trail of the sub-agents doing the reading. Each lights up as the
 * scan reaches its slice of the run — vista (structural), never a risk color.
 */
export function SubAgentTrail({ percent, done }: SubAgentTrailProps) {
  const total = SCAN_SUBAGENTS.length;
  const activeIndex = Math.min(total - 1, Math.floor((percent / 100) * total));

  return (
    <div>
      <p className="text-xs text-faint">Sub-agents</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SCAN_SUBAGENTS.map((name, i) => {
          const reached = done || i <= activeIndex;
          const active = !done && i === activeIndex;
          return (
            <span
              key={name}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                reached
                  ? "bg-vista-soft text-ink"
                  : "bg-surface-2 text-faint",
              )}
            >
              <span
                aria-hidden
                className={clsx(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  active && "animate-pulse",
                )}
                style={{
                  backgroundColor: reached
                    ? "var(--color-vista)"
                    : "var(--color-hairline)",
                }}
              />
              {name}
            </span>
          );
        })}
      </div>
    </div>
  );
}
