"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScanProgress } from "@/components/scanning/ScanProgress";
import { ReasoningTrail } from "@/components/scanning/ReasoningTrail";
import { SubAgentTrail } from "@/components/scanning/SubAgentTrail";
import {
  SCAN_DURATION_MS,
  SCAN_SCRIPT,
  type ScanStep,
} from "@/components/scanning/scanScript";
import {
  approximateProgress,
  toScanStep,
} from "@/components/scanning/liveSteps";
import { getReport, streamJob } from "@/lib/agent/client";
import { saveLiveRun } from "@/lib/agent/liveStore";

const TARGET = "/projects/project-alpha";

/**
 * Drives the scan from a real pipeline run when the route carries
 * `?job=<jobId>&project=<slug>`, and from the scripted animation otherwise.
 *
 * The scripted path is not dead code — it is the fallback for when the agent
 * backend is unreachable, which keeps the demo alive on a bad network.
 */
function ScanningView() {
  const router = useRouter();
  const params = useSearchParams();
  const jobId = params.get("job");
  const projectId = params.get("project") ?? "project-alpha";
  const isLive = Boolean(jobId);

  const [percent, setPercent] = useState(0);
  const [revealed, setRevealed] = useState<ScanStep[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pushedRef = useRef(false);

  const target = isLive ? `/projects/${projectId}` : TARGET;

  useEffect(() => {
    if (isLive) return; // the live path drives progress from the event stream

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const frac = Math.min(1, (now - start) / SCAN_DURATION_MS);
      setPercent(frac * 100);
      setRevealed(SCAN_SCRIPT.filter((s) => frac >= s.at));

      if (frac < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isLive]);

  // Live path: narrate the real run, then hand the report to the project view.
  useEffect(() => {
    if (!jobId) return;

    let count = 0;
    let cancelled = false;

    const unsubscribe = streamJob(jobId, (event) => {
      if (cancelled) return;

      if (event.kind === "status") {
        count += 1;
        setPercent(approximateProgress(count));
        setRevealed((steps) => [
          ...steps,
          toScanStep(event.message, steps[steps.length - 1]?.file ?? "…"),
        ]);
        return;
      }

      if (event.kind === "error") {
        setError(event.message);
        return;
      }

      void (async () => {
        try {
          const report = await getReport(jobId);
          if (cancelled) return;
          saveLiveRun({
            jobId,
            projectId,
            report,
            finishedAt: new Date().toISOString(),
          });
          setPercent(100);
          setDone(true);
        } catch (cause) {
          if (!cancelled) {
            setError(
              cause instanceof Error
                ? cause.message
                : "could not load the finished report",
            );
          }
        }
      })();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [jobId, projectId]);

  // Auto-advance to the project once the scan completes.
  useEffect(() => {
    if (!done || pushedRef.current) return;
    pushedRef.current = true;
    const t = setTimeout(() => router.push(target), 900);
    return () => clearTimeout(t);
  }, [done, router, target]);

  const currentFile =
    revealed.length > 0
      ? revealed[revealed.length - 1].file
      : SCAN_SCRIPT[0].file;

  const flagCount = revealed.filter(
    (s) => s.kind === "flag" || s.kind === "contradiction",
  ).length;

  return (
    <PageContainer className="max-w-3xl">
      <div className="mb-6">
        <p className="text-sm text-vista">
          {isLive ? "Live agent run" : "Project Alpha"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">
          {error
            ? "Analysis failed"
            : done
              ? "Analysis complete"
              : "Reading the document set"}
        </h1>
        <p className="mt-1 text-muted">
          {error
            ? error
            : done
              ? "Sentinel finished the document set. Opening the project."
              : isLive
                ? "The agent pipeline is reading the document set and cross-checking it for contradictions."
                : "Sentinel is reading 7 documents and 3 sheets and cross-checking them for contradictions."}
        </p>
      </div>

      <Card>
        <ScanProgress percent={percent} file={currentFile} done={done} />

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-faint">Live reasoning</p>
            <p className="text-xs text-faint tabular-nums">
              {flagCount > 0
                ? `${flagCount} finding${flagCount === 1 ? "" : "s"} flagged`
                : "Scanning"}
            </p>
          </div>
          <ReasoningTrail steps={revealed} />
        </div>

        <div className="mt-5 border-t border-hairline pt-4">
          <SubAgentTrail percent={percent} done={done} />
        </div>
      </Card>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {error
            ? "Open the project to see the most recent saved data."
            : done
              ? "Redirecting to the project view…"
              : "This usually takes a few seconds."}
        </p>
        <Button
          variant={done || error ? "primary" : "secondary"}
          disabled={!done && !error}
          onClick={() => router.push(target)}
        >
          View project
        </Button>
      </div>
    </PageContainer>
  );
}

export default function ScanningPage() {
  // useSearchParams needs a Suspense boundary to keep the route prerenderable.
  return (
    <Suspense
      fallback={
        <PageContainer className="max-w-3xl">
          <p className="text-muted">Starting analysis…</p>
        </PageContainer>
      }
    >
      <ScanningView />
    </Suspense>
  );
}
