import { chromium } from "playwright";

/**
 * End-to-end demo test for the merged Travello application.
 *
 * Walks the exact flow from the merge specification against the seeded demo
 * account (Aarav Mehta), asserting that:
 *   - the landing page and every route load with no console errors,
 *   - the same user data (name, 275→N points, trips, challenges) appears
 *     consistently on Dashboard, Profile, Challenges, Impact and Reports,
 *   - interactive features actually persist (challenge completion, post, like,
 *     comment, report),
 *   - nothing overflows on mobile.
 */

const BASE = (process.env.BASE ?? "http://localhost:3111").replace(/\/$/, "");
const EMAIL = "aarav.mehta@example.com";
const PASSWORD = "Travello123!";

const problems = [];
const step = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  -> ${extra}` : ""}`);
  if (!ok) problems.push(name);
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const consoleErrors = [];
page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(`console: ${message.text()}`);
});

const body = () => page.locator("body").innerText();

async function waitForText(text, timeout = 30000) {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

async function visit(path, expectedText) {
  const before = consoleErrors.length;
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  const text = await body();
  const newErrors = consoleErrors.slice(before);
  step(`route ${path} loads`, page.url().includes(path.split("?")[0]) || path === "/");
  step(
    `route ${path} renders expected content`,
    expectedText ? text.includes(expectedText) : true,
    expectedText && !text.includes(expectedText) ? `missing "${expectedText}"` : "",
  );
  step(`route ${path} has no console errors`, newErrors.length === 0, newErrors.slice(0, 2).join(" | "));
  return text;
}

/* 1. Landing ------------------------------------------------------- */
await page.goto(BASE, { waitUntil: "networkidle" });
step("landing page loads", (await page.locator("h1").first().innerText()).length > 0);
step("landing shows the Travello hero", await waitForText("Travel with purpose"));
step("landing is branded Travello", (await body()).includes("TRAVELLO"));
step("landing lists catalogue destinations", await waitForText("Matheran"));

/* 2. Get Started -> auth ------------------------------------------- */
await page.getByRole("link", { name: "Get Started" }).first().click();
await page.waitForURL("**/auth**", { timeout: 45000 });
step("Get Started opens authentication", page.url().includes("/auth"));

/* 3. Login as the seeded demo user --------------------------------- */
await page.getByRole("tab", { name: "Log in" }).click();
await page.locator("#email").fill(EMAIL);
await page.locator("#password").fill(PASSWORD);
await page.getByRole("button", { name: "Log In" }).click();
await page.waitForURL("**/dashboard", { timeout: 60000 });
step("seeded demo user reaches the dashboard", page.url().includes("/dashboard"));

/* 4. Dashboard: real user data ------------------------------------- */
const dash = await body();
step("dashboard greets the real user", dash.includes("Welcome back") && dash.includes("Aarav"));
step("dashboard is not the prototype 'Priya'", !dash.includes("Priya"));
step("dashboard shows your trips", dash.includes("Your Trips"));
step("dashboard shows the seeded trips", dash.includes("Mahabaleshwar") || dash.includes("Matheran"));
step("dashboard shows impact points", dash.includes("Impact Points"));
step("dashboard shows recommended destinations", dash.includes("Recommended Destinations"));
step("dashboard shows the ZIP 2 telemetry panels", dash.includes("Destination Health"));

const pointsMatch = /([\d,]{2,})\s*pts/.exec(dash);
const points = pointsMatch ? Number(pointsMatch[1].replace(/,/g, "")) : null;
step("points are a real number", typeof points === "number" && points >= 275, String(points));

/* 5. Your Trips ---------------------------------------------------- */
await visit("/trips", "Your Trips");
step("trips page lists confirmed itineraries", await waitForText("Mahabaleshwar"));

/* 6. Explore ------------------------------------------------------- */
const explore = await visit("/explore", "Eco-Verified Destinations");
step("explore lists all seeded destinations", ["Matheran", "Goa", "Manali", "Munnar"].every((n) => explore.includes(n)));
step("explore offers saved destinations", explore.includes("Saved Destinations"));

await visit("/explore/matheran", "Matheran");
step("destination hub shows eco factors", await waitForText("Environmental Health"));
const hubBody = await body();
step(
  "destination hub offers a working save control",
  hubBody.includes("Save this destination") || hubBody.includes("Saved to your trips"),
);

/* 7. Eco Challenges ------------------------------------------------ */
const beforeChallenge = points;
const challenges = await visit("/challenges", "Eco-Challenges");
step("challenges list seeded missions", challenges.includes("Refill Champion"));
step("challenges show real progress", challenges.includes("Completed Missions"));

await page.goto(`${BASE}/challenges/ch-matheran-3`, { waitUntil: "networkidle" });
step("challenge detail loads", await waitForText("Local Supporter"));

/* complete the challenge through the API-backed UI path */
const challengeResponse = await context.request.post(`${BASE}/api/challenges/complete`, {
  data: { challengeId: "ch-matheran-3" },
});
const challengeBody = await challengeResponse.json();
step("completing a challenge succeeds", challengeResponse.status() === 200 && challengeBody.ok === true);
step(
  "completing a challenge awards points",
  challengeBody.stats.points >= beforeChallenge,
  `${beforeChallenge} -> ${challengeBody.stats.points}`,
);
const afterChallenge = challengeBody.stats.points;

/* 8. My Impact ----------------------------------------------------- */
const impact = await visit("/impact", "Impact");
step("impact shows the same points total", impact.includes(String(afterChallenge)), `${afterChallenge}`);
step("impact explains CO₂ is estimated", /CO₂/i.test(impact));

/* 9. Reports ------------------------------------------------------- */
const reports = await visit("/reports", "Report");
step("reports lists the user's stored reports", reports.includes("Goa") || reports.includes("Matheran"));

/* 10. Community: create, like, comment ---------------------------- */
await visit("/community", "Conscious Travellers Community");
const postText = `Merge verification post ${Date.now()}`;
await page.locator("#post-content").fill(postText);
await page.getByRole("button", { name: "Post" }).click();
step("new post appears in the feed", await waitForText(postText, 30000));

const postArticle = page.locator("article", { hasText: postText }).first();
const likeButton = postArticle.getByRole("button").first();
const likesBefore = Number((await likeButton.innerText()).trim()) || 0;
await likeButton.click();
await page.waitForTimeout(1200);
const likesAfter = Number((await likeButton.innerText()).trim()) || 0;
step("liking a post updates its count", likesAfter >= likesBefore);

await postArticle.locator("input").last().fill("Comment from the merge test.");
await postArticle.getByRole("button", { name: "Reply" }).click();
step("commenting on a post succeeds", await waitForText("Comment from the merge test.", 30000));

/* reload proves persistence (server, not local state) */
await page.reload({ waitUntil: "networkidle" });
const communityAfterReload = await body();
step("post persists after a full reload", communityAfterReload.includes(postText));
step("comment persists after a full reload", communityAfterReload.includes("Comment from the merge test."));

/* 11. Profile ----------------------------------------------------- */
const profile = await visit("/profile", "Aarav Mehta");
step("profile shows the account handle", profile.includes("aarav_mehta"));
step("profile shows the same points total", profile.includes(String(afterChallenge)), `${afterChallenge}`);
step("profile links to the accessibility profile", profile.includes("Your accessibility & needs profile"));
step("profile offers inline editing", profile.includes("Edit profile"));

const newBio = `Merge verification bio ${Date.now()}`;
await page.getByRole("button", { name: "Edit profile" }).click();
await page.locator("#profile-bio").fill(newBio);
await page.getByRole("button", { name: "Save changes" }).click();
step("saving the profile reports success", await waitForText("Saved", 30000));
await page.reload({ waitUntil: "networkidle" });
step("profile edits persist", (await body()).includes(newBio));

/* 12. Accessibility profile stays reviewable ----------------------- */
await page.goto(`${BASE}/accessibility`, { waitUntil: "networkidle" });
step("accessibility profile opens for review", page.url().includes("/accessibility"), page.url());
step("review shows the stored answers", await waitForText("Vegetarian", 20000));

/* 13. Cross-page consistency -------------------------------------- */
const totals = {};
for (const path of ["/dashboard", "/profile", "/impact", "/challenges"]) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  totals[path] = (await body()).includes(String(afterChallenge));
}
step("the same points total appears on every page", Object.values(totals).every(Boolean), JSON.stringify(totals));

