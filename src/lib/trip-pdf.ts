import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import {
  DIETARY_LABELS,
  HEARING_LABELS,
  MOBILITY_LABELS,
  TRAVELER_TYPE_LABELS,
  VISUAL_LABELS,
} from "@/lib/profile-options";
import { MODE_LABELS } from "@/lib/trip-schema";
import type { FullTrip } from "@/lib/trip-service";

/**
 * Real, server-side PDF generation from stored structured data.
 *
 * Deliberately NOT a screenshot or print-to-PDF of the page: we lay out the
 * saved itinerary ourselves with embedded standard fonts, so the output is
 * crisp, selectable text derived from Postgres — never from raw AI output.
 */

const PAGE_WIDTH = 595.28; // A4 portrait
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const INK = rgb(0.11, 0.13, 0.12);
const MUTED = rgb(0.42, 0.45, 0.43);
const BRAND = rgb(0, 0.412, 0.804);
const RULE = rgb(0.85, 0.87, 0.86);

/**
 * Standard PDF fonts are WinAnsi encoded: strip or transliterate anything
 * outside Latin-1 so we never throw on an unusual character.
 */
function ascii(value: string): string {
  return value
    .replace(/₹/g, "Rs ")
    .replace(/₂/g, "2")
    .replace(/₃/g, "3")
    .replace(/→/g, "->")
    .replace(/[×✕]/g, "x")
    .replace(/[·•]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\t\n\r\x20-\x7E\xA0-\xFF]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function money(amount: number): string {
  return `Rs ${Math.round(amount).toLocaleString("en-IN")}`;
}

function prettyDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

class Writer {
  private page: PDFPage;
  private y: number;

  constructor(
    private doc: PDFDocument,
    private regular: PDFFont,
    private bold: PDFFont,
  ) {
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private ensure(space: number) {
    if (this.y - space < MARGIN) {
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.y = PAGE_HEIGHT - MARGIN;
    }
  }

  moveDown(space: number) {
    this.ensure(space);
    this.y -= space;
  }

  rule() {
    this.ensure(14);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.75,
      color: RULE,
    });
    this.y -= 14;
  }

  text(
    value: string,
    {
      size = 10.5,
      font = "regular" as "regular" | "bold",
      color = INK,
      indent = 0,
      gap = 3.5,
      width = CONTENT_WIDTH,
    } = {},
  ) {
    const chosen = font === "bold" ? this.bold : this.regular;
    const clean = ascii(value);
    if (clean.length === 0) return;

    for (const line of wrap(clean, chosen, size, width - indent)) {
      this.ensure(size + gap);
      this.page.drawText(line, {
        x: MARGIN + indent,
        y: this.y - size,
        size,
        font: chosen,
        color,
      });
      this.y -= size + gap;
    }
  }

  heading(value: string) {
    this.moveDown(10);
    this.text(value.toUpperCase(), {
      size: 9.5,
      font: "bold",
      color: BRAND,
      gap: 5,
    });
  }

  keyValue(label: string, value: string) {
    const clean = ascii(`${label}: ${value}`);
    for (const line of wrap(clean, this.regular, 10.5, CONTENT_WIDTH)) {
      this.ensure(14);
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y - 10.5,
        size: 10.5,
        font: this.regular,
        color: INK,
      });
      this.y -= 14;
    }
  }
}

