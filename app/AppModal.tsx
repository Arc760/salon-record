"use client";

import type { ReactNode } from "react";

type AppModalProps = {
  children: ReactNode;
  onClose: () => void;
  className?: string;
  contentClassName?: string;
  labelledBy?: string;
};

export function AppModal({
  children,
  onClose,
  className = "",
  contentClassName = "",
  labelledBy,
}: AppModalProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={onClose}
    >
      <div
        className={`max-h-[88vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ${contentClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
