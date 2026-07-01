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
    lines = [l.strip() for l in text.split("\n") if l.strip()][:30]
    print(f"\n=== {name} ===")
    print(f"  URL: {url}")
    for l in lines:
        print(f"  | {l}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    # Login
    print("--- LOGIN ---")
    page.goto(f"{BASE}/login", wait_until="networkidle")
    page.wait_for_timeout(1000)
    page.fill('input[type="email"]', EMAIL)
    page.fill('input[type="password"]', PASSWORD)
    page.click('button[type="submit"]')
    page.wait_for_timeout(4000)
    snap(page, "01-after-login")

    # Check where we are - if on create page, create restaurant
    if "/create" in page.url:
        print("\n--- CREATING RESTAURANT ---")
        snap(page, "02-create-empty")
        page.fill('input[name="name"]', "Spice Garden")
        page.fill('input[name="whatsappNumber"]', "919876543210")
        page.fill('input[name="welcomeDiscount"]', "50")
        page.fill('input[name="birthdayDiscount"]', "30")
        page.fill('input[name="winbackDiscount"]', "20")
        snap(page, "03-create-filled")
        page.click('button[type="submit"]')
        page.wait_for_timeout(4000)
        snap(page, "04-after-create")

    # Now go to dashboard
    print("\n--- DASHBOARD ---")
    page.goto(f"{BASE}/dashboard", wait_until="networkidle")
    snap(page, "05-dashboard")

    # All pages
    pages = [
        ("/dashboard/customers", "06-customers"),
        ("/dashboard/coupons", "07-coupons"),
        ("/dashboard/validate", "08-validate"),
        ("/dashboard/settings", "09-settings"),
    ]
    for path, name in pages:
        print(f"\n--- {name.upper()} ---")
        page.goto(f"{BASE}{path}", wait_until="networkidle")
        snap(page, name)

    # Public form - test submission
    print("\n--- PUBLIC FORM ---")
    # First figure out the slug from settings or dashboard
    page.goto(f"{BASE}/dashboard/settings", wait_until="networkidle")
    page.wait_for_timeout(2000)
    settings_text = page.inner_text("body")
    print(f"Settings text: {settings_text[:200]}")

    # Try common slugs
    for slug in ["spice-garden", "spicegarden", "spice_garden"]:
        page.goto(f"{BASE}/form/{slug}", wait_until="networkidle")
        page.wait_for_timeout(1000)
        if "404" not in page.inner_text("body"):
            print(f"\n--- PUBLIC FORM ({slug}) ---")
            snap(page, "10-public-form")
            # Fill and submit
            page.fill('input[placeholder="John Doe"]', "Rahul Kumar")
            page.fill('input[placeholder*="+91"]', "919876543210")
            page.select_option('select:near(:text("BIRTH MONTH"))', "7")
            page.select_option('select:near(:text("BIRTH DAY"))', "15")
            page.fill('input[placeholder="Preference"]', "Veg")
            snap(page, "11-form-filled")
            page.click('button:text("Get WhatsApp Coupon")')
            page.wait_for_timeout(3000)
            snap(page, "12-form-submitted")
            break

    # Back to customers - should now show data
    print("\n--- CUSTOMERS (after form submit) ---")
    page.goto(f"{BASE}/dashboard/customers", wait_until="networkidle")
    snap(page, "13-customers-final")

    print("\n--- COUPONS (after form submit) ---")
    page.goto(f"{BASE}/dashboard/coupons", wait_until="networkidle")
    snap(page, "14-coupons-final")

    print("\n--- DASHBOARD (after data) ---")
    page.goto(f"{BASE}/dashboard", wait_until="networkidle")
    snap(page, "15-dashboard-final")

    browser.close()
    print("\n\nDONE")
