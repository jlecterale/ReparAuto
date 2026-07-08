// Headless screenshot driver for the run-web skill.
// Usage: node screenshot.mjs <url> <outfile.png> [WxH] [waitSelector]
// Requires playwright-core installed in the CWD (see SKILL.md).
import { chromium } from 'playwright-core';

const [url, outfile, size = '1440x900', waitSelector] = process.argv.slice(2);
if (!url || !outfile) {
  console.error('usage: node screenshot.mjs <url> <outfile.png> [WxH] [waitSelector]');
  process.exit(1);
}
const [width, height] = size.split('x').map(Number);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox'],
});
const page = await (await browser.newContext({ viewport: { width, height } })).newPage();

const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
if (waitSelector) {
  await page.waitForSelector(waitSelector, { timeout: 30000 })
    .catch(() => console.warn(`selector "${waitSelector}" never appeared`));
}
// Let LazyImage's IntersectionObserver load + fade-in settle.
await page.waitForTimeout(3000);
await page.screenshot({ path: outfile, fullPage: true });
await browser.close();

console.log(`saved ${outfile}`);
// Firestore connectivity errors are expected in this container; surface the rest.
const relevant = errors.filter((e) => !/firestore|firebase|ERR_CONNECTION|Failed to fetch/i.test(e));
if (relevant.length) console.warn('console errors:', relevant.slice(0, 5));
