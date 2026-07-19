from playwright.sync_api import sync_playwright
import sys

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    errors = []
    page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: errors.append(f"[PAGE_ERROR] {err}"))
    page.goto("http://localhost:3001", wait_until="networkidle", timeout=15000)

    title = page.title()
    status = page.evaluate("document.readyState")
    url = page.url

    print(f"Title: {title}")
    print(f"URL: {url}")
    print(f"ReadyState: {status}")

    if errors:
        print(f"Errors: {errors}")
    else:
        print("No console errors")

    page.screenshot(path=r"E:\desktop\Restoloop\.opencode\screenshot.png", full_page=True)
    print("Screenshot saved")

    content = page.content()
    body = page.locator("body").text_content()
    if "not found" in body.lower() or "error" in body.lower() or "500" in content or "404" in content:
        print("POSSIBLE ISSUE: Page shows error/not found")
    else:
        print("Page appears healthy")

    browser.close()
