// Scripted scan animation for the Scanning state.
//
// This is a scripted ANIMATION, not project data — it is intentionally
// hardcoded here. Each step reveals one reasoning line as the agent "reads"
// the Solar Alpha document set, grounded in the real findings in mockData.ts.

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
  "parcel-title-scan",
  "capex-reconciliation",
  "permit-sequence-check",
  "transformer-leadtime-scan",
  "offtake-coverage-check",
];

export const SCAN_SCRIPT: ScanStep[] = [
  {
    at: 0.02,
    file: "01_Land_and_Site_Due_Diligence.pdf",
    line: "Reading 01_Land_and_Site_Due_Diligence.pdf — 14 parcels, 13 under executed site control.",
    kind: "read",
  },
  {
    at: 0.1,
    file: "01_Land_and_Site_Due_Diligence.pdf",
    line: "Flagging Parcel 14 option unsigned — 18 acres on the collector and substation route.",
    kind: "flag",
  },
  {
    at: 0.2,
    file: "07_Financial_Feasibility_and_Sensitivity_Memo.pdf",
    line: "Reading 07_Financial_Feasibility_and_Sensitivity_Memo.pdf — base CAPEX $186.0M, project IRR 12.8%.",
    kind: "read",
  },
  {
    at: 0.3,
    file: "06_Materials_Supply_Chain_and_Price_Index.pdf",
    line: "Cross-checking 06_Materials_Supply_Chain_and_Price_Index.pdf — reconciled CAPEX $199–211M.",
    kind: "read",
  },
  {
    at: 0.4,
    file: "06_Materials_Supply_Chain_and_Price_Index.pdf",
    line: "Contradiction found: model CAPEX $186M vs materials reconciliation $199–211M.",
    kind: "contradiction",
  },
  {
    at: 0.5,
    file: "03_Legal_Regulatory_and_Permitting_Memo.pdf",
    line: "Reading 03_Legal_Regulatory_and_Permitting_Memo.pdf — grading notice-to-proceed Oct 14, 2026.",
    kind: "read",
  },
  {
    at: 0.58,
    file: "02_Environmental_Water_and_Biodiversity_Assessment.pdf",
    line: "Environmental review completes Dec 8, 2026 — construction starts about 7.9 weeks early.",
    kind: "flag",
  },
  {
    at: 0.68,
    file: "06_Materials_Supply_Chain_and_Price_Index.pdf",
    line: "Transformer lead time 62 weeks vs 38-week allowance — a 24-week gap to COD.",
    kind: "flag",
  },
  {
    at: 0.78,
    file: "05_Demand_and_Offtake_Market_Study",
    line: "Firm offtake 150 MW vs 200 MW assumed in the model — Utility A holds 60% of capacity.",
    kind: "contradiction",
  },
  {
    at: 0.86,
    file: "01_Project_Red_Flag_Risk_Register.xlsx",
    line: "Reconciling findings across the register — DSCR falls to 1.14x against a 1.25x covenant.",
    kind: "read",
  },
  {
    at: 0.93,
    file: "01_Project_Red_Flag_Risk_Register.xlsx",
    line: "Scoring pillars: land, law, finance, materials, demand.",
    kind: "score",
  },
  {
    at: 0.99,
    file: "01_Project_Red_Flag_Risk_Register.xlsx",
    line: "7 critical red flags identified. Activation score 26.",
    kind: "score",
  },
];
