"use client";
// PLACEHOLDER — Share modal. Owned by workstream 4 (replace).
export function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(11,8,41,.35)]" onClick={onClose}>
      <div className="w-[460px] rounded-[11px] bg-canvas p-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-[15px] font-semibold text-ink">Share</div>
      </div>
    </div>
  );
}
