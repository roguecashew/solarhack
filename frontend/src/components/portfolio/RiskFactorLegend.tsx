import { Card } from "@/components/ui/Card";
import type { RiskFactorDefinition } from "@/lib/types";

/**
 * The five risk factors are categories, not statuses — rendered with neutral,
 * brand-family treatment (ink text, hairline dividers, a vista accent), never
 * status colours.
 */
export function RiskFactorLegend({
  factors,
}: {
  factors: RiskFactorDefinition[];
}) {
  return (
    <Card padded={false}>
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-sm font-medium text-ink">The five risk factors</h2>
        <p className="mt-0.5 text-xs text-muted">
          What each pillar screens for across every project.
        </p>
      </div>
      <ul className="divide-y divide-hairline border-t border-hairline">
        {factors.map((f) => (
          <li key={f.name} className="flex gap-3 px-5 py-3">
            <span
              className="mt-1.5 block size-2 shrink-0 rounded-full bg-vista"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{f.name}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                {f.definition}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
