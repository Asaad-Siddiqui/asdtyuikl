"use client";

import { useState } from "react";
import Link from "next/link";

import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import { buttonClasses } from "@/components/Button";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/challenges", label: "Eco Challenges" },
  { href: "/community", label: "Community" },
  { href: "/impact", label: "My Impact" },
];

export default function Navbar({
  userName,
  variant = "marketing",
}: {
  userName?: string | null;
  variant?: "marketing" | "app";
}) {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-canvas/85 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <Logo />

        {variant === "marketing" && (
          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="hidden items-center gap-2 md:flex">
          {userName ? (
            <>
              <Link
                href="/dashboard"
                className={buttonClasses({ variant: "ghost", size: "md" })}
              >
                {userName.split(" ")[0]}
              </Link>
              <Link
                href="/plan"
                className={buttonClasses({ variant: "primary", size: "md" })}
              >
                Plan a trip
              </Link>
              <Link
                href="/dashboard"
                className={buttonClasses({ variant: "secondary", size: "md" })}
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth?mode=login"
                className={buttonClasses({ variant: "ghost", size: "md" })}
              >
                Login
              </Link>
              <Link
                href="/auth?mode=signup"
                className={buttonClasses({ variant: "primary", size: "md" })}
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid h-11 w-11 place-items-center rounded-full border border-ink-200 bg-surface text-ink-700 md:hidden"
        >
          <Icon name={open ? "x" : "menu"} />
        </button>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="animate-[fade-in_0.2s_ease-out] border-t border-ink-200 bg-surface px-4 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {variant === "marketing" &&
              NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    className="block rounded-xl px-4 py-3 text-base font-medium text-ink-700 hover:bg-ink-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            {userName ? (
              <>
                <li>
                  <Link
                    href="/plan"
                    onClick={closeMenu}
                    className={buttonClasses({
                      variant: "primary",
                      size: "lg",
                      fullWidth: true,
                      className: "mt-2",
                    })}
                  >
                    Plan a trip
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className={buttonClasses({
                      variant: "secondary",
                      size: "lg",
                      fullWidth: true,
                      className: "mt-2",
                    })}
                  >
                    Go to Dashboard
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    href="/auth?mode=login"
                    onClick={closeMenu}
                    className="block rounded-xl px-4 py-3 text-base font-medium text-ink-700 hover:bg-ink-100"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth?mode=signup"
                    onClick={closeMenu}
                    className={buttonClasses({
                      variant: "primary",
                      size: "lg",
                      fullWidth: true,
                      className: "mt-2",
                    })}
                  >
                    Get Started
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
