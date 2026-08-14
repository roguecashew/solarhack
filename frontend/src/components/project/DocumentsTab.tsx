"use client";
import { useProject } from "./ProjectContext";
// PLACEHOLDER — Documents tab. Owned by workstream 3 (replace).
export function DocumentsTab() {
  const { documents } = useProject();
  return <div className="text-sm text-muted">{documents.length} documents</div>;
}
