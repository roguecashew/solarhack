"""Pipeline: orchestrator -> parallel doc extraction + parallel research ->
cross-examination (with one feedback re-entry) -> scoring -> liaison -> report."""
from __future__ import annotations

import asyncio
from collections.abc import Callable

from .agents.base import Agent, AgentDidNotConverge
from .agents.roles import (
    ORCHESTRATOR, DOC_EXTRACTOR, GAP_ANALYZER, DATA_SCOUT, RESEARCHER,
    CROSS_EXAMINER, SCORER, LIAISON, ROLE_TOOLS,
)
from .schemas import (
    AcquiredData, ActionPack, ContradictionSet, FactSet, Findings, GapAnalysis,
    ProjectProfile, Report, Score,
)

StatusFn = Callable[[str], None]


def _agent(name: str, prompt: str, contract, role: str, on_status: StatusFn) -> Agent:
    return Agent(name, prompt, contract, ROLE_TOOLS.get(role, {}), on_status)


async def run_pipeline(
    project_name: str,
    location: str,
    docs: list[str],
    on_status: StatusFn = print,
) -> Report:
    # 1. Orchestrate: build the project profile + diligence plan
    profile: ProjectProfile = await _agent(
        "Orchestrator", ORCHESTRATOR, ProjectProfile, "orchestrator", on_status
    ).run(
        "Build the diligence plan for this project.",
        {"request": {"name": project_name, "location": location, "documents": docs}},
    )

    # 2. Extract: one extractor per doc, parallel — then gap analysis needs the facts
    fact_sets: list[FactSet] = list(await asyncio.gather(*[
        _agent(f"Extractor:{d}", DOC_EXTRACTOR, FactSet, "doc_extractor", on_status).run(
            f"Extract all structured facts from '{d}' ({'PDF' if d.endswith('.pdf') else 'XLSX'}).",
            {"project": profile.model_dump()},
        )
        for d in docs
    ]))
    # 2b. Gap analysis: what does a full diligence package need that the docs lack?
    gap: GapAnalysis = await _agent(
        "GapAnalyzer", GAP_ANALYZER, GapAnalysis, "gap_analyzer", on_status
    ).run(
        "Compare the extracted facts against full diligence data requirements. List every missing data need.",
        {"project": profile.model_dump(), "facts": [f.model_dump() for f in fact_sets]},
    )

    # 2c. Data acquisition: one scout per need, pulling real data from public sources
    on_status(f"[pipeline] {len(gap.needs)} data gaps found — dispatching data scouts")
    acquired: list[AcquiredData] = list(await asyncio.gather(*[
        _agent(f"DataScout:{n.component}", DATA_SCOUT, AcquiredData, "data_scout", on_status).run(
            f"Acquire this missing diligence data: {n.missing}\nWhy it matters: {n.why_it_matters}",
            {"project": profile.model_dump(), "source_hint": n.source_hint},
        )
        for n in gap.needs[:12]  # cap parallel scouts
    ]))
    acquired_ctx = [a.model_dump() for a in acquired]

    researchers = [
        _agent(f"Researcher:{c}", RESEARCHER, Findings, "researcher", on_status).run(
            f"Research the '{c}' component for this project and flag benchmark violations. "
            "Acquired data from scouts is included in context — use it.",
            {"project": profile.model_dump(), "acquired": acquired_ctx},
        )
        for c in (profile.components or ["financials"])
    ]
    findings = await asyncio.gather(*researchers)

    # 3. Cross-examine (with a single research feedback loop)
    contradictions: ContradictionSet = await _agent(
        "CrossExaminer", CROSS_EXAMINER, ContradictionSet, "cross_examiner", on_status
    ).run(
        "Cross-examine all extracted facts against each other and against research findings.",
        {
            "facts": [f.model_dump() for f in fact_sets],
            "findings": [f.model_dump() for f in findings],
            "acquired": acquired_ctx,
        },
    )
    if contradictions.needs_more_research:
        followups = await asyncio.gather(*[
            _agent(f"Researcher:{r.component}:followup", RESEARCHER, Findings, "researcher", on_status).run(
                f"Follow-up question: {r.question}",
                {"project": profile.model_dump(), "component": r.component},
            )
            for r in contradictions.needs_more_research[:3]
        ])
        findings = list(findings) + list(followups)

    # 4. Score
    score: Score = await _agent("Scorer", SCORER, Score, "scorer", on_status).run(
        "Score the project and issue a decision.",
        {
            "project": profile.model_dump(),
            "contradictions": contradictions.model_dump(),
            "findings": [f.model_dump() for f in findings],
        },
    )

    # 5. Liaison artifacts
    actions: ActionPack = await _agent("Liaison", LIAISON, ActionPack, "liaison", on_status).run(
        "Produce the liaison action pack for the deal team.",
        {
            "project": profile.model_dump(),
            "contradictions": contradictions.model_dump(),
            "gaps": [g for f in fact_sets for g in f.gaps] + contradictions.coverage_gaps,
            "score": score.model_dump(),
        },
    )

    # 6. Compose report
    all_flags = [flag for f in findings for flag in f.red_flags]
    return Report(
        project=profile.name,
        location=f"{profile.county} County, {profile.state}",
        readiness=score.readiness,
        decision=score.decision,
        dimensions=score.dimensions,
        red_flags=all_flags,
        contradictions=contradictions.contradictions,
        missing_info=[g for f in fact_sets for g in f.gaps] + contradictions.coverage_gaps,
        action_pack=actions,
        recommended_next_action=score.top_risks[0] if score.top_risks else None,
        acquired_data=acquired,
    )
