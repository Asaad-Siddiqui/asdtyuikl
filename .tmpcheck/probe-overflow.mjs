import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3111";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

await page.goto(`${BASE}/auth?mode=login`, { waitUntil: "networkidle" });
await page.locator("#email").fill("aarav.mehta@example.com");
await page.locator("#password").fill("Travello123!");
await page.getByRole("button", { name: "Log In" }).click();
await page.waitForURL("**/dashboard", { timeout: 60000 });

for (const path of ["/", "/auth"]) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  const report = await page.evaluate(() => {
    const vw = window.innerWidth;
    const offenders = [];
    document.querySelectorAll("*").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > vw + 1 || rect.right > vw + 1) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 90),
          w: Math.round(rect.width),
          right: Math.round(rect.right),
        });
      }
    });
    return {
      docScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      vw,
      offenders: offenders.slice(0, 14),
    };
  });
  console.log(`\n=== ${path} (vw=${report.vw}, doc=${report.docScrollWidth}, body=${report.bodyScrollWidth}) ===`);
  for (const o of report.offenders) {
    console.log(`  <${o.tag}> w=${o.w} right=${o.right}  ${o.cls}`);
  }
}

await browser.close();
