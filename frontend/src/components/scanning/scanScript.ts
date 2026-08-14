// Scripted scan animation for the Scanning state.
//
// This is a scripted ANIMATION, not project data — it is intentionally
// hardcoded here. Each step reveals one reasoning line as the agent "reads"
// the Project Alpha document set, grounded in the findings in mockData.ts.

export type ScanStepKind = "read" | "flag" | "contradiction" | "score";

export type ScanStep = {
  /** Fraction of the run (0–1) at which this line appears. */
  at: number;
  /** Document currently in focus, shown above the progress bar. */
  file: string;
  /** The reasoning line appended to the trail. */
  line: string;
  kind: ScanStepKind;
};

/** Total run length, in ms, before it auto-advances to the project. */
export const SCAN_DURATION_MS = 8200;

/** Sub-agents shown activating in sequence beneath the trail. */
export const SCAN_SUBAGENTS = [
  "site-control-scan",
  "permit-sequence-check",
  "capex-reconciliation",
  "supplier-dependency-scan",
  "interconnection-queue-check",
];

export const SCAN_SCRIPT: ScanStep[] = [
  {
    at: 0.02,
    file: "feasibility_study.pdf",
    line: "Reading feasibility_study.pdf — landowner agreement and interconnection easement executed.",
    kind: "read",
  },
  {
    at: 0.12,
    file: "feasibility_study.pdf",
    line: "Land secured — site control cleared, no listed species habitat on site.",
    kind: "read",
  },
  {
    at: 0.22,
    file: "schedule.pdf",
    line: "Reading schedule.pdf — construction start scheduled for October 14.",
    kind: "read",
  },
  {
    at: 0.32,
    file: "permit_application.pdf",
    line: "Reading permit_application.pdf — environmental permit approval expected December 8.",
    kind: "read",
  },
  {
    at: 0.42,
    file: "permit_application.pdf",
    line: "Flagging Law — construction begins ~8 weeks before the permit is expected.",
    kind: "flag",
  },
  {
    at: 0.54,
    file: "feasibility_study.pdf",
    line: "Reading feasibility_study.pdf — feasibility CAPEX assumed at $42.0M.",
    kind: "read",
  },
  {
    at: 0.64,
    file: "vendor_proposal.pdf",
    line: "Cross-checking vendor_proposal.pdf — quoted equipment cost implies $51.2M.",
    kind: "read",
  },
  {
    at: 0.72,
    file: "vendor_proposal.pdf",
    line: "Contradiction found: CAPEX $42.0M assumed vs $51.2M quoted — a 21.9% variance.",
    kind: "contradiction",
  },
  {
    at: 0.8,
    file: "vendor_proposal.pdf",
    line: "Watch — single-source equipment vendor with no documented contingency.",
    kind: "flag",
  },
  {
    at: 0.88,
    file: "feasibility_study.pdf",
    line: "Demand cleared — interconnection queue confirmed for 180 MW, PPA at $38/MWh.",
    kind: "read",
  },
  {
    at: 0.95,
    file: "geotech_report.pdf",
    line: "Scoring components: Land, Law, Finance, Materials, Demand…",
    kind: "score",
  },
  {
    at: 0.99,
    file: "geotech_report.pdf",
    line: "1 flag open in Law, 2 in watch. Activation Score 62 — at risk.",
    kind: "score",
  },
];
