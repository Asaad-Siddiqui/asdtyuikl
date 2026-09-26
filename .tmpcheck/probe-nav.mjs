import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3111";
const COOKIE = process.env.COOKIE ?? "";

const browser = await chromium.launch();
const context = await browser.newContext();
if (COOKIE) {
  await context.addCookies(
    COOKIE.split(";").map((pair) => {
      const [name, ...rest] = pair.trim().split("=");
      return { name, value: rest.join("="), url: BASE };
    }),
  );
}
const page = await context.newPage();

for (const width of [1024, 1280, 1440, 1920]) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  const info = await page.evaluate(() => {
    const header = document.querySelector("header");
    const nav = header?.querySelector("nav[aria-label='Main']");
    const logo = header?.querySelector("a");
    const label = (nav?.querySelector("a") as HTMLElement | null)?.textContent;
    return {
      headerH: header?.getBoundingClientRect().height,
      navH: nav?.getBoundingClientRect().height,
      navOverflow: nav ? nav.scrollWidth - nav.clientWidth : null,
      logoW: logo?.getBoundingClientRect().width,
      firstNavLabel: label,
      headerText: (header as HTMLElement | null)?.innerText.replace(/\n/g, " | "),
    };
  });
  console.log(width, JSON.stringify(info));
}

await browser.close();
