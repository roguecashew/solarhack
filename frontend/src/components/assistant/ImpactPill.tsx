"use client";

import { clsx } from "@/lib/clsx";

/**
 * Impact indicator for a recommended action. This is NOT a risk band — impact
 * is qualitative leverage, never a status color. High reads brand-toned,
 * medium reads neutral.
 */
export function ImpactPill({
  impact,
  className,
}: {
  impact: "high" | "medium";
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        impact === "high"
          ? "bg-brand-soft text-brand"
          : "bg-surface-2 text-muted",
        className,
      )}
    >
      {impact === "high" ? "High impact" : "Medium impact"}
    </span>
  );
}
