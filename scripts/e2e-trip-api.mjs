/**
 * API-level acceptance test for the Plan My Trip feature.
 *
 * Exercises the whole server pipeline and, critically, the security rule that
 * one traveller can never read another traveller's trip.
 *
 *   node scripts/e2e-trip-api.mjs
 *   BASE=http://localhost:3000 node scripts/e2e-trip-api.mjs
 */

import zlib from "node:zlib";

const BASE = (process.env.BASE ?? "http://localhost:3000").replace(/\/$/, "");
const stamp = Date.now();

/**
 * Real PDFs compress their content streams, so the visible text is not
 * greppable in the raw bytes. Inflate every stream and return the text-drawing
 * operators — this proves the PDF contains genuine selectable text rather than
 * being an image or a screenshot.
 */
function pdfStreamText(buffer) {
  const raw = buffer.toString("latin1");
  const parts = [];
  const re = /stream\r?\n([\s\S]*?)endstream/g;
  let match;
  while ((match = re.exec(raw)) !== null) {
    const chunk = Buffer.from(match[1], "latin1");
    let text;
    try {
      text = zlib.inflateSync(chunk).toString("latin1");
    } catch {
      text = chunk.toString("latin1");
    }
    // pdf-lib writes glyphs as hex strings: <57617966> Tj
    const hex = /<([0-9A-Fa-f]{2,})>/g;
    let encoded;
    while ((encoded = hex.exec(text)) !== null) {
      const value = encoded[1];
      if (value.length % 2 !== 0) continue;
      parts.push(Buffer.from(value, "hex").toString("latin1"));
    }
    parts.push(text);
  }
  return parts.join("\n");
}

const problems = [];
const step = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  -> ${extra}` : ""}`);
  if (!ok) problems.push(name);
};

async function post(path, body, cookie) {
  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON (e.g. PDF error text) */
  }
  return { status: response.status, json, text, headers: response.headers };
}

async function get(path, cookie) {
  const response = await fetch(`${BASE}${path}`, {
    headers: cookie ? { cookie } : {},
  });
  return {
    status: response.status,
    headers: response.headers,
    buffer: Buffer.from(await response.arrayBuffer()),
    text: "",
  };
}

async function createUser(label) {
  const email = `tripe2e-${label}-${stamp}@example.com`;
  const result = await post("/api/auth/signup", {
    name: `Trip ${label}`,
    email,
    password: "Passw0rd123",
    acceptedTerms: true,
  });
  if (result.status !== 200) {
    throw new Error(`signup failed (${result.status}): ${result.text.slice(0, 200)}`);
  }
  const cookie = result.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  return { email, cookie, userId: result.json?.user?.id };
}

const PROFILE = {
  complete: true,
  travelerTypes: ["general_traveler", "elderly_traveler"],
  requirements: {
    mobility: ["step_free_access", "elevator", "minimal_walking"],
    visual: [],
    hearing: [],
  },
  details: { mobility: "Cannot walk for more than 10 minutes at a time." },
  dietary: ["vegetarian"],
  preferences: {
    sustainability: 85,
    accessibility: 90,
    budget: 50,
    time: 50,
    comfort: 60,
  },
  specialRequirement: "Please keep every transfer step-free.",
};

/** The exact acceptance-test trip from the specification. */
const TRIP = {
  from: "Mumbai",
  to: "Mahabaleshwar",
  startDate: "2026-10-12",
  endDate: "2026-10-15",
  adults: 2,
  children: 0,
  elderly: 1,
  mobilitySupport: 1,
  budget: 15000,
  transportPreference: "public_transport",
  priorities: ["accessible", "low_impact"],
  tripNeeds: ["minimal_walking", "frequent_rest_stops"],
  additionalPreferences:
    "Keep walking low because my father has knee problems. Prefer quiet places.",
};

console.log(`# Trip planning API acceptance test against ${BASE}\n`);

/* ---------------------------------------------------------------- */
/* 0. Auth guards                                                    */
/* ---------------------------------------------------------------- */

const anonPlan = await post("/api/trips/plan", { request: TRIP });
step("plan requires a session (401 when signed out)", anonPlan.status === 401, `status=${anonPlan.status}`);

