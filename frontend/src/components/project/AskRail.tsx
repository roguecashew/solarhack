"use client";
import { useProject } from "./ProjectContext";
// PLACEHOLDER — Ask Questions rail. Owned by workstream 2 (replace).
export function AskRail({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { priorityActions } = useProject();
  if (collapsed) {
    return (
      <aside className="flex h-full w-11 flex-none cursor-pointer items-center justify-center border-l border-hairline bg-canvas" onClick={onToggle}>
        <span className="text-[12.5px] font-semibold text-ink [writing-mode:vertical-rl] rotate-180">Ask Questions</span>
      </aside>
    );
  }
  return (
    <aside className="flex h-full w-[380px] flex-none flex-col border-l border-hairline bg-canvas">
      <div className="flex items-center justify-between border-b border-hairline bg-surface-2 px-[18px] py-4">
        <div className="text-[15px] font-semibold text-ink">Ask Questions</div>
        <button onClick={onToggle} className="rounded-full border border-hairline px-2.5 py-1 text-[10.5px] text-faint hover:text-ink">Collapse</button>
      </div>
      <div className="p-[18px] text-xs text-muted">{priorityActions.length} recommended actions</div>
    </aside>
  );
}
