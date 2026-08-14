"use client";
import { useProject } from "./ProjectContext";
// PLACEHOLDER — Map tab. Owned by workstream 4 (replace).
export function MapTab() {
  const { map } = useProject();
  return <div className="text-sm text-muted">Map — {map.parcelSize}</div>;
}
