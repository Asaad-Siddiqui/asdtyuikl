import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Compass,
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
  { href: "/reports", label: "Reports", short: "Reports", icon: BarChart3 },
  { href: "/community", label: "Community", short: "Community", icon: Users, mobile: true },
  { href: "/profile", label: "Profile", short: "Profile", icon: User },
];

/** True when `href` is the current section (so `/explore/goa` lights Explore). */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
