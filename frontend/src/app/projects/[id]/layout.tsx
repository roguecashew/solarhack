import type { ReactNode } from "react";
import { projectDetails } from "@/lib/mockData";

/**
 * The static export needs the id set up front — there is no server to render an
 * unknown id on demand. Seeded projects are the full set that survives a static
 * deploy; a live agent run gets its id from an upload, which needs the backend
 * anyway, so those routes are unreachable on GitHub Pages regardless.
 */
export function generateStaticParams() {
  return Object.keys(projectDetails).map((id) => ({ id }));
}

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return children;
}