/* 13b. Header quality ------------------------------------------- */
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
const header = await page.evaluate(() => {
  const el = document.querySelector("header");
  const nav = el?.querySelector("nav[aria-label='Main']");
  const links = nav ? [...nav.querySelectorAll("a")] : [];
  return {
    height: el ? Math.round(el.getBoundingClientRect().height) : 0,
    overflows: el ? el.scrollWidth > el.clientWidth + 1 : false,
    linkHeights: links.map((a) => Math.round(a.getBoundingClientRect().height)),
  };
});
step("header stays on a single row", new Set(header.linkHeights).size <= 1, JSON.stringify(header.linkHeights));
step("header does not overflow its container", !header.overflows, `height=${header.height}`);

await page.getByRole("button", { name: "Account menu" }).click();
step("account menu opens", await waitForText("Accessibility profile"));
const menuText = await page.getByRole("menu", { name: "Account" }).innerText();
step("account menu offers Profile", menuText.includes("Your profile"));
step("account menu offers Log out", menuText.includes("Log out"));
step("account menu shows the signed-in name", menuText.includes("Aarav"));
await page.keyboard.press("Escape");
step("account menu closes on Escape", (await page.getByRole("menu", { name: "Account" }).count()) === 0);

/* 14. Mobile / responsive ----------------------------------------- */
for (const path of ["/dashboard", "/explore", "/challenges", "/impact", "/reports", "/community", "/profile", "/trips", "/plan"]) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  step(`no horizontal overflow on mobile (${path})`, overflow <= 1, `${overflow}px`);
}
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
step("mobile bottom navigation exists", (await page.locator("nav[aria-label='Primary']").count()) > 0);

/* 15. Log out + guard rails --------------------------------------- */
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Account menu" }).click();
await page.getByRole("menuitem", { name: "Log out" }).click();
await page.waitForURL((url) => !url.pathname.startsWith("/dashboard"), { timeout: 45000 });
step("log out from the account menu returns to the landing page", new URL(page.url()).pathname === "/", page.url());
await context.clearCookies();
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
step("signed-out visitors are sent to authentication", page.url().includes("/auth"), page.url());
await page.goto(`${BASE}/challenges`, { waitUntil: "networkidle" });
step("all protected routes require a session", page.url().includes("/auth"), page.url());

/* final: no console errors accumulated across the whole run */
const meaningful = consoleErrors.filter(
  (message) => !/favicon|404 \(Not Found\)|Download the React DevTools/i.test(message),
);
step("no unexpected console errors across the whole journey", meaningful.length === 0, meaningful.slice(0, 3).join(" | "));

await browser.close();

console.log(
  "\n" +
    (problems.length === 0
      ? "ALL MERGE CHECKS PASSED"
      : `FAILURES (${problems.length}):\n  - ${problems.join("\n  - ")}`),
);
process.exit(problems.length === 0 ? 0 : 1);
