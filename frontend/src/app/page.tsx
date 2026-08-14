import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import {
  ITC_DEADLINE_LABEL,
  portfolioSummary,
  projects,
  recentDocuments,
} from "@/lib/mockData";
import { DropZone } from "@/components/home/DropZone";
import { StatBoxes } from "@/components/home/StatBoxes";
import { StatusDonut, type DonutSegment } from "@/components/home/StatusDonut";
import { ScoreBars, type ScoreBarRow } from "@/components/home/ScoreBars";
import { RecentDocumentsTable } from "@/components/home/RecentDocumentsTable";
import { InProgressList } from "@/components/home/InProgressList";

export default function HomePage() {
  const summary = portfolioSummary();

  const stats = [
    { value: summary.count, label: "Active projects in review" },
    { value: summary.avgScore, label: "Portfolio average activation score" },
    {
      value: summary.needsReview + summary.atRisk,
      label: "Projects needing review",
    },
  ];

  const donutSegments: DonutSegment[] = [
    { label: "On track", value: summary.onTrack, band: "strong" },
    { label: "Needs review", value: summary.needsReview, band: "watch" },
    { label: "At risk", value: summary.atRisk, band: "risk" },
  ];

  const scoreRows: ScoreBarRow[] = [...projects]
    .sort((a, b) => b.activationScore - a.activationScore)
    .map((p) => ({
      name: p.name,
      score: p.activationScore,
      band: p.band,
    }));

  const inProgressDocs = recentDocuments.filter((d) => d.status !== "Analyzed");

  return (
    <PageContainer>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Solar Sentinel</h1>
        <p className="mt-1 text-muted">
          Read a project&apos;s due-diligence document set, surface the
          contradictions between documents, and score how close it is to
          activation.
        </p>
        <p className="mt-2 text-sm text-muted">{ITC_DEADLINE_LABEL}</p>
      </header>

      <DropZone />

      <div className="mt-6">
        <StatBoxes stats={stats} />
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-medium text-ink">Portfolio status mix</h2>
          <p className="mt-1 text-sm text-muted">
            {summary.atRisk > 0
              ? `${summary.onTrack} on track, ${summary.needsReview} in review and ${summary.atRisk} at risk across the portfolio.`
              : `${summary.onTrack} on track and ${summary.needsReview} in review across the portfolio.`}
          </p>
          <div className="mt-5">
            <StatusDonut segments={donutSegments} total={summary.count} />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-medium text-ink">
            Activation score by project
          </h2>
          <p className="mt-1 text-sm text-muted">
            Higher is closer to activation. Bars are colored by risk band, so a
            flagged bar reflects open flags — not just a low number.
          </p>
          <div className="mt-5">
            <ScoreBars rows={scoreRows} />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-base font-medium text-ink">Recent documents</h2>
          <p className="mt-1 text-sm text-muted">
            The latest files added across every project and where each sits in
            the pipeline.
          </p>
          <div className="mt-4">
            <RecentDocumentsTable docs={recentDocuments} />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-medium text-ink">In progress</h2>
          <p className="mt-1 text-sm text-muted">
            Documents still being read or queued.
          </p>
          <div className="mt-4">
            <InProgressList docs={inProgressDocs} />
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
