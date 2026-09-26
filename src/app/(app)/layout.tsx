import Link from "next/link";
import { redirect } from "next/navigation";

import { AppProvider } from "@/components/travello/AppProvider";
import { AppShell } from "@/components/travello/AppShell";
import { buttonClasses } from "@/components/Button";
import { getCurrentUser } from "@/lib/auth";
import { loadAppData, type AppData } from "@/lib/travello-service";

export const dynamic = "force-dynamic";

/**
 * Protected application shell.
 *
 * Auth is resolved from the session cookie, then every Travello page receives
 * the same server-loaded dataset through the client provider. Data errors are
 * caught here and rendered as a friendly retry screen — never a stack trace.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?reason=session");

  let data: AppData | null = null;
  try {
    data = await loadAppData(user.id);
  } catch (error) {
    console.error("[app-layout] could not load app data:", error);
  }

  if (!data) return <DataUnavailable />;

  return (
    <AppProvider initial={data}>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}

function DataUnavailable() {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center bg-mesh px-4 py-20"
    >
      <div className="w-full max-w-md rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-sm">
        <span className="text-4xl" aria-hidden="true">
          🌿
        </span>
        <h1 className="mt-4 text-xl font-black text-forest-900">
          We couldn&apos;t load your Travello data
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-sand-600">
          Your account is fine — the connection to your travel data dropped. Try
          again in a moment.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className={buttonClasses({ variant: "primary", size: "md" })}
          >
            Try again
          </Link>
          <Link
            href="/"
            className={buttonClasses({ variant: "secondary", size: "md" })}
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
