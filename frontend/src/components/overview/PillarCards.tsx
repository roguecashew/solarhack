"use client";

import { Card } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { StatusPill } from "@/components/ui/StatusPill";
import { bandLabel } from "@/lib/band";
import { clsx } from "@/lib/clsx";
import type { PillarName, PillarScore } from "@/lib/types";

type PillarCardsProps = {
  pillars: PillarScore[];
  selected: PillarName | null;
  onSelect: (name: PillarName) => void;
};

/** Five selectable pillar metric cards. Clicking one filters the detail area. */
export function PillarCards({ pillars, selected, onSelect }: PillarCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {pillars.map((pillar) => {
        const isSelected = selected === pillar.name;
        return (
          <button
            key={pillar.name}
            type="button"
            onClick={() => onSelect(pillar.name)}
            aria-pressed={isSelected}
            className="text-left focus-visible:outline-2"
          >
            <Card
              className={clsx(
                "h-full transition-shadow hover:shadow-pop",
                isSelected && "ring-2 ring-brand",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-ink">{pillar.name}</p>
                {pillar.unlocked && (
                  <span className="rounded-full bg-vista-soft px-2 py-0.5 text-xs font-medium text-vista">
                    Unlocked
                  </span>
                )}
              </div>

              <p className="mt-3 text-2xl font-semibold leading-none text-ink">
                {pillar.score}
              </p>

              <ScoreBar
                value={pillar.score}
                band={pillar.band}
                className="mt-3"
              />

              <div className="mt-3">
                <StatusPill
                  band={pillar.band}
                  label={bandLabel[pillar.band]}
                  size="sm"
                />
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
