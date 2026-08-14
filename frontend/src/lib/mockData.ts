// Mock data layer for Solar Sentinel.
//
// Content is grounded in a synthetic due-diligence document set (project
// "Solar Alpha"). The backend replaces this file's exports with real
// Bedrock-agent output against the same contract in src/lib/types.ts.

import type {
  ChatMessage,
  Evidence,
  Project,
  ProjectDetail,
  ProjectStatus,
  RecentDocument,
  RiskBand,
  RiskFactorDefinition,
} from "./types";

export const ITC_DEADLINE = "2030-12-31";
export const ITC_DEADLINE_LABEL = "Dec 31, 2030 · 30% ITC eligibility";

export const riskFactorDefinitions: RiskFactorDefinition[] = [
  {
    name: "Land",
    definition:
      "Site control, title, easements, flood and geotechnical fitness of the ground itself.",
  },
  {
    name: "Law",
    definition:
      "Permitting sequence, environmental review, habitat and water rights that gate construction.",
  },
  {
    name: "Finance",
    definition:
      "CAPEX accuracy, debt covenants, returns and the timing of financial close.",
  },
  {
    name: "Materials",
    definition:
      "Long-lead equipment, supplier depth, price escalation and delivery logistics.",
  },
  {
    name: "Demand",
    definition:
      "Contracted offtake coverage, counterparty concentration and merchant price exposure.",
  },
];

export function bandFromScore(score: number): RiskBand {
  if (score >= 70) return "strong";
  if (score >= 40) return "watch";
  return "risk";
}

export function statusFromBand(band: RiskBand): ProjectStatus {
  if (band === "strong") return "on-track";
  if (band === "watch") return "needs-review";
  return "at-risk";
}

// ---------------------------------------------------------------------------
// Hero project: Solar Alpha (fully detailed, grounded in the document set)
// ---------------------------------------------------------------------------

