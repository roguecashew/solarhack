"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "@/lib/clsx";

/**
 * Document drop-in zone. Clicking it or dropping files starts the scan.
 * Supports multiple files; the actual upload is mocked — it routes to the
 * live scanning state.
 */
export function DropZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  function start(files?: FileList | null) {
    if (files && files.length > 0) {
      setPicked(Array.from(files).map((f) => f.name));
    }
    router.push("/scanning");
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
        start(e.dataTransfer.files);
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
        onChange={(e) => start(e.target.files)}
      />
      <p className="text-base font-medium text-ink">
        Drop due-diligence documents to scan
      </p>
      <p className="mt-1 max-w-md text-sm text-muted">
        {picked.length > 0
          ? `${picked.length} file${picked.length === 1 ? "" : "s"} selected — starting the scan…`
          : "Add land, legal, financial, materials and offtake files. Sentinel reads the set and flags contradictions across them."}
      </p>
      <span className="mt-4 inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">
        Select files
      </span>
    </div>
  );
}
