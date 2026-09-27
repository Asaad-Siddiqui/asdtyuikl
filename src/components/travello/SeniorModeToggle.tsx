"use client";

import { useCallback, useEffect, useState } from "react";
import { Accessibility } from "lucide-react";

import { cn } from "@/lib/format";

/**
 * Senior + Accessibility mode.
 *
 * One persistent preference that re-ranks the catalogue around step-free,
 * low-walking, well-equipped places. It lives in `localStorage` and is
 * broadcast through a window event, so Explore, a destination hub and any
 * other mounted screen stay in sync without prop-drilling.
 *
 * Initialise to `false` and hydrate in an effect so the server-rendered HTML
 * and the first client paint always agree (no hydration mismatch).
 */

const STORAGE_KEY = "travello:senior-mode";
const CHANGE_EVENT = "travello:senior-mode";

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStored(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* storage can be unavailable (private mode) — the session still works */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Reads and toggles the mode; usable from any client component. */
export function useSeniorMode() {
  const [seniorMode, setSeniorModeState] = useState(false);

  useEffect(() => {
    const sync = () => setSeniorModeState(readStored());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const setSeniorMode = useCallback((value: boolean) => {
    writeStored(value);
    setSeniorModeState(value);
  }, []);

  const toggleSeniorMode = useCallback(() => {
    const next = !readStored();
    writeStored(next);
    setSeniorModeState(next);
  }, []);

  return { seniorMode, setSeniorMode, toggleSeniorMode };
}

export function SeniorModeToggle({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { seniorMode, toggleSeniorMode } = useSeniorMode();

  return (
    <button
      type="button"
      onClick={toggleSeniorMode}
      aria-pressed={seniorMode}
      aria-label="Senior and accessibility mode"
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all",
        seniorMode
          ? "border-blue-300 bg-blue-600 text-white shadow-sm shadow-blue-900/20"
          : "border-sand-200 bg-white text-sand-700 hover:bg-sand-50",
        className,
      )}
    >
      <Accessibility className="h-4 w-4 shrink-0" />
      {!compact && <span>Senior + Accessibility</span>}
      <span
        className={cn(
          "relative ml-0.5 inline-flex h-4 w-8 shrink-0 items-center rounded-full transition-colors",
          seniorMode ? "bg-white/40" : "bg-sand-200",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "absolute h-3 w-3 rounded-full bg-white shadow transition-transform",
            seniorMode ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
