import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"PAGE CONSOLE: {msg.text}"))

        url = "http://localhost:8000/index.html"
        print(f"Opening {url}")
        page.goto(url)

        # Wait for loading overlay to disappear
        try:
            page.wait_for_selector("#loadingOverlay", state="hidden", timeout=5000)
        except:
            print("Overlay still visible, forcing removal...")
            page.evaluate("document.getElementById('loadingOverlay').style.display = 'none'")

        # Add a dummy user so we have data
        print("Adding User...")
        page.click("text=+ Add User")
        page.wait_for_selector("#userModal.active")
        page.fill("#mName", "Test User 1")
        # Set some availability
        # nw0 is Monday of current week
        page.evaluate("document.getElementById('nw0').value = 'R'")
        page.evaluate("document.getElementById('nw1').value = 'N'")
        page.evaluate("document.getElementById('nw2').value = 'L'")
        page.click("text=Save User")

        # Expand Team Data to show Resource Planner
        print("Expanding Team Data...")

        # publishToggleBtn is hidden in normal mode (display:none)
        # But App.togglePublishMode() is available globally.
        # We can just call it to enter publish mode.
        page.evaluate("App.togglePublishMode()")
        page.wait_for_timeout(500)

        # Now click Expand Team Data
        # id="expandTeamBtn" should be visible in publish mode
        page.click("#expandTeamBtn")

        # Wait for charts to render
        print("Waiting for Resource Planner to render...")
        page.wait_for_timeout(3000)

        # Scroll to gantt section
        page.locator("#ganttSection").scroll_into_view_if_needed()

        # Screenshot
        screenshot_path = f"{os.getcwd()}/verification/verify_resource_planner.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run()
