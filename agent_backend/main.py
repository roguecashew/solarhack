"""Red Flag agent backend — FastAPI surface. The Next.js dashboard calls these
endpoints; the agent pipeline runs as a background task and streams status."""
from __future__ import annotations

import asyncio
import json
import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .pipeline import run_pipeline
from .schemas import Report

app = FastAPI(title="Red Flag Agent Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

STORE = Path("reports")
STORE.mkdir(exist_ok=True)
JOB_QUEUES: dict[str, asyncio.Queue] = {}


class AnalyzeRequest(BaseModel):
    name: str
    location: str
    docs: list[str]


@app.post("/api/projects/analyze")
async def analyze(req: AnalyzeRequest):
    job_id = uuid.uuid4().hex[:12]
    queue: asyncio.Queue = asyncio.Queue()
    JOB_QUEUES[job_id] = queue

    async def work():
        def status(msg: str):
            queue.put_nowait(msg)
        try:
            report = await run_pipeline(req.name, req.location, req.docs, on_status=status)
            (STORE / f"{job_id}.json").write_text(report.model_dump_json(indent=2))
            queue.put_nowait("__DONE__")
        except Exception as e:
            queue.put_nowait(f"__ERROR__ {e}")

    asyncio.create_task(work())
    return {"jobId": job_id}


@app.get("/api/jobs/{job_id}/stream")
async def stream(job_id: str):
    """SSE feed of agent activity — powers the demo's live 'agents working' narration."""
    async def events():
        queue = JOB_QUEUES[job_id]
        while True:
            msg = await queue.get()
            yield f"data: {json.dumps({'status': msg})}\n\n"
            if msg.startswith("__DONE__") or msg.startswith("__ERROR__"):
                break
    return StreamingResponse(events(), media_type="text/event-stream")


@app.get("/api/reports/{job_id}")
async def get_report(job_id: str):
    return json.loads((STORE / f"{job_id}.json").read_text())


@app.get("/api/projects")
async def portfolio():
    """Portfolio dashboard: every completed report, worst first."""
    reports = [Report.model_validate_json(p.read_text()) for p in STORE.glob("*.json")]
    reports.sort(key=lambda r: r.readiness)
    return [
        {"project": r.project, "location": r.location, "readiness": r.readiness,
         "decision": r.decision, "dimensions": [d.model_dump() for d in r.dimensions]}
        for r in reports
    ]
