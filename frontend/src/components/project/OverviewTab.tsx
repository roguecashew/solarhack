"use client";
import { useProject } from "./ProjectContext";
// PLACEHOLDER — Overview tab. Owned by workstream 1 (replace).
export function OverviewTab() {
  const { project } = useProject();
  return <div className="text-sm text-muted">Overview — score {project.activationScore}</div>;
}
