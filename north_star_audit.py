from playwright.sync_api import sync_playwright
import sys

def audit():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Test targets
        urls = [
            'http://localhost:3000/home/billing',
            'http://localhost:3000/home/restaurant-profile',
            'http://localhost:3000/home'
        ]
        
        results = []
        
        for url in urls:
            try:
                print(f"Auditing {url}...")
                page.set_viewport_size({"width": 1440, "height": 900})
                page.goto(url, wait_until='networkidle', timeout=30000)
                
                # Check Background (Pure Black)
                bg_color = page.evaluate("window.getComputedStyle(document.body).backgroundColor")
                
                # Check Main Padding (Spatial Framing)
                main_style = page.evaluate("""
                    () => {
                        const main = document.querySelector('main');
                        if (!main) return null;
                        const style = window.getComputedStyle(main);
                        return {
                            paddingLeft: style.paddingLeft,
                            paddingRight: style.paddingRight,
                            paddingTop: style.paddingTop,
                            paddingBottom: style.paddingBottom
                        };
                    }
                """)
                
                # Check Header (Bold Title + Dot)
                has_h1 = page.locator('h1').count() > 0
                has_orange_dot = page.locator('h1 span.text-orange-500').count() > 0
                
                # Check Noise Overlay
                has_noise = page.evaluate("""
                    () => {
                        return Array.from(document.querySelectorAll('div')).some(el => {
                            const style = window.getComputedStyle(el);
                            return style.backgroundImage && style.backgroundImage.includes('noiseFilter');
                        });
                    }
                """)
                
                results.append({
                    'url': url,
                    'bg': bg_color,
                    'padding': main_style,
                    'header': has_h1,
                    'dot': has_orange_dot,
                    'noise': has_noise
                })
                
            except Exception as e:
                print(f"Failed to audit {url}: {e}")
                results.append({'url': url, 'error': str(e)})
        
        browser.close()
        
        # Print results
        print("\n--- AUDIT RESULTS ---")
        for r in results:
            print(f"Page: {r['url']}")
            if 'error' in r:
                print(f"  Error: {r['error']}")
            else:
                print(f"  Background: {r['bg']}")
                print(f"  Padding: {r['padding']}")
                print(f"  Header Correct: {r['header'] and r['dot']}")
                print(f"  Noise Depth: {r['noise']}")
        print("---------------------")

if __name__ == "__main__":
    audit()
