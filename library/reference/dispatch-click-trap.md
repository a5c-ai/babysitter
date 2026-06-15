# Don't dispatch-click around framework event handlers

When using Playwright/Puppeteer against an SPA driven by a JS framework (Ember, React, Vue, Angular), `locator.click()` may time out due to overlay interception or stability checks. A common reflex is to add a fallback that does `locator.evaluate((el) => el.click())` — a programmatic click that bypasses Playwright's pointer-event checks.

**This breaks framework-managed UI state silently.**

## Why it breaks

Frameworks attach event listeners via delegation, capture pinned synthetic events, or wrap interactions through their own event lifecycle (e.g. Ember's action queue, React's synthetic event system). A programmatic `el.click()` dispatches a native MouseEvent without going through those wrappers — the framework never observes the click and its state machine doesn't transition.

Concrete symptom from a real case (LinkedIn profile, Ember-managed dropdown):
- Path A (direct Connect button click) failed with overlay interception.
- Added a "robustClick" fallback that retried with `force: true` and finally `el.click()`.
- The dispatch-click "succeeded" — but the dropdown menu (when needed for Path B) never opened. The Ember event queue never saw the click on the More button, so the menu's open-state action never fired.
- Result: the fallback masked the primary path's failure mode and silently broke the previously-working secondary path.

## Better recovery patterns

When `locator.click()` times out and the locator is verified correct:

1. **Dismiss the overlay first**, then real-click. Common overlays:
   - Cookie banners (`button:has-text("Accept")`)
   - Modal dialogs (`page.keyboard.press('Escape')`)
   - Sticky headers blocking the target (scroll into view)
2. Retry `locator.click({ force: true })` — bypasses the actionability check (visibility, stability) but still routes through the browser's real event dispatch, so framework handlers fire.
3. Capture the actual DOM HTML of the locator and its parent for offline analysis. Don't keep guessing — `locator.evaluate(el => el.outerHTML)` once is worth ten more retries.
4. Use **page.mouse.click(x, y)** at the element's bounding-box center if you need precise pointer dispatch but real events.

## Detection signal in your logs

If you see `[robustClick:label] dispatching programmatic click` in your logs and the next user-visible step (e.g. "menu opens", "modal appears") fails, suspect the framework didn't see the click. Programmatic dispatch is a **last resort** for static buttons with no JS handler — never for buttons whose JS handler IS the thing you want to trigger.

## Related

- Playwright issue threads on actionability checks and overlay interception.
- "Strict mode" violations are a separate class of issue and should not be conflated — fix those by narrowing the locator, not by force-clicking.
