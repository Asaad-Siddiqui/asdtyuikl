"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, isNavActive } from "@/components/travello/nav";
import { cn } from "@/lib/format";

const MOBILE_ITEMS = NAV_ITEMS.filter((item) => item.mobile);

/** Thumb-reach navigation for phones; the header covers larger screens. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="glass fixed right-0 bottom-0 left-0 z-50 border-t border-sand-200/80 bg-white/92 shadow-lg backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-[56px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 transition-all duration-200",
                active
                  ? "scale-105 bg-forest-100/80 font-bold text-forest-800"
                  : "font-semibold text-forest-800 hover:text-forest-950",
              )}
            >
              <Icon
                className={cn("h-[1.35rem] w-[1.35rem]", active && "stroke-[2.5] text-forest-700")}
              />
              <span className="text-[11px] leading-none font-semibold tracking-tight whitespace-nowrap">
                {item.short}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
