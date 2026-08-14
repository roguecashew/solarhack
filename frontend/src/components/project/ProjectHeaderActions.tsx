"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Re-run analysis · Export memo · Share.
 * Share and Export follow the "draft, don't send" pattern: they expand inline
 * to show consequences and require explicit confirmation before firing.
 */
export function ProjectHeaderActions({ projectName }: { projectName: string }) {
  const [panel, setPanel] = useState<null | "share" | "export">(null);
  const [rerunning, setRerunning] = useState(false);
  const [done, setDone] = useState<null | string>(null);

  function confirm(kind: "share" | "export") {
    setPanel(null);
    setDone(
      kind === "share"
        ? "Share link drafted — recipients notified."
        : "Memo exported to your downloads.",
    );
    setTimeout(() => setDone(null), 3200);
  }

  function rerun() {
    setRerunning(true);
    setTimeout(() => setRerunning(false), 1600);
  }

  return (
    <div className="relative flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={rerun} disabled={rerunning}>
        {rerunning ? "Re-running…" : "Re-run analysis"}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setPanel(panel === "export" ? null : "export")}
      >
        Export memo
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setPanel(panel === "share" ? null : "share")}
      >
        Share
      </Button>

      <AnimatePresence>
        {panel && (
          <motion.div
            className="absolute right-0 top-11 z-20 w-80 rounded-[18px] bg-white p-4 shadow-pop"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            {panel === "share" ? (
              <>
                <p className="text-sm font-medium text-ink">
                  Share {projectName} due-diligence summary
                </p>
                <p className="mt-1 text-sm text-muted">
                  This drafts a read-only link and notifies the deal team by
                  email. Nothing is sent until you confirm.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-ink">
                  Export investment memo
                </p>
                <p className="mt-1 text-sm text-muted">
                  Generates a PDF memo from the current findings. Review it
                  before circulating — it is a draft, not a filed document.
                </p>
              </>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPanel(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => confirm(panel)}
              >
                {panel === "share" ? "Draft link and notify" : "Export memo"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {done && (
          <motion.div
            className="absolute right-0 top-11 z-20 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-pop"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            {done}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
