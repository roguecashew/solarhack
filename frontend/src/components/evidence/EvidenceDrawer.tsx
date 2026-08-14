"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { StatusPill } from "@/components/ui/StatusPill";
import { useProject } from "@/components/project/ProjectContext";
import { clsx } from "@/lib/clsx";
import type { Evidence, EvidenceSource } from "@/lib/types";

type EvidenceDrawerContextValue = {
  /** Open the evidence drawer for a given evidence id (no-op if unknown). */
  openEvidence: (id: string) => void;
  hasEvidence: (id: string) => boolean;
};

const EvidenceDrawerContext = createContext<EvidenceDrawerContextValue | null>(
  null,
);

/** Call from any component to drive the shared evidence drawer. */
export function useEvidenceDrawer(): EvidenceDrawerContextValue {
  const ctx = useContext(EvidenceDrawerContext);
  if (!ctx) {
    throw new Error(
      "useEvidenceDrawer must be used within an EvidenceDrawerProvider",
    );
  }
  return ctx;
}

const confidenceBand: Record<Evidence["confidence"], "strong" | "watch" | "risk"> = {
  "High confidence": "strong",
  "Medium confidence": "watch",
  "Needs review": "risk",
};

function SourceCard({ source }: { source: EvidenceSource }) {
  return (
    <div className="rounded-[12px] bg-surface-2 p-4">
      <p className="text-sm font-medium text-ink">{source.title}</p>
      <p className="mt-0.5 text-xs text-faint">{source.location}</p>
      <p className="mt-3 border-l-2 border-vista pl-3 text-sm text-muted">
        “{source.highlight}”
      </p>
      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-hairline pt-3">
        <span className="text-xs text-faint">{source.extractedLabel}</span>
        <span className="text-sm font-semibold text-ink">
          {source.extractedValue}
        </span>
      </div>
    </div>
  );
}

function EvidenceBody({ evidence }: { evidence: Evidence }) {
  const band = confidenceBand[evidence.confidence];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill
          band={evidence.kind === "contradiction" ? "risk" : "watch"}
          label={
            evidence.kind === "contradiction"
              ? "Cross-document contradiction"
              : "Single-source finding"
          }
          size="sm"
        />
        <StatusPill band={band} label={evidence.confidence} size="sm" dot={false} />
      </div>

      <p className="text-sm text-ink">{evidence.summary}</p>

      <div
        className={clsx(
          "grid gap-3",
          evidence.sources.length > 1 ? "sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {evidence.sources.map((s, i) => (
          <SourceCard key={i} source={s} />
        ))}
      </div>

      {evidence.comparison && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink">
            {evidence.comparison.dimension}
          </p>
          <div className="overflow-hidden rounded-[12px] border border-hairline">
            <table className="w-full text-sm">
              <tbody>
                {evidence.comparison.rows.map((row, i) => (
                  <tr
                    key={i}
                    className={clsx(i > 0 && "border-t border-hairline")}
                  >
                    <td className="px-3 py-2 text-muted">{row.label}</td>
                    <td className="px-3 py-2 text-right font-medium text-ink">
                      {row.a}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-ink">
                      {row.b}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function EvidenceDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { evidence } = useProject();
  const [openId, setOpenId] = useState<string | null>(null);

  const openEvidence = useCallback(
    (id: string) => {
      if (evidence[id]) setOpenId(id);
    },
    [evidence],
  );
  const hasEvidence = useCallback((id: string) => Boolean(evidence[id]), [evidence]);

  const value = useMemo(
    () => ({ openEvidence, hasEvidence }),
    [openEvidence, hasEvidence],
  );

  const current = openId ? evidence[openId] : null;

  return (
    <EvidenceDrawerContext.Provider value={value}>
      {children}
      <Drawer
        open={Boolean(current)}
        onClose={() => setOpenId(null)}
        title="Evidence"
        subtitle={current?.factorName}
      >
        {current && <EvidenceBody evidence={current} />}
      </Drawer>
    </EvidenceDrawerContext.Provider>
  );
}
