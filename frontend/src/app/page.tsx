import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";

// PLACEHOLDER — Home page. Owned by workstream C (replace this file).
export default function HomePage() {
  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold text-ink">Home</h1>
      <p className="mt-1 text-muted">
        Landing page — document drop-in, portfolio stats and charts go here.
      </p>
      <Card className="mt-6">
        <Link href="/projects" className="text-brand underline">
          Go to current projects →
        </Link>
      </Card>
    </PageContainer>
  );
}
