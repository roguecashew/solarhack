"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getProjectDetail } from "@/lib/mockData";
import { ProjectProvider } from "@/components/project/ProjectContext";
import { EvidenceDrawerProvider } from "@/components/evidence/EvidenceDrawer";
import { ProjectSubNav } from "@/components/project/ProjectSubNav";
import { ProjectHeaderActions } from "@/components/project/ProjectHeaderActions";
import { PageContainer } from "@/components/ui/PageContainer";
import { StatusPill } from "@/components/ui/StatusPill";
import { statusLabelText } from "@/lib/band";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ id: string }>();
  const detail = getProjectDetail(params.id);

  if (!detail) {
    return (
      <PageContainer>
        <p className="text-muted">
          Project not found.{" "}
          <Link href="/projects" className="text-brand underline">
            Back to current projects
          </Link>
        </p>
      </PageContainer>
    );
  }

  const { project } = detail;

  return (
    <ProjectProvider detail={detail}>
      <EvidenceDrawerProvider>
      <PageContainer className="py-6">
        <Link
          href="/projects"
          className="text-sm font-medium text-muted hover:text-ink"
        >
          ← Current projects
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-ink">
                {project.name}
              </h1>
              <StatusPill
                band={project.band}
                label={statusLabelText[project.status]}
              />
            </div>
            <p className="mt-1 text-sm text-muted">
              {project.location} · {project.capacityMW} MW
            </p>
          </div>
          <ProjectHeaderActions projectName={project.name} />
        </div>

        <div className="mt-5">
          <ProjectSubNav projectId={project.id} />
        </div>

        <div className="mt-6">{children}</div>
      </PageContainer>
      </EvidenceDrawerProvider>
    </ProjectProvider>
  );
}
