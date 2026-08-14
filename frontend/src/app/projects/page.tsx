import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { projects } from "@/lib/mockData";

// PLACEHOLDER — Current Projects portfolio. Owned by workstream A (replace).
export default function ProjectsPage() {
  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold text-ink">Current projects</h1>
      <div className="mt-6 grid gap-3">
        {projects.map((p) => (
          <Card key={p.id}>
            <Link href={`/projects/${p.id}`} className="text-brand underline">
              {p.name}
            </Link>
            <span className="ml-2 text-muted">
              {p.location} · score {p.activationScore}
            </span>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
