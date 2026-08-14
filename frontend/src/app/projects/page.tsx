import { PageContainer } from "@/components/ui/PageContainer";
import { PortfolioSummary } from "@/components/portfolio/PortfolioSummary";
import { NewProjectDropbox } from "@/components/portfolio/NewProjectDropbox";
import { ProjectList } from "@/components/portfolio/ProjectList";
import { PortfolioMap } from "@/components/portfolio/PortfolioMap";
import { RiskFactorLegend } from "@/components/portfolio/RiskFactorLegend";
import { projects, portfolioSummary, riskFactorDefinitions } from "@/lib/mockData";

export default function ProjectsPage() {
  const summary = portfolioSummary();

  return (
    <PageContainer>
      <header>
        <h1 className="text-2xl font-semibold text-ink">Current projects</h1>
        <p className="mt-1 text-sm text-muted">
          Portfolio-wide activation and per-project standing, read straight from
          the due-diligence documents.
        </p>
      </header>

      <div className="mt-6">
        <PortfolioSummary summary={summary} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <NewProjectDropbox />
          <ProjectList projects={projects} />
        </div>
        <div className="flex flex-col gap-5">
          <PortfolioMap projects={projects} />
          <RiskFactorLegend factors={riskFactorDefinitions} />
        </div>
      </div>
    </PageContainer>
  );
}
