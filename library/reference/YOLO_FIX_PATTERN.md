# The Yolo-Fix Pattern — When to Skip the Full Babysitter Ceremony

**Added:** 2026-05-21
**Status:** Production-tested pattern from cookbook babysitter usage

---

## TL;DR

The full iterate-then-deploy ceremony (`/babysitter:plan` → approve → `/babysitter:yolo` with implement → scoped-test → review → gate → deploy → verify → report) is the right shape for substantial features. But for surgical edits, it's expensive overhead. Use a **yolo-fix** instead: 5–10 minutes from edit to deployed, no process file, no agent dispatch.

**The rule of thumb:** if the change is < 3 files, < 50 lines, and has a clear local-verify path (typecheck + lint + a targeted test spec), skip the ceremony.

---

## When to use a yolo-fix vs the full ceremony

### Use yolo-fix when

- A test infra issue surfaces post-deploy and the production code is verifiably correct (e.g., a flaky stub, a wrong selector, a missing wait).
- A small UX bug needs a one-line tweak (e.g., URL param not honoured, wrong default state).
- A lint or typecheck regression appeared on the last deploy and the fix is obvious.
- A copy/i18n change that doesn't touch logic.
- A doc / comment update.

### Use the full babysitter ceremony when

- The change includes a new migration (always — the migration push deserves the full flow).
- A new server action, API route, or top-level UI surface is added.
- Anything > ~3 files or > 50 lines.
- A change you're not yet confident in and want a second-pass review on.

### Examples from production

| Change | Path used | Files | Time |
|--------|-----------|------:|------|
| Playwright stub-setup race (replace goto+evaluate with `page.setContent`) | yolo-fix | 1 | ~8 min |
| `?anchor=<id>` URL pre-select bug (refactor `useEffect` → `useState` lazy init) | yolo-fix | 1 | ~7 min |
| New auth flow with /signup + invite-attach | full ceremony | 8 | ~25 min wall-clock (auto-iterating) |
| New dinner-party mode "Plan around a dish" with migration 0042 | full ceremony | 11 | ~30 min wall-clock |

The first two would have been overkill to wrap in a process file, run iteration, post results, etc. The last two would have been risky to ship without the review + gate step.

---

## The yolo-fix recipe

1. **Make the edit(s)** with the regular file-editing tools.

2. **Run `npm run typecheck && npm run lint` IMMEDIATELY.**
   This is the most important step and the one most easily skipped. Lint catches:
   - `react-hooks/exhaustive-deps`
   - `react-hooks/set-state-in-effect` (this one fired mid-yolo once and cost a minute to refactor)
   - The `'use server'` async-only contract
   - Type-narrowing mistakes that typecheck would have flagged

3. **Run the specific spec affected.** For a playwright change, run just that spec file. For a vitest change, target that test. Save the full-suite re-run for after deploy.

4. **If green: deploy.**
   ```bash
   vercel build --prod --yes && vercel deploy --prebuilt --prod --yes
   ```

5. **Live-verify.** For client-component testids: chunk-grep `.vercel/output/static/_next/static/chunks/` for the new strings, then fetch the same chunk from production and re-grep. Hit count > 0 = shipped. For server-component testids: rely on source + an HTTP smoke (most server-component testids are gated behind auth; a `307 → /login` from an unauthenticated curl is the gate-working proof).

6. **Confirm to the user** with a one-paragraph summary. Include: what changed, files modified, the lint/typecheck/test results, the deploy URL or chunk hash, and any caveats.

---

## Anti-patterns

- **Skipping the lint step.** Most surface-level lint rules are fast (< 1 second). When you skip them, you discover the violation only after the deploy push starts — a 30-second pre-check would have caught it.
- **Touching the schema.** If the yolo touches a `.sql` migration file, escalate to the full ceremony. Migration pushes warrant the review + gate.
- **Yoloing a "small change" that touches > 3 files.** The 3-file / 50-line threshold isn't a hard cap, but past it you're probably underestimating the surface area.
- **Skipping the live-verify.** Even for a 1-line change. The chunk-grep takes 5 seconds and catches "the deploy succeeded but the new code isn't in the bundle" scenarios.

---

## Comparison

| dimension | full ceremony | yolo-fix |
|-----------|---------------|----------|
| Wall-clock | 15–30 min | 5–10 min |
| Process file | yes | no |
| Iteration loop | yes (up to 3 attempts) | no |
| Review + gate | yes | no — local typecheck/lint/test is the gate |
| Final report | yes | a one-paragraph chat summary |
| Migration push | optional, part of deploy | NEVER — escalate to full ceremony |
| Best for | new features, new surfaces, migrations | bugfixes, test infra, copy tweaks |

---

## Why the discipline matters

The full ceremony exists for a reason: review catches missed integrations, gate enforces a quality threshold, the report captures refinement debt. For substantial features, that overhead is worth it.

But for a 1-line fix, the ceremony is friction — and friction makes people batch fixes into bigger PRs, which makes them harder to review. The yolo-fix pattern is permission to skip the ceremony when the change is genuinely small, with the explicit recipe (typecheck + lint + targeted test + live-verify) standing in for the gate.

The cookbook project landed 8 deliverables in 3 days (May 19–21, 2026): 6 full-ceremony runs + 2 yolo-fixes. The yolo-fixes shipped in < 10 min each; the full-ceremony runs took ~25 min average. None of the 8 deliverables needed a retry. The discipline works.

---

## Reference

Pattern documented during the 2026-05-21 retrospective of cookbook babysitter usage. Source runs: `01KS3BNJ` (pantry-ux), `01KS3KGY` (dinner-anchor), `01KS5G0F` (auth-password), `01KS5NK0` (admin-role), plus the two referenced yolo fixes (pantry-ux test stub, pantry-anchor URL pre-select).
