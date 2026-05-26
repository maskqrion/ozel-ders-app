"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type State = "idle" | "loading" | "success" | "error";

interface ButtonProps {
  onClick: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  successLabel?: string;
  errorLabel?: string;
}

export function StatefulButton({
  onClick,
  children,
  className,
  disabled,
  successLabel = "Tamam!",
  errorLabel = "Hata",
}: ButtonProps) {
  const [state, setState] = useState<State>("idle");

  const handle = async () => {
    if (state !== "idle" || disabled) return;
    setState("loading");
    try {
      await onClick();
      setState("success");
      setTimeout(() => setState("idle"), 2200);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2200);
    }
  };

  const label =
    state === "success"
      ? successLabel
      : state === "error"
        ? errorLabel
        : state === "loading"
          ? ""
          : children;

  const bg =
    state === "success"
      ? "bg-emerald-500 border-emerald-600"
      : state === "error"
        ? "bg-red-500 border-red-600"
        : "bg-slate-800 border-slate-900 hover:bg-slate-900";

  return (
    <m.button
      type="button"
      onClick={handle}
      disabled={state !== "idle" || disabled}
      whileTap={{ scale: state === "idle" ? 0.97 : 1 }}
      className={cn(
        "relative w-full overflow-hidden rounded-lg border px-4 py-2.5 text-sm font-medium text-white transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-70",
        bg,
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "loading" ? (
          <m.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            {[0, 1, 2].map((i) => (
              <m.span
                key={i}
                animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                className="block h-1.5 w-1.5 rounded-full bg-white"
              />
            ))}
          </m.span>
        ) : (
          <m.span
            key="label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex items-center justify-center gap-1.5"
          >
            {state === "success" && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
            {label}
          </m.span>
        )}
      </AnimatePresence>
    </m.button>
  );
}
