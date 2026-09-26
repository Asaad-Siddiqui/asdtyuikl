import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3111";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto(`${BASE}/auth?mode=login`, { waitUntil: "networkidle" });
await page.locator("#email").fill("aarav.mehta@example.com");
await page.locator("#password").fill("Travello123!");
await page.getByRole("button", { name: "Log In" }).click();
await page.waitForURL("**/dashboard", { timeout: 60000 });

for (const width of [1024, 1280, 1440, 1920]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  const info = await page.evaluate(() => {
    const header = document.querySelector("header");
    const nav = header?.querySelector("nav[aria-label='Main']");
    const links = nav ? [...nav.querySelectorAll("a")] : [];
    return {
      headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
      navVisible: nav ? nav.getBoundingClientRect().width > 0 : false,
      navWidth: nav ? Math.round(nav.getBoundingClientRect().width) : 0,
      linkHeights: links.map((a) => Math.round(a.getBoundingClientRect().height)),
      linkLabels: links.map((a) => a.innerText.replace(/\s+/g, " ").trim()),
      headerScrollWidth: header ? header.scrollWidth : null,
      headerClientWidth: header ? header.clientWidth : null,
      headerText: header ? header.innerText.replace(/\n/g, " | ") : "",
    };
  });
  console.log(`\n=== width ${width} ===`);
  console.log(JSON.stringify(info, null, 1));
}

await browser.close();
