"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { clsx } from "@/lib/clsx";
import { analyze } from "@/lib/agent/client";
import { slugify } from "@/lib/agent/liveStore";

const DEFAULT_PROJECT = { name: "Project Alpha", location: "West Texas" };

/**
 * Dashed drop zone that starts a new project from one or several documents at
 * once. Starts a real pipeline run; falls back to the scripted scan when the
 * agent backend is unreachable.
 */
export function NewProjectDropbox() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function start(files?: FileList | null) {
    const names =
      files && files.length > 0 ? Array.from(files).map((f) => f.name) : [];
    try {
      const { jobId } = await analyze({ ...DEFAULT_PROJECT, docs: names });
      router.push(
        `/scanning?job=${jobId}&project=${slugify(DEFAULT_PROJECT.name)}`,
      );
    } catch {
      router.push("/scanning");
    }
  }

  return (
    <Card padded={false}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
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
          "flex w-full flex-col items-center justify-center gap-2 rounded-[11px] border border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-hairline bg-select"
            : "border-hairline bg-white hover:bg-surface-2",
        )}
      >
        <span className="text-sm font-medium text-ink">
          Drop documents to start a new project
        </span>
        <span className="text-xs text-muted">
          One or several files become one project.
        </span>
        <span className="mt-2 text-xs font-medium text-vista">
          Or click to browse
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => void start(e.target.files)}
      />
    </Card>
  );
}
