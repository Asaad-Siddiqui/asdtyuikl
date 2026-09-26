"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Accessibility,
  ChevronDown,
  Leaf,
  LogOut,
  Menu,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { BottomNav } from "@/components/travello/BottomNav";
import { useApp } from "@/components/travello/AppProvider";
import { NAV_ITEMS, isNavActive } from "@/components/travello/nav";
import { cn } from "@/lib/format";

/**
 * The single application shell.
 *
 * One header, one navigation model, one mobile bar. The header is deliberately
 * a single row at every width: the nav strip never wraps (it scrolls if the
 * viewport is unusually narrow), and the account menu always exposes Profile,
 * the accessibility profile and Log out.
 */
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

function TravelloHeader() {
  const { user, stats } = useApp();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-sand-200/70 bg-white/85 shadow-2xs backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[90rem] items-center gap-4 px-4 sm:px-6 lg:gap-6">
        <Link
          href="/dashboard"
          className="group flex shrink-0 items-center gap-3"
          aria-label="Travello dashboard"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-forest-600 to-forest-800 shadow-md shadow-forest-700/25 transition-transform group-hover:scale-105">
            <Leaf className="h-6 w-6 fill-current text-emerald-100" />
          </span>
          <span className="text-2xl font-black tracking-tight text-forest-950">
            Travello
          </span>
        </Link>

        {/* Nav strip — never wraps; scrolls only if the viewport demands it. */}
        <nav
          aria-label="Main"
          className="scrollbar-hide hidden min-w-0 flex-1 items-center gap-1.5 overflow-x-auto lg:flex"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-[0.95rem] font-semibold whitespace-nowrap transition-all duration-200",
                  active
                    ? "bg-forest-700 text-white shadow-sm shadow-forest-800/25"
                    : "text-sand-700 hover:bg-forest-50 hover:text-forest-800",
                )}
              >
                <Icon
                  className={cn(
                    "h-[1.15rem] w-[1.15rem] shrink-0",
                    active ? "text-emerald-300" : "text-sand-400",
                  )}
                />
                {item.short}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:gap-3">
          <Link
            href="/plan"
            className="hidden items-center gap-2 rounded-xl bg-forest-800 px-4 py-3 text-sm font-bold whitespace-nowrap text-white shadow-sm shadow-forest-900/20 transition-colors hover:bg-forest-900 sm:inline-flex"
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className={cn(
          "flex items-center gap-2.5 rounded-2xl border bg-white p-1 pr-2.5 transition-all sm:pr-3",
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
          <span className="block text-[0.8rem] leading-tight font-bold text-forest-950">
            {name}
          </span>
          <span className="block text-[0.7rem] font-bold text-emerald-700">
            {points.toLocaleString("en-IN")} pts
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-sand-500 transition-transform",
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
            <p className="text-sm font-bold text-forest-950">{name}</p>
            <p className="mt-0.5 text-xs font-semibold text-sand-600">
              {points.toLocaleString("en-IN")} impact points ·{" "}
              {role === "creator" ? "Creator" : "Traveller"}
            </p>
          </div>

          <div className="p-1.5">
            <MenuLink href="/profile" icon={User} label="Your profile" onSelect={() => setOpen(false)} />
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
          className="animate-slide-down fixed inset-x-0 top-[72px] z-40 border-t border-sand-200/70 bg-white shadow-xl lg:hidden"
        >
          <nav aria-label="All sections" className="mx-auto max-w-lg space-y-1.5 px-4 py-4">
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
