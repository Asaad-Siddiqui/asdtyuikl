import Link from "next/link";

import { buttonClasses } from "@/components/Button";
import Icon from "@/components/Icon";

export const metadata = { title: "Trip not found" };

export default function TripNotFound() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="card max-w-md p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sand-100 text-sand-500">
          <Icon name="mapPin" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-forest-950">
          We couldn&apos;t find that trip
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-sand-700">
          It may have been removed, or it belongs to a different account. Your
          own trips are always on your trips page.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/trips"
            className={buttonClasses({ variant: "primary", size: "md" })}
          >
            Your trips
          </Link>
          <Link
            href="/plan"
            className={buttonClasses({ variant: "secondary", size: "md" })}
          >
            Plan a new trip
          </Link>
        </div>
      </div>
    </main>
  );
}
