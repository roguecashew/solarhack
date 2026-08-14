"use client";

import { useProject } from "@/components/project/ProjectContext";
import { Card } from "@/components/ui/Card";
import { CriticalPathTimeline } from "@/components/timeline/CriticalPathTimeline";
import { ConflictCallouts } from "@/components/timeline/ConflictCallouts";
import { MilestoneList } from "@/components/timeline/MilestoneList";
import { buildTimelineModel } from "@/components/timeline/timelineUtils";

export default function TimelinePage() {
  const { timeline } = useProject();
  const { conflicts } = buildTimelineModel(timeline);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-ink">
              Critical path to commercial operation
            </h1>
            <p className="mt-1 text-sm text-muted">
              Every milestone plotted to scale against the hard ITC deadline.
              Conflicts where one milestone lands ahead of a dependency are
              drawn in red.
            </p>
          </div>
          {conflicts.length > 0 && (
            <span className="rounded-full bg-risk-soft px-3 py-1 text-sm font-medium text-risk-ink">
              {conflicts.length} scheduling {conflicts.length === 1 ? "conflict" : "conflicts"}
            </span>
          )}
        </div>

        <div className="mt-6">
          <CriticalPathTimeline events={timeline} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline pt-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full border-2"
              style={{ borderColor: "var(--color-vista)" }}
            />
            Milestone
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "var(--color-risk)" }}
            />
            In conflict
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "var(--color-ink)" }}
            />
            Hard deadline
          </span>
        </div>
      </Card>

      <ConflictCallouts events={timeline} />

      <MilestoneList events={timeline} />
    </div>
  );
}
