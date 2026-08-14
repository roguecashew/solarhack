"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProject } from "@/components/project/ProjectContext";
import { useEvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { ImpactPill } from "@/components/assistant/ImpactPill";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { bandLabel } from "@/lib/band";
import { clsx } from "@/lib/clsx";

type ExportState = "idle" | "confirming" | "exported";

function ExportMemo() {
  const [state, setState] = useState<ExportState>("idle");

  return (
    <div className="flex flex-col items-end gap-3">
      {state !== "confirming" && (
        <Button
          variant="primary"
          onClick={() => setState("confirming")}
        >
          Export memo
        </Button>
      )}

      <AnimatePresence>
        {state === "confirming" && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="w-full max-w-sm rounded-[12px] bg-surface-2 p-4 text-left"
          >
            <p className="text-sm font-medium text-ink">Export a PDF draft?</p>
            <p className="mt-1 text-xs text-muted">
              This exports a PDF draft for review — it is not filed
              automatically and nothing is sent to any counterparty.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState("idle")}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setState("exported")}
              >
                Export draft
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {state === "exported" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted"
        >
          Draft exported for review. Nothing was filed or sent.
        </motion.p>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { project, priorityActions } = useProject();
  const { openEvidence, hasEvidence } = useEvidenceDrawer();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Investment memo</h1>
          <p className="mt-1 text-sm text-muted">
            A formatted preview drawn from the current analysis.
          </p>
        </div>
        <ExportMemo />
      </div>

      <Card className="mx-auto w-full max-w-3xl">
        {/* Memo masthead */}
        <div className="border-b border-hairline pb-5">
          <p className="text-xs font-medium text-faint">
            Confidential draft · for internal review
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">
            {project.name}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {project.location} · {project.capacityMW} MW solar
          </p>
        </div>

        {/* Activation summary */}
        <section className="border-b border-hairline py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-faint">Activation score</p>
              <p className="mt-1 text-3xl font-semibold text-ink">
                {project.activationScore}
                <span className="text-base font-normal text-faint"> / 100</span>
              </p>
            </div>
            <StatusPill band={project.band} label={bandLabel[project.band]} />
          </div>
          <p className="mt-3 text-sm text-muted">{project.scoreReason}</p>
        </section>

        {/* Per-pillar status */}
        <section className="border-b border-hairline py-5">
          <h3 className="text-sm font-semibold text-ink">Pillar status</h3>
          <div className="mt-3 space-y-3">
            {project.pillars.map((pillar) => (
              <div key={pillar.name} className="flex items-center gap-4">
                <span className="w-24 shrink-0 text-sm text-ink">
                  {pillar.name}
                </span>
                <ScoreBar
                  value={pillar.score}
                  band={pillar.band}
                  className="flex-1"
                />
                <span className="w-16 shrink-0 text-right">
                  <StatusPill
                    band={pillar.band}
                    label={bandLabel[pillar.band]}
                    size="sm"
                    dot={false}
                  />
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Top red flags */}
        <section className="py-5">
          <h3 className="text-sm font-semibold text-ink">Top red flags</h3>
          <ol className="mt-3 space-y-4">
            {priorityActions.map((action) => {
              const linkable = action.evidenceLink
                ? hasEvidence(action.evidenceLink)
                : false;
              return (
                <li key={action.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-medium text-muted">
                    {action.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-ink">
                        {action.title}
                      </p>
                      <ImpactPill impact={action.impact} />
                    </div>
                    <p className="mt-1 text-sm text-muted">{action.detail}</p>
                    {linkable && (
                      <button
                        type="button"
                        onClick={() => openEvidence(action.evidenceLink!)}
                        className={clsx(
                          "mt-2 text-sm font-medium text-brand hover:underline",
                        )}
                      >
                        View evidence
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <p className="border-t border-hairline pt-4 text-xs text-faint">
          Generated from the Solar Sentinel analysis. Figures are draft and
          subject to confirmation against source documents.
        </p>
      </Card>
    </div>
  );
}
