"use client";

import { useProject } from "@/components/project/ProjectContext";
import { Card } from "@/components/ui/Card";
import { clsx } from "@/lib/clsx";
import type { PillarName, ProjectDocument } from "@/lib/types";

// Category chips use the structural palette only (never status colors) — a
// document's pillar tag is a category, not a risk band.
const pillarTone: Record<PillarName, string> = {
  Land: "bg-vista-soft text-ink",
  Law: "bg-surface-2 text-ink",
  Finance: "bg-brand-soft text-brand",
  Materials: "bg-vista-soft text-ink",
  Demand: "bg-surface-2 text-ink",
};

function formatUploaded(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

function DocumentRow({
  doc,
  first,
}: {
  doc: ProjectDocument;
  first: boolean;
}) {
  return (
    <div
      id={doc.id}
      className={clsx(
        "flex flex-wrap items-start justify-between gap-4 px-5 py-4 scroll-mt-24",
        !first && "border-t border-hairline",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{doc.title}</p>
        <p className="mt-1 text-xs text-muted">
          {doc.kind} · {doc.pages} pages · added {formatUploaded(doc.uploadedAt)}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {doc.pillars.map((p) => (
            <span
              key={p}
              className={clsx(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                pillarTone[p],
              )}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { documents } = useProject();

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink">Source documents</h1>
        <span className="text-sm text-muted">
          {documents.length} analyzed for this project
        </span>
      </div>

      <Card padded={false}>
        {documents.map((doc, i) => (
          <DocumentRow key={doc.id} doc={doc} first={i === 0} />
        ))}
      </Card>

      <p className="text-xs text-faint">
        Category tags show which risk pillars each document informs — they are
        not a status assessment.
      </p>
    </div>
  );
}
