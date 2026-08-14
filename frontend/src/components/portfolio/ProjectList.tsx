import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { StatusPill } from "@/components/ui/StatusPill";
import { statusLabelText } from "@/lib/band";
import type { Project } from "@/lib/types";

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <Card padded={false}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-sm font-medium text-ink">Projects</h2>
        <span className="text-xs text-faint">{projects.length} in portfolio</span>
      </div>
      <ul className="divide-y divide-hairline border-t border-hairline">
        {projects.map((p) => (
          <li key={p.id}>
            <ProjectRow project={p} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ProjectRow({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-surface-2 sm:flex-row sm:items-center sm:gap-5"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink group-hover:text-brand">
          {project.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {project.location} · {project.capacityMW} MW
        </p>
      </div>

      <div className="flex w-full items-center gap-4 sm:w-64">
        <ScoreBar
          value={project.activationScore}
          band={project.band}
          className="flex-1"
          animate={false}
        />
        <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums text-ink">
          {project.activationScore}
        </span>
      </div>

      <div className="shrink-0">
        <StatusPill
          band={project.band}
          label={statusLabelText[project.status]}
          size="sm"
        />
      </div>
    </Link>
  );
}