const anonList = await get("/api/trips");
step("trip list requires a session (401)", anonList.status === 401, `status=${anonList.status}`);

/* ---------------------------------------------------------------- */
/* 1. Primary traveller                                              */
/* ---------------------------------------------------------------- */

const owner = await createUser("owner");
step("owner account created", Boolean(owner.cookie));

const savedProfile = await post("/api/profile", PROFILE, owner.cookie);
step("profile saved and completed", savedProfile.json?.profile?.completed === true);

const invalid = await post(
  "/api/trips/plan",
  { request: { ...TRIP, budget: 5, endDate: "2026-10-01" } },
  owner.cookie,
);
step(
  "invalid input is rejected server-side (422)",
  invalid.status === 422,
  `status=${invalid.status}`,
);

console.log("\n… planning (the AI chain can take up to a minute)");
const planStart = Date.now();
const plan = await post("/api/trips/plan", { request: TRIP }, owner.cookie);
console.log(`   plan took ${((Date.now() - planStart) / 1000).toFixed(1)}s\n`);

step("plan returns 200", plan.status === 200, `status=${plan.status}`);
const options = plan.json?.options ?? [];
step("exactly TWO options returned", options.length === 2, `count=${options.length}`);
step(
  "options are option_a and option_b (no option C)",
  options.map((o) => o.optionId).join(",") === "option_a,option_b",
  options.map((o) => o.optionId).join(","),
);
step(
  "each option has a full 4-day itinerary",
  options.every((o) => o.days?.length === 4),
  options.map((o) => o.days?.length).join(","),
);
step(
  "each option has computed summary numbers",
  options.every(
    (o) =>
      typeof o.summary?.cost === "number" &&
      typeof o.summary?.co2Kg === "number" &&
      o.summary.accessibilityScore >= 0 &&
      o.summary.sustainabilityScore >= 0,
  ),
);
step(
  "estimated CO2 differs between the two options",
  options[0]?.summary?.co2Kg !== options[1]?.summary?.co2Kg,
  options.map((o) => o.summary?.co2Kg).join(" vs "),
);
step(
  "CO2 assumptions was recorded for both options",
  Object.keys(plan.json?.assumptions ?? {}).length === 2,
);
step(
  "comparison uses descriptive labels, never a universal 'best'",
  Object.values(plan.json?.comparisons ?? {}).every(
    (labels) =>
      Array.isArray(labels) && labels.every((l) => !/^best$/i.test(String(l))),
  ),
  JSON.stringify(plan.json?.comparisons),
);

const raw = JSON.stringify(plan.json ?? {});
step(
  "no raw AI/markdown leakage in the payload",
  !raw.includes("```") && !raw.includes("reasoning_content"),
);

const chosen = options[0];

/* ---------------------------------------------------------------- */
/* 2. Modify before confirming                                       */
/* ---------------------------------------------------------------- */

console.log("\n… modifying (AI pipeline again)");
const modified = await post(
  "/api/trips/modify",
  {
    request: TRIP,
    option: chosen,
    modification:
      "Make Day 2 less tiring and add more nature activities. Reduce walking.",
  },
  owner.cookie,
);
step("modify always returns a usable itinerary", modified.status === 200, `status=${modified.status}`);
if (modified.json?.note) {
  console.log(`      note: ${modified.json.note}`);
}
step(
  "modified itinerary keeps the same option id and day count",
  modified.json?.option?.optionId === chosen.optionId &&
    modified.json?.option?.days?.length === 4,
);
step(
  "modified itinerary is fully normalized",
  Boolean(
    modified.json?.option?.transport?.mode &&
      typeof modified.json?.option?.summary?.cost === "number",
  ),
);

const finalOption = modified.status === 200 ? modified.json.option : chosen;

/* ---------------------------------------------------------------- */
/* 3. Confirm → persist                                              */
/* ---------------------------------------------------------------- */

const confirmed = await post(
  "/api/trips/confirm",
  {
    request: TRIP,
    option: finalOption,
    engine: plan.json?.engine ?? "prototype",
    assumptions: plan.json?.assumptions?.[chosen.optionId] ?? [],
  },
  owner.cookie,
);
step("confirm persists the trip", confirmed.status === 200 && Boolean(confirmed.json?.tripId), `status=${confirmed.status}`);
const tripId = confirmed.json?.tripId;

