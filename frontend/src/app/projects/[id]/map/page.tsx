"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useProject } from "@/components/project/ProjectContext";
import { Card } from "@/components/ui/Card";
import { clsx } from "@/lib/clsx";

type LayerKey = "watersheds" | "zoning" | "grid" | "zones";

const layerMeta: { key: LayerKey; label: string; hint: string }[] = [
  {
    key: "watersheds",
    label: "Watersheds",
    hint: "Drainage corridors and swales across the site.",
  },
  {
    key: "zoning",
    label: "Historical zoning",
    hint: "Prior land-use designations overlaid on the parcels.",
  },
  {
    key: "grid",
    label: "Grid interconnectivity",
    hint: "Gen-tie route to the substation and interconnection point.",
  },
  {
    key: "zones",
    label: "Development potential and restriction zones",
    hint: "Green marks buildable area; red marks restricted area.",
  },
];

/** Accessible switch — real checkbox, no icon glyphs, sentence case. */
function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-3">
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={clsx(
            "h-5 w-9 rounded-full transition-colors",
            checked ? "bg-brand" : "bg-surface-2",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
          )}
        />
        <span
          className={clsx(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-card transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="mt-0.5 block text-xs text-muted">{hint}</span>
      </span>
    </label>
  );
}

function SitePanel({ layers }: { layers: Record<LayerKey, boolean> }) {
  return (
    <svg
      viewBox="0 0 400 300"
      className="h-full w-full rounded-[12px]"
      role="img"
      aria-label="Illustrative site diagram with toggleable overlays"
    >
      {/* Base site fill */}
      <rect x="0" y="0" width="400" height="300" fill="var(--color-surface-2)" />

      {/* Parcel outline */}
      <polygon
        points="40,40 360,55 350,255 55,270"
        fill="white"
        stroke="var(--color-hairline)"
        strokeWidth="1.5"
      />

      {/* Development potential / restriction zones (green = build, red = no-go) */}
      <motion.g
        initial={false}
        animate={{ opacity: layers.zones ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: "none" }}
      >
        <polygon
          points="60,60 250,68 245,180 65,175"
          fill="var(--color-strong-soft)"
          stroke="var(--color-strong)"
          strokeWidth="1"
        />
        <text x="90" y="120" fontSize="11" fill="var(--color-strong-ink)">
          Development potential
        </text>
        <polygon
          points="255,70 345,74 340,200 250,195"
          fill="var(--color-risk-soft)"
          stroke="var(--color-risk)"
          strokeWidth="1"
        />
        <text x="268" y="140" fontSize="11" fill="var(--color-risk-ink)">
          Restricted area
        </text>
      </motion.g>

      {/* Watersheds — soft vista bands */}
      <motion.g
        initial={false}
        animate={{ opacity: layers.watersheds ? 0.55 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: "none" }}
      >
        <path
          d="M55,230 C130,210 200,250 350,215 L350,255 C200,275 130,245 55,265 Z"
          fill="var(--color-vista)"
        />
        <path
          d="M60,90 C120,110 180,80 250,100"
          fill="none"
          stroke="var(--color-vista)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.7"
        />
      </motion.g>

      {/* Historical zoning — amande hatch */}
      <motion.g
        initial={false}
        animate={{ opacity: layers.zoning ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <pattern
            id="zoningHatch"
            width="10"
            height="10"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="10"
              stroke="var(--color-amande)"
              strokeWidth="4"
            />
          </pattern>
        </defs>
        <polygon points="40,40 360,55 355,150 45,140" fill="url(#zoningHatch)" />
      </motion.g>

      {/* Grid interconnectivity — dashed route + nodes */}
      <motion.g
        initial={false}
        animate={{ opacity: layers.grid ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ pointerEvents: "none" }}
      >
        <polyline
          points="70,250 160,180 230,190 320,90"
          fill="none"
          stroke="var(--color-vista)"
          strokeWidth="2.5"
          strokeDasharray="7 5"
        />
        <circle cx="70" cy="250" r="5" fill="var(--color-vista)" />
        <circle cx="320" cy="90" r="6" fill="white" stroke="var(--color-vista)" strokeWidth="2.5" />
        <text x="300" y="78" fontSize="10" fill="var(--color-muted)">
          Substation
        </text>
      </motion.g>
    </svg>
  );
}

export default function MapPage() {
  const { project } = useProject();
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    watersheds: true,
    zoning: false,
    grid: true,
    zones: true,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink">Site map</h1>
        <span className="text-sm text-muted">
          {project.location} · {project.capacityMW} MW
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <div className="aspect-[4/3] w-full">
            <SitePanel layers={layers} />
          </div>
          <p className="mt-3 text-xs text-faint">
            Illustrative — not real GIS data. Overlays are decorative and for
            layout demonstration only.
          </p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-ink">Layers</h2>
          <p className="mt-0.5 text-xs text-muted">
            Toggle overlays on the site diagram.
          </p>
          <div className="mt-2 divide-y divide-hairline">
            {layerMeta.map((l) => (
              <Switch
                key={l.key}
                checked={layers[l.key]}
                onChange={(v) => setLayers((s) => ({ ...s, [l.key]: v }))}
                label={l.label}
                hint={l.hint}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
