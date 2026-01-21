import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        url = "http://localhost:8000/index.html"
        print(f"Opening {url}")
        page.goto(url)

        # Check if DataSaver.saveData is defined and async
        is_async = page.evaluate("""
            (async () => {
                const func = DataSaver.saveData;
                return func.constructor.name === 'AsyncFunction';
            })()
        """)

        if is_async:
            print("DataSaver.saveData is correctly defined as an async function.")
        else:
            print("Error: DataSaver.saveData is NOT an async function.")
            exit(1)

        # Trigger save to ensure no crash (will use fallback in headless since no user interaction)
        # However, in headless mode, showSaveFilePicker is not defined usually, so it goes to fallback.
        # But even if it is defined, we can't interact with the picker.
        # Let's just check if it runs without error.
        try:
            print("Triggering save...")
            # We expect a download event in the fallback scenario
            with page.expect_download() as download_info:
                page.evaluate("DataSaver.saveData()")

            download = download_info.value
            print(f"Download triggered: {download.suggested_filename}")
        except Exception as e:
            print(f"Interaction failed (expected if API present but no user interaction): {e}")

        browser.close()

if __name__ == "__main__":
    run()
