"""Red Flag agent backend — FastAPI surface. The Next.js dashboard calls these
endpoints; the agent pipeline runs as a background task and streams status."""
from __future__ import annotations

import asyncio
import json
import re
import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .agents.base import Agent
from .agents.roles import ANALYST, ROLE_TOOLS
from .pipeline import run_pipeline
from .schemas import ChatAnswer, Report
from .tools import DOC_DIR

app = FastAPI(title="Red Flag Agent Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

STORE = Path(__file__).resolve().parent / "reports"
STORE.mkdir(exist_ok=True)
JOB_QUEUES: dict[str, asyncio.Queue] = {}
# Finished chat answers, keyed by the ask's own job id. In memory because an
# answer is only meaningful while the asking tab is open.
ANSWERS: dict[str, ChatAnswer] = {}


class AnalyzeRequest(BaseModel):
    name: str
    location: str
    docs: list[str]


class AskRequest(BaseModel):
    question: str


ALLOWED_UPLOAD = re.compile(r"\.(pdf|xlsx|csv|docx|txt)$", re.IGNORECASE)


@app.post("/api/uploads")
async def uploads(files: list[UploadFile] = File(...)):
    """Receive the actual dossier files (multipart). Saved into the document
    directory the extractors read, so a subsequent /analyze with the returned
    filenames processes the real uploaded bytes."""
    saved = []
    for f in files:
        name = Path(f.filename or "").name  # strip any client-supplied path
        if not name or not ALLOWED_UPLOAD.search(name):
            continue
        (DOC_DIR / name).write_bytes(await f.read())
        saved.append(name)
    return {"files": saved}


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
            (STORE / f"{job_id}.json").write_text(report.model_dump_json(indent=2), encoding="utf-8")
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
    return json.loads((STORE / f"{job_id}.json").read_text(encoding="utf-8"))


@app.post("/api/reports/{report_id}/ask")
async def ask(report_id: str, req: AskRequest):
    """Ask a question about a finished report.

    Returns its own job id immediately and narrates on the existing
    /api/jobs/{id}/stream endpoint, so the Ask rail reuses the transport the
    scan already uses rather than introducing a second streaming shape.
    """
    path = STORE / f"{report_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"unknown report {report_id}")

    report = Report.model_validate_json(path.read_text(encoding="utf-8"))

    ask_id = uuid.uuid4().hex[:12]
    queue: asyncio.Queue = asyncio.Queue()
    JOB_QUEUES[ask_id] = queue

    async def work():
        def status(msg: str):
            queue.put_nowait(msg)
        try:
            # kb_lookup only — the analyst answers from the finished report,
            # so there is nothing to execute and no sandbox in this path.
            answer = await Agent(
                "Analyst", ANALYST, ChatAnswer, ROLE_TOOLS["analyst"], status
            ).run(req.question, {"report": report.model_dump()})
            ANSWERS[ask_id] = answer
            queue.put_nowait("__DONE__")
        except Exception as e:
            queue.put_nowait(f"__ERROR__ {e}")

    asyncio.create_task(work())
    return {"jobId": ask_id}


@app.get("/api/asks/{ask_id}")
async def get_answer(ask_id: str):
    if ask_id not in ANSWERS:
        raise HTTPException(status_code=404, detail=f"no answer for {ask_id}")
    return ANSWERS[ask_id].model_dump()


@app.get("/api/projects")
async def portfolio():
    """Portfolio dashboard: every completed report, worst first."""
    reports = [Report.model_validate_json(p.read_text(encoding="utf-8")) for p in STORE.glob("*.json")]
    reports.sort(key=lambda r: r.readiness)
    return [
        {"project": r.project, "location": r.location, "readiness": r.readiness,
         "decision": r.decision, "dimensions": [d.model_dump() for d in r.dimensions]}
        for r in reports
    ]