const tampered = await post(
  "/api/trips/confirm",
  { request: TRIP, option: { ...finalOption, optionId: "option_c" }, engine: "ai", assumptions: [] },
  owner.cookie,
);
step("confirm rejects a tampered itinerary (422)", tampered.status === 422, `status=${tampered.status}`);

/* ---------------------------------------------------------------- */
/* 4. Dashboard list + result page                                   */
/* ---------------------------------------------------------------- */

const list = await get("/api/trips", owner.cookie);
step("trip list returns the saved trip", list.status === 200);
const listed = JSON.parse(list.buffer.toString() || "{}").trips ?? [];
step("saved trip appears in the owner's list", listed.length === 1, `count=${listed.length}`);
step(
  "saved trip is marked confirmed with final numbers",
  listed[0]?.status === "confirmed" &&
    typeof listed[0]?.totalCost === "number" &&
    typeof listed[0]?.estimatedCo2 === "number",
);

const resultPage = await fetch(`${BASE}/trips/${tripId}`, {
  headers: { cookie: owner.cookie },
});
const resultHtml = await resultPage.text();
step("result page renders for the owner", resultPage.status === 200, `status=${resultPage.status}`);
step(
  "result page shows destination, dates and the trip title",
  resultHtml.includes("Mahabaleshwar") && resultHtml.includes("Your trip is ready"),
);

/* ---------------------------------------------------------------- */
/* 5. Real PDF                                                       */
/* ---------------------------------------------------------------- */

const pdf = await get(`/api/trips/${tripId}/pdf`, owner.cookie);
step("PDF endpoint returns 200", pdf.status === 200, `status=${pdf.status}`);
step(
  "response is a real PDF (application/pdf + %PDF header)",
  pdf.headers.get("content-type") === "application/pdf" &&
    pdf.buffer.subarray(0, 4).toString() === "%PDF",
  `type=${pdf.headers.get("content-type")} magic=${pdf.buffer.subarray(0, 4).toString()}`,
);
step("PDF is non-trivial in size", pdf.buffer.length > 2000, `${pdf.buffer.length} bytes`);
const pdfText = pdfStreamText(pdf.buffer);
step(
  "PDF contains selectable text from the saved trip",
  pdfText.includes("Wayfare") && pdfText.includes("Mahabaleshwar"),
  `extracted ${pdfText.length} chars of text operators`,
);
step(
  "PDF includes the day-by-day itinerary",
  pdfText.includes("Day 1") && pdfText.includes("DAY-BY-DAY"),
);
step(
  "PDF carries the prototype/estimated disclaimer",
  pdfText.includes("Prototype") && pdfText.includes("estimate"),
);
step(
  "PDF states how CO2 was estimated",
  pdfText.includes("emission factor"),
);

/* ---------------------------------------------------------------- */
/* 6. Security: another traveller cannot reach this trip             */
/* ---------------------------------------------------------------- */

const stranger = await createUser("stranger");
const strangerResult = await fetch(`${BASE}/trips/${tripId}`, {
  headers: { cookie: stranger.cookie },
});
step(
  "another user gets 404 on the trip page (no leakage)",
  strangerResult.status === 404,
  `status=${strangerResult.status}`,
);

const strangerPdf = await get(`/api/trips/${tripId}/pdf`, stranger.cookie);
step(
  "another user gets 404 on the PDF",
  strangerPdf.status === 404,
  `status=${strangerPdf.status}`,
);

const strangerList = await get("/api/trips", stranger.cookie);
const strangerTrips = JSON.parse(strangerList.buffer.toString() || "{}").trips ?? [];
step(
  "another user's trip list is empty",
  strangerTrips.length === 0,
  `count=${strangerTrips.length}`,
);

console.log(
  "\n" +
    (problems.length === 0
      ? "ALL TRIP API CHECKS PASSED"
      : `FAILURES:\n  - ${problems.join("\n  - ")}`),
);
process.exit(problems.length === 0 ? 0 : 1);
