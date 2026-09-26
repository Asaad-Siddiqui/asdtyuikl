import Link from "next/link";
import { redirect } from "next/navigation";

import { ButtonLink } from "@/components/Button";
import DashboardSection from "@/components/DashboardSection";
import DestinationCard from "@/components/DestinationCard";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import LogoutButton from "@/components/LogoutButton";
import Navbar from "@/components/Navbar";
import ProfileSummary from "@/components/ProfileSummary";
import { getCurrentUser } from "@/lib/auth";
import { recommendDestinations } from "@/lib/destinations";
import { getProfileData } from "@/lib/profile-service";
import { preferenceRows } from "@/lib/profile-summary";
import { listTrips, type SavedTrip } from "@/lib/trip-service";
import { formatCo2, formatDateRange, formatINR } from "@/lib/trip-options";
import type { IconName } from "@/lib/icons";

export const dynamic = "force-dynamic";

export const metadata = { title: "Your dashboard" };

const CAPABILITIES: { title: string; body: string; icon: IconName }[] = [
  {
    title: "Two options to compare",
    body: "Lower-impact versus comfort-first, ranked against your needs.",
    icon: "compass",
  },
  {
    title: "Real estimated emissions",
    body: "Every plan shows how its CO₂ estimate was calculated.",
    icon: "leaf",
  },
  {
    title: "Modify until it fits",
    body: "Ask for changes in plain language before you confirm.",
    icon: "edit",
  },
  {
    title: "Download a real PDF",
    body: "A proper document generated from your saved itinerary.",
    icon: "download",
  },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?reason=session");

  const [profile, trips] = await Promise.all([
    getProfileData(user.id),
    listTrips(user.id),
  ]);

  // The dashboard depends on a completed profile.
  if (!profile.completed) redirect("/profile");

  const destinations = recommendDestinations(profile, 6);
  const priorities = preferenceRows(profile);
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <Navbar userName={user.name} variant="app" />

      <main id="main" className="flex-1">
        <div className="mx-auto max-w-6xl space-y-12 px-4 pt-10 pb-16 sm:px-6 lg:px-8">
          <header className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold sm:text-4xl">
                {greeting()}, {firstName}{" "}
                <span aria-hidden="true">👋</span>
              </h1>
              <p className="mt-3 text-base leading-relaxed text-ink-600">
                Your travel experience is personalized around your needs.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/plan" size="lg">
                Plan My Trip
                <Icon name="arrowRight" className="h-4.5 w-4.5" />
              </ButtonLink>
              <LogoutButton />
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
            <ProfileSummary
              profile={profile}
              title="Your travel profile"
              hint="These values come straight from your saved profile."
            />

            <section aria-label="Your travel priorities" className="card p-5 sm:p-6">
              <h2 className="text-base font-semibold">Your priorities</h2>
              <p className="mt-1.5 text-xs text-ink-500">
                We weight recommendations using these levels.
              </p>

              <ul className="mt-5 space-y-4">
                {priorities.map((preference) => (
                  <li key={preference.key}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-ink-700">
                        <Icon
                          name={preference.icon}
                          className="h-4 w-4 text-ink-400"
                        />
                        {preference.label}
                      </span>
                      <span className="text-xs font-semibold text-brand-700">
                        {preference.label2}
                      </span>
                    </div>
                    <div
                      className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100"
                      role="img"
                      aria-label={`${preference.label}: ${preference.label2}`}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                        style={{ width: `${preference.value}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Your trips — always fetched from Neon, never hardcoded. */}
          <DashboardSection
            id="trips"
            eyebrow="Saved trips"
            icon="mapPin"
            title="Your trips"
            description="Confirmed itineraries saved to your account. Only you can see these."
            action={
              trips.length > 0 ? (
                <ButtonLink href="/plan" variant="secondary" size="md">
                  Plan another trip
                </ButtonLink>
              ) : undefined
            }
          >
            {trips.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border border-dashed border-ink-300 bg-canvas p-8 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <Icon name="compass" className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-base font-semibold">
                  No trips planned yet
                </h3>
                <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-500">
                  Answer a few quick questions and we&apos;ll build two
                  itinerary options matched to your accessibility profile.
                </p>
                <div className="mt-5 flex justify-center">
                  <ButtonLink href="/plan">
                    Plan My Trip
                    <Icon name="arrowRight" className="h-4.5 w-4.5" />
                  </ButtonLink>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-4 text-xs text-ink-400">
                  {trips.length} saved trip{trips.length === 1 ? "" : "s"} ·
                  fetched from your account in Neon
                </p>
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {trips.map((trip) => (
                    <li key={trip.id}>
                      <TripCard trip={trip} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </DashboardSection>

          <DashboardSection
            id="destinations"
            eyebrow="Recommended for you"
            icon="mapPin"
            title="Destinations matched to your profile"
            description="Ranked against your accessibility needs and sustainability priorities. Use these as inspiration for your next trip."
          >
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((scored) => (
                <li key={scored.destination.id}>
                  <DestinationCard scored={scored} />
                </li>
              ))}
            </ul>
          </DashboardSection>

          <DashboardSection
            id="whats-included"
            eyebrow="Included now"
            icon="sparkles"
            title="What trip planning does for you"
            description="Everything below runs server-side against your saved profile."
          >
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CAPABILITIES.map((item) => (
                <li
                  key={item.title}
                  className="rounded-[var(--radius-card)] border border-ink-200 bg-surface p-5"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </DashboardSection>
        </div>
      </main>

      <Footer />
    </>
  );
}

function TripCard({ trip }: { trip: SavedTrip }) {
  const travelers = trip.adults + trip.children + trip.elderly;

  return (
    <article className="card card-hover flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-ink-900">
          {trip.toLocation}
        </h3>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
          {trip.status}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-500">
        {trip.fromLocation} → {trip.toLocation}
      </p>
      <p className="mt-1.5 text-sm font-medium text-ink-700">
        {formatDateRange(trip.startDate, trip.endDate)}
      </p>
      <p className="text-xs text-ink-500">
        {travelers} traveller{travelers === 1 ? "" : "s"}
        {trip.dataSource === "prototype" ? " · prototype plan" : ""}
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <TripStat label="Cost" value={formatINR(trip.totalCost)} />
        <TripStat label="Est. CO₂" value={formatCo2(trip.estimatedCo2)} />
        <TripStat label="Access" value={`${trip.accessibilityScore}%`} />
      </dl>

      <p className="mt-3 text-[11px] text-ink-400">
        Sustainability {trip.sustainabilityScore}/100 (prototype)
      </p>

      <div className="mt-auto pt-5">
        <Link
          href={`/trips/${trip.id}`}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-ink-200 bg-surface px-5 text-sm font-medium text-ink-800 transition-colors hover:border-brand-300 hover:text-brand-700"
        >
          View Trip
          <Icon name="arrowRight" className="h-4.5 w-4.5" />
        </Link>
      </div>
    </article>
  );
}

function TripStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-canvas px-2.5 py-2">
      <dt className="text-[10px] font-medium text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-xs font-semibold text-ink-900">{value}</dd>
    </div>
  );
}
