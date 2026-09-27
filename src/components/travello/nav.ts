import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CloudSun,
  Compass,
  Hotel,
  LayoutDashboard,
  Leaf,
  MapPin,
  Trophy,
  User,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Compact label for tight spaces (top bar, bottom bar) — never wraps. */
  short: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar (kept to five for thumb reach). */
  mobile?: boolean;
};

/** One navigation model for the whole product — no page defines its own. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", short: "Dashboard", icon: LayoutDashboard, mobile: true },
  { href: "/explore", label: "Explore", short: "Explore", icon: Compass, mobile: true },
  { href: "/trips", label: "Your Trips", short: "Trips", icon: MapPin, mobile: true },
  { href: "/challenges", label: "Eco Challenges", short: "Challenges", icon: Trophy, mobile: true },
  { href: "/impact", label: "My Impact", short: "Impact", icon: Leaf },
  { href: "/twin", label: "Digital Twin", short: "Twin", icon: CloudSun },
  {
    href: "/hospitality",
    label: "Sustainable Hospitality",
    short: "Hospitality",
    icon: Hotel,
  },
  { href: "/reports", label: "Reports", short: "Reports", icon: BarChart3 },
  { href: "/community", label: "Community", short: "Community", icon: Users, mobile: true },
  { href: "/profile", label: "Profile", short: "Profile", icon: User },
];

/**
 * The five sections that earn a permanent seat in the primary navigation.
 *
 * This list is the single source of truth for *both* layouts: the top header's
 * centre rail and the application sidebar each split `NAV_ITEMS` through it, so
 * a section can never appear in one and go missing from the other.
 */
export const PRIMARY_NAV_HREFS = [
  "/dashboard",
  "/explore",
  "/trips",
  "/challenges",
  "/impact",
] as const;

function isPrimary(href: string): boolean {
  return (PRIMARY_NAV_HREFS as readonly string[]).includes(href);
}

/** The everyday sections — always visible, never behind a menu. */
export const PRIMARY_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter((item) =>
  isPrimary(item.href),
);

/** The quieter sections, kept one tap away so the primary list stays short. */
export const MORE_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter(
  (item) => !isPrimary(item.href),
);

/** True when `href` is the current section (so `/explore/goa` lights Explore). */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
