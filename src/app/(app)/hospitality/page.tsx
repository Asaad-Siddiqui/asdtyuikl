import HospitalityPage from "@/components/travello/pages/HospitalityPage";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sustainable Hospitality" };

/**
 * Sustainable Hospitality — the small business-facing flow bolted onto the
 * existing app: a ten-point checklist, a derived score out of 100, the two
 * things worth fixing next, and a separate traveller rating. No separate
 * dashboard; it reads the same catalogue and provider as every other page.
 */
export default function SustainableHospitalityPage() {
  return <HospitalityPage />;
}
