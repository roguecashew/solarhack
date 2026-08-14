"use client";

import Link from "next/link";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";

// PLACEHOLDER — Scanning state. Owned by workstream C (replace).
export default function ScanningPage() {
  return (
    <PageContainer>
      <Card>
        <p className="text-muted">
          Scanning documents… (placeholder).{" "}
          <Link href="/projects/solar-alpha" className="text-brand underline">
            Open project
          </Link>
        </p>
      </Card>
    </PageContainer>
  );
}
