# solarhack

**Solar Sentinel** — an AI due-diligence copilot for utility-scale solar projects.
The repo has two halves:

- **`frontend/`** — the Solar Sentinel dashboard (Next.js 16 + TypeScript). All
  agent integration lives here in TypeScript; no Python required to build the UI.
- **`agent_backend/`** — the Red Flag agent runtime that produces diligence
  reports (`AgentReport` JSON) inside Daytona sandboxes. Only agent-backend devs
  need to touch it.


  Watch the live demo link: https://youtube.com/shorts/5sNu0m1ZihU?is=LPyxD7nvZHxxeQ-q

---

## For frontend devs — the integration layer (TypeScript)

`frontend/src/lib/agent/` is the contract between the agent framework and the UI:

```ts
import { toSentinel } from "@/lib/agent";

const detail = toSentinel(agentReportJson, {
  id: "parcel-a",
  latitude: 35.9056,
  longitude: -114.9345,
  capacityMW: 180,
});
// detail is a complete ProjectDetail (src/lib/types.ts) — swap directly for mockData entries.
```

| File | What it is |
|---|---|
| `frontend/src/lib/agent/report.ts` | `AgentReport` — the agent output contract (TypeScript) |
| `frontend/src/lib/agent/adapter.ts` | `toSentinel()` — converts an `AgentReport` into a full `ProjectDetail` (pillars, factors, evidence incl. contradiction tables, timeline, documents, priority actions, suggested questions) |
| `frontend/src/lib/agent/index.ts` | public exports |
| `agent_backend/sentinel-samples/*.sentinel.json` | ready-made `ProjectDetail` fixtures for 3 projects — import and render immediately |

**Sample projects:** Solar Alpha 26 · risk · at-risk (Solano County CA) · Parcel B
38 · risk (Sloan Canyon NCA) · Parcel A 75 · strong (Boulder City NV).

**Pillar mapping** (agent components → Sentinel pillars): land / zoning /
permitting / community / resource → **Land** · state & federal law, ecology/EPA →
**Law** · financials → **Finance** · materials / supply chain → **Materials** ·
demand / buyers / grid / interconnection → **Demand**.
**Bands:** ≥70 strong · 40–69 watch · <40 risk.

---

## Before you push — every dev (and your local agents)

```bash
node scripts/check-all.mjs        # full local gate; --quick skips python steps
```

Green locally = green in CI. Runs: Sentinel fixture freshness, frontend-schema
conformance, TS/Python adapter parity, plus advisories for contract-surface edits
and overlap with other branches. (Agent-schema validation runs when
python/pydantic is available; it skips gracefully otherwise — CI enforces it.)

| Script | What it checks |
|---|---|
| `scripts/check-all.mjs` | everything below, one command |
| `scripts/validate-sentinel.mjs` | any `*.sentinel.json` conforms to `frontend/src/lib/types.ts` (zero-dep) |
| `scripts/test-adapter-parity.mjs` | the TS adapter and its Python twin produce identical output (zero-dep) |

**In CI (every PR):** frontend lint + `next build` · agent report schema
validation · Sentinel freshness + conformance + adapter parity. A **toe-guard
bot** comments on your PR when your files overlap other open PRs or touch
contract surfaces (`types.ts`, `mockData.ts`, adapters, fixtures, `research/`).

---

## Agent backend (Python runtime — for agent devs)

The Red Flag agent pipeline turns an uploaded location + diligence dossiers into
a scored `AgentReport`. It runs inside **Daytona sandboxes**; untrusted document
parsing and generated code execute in a nested sandbox.

**Pipeline:** Orchestrator → Doc Extractors (parallel) → Gap Analyzer → Data
Scouts (agents research and pull missing data from public sources; blind mode
works from coordinates alone) → Component Researchers (parallel) →
Cross-Examiner (finds contradictions BETWEEN documents) → Scorer → Liaison →
typed `AgentReport` JSON.

```bash
pip install -r agent_backend/requirements.txt
export LLM_API_KEY=...            # OpenAI-compatible; LLM_MODEL/LLM_BASE_URL optional
export TAVILY_API_KEY=...         # optional — falls back to KB-only research
export DAYTONA_API_KEY=...        # optional — nested sandbox for untrusted code
uvicorn agent_backend.main:app    # POST /api/projects/analyze · SSE job stream · portfolio
```

| Path | What it is |
|---|---|
| `agent_backend/agents/` | the shared agent loop + role prompts |
| `agent_backend/pipeline.py` | orchestration, parallel fan-out, feedback loop |
| `agent_backend/schemas.py` | typed contracts between agents (pydantic) |
| `agent_backend/sentinel_adapter.py` | Python twin of the TS adapter (generates fixtures; parity-locked in CI) |
| `agent_backend/reports/` | sample `AgentReport` outputs |
| `research/` | compiled diligence knowledge base the agents ground on |
| `project-docs/` | sample dossiers (Solar Alpha full package + Nevada screening memos) |
| `docs/agent-framework.md` | full architecture doc |

If you edit `agent_backend/reports/**`, regenerate fixtures before pushing:
`python -m agent_backend.sentinel_adapter` (CI blocks stale fixtures).
