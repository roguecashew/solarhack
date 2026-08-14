"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { useEvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { statusLabelToBand } from "@/lib/band";
import type { Factor, PillarName, PillarScore } from "@/lib/types";

function FactorRow({ factor }: { factor: Factor }) {
  const { openEvidence, hasEvidence } = useEvidenceDrawer();
  const canView = Boolean(factor.evidenceId) && hasEvidence(factor.evidenceId!);

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-ink">{factor.name}</p>
          <StatusPill
            band={statusLabelToBand(factor.statusLabel)}
            label={factor.statusLabel}
            size="sm"
          />
        </div>
        <p className="mt-1.5 text-sm text-muted">{factor.evidence}</p>
        {factor.sources.length > 0 && (
          <p className="mt-1.5 text-xs text-faint underline decoration-hairline underline-offset-2">
            {factor.sources.join(" · ")}
          </p>
        )}
      </div>
      {canView && (
        <div className="shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEvidence(factor.evidenceId!)}
          >
            View evidence
          </Button>
        </div>
      )}
    </div>
  );
}

function PillarSection({ pillar }: { pillar: PillarScore }) {
  return (
    <Card>
      <p className="font-medium text-ink">{pillar.name}</p>
      <p className="mt-1 text-sm text-muted">
        Sub-agents run: {pillar.subAgents.join(" · ")}
      </p>
      <div className="mt-2 divide-y divide-hairline">
        {pillar.factors.map((factor) => (
          <FactorRow key={factor.id} factor={factor} />
        ))}
      </div>
    </Card>
  );
}

type FactorDetailProps = {
  pillars: PillarScore[];
  selected: PillarName | null;
};

/** Detail area: factors for the selected pillar, or every pillar when none. */
export function FactorDetail({ pillars, selected }: FactorDetailProps) {
  const shown = selected
    ? pillars.filter((p) => p.name === selected)
    : pillars;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {selected
          ? `Showing ${selected} factors`
          : "Showing all pillar factors"}
      </p>
      {shown.map((pillar) => (
        <PillarSection key={pillar.name} pillar={pillar} />
      ))}
    </div>
  );
}
