# Platform Boundary Hardening

> Seven process-template hardenings derived from a 3-day retrospective across 18 babysitter runs in the [cookbook](https://github.com/anthropics/cookbook) repo (2026-05-21 → 2026-05-23).

## Why this doc exists

The babysitter loop (iterate → impl → scoped-test → review → gate) catches **artifact-level** mistakes well: a missing test, a TypeScript error, a forgotten import, a malformed migration. It does **not** catch **platform-boundary** mistakes — the class of bugs that only manifest when production code meets a real platform (Vercel runtime, Supabase RLS, iOS Safari, an external API).

The cookbook retro window saw:

- 18 feature runs, all passing the gate on first impl attempt (zero retries).
- Reviewer scores 92–98.
- **9+ post-deploy hotfixes**, each falling into one of seven platform-boundary classes.

Each hotfix cost between 5 minutes (env-var typo) and ~1 hour (RLS write-grant diagnosis post-synthesis). All of them are preventable with small, mechanical additions to the process templates.

This doc enumerates the seven classes with concrete recommendations. Each section is independently actionable — a future PR can pick any one and apply it without touching the others.

---

## 1. Default plan runtime to `'nodejs'`; require justification for `'edge'`

**Incident.** A cookbook run authored a plan with `runtime: 'edge'` for a route that uses the Supabase client. Supabase's client transitively imports `node:crypto`, which the Edge runtime forbids. Deploy failed with:

```
Error: The Edge Function "api/cooking/tts" is referencing unsupported modules:
        - __vc__ns__/0/index.js: node:crypto
```

Hotfix: switched to `runtime = 'nodejs'`. The route works identically on Node/Fluid Compute with the bonus of full Node API access.

**Why this is a class, not a one-off.** Vercel's own current guidance (already surfaced via the SessionStart hook in IDE integrations) states:

> Edge Functions are not recommended. Instead use Fluid Compute (default) which runs in the same regions and has the same price, but allows for regular Node.js.

Plan templates that still default to Edge run into this trap any time the route uses a library with native or Node-specific dependencies. The current trap-rate is high because most Vercel platform libraries (Supabase client, AI SDKs, image processing) have Node deps.

**Recommendation.** In process-library plan templates:

```diff
- export const runtime = 'edge';
+ export const runtime = 'nodejs';
+ // Default: 'nodejs'. Switch to 'edge' only if you have a documented
+ // sub-50ms latency budget AND no node:crypto / fs / net / native
+ // dependencies in the import chain (including transitive).
```

Implement-task prompt addition:

> Before authoring any API route in this plan, if `runtime: 'edge'` is requested, scan the route's import chain (including transitive deps from `package.json`) for `node:crypto`, `node:fs`, `node:net`, or other native-only modules. If any are present, reject `'edge'` and fall back to `'nodejs'` — surface the rejection to the user via a breakpoint with the specific offending module path.

Review-task prompt addition:

> Flag any `runtime: 'edge'` declaration as a refinement issue unless the impl artifact contains a "Why Edge" justification block (≥1 documented sub-50ms latency requirement + dependency-chain audit).

---

## 2. Pre-flight env-var verification

**Incident.** A cookbook run depended on a new env var `ELEVENLABS_API_KEY`. The user typed it into Vercel as `LEVENLABS_API_KEY` (missing the leading E). The route then returned 401 silently for ~20 minutes of debugging before the typo was spotted.

**Why this is a class.** Any run that introduces a new external-platform env var is one typo away from a silent 401/403/500 with no helpful error in the standard scoped-test or review tasks. The failure mode is post-deploy and looks identical to a real auth bug.

**Recommendation.** Add a helper to the process library:

```js
// library/helpers/env-verify.js (suggested location)

/**
 * Verify env vars exist on the target platform with exact spelling.
 *
 * Returns one of:
 *   { ok: true }
 *   { ok: false, missing: ['VAR_NAME', ...] }
 *   { ok: false, missing: [...], typoSuspects: [{ actual, likelyMeant, distance }] }
 *
 * `typoSuspects` populates when an existing var is within Levenshtein
 * distance ≤ 2 of an expected name — catches LEVENLABS_API_KEY ↔ ELEVENLABS_API_KEY,
 * STIPE_KEY ↔ STRIPE_KEY, etc.
 *
 * Currently supports platform: 'vercel'. Extend for other platforms as needed.
 */
export async function verifyEnvVars({ platform, required, projectDir }) {
  if (platform !== 'vercel') {
    throw new Error(`unsupported platform: ${platform}`);
  }
  const present = await listVercelEnvVars(projectDir);
  const missing = required.filter((name) => !present.includes(name));
  const typoSuspects = missing.flatMap((expected) => {
    const candidate = present
      .map((name) => ({ name, distance: levenshtein(name, expected) }))
      .filter((c) => c.distance > 0 && c.distance <= 2)
      .sort((a, b) => a.distance - b.distance)[0];
    return candidate
      ? [{ actual: candidate.name, likelyMeant: expected, distance: candidate.distance }]
      : [];
  });
  if (missing.length === 0) return { ok: true };
  return { ok: false, missing, typoSuspects };
}

async function listVercelEnvVars(projectDir) {
  // `vercel env ls` output parsing — relies on the CLI being authenticated.
  const { stdout } = await execAsync('vercel env ls production --yes', { cwd: projectDir });
  return [...stdout.matchAll(/^\s*([A-Z_][A-Z0-9_]+)\s+/gm)].map((m) => m[1]);
}

function levenshtein(a, b) { /* … standard DP implementation … */ }
```

Implement-task prompt addition (boilerplate at the top of any run with new env vars):

> Before writing any code, run `verifyEnvVars({platform: 'vercel', required: ['NEW_VAR_1', 'NEW_VAR_2'], projectDir: '/path/to/project'})`. If the result reports `missing` or `typoSuspects`, surface the failure to the user via a breakpoint and STOP. Do not proceed until the user confirms the env var has been corrected.

This single helper would have caught the `LEVENLABS_API_KEY` typo in ~5 seconds.

---

## 3. RLS migration template snippet

**Incident.** A cookbook migration created `public.tts_monthly_meter` with `grant select to authenticated` and a `for select` RLS policy ONLY. The server's UPSERT on every cloud-TTS call was rejected with:

```
permission denied for table tts_monthly_meter
```

Required a hotfix migration to add `for all` policy + full DML grants. The failure was post-synthesis (the audio bytes were already paid for upstream), so the user-visible symptom was a generic 502.

**Why this is a class.** Anyone creating a new RLS-enabled table that should be readable AND writable by authenticated users will hit this unless they remember to grant explicitly. The trap is that `for all` policy alone is insufficient — Postgres requires both the policy AND the table-level grants.

**Recommendation.** Add the proven family-scoped pattern as a template snippet:

```sql
-- library/snippets/rls-family-scoped.sql

-- Family-scoped RLS template — use for any new public table that should be
-- read AND written by the authenticated user (within their family).
-- The {{TABLE}} placeholder gets replaced with the actual table name.
-- {{family_id_in_user_family_ids}} is the cookbook-specific resolver; for
-- other projects, replace with the equivalent (e.g. `auth.uid() = user_id`).

alter table public.{{TABLE}} enable row level security;

drop policy if exists {{TABLE}}_all on public.{{TABLE}};
create policy {{TABLE}}_all on public.{{TABLE}}
  for all
  using      (family_id in (select user_family_ids()))
  with check (family_id in (select user_family_ids()));

revoke all on public.{{TABLE}} from anon, authenticated;
grant select, insert, update, delete on public.{{TABLE}} to authenticated;
grant all on public.{{TABLE}} to service_role;
```

A read-only variant for tables that authenticated users should query but never write to (e.g. shared catalogs):

```sql
-- library/snippets/rls-read-only.sql

alter table public.{{TABLE}} enable row level security;

drop policy if exists {{TABLE}}_select on public.{{TABLE}};
create policy {{TABLE}}_select on public.{{TABLE}}
  for select using (true);

revoke all on public.{{TABLE}} from anon, authenticated;
grant select on public.{{TABLE}} to authenticated;
grant all on public.{{TABLE}} to service_role;
```

Review-task addition: when a migration touches RLS on a NEW table, the reviewer must verify the table has BOTH a write-capable policy AND `grant insert, update, delete` to authenticated — unless the impl artifact explicitly states "read-only by design" and the migration uses the read-only template.

---

## 4. Δ-from-plan section in impl artifacts

**Incident.** A cookbook plan documented `/api/cron/reset-tts-meter` as a planned route. The implement subagent correctly dropped it during implementation (the metric being reset turned out to auto-reset lazily via composite-PK on month rollover — no cron actually needed). The user, working from the original plan document, set up an external cron-job.org job pointing at the never-shipped endpoint and got 404s for two days.

**Why this is a class.** Plans are written before implementation; implementation often drops or restructures planned artifacts. Without an explicit reconciliation, the user-facing runbook stays anchored to the plan — which now lies.

**Recommendation.** Add a mandatory "Δ from plan" section to every impl artifact:

```markdown
## Δ from plan

Planned artifacts that were NOT shipped, with reason:

- `/api/cron/reset-tts-meter` — DROPPED. Meter resets lazily via composite-PK
  `(family_id, year_month)`; no external cron needed. Runbook should NOT
  instruct users to set up a cron job for this endpoint.

- `tts_cache.recipe_id` column — DROPPED. Sentence-level cache key already
  invalidates on text change; per-recipe scoping was redundant.

Planned artifacts that were RESTRUCTURED, with new shape:

- `synthesize()` was planned as `(text, voiceId)` → audio bytes. Final shape:
  `(text, voiceId)` → `{ url, fromCache, meterCents }` JSON envelope.
  Client must be updated to set `audio.src = body.url`.
```

The final report's "iPhone runbook" / user-facing instructions section MUST be regenerated **from the Δ list**, not from the original plan. If the Δ list is empty, the runbook can be lifted from the plan verbatim.

Implement-task prompt addition:

> At the end of the impl artifact, include a "Δ from plan" section listing every artifact that was planned but not shipped, AND every artifact whose shape changed materially from the plan. If nothing changed, write "No deltas — implementation matches the plan exactly." The final report generator MUST consume this section when writing user-facing runbook instructions.

---

## 5. Real-device validation checklist for browser-API runs

**Incident.** Two cookbook hotfixes — both real-device-only bugs — slipped past playwright. The bugs:

1. Cross-sentence audio leak. `primeCloudAudio()`'s defensive re-prime `play()` replayed the audio singleton's existing `src` (the PREVIOUS sentence's URL) before the new src was swapped in. Users heard 1-2 words of the previous sentence at every transition.
2. Cloud + iOS double-voice overlay. The Web Speech "Hands-free ready" primer fired at full volume on the iOS speechSynthesis channel while the cloud audio also played. Both voices audibly overlapped.

Neither reproduces in jsdom or in mocked playwright Audio elements. Both required the iOS Safari audio-gesture frame and the real iOS audio channel to manifest.

**Why this is a class.** Any browser API that's gated by a real user gesture, real audio playback, real microphone/camera permission, or real push notification has behavior that mocked test environments cannot fully replicate.

**Recommendation.** Add a checklist template:

```markdown
<!-- library/snippets/real-device-checklist.md -->

# Real-device validation checklist

If your run touched any of these APIs, populate the matching checklist
section in the live-verify task output. Mark each item as confirmed by the
user before declaring the run complete.

## SpeechSynthesis / SpeechSynthesisUtterance

- [ ] First utterance plays audibly on the target device (iPhone Safari /
      Android Chrome / desktop Safari / etc.)
- [ ] Sequential utterances play in order with no audio leakage from the
      previous one
- [ ] The expected voice is used (matches the user's saved preference)
- [ ] No overlap with other audio playback (HTMLAudioElement, cloud TTS, etc.)

## HTMLAudioElement

- [ ] `.play()` succeeds on the target device after a user gesture
- [ ] Sequential plays don't leak audio from a previous src
- [ ] `currentTime = 0` + new src + `.play()` produces clean playback
- [ ] Singleton-pattern audio elements survive page-lifetime usage

## navigator.mediaDevices.getUserMedia

- [ ] Permission dialog appears on first attempt
- [ ] Mic stream releases when stopped
- [ ] Subsequent attempts reuse the granted permission (no second dialog)
- [ ] Mic does not interfere with concurrent speechSynthesis output on iOS
      (the iOS mic dialog historically pauses speechSynthesis indefinitely)

## Notification / serviceWorker.pushManager

- [ ] Permission dialog appears on first call
- [ ] Notification displays with correct title + body on lock screen
- [ ] Tapping the notification routes correctly (deep link works)
- [ ] Notification fires when the app is fully closed (not just backgrounded)
- [ ] No duplicate notifications when both server-push and in-app timer fire

## Custom APIs touched by this run

- [ ] (populated by the implement subagent based on filesChanged)
```

Implement-task prompt addition:

> If the run's `filesChanged` includes any of these browser-API touchpoints —
> `SpeechSynthesis`, `HTMLAudioElement`, `navigator.mediaDevices`,
> `Notification`, `serviceWorker.pushManager` — copy the matching section(s)
> from `library/snippets/real-device-checklist.md` into the impl artifact's
> "Real-device validation" section.

Live-verify task addition:

> If a "Real-device validation" section exists in the impl artifact, include
> it verbatim in the final report's user-facing runbook so the user has a
> checklist to walk through on the target device.

---

## 6. Real-device validation breakpoint (interactive mode only)

**Incident.** Complementary to #5. In yolo (non-interactive) mode, the user can't pause to test on a real device — the run completes and the report tells them to do it later. In interactive mode, the babysitter currently doesn't ask.

**Recommendation.** Add an optional breakpoint after the deploy + live-verify steps, gated on two conditions:

1. The run is in **interactive mode** (not yolo).
2. The run's `filesChanged` includes a gesture-bound API surface (per #5).

The breakpoint asks:

> Did you test on the target real device? Confirm:
> - [ ] (checklist items from the impl artifact's "Real-device validation" section)
>
> Reply `confirm` to mark the run complete, `retest` to defer, or `skip` to
> waive (the run will still complete but the report will note the waiver).

In yolo mode the breakpoint is skipped silently; the checklist is still embedded in the impl artifact and final report so the user can action it manually.

Process-template pseudocode:

```js
if (
  !ctx.options.nonInteractive &&
  impl.filesChanged.some((f) =>
    /\b(SpeechSynthesis|HTMLAudioElement|getUserMedia|pushManager|Notification)\b/.test(f)
  )
) {
  await ctx.breakpoint('real-device-validation', {
    title: 'Real-device validation',
    checklist: impl.realDeviceChecklist, // populated per #5
    options: ['confirm', 'retest', 'skip'],
  });
}
```

---

## 7. `NEXT_PUBLIC_*` debug gates are not a DCE boundary

**Incident.** A cookbook voice-integration preview guarded verbose client logs
with `if (process.env.NEXT_PUBLIC_VOICE_DEBUG === '1') { ... }`. In the Vercel
preview build, the emitted production chunk still contained the diagnostic log
strings when `NEXT_PUBLIC_VOICE_DEBUG` was unset or set to `0`. Next.js had
compiled the check as a runtime comparison instead of constant-folding the
branch away.

**Why this is a class.** The live-verify gate often proves a frontend change
shipped by building locally, finding a new `data-testid` or marker in
`.vercel/output/static/_next/static/chunks/<chunk>.js`, fetching the deployed
chunk, and grepping for the same marker. That pattern is valid for intentional
shipped verification markers. It becomes ambiguous when a run also expects
`NEXT_PUBLIC_*` runtime comparisons to remove diagnostic/debug text from the
same production chunks: the grep can silently tolerate leaked diagnostics, or it
can confuse the developer by finding a string that was expected to disappear.

**Recommendation.** Live-verify guidance for Next.js projects should add a
pre-flight warning when it sees `process.env.NEXT_PUBLIC_*` inside a debug,
trace, verbose logging, or diagnostics branch:

> `NEXT_PUBLIC_*` values are public client bundle inputs. Treat client-side
> `process.env.NEXT_PUBLIC_*` comparisons as runtime configuration, not as a
> guaranteed dead-code-elimination boundary for diagnostic/debug strings.

For debug-only code that must disappear from production bundles, prefer a
compile-time boolean defined in the build config:

```js
// next.config.js or next.config.mjs
import webpack from 'webpack';

export default {
  webpack(config) {
    config.plugins.push(
      new webpack.DefinePlugin({
        __VOICE_DEBUG__: JSON.stringify(
          process.env.NEXT_PUBLIC_VOICE_DEBUG === '1'
        ),
      })
    );

    return config;
  },
};
```

Then guard source code with the compile-time constant:

```js
if (typeof __VOICE_DEBUG__ !== 'undefined' && __VOICE_DEBUG__) {
  console.debug('voice debug marker');
}
```

The live-verify task should distinguish two chunk-grep categories:

```markdown
## Chunk-grep evidence

- [ ] Intentional shipped verification markers are present in local and
      deployed chunks. Examples: `data-testid`, feature marker constants,
      accessibility labels that are part of the UI contract.
- [ ] Diagnostic/debug text that must not ship is guarded by a compile-time
      constant such as `__VOICE_DEBUG__`, not only by
      `process.env.NEXT_PUBLIC_*`.
- [ ] If a deployed chunk contains diagnostic/debug text, report that as a
      production-bundle leak unless the implementation explicitly documents why
      the string is intended to ship.
```

Implement-task prompt addition:

> If the project is a Next.js app and the run adds or relies on
> `process.env.NEXT_PUBLIC_*` checks around verbose logs, diagnostics, trace
> output, or other debug-only strings, do not treat that guard as proof the
> strings will be removed from production chunks. Either replace the guard with
> a compile-time constant from `next.config.js` / `next.config.mjs` using
> `webpack.DefinePlugin` (or the project's Turbopack-equivalent define
> mechanism), or call out the remaining production-bundle risk in the
> live-verify artifact.

Live-verify task addition:

> When chunk-grepping Next.js builds, classify hits as either intentional
> shipped verification markers or diagnostic/debug text. Presence of intentional
> markers proves deployment. Presence of diagnostic/debug text proves only that
> the string shipped; it must not be accepted as dead-code-elimination evidence
> for a `NEXT_PUBLIC_*` guard.

---

## Implementation order (suggested)

For reviewers landing these changes:

1. **#3 (RLS template)** — smallest blast radius. Add the snippets, point the existing migration-writing templates at them. Catches the highest-cost class of bug.
2. **#4 (Δ-from-plan)** — one paragraph in the impl-task prompt template. Pure docs, no behavior change.
3. **#1 (runtime default)** — search-replace existing plan templates that mention `'edge'`. Mechanical.
4. **#5 (real-device checklist)** — add the snippet file. The implement-task prompt addition is one paragraph.
5. **#2 (env-verify helper)** — needs an actual helper implementation. ~80 lines including the Levenshtein. Highest LOC, but mechanical.
6. **#6 (interactive breakpoint)** — depends on #5 to be useful. Order last.
7. **#7 (`NEXT_PUBLIC_*` debug gates)** — docs-only update for the live-verify prompt/checklist. Land whenever touching Next.js chunk-grep guidance.

Each is independently revertable. Each closes one platform-boundary class of bug. None depend on the others to work.

---

## Provenance

These seven improvements came out of a retrospective covering 18 babysitter runs in the cookbook repo over 2026-05-21 → 2026-05-23. The retro is reproducible from the run artifacts at `.a5c/runs/01KS*` in the cookbook source. A rendered HTML version of the retro is preserved at the contributor's machine if reviewers want the full incident-level context.

Open-source projects integrating Vercel/Supabase/iOS/external-APIs through the babysitter will see the same platform-boundary classes. These hardenings aren't cookbook-specific — they generalize.
