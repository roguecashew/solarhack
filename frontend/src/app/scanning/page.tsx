"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

const TARGET = "/projects/project-alpha";

export default function ScanningPage() {
  const router = useRouter();
  const [percent, setPercent] = useState(0);
  const [revealed, setRevealed] = useState<ScanStep[]>([]);
  const [done, setDone] = useState(false);
  const pushedRef = useRef(false);

  useEffect(() => {
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
  }, []);

  // Auto-advance to the project once the scan completes.
  useEffect(() => {
    if (!done || pushedRef.current) return;
    pushedRef.current = true;
    const t = setTimeout(() => router.push(TARGET), 900);
    return () => clearTimeout(t);
  }, [done, router]);

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
        <p className="text-sm text-vista">Project Alpha</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">
          {done ? "Analysis complete" : "Reading the document set"}
        </h1>
        <p className="mt-1 text-muted">
          {done
            ? "Sentinel finished the document set. Opening the project."
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
          {done
            ? "Redirecting to the project view…"
            : "This usually takes a few seconds."}
        </p>
        <Button
          variant={done ? "primary" : "secondary"}
          disabled={!done}
          onClick={() => router.push(TARGET)}
        >
          View project
        </Button>
      </div>
    </PageContainer>
  );
}
