# Diligence Output Schema — Design

**Date:** 2026-08-14
**Status:** Approved, ready for implementation planning

## Problem

A fan-out of agents performs due diligence on a solar development project by
reading the source documents in `data/`. Their output has to reach a React
frontend in a form that renders progressively, survives partial agent failure,
and never disagrees with itself about a number.

Nothing exists yet: `frontend/` is a bare Vite scaffold and there is no agent
layer. This spec defines the contract between the two so both can be built in
parallel.

## Ground truth

`data/01_Project_Red_Flag_Risk_Register.xlsx` is not an input to the system —
it is the expected output, hand-authored. Its four sheets define the entire
domain model, and its formulas define the arithmetic. The schema mirrors it and
the test suite asserts against it.

**Factors and weights** (Dashboard sheet):

| Factor | Weight | Readiness (0-100) |
|---|---|---|
| Land | 0.20 | 38.00 |
| Law | 0.20 | 18.67 |
| Finance | 0.25 | 18.67 |
| Materials | 0.20 | 24.00 |
| Demand | 0.15 | 34.67 |
| **Overall** | 1.00 | **26.00** |

**Risk Register columns:** Risk ID, Factor, Subfactor, Risk, Evidence / Trigger,
Likelihood (1-5), Impact (1-5), Severity, Owner, Mitigation, Source Document,
Risk Score.

**Evidence Map** binds each source document to its primary factor(s), the key
fields to extract, and the red flag seeded into it:

| Document | Factor | Seeded red flag |
|---|---|---|
| 01 Land and Site Due Diligence | Land | Unsigned Parcel 14 + heavy-haul easement ambiguity |
| 02 Environmental, Water and Biodiversity | Law / Land | Raptor buffer conflict + 32 acre-feet water gap |
| 03 Legal, Regulatory and Permitting | Law | Early works precede environmental milestone |
| 04 Community and Stakeholder Engagement | Land / Law | Fallback truck route conflicts with community request |
| 05 Demand and Offtake Market Study | Demand | Only 150 MW firm vs 200 MW assumed |
| 06 Materials Supply Chain and Price Index | Materials | Transformer 62 weeks vs 38 weeks schedule |
| 07 Financial Feasibility and Sensitivity | Finance | $186M model conflicts with $199-211M updated cost |

Four of the seven red flags are **contradictions between two documents**, not
facts stated in one. Surfacing them is the point of the product, and it drives
the three-stage topology below.

**Document 05 is referenced by the Evidence Map but is absent from `data/`.**
This is treated as a permanent condition, not a bug to fix: the Demand extractor
must report `skipped` and the system must still produce a complete report. It is
the built-in test of the partial-failure path.

## Derived arithmetic

Recovered from the workbook and verified against all 16 rows:

```
riskScore(f)        = likelihood × impact                    // 1..25
severity(f)         = riskScore >= 20 ? 'critical'
                    : riskScore >= 12 ? 'high'
                    : riskScore >=  6 ? 'medium'
                    :                   'low'
avgRiskScore(F)     = mean(riskScore) over findings in factor F
readinessScore(F)   = 100 − 4 × avgRiskScore(F)              // 0..96, null if no findings
overallReadiness    = Σ weight(F) × readinessScore(F)  ÷  Σ weight(F)
                      over factors where readinessScore(F) is not null
```

The divisor renormalises the weights across the factors that actually scored.
With all five present it is 1.0 and the expression reduces to the workbook's
plain weighted sum. With a factor unscored, the remaining factors keep their
relative proportions instead of the missing one silently contributing zero —
which would read as "Demand is maximally risky" when the truth is "Demand is
unknown". `RunReport` carries the list of unscored factors so the UI can say so.

Verification against the workbook:

| Factor | Risk scores | avg | 100−4·avg | Sheet |
|---|---|---|---|---|
| Land | 25, 16, 9, 12 | 15.500 | 38.00 | 38.00 |
| Law | 25, 20, 16 | 20.333 | 18.67 | 18.67 |
| Finance | 25, 20, 16 | 20.333 | 18.67 | 18.67 |
| Materials | 25, 16, 16 | 19.000 | 24.00 | 24.00 |
| Demand | 25, 12, 12 | 16.333 | 34.67 | 34.67 |

Weighted total = 7.60 + 3.733 + 4.667 + 4.80 + 5.20 = **26.00**, matching the
Dashboard. The severity bands yield 7 critical and 8 high, also matching.

