import { Card } from "@/components/ui/Card";
import { DonutRing } from "@/components/ui/DonutRing";
import { StatusPill } from "@/components/ui/StatusPill";
import { statusLabelText } from "@/lib/band";
import type { ProjectStatus, RiskBand } from "@/lib/types";

type Summary = {
  count: number;
  avgScore: number;
  avgBand: RiskBand;
  onTrack: number;
  needsReview: number;
  atRisk: number;
};

/** Plain-English reading of the portfolio-wide activation band. */
const bandCaption: Record<RiskBand, string> = {
  strong: "The portfolio is broadly cleared to advance.",
  watch: "The portfolio is progressing, with several items to review.",
  risk: "The portfolio carries flags that need attention before it advances.",
};

type Count = { status: ProjectStatus; value: number };

export function PortfolioSummary({ summary }: { summary: Summary }) {
  const counts: Count[] = [
    { status: "on-track", value: summary.onTrack },
    { status: "needs-review", value: summary.needsReview },
    { status: "at-risk", value: summary.atRisk },
  ];

  return (
    <Card className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
      <div className="flex items-center gap-5">
        <DonutRing
          value={summary.avgScore}
          band={summary.avgBand}
          size={132}
          stroke={12}
          caption="avg score"
        />
        <div className="max-w-56">
          <p className="text-sm font-medium text-ink">
            Portfolio-wide activation
          </p>
          <p className="mt-1 text-sm text-muted">
            {bandCaption[summary.avgBand]}
          </p>
          <p className="mt-2 text-xs text-faint">
            Across {summary.count} active projects
          </p>
        </div>
      </div>

      <div className="hidden w-px self-stretch bg-hairline md:block" />

      <div className="grid flex-1 grid-cols-3 gap-4">
        {counts.map(({ status, value }) => (
          <StatCount
            key={status}
            value={value}
            status={status}
          />
        ))}
      </div>
    </Card>
  );
}

const statusBand: Record<ProjectStatus, RiskBand> = {
  "on-track": "strong",
  "needs-review": "watch",
  "at-risk": "risk",
};

function StatCount({
  value,
  status,
}: {
  value: number;
  status: ProjectStatus;
}) {
  const band = statusBand[status];
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-3xl font-semibold leading-none text-ink">
        {value}
      </span>
      <StatusPill band={band} label={statusLabelText[status]} size="sm" />
    </div>
  );
}
