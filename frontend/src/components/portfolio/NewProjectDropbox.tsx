"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { clsx } from "@/lib/clsx";

/**
 * Dashed drop zone that starts a new project from one or several documents at
 * once. No real upload — a drop or click routes to the scanning experience.
 */
export function NewProjectDropbox() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function start() {
    router.push("/scanning");
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
          start();
        }}
        className={clsx(
          "flex w-full flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-brand bg-brand-soft"
            : "border-hairline bg-white hover:bg-surface-2",
        )}
      >
        <span className="text-sm font-medium text-ink">
          Drop documents to start a new project
        </span>
        <span className="text-xs text-muted">
          One or several files become one project.
        </span>
        <span className="mt-2 text-xs font-medium text-brand">
          Or click to browse
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={start}
      />
    </Card>
  );
}
