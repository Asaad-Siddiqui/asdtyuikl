import { notFound, redirect } from "next/navigation";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import TripResultView from "@/components/TripResultView";
import { getCurrentUser } from "@/lib/auth";
import { getTrip } from "@/lib/trip-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return { title: "Your trip" };
  const { id } = await params;
  const trip = await getTrip(user.id, id);
  return { title: trip ? trip.title : "Your trip" };
}

export default async function TripResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?reason=session");

  const { id } = await params;
  // Scoped by user id: another traveller's trip id simply resolves to nothing.
  const trip = await getTrip(user.id, id);
  if (!trip) notFound();

  return (
    <>
      <Navbar userName={user.name} variant="app" />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <TripResultView trip={trip} />
        </div>
      </main>
      <Footer />
    </>
  );
}