The `medium`/`low` cut at 6 is a chosen default — the dataset contains no row
below 9, so it is unconstrained by evidence. It is stated here so it is a
decision rather than an accident.

### Consequence: agents judge, code computes

Agents emit only judgments — likelihood, impact, evidence, a verbatim quote.
Every number in the UI is derived by shared pure functions. The workbook itself
works this way (`Risk Score` is the formula `=F2*G2`, not a typed value).

This kills two failure modes at once: an agent inventing a severity that
contradicts its own likelihood/impact, and the backend and frontend computing a
rollup differently. It also means `FindingDraft` (what an agent returns) and
`Finding` (what the wire carries) are two distinct schemas, related by a
widening function.

## Architecture

### Topology — three stages

1. **Extract** — one agent per source document. Reads it, emits `Claim`s: atomic
   typed facts, each with a citation.
2. **Analyze** — one agent per factor (5). Consumes the claims routed to its
   factor via the Evidence Map, emits `FindingDraft`s.
3. **Synthesize** — one agent. Sees all claims from all documents, emits
   `Conflict`s.

Stage 3 exists because no per-document and no per-factor agent can see
`$186M` in doc 07 and `$199-211M` in doc 06 at the same time. Cross-document
contradiction requires an agent whose context spans documents.

### Claim.field is the hinge

Conflict detection is only tractable because extractors normalise what they
found onto a shared key. Two claims carrying the same `field` with different
`value.number` are a conflict candidate; the synthesizer then judges whether the
difference is real and material.

`field` is typed as `string`, with an exported `COMPARABLE_FIELDS` constant
(`capex_usd_total`, `contracted_mw`, `assumed_mw`, `transformer_lead_weeks`,
`schedule_lead_weeks`, `water_demand_af`, `water_allocation_af`, …) that
extractor prompts must prefer when a value fits one. Open string rather than a
closed enum: an unanticipated extraction should degrade to "not comparable",
never to a schema rejection that discards the finding entirely.

### Package layout

npm workspaces at the repository root; `frontend/` is currently standalone and
gets absorbed.

```
package.json                    workspaces: ["shared", "frontend"]
shared/                         @solarhack/schema — the contract
  src/
    factors.ts                  Factor, FACTOR_WEIGHTS, EVIDENCE_MAP
    citation.ts                 Citation, Locator
    claim.ts                    Claim, COMPARABLE_FIELDS
    finding.ts                  FindingDraft, Finding, widenFinding
    conflict.ts                 Conflict
    agent.ts                    AgentState
    report.ts                   RunMeta, RunReport, emptyReport
    events.ts                   RunEvent
    scoring.ts                  pure math, no Zod
    reduce.ts                   reduceRunEvent(state, event) -> RunReport
    jsonschema.ts               z.toJSONSchema exports for structured output
  fixtures/
    solar-alpha.events.json     the workbook replayed as an event stream
    solar-alpha.report.json     the golden RunReport
frontend/src/lib/
  useRunStream.ts               EventSource + useReducer over reduceRunEvent
  mockRunStream.ts              replays the fixture with timing, no backend
```

Zod is the single source of truth. `z.infer` gives the frontend its types;
`z.toJSONSchema` gives the agent layer its structured-output contract. One
definition, two consumers, no codegen step to forget.

`reduce.ts` is imported by both the frontend hook and the server's
`GET /runs/:id` replay, so the REST snapshot cannot drift from the live stream.

## Entities

`Locator` — a discriminated union so the UI can deep-link into evidence:

```ts
| { kind: 'pdf_page';    page: number }
| { kind: 'sheet_cell';  sheet: string; cell: string }
| { kind: 'sheet_range'; sheet: string; range: string }
```

`Citation` — `{ docId, locator, quote }`, quote 1–600 chars, verbatim. A quote
that cannot be found in the source document is a hallucination the UI can
expose.

`Claim` — `{ id, docId, agentId, factor, subfactor?, field, value: { raw,
number?, unit? }, asOf?, citation }`.

`FindingDraft` (agent output) — `{ factor, subfactor, title, evidence,
likelihood: 1..5, impact: 1..5, owner, mitigation, citations: Citation[] (min 1),
claimIds: string[] }`.

`Finding` (wire) — `FindingDraft` plus code-derived `{ id: 'RF-001', riskScore,
severity }`.

`Conflict` — `{ id: 'CF-001', field, factors: Factor[], title, statement,
sides: [{ claimId, docId, value, citation }] (min 2), materiality:
'blocking' | 'material' | 'minor', impliedDelta?: { unit, from, to },
linkedFindingIds: string[] }`.

