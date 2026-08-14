"use client";

import { Card } from "@/components/ui/Card";
import { DonutRing } from "@/components/ui/DonutRing";
import { bandLabel } from "@/lib/band";
import { ITC_DEADLINE_LABEL } from "@/lib/mockData";
import type { Project } from "@/lib/types";

/**
 * Activation score block: band-colored ring + plain-English reasoning line and
 * a neutral, brand-toned deadline chip (never a status color).
 */
export function ActivationScore({ project }: { project: Project }) {
  return (
    <Card>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <DonutRing
          value={project.activationScore}
          band={project.band}
          caption={bandLabel[project.band]}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">Activation score</p>
          <p className="mt-1 max-w-md text-ink">{project.scoreReason}</p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "var(--color-brand)" }}
            />
            {ITC_DEADLINE_LABEL}
          </span>
        </div>
      </div>
    </Card>
  );
}