const solarAlphaEvidence: Record<string, Evidence> = {
  "ev-capex": {
    id: "ev-capex",
    factorName: "Stale CAPEX in financial model",
    kind: "contradiction",
    summary:
      "The financial model still runs a $186.0M base CAPEX, but the materials reconciliation puts the updated packages at $199–211M — enough to breach the DSCR covenant.",
    confidence: "High confidence",
    sources: [
      {
        title: "07_Financial_Feasibility_and_Sensitivity_Memo.pdf",
        location: "Base case · Inputs",
        highlight:
          "Total project CAPEX of $186.0M carried in the base case and sensitivity model.",
        extractedLabel: "Model CAPEX",
        extractedValue: "$186.0M",
      },
      {
        title: "06_Materials_Supply_Chain_and_Price_Index.pdf",
        location: "Cost reconciliation",
        highlight:
          "Sampled packages up +$12.7M; updated total could approach $199–211M.",
        extractedLabel: "Reconciled CAPEX",
        extractedValue: "$199–211M",
      },
    ],
    comparison: {
      dimension: "Total project CAPEX",
      rows: [
        { label: "Financial model (base)", a: "$186.0M", b: "" },
        { label: "Materials reconciliation", a: "", b: "$199–211M" },
        { label: "Gap", a: "", b: "+$13–25M" },
        { label: "DSCR at updated CAPEX", a: "1.31x (base)", b: "1.24–1.14x" },
      ],
    },
  },
  "ev-demand": {
    id: "ev-demand",
    factorName: "Firm contract shortfall",
    kind: "contradiction",
    summary:
      "The model assumes 200 MW of firm contracted capacity; only 150 MW sits under an executed term sheet. The extra 50 MW is a non-binding LOI.",
    confidence: "High confidence",
    sources: [
      {
        title: "02_Financial_and_Investment_Sensitivity_Model.xlsx",
        location: "Inputs · Contracted capacity",
        highlight: "Firm contracted capacity assumed at 200 MW.",
        extractedLabel: "Model assumption",
        extractedValue: "200 MW firm",
      },
      {
        title: "05_Demand_and_Offtake_Market_Study",
        location: "Offtake summary",
        highlight:
          "Utility A term sheet covers 150 MW; Data Center Consortium 50 MW is a non-binding LOI.",
        extractedLabel: "Executed offtake",
        extractedValue: "150 MW firm",
      },
    ],
    comparison: {
      dimension: "Firm contracted capacity",
      rows: [
        { label: "Financial model", a: "200 MW", b: "" },
        { label: "Executed term sheets", a: "", b: "150 MW" },
        { label: "Non-binding LOI", a: "", b: "50 MW" },
        { label: "Effect on DSCR", a: "1.31x", b: "1.23x (breach)" },
      ],
    },
  },
  "ev-sequence": {
    id: "ev-sequence",
    factorName: "Construction starts before environmental approval",
    kind: "contradiction",
    summary:
      "Grading notice-to-proceed is dated Oct 14, 2026 — roughly eight weeks before the environmental review and raptor consultation are expected to close.",
    confidence: "High confidence",
    sources: [
      {
        title: "03_Legal_Regulatory_and_Permitting_Memo.pdf",
        location: "Integrated schedule",
        highlight: "Grading NTP set for Oct 14, 2026.",
        extractedLabel: "Construction start",
        extractedValue: "Oct 14, 2026",
      },
      {
        title: "02_Environmental_Water_and_Biodiversity_Assessment.pdf",
        location: "Critical dependencies",
        highlight:
          "Environmental review evidence date Dec 8, 2026 — a +7.86-week conflict.",
        extractedLabel: "Environmental clearance",
        extractedValue: "Dec 8, 2026",
      },
    ],
    comparison: {
      dimension: "Schedule sequencing",
      rows: [
        { label: "Grading notice-to-proceed", a: "Oct 14, 2026", b: "" },
        { label: "Environmental review complete", a: "", b: "Dec 8, 2026" },
        { label: "Overlap", a: "", b: "~7.9 weeks early" },
      ],
    },
  },
  "ev-water": {
    id: "ev-water",
    factorName: "Construction water not secured",
    kind: "contradiction",
    summary:
      "Construction needs 82 acre-feet of water; the district letter indicates only up to 50 acre-feet, leaving 32 acre-feet uncontracted and drought-restricted.",
    confidence: "High confidence",
    sources: [
      {
        title: "02_Environmental_Water_and_Biodiversity_Assessment.pdf",
        location: "Water demand",
        highlight: "Construction water requirement of 82 acre-feet.",
        extractedLabel: "Water needed",
        extractedValue: "82 acre-feet",
      },
      {
        title: "03_Legal_Regulatory_and_Permitting_Memo.pdf",
        location: "Water availability",
        highlight: "Water district willing to discuss up to 50 acre-feet.",
        extractedLabel: "Water available",
        extractedValue: "50 acre-feet",
      },
    ],
    comparison: {
      dimension: "Construction water",
      rows: [
        { label: "Required", a: "82 AF", b: "" },
        { label: "Indicated by district", a: "", b: "50 AF" },
        { label: "Uncontracted", a: "", b: "32 AF" },
      ],
    },
  },
  "ev-drainage": {
    id: "ev-drainage",
    factorName: "Drainage corridors omitted from civil design",
    kind: "contradiction",
    summary:
      "The land survey maps nine drainage corridors; the 30% civil design assumes only three crossings — additional culverts and setbacks are likely.",
    confidence: "Medium confidence",
    sources: [
      {
        title: "01_Land_and_Site_Due_Diligence.pdf",
        location: "Hydrology",
        highlight: "Nine drainage corridors and swales mapped across the site.",
        extractedLabel: "Mapped corridors",
        extractedValue: "9",
      },
      {
        title: "02_Environmental_Water_and_Biodiversity_Assessment.pdf",
        location: "Civil design review",
        highlight:
          "30% civil design incorporates only three drainage crossings.",
        extractedLabel: "In design",
        extractedValue: "3",
      },
    ],
    comparison: {
      dimension: "Drainage crossings",
      rows: [
        { label: "Mapped by survey", a: "9", b: "" },
        { label: "In 30% civil design", a: "", b: "3" },
        { label: "Unaccounted", a: "", b: "6" },
      ],
    },
  },
  "ev-offtake-timing": {
    id: "ev-offtake-timing",
    factorName: "Financing closes before largest offtake is signed",
    kind: "contradiction",
    summary:
      "Debt close is targeted for Oct 2026, but Utility A's final contract — 60% of plant capacity — isn't executed until Nov 2026.",
    confidence: "High confidence",
    sources: [
      {
        title: "07_Financial_Feasibility_and_Sensitivity_Memo.pdf",
        location: "Financing plan",
        highlight: "Financing close targeted Oct 15, 2026.",
        extractedLabel: "Financing close",
        extractedValue: "Oct 15, 2026",
      },
      {
        title: "03_Materials_and_Demand_Index_Tracker.xlsx",
        location: "Critical dependencies",
        highlight: "Utility A final offtake evidence date Nov 30, 2026.",
        extractedLabel: "Offtake execution",
        extractedValue: "Nov 30, 2026",
      },
    ],
    comparison: {
      dimension: "Close vs offtake",
      rows: [
        { label: "Financing close target", a: "Oct 15, 2026", b: "" },
        { label: "Utility A execution", a: "", b: "Nov 30, 2026" },
        { label: "Gap", a: "", b: "~6.6 weeks" },
      ],
    },
  },
  "ev-parcel14": {
    id: "ev-parcel14",
    factorName: "Parcel 14 option unsigned",
    kind: "single",
    summary:
      "18 acres on the collector-line and substation route are shown as controlled in the schedule, but the purchase option is unsigned in the title file.",
    confidence: "High confidence",
    sources: [
      {
        title: "01_Land_and_Site_Due_Diligence.pdf",
        location: "Site control schedule · Parcel 14",
        highlight:
          "13 of 14 parcels under executed site control; Parcel 14 option unsigned — 18 acres on the collector/substation route.",
        extractedLabel: "Site control gap",
        extractedValue: "18 acres",
      },
    ],
  },
  "ev-raptor": {
    id: "ev-raptor",
    factorName: "Raptor habitat consultation open",
    kind: "single",
    summary:
      "Two active nesting territories overlap ~46 acres of panels inside the seasonal buffer; consultation does not close until Dec 2026.",
    confidence: "High confidence",
    sources: [
      {
        title: "02_Environmental_Water_and_Biodiversity_Assessment.pdf",
        location: "Biological resources",
        highlight:
          "Two active nesting territories; ~46 acres of panel area within the seasonal buffer.",
        extractedLabel: "Panels in buffer",
        extractedValue: "46 acres",
      },
    ],
  },
  "ev-transformer": {
    id: "ev-transformer",
    factorName: "Main transformer lead time",
    kind: "single",
    summary:
      "The supplier indicates a 62-week lead time against a 38-week schedule allowance — a 24-week gap on the two units on the critical path to COD.",
    confidence: "High confidence",
    sources: [
      {
        title: "06_Materials_Supply_Chain_and_Price_Index.pdf",
        location: "Long-lead equipment",
        highlight:
          "Transformer lead time 62 weeks vs 38-week allowance; two main power transformers required.",
        extractedLabel: "Lead-time gap",
        extractedValue: "24 weeks",
      },
    ],
  },
  "ev-supplier": {
    id: "ev-supplier",
    factorName: "Single qualified transformer supplier",
    kind: "single",
    summary:
      "Only one supplier is technically qualified for the main transformers, with no validated alternate — a single point of failure on the critical path.",
    confidence: "High confidence",
    sources: [
      {
        title: "06_Materials_Supply_Chain_and_Price_Index.pdf",
        location: "Supplier qualification",
        highlight: "One technically qualified supplier; no validated alternate.",
        extractedLabel: "Qualified suppliers",
        extractedValue: "1",
      },
    ],
  },
  "ev-concentration": {
    id: "ev-concentration",
    factorName: "Customer concentration",
    kind: "single",
    summary:
      "Utility A alone would take 150 MW — 60% of plant capacity — leaving revenue heavily dependent on a single counterparty.",
    confidence: "High confidence",
    sources: [
      {
        title: "05_Demand_and_Offtake_Market_Study",
        location: "Counterparty analysis",
        highlight: "Utility A = 150 MW = 60% of plant capacity.",
        extractedLabel: "Single counterparty",
        extractedValue: "60% of capacity",
      },
    ],
  },
  "ev-dscr": {
    id: "ev-dscr",
    factorName: "DSCR covenant breach",
    kind: "single",
    summary:
      "Minimum DSCR falls to 1.24x, 1.23x and 1.14x across the updated scenarios — below the 1.25x covenant in three of five cases.",
    confidence: "High confidence",
    sources: [
      {
        title: "07_Financial_Feasibility_and_Sensitivity_Memo.pdf",
        location: "Sensitivity table",
        highlight:
          "Minimum DSCR 1.31x base; 1.24x / 1.23x / 1.14x in updated and downside scenarios vs 1.25x covenant.",
        extractedLabel: "Worst-case DSCR",
        extractedValue: "1.14x",
      },
    ],
  },
};