function wrap(
  value: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current.length > 0) lines.push(current);
      // A single word longer than the line: hard-split it.
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        let chunk = "";
        for (const char of word) {
          if (font.widthOfTextAtSize(chunk + char, size) > maxWidth) {
            lines.push(chunk);
            chunk = char;
          } else {
            chunk += char;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

export async function buildTripPdf(trip: FullTrip): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const writer = new Writer(doc, regular, bold);

  const { itinerary, profileSnapshot, assumptions } = trip;
  const travelers = trip.adults + trip.children + trip.elderly;

  writer.text("Travello", { size: 11, font: "bold", color: BRAND, gap: 2 });
  writer.text("Accessible, lower-impact trip plan", {
    size: 9.5,
    color: MUTED,
    gap: 8,
  });
  writer.text(trip.title, { size: 20, font: "bold", gap: 5 });
  writer.text(`${prettyDate(trip.startDate)} to ${prettyDate(trip.endDate)}`, {
    size: 11,
    color: MUTED,
    gap: 6,
  });
  writer.rule();

  /* Overview ------------------------------------------------------- */
  writer.text(itinerary.title, { size: 13, font: "bold", gap: 4 });
  if (itinerary.tagline) {
    writer.text(itinerary.tagline, { size: 10, color: MUTED, gap: 6 });
  }
  if (itinerary.description) {
    writer.text(itinerary.description, { size: 10.5, gap: 4 });
  }

  writer.heading("Trip summary");
  writer.keyValue("From", trip.fromLocation);
  writer.keyValue("To", trip.toLocation);
  writer.keyValue(
    "Travellers",
    `${travelers} (${trip.adults} adult${trip.adults === 1 ? "" : "s"}${
      trip.children ? `, ${trip.children} child${trip.children === 1 ? "" : "ren"}` : ""
    }${trip.elderly ? `, ${trip.elderly} elderly` : ""})`,
  );
  writer.keyValue("Budget", money(trip.budget));
  writer.keyValue("Total estimated cost", money(itinerary.summary.cost));
  writer.keyValue("Travel time (one way)", itinerary.summary.duration);
  writer.keyValue(
    "Estimated CO2",
    `${itinerary.summary.co2Kg} kg (estimate)`,
  );
  writer.keyValue(
    "Estimated accessibility",
    `${itinerary.summary.accessibilityScore} / 100 (prototype score)`,
  );
  writer.keyValue(
    "Estimated sustainability",
    `${itinerary.summary.sustainabilityScore} / 100 (prototype score)`,
  );
  writer.keyValue("Status", trip.status);

  /* Transport ------------------------------------------------------ */
  writer.heading("Transport");
  writer.keyValue("Mode", itinerary.transport.label || MODE_LABELS[itinerary.transport.mode]);
  writer.keyValue("Estimated cost", money(itinerary.transport.cost));
  writer.keyValue("Travel time", itinerary.transport.duration);
  writer.keyValue("One-way distance (approx.)", `${itinerary.transport.distanceKm} km`);
  writer.keyValue("Estimated CO2 (round trip)", `${itinerary.transport.co2Kg} kg`);
  if (itinerary.transport.notes) {
    writer.text(itinerary.transport.notes, { size: 10, color: MUTED });
  }

  /* Stay ---------------------------------------------------------- */
  if (itinerary.stay.name || itinerary.stay.costPerNight > 0) {
    writer.heading("Stay");
    writer.keyValue("Name", itinerary.stay.name || "Not specified");
    writer.keyValue("Estimated cost per night", money(itinerary.stay.costPerNight));
    writer.keyValue("Nights", String(itinerary.stay.nights));
    writer.keyValue("Estimated total", money(itinerary.stay.totalCost));
    writer.keyValue(
      "Prototype accessibility score",
      `${itinerary.stay.accessibilityScore} / 100`,
    );
    writer.keyValue(
      "Prototype sustainability score",
      `${itinerary.stay.sustainabilityScore} / 100`,
    );
    if (itinerary.stay.features.length > 0) {
      writer.keyValue("Listing attributes", itinerary.stay.features.join(", "));
    }
    if (itinerary.stay.notes) {
      writer.text(itinerary.stay.notes, { size: 10, color: MUTED });
    }
  }

  /* Experiences ---------------------------------------------------- */
  if (itinerary.experiences.length > 0) {
    writer.heading("Experiences");
    for (const experience of itinerary.experiences) {
      writer.text(experience.title, { size: 10.5, font: "bold", gap: 2 });
      if (experience.description) {
        writer.text(experience.description, { size: 10, color: MUTED, gap: 2 });
      }
      const meta = [
        experience.accessibilityScore
          ? `Prototype accessibility ${experience.accessibilityScore}/100`
          : null,
        experience.sustainabilityLabel || null,
        experience.cost ? `Estimated ${money(experience.cost)}` : null,
      ]
        .filter(Boolean)
        .join("  |  ");
      if (meta) writer.text(meta, { size: 9.5, color: MUTED, gap: 6 });
    }
  }

  /* Day by day ----------------------------------------------------- */
  writer.heading("Day-by-day itinerary");
  for (const day of itinerary.days) {
    writer.moveDown(4);
    writer.text(
      `Day ${day.day} - ${prettyDate(day.date)}${day.title ? ` - ${day.title}` : ""}`,
      { size: 11.5, font: "bold", gap: 3 },
    );
    if (day.summary) {
      writer.text(day.summary, { size: 10, color: MUTED, gap: 4 });
    }
    for (const activity of day.activities) {
      writer.text(`${activity.time}  ${activity.title}`, {
        size: 10.5,
        gap: 2,
        indent: 10,
      });
      const details: string[] = [];
      if (activity.location) details.push(activity.location);
      if (activity.transport) details.push(`via ${activity.transport}`);
      if (activity.cost > 0) details.push(`estimated ${money(activity.cost)}`);
      if (activity.accessibility) {
        details.push(`access: ${activity.accessibility}`);
      }
      if (details.length > 0) {
        writer.text(details.join("  |  "), {
          size: 9.5,
          color: MUTED,
          gap: 3,
          indent: 18,
        });
      }
    }
  }

  /* Requirements from the stored profile --------------------------- */
  writer.heading("Accessibility and dietary requirements considered");
  const requirementLines: string[] = [];
  if (profileSnapshot.travelerTypes?.length) {
    requirementLines.push(
      `Travelling with: ${profileSnapshot.travelerTypes
        .map((value) => TRAVELER_TYPE_LABELS[value] ?? value)
        .join(", ")}`,
    );
  }
  if (profileSnapshot.mobility?.length) {
    requirementLines.push(
      `Mobility: ${profileSnapshot.mobility
        .map((value) => MOBILITY_LABELS[value] ?? value)
        .join(", ")}`,
    );
  }
  if (profileSnapshot.visual?.length) {
    requirementLines.push(
      `Visual: ${profileSnapshot.visual
        .map((value) => VISUAL_LABELS[value] ?? value)
        .join(", ")}`,
    );
  }
  if (profileSnapshot.hearing?.length) {
    requirementLines.push(
      `Hearing: ${profileSnapshot.hearing
        .map((value) => HEARING_LABELS[value] ?? value)
        .join(", ")}`,
    );
  }
  if (profileSnapshot.mobilityDetail) {
    requirementLines.push(`Mobility notes: ${profileSnapshot.mobilityDetail}`);
  }
  if (profileSnapshot.specialRequirement) {
    requirementLines.push(`Other: ${profileSnapshot.specialRequirement}`);
  }
  if (requirementLines.length === 0) {
    requirementLines.push("No specific requirements recorded.");
  }
  for (const line of requirementLines) {
    writer.text(`- ${line}`, { size: 10, indent: 6, gap: 3 });
  }

  writer.text(
    profileSnapshot.dietary?.length
      ? `Dietary: ${profileSnapshot.dietary
          .map((value) => DIETARY_LABELS[value] ?? value)
          .join(", ")}`
      : "Dietary: none recorded.",
    { size: 10, gap: 3 },
  );
  if (profileSnapshot.dietaryDetail) {
    writer.text(profileSnapshot.dietaryDetail, { size: 10, gap: 3, color: MUTED });
  }

  if (trip.priorities.length > 0) {
    writer.heading("Trip priorities");
    writer.text(trip.priorities.join(", "), { size: 10, gap: 4 });
  }
  if (trip.additionalPreferences.trim()) {
    writer.heading("Notes from the traveller");
    writer.text(trip.additionalPreferences, { size: 10, gap: 4 });
  }

  /* Assumptions + disclaimers -------------------------------------- */
  writer.heading("How estimates were calculated");
  writer.text(
    "Estimated CO2 = distance x estimated transport emission factor x traveller count. Accessibility and sustainability scores are prototype estimates.",
    { size: 10, gap: 3 },
  );
  for (const assumption of assumptions) {
    writer.text(`- ${assumption.label}: ${assumption.basis}`, {
      size: 10,
      indent: 6,
      gap: 3,
    });
  }

  writer.moveDown(4);
  writer.rule();
  writer.text(
    "Prototype data notice: figures are estimates from Travello's prototype dataset, not verified measurements. Facilities, certifications and opening hours must be confirmed with each provider before booking.",
    { size: 9, color: MUTED, gap: 3 },
  );
  if (trip.dataSource === "prototype") {
    writer.text(
      "Produced by Travello's own planning engine because our AI assistant was unavailable.",
      { size: 9, color: MUTED, gap: 3 },
    );
  }

  return doc.save();
}

export function pdfFileName(trip: Pick<FullTrip, "fromLocation" | "toLocation" | "startDate">): string {
  const clean = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `wayfare-${clean(trip.fromLocation)}-to-${clean(trip.toLocation)}-${trip.startDate}.pdf`;
}

export { money as formatMoneyForPdf, prettyDate as formatDateForPdf };
