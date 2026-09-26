import { redirect } from "next/navigation";

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
import type { IconName } from "@/lib/icons";

export const dynamic = "force-dynamic";

export const metadata = { title: "Your dashboard" };

const UPCOMING: { title: string; body: string; icon: IconName }[] = [
  {
    title: "Carbon Footprint",
    body: "Emissions for every route and stay.",
    icon: "leaf",
  },
  {
    title: "Sustainable Stays",
    body: "Eco-certified, accessible accommodation.",
    icon: "mapPin",
  },
  {
    title: "Smart Itineraries",
    body: "Day plans optimized around your pace.",
    icon: "compass",
  },
  {
    title: "Accessibility Scores",
    body: "Independently verified place ratings.",
    icon: "accessibility",
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

  const profile = await getProfileData(user.id);

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
            <LogoutButton />
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

          <DashboardSection
            id="destinations"
            eyebrow="Recommended for you"
            icon="mapPin"
            title="Destinations matched to your profile"
            description="Ranked against your accessibility needs and sustainability priorities. Tap Explore to preview what's coming in Phase 2."
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
            id="coming-next"
            eyebrow="Coming next"
            icon="sparkles"
            title="Your profile is ready for these"
            description="Phase 1 stores everything these features need — no rebuilding later."
          >
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {UPCOMING.map((item) => (
                <li
                  key={item.title}
                  className="rounded-[var(--radius-card)] border border-dashed border-ink-300 bg-canvas p-5"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-100 text-ink-400">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-ink-700">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                    {item.body}
                  </p>
                  <span className="mt-4 inline-block rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
                    Coming soon
                  </span>
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
