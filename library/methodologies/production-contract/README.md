# Production contract

A one-line JSDoc convention for babysitter process files: every
`*.process.js` carries a `@productionContract` tag in its header naming the
**user-visible assertion** the run must satisfy.

## TL;DR

```js
/**
 * @process specializations/web-development/fix-checkout-button
 * @description Cart's "Buy now" button is grey after the recent CSS rework
 * @agent general-purpose
 * @productionContract A signed-in user with items in the cart sees a primary
 *   "Buy now" button on /cart that responds to click and routes to /checkout.
 */
```

The tag answers a single question: *"If I deployed this and the user
checked, what would they see that proves the run worked?"*

The answer is intentionally not "the test suite is green." A run can pass
every test gate and still leave the user-visible bug intact (the test
mocked away the thing that was broken, the code path under test isn't the
code path the user exercises, the assertion was on an API success count
instead of rendered state). The contract makes that gap explicit and
code-reviewable.

## Why the convention exists

It was extracted from a real-world incident on a Next.js + Supabase
project. A persistent "Annotate all (N)" badge stuck at 4 on the recipe
bank. Three successive fix attempts each:

1. Identified a plausible cause (sentinel rows / client cache / set-based
   completeness check).
2. Shipped the fix.
3. Passed every unit, data, and Playwright test gate.
4. **Never moved the user-visible 4.**

Each scoped test was asserting on the wrong thing — the server-action
return value, the in-memory mock's state, the count returned by the
mocked Supabase client. None asserted on the rendered DOM after a
real reload against real data.

The fourth attempt led with a live-prod diagnostic (a sibling
contribution under [`specializations/qa-testing-automation/
diagnostic-first-phase`](../../specializations/qa-testing-automation/diagnostic-first-phase.js))
and found the real cause on the first artifact: PostgREST's silent
1000-row response cap was truncating an `.in()` query. The mock DB
couldn't reproduce the cap because it's a server-side framework default,
not a schema constraint.

Had every previous process declared its production contract
(`Reloading /recipes after Annotate all clears the (N) badge`), each
attempt would have had to argue *how* its fix moved that specific
assertion — not just that the test suite stayed green. The wrong
attempts would have been visibly insufficient at review time, before
ship.

## Where the tag goes

In the file's top-level JSDoc, alongside `@agent` / `@inputs` / `@outputs`:

```js
/**
 * @process specializations/<area>/<name>
 * @description <one paragraph>
 * @inputs { ... }
 * @outputs { ... }
 * @agent general-purpose
 * @productionContract <one sentence in user-visible terms>
 */
```

## Worked examples

A grab bag of contracts from real-world domains, to show the shape:

### UX bug

```
@productionContract Header logo is visibly clickable, /recipes/new is
  reachable from any nav, and Favorites/Most-cooked filter pills sort
  across the full recipe set (not just the first page).
```

Wrong shape for the same run: *"src/components/Header.tsx renders a
`<Link>` with the expected aria-label."* The tag isn't about which
component file changed; it's about what the user sees.

### Brand rebrand

```
@productionContract The header renders the new mark + wordmark in the
  approved font; favicon and the 4 PWA icon variants match the new brand
  on both light and dark themes.
```

### Backend bug fix

```
@productionContract After clicking "Annotate all", reloading /recipes
  shows the (N) badge cleared — verified by an e2e Playwright test that
  seeds a real-DB recipe with the failure pattern, performs the click,
  reloads, and asserts the badge count is 0.
```

Note the contract names a concrete, reproducible verification path. The
process can still ship if the unit tests pass — but only if the e2e
assertion holds.

### Schema migration

```
@productionContract Existing recipes survive the migration with no data
  loss; new INSERTs use the renamed column; the rollback runbook executes
  cleanly against a freshly migrated copy.
```

### UI-only feature toggle

```
@productionContract A signed-in user in the "experiment-A" cohort sees
  the new pricing card; users in "experiment-B" see the old card; both
  cohorts can still complete checkout.
```

## Rules

1. **User-visible language only.** "The bulk-backfill server action
   returns `success: true`" is wrong. "The (N) badge clears after
   reload" is right.
2. **One sentence.** If you need a paragraph, the run is doing too much.
   Split into multiple processes.
3. **Verifiable from outside the codebase.** A reviewer who has never
   read the source should be able to read the contract and know how to
   tell whether the run succeeded.
4. **Pair with — don't replace — your test gates.** The test gates keep
   the codebase healthy; the contract keeps the run honest. Both are
   required.
5. **A run that passes every test gate but doesn't move the contract is a
   failed run.** Treat it as such — don't ship it.

## Adoption

- Add the tag to new process files as they're written.
- For existing files, a one-liner back-fill is easy:

  ```bash
  grep -L "@productionContract" library/specializations/*/*.js
  ```

  is all you need to find what's missing.

- Consider a CI check that fails the build when a process file's JSDoc
  is missing the tag. (Out of scope for this methodology contribution;
  open as a follow-up if you want it as a first-class SDK feature.)

## Adjacent methodology

This convention works best when paired with the **diagnostic-first
phase** snippet under
[`library/specializations/qa-testing-automation/diagnostic-first-phase.js`](../../specializations/qa-testing-automation/diagnostic-first-phase.js).
Together they discipline the loop:

- Diagnostic-first phase = "What does the production data actually say?"
- Production contract = "What does the user see when we're done?"

If you can't answer both, the run isn't ready to write code.
