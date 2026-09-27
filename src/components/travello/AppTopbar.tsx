"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Accessibility,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  User,
} from "lucide-react";

import { useApp } from "@/components/travello/AppProvider";
import { cn } from "@/lib/format";

/**
 * The one top bar for every signed-in page: search, notifications, account.
 *
 * Search hands off to Explore (the catalogue surface) rather than being
 * decorative, and the bell lists the traveller's own open reports so the badge
 * can never disagree with the Reports page.
 */
export function AppTopbar({ onOpenNav }: { onOpenNav: () => void }) {
  const { user, reports } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<"none" | "bell" | "account">("none");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const openReports = reports.filter((report) => report.status !== "resolved");

  useEffect(() => {
    if (menu === "none") return;
    function onPointerDown(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setMenu("none");
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu("none");
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menu]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    router.push("/explore");
  }

  return (
    <div className="sticky top-0 z-40 border-b border-sand-200/70 bg-white/90 backdrop-blur-xl">
      <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sand-200 bg-white text-sand-600 transition-colors hover:text-forest-900 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form role="search" onSubmit={submitSearch} className="min-w-0 flex-1">
          <label className="relative block">
            <span className="sr-only">Search Travello</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-sand-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search trips, destinations, or anything…"
              className="w-full rounded-xl border border-sand-200 bg-sand-50/70 py-2.5 pr-4 pl-11 text-sm font-medium text-forest-900 transition-colors placeholder:text-sand-400 hover:border-sand-300 focus:border-forest-500 focus:bg-white focus:outline-none"
            />
          </label>
        </form>

        <div ref={wrapperRef} className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu(menu === "bell" ? "none" : "bell")}
              aria-expanded={menu === "bell"}
              aria-haspopup="menu"
              aria-label={`Notifications, ${openReports.length} open`}
              className={cn(
                "relative grid h-10 w-10 place-items-center rounded-xl border bg-white transition-colors",
                menu === "bell"
                  ? "border-forest-300 text-forest-800"
                  : "border-sand-200 text-sand-500 hover:text-forest-800",
              )}
            >
              <Bell className="h-4.5 w-4.5" />
              {openReports.length > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
                  {openReports.length}
                </span>
              )}
            </button>

            {menu === "bell" && (
              <div
                role="menu"
                aria-label="Open reports"
                className="animate-slide-down absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-xl"
              >
                <div className="border-b border-sand-100 px-4 py-3">
                  <p className="text-sm font-bold text-forest-950">
                    Open incident reports
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-sand-500">
                    {openReports.length} awaiting ranger review
                  </p>
                </div>
                <ul className="max-h-72 overflow-y-auto p-1.5">
                  {openReports.slice(0, 5).map((report) => (
                    <li key={report.id}>
                      <Link
                        href="/reports"
                        onClick={() => setMenu("none")}
                        className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-sand-50"
                      >
                        <p className="truncate text-xs font-bold text-forest-950 capitalize">
                          {report.category.replace("_", " ")}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-sand-500">
                          {report.description}
                        </p>
                      </Link>
                    </li>
                  ))}
                  {openReports.length === 0 && (
                    <li className="px-3 py-4 text-xs text-sand-500">
                      Nothing open. Every report you filed is resolved.
                    </li>
                  )}
                </ul>
                <Link
                  href="/reports"
                  onClick={() => setMenu("none")}
                  className="block border-t border-sand-100 px-4 py-3 text-xs font-bold text-forest-700 transition-colors hover:bg-forest-50"
                >
                  Go to Reports
                </Link>
              </div>
            )}
          </div>

          <AccountMenu
            open={menu === "account"}
            onToggle={() => setMenu(menu === "account" ? "none" : "account")}
            name={user.displayName}
            avatarUrl={user.avatarUrl}
            onClose={() => setMenu("none")}
          />
        </div>
      </div>
    </div>
  );
}

function AccountMenu({
  open,
  onToggle,
  onClose,
  name,
  avatarUrl,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  name: string;
  avatarUrl: string;
}) {
  const router = useRouter();
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

  const firstName = name.split(" ")[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className={cn(
          "flex items-center gap-2.5 rounded-xl border bg-white py-1.5 pr-2.5 pl-1.5 transition-colors sm:pr-3",
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
        <span className="hidden text-sm font-bold text-forest-950 sm:block">
          {firstName}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-sand-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="animate-slide-down absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-xl"
        >
          <div className="border-b border-sand-100 bg-sand-50/70 px-4 py-3">
            <p className="truncate text-sm font-bold text-forest-950">{name}</p>
            <p className="mt-0.5 text-xs font-semibold text-sand-500">
              Your Travello account
            </p>
          </div>
          <div className="p-1.5">
            <MenuRow
              href="/profile"
              icon={User}
              label="Your profile"
              onSelect={onClose}
            />
            <MenuRow
              href="/accessibility"
              icon={Accessibility}
              label="Accessibility profile"
              onSelect={onClose}
            />
          </div>
          <div className="border-t border-sand-100 p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60"
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
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-sand-700 transition-colors hover:bg-forest-50 hover:text-forest-800"
    >
      <Icon className="h-4 w-4 text-sand-400" />
      {label}
    </Link>
  );
}
