"use client";
import { useProject } from "./ProjectContext";
// PLACEHOLDER — Timeline strip. Owned by workstream 2 (replace).
export function TimelineStrip() {
  const { timeline } = useProject();
  return (
    <div className="mb-[18px] rounded-[5px] border border-hairline bg-canvas px-5 pb-5 pt-3.5 shadow-card">
      <div className="mb-4 text-[11px] font-medium text-faint">
        Critical path to activation — hover a point for details
      </div>
      <div className="text-xs text-muted">{timeline.length} milestones</div>
    </div>
  );
}
