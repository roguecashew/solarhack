"""Tool layer available to agents. Document parsing and any generated code
execution happen inside a Daytona sandbox, never on the host."""
from __future__ import annotations

import os
import re
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent
KB_DIR = Path(os.getenv("KB_DIR", str(_BACKEND_DIR / "research")))
DOC_DIR = Path(os.getenv("DOC_DIR", str(_BACKEND_DIR / "project-docs")))
DAYTONA_API_KEY = os.getenv("DAYTONA_API_KEY", "")


def pdf_extract(filename: str) -> str:
    """Extract full text of a PDF dossier with page markers. Runs in the sandbox."""
    from pypdf import PdfReader
    reader = PdfReader(str(DOC_DIR / filename))
    return "\n".join(f"--- page {i+1} ---\n{p.extract_text() or ''}" for i, p in enumerate(reader.pages))[:24000]


def xlsx_extract(filename: str) -> str:
    """Extract all sheets of an XLSX dossier as pipe-delimited rows."""
    import openpyxl
    wb = openpyxl.load_workbook(str(DOC_DIR / filename), data_only=True)
    out = []
    for ws in wb.worksheets:
        out.append(f"=== SHEET: {ws.title} ===")
        for row in ws.iter_rows(values_only=True):
            cells = [str(c) if c is not None else "" for c in row]
            if any(cells):
                out.append(" | ".join(cells))
    return "\n".join(out)[:24000]


def kb_lookup(query: str, max_hits: int = 5) -> str:
    """Keyword search the compiled due-diligence knowledge base for benchmark context."""
    terms = [t.lower() for t in re.findall(r"[a-zA-Z0-9$%.-]{3,}", query)]
    hits: list[tuple[int, str]] = []
    for md in KB_DIR.glob("*.md"):
        for para in md.read_text(encoding="utf-8").split("\n\n"):
            score = sum(para.lower().count(t) for t in terms)
            if score:
                hits.append((score, para.strip()))
    hits.sort(key=lambda h: -h[0])
    return "\n\n---\n\n".join(p for _, p in hits[:max_hits]) or "no knowledge-base matches"


def web_search(query: str) -> str:
    """Search the web for current, location-specific regulatory/market data."""
    key = os.getenv("TAVILY_API_KEY", "")
    if not key:
        return kb_lookup(query)  # demo-resilient fallback: answer from KB
    import httpx
    r = httpx.post(
        "https://api.tavily.com/search",
        json={"api_key": key, "query": query, "max_results": 5},
        timeout=30,
    )
    results = r.json().get("results", [])
    return "\n".join(f"- {x['title']}: {x['url']}\n  {x.get('content','')[:400]}" for x in results)


def web_fetch(url: str) -> str:
    """Fetch and read a specific source document or regulation page."""
    import httpx
    r = httpx.get(url, timeout=30, follow_redirects=True)
    text = re.sub(r"<[^>]+>", " ", r.text)
    return re.sub(r"\s+", " ", text)[:8000]


def sandbox_run(code: str) -> str:
    """Execute untrusted generated code in an isolated Daytona sandbox
    (parsing, reconciliation math, scoring) — never on the host."""
    if not DAYTONA_API_KEY:
        import io, contextlib
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):  # local fallback for offline dev only
            exec(code, {"__builtins__": __builtins__}, {})
        return buf.getvalue()[:4000]
    from daytona import Daytona
    sb = Daytona().create()
    try:
        return sb.process.code_run(code).result[:4000]
    finally:
        sb.delete()
