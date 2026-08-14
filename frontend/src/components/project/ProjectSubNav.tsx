"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";

const tabs = [
  { seg: "", label: "Overview" },
  { seg: "chat", label: "Chat" },
  { seg: "reports", label: "Reports" },
  { seg: "documents", label: "Documents" },
  { seg: "map", label: "Map" },
  { seg: "timeline", label: "Timeline" },
];

export function ProjectSubNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-hairline">
      {tabs.map((tab) => {
        const href = tab.seg ? `${base}/${tab.seg}` : base;
        const active = tab.seg
          ? pathname.startsWith(href)
          : pathname === base;
        return (
          <Link
            key={tab.label}
            href={href}
            className={clsx(
              "relative px-3.5 py-2.5 text-sm font-medium transition-colors",
              active ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {tab.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
