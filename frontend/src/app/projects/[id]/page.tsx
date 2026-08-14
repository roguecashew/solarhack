"use client";

import { useProject } from "@/components/project/ProjectContext";
import { Card } from "@/components/ui/Card";
import { DonutRing } from "@/components/ui/DonutRing";

// PLACEHOLDER — Project Overview tab. Owned by workstream B (replace).
export default function OverviewPage() {
  const { project } = useProject();
  return (
    <Card>
      <div className="flex items-center gap-6">
        <DonutRing value={project.activationScore} band={project.band} />
        <div>
          <p className="text-sm text-muted">Activation score</p>
          <p className="mt-1 max-w-md text-ink">{project.scoreReason}</p>
        </div>
      </div>
    </Card>
  );
}
