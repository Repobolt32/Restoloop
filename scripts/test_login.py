import os
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
EMAIL = "iamkumarankit1502@gmail.com"
PASSWORD = "Ankit@2032"
os.makedirs("screenshots", exist_ok=True)

def snap(page, name):
    page.wait_for_timeout(2000)
    page.screenshot(path=f"screenshots/{name}.png", full_page=True)
    url = page.url
    text = page.inner_text("body")
    lines = [l.strip() for l in text.split("\n") if l.strip()][:25]
    print(f"\n=== {name} ===")
    print(f"  URL: {url}")
    for l in lines:
        print(f"  | {l}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    # 1. Login
    print("--- LOGIN ---")
    page.goto(f"{BASE}/login", wait_until="networkidle")
    page.wait_for_timeout(1000)
    page.fill('input[type="email"]', EMAIL)
    page.fill('input[type="password"]', PASSWORD)
    page.click('button[type="submit"]')
    page.wait_for_timeout(4000)
    snap(page, "01-after-login")

    # 2. Dashboard
    print("\n--- DASHBOARD ---")
    page.goto(f"{BASE}/dashboard", wait_until="networkidle")
    snap(page, "02-dashboard")

    # 3. All pages
    for path, name in [
        ("/dashboard/customers", "03-customers"),
        ("/dashboard/coupons", "04-coupons"),
        ("/dashboard/validate", "05-validate"),
        ("/dashboard/settings", "06-settings"),
        ("/admin", "07-admin"),
    ]:
        print(f"\n--- {name.upper()} ---")
        page.goto(f"{BASE}{path}", wait_until="networkidle")
        snap(page, name)

    # 4. Public form for this restaurant
    print("\n--- PUBLIC FORM ---")
    page.goto(f"{BASE}/form/spice-garden", wait_until="networkidle")
    snap(page, "08-form-spice-garden")

    browser.close()
    print("\n\nDONE")
