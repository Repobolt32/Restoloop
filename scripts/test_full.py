import os, time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
EMAIL = "test.owner@example.com"
PASSWORD = "TestPass123!"
os.makedirs("screenshots", exist_ok=True)

def screenshot(page, name):
    page.wait_for_timeout(1500)
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

    # 1. Signup
    print("\n--- SIGNUP FLOW ---")
    page.goto(f"{BASE}/signup", wait_until="networkidle")
    page.wait_for_timeout(1000)
    page.fill('input[type="email"]', EMAIL)
    page.fill('input[type="password"]', PASSWORD)
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)
    screenshot(page, "01-after-signup")

    # 2. Dashboard (should redirect to create if no restaurant)
    print("\n--- DASHBOARD (no restaurant) ---")
    page.goto(f"{BASE}/dashboard", wait_until="networkidle")
    page.wait_for_timeout(2000)
    screenshot(page, "02-dashboard-no-restaurant")

    # 3. Create restaurant
    print("\n--- CREATE RESTAURANT ---")
    page.goto(f"{BASE}/dashboard/create", wait_until="networkidle")
    page.wait_for_timeout(1000)
    screenshot(page, "03-create-form-empty")
    # Fill form
    page.fill('input[name="name"]', "Spice Garden")
    page.fill('input[name="whatsappNumber"]', "919876543210")
    page.fill('input[name="welcomeDiscount"]', "50")
    page.fill('input[name="birthdayDiscount"]', "30")
    page.fill('input[name="winbackDiscount"]', "20")
    page.screenshot(path="screenshots/03b-create-form-filled.png", full_page=True)
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)
    screenshot(page, "04-after-create-restaurant")

    # 4. Dashboard with restaurant
    print("\n--- DASHBOARD (with restaurant) ---")
    page.goto(f"{BASE}/dashboard", wait_until="networkidle")
    page.wait_for_timeout(2000)
    screenshot(page, "05-dashboard-main")

    # 5. All dashboard pages
    DASH_PAGES = [
        ("/dashboard/customers", "06-customers"),
        ("/dashboard/coupons", "07-coupons"),
        ("/dashboard/validate", "08-validate"),
        ("/dashboard/settings", "09-settings"),
    ]
    for path, name in DASH_PAGES:
        print(f"\n--- {name.upper()} ---")
        page.goto(f"{BASE}{path}", wait_until="networkidle")
        page.wait_for_timeout(2000)
        screenshot(page, name)

    # 6. Admin
    print("\n--- ADMIN ---")
    page.goto(f"{BASE}/admin", wait_until="networkidle")
    page.wait_for_timeout(2000)
    screenshot(page, "10-admin")

    # 7. Public form
    print("\n--- PUBLIC FORM ---")
    page.goto(f"{BASE}/form/spice-garden", wait_until="networkidle")
    page.wait_for_timeout(1000)
    screenshot(page, "11-public-form")

    # 8. Test form submission
    print("\n--- FORM SUBMISSION ---")
    page.fill('input[placeholder="John Doe"]', "Rahul Kumar")
    page.fill('input[placeholder*="+91"]', "919876543210")
    page.select_option('select:near(:text("BIRTH MONTH"))', "7")
    page.select_option('select:near(:text("BIRTH DAY"))', "15")
    page.fill('input[placeholder="Preference"]', "Veg")
    page.screenshot(path="screenshots/12-form-filled.png", full_page=True)
    page.click('button:text("Get WhatsApp Coupon")')
    page.wait_for_timeout(3000)
    screenshot(page, "13-form-submitted")

    # 9. Back to customers - should show the new customer
    print("\n--- CUSTOMERS (after form) ---")
    page.goto(f"{BASE}/dashboard/customers", wait_until="networkidle")
    page.wait_for_timeout(2000)
    screenshot(page, "14-customers-after-form")

    # 10. Coupons - should show welcome coupon
    print("\n--- COUPONS (after form) ---")
    page.goto(f"{BASE}/dashboard/coupons", wait_until="networkidle")
    page.wait_for_timeout(2000)
    screenshot(page, "15-coupons-after-form")

    browser.close()
    print("\n\nDONE - All screenshots saved to screenshots/")
