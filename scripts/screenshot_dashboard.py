from playwright.sync_api import sync_playwright
import os

BASE = "http://localhost:3000"
PAGES = [
    ("/", "01-home"),
    ("/login", "02-login"),
    ("/signup", "03-signup"),
    ("/dashboard", "04-dashboard"),
    ("/dashboard/customers", "05-customers"),
    ("/dashboard/coupons", "06-coupons"),
    ("/dashboard/validate", "07-validate"),
    ("/dashboard/settings", "08-settings"),
    ("/admin", "09-admin"),
    ("/form/test-restaurant", "10-form"),
    ("/api/whatsapp", "11-api-whatsapp"),
]

os.makedirs("screenshots", exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    for path, name in PAGES:
        url = BASE + path
        print(f"\n=== {name} -> {url} ===")
        try:
            resp = page.goto(url, timeout=15000, wait_until="domcontentloaded")
            page.wait_for_timeout(2000)
            status = resp.status if resp else "no response"
            title = page.title()
            page.screenshot(path=f"screenshots/{name}.png", full_page=True)
            print(f"  Status: {status} | Title: {title}")
            print(f"  URL: {page.url}")
            # Get visible text
            text = page.inner_text("body")
            lines = [l.strip() for l in text.split("\n") if l.strip()][:20]
            for l in lines:
                print(f"  TEXT: {l}")
        except Exception as e:
            print(f"  ERROR: {e}")

    browser.close()
    print("\n\nDone.")
