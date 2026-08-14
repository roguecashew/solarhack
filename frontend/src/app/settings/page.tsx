"use client";

import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";

// PLACEHOLDER — Settings. Owned by workstream E (replace).
export default function SettingsPage() {
  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold text-ink">Settings</h1>
      <Card className="mt-6">
        <p className="text-muted">Workspace and analysis preferences.</p>
      </Card>
    </PageContainer>
  );
}
