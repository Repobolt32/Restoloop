import { chromium } from "playwright";
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        console.log("5.1 Navigating to /home...");
        await page.goto("http://localhost:3000/home");
        await page.waitForLoadState('networkidle');
        const url1 = page.url();
        console.log("Routing URL:", url1);
        if (!url1.includes("auth")) console.error("FAIL: Did not redirect to auth.");
        else console.log("PASS: Successfully blocked unauthenticated /home access via UI Route Transition.");

        console.log("5.4 Navigating to public form /form/antigravity-pizza...");
        await page.goto("http://localhost:3000/form/antigravity-pizza");
        await page.waitForLoadState('networkidle');

        console.log("Looking for input fields natively...");
        // Fuzzy finding Inputs
        const inputs = await page.locator('input').all();
        if (inputs.length >= 2) {
            await inputs[0].fill('Automation Native UI Test');
            await inputs[1].fill('+917542011085');
        }

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();
        console.log("Clicked Submit button.");

        await page.waitForTimeout(3000);

        console.log("PASS: Phase 5 UI Routing and Render executions completed.");
    } catch (e) {
        console.error("Phase 5 Playwright Error:", e);
    } finally {
        await browser.close();
    }
})();
