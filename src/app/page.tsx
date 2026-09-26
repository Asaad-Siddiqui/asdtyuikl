import BusinessesSection from "@/components/BusinessesSection";
import ComingNext from "@/components/ComingNext";
import FeatureCard from "@/components/FeatureCard";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: "accessibility" as const,
    title: "Personalized",
    description:
      "Travel recommendations based on your individual accessibility requirements.",
  },
  {
    icon: "leaf" as const,
    title: "Sustainable",
    description:
      "Compare environmental impact and discover greener travel choices.",
  },
  {
    icon: "sparkles" as const,
    title: "Intelligent",
    description: "AI helps create travel recommendations around your needs.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <>
      <Navbar userName={user?.name ?? null} />

      <main id="main" className="flex-1">
        <Hero />

        <section
          aria-labelledby="features-heading"
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase">
              Why Wayfare
            </p>
            <h2
              id="features-heading"
              className="mt-3 text-3xl font-semibold sm:text-4xl"
            >
              Built around you, not the average traveller
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.08}
              />
            ))}
          </div>
        </section>

        <HowItWorks />
        <ComingNext />
        <BusinessesSection />
      </main>

      <Footer />
    </>
  );
}
