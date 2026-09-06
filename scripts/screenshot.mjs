/**
 * QA screenshot helper (optional).
 *
 * Captures full-page screenshots of the landing page at desktop and mobile so
 * you can visually verify layout and responsiveness. Requires `puppeteer`
 * installed (dev-only) and an OS with Chromium's shared libs.
 *
 * Usage:
 *   npm i --no-save puppeteer       # one-time dev dependency
 *   node scripts/screenshot.mjs
 *
 * Screenshots are written to ./qa-shots/. They are not part of the app.
 */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = process.env.APP_URL || "http://localhost:3000";
mkdirSync("qa-shots", { recursive: true });

const browser = await puppeteer.launch({
  headless: "shell",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});

async function capture(name, url, width, height) {
  const page = await browser.newPage();
  // Reduced-motion emulation makes the fade-up Reveal components show content
  // immediately, so full-page screenshots aren't caught mid-transition.
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: `qa-shots/${name}.png`, fullPage: true });
  console.log(`captured ${name}`);
  await page.close();
}

await capture("home-desktop", `${BASE}/`, 1440, 900);
await capture("home-mobile", `${BASE}/`, 390, 844);
await capture("checkout-desktop", `${BASE}/checkout`, 1440, 900);

await browser.close();