`FactorScore` — entirely derived: `{ factor, weight, riskCount, avgRiskScore,
maxRiskScore, criticalCount, highCount, readinessScore: number | null,
confidence: 'ok' | 'low' }`. `readinessScore` is `null` when `riskCount` is 0
(see Failure handling); `confidence` is `'low'` when the factor's evidence is
incomplete because an extractor was skipped or failed.

`AgentState` — `{ id, stage: 'extract' | 'analyze' | 'synthesize', label, docId?,
factor?, status: 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped',
startedAt?, finishedAt?, error?, stats? }`.

`RunReport` — `{ meta, status: 'queued' | 'running' | 'succeeded' | 'partial' |
'failed', agents, documents, claims, findings, conflicts, scores,
overallReadiness: number | null, unscoredFactors: Factor[],
counts: { critical, high, medium, low }, startedAt, finishedAt?,
errors: { agentId, message, at }[] }`.

## Wire protocol

Server-Sent Events. Every event carries a **complete entity**, never a fragment,
so no schema needs a partial variant and the reducer never merges half-objects.

```ts
type RunEvent = { seq: number; ts: string } & (
  | { type: 'run.started';    run: RunMeta }
  | { type: 'agent.updated';  agent: AgentState }
  | { type: 'claim.found';    claim: Claim }
  | { type: 'finding.found';  finding: Finding }
  | { type: 'conflict.found'; conflict: Conflict }
  | { type: 'scores.updated'; scores: FactorScore[]; overallReadiness: number }
  | { type: 'run.finished';   status: 'succeeded' | 'partial' | 'failed' }
)
```

`seq` provides ordering and `Last-Event-ID` resume. `agent.updated` carries the
whole `AgentState`, so it serves as started, progressed, and finished.

Rejected alternatives: full-snapshot-per-tick (payload regrows quadratically and
loses "what changed", so no entrance animations or toasts) and JSON Patch
(untyped string paths that Zod validates only after application, making a bad
path a silent state corruption).

## Failure handling

Partial results are the normal case, not an edge case.

- **Agent fails** — `agent.updated` with `status: 'failed'` and an error string.
  The run continues. Final run status is `partial`.
- **Document 05 missing** — its extractor reports `skipped`. The Demand analyst
  scores from whatever claims exist and its `FactorScore` is flagged
  low-confidence. A skipped extractor never blocks the rollup.
- **Malformed event** — the frontend validates every message with Zod, logs and
  drops the ones that fail, and keeps rendering. A single bad event must not
  blank the dashboard.
- **Factor with zero findings** — `readinessScore` is `null`, not 100 and not 0.
  Absence of evidence is neither readiness nor risk. The factor is listed in
  `unscoredFactors` and its weight is renormalised out of `overallReadiness`.

## Testing

Test-driven, vitest in `shared/`. The workbook supplies the golden expectations,
which makes these real assertions rather than change-detectors.

1. **Scoring** — fed the 16 real Risk Register rows, `scoring.ts` reproduces the
   Dashboard exactly: per-factor readiness `38 / 18.67 / 18.67 / 24 / 34.67`,
   overall `26.00`, counts `7 critical / 8 high / 1 medium`.
2. **Severity bands** — every one of the 16 rows maps to the severity the
   workbook assigns it.
3. **Reducer** — replaying `solar-alpha.events.json` through `reduceRunEvent`
   yields `solar-alpha.report.json` byte-for-byte.
4. **Reducer robustness** — out-of-order `seq`, a duplicated event, and a
   malformed event each leave the report in the correct state.
5. **Round-trip** — every fixture entity parses against its Zod schema, and
   every `z.toJSONSchema` export is valid JSON Schema 2020-12.
6. **Renormalisation** — dropping Demand's findings leaves the other four
   factors' readiness unchanged and yields
   `(7.60 + 3.733 + 4.667 + 4.80) ÷ 0.85 = 24.47`, with `unscoredFactors:
   ['demand']`. Asserts a missing document does not masquerade as risk.

Floating-point comparisons use a tolerance; the workbook itself stores
`26.000000000000004`.

## Scope

**In:** the `shared/` schema package, derived-math helpers, the reducer, JSON
Schema exports, fixtures, and typed frontend consumption (`useRunStream`,
`mockRunStream`).

**Out:** the agent implementations, the backend server, document parsing, and
the dashboard UI. Each is unblocked by this contract and specified separately.
