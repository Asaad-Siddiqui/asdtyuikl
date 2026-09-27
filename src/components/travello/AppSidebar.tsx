"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Accessibility,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Plane,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { useApp } from "@/components/travello/AppProvider";
import { NAV_ITEMS, isNavActive, type NavItem } from "@/components/travello/nav";
import { cn } from "@/lib/format";

/**
 * The application rail.
 *
 * Full navigation parity with the top header. Everything the header offers lives
 * here, so a page can use either frame and lose nothing: every section in
 * `NAV_ITEMS`, the "Plan a Trip" entry, the account-mode badge, and the account
 * menu (profile, accessibility profile, trips, log out).
 *
 * The rail can be **collapsed** to an icon strip. The choice is remembered
 * between visits, and because the frame owns the page offset, everything beside
 * the rail slides over to match.
 */

/**
 * Rail order, written out so the product menu reads deliberately.
 *
 * `RAIL_LABELS` only overrides wording for the rail; every section still comes
 * from `NAV_ITEMS`, and any section not named in `RAIL_ORDER` is appended
 * automatically — so a new section can never go missing from navigation.
 */
const RAIL_ORDER = [
  "/dashboard",
  "/explore",
  "/plan",
  "/trips",
  "/impact",
  "/challenges",
  "/community",
  "/twin",
  "/reports",
  "/profile",
];

const RAIL_LABELS: Record<string, string> = {
  "/trips": "Trips",
  "/impact": "Impact & Sustainability",
  "/profile": "Settings",
};

/** The rail's own destination for planning — a CTA in the header, a page here. */
const PLAN_ITEM: NavItem = {
  href: "/plan",
  label: "Plan a Trip",
  short: "Plan a Trip",
  icon: Plane,
};

const DASHBOARD_ART =
  "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=640&h=800&fit=crop&auto=format";

function railItems(): NavItem[] {
  const ordered = RAIL_ORDER.map(
    (href) => NAV_ITEMS.find((item) => item.href === href) ?? (href === "/plan" ? PLAN_ITEM : null),
  ).filter((item): item is NavItem => item !== null);

  const leftovers = NAV_ITEMS.filter((item) => !RAIL_ORDER.includes(item.href));
  return [...ordered, ...leftovers];
}

const RAIL_ITEMS = railItems();

export function AppSidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapsed,
}: {
  /** Mobile slide-over state. Ignored on large screens, where the rail is fixed. */
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-sand-200/70 bg-white transition-[width] duration-300 ease-out lg:block",
          collapsed ? "w-[4.75rem]" : "w-[15.5rem]",
        )}
      >
        <SidebarPanel
          collapsed={collapsed}
          onToggleCollapsed={onToggleCollapsed}
          onNavigate={onClose}
        />
      </aside>

      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="animate-fade-in absolute inset-0 bg-forest-950/40 backdrop-blur-sm"
          />
          <div className="animate-fade-in absolute inset-y-0 left-0 w-[16.5rem] shadow-2xl">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="absolute top-5 right-4 z-10 grid h-9 w-9 place-items-center rounded-xl border border-sand-200 bg-white text-sand-600 transition-colors hover:text-forest-900"
            >
              <X className="h-4 w-4" />
            </button>
            {/* The slide-over is always full width — collapsing is a desktop idea. */}
            <SidebarPanel collapsed={false} onNavigate={onClose} />
          </div>
        </div>
      )}
    </>
  );
}

