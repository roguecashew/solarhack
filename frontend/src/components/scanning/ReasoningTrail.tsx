"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ScanStep, ScanStepKind } from "./scanScript";

/** Dot color encodes the meaning of the line, not decoration. */
const dotColor: Record<ScanStepKind, string> = {
  read: "var(--color-vista)",
  flag: "var(--color-risk)",
  contradiction: "var(--color-risk)",
  score: "var(--color-faint)",
};

const kindLabel: Record<ScanStepKind, string | null> = {
  read: null,
  flag: "Flag",
  contradiction: "Contradiction",
  score: null,
};

type ReasoningTrailProps = {
  steps: ScanStep[];
};

/**
 * A live reasoning log. Lines append one-by-one and the view auto-scrolls to
 * the newest as the agent reads the document set.
 */
export function ReasoningTrail({ steps }: ReasoningTrailProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [steps.length]);

  return (
    <div className="h-72 overflow-y-auto rounded-[12px] bg-surface-2 p-4">
      <ol className="space-y-2.5">
        <AnimatePresence initial={false}>
          {steps.map((step, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex gap-2.5 text-sm leading-relaxed"
            >
              <span
                aria-hidden
                className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: dotColor[step.kind] }}
              />
              <span className="text-ink">
                {kindLabel[step.kind] && (
                  <span className="mr-1.5 text-risk-ink">
                    {kindLabel[step.kind]}
                  </span>
                )}
                {step.line}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </ol>
    </div>
  );
}
