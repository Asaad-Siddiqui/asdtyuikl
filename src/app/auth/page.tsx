import Link from "next/link";
import { redirect } from "next/navigation";

import AuthForm from "@/components/AuthForm";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";
import { getProfileData } from "@/lib/profile-service";
import type { IconName } from "@/lib/icons";

export const dynamic = "force-dynamic";

export const metadata = { title: "Log in or create an account" };

const BENEFITS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "accessibility",
    title: "Your needs, respected",
    body: "Tell us once what makes travel work for you.",
  },
  {
    icon: "leaf",
    title: "Lower-impact choices",
    body: "Compare sustainability scores for every suggestion.",
  },
  {
    icon: "lock",
    title: "Stored securely",
    body: "Passwords are hashed and data stays private to you.",
  },
];

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // Already signed in? Skip straight to the right step of the journey.
  const user = await getCurrentUser();
  if (user) {
    const profile = await getProfileData(user.id);
    redirect(profile.completed ? "/dashboard" : "/profile");
  }

  const rawMode = params.mode;
  const modeValue = Array.isArray(rawMode) ? rawMode[0] : rawMode;
  const mode = modeValue === "login" ? "login" : "signup";

  const reasonValue = Array.isArray(params.reason)
    ? params.reason[0]
    : params.reason;
  const notice =
    reasonValue === "session"
      ? "Your session expired for security reasons. Please log in again."
      : null;

  return (
    <>
      <div className="flex flex-1 flex-col">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Logo />
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-ink-600 hover:text-brand-700"
          >
            How it works
          </Link>
        </header>

        <main id="main" className="flex-1">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-14">
            <section
              aria-hidden="true"
              className="relative hidden overflow-hidden rounded-[var(--radius-xl2)] bg-gradient-to-br from-brand-700 via-brand-800 to-ink-900 p-10 lg:flex lg:flex-col lg:justify-between"
            >
              <div
                className="pointer-events-none absolute -top-20 -right-10 h-64 w-64 rounded-full bg-brand-400/25 blur-3xl"
              />
              <div className="relative">
                <p className="text-xs font-semibold tracking-wide text-brand-200 uppercase">
                  Phase 1
                </p>
                <h2 className="mt-4 text-3xl font-semibold text-white">
                  One profile. Travel that finally fits.
                </h2>
                <p className="mt-4 max-w-md text-base leading-relaxed text-brand-50/85">
                  We use your answers to score destinations and stays against
                  what you actually need — not an average traveller.
                </p>
              </div>

              <ul className="relative mt-10 space-y-3">
                {BENEFITS.map((benefit) => (
                  <li
                    key={benefit.title}
                    className="flex items-start gap-3.5 rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-100">
                      <Icon name={benefit.icon} className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {benefit.title}
                      </p>
                      <p className="text-sm text-brand-50/75">{benefit.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mx-auto flex w-full max-w-md flex-col justify-center">
              <div className="card p-6 sm:p-8">
                <AuthForm initialMode={mode} notice={notice} />
              </div>
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
