"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Accessibility,
  ChevronDown,
  LogOut,
  Menu,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { BottomNav } from "@/components/travello/BottomNav";
import { useApp } from "@/components/travello/AppProvider";
import { NAV_ITEMS, isNavActive, type NavItem } from "@/components/travello/nav";
import { cn } from "@/lib/format";

/**
 * The single application shell.
 *
 * One header, one navigation model, one mobile bar. The header is deliberately
 * one row at every width: five primary sections live in the centred pill rail,
 * the quieter sections sit behind "More", and everything else is in the account
 * menu. The rail never wraps, so the bar can never break into two lines.
 */

/** The five sections that earn a permanent seat in the top rail. */
const PRIMARY_HREFS = [
  "/dashboard",
  "/explore",
  "/trips",
  "/challenges",
  "/impact",
];

const PRIMARY_ITEMS = NAV_ITEMS.filter((item) =>
  PRIMARY_HREFS.includes(item.href),
);
const MORE_ITEMS = NAV_ITEMS.filter(
  (item) => !PRIMARY_HREFS.includes(item.href),
);

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mesh">
      <TravelloHeader />
      <main id="main" className="pb-24 lg:pb-12">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

/** Closes a popover on outside click or Escape. Shared by both menus. */
function useDismiss(
  open: boolean,
  close: () => void,
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return ref;
}

function TravelloHeader() {
  const { user, stats } = useApp();
  const pathname = usePathname();

  const moreActive = MORE_ITEMS.some((item) => isNavActive(pathname, item.href));

  return (
    <header className="glass sticky top-0 z-50 border-b border-sand-200/60 shadow-2xs backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[90rem] items-center gap-3 px-4 sm:px-6 lg:gap-5">
        <Brand />

        <nav
          aria-label="Main"
          className="mx-auto hidden items-center gap-1 rounded-2xl border border-sand-200/70 bg-white/70 p-1.5 shadow-2xs backdrop-blur-md lg:flex"
        >
          {PRIMARY_ITEMS.map((item) => (
            <NavPill key={item.href} item={item} pathname={pathname} />
          ))}
          <MoreMenu pathname={pathname} active={moreActive} />
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <RoleBadge role={user.role} />

          <Link
            href="/plan"
            className="hidden items-center gap-2 rounded-xl bg-forest-800 px-4 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-sm shadow-forest-900/20 transition-all duration-200 hover:-translate-y-px hover:bg-forest-900 active:translate-y-0 sm:inline-flex"
          >
            <Sparkles className="h-4 w-4 text-emerald-300" />
            Plan a Trip
          </Link>

          <AccountMenu
            name={user.displayName}
            avatarUrl={user.avatarUrl}
            points={stats.points}
            role={user.role}
          />

          <MobileMenu pathname={pathname} />
        </div>
      </div>
    </header>
  );
}

function Brand() {
  return (
    <Link
      href="/dashboard"
      className="group flex shrink-0 items-center gap-3"
      aria-label="Travello dashboard"
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-forest-600 to-forest-800 shadow-md shadow-forest-700/25 transition-transform duration-200 group-hover:scale-105">
        <span className="text-lg font-black tracking-tight text-white">T</span>
      </span>
      <span className="hidden flex-col sm:flex">
        <span className="text-xl leading-none font-black tracking-tight text-forest-950 transition-colors group-hover:text-forest-700">
          Travello
        </span>
        <span className="mt-1 text-[10px] leading-none font-bold tracking-wider text-forest-600 uppercase">
          Green &amp; Inclusive
        </span>
      </span>
    </Link>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="hidden items-center gap-1.5 rounded-xl border border-forest-200/80 bg-forest-50 px-3 py-1.5 text-xs font-bold text-forest-800 shadow-2xs xl:flex">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      <span className="capitalize">
        {role === "creator" ? "Creator" : "Traveller"} mode
      </span>
    </span>
  );
}

const PILL_BASE =
  "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200";
const PILL_ACTIVE = "bg-forest-700 text-white shadow-sm shadow-forest-800/20";
const PILL_IDLE = "text-sand-700 hover:bg-forest-50/80 hover:text-forest-800";

function NavPill({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const Icon = item.icon;
  const active = isNavActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(PILL_BASE, active ? PILL_ACTIVE : PILL_IDLE)}
    >
      <Icon
        className={cn("h-4 w-4 shrink-0", active ? "text-emerald-300" : "text-sand-400")}
      />
      {item.short}
    </Link>
  );
}

