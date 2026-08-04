"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

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
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    const scrollY = window.scrollY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-5 sm:px-4 sm:py-6 ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={onClose}
    >
      <div
        className={`max-h-[88vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-w-2xl lg:max-w-3xl ${contentClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
