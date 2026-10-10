"""Exercise the actual unchanged application in Chromium, on desktop and mobile."""
import argparse
import hashlib
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--url', required=True, help='Local file, local server, or deployed public URL')
parser.add_argument('--screenshots', default='/tmp/smartbudget-browser-checks')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
expected = (root / 'figma-smartbudget/preview/smartbudget.html').read_bytes()
screenshots = Path(args.screenshots)
screenshots.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    executable = shutil.which('chromium') or shutil.which('chromium-browser')
    browser = p.chromium.launch(executable_path=executable, headless=True,
                                args=['--no-sandbox', '--disable-dev-shm-usage'])
    try:
        for label, viewport, mobile in [('desktop', {'width': 1440, 'height': 1000}, False),
                                       ('mobile', {'width': 390, 'height': 844}, True)]:
            context = browser.new_context(viewport=viewport, is_mobile=mobile, has_touch=mobile)
            page = context.new_page()
            errors = []
            requests = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('request', lambda request: requests.append(request.url))
            response = page.goto(args.url, wait_until='load', timeout=45000)
            if not args.url.startswith('file:'):
                assert response and response.status == 200, 'Application did not return HTTP 200'
                assert hashlib.sha256(response.body()).digest() == hashlib.sha256(expected).digest(), 'Deployed bytes differ from the working preview'

            def click(name):
                button = page.get_by_role('button', name=name, exact=True)
                # SVG groups include unpainted space. Use their visible labels
                # or strokes so this is an actual pointer/touch interaction.
                label = button.locator('text').first
                if label.count():
                    label.tap() if mobile else label.click()
                else:
                    point = button.locator('path').first.evaluate('''path => {
                        const p = path.getPointAtLength(path.getTotalLength() * 0.4);
                        const screen = new DOMPoint(p.x, p.y).matrixTransform(path.getScreenCTM());
                        return {x: screen.x, y: screen.y};
                    }''')
                    if mobile:
                        page.touchscreen.tap(point['x'], point['y'])
                    else:
                        page.mouse.click(point['x'], point['y'])

            def screen(name):
                assert page.evaluate('data[current].name') == name

            def shown(value):
                assert page.locator('#phone').get_by_text(value, exact=True).count() > 0, value

            screen('000/Dashboard')
            shown('RM 1,875.30')
            click('Tab Budget')
            click('Edit monthly budget button')
            click('Choose 3200')
            click('Save budget button')
            screen('100/Budget')
            click('Tab Home')
            shown('RM 2,075.30')
            click('Add expense button')
            click('Close dialog')
            screen('100/Expenses')
            click('Add expense button')
            click('Save expense button')
            screen('110/Expenses')
            shown('RM 1,173.60')
            click('Lunch at Kopi House expense')
            shown('RM 48.90')
            click('Done button')
            click('Tab Home')
            shown('RM 2,026.40')
            click('Could you go over budget? link')
            screen('110/Forecast')
            shown('RM 3,638.16')
            click('Manage saving plan')
            click('Apply saving plan button')
            screen('111/Tips')
            click('See spending forecast')
            shown('RM 3,176.16')
            shown('RM 23.84 under your budget')
            click('Compare scenarios button')
            shown('RM 3,638.16')
            shown('RM 3,176.16')
            click('Keep saving plan button')
            click('Back to dashboard')
            screen('111/Dashboard')
            shown('RM 2,026.40')
            page.screenshot(path=str(screenshots / f'{label}-working-app.png'), full_page=True)
            click('Tab Expenses')
            click('Lunch at Kopi House expense')
            click('Delete expense button')
            screen('101/Expenses')
            shown('RM 1,124.70')
            click('Tab Tips')
            click('Pause saving plan button')
            screen('100/Tips')
            page.select_option('#screens', 'Budget')
            click('Edit monthly budget button')
            click('Choose 3000')
            click('Save budget button')
            screen('000/Budget')
            page.select_option('#screens', 'Forecast')
            screen('000/Forecast')
            click('Compare scenarios button')
            click('Apply saving plan button')
            screen('001/Forecast')
            page.get_by_role('button', name='Reset demo', exact=True).click()
            screen('000/Dashboard')
            tab = page.get_by_role('button', name='Tab Budget', exact=True)
            tab.focus()
            page.keyboard.press('Enter')
            screen('000/Budget')
            bounds = page.locator('#phone').bounding_box()
            assert bounds and bounds['x'] >= 0 and bounds['y'] >= 0
            assert bounds['x'] + bounds['width'] <= viewport['width'] + 1
            assert bounds['y'] + bounds['height'] <= viewport['height'] + 1
            assert not errors, errors
            # The single HTML document has no remote runtime dependencies.
            assert all(url == args.url for url in requests), requests
            print(f'PASS {label}: budget edits, expense save/delete, navigation, forecast, saving plan, reset, keyboard, viewport fit; no JavaScript errors.')
            context.close()
    finally:
        browser.close()
