import Link from "next/link";
import { clsx } from "clsx";

/**
 * The Travello lockup.
 *
 * `public/travello-logo.png` is the supplied logo with its white background
 * removed, so the mark and wordmark sit cleanly on the navbar, the footer and
 * any other light surface without a white plate behind them.
 */
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
      className={clsx("inline-flex items-center", className)}
      aria-label="Travello home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/travello-logo.png"
        alt=""
        width={1376}
        height={319}
        className="h-8 w-auto sm:h-9"
      />
      <span className="sr-only">TRAVELLO</span>
    </Link>
  );
}
