import type { IconName } from "@/lib/icons";
import { clsx } from "clsx";

const PATHS: Record<IconName, React.ReactNode> = {
  accessibility: (
    <>
      <circle cx="12" cy="4.5" r="1.8" />
      <path d="M6.5 9.5h11" />
      <path d="M12 9.5v5" />
      <path d="m12 14.5-2.6 6" />
      <path d="m12 14.5 2.6 6" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.6 2.8 19.4a1 1 0 0 0 .86 1.5h16.68a1 1 0 0 0 .86-1.5L12 3.6Z" />
      <path d="M12 9.5v4.5" />
      <path d="M12 17.4h.01" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  bathroom: (
    <>
      <circle cx="12" cy="4.6" r="1.8" />
      <path d="M9.6 21V10.6a2.4 2.4 0 0 1 4.8 0V21" />
      <path d="M7 14.5h10" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.6 5.5 1.6 5.5H4.4S6 13.5 6 9.5Z" />
      <path d="M10.4 18.5a1.9 1.9 0 0 0 3.2 0" />
    </>
  ),
  braille: (
    <g fill="currentColor" stroke="none">
      <circle cx="8" cy="6" r="1.5" />
      <circle cx="16" cy="6" r="1.5" />
      <circle cx="8" cy="12" r="1.5" />
      <circle cx="16" cy="12" r="1.5" />
      <circle cx="8" cy="18" r="1.5" />
      <circle cx="16" cy="18" r="1.5" />
    </g>
  ),
  bus: (
    <>
      <rect x="4" y="4" width="16" height="13" rx="2.2" />
      <path d="M4 11h16" />
      <path d="M8 20v-3" />
      <path d="M16 20v-3" />
      <path d="M8 7.5h8" />
    </>
  ),
  captions: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.2" />
      <path d="M10.2 10.4a2.6 2.6 0 1 0 0 3.2" />
      <path d="M17.2 10.4a2.6 2.6 0 1 0 0 3.2" />
    </>
  ),
  check: <path d="m5 12.8 4.4 4.4L19 7.2" />,
  chevronLeft: <path d="m14.5 6-6 6 6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1 5.1-2.1Z" />
    </>
  ),
  ear: (
    <>
      <path d="M6.5 9.4a5.5 5.5 0 1 1 11 0c0 3.9-4 4.4-4 7.4a3 3 0 0 1-6 0" />
      <path d="M11 9.4a1.5 1.5 0 0 1 2.9.5" />
    </>
  ),
  elevator: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1.6" />
      <path d="M12 3v18" />
      <path d="m8.6 10.6 1.4-3 1.4 3" />
      <path d="m15.4 13.4-1.4 3-1.4-3" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6.2 5.6 12 5.6 21.5 12 21.5 12 17.8 18.4 12 18.4 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.9" />
    </>
  ),
  footsteps: (
    <g fill="currentColor" stroke="none">
      <path d="M7.2 4.4c-1.4 0-2.4 1.1-2.4 2.6 0 1.3.6 2.2.6 3.4 0 1-.6 1.7-.6 2.7 0 1.1.9 1.9 2 1.9s2-1 2-2.2c0-1.1-.5-1.8-.5-2.7 0-1.3.5-2.2.5-3.5 0-1.4-.7-2.2-1.6-2.2Z" />
      <path d="M16.8 8.6c-1.4 0-2.4 1.1-2.4 2.6 0 1.3.6 2.2.6 3.4 0 1-.6 1.7-.6 2.7 0 1.1.9 1.9 2 1.9s2-1 2-2.2c0-1.1-.5-1.8-.5-2.7 0-1.3.5-2.2.5-3.5 0-1.4-.7-2.2-1.6-2.2Z" />
    </g>
  ),
  hands: (
    <>
      <path d="M18 11V6.2a2 2 0 0 0-4 0" />
      <path d="M14 10.2V4.2a2 2 0 0 0-4 0v2.4" />
      <path d="M10 10.6V6.4a2 2 0 0 0-4 0V15" />
      <path d="M18 8.2a2 2 0 0 1 4 0V14a7 7 0 0 1-7 7h-2c-2.6 0-4.2-.8-5.6-2.2l-3.3-3.3a1.9 1.9 0 0 1 2.7-2.7L8.6 14" />
    </>
  ),
  leaf: (
    <>
      <path d="M11 20.5A7.5 7.5 0 0 1 9.8 6.05C15.5 4.95 17 4.4 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10.5-10 10.5Z" />
      <path d="M2 21.5c0-3 1.9-5.4 5.1-6C9.5 15 12 13.5 13 12.5" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10.5" width="16" height="10.2" rx="2.2" />
      <path d="M7.6 10.5V7.2a4.4 4.4 0 0 1 8.8 0v3.3" />
    </>
  ),
  logout: (
    <>
      <path d="M9.5 21H5.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 16.5 4.5-4.5L16 7.5" />
      <path d="M20.5 12H9.5" />
    </>
  ),
  mail: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
      <path d="m3 6.8 9 5.7 9-5.7" />
    </>
  ),
  mapPin: (
    <>
      <path d="M20 10.6c0 6-8 11.9-8 11.9s-8-5.9-8-11.9a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10.4" r="2.8" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  note: (
    <>
      <path d="M6.5 3h8.6L20 7.9V20a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14.5 3v5.4H20" />
      <path d="M9 13h6" />
      <path d="M9 16.6h4" />
    </>
  ),
  parking: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M10.2 16.5v-9h3a2.6 2.6 0 0 1 0 5.2h-3" />
    </>
  ),
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.4" />
      <path d="M11 18.6h2" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </>
  ),
  ramp: (
    <>
      <path d="M3 20.5h18" />
      <path d="M6 20.5v-6.2h4.2" />
      <path d="M10.2 14.3H20" />
    </>
  ),
  seat: (
    <>
      <path d="M6.5 18v-5.4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2V18" />
      <path d="M4 18h16" />
      <path d="M6.5 10.6V6.2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v4.4" />
    </>
  ),
  sign: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2.2" />
      <path d="M9 20.5h6" />
      <path d="M7 8h10" />
      <path d="M7 11.6h6" />
    </>
  ),
  sofa: (
    <>
      <path d="M5 12.2V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3.2" />
      <path d="M3 13a1.6 1.6 0 0 1 3.2 0v3H17.8v-3a1.6 1.6 0 0 1 3.2 0v4.8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V13Z" />
      <path d="M6 19v1.6" />
      <path d="M18 19v1.6" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3-1.6 4.9a2 2 0 0 1-1.3 1.3L4 10.8l5.1 1.6a2 2 0 0 1 1.3 1.3L12 18.6l1.6-4.9a2 2 0 0 1 1.3-1.3L20 10.8l-5.1-1.6a2 2 0 0 1-1.3-1.3L12 3Z" />
      <path d="M19 3v2.8" />
      <path d="M17.6 4.4h2.8" />
      <path d="M5 17.2v2.6" />
      <path d="M3.7 18.5h2.6" />
    </>
  ),
  support: (
    <>
      <path d="M4 14v-2.2a8 8 0 0 1 16 0V14" />
      <path d="M4 13.6h2.2a1 1 0 0 1 1 1v3.6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4.6Z" />
      <path d="M20 13.6h-2.2a1 1 0 0 0-1 1v3.6a1 1 0 0 0 1 1H19a1 1 0 0 0 1-1v-4.6Z" />
      <path d="M18.4 19.2v.4a2.4 2.4 0 0 1-2.4 2.4h-2.6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20.2a7 7 0 0 1 14 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9.2" cy="8" r="3.3" />
      <path d="M3 20.2a6.2 6.2 0 0 1 12.4 0" />
      <path d="M16.2 5.2a3.3 3.3 0 0 1 0 5.7" />
      <path d="M18.2 20.2a6.2 6.2 0 0 0-2.4-4.9" />
    </>
  ),
  utensils: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
  volume: (
    <>
      <path d="M11 4.6 6.6 8.6H3.2v6.8h3.4L11 19.4V4.6Z" />
      <path d="M15.4 9.2a4 4 0 0 1 0 5.6" />
      <path d="M18.4 6.6a8 8 0 0 1 0 10.8" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7.4A2.4 2.4 0 0 1 5.4 5H18a1 1 0 0 1 1 1v1.4" />
      <path d="M3 7.4v9.2A2.4 2.4 0 0 0 5.4 19H20a1 1 0 0 0 1-1v-7.6a1 1 0 0 0-1-1H5.4A2.4 2.4 0 0 1 3 7.4Z" />
      <path d="M16.6 12.6h.01" />
    </>
  ),
  x: (
    <>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </>
  ),
};

type IconProps = {
  name: IconName;
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
};

export default function Icon({
  name,
  className,
  strokeWidth = 1.7,
  ...rest
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={rest["aria-hidden"] ?? true}
      focusable="false"
      className={clsx("h-5 w-5 shrink-0", className)}
    >
      {PATHS[name]}
    </svg>
  );
}
