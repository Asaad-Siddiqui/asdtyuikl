import { chromium } from "playwright";

/**
 * Browser acceptance test for "Plan My Trip".
 *
 * Drives the exact scenario from the specification:
 *   Mumbai -> Mahabaleshwar, 12 Oct -> 15 Oct, 2 Adults + 1 Elderly, 15,000
 * and checks the conversational flow, comparison, detailed itinerary,
 * modification, confirmation, the saved-trip page and the real PDF download.
 *
 * Also asserts the two hard security rules: the OpenRouter key is never
 * requested from the browser, and raw AI text is never rendered.
 */

const BASE = (process.env.BASE ?? "http://localhost:3000").replace(/\/$/, "");
const email = `tripui${Date.now()}@example.com`;
const password = "Passw0rd123";

const problems = [];
const step = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  -> ${extra}` : ""}`);
  if (!ok) problems.push(name);
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const externalRequests = [];
const consoleErrors = [];
page.on("request", (request) => {
  if (/openrouter\.ai/i.test(request.url())) externalRequests.push(request.url());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

async function waitForText(text, timeout = 60000) {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

const nextButton = () =>
  page
    .getByRole("button", { name: /^(Continue|Finish & save|Build my trip)$/ })
    .first();

/**
 * Selects a choice. Some controls are real buttons, others (the profile
 * questionnaire) are label-wrapped checkboxes, so try both.
 */
async function pick(text, { exact = true } = {}) {
  try {
    await page.getByText(text, { exact }).first().click({ timeout: 4000 });
    return;
  } catch {
    await page.getByRole("button", { name: text, exact }).first().click();
  }
}

/* ---------------------------------------------------------------- */
/* Setup: account + accessibility profile                            */
/* ---------------------------------------------------------------- */

await page.goto(`${BASE}/auth?mode=signup`, { waitUntil: "networkidle" });
await page.locator("#name").fill("Trip UI Tester");
await page.locator("#email").fill(email);
await page.locator("#password").fill(password);
await page.getByRole("checkbox").check();
await page.getByRole("button", { name: "Create Account" }).click();
await page.waitForURL("**/accessibility", { timeout: 45000 });

await page.getByRole("button", { name: /get started/i }).click();
await waitForText("Who will you be traveling with?");
await pick("General traveler");
await pick("Elderly traveler");
await nextButton().click();
await waitForText("What would make getting around easier for you?");
await pick("Step-free access");
await pick("Minimal walking");
await nextButton().click();
await waitForText("Do you have any visual accessibility preferences?");
await nextButton().click();
await waitForText("Do you have any hearing accessibility preferences?");
await nextButton().click();
await waitForText("Do you have any dietary requirements we should consider?");
await pick("Vegetarian");
await nextButton().click();
await waitForText("What matters most when you travel?");
await nextButton().click();
await waitForText("Is there anything else you'd like us to consider?");
await page
  .getByLabel(/anything else you'd like us to consider/i)
  .fill("Please keep every transfer step-free.");
await nextButton().click();
await page.waitForURL("**/dashboard", { timeout: 30000 });
await page.waitForLoadState("networkidle");
step("account + profile ready, dashboard reached", page.url().includes("/dashboard"));

/* ---------------------------------------------------------------- */
/* Dashboard entry point                                             */
/* ---------------------------------------------------------------- */

step("dashboard shows a Plan My Trip entry point", await waitForText("Plan My Trip"));
step("dashboard shows an empty Your trips state", await waitForText("No trips planned yet"));

await page.getByRole("link", { name: /Plan My Trip/i }).first().click();
await page.waitForURL("**/plan", { timeout: 45000 });
step("planning page opens", page.url().includes("/plan"));

/* ---------------------------------------------------------------- */
/* Conversational question flow                                      */
/* ---------------------------------------------------------------- */

step("opens conversationally, one question at a time", await waitForText("Plan your next journey"));

const field = (id) => page.locator(`#${id}`);

await waitForText("Where are you starting from?");
await pick("Mumbai");
await nextButton().click();

await waitForText("Nice! Where are you heading?");
await pick("Mahabaleshwar");
await nextButton().click();

await waitForText("When are you thinking of going?");
await field("trip-start").fill("2026-10-12");
await field("trip-end").fill("2026-10-15");
step("dates produce a readable range summary", await waitForText("12 Oct → 15 Oct"));
await nextButton().click();

await waitForText("Who's coming along?");
await page.getByRole("button", { name: /Add one Adults/i }).click();
await page.getByRole("button", { name: /Add one Elderly/i }).click();
await page.getByRole("button", { name: /Add one Mobility support/i }).click();
await nextButton().click();

step(
  "adaptive question appears for the elderly traveller",
  await waitForText("Since an elderly traveller is joining"),
);
await pick("Minimal walking");
await pick("Frequent rest stops");
await nextButton().click();

step(
  "adaptive question appears for mobility support",
  await waitForText("Anything specific we should keep accessible?"),
);
await pick("Step-free routes");
await nextButton().click();

step(
  "dietary question reuses the stored profile instead of re-asking",
  await waitForText("Should we prioritise food that matches your saved preferences?"),
);
step("stored dietary preference is shown", await waitForText("Vegetarian"));
await pick(/Yes, prioritise these/i);
await nextButton().click();

await waitForText("What kind of trip are you looking for?");
// Priorities are pre-seeded from the stored profile weights, so add another
// rather than toggling the smart defaults back off.
const seeded = await page.getByText(/of 3 selected/).first().innerText();
step(
  "priorities are pre-seeded from the stored profile",
  /[1-3] of 3 selected/.test(seeded),
  seeded.trim(),
);
await pick("Comfortable");
await nextButton().click();

await waitForText("How would you like to travel?");
await pick("Public transport");
await nextButton().click();

await waitForText("What's your comfortable budget?");
await pick("₹15,000");
await nextButton().click();

await waitForText("Anything else we should know?");
step(
  "progress indicator reflects the flow",
  await page.getByText(/Step \d+ of \d+/).first().isVisible(),
);
await field("trip-notes").fill(
  "Keep walking low because my father has knee problems. Prefer quiet places.",
);

/* ---------------------------------------------------------------- */
/* Planning: intentional loading then two options                     */
/* ---------------------------------------------------------------- */

const planningStarted = nextButton().click();
step(
  "intentional multi-message loading state is shown",
  await waitForText("Understanding your preferences", 20000),
);
await planningStarted;

step("two-option comparison screen appears", await waitForText("Two options, built for you", 180000));
await waitForText("Option A", 60000);
step("Option A is shown", await waitForText("Option A"));
step("Option B is shown", await waitForText("Option B"));
step("estimated CO₂ is labelled as an estimate", await waitForText("Estimated CO₂"));

const optionsBody = await page.locator("body").innerText();
step("cost, time, emissions and scores are compared", [
  "Estimated cost",
  "Travel time",
  "Estimated CO₂",
  "Accessibility",
  "Sustainability",
].every((label) => optionsBody.includes(label)));
step(
  "descriptive comparison labels are used",
  ["Lower cost", "Lower estimated emissions", "Higher accessibility", "Higher sustainability", "Faster travel", "More experience-focused"].some(
    (label) => optionsBody.includes(label),
  ),
);
step(
  "the comparison explicitly avoids labelling one option 'best'",
  optionsBody.includes("Neither option is labelled"),
);
step(
  "no option badge claims to be the best",
  !/\bBest (option|choice|plan|trip)\b/i.test(optionsBody),
);
step("raw AI JSON is never rendered", !optionsBody.includes("```") && !optionsBody.includes("optionId"));
step("OpenRouter is never called from the browser", externalRequests.length === 0, externalRequests.join(","));

/* ---------------------------------------------------------------- */
/* Detailed itinerary                                                */
/* ---------------------------------------------------------------- */

await page.getByRole("button", { name: /Choose this plan/i }).first().click();
step("detailed itinerary opens", await waitForText("Your day-by-day itinerary", 30000));
const detailBody = await page.locator("body").innerText();
step("timeline shows Day 1", detailBody.includes("Day 1"));
step("timeline shows Day 4", detailBody.includes("Day 4"));
step("timeline shows activity times", /\d{2}:\d{2}/.test(detailBody));
step("confirm and modify actions are offered", detailBody.includes("Confirm itinerary") && detailBody.includes("Modify itinerary"));

/* ---------------------------------------------------------------- */
/* Modify                                                            */
/* ---------------------------------------------------------------- */

await page.getByRole("button", { name: /Modify itinerary/i }).click();
step("modification interface opens", await waitForText("What would you like to change?"));
await field("modification").fill(
  "Make Day 2 less tiring and add more nature activities. Reduce walking.",
);
await page.getByRole("button", { name: /Apply changes/i }).click();
step("modified itinerary is returned and re-validated", await waitForText("Your day-by-day itinerary", 180000));
const modifiedBody = await page.locator("body").innerText();
step("modified itinerary still shows a complete plan", modifiedBody.includes("Day 1") && modifiedBody.includes("Day 4"));

/* ---------------------------------------------------------------- */
/* Confirm → saved result page                                       */
/* ---------------------------------------------------------------- */

await page.getByRole("button", { name: /Confirm itinerary/i }).click();
await page.waitForURL(/\/trips\/[0-9a-f-]{36}$/, { timeout: 60000 });
const tripUrl = page.url();
step("confirming saves the trip and opens the result page", /\/trips\//.test(tripUrl), tripUrl);

step("result page announces the trip is ready", await waitForText("Your trip is ready", 30000));
const resultBody = await page.locator("body").innerText();
step("result page shows the route and dates", resultBody.includes("Mumbai") && resultBody.includes("Mahabaleshwar") && resultBody.includes("12 Oct"));
step("result page shows transport, stay and experiences", resultBody.includes("Transport") && resultBody.includes("Stay") && resultBody.includes("Experiences"));
step("result page explains the CO₂ estimate", resultBody.includes("How estimates were calculated"));
step("result page carries the prototype disclaimer", resultBody.includes("Prototype data notice"));

/* ---------------------------------------------------------------- */
/* Real PDF                                                          */
/* ---------------------------------------------------------------- */

const pdfResponse = page.waitForResponse((response) => response.url().includes("/pdf"), { timeout: 60000 });
await page.getByRole("button", { name: /Download PDF/i }).click();
const pdf = await pdfResponse;
step(
  "Download PDF button requests a real PDF",
  pdf.status() === 200 && pdf.headers()["content-type"] === "application/pdf",
  `status=${pdf.status()} type=${pdf.headers()["content-type"]}`,
);
step(
  "the download did not surface an error",
  !(await page.getByText(/couldn't build your PDF/i).isVisible().catch(() => false)),
);

// Playwright's cached response body can be empty for fetch()-driven downloads,
// so verify the bytes with an authenticated request carrying the same session.
const tripId = tripUrl.split("/").pop();
const cookieHeader = (await context.cookies())
  .map((cookie) => `${cookie.name}=${cookie.value}`)
  .join("; ");
const direct = await fetch(`${BASE}/api/trips/${tripId}/pdf`, {
  headers: { cookie: cookieHeader },
});
const pdfBuffer = Buffer.from(await direct.arrayBuffer());
step("PDF endpoint returns 200 for the owner", direct.status === 200, `status=${direct.status}`);
step("PDF file starts with the %PDF signature", pdfBuffer.subarray(0, 4).toString() === "%PDF", pdfBuffer.subarray(0, 8).toString());
step("PDF is a real document, not a screenshot", pdfBuffer.length > 2000, `${pdfBuffer.length} bytes`);

/* ---------------------------------------------------------------- */
/* Dashboard integration                                             */
/* ---------------------------------------------------------------- */

await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
const dashBody = await page.locator("body").innerText();
step("dashboard Your trips lists the saved trip from Neon", dashBody.includes("Mahabaleshwar") && dashBody.includes("View full itinerary"));
step("dashboard trip card shows cost and estimated CO₂", /₹[\d,]+/.test(dashBody) && /est\. CO₂/i.test(dashBody));
step("empty state is gone once a trip exists", !dashBody.includes("No trips planned yet"));

await page.getByRole("link", { name: /Mahabaleshwar/i }).first().click();
await page.waitForURL(/\/trips\//, { timeout: 45000 });
step("saved trip can be reopened later", await waitForText("Your trip is ready", 30000));

/* ---------------------------------------------------------------- */
/* Mobile + security                                                 */
/* ---------------------------------------------------------------- */

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/plan`, { waitUntil: "networkidle" });
step(
  "no horizontal overflow on mobile (planner)",
  !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)),
);
await page.goto(tripUrl, { waitUntil: "networkidle" });
step(
  "no horizontal overflow on mobile (result page)",
  !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)),
);

const anonymous = await browser.newContext();
const anonPage = await anonymous.newPage();
await anonPage.goto(tripUrl, { waitUntil: "networkidle" });
step(
  "a signed-out visitor cannot open a saved trip",
  anonPage.url().includes("/auth"),
  anonPage.url(),
);

step("no browser-side OpenRouter requests at any point", externalRequests.length === 0, externalRequests.join(","));
step(
  "no unexpected page errors during the flow",
  consoleErrors.filter((message) => !/favicon|404 \(Not Found\)/i.test(message)).length === 0,
  consoleErrors.slice(0, 3).join(" | "),
);

await browser.close();

console.log(
  "\n" +
    (problems.length === 0
      ? "ALL TRIP UI CHECKS PASSED"
      : `FAILURES:\n  - ${problems.join("\n  - ")}`),
);
process.exit(problems.length === 0 ? 0 : 1);
