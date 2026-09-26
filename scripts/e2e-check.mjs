import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const email = `e2e${Date.now()}@example.com`;
const password = "Passw0rd123";

const problems = [];
const step = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  -> ${extra}` : ""}`);
  if (!ok) problems.push(name);
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

page.on("pageerror", (e) => console.log("  [pageerror]", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("  [console.error]", m.text());
});

const heading = () => page.locator("h1").first().innerText();

/** Waits for a piece of text to become visible; returns true if it did. */
async function waitForText(text, timeout = 30000) {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

async function clickContinue() {
  await page.getByRole("button", { name: /^(Continue|Finish & save)$/ }).first().click();
}

async function pickCards(labels) {
  for (const label of labels) {
    await page.getByText(label, { exact: true }).first().click();
  }
}

// 1. Landing
await page.goto(BASE, { waitUntil: "networkidle" });
step("landing loads", (await heading()).includes("Travel with purpose"));

// 2. Get Started -> auth
await page.getByRole("link", { name: "Get Started" }).first().click();
await page.waitForURL("**/auth**", { timeout: 45000 });
step("Get Started navigates to /auth", page.url().includes("/auth"));

// 3. Tab switching (the reported bug)
step("auth opens on Sign up", (await heading()).includes("Create your travel profile"));

await page.getByRole("tab", { name: "Log in" }).click();
step("clicking 'Log in' tab switches form", await waitForText("Welcome back"));

await page.getByRole("tab", { name: "Create account" }).click();
step("clicking 'Create account' tab switches back", await waitForText("Create your travel profile"));

// 4. Sign up
await page.locator("#name").fill("E2E Traveller");
await page.locator("#email").fill(email);
await page.locator("#password").fill(password);
await page.getByRole("checkbox").check();
await page.getByRole("button", { name: "Create Account" }).click();
await page.waitForURL("**/accessibility", { timeout: 45000 });
step("signup creates account and lands on /accessibility", page.url().includes("/accessibility"));

// 5. Profile wizard
await page.getByRole("button", { name: /get started/i }).click();

step("step 1 shown", await waitForText("Who will you be traveling with?"));
await pickCards(["General traveler", "Wheelchair user"]);
await clickContinue();

step("step 2 shown", await waitForText("What would make getting around easier for you?"));
await pickCards(["Step-free access", "Elevator / lift", "Minimal walking"]);
await page.getByLabel(/anything else we should know/i).fill("I cannot walk continuously for more than 10 minutes.");
await clickContinue();

step("step 3 shown", await waitForText("Do you have any visual accessibility preferences?"));
await pickCards(["Audio announcements"]);
await clickContinue();

step("step 4 shown", await waitForText("Do you have any hearing accessibility preferences?"));
await pickCards(["Written instructions"]);
await clickContinue();

step("step 5 shown", await waitForText("Do you have any dietary requirements we should consider?"));
await pickCards(["Vegetarian", "Jain"]);
await clickContinue();

step("step 6 shown", await waitForText("What matters most when you travel?"));
await page.locator("#pref-sustainability").fill("85");
await page.locator("#pref-accessibility").fill("90");
await clickContinue();

step("final step shown", await waitForText("Is there anything else you'd like us to consider?"));
await page.getByLabel(/anything else you'd like us to consider/i).fill("Please keep every transfer step-free.");

// --- No-scroll guarantees, measured at a cramped laptop viewport ---
await page.setViewportSize({ width: 1280, height: 720 });
await page.waitForTimeout(500);
const layout = await page.evaluate(() => {
  const doc = document.documentElement;
  const aside = document.querySelector("aside");
  const scroller = document.querySelector('[data-scroll-region="conversation"]');
  return {
    pageOverflow: doc.scrollHeight - window.innerHeight,
    asideOverflow: aside ? aside.scrollHeight - aside.clientHeight : null,
    chatRegion: scroller ? Math.round(scroller.getBoundingClientRect().height) : null,
    mainCount: document.querySelectorAll("main").length,
  };
});
step("exactly one <main> landmark", layout.mainCount === 1, `count=${layout.mainCount}`);
step("conversation region fills the remaining height", (layout.chatRegion ?? 0) > 200, `height=${layout.chatRegion}px`);
step("page itself does not scroll (1280x720)", layout.pageOverflow <= 1, `overflow=${layout.pageOverflow}px`);
step("selections rail has no scrollbar", layout.asideOverflow === 0, `overflow=${layout.asideOverflow}px`);
step("stage tracker is visible while answering", await page.locator("header ol").isVisible());
await page.setViewportSize({ width: 1440, height: 900 });

await clickContinue();
step("completion screen shown", await waitForText("You're all set!"));
step(
  "completion offers a manual dashboard button",
  await page.getByRole("button", { name: /Explore My Dashboard/i }).isVisible(),
);

// 6. Dashboard — reached automatically, without clicking anything
const autoRedirected = await page
  .waitForURL("**/dashboard", { timeout: 15000 })
  .then(() => true)
  .catch(() => false);
step("auto-redirects to the dashboard after completion", autoRedirected, page.url());

await page.waitForLoadState("networkidle");
step("dashboard reached", page.url().includes("/dashboard"));

const body = await page.locator("body").innerText();
step("greeting shown", /Welcome back/.test(body));
step("dashboard shows the signed-in traveller", body.includes("Welcome back") && body.includes("E2E"));
step("dashboard shows recommended destinations from the catalogue", /Matheran|Goa|Manali|Munnar/.test(body));

// The stored accessibility answers are reviewable on their own screen.
await page.goto(`${BASE}/accessibility`, { waitUntil: "networkidle" });
const accessibilityBody = await page.locator("body").innerText();
for (const expected of [
  "Step-free access",
  "Elevator / lift",
  "Minimal walking",
  "Vegetarian",
  "Jain",
  "Please keep every transfer step-free.",
  "I cannot walk continuously for more than 10 minutes.",
]) {
  step(`accessibility profile shows "${expected}"`, accessibilityBody.includes(expected));
}
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });

