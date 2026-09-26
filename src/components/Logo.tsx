import Link from "next/link";
import { clsx } from "clsx";

import Icon from "@/components/Icon";

export default function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "group inline-flex items-center gap-2.5 rounded-full",
        className,
      )}
      aria-label="Wayfare home"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft transition-transform duration-300 group-hover:scale-105">
        <Icon name="leaf" className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <span className="text-lg font-semibold tracking-tight text-ink-950">
        Wayfare
      </span>
    </Link>
  );
}
