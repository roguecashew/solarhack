"use client";

import { useState } from "react";
import { useProject } from "@/components/project/ProjectContext";
import { SentinelRail } from "@/components/assistant/SentinelRail";
import { ActivationScore } from "@/components/overview/ActivationScore";
import { PillarCards } from "@/components/overview/PillarCards";
import { FactorDetail } from "@/components/overview/FactorDetail";
import type { PillarName } from "@/lib/types";

// Project Overview tab — the primary screen for a project.
export default function OverviewPage() {
  const { project } = useProject();
  const [selectedPillar, setSelectedPillar] = useState<PillarName | null>(null);

  const handleSelect = (name: PillarName) => {
    setSelectedPillar((current) => (current === name ? null : name));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <ActivationScore project={project} />
        <PillarCards
          pillars={project.pillars}
          selected={selectedPillar}
          onSelect={handleSelect}
        />
        <FactorDetail pillars={project.pillars} selected={selectedPillar} />
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <SentinelRail />
      </div>
    </div>
  );
}
