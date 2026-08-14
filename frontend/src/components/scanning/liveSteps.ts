// Translates the agent backend's status narration into ScanStep lines.
//
// The backend emits free text — `[Orchestrator] starting`, `[Extractor:01.pdf]
// pdf_extract({...})`, `[pipeline] 3 data gaps found …` — because it was built
// to narrate a demo, not to drive a typed UI. This module is the whole of the
// translation, so when the backend gains a structured status contract there is
// exactly one file to change.

import type { ScanStep, ScanStepKind } from "./scanScript";

const FILENAME = /([\w.\-]+\.(?:pdf|xlsx))/i;
const AGENT = /^\[([^\]]+)\]\s*/;

function classify(message: string): ScanStepKind {
  const text = message.toLowerCase();
  if (text.includes("contradict") || text.includes("conflict")) return "contradiction";
  if (text.includes("gap") || text.includes("missing") || text.includes("flag")) return "flag";
  if (text.includes("scor") || text.includes("readiness") || text.includes("done")) return "score";
  return "read";
}

/**
 * `at` is left at 0 — live steps are appended in arrival order and the trail
 * renders them all, so the scripted timeline fraction is meaningless here.
 */
export function toScanStep(message: string, previousFile: string): ScanStep {
  const agent = AGENT.exec(message)?.[1];
  const body = message.replace(AGENT, "");
  const file = FILENAME.exec(message)?.[1] ?? previousFile;

  return {
    at: 0,
    file,
    line: agent ? `${agent} — ${body}` : message,
    kind: classify(message),
  };
}

/**
 * Progress for a run whose length is unknown until it ends.
 *
 * Approaches 95% asymptotically on event count so the bar always moves and
 * never claims completion early; the caller pins it to 100 on `__DONE__`.
 */
export function approximateProgress(eventCount: number): number {
  return 95 * (1 - Math.exp(-eventCount / 18));
}
