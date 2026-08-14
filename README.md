# solarhack

## Agent backend — `agent_backend/` (Red Flag agentic framework)

Python (FastAPI) agent pipeline that turns an uploaded project location + due-diligence
dossiers into a scored Red Flag report. Built to run inside **Daytona sandboxes** —
the whole service runs in a sandbox, and untrusted doc-parsing / generated code
executes in a nested sandbox via the Daytona SDK (`DAYTONA_API_KEY`).

**Pipeline:** Orchestrator → Doc Extractors (parallel) → **Gap Analyzer → Data Scouts**
(thin-dossier mode: agents research and pull missing data from public sources; blind
mode works from coordinates alone) → Component Researchers (parallel) →
**Cross-Examiner** (finds contradictions BETWEEN documents) → Scorer → Liaison
(RFIs, agency actions, conditions precedent) → typed Report JSON.

### Layout
| Path | What it is |
|---|---|
| `agent_backend/agents/base.py` | the shared agent loop (plan → tool → observe → validate contract) |
| `agent_backend/agents/roles.py` | role prompts + tool whitelists per agent |
| `agent_backend/pipeline.py` | orchestration, parallel fan-out, feedback loop |
| `agent_backend/schemas.py` | typed contracts between agents (pydantic) |
| `agent_backend/tools.py` | pdf/xlsx extract, KB lookup, web search/fetch, `sandbox_run` (Daytona) |
| `agent_backend/main.py` | FastAPI: `POST /api/projects/analyze`, SSE job stream, reports, portfolio |
| `agent_backend/sentinel_adapter.py` | converts agent `Report` → Solar Sentinel `ProjectDetail` shape (`frontend/src/lib/types.ts`) |
| `agent_backend/reports/` | sample agent outputs (Parcel A viable 75, Parcel B no-go 38) |
| `agent_backend/sentinel-samples/` | the same reports in the frontend's contract — drop-in for `mockData` |
| `research/` | compiled diligence knowledge base the agents ground on (KB) |
| `project-docs/` | sample dossiers (Solar Alpha full package + Nevada screening memos) |
| `docs/agent-framework.md` | full architecture doc |

### Run (in a Daytona sandbox or locally)
```bash
pip install -r agent_backend/requirements.txt
export LLM_API_KEY=...            # OpenAI-compatible; LLM_MODEL/LLM_BASE_URL optional
export TAVILY_API_KEY=...         # optional — falls back to KB-only research
export DAYTONA_API_KEY=...        # optional — nested sandbox for untrusted code
uvicorn agent_backend.main:app
```

### For Kiran — frontend hookup
The frontend consumes `ProjectDetail` (`frontend/src/lib/types.ts`). To swap mock
data for live agent output:
1. **TypeScript (in-repo, no Python needed):** `frontend/src/lib/agent/` —
   ```ts
   import { toSentinel } from "@/lib/agent";
   const detail = toSentinel(agentReportJson, { id: "parcel-a", latitude: 35.9056, longitude: -114.9345, capacityMW: 180 });
   ```
   `toSentinel` converts the agent `AgentReport` (see `frontend/src/lib/agent/report.ts`)
   into a complete `ProjectDetail` — pillars, evidence, contradictions, timeline,
   priority actions. Parity-tested against the Python twin (`scripts/test-adapter-parity.mjs`).
2. `GET /api/projects` → portfolio rows (worst-first), or
3. run `python -m agent_backend.sentinel_adapter` to regenerate
   `agent_backend/sentinel-samples/*.sentinel.json` from any stored agent report, or
4. call `to_sentinel(report, project_id, lat, lon, capacity_mw)` in the backend and
   serve it directly (e.g. `GET /api/projects/:id/sentinel`).

Pillar mapping (agent components → Sentinel pillars): land/zoning/permitting/community/resource
→ **Land** · state/federal law, ecology/EPA → **Law** · financials → **Finance** ·
materials/supply chain → **Materials** · demand/buyers/grid/interconnection → **Demand**.
Band thresholds: ≥70 strong · 40–69 watch · <40 risk.

### Before you push — for every dev (and your local agents)
```bash
node scripts/check-all.mjs        # full local gate; --quick skips python steps
```
Green locally = green in CI. It runs: agent report schema validation, Sentinel
fixture freshness, frontend-schema conformance, TS/Python adapter parity, plus
advisories for contract-surface edits and overlap with other branches. Python
steps skip gracefully if python/pydantic isn't installed — CI still enforces them.
PRs additionally get a **toe-guard bot comment** when your files overlap other
open PRs or touch contract surfaces.
