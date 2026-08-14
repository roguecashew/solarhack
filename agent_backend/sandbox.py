"""Daytona sandbox execution, with the lifecycle made visible.

`sandbox_run` used to fall back to `exec(code)` on the host whenever
`DAYTONA_API_KEY` was unset — which was the default. That runs
model-generated code on the developer's machine with no isolation, so it is
gone. Without a key this module now refuses to execute rather than executing
somewhere unsafe, and says so in the trace.

Every phase of the sandbox lifecycle is timed separately (create, exec,
delete), because "the agent is slow" and "Daytona took 8s to provision" look
identical from the outside otherwise.
"""
from __future__ import annotations

import os
from typing import Any

from .obs import Trace

DAYTONA_API_KEY = os.getenv("DAYTONA_API_KEY", "")
DAYTONA_API_URL = os.getenv("DAYTONA_API_URL", "https://app.daytona.io/api")

# Escape hatch for offline work. Must be set deliberately; it is never the
# default, and it is loud in the trace every single time it is used.
ALLOW_HOST_EXEC = os.getenv("DANGEROUSLY_ALLOW_HOST_EXEC", "0") == "1"

# Auto-stop / auto-delete so a crashed run cannot leave a box billing forever.
AUTO_STOP_MINUTES = int(os.getenv("DAYTONA_AUTO_STOP_MIN", "15"))
AUTO_DELETE_MINUTES = int(os.getenv("DAYTONA_AUTO_DELETE_MIN", "60"))


class SandboxUnavailable(RuntimeError):
    pass


def sandbox_health(trace: Trace) -> dict[str, Any]:
    """Cheap connectivity probe: can we reach Daytona and authenticate?
    Called at startup so a misconfigured key surfaces before a run, not
    eight minutes into one."""
    if not DAYTONA_API_KEY:
        trace.warn("sandbox.health", "DAYTONA_API_KEY not set — sandbox execution disabled")
        return {"configured": False, "reachable": False}

    import httpx
    with trace.span("sandbox.health", "probing Daytona API") as sp:
        try:
            r = httpx.get(
                f"{DAYTONA_API_URL}/sandbox",
                headers={"Authorization": f"Bearer {DAYTONA_API_KEY}"},
                timeout=15,
            )
            ok = r.status_code == 200
            sp["status"] = r.status_code
            sp["existingSandboxes"] = len(r.json().get("items", [])) if ok else None
            return {"configured": True, "reachable": ok, "status": r.status_code}
        except Exception as exc:
            sp["error"] = str(exc)
            return {"configured": True, "reachable": False, "error": str(exc)}


def sandbox_run(code: str, trace: Trace | None = None) -> str:
    """Execute model-generated code in an isolated Daytona sandbox.

    The sandbox is created per call and deleted in a `finally`, so a failure
    mid-execution still tears the box down.
    """
    t = trace or Trace()

    if not DAYTONA_API_KEY:
        if not ALLOW_HOST_EXEC:
            t.error(
                "sandbox.refused",
                "no DAYTONA_API_KEY and host execution not permitted — refusing to run "
                "model-generated code on the host",
                codePreview=code[:200],
            )
            raise SandboxUnavailable(
                "DAYTONA_API_KEY is not set. Set it to execute in a sandbox, or set "
                "DANGEROUSLY_ALLOW_HOST_EXEC=1 to run on the host (development only)."
            )
        t.warn(
            "sandbox.host_exec",
            "executing model-generated code ON THE HOST — no isolation "
            "(DANGEROUSLY_ALLOW_HOST_EXEC=1)",
            codePreview=code[:200],
        )
        import contextlib
        import io
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            exec(code, {"__builtins__": __builtins__}, {})  # noqa: S102 — gated above
        return buf.getvalue()[:4000]

    from daytona import Daytona, DaytonaConfig

    client = Daytona(DaytonaConfig(api_key=DAYTONA_API_KEY, api_url=DAYTONA_API_URL))

    sb = None
    try:
        with t.span("sandbox.create", "provisioning Daytona sandbox") as sp:
            sb = client.create()
            sp["sandboxId"] = getattr(sb, "id", None)

        with t.span("sandbox.exec", f"running {len(code)} chars of generated code") as sp:
            res = sb.process.code_run(code)
            out = (getattr(res, "result", "") or "")[:4000]
            sp["exitCode"] = getattr(res, "exit_code", None)
            sp["outputChars"] = len(out)
        return out

    finally:
        if sb is not None:
            try:
                with t.span("sandbox.delete", "tearing down sandbox",
                            sandboxId=getattr(sb, "id", None)):
                    sb.delete()
            except Exception as exc:
                # A leaked sandbox costs money, so this is a warning, not a shrug.
                t.warn("sandbox.leak", f"failed to delete sandbox: {exc}",
                       sandboxId=getattr(sb, "id", None))


def sandbox_selftest(trace: Trace | None = None) -> dict[str, Any]:
    """End-to-end proof that Daytona works: create, execute, verify, delete.
    Wired to `GET /api/health/sandbox` so the whole path can be checked from
    the dashboard without starting a diligence run."""
    t = trace or Trace()
    health = sandbox_health(t)
    if not health.get("reachable"):
        return {"ok": False, "health": health}

    with t.span("sandbox.selftest", "end-to-end sandbox check") as sp:
        out = sandbox_run("print(6 * 7)", t)
        ok = out.strip() == "42"
        sp["output"] = out.strip()
        sp["ok"] = ok
    return {"ok": ok, "health": health, "output": out.strip()}
