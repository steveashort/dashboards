import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"PAGE CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        url = "http://localhost:8000/index.html"
        print(f"Opening {url}")
        page.goto(url)

        # Wait for loading overlay to disappear
        try:
            page.wait_for_selector("#loadingOverlay", state="hidden", timeout=5000)
        except:
            print("Overlay still visible, checking errors...")
            # If overlay is stuck, maybe app didn't init.
            # But let's proceed and see.

        # Add Gauge Tracker
        print("Adding Gauge Tracker...")
        page.locator("button", has_text="+ Add Tracker").click()
        page.wait_for_selector("#trackerModal.active")

        page.fill("#tkDesc", "Test Gauge")
        page.click("#typeGaugeBtn")
        page.wait_for_selector("#gaugeInputs", state="visible")

        page.fill("#tkTotal", "100")
        page.fill("#tkComp", "75")
        page.fill("#tkMetric", "Percent")

        page.click("text=Save Tracker")
        page.wait_for_selector("#trackerModal", state="hidden")

        # Add Line Tracker
        print("Adding Line Tracker...")
        page.locator("button", has_text="+ Add Tracker").click()
        page.wait_for_selector("#trackerModal.active")

        page.fill("#tkDesc", "Test Line")
        page.click("#typeLineBtn")
        page.wait_for_selector("#lineInputs", state="visible")

        page.locator(".add-series-row div").click()

        page.locator(".ts-val").first.fill("50")
        page.locator(".ts-val").nth(1).fill("80")

        page.click("text=Save Tracker")
        page.wait_for_selector("#trackerModal", state="hidden")

        # Wait for rendering
        print("Waiting for charts to render...")
        page.wait_for_timeout(3000)

        # Screenshot
        screenshot_path = f"{os.getcwd()}/verification/verification.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run()
