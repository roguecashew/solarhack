"use client";
import { useProject } from "./ProjectContext";
// PLACEHOLDER — Reports tab. Owned by workstream 3 (replace).
export function ReportsTab() {
  const { report } = useProject();
  return <div className="text-sm text-muted">{report.title}</div>;
}
