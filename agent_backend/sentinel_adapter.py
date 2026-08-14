"""Adapter: Red Flag agent Report -> Solar Sentinel frontend contract.

The Solar Sentinel frontend (frontend/src/lib/types.ts) consumes
Project / PillarScore / Factor / Evidence / PriorityAction shapes.
This module converts the agent pipeline's Report into those shapes so the
frontend can swap mock data for live agent output without touching the UI.

Mapping notes:
- Pillars are the five risk factors (Land, Law, Finance, Materials, Demand).
  Agent components map onto them via COMPONENT_TO_PILLAR below.
- band:  >=70 strong | 40-69 watch | <40 risk (matches RAG thresholds).
- Cross-document contradictions become Evidence entries of kind
  "contradiction" with the two claims as sources.
"""
from __future__ import annotations

from .schemas import Report

COMPONENT_TO_PILLAR = {
    "land": "Land", "zoning": "Land", "permitting": "Land", "community": "Land",
    "land_use": "Land", "resource": "Land", "resource_supply_chain": "Land",
    "state_law": "Law", "federal_law": "Law", "law": "Law", "ecology_epa": "Law",
    "ecology": "Law", "epa": "Law",
    "financials": "Finance", "finance": "Finance",
    "materials": "Materials", "supply_chain": "Materials",
    "demand": "Demand", "buyers": "Demand", "grid_integration": "Demand",
    "grid": "Demand", "interconnection": "Demand",
}

PILLARS = ["Land", "Law", "Finance", "Materials", "Demand"]


def band(score: float) -> str:
    return "strong" if score >= 70 else "watch" if score >= 40 else "risk"


def status(decision: str) -> str:
    d = decision.lower()
    if "proceed" in d:
        return "on-track"
    if "investigate" in d:
        return "needs-review"
    return "at-risk"


def _pillar_for(component: str) -> str:
    return COMPONENT_TO_PILLAR.get(component.lower().replace(" ", "_").replace("/", "_"), "Land")


def to_sentinel(report: Report, project_id: str, lat: float | None = None, lon: float | None = None,
                capacity_mw: float | None = None) -> dict:
    """Convert a Red Flag Report into the Solar Sentinel ProjectDetail shape."""
    dims = {d.name: d for d in report.dimensions}
    evidence: dict[str, dict] = {}
    pillars = []

    for name in PILLARS:
        dim = dims.get(name)
        score = dim.score if dim else 0.0
        factors = []

        # dimension flags -> factors
        for i, text in enumerate(dim.flags if dim else []):
            factors.append({
                "id": f"{name.lower()}-flag-{i}",
                "name": text[:90],
                "band": band(score),
                "statusLabel": "Cleared" if score >= 70 else "Watch" if score >= 40 else "Flagged",
                "evidence": text,
                "sources": [],
            })

        # report red flags routed to this pillar -> factors + evidence
        for rf in report.red_flags:
            if _pillar_for(rf.component) != name:
                continue
            ev_id = f"ev-{name.lower()}-{len(evidence)}"
            factors.append({
                "id": ev_id,
                "name": rf.title[:90],
                "band": "risk" if rf.severity in ("critical", "high") else "watch",
                "statusLabel": "Flagged" if rf.severity in ("critical", "high") else "Watch",
                "evidence": rf.evidence,
                "sources": rf.sources,
                "evidenceId": ev_id,
            })
            evidence[ev_id] = {
                "id": ev_id,
                "factorName": rf.title[:90],
                "kind": "single",
                "summary": rf.evidence,
                "confidence": "High confidence" if rf.benchmark else "Medium confidence",
                "sources": [{"title": s, "location": "", "highlight": rf.evidence,
                             "extractedLabel": rf.component, "extractedValue": rf.benchmark or ""}
                            for s in rf.sources],
            }

        pillars.append({
            "name": name,
            "score": score,
            "band": band(score),
            "unlocked": score >= 70,
            "subAgents": [],
            "factors": factors,
        })

    # contradictions -> evidence entries of kind "contradiction"
    for i, c in enumerate(report.contradictions):
        ev_id = f"ev-contradiction-{i}"
        evidence[ev_id] = {
            "id": ev_id,
            "factorName": "Cross-document contradiction",
            "kind": "contradiction",
            "summary": c.explanation,
            "confidence": "High confidence" if c.severity in ("critical", "high") else "Needs review",
            "sources": [{"title": s, "location": "", "highlight": claim,
                         "extractedLabel": "claim", "extractedValue": claim}
                        for s, claim in zip(c.sources, c.claims)],
            "comparison": {"dimension": c.explanation[:60],
                           "rows": [{"label": src, "a": claim, "b": ""}
                                    for src, claim in zip(c.sources, c.claims)]},
        }

    priority_actions = [
        {"id": f"pa-{i}", "rank": i + 1, "title": cp[:90], "detail": cp,
         "impact": "high", "scoreDelta": 0}
        for i, cp in enumerate(report.action_pack.conditions_precedent)
    ] + [
        {"id": f"pa-r{i}", "rank": len(report.action_pack.conditions_precedent) + i + 1,
         "title": rfi[:90], "detail": rfi, "impact": "medium", "scoreDelta": 0}
        for i, rfi in enumerate(report.action_pack.rfis)
    ]

    project = {
        "id": project_id,
        "name": report.project,
        "location": report.location,
        "capacityMW": capacity_mw or 0,
        "latitude": lat or 0,
        "longitude": lon or 0,
        "activationScore": report.readiness,
        "band": band(report.readiness),
        "scoreReason": report.recommended_next_action or "",
        "status": status(report.decision),
        "pillars": pillars,
    }

    return {
        "project": project,
        "evidence": evidence,
        "timeline": [],
        "documents": [],
        "priorityActions": priority_actions,
        "projectedScoreAfterMitigation": report.readiness,
        "suggestedQuestions": [],
        "chatHistory": [],
    }


if __name__ == "__main__":
    """Generate Sentinel-shaped sample JSON from the stored agent reports."""
    import json
    from pathlib import Path
    from .schemas import Report as _Report

    here = Path(__file__).resolve().parent
    out_dir = here / "sentinel-samples"
    out_dir.mkdir(exist_ok=True)
    meta = {
        "parcel-a-boulder-city.json": ("parcel-a", 35.9056, -114.9345, 180),
        "parcel-b-sloan-canyon.json": ("parcel-b", 35.9167, -115.1260, 180),
    }
    for f in sorted((here / "reports").glob("*.json")):
        pid, lat, lon, mw = meta.get(f.name, (f.stem, 0, 0, 0))
        sentinel = to_sentinel(_Report.model_validate_json(f.read_text(encoding="utf-8")),
                               pid, lat, lon, mw)
        out = out_dir / f.name.replace(".json", ".sentinel.json")
        out.write_text(json.dumps(sentinel, indent=2), encoding="utf-8")
        print(f"wrote {out.name}: score {sentinel['project']['activationScore']}, "
              f"{len(sentinel['project']['pillars'])} pillars, {len(sentinel['evidence'])} evidence")