const solarAlpha: Project = {
  id: "solar-alpha",
  name: "Solar Alpha",
  location: "Solano County, California",
  capacityMW: 250,
  latitude: 38.31,
  longitude: -121.94,
  activationScore: 26,
  band: "risk",
  scoreReason:
    "Seven critical red flags across all five pillars — stale CAPEX, an unsigned parcel on the interconnection route and a 24-week transformer gap put COD and financing at risk.",
  status: "at-risk",
  pillars: [
    {
      name: "Land",
      score: 38,
      band: "risk",
      unlocked: false,
      subAgents: [
        "parcel-title-scan",
        "flood-zone-overlay",
        "geotech-boring-review",
        "heavy-haul-route-logistics",
      ],
      factors: [
        {
          id: "land-parcel14",
          name: "Parcel 14 option unsigned",
          band: "risk",
          statusLabel: "Flagged",
          evidence:
            "18 acres on the collector-line and substation route are shown as controlled but the option is unsigned.",
          sources: ["01_Land_and_Site_Due_Diligence.pdf"],
          evidenceId: "ev-parcel14",
        },
        {
          id: "land-drainage",
          name: "Drainage corridors omitted from design",
          band: "risk",
          statusLabel: "Flagged",
          evidence:
            "Survey maps nine drainage corridors; the 30% civil design assumes only three crossings.",
          sources: [
            "01_Land_and_Site_Due_Diligence.pdf",
            "02_Environmental_Water_and_Biodiversity_Assessment.pdf",
          ],
          evidenceId: "ev-drainage",
        },
        {
          id: "land-easement",
          name: "Heavy-haul easement ambiguity",
          band: "watch",
          statusLabel: "Watch",
          evidence:
            "Secondary route crosses a non-exclusive agricultural easement that may not permit oversize traffic; the alternate adds 6.8 mi per delivery.",
          sources: ["01_Land_and_Site_Due_Diligence.pdf"],
        },
        {
          id: "land-flood",
          name: "Flood exposure",
          band: "watch",
          statusLabel: "Watch",
          evidence:
            "About 12% of the site (~170 acres of lowlands) is mapped flood-prone, requiring a panel-layout adjustment.",
          sources: ["01_Land_and_Site_Due_Diligence.pdf"],
        },
        {
          id: "land-geotech",
          name: "Geotechnical fitness",
          band: "watch",
          statusLabel: "Watch",
          evidence:
            "Only 6.4% of the site exceeds 8% slope; 2 of 24 borings show expansive clay in the northwest block.",
          sources: ["01_Land_and_Site_Due_Diligence.pdf"],
        },
      ],
    },
    {
      name: "Law",
      score: 19,
      band: "risk",
      unlocked: false,
      subAgents: [
        "permit-sequence-check",
        "raptor-habitat-scan",
        "water-rights-trace",
        "wetlands-delineation",
      ],
      factors: [
        {
          id: "law-sequence",
          name: "Construction starts before environmental approval",
          band: "risk",
          statusLabel: "Flagged",
          evidence:
            "Grading notice-to-proceed (Oct 14, 2026) begins ~8 weeks before environmental review closes (Dec 8, 2026).",
          sources: [
            "03_Legal_Regulatory_and_Permitting_Memo.pdf",
            "02_Environmental_Water_and_Biodiversity_Assessment.pdf",
          ],
          evidenceId: "ev-sequence",
        },
        {
          id: "law-water",
          name: "Construction water not secured",
          band: "risk",
          statusLabel: "Flagged",
          evidence:
            "82 acre-feet needed; the water district indicates only 50, leaving 32 acre-feet uncontracted.",
          sources: [
            "02_Environmental_Water_and_Biodiversity_Assessment.pdf",
            "03_Legal_Regulatory_and_Permitting_Memo.pdf",
          ],
          evidenceId: "ev-water",
        },
        {
          id: "law-raptor",
          name: "Raptor habitat consultation open",
          band: "risk",
          statusLabel: "Flagged",
          evidence:
            "Two active nesting territories place ~46 acres of panels inside the seasonal buffer; consultation closes Dec 2026.",
          sources: ["02_Environmental_Water_and_Biodiversity_Assessment.pdf"],
          evidenceId: "ev-raptor",
        },
        {
          id: "law-wetlands",
          name: "Wetlands delineation pending",
          band: "watch",
          statusLabel: "Watch",
          evidence:
            "4.6 acres are potentially jurisdictional; field delineation is pending (Oct 2026).",
          sources: ["02_Environmental_Water_and_Biodiversity_Assessment.pdf"],
        },
        {
          id: "law-permit-sequence",
          name: "Permitting sequence risk",
          band: "watch",
          statusLabel: "Watch",
          evidence:
            "Discretionary approval, review, permits and interconnection are assumed in parallel but have sequential dependencies; the historical median delay is 11 weeks.",
          sources: ["03_Legal_Regulatory_and_Permitting_Memo.pdf"],
        },
      ],
    },
    {
      name: "Finance",
      score: 19,
      band: "risk",
      unlocked: false,
      subAgents: [
        "capex-reconciliation",
        "dscr-covenant-stress",
        "offtake-timing-check",
        "sensitivity-sweep",
      ],
      factors: [
        {
          id: "fin-capex",
          name: "Stale CAPEX in financial model",
          band: "risk",
          statusLabel: "Flagged",
          evidence:
            "The model runs $186.0M; the materials reconciliation puts the updated packages at $199–211M.",
          sources: [
            "07_Financial_Feasibility_and_Sensitivity_Memo.pdf",
            "06_Materials_Supply_Chain_and_Price_Index.pdf",
          ],
          evidenceId: "ev-capex",
        },
        {
          id: "fin-dscr",
          name: "DSCR covenant breach in updated scenarios",
          band: "risk",
          statusLabel: "Flagged",
          evidence:
            "Minimum DSCR falls to 1.24x / 1.23x / 1.14x against a 1.25x covenant once updated CAPEX and demand are applied.",
          sources: ["07_Financial_Feasibility_and_Sensitivity_Memo.pdf"],
          evidenceId: "ev-dscr",
        },
        {
          id: "fin-offtake-timing",
          name: "Financing closes before largest offtake is signed",
          band: "risk",
          statusLabel: "Flagged",
          evidence:
            "Debt close targets Oct 2026 while Utility A's final contract — 60% of capacity — executes Nov 2026.",
          sources: [
            "07_Financial_Feasibility_and_Sensitivity_Memo.pdf",
            "03_Materials_and_Demand_Index_Tracker.xlsx",
          ],
          evidenceId: "ev-offtake-timing",
        },
        {
          id: "fin-model-memo",
          name: "Model sensitivity tab contradicts the memo",
          band: "watch",
          statusLabel: "Watch",
          evidence:
            "The model's sensitivity tab shows every scenario passing on an inflated DSCR proxy, while the memo's own table shows covenant breaches.",
          sources: [
            "02_Financial_and_Investment_Sensitivity_Model.xlsx",
            "07_Financial_Feasibility_and_Sensitivity_Memo.pdf",
          ],
        },
        {
          id: "fin-base-returns",
          name: "Base-case returns clear thresholds",
          band: "strong",
          statusLabel: "Cleared",
          evidence:
            "In the base case, project IRR 12.8%, equity IRR 16.4% and DSCR 1.31x all clear their thresholds.",
          sources: ["07_Financial_Feasibility_and_Sensitivity_Memo.pdf"],
        },
      ],
    },
    {
      name: "Materials",
      score: 24,
      band: "risk",
      unlocked: false,
      subAgents: [
        "transformer-leadtime-scan",
        "supplier-qualification",
        "price-index-tracker",
        "logistics-dependency",
      ],
      factors: [
        {
          id: "mat-transformer",
          name: "Main transformer lead time",
          band: "risk",
          statusLabel: "Flagged",
          evidence:
            "A 62-week supplier indication against a 38-week allowance leaves a 24-week gap on the critical path to COD.",
          sources: ["06_Materials_Supply_Chain_and_Price_Index.pdf"],
          evidenceId: "ev-transformer",
        },
        {
          id: "mat-supplier",
          name: "Single qualified supplier",
          band: "risk",
          statusLabel: "Flagged",
          evidence:
            "Only one supplier is technically qualified for the main transformers, with no validated alternate.",
          sources: ["06_Materials_Supply_Chain_and_Price_Index.pdf"],
          evidenceId: "ev-supplier",
        },
        {
          id: "mat-price",
          name: "Price index escalation",
          band: "watch",
          statusLabel: "Watch",
          evidence:
            "Since January: transformers +28%, copper +22%, steel +17%, batteries +9% (PV modules −6%).",
          sources: ["06_Materials_Supply_Chain_and_Price_Index.pdf"],
        },
        {
          id: "mat-quote-age",
          name: "Cost plan built on stale quotes",
          band: "watch",
          statusLabel: "Watch",
          evidence:
            "The cost plan rests on Q1 2026 quotes now +$12.7M across the sampled packages.",
          sources: ["06_Materials_Supply_Chain_and_Price_Index.pdf"],
        },
        {
          id: "mat-logistics",
          name: "Delivery logistics dependency",
          band: "watch",
          statusLabel: "Watch",
          evidence:
            "Oversize transformer delivery relies on the same disputed heavy-haul easement flagged in the land report.",
          sources: [
            "06_Materials_Supply_Chain_and_Price_Index.pdf",
            "01_Land_and_Site_Due_Diligence.pdf",
          ],
        },
      ],
    },
    {
      name: "Demand",
      score: 35,
      band: "risk",
      unlocked: false,
      subAgents: [
        "offtake-coverage-check",
        "counterparty-concentration",
        "merchant-exposure-model",
        "interconnection-contingency",
      ],
      factors: [
        {
          id: "dem-shortfall",
          name: "Firm contract shortfall",
          band: "risk",
          statusLabel: "Flagged",
          evidence:
            "Only 150 MW is firm; the model assumes 200 MW, and the extra 50 MW is a non-binding LOI.",
          sources: [
            "05_Demand_and_Offtake_Market_Study",
            "02_Financial_and_Investment_Sensitivity_Model.xlsx",
          ],
          evidenceId: "ev-demand",
        },
        {
          id: "dem-concentration",
          name: "Customer concentration",
          band: "risk",
          statusLabel: "Flagged",
          evidence:
            "Utility A alone would take 150 MW — 60% of plant capacity — a single-counterparty dependency.",
          sources: ["05_Demand_and_Offtake_Market_Study"],
          evidenceId: "ev-concentration",
        },
        {
          id: "dem-merchant",
          name: "Merchant price exposure",
          band: "watch",
          statusLabel: "Watch",
          evidence:
            "20% merchant at base, rising to 40% if the LOI is excluded; downside forward prices near $35/MWh erode coverage.",
          sources: ["05_Demand_and_Offtake_Market_Study"],
        },
        {
          id: "dem-interconnection",
          name: "Offtake contingent on interconnection",
          band: "watch",
          statusLabel: "Watch",
          evidence:
            "Utility A executes only after the interconnection milestone; the consortium holds a pre-interconnection termination right.",
          sources: ["03_Materials_and_Demand_Index_Tracker.xlsx"],
        },
      ],
    },
  ],
};

