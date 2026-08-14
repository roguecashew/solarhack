// Solar Sentinel data contract.
//
// Components consume these shapes as props — no data is hardcoded inside
// components. The backend swaps mock JSON for real Bedrock-agent output
// against this same contract without touching the UI layer.

export type RiskBand = "strong" | "watch" | "risk";

export type PillarName = "Land" | "Law" | "Finance" | "Materials" | "Demand";

export type StatusLabel = "Cleared" | "Watch" | "Flagged";

export type Factor = {
  id: string;
  name: string;
  band: RiskBand;
  statusLabel: StatusLabel;
  /** One-line, plain-English evidence sentence. */
  evidence: string;
  /** Source document titles this factor cites. */
  sources: string[];
  /** Id into the evidence map for the "View evidence" drawer. */
  evidenceId?: string;
};

export type PillarScore = {
  name: PillarName;
  score: number;
  band: RiskBand;
  /** "Unlocked" only when fully cleared — a genuine milestone, not a color. */
  unlocked: boolean;
  subAgents: string[];
  factors: Factor[];
};

export type Project = {
  id: string;
  name: string;
  location: string;
  capacityMW: number;
  latitude: number;
  longitude: number;
  activationScore: number;
  band: RiskBand;
  /** Short plain-English reasoning shown beside the score ring. */
  scoreReason: string;
  status: ProjectStatus;
  pillars: PillarScore[];
};

export type ProjectStatus = "on-track" | "needs-review" | "at-risk";

/** A single source card inside the evidence drawer. */
export type EvidenceSource = {
  title: string;
  location: string;
  highlight: string;
  extractedLabel: string;
  extractedValue: string;
};

/**
 * Evidence for one factor. A clean finding has a single source; a
 * cross-document contradiction has two sources plus a comparison table and a
 * qualitative confidence band (never a bare percentage).
 */
export type Evidence = {
  id: string;
  factorName: string;
  kind: "single" | "contradiction";
  summary: string;
  confidence: "High confidence" | "Medium confidence" | "Needs review";
  sources: EvidenceSource[];
  comparison?: {
    dimension: string;
    rows: { label: string; a: string; b: string }[];
  };
};

export type TimelineEvent = {
  label: string;
  /** ISO date string. */
  date: string;
  /** Label of a milestone this one conflicts with (e.g. starts before it). */
  conflictsWith?: string;
  kind?: "milestone" | "deadline";
};

export type ChatAction = {
  name: string;
  impact: "high" | "medium";
  evidenceLink?: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  actions?: ChatAction[];
};

/** A scripted suggested-question → answer pair for the Sentinel Assistant. */
export type ScriptedQA = {
  question: string;
  answer: ChatMessage;
};

export type PriorityAction = {
  id: string;
  rank: number;
  title: string;
  detail: string;
  impact: "high" | "medium";
  evidenceLink?: string;
  scoreDelta: number;
};

export type ProjectDocument = {
  id: string;
  title: string;
  kind: string;
  pages: number;
  uploadedAt: string;
  /** Which pillar(s) this document primarily informs. */
  pillars: PillarName[];
};

export type RecentDocument = {
  title: string;
  project: string;
  status: "Analyzed" | "Scanning" | "Queued";
  addedAt: string;
};

/** Everything the Project view and its tabs need, keyed by project id. */
export type ProjectDetail = {
  project: Project;
  evidence: Record<string, Evidence>;
  timeline: TimelineEvent[];
  documents: ProjectDocument[];
  priorityActions: PriorityAction[];
  projectedScoreAfterMitigation: number;
  suggestedQuestions: ScriptedQA[];
  chatHistory: ChatMessage[];
};

/** One of the five risk factors, for the portfolio legend. */
export type RiskFactorDefinition = {
  name: PillarName;
  definition: string;
};