// 7. Persistence across reload
await page.goto(`${BASE}/accessibility`, { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
const afterReload = await page.locator("body").innerText();
step(
  "data persists after refresh",
  afterReload.includes("Step-free access") &&
    afterReload.includes("Vegetarian") &&
    afterReload.includes("Please keep every transfer step-free."),
);
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });

// 8. Logout + login round trip
await page.getByRole("button", { name: "Account menu" }).click();
await page.getByRole("menuitem", { name: /Log out/i }).click();
await page.waitForURL(BASE.replace(/\/$/, "") + "/", { timeout: 45000 });
step("logout returns to landing", page.url().replace(/\/$/, "") === BASE.replace(/\/$/, ""));

await page.getByRole("link", { name: "Login" }).first().click();
await page.waitForURL("**/auth**", { timeout: 45000 });
step("navbar Login opens the login form", await waitForText("Welcome back"));

await page.locator("#email").fill(email);
await page.locator("#password").fill(password);
await page.getByRole("button", { name: "Log In" }).click();
await page.waitForURL("**/dashboard", { timeout: 45000 });
step("login with a completed profile goes straight to /dashboard", page.url().includes("/dashboard"));

// 9. Guard rails
await page.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
step("profile page shows the traveller's own data", (await page.locator("body").innerText()).includes("E2E"));

// 10. Mobile
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
step(
  "no horizontal overflow on mobile (dashboard)",
  !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)),
);

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
step(
  "no horizontal overflow on mobile (landing)",
  !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)),
);

const menuButton = page.getByRole("button", { name: /Open menu/i });
step("hamburger visible on mobile", await menuButton.isVisible());
await menuButton.click();

const mobileMenu = page.locator("#mobile-menu");
const menuOpened = await mobileMenu
  .waitFor({ state: "visible", timeout: 15000 })
  .then(() => true)
  .catch(() => false);
step("mobile menu opens", menuOpened);

if (menuOpened) {
  const menuText = await mobileMenu.innerText();
  const hasMarketingLinks =
    menuText.includes("Explore") &&
    menuText.includes("Eco Challenges") &&
    menuText.includes("Community");
  // This user is signed in, so the CTA should be the dashboard, not Login.
  const hasCorrectCta = menuText.includes("Go to Dashboard");
  step(
    "mobile menu lists nav links and the signed-in CTA",
    hasMarketingLinks && hasCorrectCta,
    `text="${menuText.replace(/\s+/g, " ").trim()}"`,
  );
  await page.getByRole("button", { name: /Close menu/i }).click();
  const menuClosed = await mobileMenu
    .waitFor({ state: "hidden", timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  step("mobile menu closes", menuClosed);
}

// keyboard accessibility: tab to the first control and check focus is visible
await page.goto(`${BASE}/auth?mode=signup`, { waitUntil: "networkidle" });
await page.keyboard.press("Tab");
const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? "");
step("keyboard focus reaches an interactive element", ["INPUT", "BUTTON", "A"].includes(focusedTag), `focused=${focusedTag}`);

await browser.close();

console.log("\n" + (problems.length === 0 ? `ALL ${"CHECKS"} PASSED` : `FAILURES:\n  - ${problems.join("\n  - ")}`));
process.exit(problems.length === 0 ? 0 : 1);
