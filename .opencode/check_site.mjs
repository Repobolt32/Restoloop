import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errors = [];
page.on('console', msg => errors.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => errors.push(`[PAGE_ERROR] ${err.message}`));

await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 15000 });

const title = await page.title();
const readyState = await page.evaluate('document.readyState');
const url = page.url();
const bodyText = await page.locator('body').textContent();

console.log(`Title: ${title}`);
console.log(`URL: ${url}`);
console.log(`ReadyState: ${readyState}`);

if (errors.length) {
  console.log(`Errors: ${JSON.stringify(errors)}`);
} else {
  console.log('No console errors');
}

await page.screenshot({ path: '.opencode/screenshot.png', fullPage: true });
console.log('Screenshot saved');

const hasIssue = /not found|error|500|404/.test(bodyText.toLowerCase());
if (hasIssue) {
  console.log('POSSIBLE ISSUE: Page shows error/not found');
} else {
  console.log('Page appears healthy');
}

await browser.close();
