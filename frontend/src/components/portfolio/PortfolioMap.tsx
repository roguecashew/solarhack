import { Card } from "@/components/ui/Card";
import { bandColorVar } from "@/lib/band";
import type { Project } from "@/lib/types";

/**
 * Decorative portfolio overview. Pins are placed from a rough normalization of
 * each project's coordinates over a soft stylized panel — not a real basemap,
 * and honestly labelled as such.
 */
export function PortfolioMap({ projects }: { projects: Project[] }) {
  const lats = projects.map((p) => p.latitude);
  const lons = projects.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  // Inset the pins so they never touch the panel edges.
  const norm = (v: number, min: number, max: number) =>
    max === min ? 50 : 12 + ((v - min) / (max - min)) * 76;

  return (
    <Card>
      <h2 className="text-sm font-medium text-ink">Portfolio overview</h2>
      <div
        className="relative mt-3 overflow-hidden rounded-[5px]"
        style={{
          height: 220,
          background:
            "linear-gradient(150deg, var(--color-vista-soft) 0%, var(--color-surface-2) 100%)",
        }}
      >
        {/* Soft grid to read as a stylized map, not decoration for its own sake. */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-hairline) 1px, transparent 1px), linear-gradient(90deg, var(--color-hairline) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        {projects.map((p) => {
          const left = norm(p.longitude, minLon, maxLon);
          const top = 100 - norm(p.latitude, minLat, maxLat);
          return (
            <span
              key={p.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <span
                className="block rounded-full ring-2 ring-white"
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: bandColorVar[p.band],
                }}
                title={p.name}
              />
            </span>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-faint">
        Illustrative map — pins are not geolocated. Color reflects each
        project&rsquo;s risk band.
      </p>
    </Card>
  );
}
