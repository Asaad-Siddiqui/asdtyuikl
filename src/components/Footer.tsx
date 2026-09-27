import Link from "next/link";

import Logo from "@/components/Logo";

const LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/challenges", label: "Eco Challenges" },
  { href: "/impact", label: "My Impact" },
  { href: "/community", label: "Community" },
  { href: "/auth?mode=login", label: "Login" },
];

export default function Footer() {
  return (
    <footer className="border-t border-forest-100 bg-gradient-to-b from-forest-50/70 to-[#eef2f8]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-pretty text-sm leading-relaxed text-sand-700">
            AI-powered sustainable and accessible travel. Plan lower-footprint
            trips, complete eco-challenges and track your real impact.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="rounded text-sm font-medium text-ink-600 transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-forest-100">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-ink-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Travello. Built for the sustainable &
          accessible travel hackathon.
        </p>
      </div>
    </footer>
  );
}
