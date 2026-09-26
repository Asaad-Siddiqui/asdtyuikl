import Logo from "@/components/Logo";

const LINKS = [
  { href: "/#explore", label: "Explore" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#businesses", label: "For Businesses" },
  { href: "/auth?mode=login", label: "Login" },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-ink-500">
            Personalized, accessible and lower-impact travel. Phase 1 of the
            Wayfare platform.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-ink-600 transition-colors hover:text-brand-700"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-ink-200">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-ink-400 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Wayfare. Built for the sustainable &
          accessible travel hackathon.
        </p>
      </div>
    </footer>
  );
}