const solarAlphaDetail: ProjectDetail = {
  project: solarAlpha,
  evidence: solarAlphaEvidence,
  timeline: [
    { label: "Site control — Parcel 14", date: "2026-09-15", kind: "milestone" },
    {
      label: "Grading NTP — construction start",
      date: "2026-10-14",
      conflictsWith: "Environmental review complete",
      kind: "milestone",
    },
    {
      label: "Financing close",
      date: "2026-10-15",
      conflictsWith: "Utility A final offtake",
      kind: "milestone",
    },
    { label: "Utility A final offtake", date: "2026-11-30", kind: "milestone" },
    {
      label: "Environmental review complete",
      date: "2026-12-08",
      kind: "milestone",
    },
    { label: "Raptor consultation closes", date: "2026-12-15", kind: "milestone" },
    {
      label: "Grid interconnection amendment",
      date: "2027-01-15",
      kind: "milestone",
    },
    { label: "Grading & building permits", date: "2027-02-15", kind: "milestone" },
    {
      label: "Transformer delivery",
      date: "2028-05-17",
      conflictsWith: "Commercial operation (COD)",
      kind: "milestone",
    },
    { label: "Commercial operation (COD)", date: "2028-07-01", kind: "milestone" },
    { label: "ITC deadline", date: ITC_DEADLINE, kind: "deadline" },
  ],
  documents: [
    {
      id: "doc-01",
      title: "01_Land_and_Site_Due_Diligence.pdf",
      kind: "Land report",
      pages: 24,
      uploadedAt: "2026-08-14",
      pillars: ["Land"],
    },
    {
      id: "doc-02",
      title: "02_Environmental_Water_and_Biodiversity_Assessment.pdf",
      kind: "Environmental assessment",
      pages: 31,
      uploadedAt: "2026-08-14",
      pillars: ["Land", "Law"],
    },
    {
      id: "doc-03",
      title: "03_Legal_Regulatory_and_Permitting_Memo.pdf",
      kind: "Legal memo",
      pages: 18,
      uploadedAt: "2026-08-14",
      pillars: ["Law"],
    },
    {
      id: "doc-04",
      title: "04_Community_and_Stakeholder_Engagement_Report.pdf",
      kind: "Stakeholder report",
      pages: 15,
      uploadedAt: "2026-08-14",
      pillars: ["Law", "Demand"],
    },
    {
      id: "doc-06",
      title: "06_Materials_Supply_Chain_and_Price_Index.pdf",
      kind: "Materials & price index",
      pages: 22,
      uploadedAt: "2026-08-14",
      pillars: ["Materials", "Demand"],
    },
    {
      id: "doc-07",
      title: "07_Financial_Feasibility_and_Sensitivity_Memo.pdf",
      kind: "Financial memo",
      pages: 20,
      uploadedAt: "2026-08-14",
      pillars: ["Finance"],
    },
    {
      id: "doc-model",
      title: "02_Financial_and_Investment_Sensitivity_Model.xlsx",
      kind: "Financial model",
      pages: 9,
      uploadedAt: "2026-08-14",
      pillars: ["Finance", "Demand"],
    },
    {
      id: "doc-tracker",
      title: "03_Materials_and_Demand_Index_Tracker.xlsx",
      kind: "Materials & demand tracker",
      pages: 7,
      uploadedAt: "2026-08-14",
      pillars: ["Materials", "Demand"],
    },
    {
      id: "doc-register",
      title: "01_Project_Red_Flag_Risk_Register.xlsx",
      kind: "Risk register",
      pages: 4,
      uploadedAt: "2026-08-14",
      pillars: ["Land", "Law", "Finance", "Materials", "Demand"],
    },
  ],
  priorityActions: [
    {
      id: "pa-1",
      rank: 1,
      title: "Sign the Parcel 14 purchase option",
      detail:
        "18 acres carry the collector line and substation. Without the signed option the interconnection route is not controlled.",
      impact: "high",
      evidenceLink: "ev-parcel14",
      scoreDelta: 9,
    },
    {
      id: "pa-2",
      rank: 2,
      title: "Reconcile CAPEX to the $199–211M range",
      detail:
        "Update the financial model off the materials reconciliation and re-run covenant headroom before financing close.",
      impact: "high",
      evidenceLink: "ev-capex",
      scoreDelta: 8,
    },
    {
      id: "pa-3",
      rank: 3,
      title: "Resequence early grading after environmental review",
      detail:
        "Move grading NTP behind the Dec 8 environmental milestone, or carve out a legally separable early-works scope.",
      impact: "high",
      evidenceLink: "ev-sequence",
      scoreDelta: 7,
    },
    {
      id: "pa-4",
      rank: 4,
      title: "Place the transformer order and qualify an alternate",
      detail:
        "The 24-week gap and single supplier put the July 2028 COD at risk; release the order now and open a second source.",
      impact: "high",
      evidenceLink: "ev-transformer",
      scoreDelta: 5,
    },
    {
      id: "pa-5",
      rank: 5,
      title: "Secure the remaining 32 acre-feet of construction water",
      detail:
        "Contract the shortfall or stage mobilization; dust control and grading cannot proceed on 50 of 82 acre-feet.",
      impact: "medium",
      evidenceLink: "ev-water",
      scoreDelta: 3,
    },
  ],
  projectedScoreAfterMitigation: 58,
  suggestedQuestions: [
    {
      question: "What's the single biggest risk to hitting COD?",
      answer: {
        role: "assistant",
        text: "The main transformers. The supplier indicates 62 weeks against a 38-week allowance — a 24-week gap — and there's no qualified alternate. On the current schedule that pushes delivery to May 2028, colliding with the July 2028 commercial operation date. Releasing the order now and qualifying a second source is the highest-leverage move.",
        actions: [
          {
            name: "Place transformer order and qualify an alternate",
            impact: "high",
            evidenceLink: "ev-transformer",
          },
        ],
      },
    },
    {
      question: "Why is the activation score so low?",
      answer: {
        role: "assistant",
        text: "Seven critical red flags, and two of them are cross-document contradictions the model hasn't caught: CAPEX still reads $186M in the model versus $199–211M in the materials reconciliation, and the model assumes 200 MW of firm offtake when only 150 MW is under an executed term sheet. Both push the DSCR below its 1.25x covenant.",
        actions: [
          {
            name: "Reconcile CAPEX to the $199–211M range",
            impact: "high",
            evidenceLink: "ev-capex",
          },
        ],
      },
    },
    {
      question: "Is the financing at risk?",
      answer: {
        role: "assistant",
        text: "In the base case the returns clear — project IRR 12.8%, DSCR 1.31x. But once you apply the updated CAPEX and the corrected 150 MW of firm demand, minimum DSCR falls to 1.23x and as low as 1.14x, breaching the 1.25x covenant in three of five scenarios. Debt is also set to close in Oct 2026, before Utility A signs in Nov.",
        actions: [
          {
            name: "Re-run covenant headroom before close",
            impact: "high",
            evidenceLink: "ev-dscr",
          },
        ],
      },
    },
    {
      question: "What happens if we don't sign Parcel 14?",
      answer: {
        role: "assistant",
        text: "Parcel 14 is 18 acres carrying the collector line and the substation. Without the signed option you don't control the interconnection route, so the schedule shows site control you don't actually have. It's the first thing to close — it gates both construction and interconnection.",
        actions: [
          {
            name: "Sign the Parcel 14 purchase option",
            impact: "high",
            evidenceLink: "ev-parcel14",
          },
        ],
      },
    },
  ],
  chatHistory: [
    {
      role: "assistant",
      text: "I've read all nine documents for Solar Alpha. The headline: an activation score of 26 with seven critical red flags spanning every pillar. Ask me anything, or start with the biggest risk to COD.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Portfolio siblings (lighter, still complete) for the portfolio and to
// demonstrate the "unlocked" milestone on an on-track project.
// ---------------------------------------------------------------------------

const mojaveRidge: Project = {
  id: "mojave-ridge",
  name: "Mojave Ridge",
  location: "Kern County, California",
  capacityMW: 180,
  latitude: 35.12,
  longitude: -118.31,
  activationScore: 82,
  band: "strong",
  scoreReason:
    "Site control, permits and offtake are all in hand; only a minor price-escalation watch remains before it is fully cleared.",
  status: "on-track",
  pillars: [
    {
      name: "Land",
      score: 88,
      band: "strong",
      unlocked: true,
      subAgents: ["parcel-title-scan", "flood-zone-overlay"],
      factors: [
        {
          id: "mr-land-1",
          name: "Full site control executed",
          band: "strong",
          statusLabel: "Cleared",
          evidence: "All 9 parcels are under executed leases with recorded easements.",
          sources: ["Land_Due_Diligence.pdf"],
        },
      ],
    },
    {
      name: "Law",
      score: 84,
      band: "strong",
      unlocked: true,
      subAgents: ["permit-sequence-check", "water-rights-trace"],
      factors: [
        {
          id: "mr-law-1",
          name: "Conditional use permit approved",
          band: "strong",
          statusLabel: "Cleared",
          evidence: "The county approved the conditional use permit with no open appeals.",
          sources: ["Permitting_Memo.pdf"],
        },
      ],
    },
    {
      name: "Finance",
      score: 79,
      band: "strong",
      unlocked: true,
      subAgents: ["capex-reconciliation", "dscr-covenant-stress"],
      factors: [
        {
          id: "mr-fin-1",
          name: "Debt commitment in place",
          band: "strong",
          statusLabel: "Cleared",
          evidence: "A term-sheet-backed debt commitment holds DSCR at 1.42x in the base case.",
          sources: ["Financial_Memo.pdf"],
        },
      ],
    },
    {
      name: "Materials",
      score: 71,
      band: "strong",
      unlocked: false,
      subAgents: ["transformer-leadtime-scan", "price-index-tracker"],
      factors: [
        {
          id: "mr-mat-1",
          name: "Transformers ordered",
          band: "strong",
          statusLabel: "Cleared",
          evidence: "Main transformers are on order with a 30-week confirmed lead time.",
          sources: ["Materials_Index.pdf"],
        },
        {
          id: "mr-mat-2",
          name: "Module price watch",
          band: "watch",
          statusLabel: "Watch",
          evidence: "A supplier price notice could add ~3% to the module package.",
          sources: ["Materials_Index.pdf"],
        },
      ],
    },
    {
      name: "Demand",
      score: 86,
      band: "strong",
      unlocked: true,
      subAgents: ["offtake-coverage-check", "counterparty-concentration"],
      factors: [
        {
          id: "mr-dem-1",
          name: "Fully contracted offtake",
          band: "strong",
          statusLabel: "Cleared",
          evidence: "A 15-year PPA covers 100% of expected generation across two counterparties.",
          sources: ["Offtake_Study.pdf"],
        },
      ],
    },
  ],
};

const coastalVerde: Project = {
  id: "coastal-verde",
  name: "Coastal Verde",
  location: "San Luis Obispo County, California",
  capacityMW: 120,
  latitude: 35.28,
  longitude: -120.66,
  activationScore: 61,
  band: "watch",
  scoreReason:
    "Fundamentals are sound, but a pending coastal-zone review and a partially contracted offtake keep two pillars in review.",
  status: "needs-review",
  pillars: [
    {
      name: "Land",
      score: 72,
      band: "strong",
      unlocked: true,
      subAgents: ["parcel-title-scan"],
      factors: [
        {
          id: "cv-land-1",
          name: "Site control executed",
          band: "strong",
          statusLabel: "Cleared",
          evidence: "All parcels are under option or lease with clear title.",
          sources: ["Land_Due_Diligence.pdf"],
        },
      ],
    },
    {
      name: "Law",
      score: 48,
      band: "watch",
      unlocked: false,
      subAgents: ["permit-sequence-check", "coastal-zone-review"],
      factors: [
        {
          id: "cv-law-1",
          name: "Coastal-zone review pending",
          band: "watch",
          statusLabel: "Watch",
          evidence: "A coastal development permit is under review with a decision expected next quarter.",
          sources: ["Permitting_Memo.pdf"],
        },
      ],
    },
    {
      name: "Finance",
      score: 66,
      band: "watch",
      unlocked: false,
      subAgents: ["capex-reconciliation"],
      factors: [
        {
          id: "cv-fin-1",
          name: "Contingency below target",
          band: "watch",
          statusLabel: "Watch",
          evidence: "Cost contingency sits at 6% against a 10% internal target.",
          sources: ["Financial_Memo.pdf"],
        },
      ],
    },
    {
      name: "Materials",
      score: 70,
      band: "strong",
      unlocked: true,
      subAgents: ["transformer-leadtime-scan"],
      factors: [
        {
          id: "cv-mat-1",
          name: "Equipment lead times confirmed",
          band: "strong",
          statusLabel: "Cleared",
          evidence: "All long-lead items have confirmed slots inside the schedule.",
          sources: ["Materials_Index.pdf"],
        },
      ],
    },
    {
      name: "Demand",
      score: 52,
      band: "watch",
      unlocked: false,
      subAgents: ["offtake-coverage-check"],
      factors: [
        {
          id: "cv-dem-1",
          name: "Offtake partially contracted",
          band: "watch",
          statusLabel: "Watch",
          evidence: "70% of capacity is under contract; the balance is in late-stage negotiation.",
          sources: ["Offtake_Study.pdf"],
        },
      ],
    },
  ],
};

const basinReach: Project = {
  id: "basin-reach",
  name: "Basin Reach",
  location: "Washoe County, Nevada",
  capacityMW: 300,
  latitude: 39.98,
  longitude: -119.72,
  activationScore: 44,
  band: "watch",
  scoreReason:
    "A large project with real momentum, held back by an unresolved interconnection queue position and rising steel prices.",
  status: "needs-review",
  pillars: [
    {
      name: "Land",
      score: 63,
      band: "watch",
      unlocked: false,
      subAgents: ["parcel-title-scan", "flood-zone-overlay"],
      factors: [
        {
          id: "br-land-1",
          name: "BLM right-of-way pending",
          band: "watch",
          statusLabel: "Watch",
          evidence: "A federal right-of-way grant is in process for the gen-tie corridor.",
          sources: ["Land_Due_Diligence.pdf"],
        },
      ],
    },
    {
      name: "Law",
      score: 55,
      band: "watch",
      unlocked: false,
      subAgents: ["permit-sequence-check"],
      factors: [
        {
          id: "br-law-1",
          name: "Environmental assessment underway",
          band: "watch",
          statusLabel: "Watch",
          evidence: "A federal environmental assessment is underway with no red flags to date.",
          sources: ["Permitting_Memo.pdf"],
        },
      ],
    },
    {
      name: "Finance",
      score: 41,
      band: "watch",
      unlocked: false,
      subAgents: ["capex-reconciliation", "dscr-covenant-stress"],
      factors: [
        {
          id: "br-fin-1",
          name: "Steel escalation pressures budget",
          band: "watch",
          statusLabel: "Watch",
          evidence: "Structural steel is up 17%, compressing contingency on a large racking scope.",
          sources: ["Financial_Memo.pdf"],
        },
      ],
    },
    {
      name: "Materials",
      score: 38,
      band: "risk",
      unlocked: false,
      subAgents: ["transformer-leadtime-scan", "price-index-tracker"],
      factors: [
        {
          id: "br-mat-1",
          name: "Racking supplier not yet awarded",
          band: "risk",
          statusLabel: "Flagged",
          evidence: "The large racking package is unawarded with lead times tightening.",
          sources: ["Materials_Index.pdf"],
        },
      ],
    },
    {
      name: "Demand",
      score: 33,
      band: "risk",
      unlocked: false,
      subAgents: ["offtake-coverage-check", "interconnection-contingency"],
      factors: [
        {
          id: "br-dem-1",
          name: "Interconnection queue position unresolved",
          band: "risk",
          statusLabel: "Flagged",
          evidence: "A cluster restudy could shift the interconnection cost and timing materially.",
          sources: ["Offtake_Study.pdf"],
        },
      ],
    },
  ],
};

function lightDetail(project: Project): ProjectDetail {
  return {
    project,
    evidence: {},
    timeline: [
      { label: "Site control", date: "2026-09-01", kind: "milestone" },
      { label: "Permit approval", date: "2027-03-01", kind: "milestone" },
      { label: "Financial close", date: "2027-06-01", kind: "milestone" },
      { label: "Interconnection", date: "2027-11-01", kind: "milestone" },
      { label: "Commercial operation (COD)", date: "2028-09-01", kind: "milestone" },
      { label: "ITC deadline", date: ITC_DEADLINE, kind: "deadline" },
    ],
    documents: [
      {
        id: `${project.id}-doc-1`,
        title: "Land_Due_Diligence.pdf",
        kind: "Land report",
        pages: 20,
        uploadedAt: "2026-08-10",
        pillars: ["Land"],
      },
      {
        id: `${project.id}-doc-2`,
        title: "Financial_Memo.pdf",
        kind: "Financial memo",
        pages: 18,
        uploadedAt: "2026-08-10",
        pillars: ["Finance"],
      },
      {
        id: `${project.id}-doc-3`,
        title: "Offtake_Study.pdf",
        kind: "Offtake study",
        pages: 14,
        uploadedAt: "2026-08-10",
        pillars: ["Demand"],
      },
    ],
    priorityActions: project.pillars
      .flatMap((p) => p.factors)
      .filter((f) => f.band !== "strong")
      .slice(0, 3)
      .map((f, i) => ({
        id: `${project.id}-pa-${i + 1}`,
        rank: i + 1,
        title: f.name,
        detail: f.evidence,
        impact: f.band === "risk" ? ("high" as const) : ("medium" as const),
        scoreDelta: f.band === "risk" ? 6 : 3,
      })),
    projectedScoreAfterMitigation: Math.min(
      100,
      project.activationScore +
        (project.band === "strong" ? 6 : project.band === "watch" ? 18 : 28),
    ),
    suggestedQuestions: [
      {
        question: "What's the top item to clear next?",
        answer: {
          role: "assistant",
          text: `For ${project.name}, ${project.scoreReason.charAt(0).toLowerCase()}${project.scoreReason.slice(1)}`,
        },
      },
      {
        question: "Is this project on track for the ITC deadline?",
        answer: {
          role: "assistant",
          text: `${project.name} targets commercial operation in 2028, comfortably ahead of the Dec 31, 2030 ITC deadline. The near-term watch items are the constraint, not the deadline itself.`,
        },
      },
    ],
    chatHistory: [
      {
        role: "assistant",
        text: `I've reviewed the documents for ${project.name}. Its activation score is ${project.activationScore}. Ask me what to prioritize.`,
      } as ChatMessage,
    ],
  };
}

// ---------------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------------

export const projectDetails: Record<string, ProjectDetail> = {
  [solarAlpha.id]: solarAlphaDetail,
  [mojaveRidge.id]: lightDetail(mojaveRidge),
  [coastalVerde.id]: lightDetail(coastalVerde),
  [basinReach.id]: lightDetail(basinReach),
};

export const projects: Project[] = [
  solarAlpha,
  mojaveRidge,
  coastalVerde,
  basinReach,
];

export function getProject(id: string): Project | undefined {
  return projectDetails[id]?.project;
}

export function getProjectDetail(id: string): ProjectDetail | undefined {
  return projectDetails[id];
}

export function portfolioSummary() {
  const count = projects.length;
  const avgScore = Math.round(
    projects.reduce((sum, p) => sum + p.activationScore, 0) / count,
  );
  const onTrack = projects.filter((p) => p.status === "on-track").length;
  const needsReview = projects.filter((p) => p.status === "needs-review").length;
  const atRisk = projects.filter((p) => p.status === "at-risk").length;
  return { count, avgScore, avgBand: bandFromScore(avgScore), onTrack, needsReview, atRisk };
}

export const recentDocuments: RecentDocument[] = [
  {
    title: "07_Financial_Feasibility_and_Sensitivity_Memo.pdf",
    project: "Solar Alpha",
    status: "Analyzed",
    addedAt: "2026-08-14",
  },
  {
    title: "06_Materials_Supply_Chain_and_Price_Index.pdf",
    project: "Solar Alpha",
    status: "Analyzed",
    addedAt: "2026-08-14",
  },
  {
    title: "Interconnection_Cluster_Restudy.pdf",
    project: "Basin Reach",
    status: "Scanning",
    addedAt: "2026-08-14",
  },
  {
    title: "Coastal_Development_Permit_Draft.pdf",
    project: "Coastal Verde",
    status: "Queued",
    addedAt: "2026-08-13",
  },
];
