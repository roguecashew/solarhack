"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "@/lib/clsx";
import { AGENT_API, analyze } from "@/lib/agent/client";
import { slugify } from "@/lib/agent/liveStore";

/**
 * The project a dropped document set is attributed to. A constant because
 * there is no intake form yet — the backend's /api/projects/analyze takes a
 * name and location and nothing in the UI collects them. The name must
 * slugify to a known project id, so the scan lands on a real project view.
 */
const DEFAULT_PROJECT = { name: "Project Alpha", location: "West Texas" };

/** Sends the actual file bytes to the backend before the run starts. */
async function uploadFiles(files: File[]): Promise<string[]> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await fetch(`${AGENT_API}/api/uploads`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`upload failed: ${res.status}`);
  return ((await res.json()) as { files: string[] }).files;
}

/**
 * Document drop-in zone. Clicking it or dropping files uploads the documents
 * to the agent backend, starts a real pipeline run against them, and routes
 * to the live scanning view.
 */
export function DropZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  async function start(files?: FileList | null) {
    const list = files && files.length > 0 ? Array.from(files) : [];
    if (list.length > 0) setPicked(list.map((f) => f.name));

    try {
      // Upload the bytes first; the pipeline then reads the real documents,
      // not just their names.
      const docs = list.length > 0 ? await uploadFiles(list) : [];
      const { jobId } = await analyze({ ...DEFAULT_PROJECT, docs });
      router.push(
        `/scanning?job=${jobId}&project=${slugify(DEFAULT_PROJECT.name)}`,
      );
    } catch {
      // Backend down: fall through to the scripted scan so the demo still runs.
      router.push("/scanning");
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Add documents to scan"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void start(e.dataTransfer.files);
      }}
      className={clsx(
        "flex cursor-pointer flex-col items-center justify-center rounded-[11px] border border-dashed px-6 py-12 text-center transition-colors",
        dragging
          ? "border-hairline bg-select"
          : "border-hairline bg-surface-2 hover:bg-vista-soft",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => void start(e.target.files)}
      />
      <p className="text-base font-medium text-ink">
        Drop due-diligence documents to scan
      </p>
      <p className="mt-1 max-w-md text-sm text-muted">
        {picked.length > 0
          ? `${picked.length} file${picked.length === 1 ? "" : "s"} selected — starting the scan…`
          : "Add land, legal, financial, materials and offtake files. RAI reads the set and flags contradictions across them."}
      </p>
      <span className="mt-4 inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">
        Select files
      </span>
    </div>
  );
}
