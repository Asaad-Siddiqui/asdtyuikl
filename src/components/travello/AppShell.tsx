"use client";

import { useState, useSyncExternalStore } from "react";

import { AppSidebar } from "@/components/travello/AppSidebar";
import { AppTopbar } from "@/components/travello/AppTopbar";
import { BottomNav } from "@/components/travello/BottomNav";
import { cn } from "@/lib/format";

/**
 * The single application frame.
 *
 * One rail, one top bar, one content well — every signed-in page renders inside
 * this, so the dashboard, Explore, Trips, Challenges, Impact, Reports,
 * Community, the Digital Twin, the planner and the profile all share the same
 * navigation, the same search, the same spacing and the same canvas colour.
 *
 * The rail can be collapsed to an icon strip. The choice is remembered between
 * visits: `useSyncExternalStore` reads it during hydration without ever
 * throwing a hydration mismatch, so the page never flashes the wrong width.
 */

const COLLAPSE_KEY = "travello:rail-collapsed";
const COLLAPSE_EVENT = "travello:rail-change";

/** Module-scope cache so `getSnapshot` stays cheap and referentially stable. */
let collapsedCache: boolean | null = null;

function readCollapsed(): boolean {
  if (collapsedCache === null) {
    try {
      collapsedCache = window.localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      collapsedCache = false;
    }
  }
  return collapsedCache;
}

function subscribeToCollapse(onChange: () => void) {
  window.addEventListener(COLLAPSE_EVENT, onChange);
  return () => window.removeEventListener(COLLAPSE_EVENT, onChange);
}

function writeCollapsed(next: boolean) {
  collapsedCache = next;
  try {
    window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  } catch {
    /* Private mode — the preference simply does not persist. */
  }
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const collapsed = useSyncExternalStore(
    subscribeToCollapse,
    readCollapsed,
    () => false,
  );
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Rail first, so the page content is the second thing a screen reader meets. */}
      <AppSidebar
        open={navOpen}
        onClose={() => setNavOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={() => writeCollapsed(!collapsed)}
      />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-300 ease-out",
          collapsed ? "lg:pl-[4.75rem]" : "lg:pl-[15.5rem]",
        )}
      >
        <AppTopbar onOpenNav={() => setNavOpen(true)} />
        <main
          id="main"
          className="flex w-full flex-1 flex-col px-4 pt-5 pb-24 sm:px-6 sm:pt-6 lg:pb-10"
        >
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