/** The quieter sections, kept one tap away so the rail stays short. */
function MoreMenu({ pathname, active }: { pathname: string; active: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(PILL_BASE, active ? PILL_ACTIVE : PILL_IDLE)}
      >
        More
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180",
            active ? "text-emerald-300" : "text-sand-400",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="More sections"
          className="animate-slide-down absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-sand-200 bg-white p-1.5 shadow-xl"
        >
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            const itemActive = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                aria-current={itemActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  itemActive
                    ? "bg-forest-50 text-forest-800"
                    : "text-sand-700 hover:bg-forest-50 hover:text-forest-800",
                )}
              >
                <Icon className="h-4 w-4 text-sand-400" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AccountMenu({
  name,
  avatarUrl,
  points,
  role,
}: {
  name: string;
  avatarUrl: string;
  points: number;
  role: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));

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
          "flex items-center gap-2.5 rounded-2xl border bg-white p-1 pr-2.5 transition-all duration-200 sm:pr-3",
          open
            ? "border-forest-400 shadow-md shadow-forest-900/10"
            : "border-sand-200 hover:border-forest-300",
        )}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl ring-2 ring-forest-500/20 sm:h-10 sm:w-10">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center bg-gradient-to-br from-forest-500 to-forest-700 text-sm font-bold text-white">
              {name.charAt(0)}
            </span>
          )}
        </span>
        <span className="hidden text-left md:block">
          <span className="block max-w-[9rem] truncate text-[0.8rem] leading-tight font-bold text-forest-950">
            {name.split(" ")[0]}
          </span>
          <span className="block text-[0.7rem] font-bold text-emerald-700">
            {points.toLocaleString("en-IN")} pts
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-sand-500 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="animate-slide-down absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-xl"
        >
          <div className="border-b border-sand-100 bg-sand-50/70 px-4 py-3">
            <p className="truncate text-sm font-bold text-forest-950">{name}</p>
            <p className="mt-0.5 text-xs font-semibold text-sand-600">
              {points.toLocaleString("en-IN")} impact points ·{" "}
              {role === "creator" ? "Creator" : "Traveller"}
            </p>
          </div>

          <div className="p-1.5">
            <MenuLink
              href="/profile"
              icon={User}
              label="Your profile"
              onSelect={() => setOpen(false)}
            />
            <MenuLink
              href="/accessibility"
              icon={Accessibility}
              label="Accessibility profile"
              onSelect={() => setOpen(false)}
            />
            <MenuLink
              href="/trips"
              icon={Sparkles}
              label="Your trips"
              onSelect={() => setOpen(false)}
            />
          </div>

          <div className="border-t border-sand-100 p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
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

function MenuLink({
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
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-sand-700 transition-colors hover:bg-forest-50 hover:text-forest-800"
    >
      <Icon className="h-4 w-4 text-sand-400" />
      {label}
    </Link>
  );
}

function MobileMenu({ pathname }: { pathname: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="app-mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="grid h-11 w-11 place-items-center rounded-2xl border border-sand-200 bg-white text-sand-600 transition-colors hover:text-forest-800 lg:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div
          id="app-mobile-menu"
          className="animate-slide-down fixed inset-x-0 top-[76px] z-40 border-t border-sand-200/70 bg-white shadow-xl lg:hidden"
        >
          <nav
            aria-label="All sections"
            className="mx-auto max-h-[calc(100dvh-76px)] max-w-lg space-y-1.5 overflow-y-auto px-4 py-4"
          >
            <Link
              href="/plan"
              onClick={() => setOpen(false)}
              className="mb-2 flex items-center justify-center gap-2 rounded-2xl bg-forest-800 px-4 py-3.5 text-sm font-bold text-white"
            >
              <Sparkles className="h-4 w-4 text-emerald-300" />
              Plan a Trip
            </Link>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-[0.95rem] font-semibold transition-colors",
                    active
                      ? "bg-forest-700 text-white"
                      : "text-sand-700 hover:bg-sand-100",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      active ? "text-emerald-300" : "text-sand-400",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}

            <Link
              href="/accessibility"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-[0.95rem] font-semibold text-sand-700 transition-colors hover:bg-sand-100"
            >
              <Accessibility className="h-5 w-5 text-sand-400" />
              Accessibility profile
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-bold text-red-600 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