function SidebarPanel({
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate: () => void;
}) {
  const { user, stats } = useApp();
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-white">
      <div
        className={cn(
          "flex items-center pt-5 pb-3",
          collapsed ? "flex-col gap-3 px-2" : "gap-3 px-4",
        )}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="group flex min-w-0 flex-1 items-center gap-3"
          aria-label="Travello dashboard"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-forest-500 to-forest-700 shadow-sm shadow-forest-800/25 transition-transform duration-200 group-hover:scale-105">
            <span className="text-base font-black text-white">T</span>
          </span>
          {!collapsed && (
            <span className="flex min-w-0 flex-col">
              <span className="text-lg leading-none font-black tracking-tight text-forest-950">
                Travello
              </span>
              <span className="mt-1.5 text-[10.5px] leading-tight font-semibold text-sand-500">
                Travel Smarter. Leave a
                <br />
                Greener Footprint.
              </span>
            </span>
          )}
        </Link>

        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-sand-200 bg-white text-sand-500 transition-colors hover:border-forest-200 hover:text-forest-800",
              collapsed && "mx-auto",
            )}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Mode badge */}
      {!collapsed && (
        <div className="px-4 pb-3">
          <span className="flex items-center gap-1.5 rounded-xl border border-forest-200/80 bg-forest-50 px-3 py-1.5 text-[11px] font-bold text-forest-800">
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />
            <span className="truncate capitalize">
              {user.role === "creator" ? "Creator" : "Traveller"} mode
            </span>
          </span>
        </div>
      )}

      <nav
        aria-label="All sections"
        className={cn(
          "flex-1 space-y-1 px-2.5 pt-1 pb-3",
          collapsed ? "overflow-visible" : "overflow-y-auto",
        )}
      >
        {RAIL_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);
          const label = RAIL_LABELS[item.href] ?? item.label;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
              className={cn(
                "group relative flex items-center rounded-xl text-[0.84rem] font-semibold transition-all duration-200",
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5",
                active
                  ? "bg-forest-800 text-white shadow-sm shadow-forest-900/25"
                  : "text-sand-600 hover:bg-forest-50 hover:text-forest-800",
              )}
            >
              <Icon
                className={cn(
                  "h-[1.05rem] w-[1.05rem] shrink-0",
                  active ? "text-primary-300" : "text-sand-400",
                )}
              />
              {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}

              {collapsed && (
                <span className="pointer-events-none absolute left-full z-50 ml-2.5 hidden rounded-lg bg-forest-950 px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap text-white shadow-lg group-hover:block group-focus-visible:block">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t border-sand-100", collapsed ? "p-2.5" : "p-3.5")}>
        {!collapsed && (
          <div className="relative mb-3 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DASHBOARD_ART}
              alt=""
              className="h-28 w-full object-cover saturate-[0.9]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/35 to-transparent" />
            <p className="absolute inset-x-3 bottom-3 font-serif text-[0.98rem] leading-snug font-semibold text-white italic">
              &ldquo;Better Journeys
              <br />
              A Greener Tomorrow&rdquo;
            </p>
          </div>
        )}

        <AccountBlock
          name={user.displayName}
          avatarUrl={user.avatarUrl}
          points={stats.points}
          role={user.role}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}

/**
 * The header's account dropdown, re-cut to open from the rail footer. Same
 * destinations and the same log-out call — there is only one implementation of
 * signing out in the app.
 */
function AccountBlock({
  name,
  avatarUrl,
  points,
  role,
  collapsed,
  onNavigate,
}: {
  name: string;
  avatarUrl: string;
  points: number;
  role: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* Even if the request fails we still send them to the landing page. */
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className={cn(
          "flex w-full items-center rounded-xl border bg-white transition-colors",
          collapsed ? "justify-center p-1.5" : "gap-2.5 p-1.5 pr-2",
          open ? "border-forest-300" : "border-sand-200 hover:border-forest-200",
        )}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg ring-2 ring-forest-500/15">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center bg-gradient-to-br from-forest-500 to-forest-700 text-xs font-bold text-white">
              {name.charAt(0)}
            </span>
          )}
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[0.78rem] leading-tight font-bold text-forest-950">
                {name}
              </span>
              <span className="block truncate text-[0.68rem] font-bold text-primary-700">
                {points.toLocaleString("en-IN")} pts
              </span>
            </span>
            <ChevronsRight
              className={cn(
                "h-4 w-4 shrink-0 text-sand-400 transition-transform duration-200",
                open ? "rotate-90" : "-rotate-90",
              )}
            />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className={cn(
            "animate-slide-up absolute bottom-full z-50 mb-2 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-xl",
            collapsed ? "left-0 w-60" : "right-0 left-0",
          )}
        >
          <div className="border-b border-sand-100 bg-sand-50/70 px-3.5 py-2.5">
            <p className="truncate text-xs font-bold text-forest-950">{name}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-sand-500">
              {points.toLocaleString("en-IN")} impact points ·{" "}
              {role === "creator" ? "Creator" : "Traveller"}
            </p>
          </div>

          <div className="p-1.5">
            <MenuRow
              href="/profile"
              icon={User}
              label="Your profile"
              onSelect={() => {
                setOpen(false);
                onNavigate();
              }}
            />
            <MenuRow
              href="/accessibility"
              icon={Accessibility}
              label="Accessibility profile"
              onSelect={() => {
                setOpen(false);
                onNavigate();
              }}
            />
            <MenuRow
              href="/trips"
              icon={Sparkles}
              label="Your trips"
              onSelect={() => {
                setOpen(false);
                onNavigate();
              }}
            />
          </div>

          <div className="border-t border-sand-100 p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuRow({
  href,
  icon: Icon,
  label,
  onSelect,
}: {
  href: string;
  icon: typeof User;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onSelect}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-sand-700 transition-colors hover:bg-forest-50 hover:text-forest-800"
    >
      <Icon className="h-4 w-4 text-sand-400" />
      {label}
    </Link>
  );
}
