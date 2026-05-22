# Quality gate

A 14-line pipefail-safe shell helper for any babysitter shell task that runs
a test suite and needs to enforce a minimum pass-rate before continuing.

Pairs naturally with:
- [`diagnostic-first-phase`](./diagnostic-first-phase.md) — answers
  *"what does the production data actually say?"*
- [`production-contract` methodology](../../methodologies/production-contract/README.md)
  — answers *"what does the user see when we're done?"*
- This gate — answers *"is the test signal trustworthy enough to ship?"*

## TL;DR

```bash
# In a process shell task:
npx playwright test --reporter=list > /tmp/cookbook-playwright.log 2>&1 || true
bash library/specializations/qa-testing-automation/quality-gate.sh \
  /tmp/cookbook-playwright.log 9500
```

Output:

```
QUALITY_GATE pass=104 fail=2 ratio_bps=9811 threshold_bps=9500
QUALITY_GATE_PASS
```

Exit code 0 on pass, 1 on fail. The pass/fail line is on stdout — parse it
or just echo it to the run's logs.

## Why it exists (the greedy-regex bug)

Process files commonly run Playwright like this:

```bash
npx playwright test --reporter=list 2>&1 | tail -180
```

Two things go wrong:

1. **`tail` buffers** — its output only flushes when its upstream closes,
   so the orchestrator sees nothing until the full suite finishes (often
   90+ seconds). The fix is to write to a file first:
   `... > /tmp/x.log 2>&1; tail -180 /tmp/x.log`. See the sibling
   [output-buffering convention](../../methodologies/production-contract/README.md#shell-task-conventions).

2. **Inline `sed` regex parsers are greedy.** A real bug from the
   contributing project's earlier quality-gate sketch:

   ```bash
   # WRONG — greedy `.*` consumes "9" from "98 passed", captures only "8"
   PASS=$(grep -E "^\s*[0-9]+ passed" log | tail -1 \
          | sed -E "s/.*([0-9]+) passed.*/\1/")
   ```

   For input `"  98 passed (12.0m)"`:
   - `.*` greedily matches `"  9"`
   - `[0-9]+` matches `"0"`
   - ` passed.*` matches `" passed (12.0m)"`
   - captured group = `"0"` (was `"8"` in a different run before the trailing duration)

   So PASS came back as 8 instead of 98. With FAIL=3, the gate computed
   ratio = 8 / (8+3) = 7272 bps, fired `QUALITY_GATE_FAIL`, and the
   downstream chain bailed even though the suite was 98/101 = 9702 bps —
   well above the 9500 threshold.

   The bug only didn't ship because someone happened to hand-test the
   gate against a synthetic `"  90 passed"` input and noticed PASS came
   back as 0.

   The fix is to anchor on the *number* and discard everything else:

   ```bash
   # RIGHT — grep -Eo extracts the whole "N passed" token, awk takes column 1
   PASS=$(grep -Eo "[0-9]+ passed" log | tail -1 | awk '{print $1}')
   ```

   No greedy `.*`, no fragile capture group. This is the form that ships
   in `quality-gate.sh`. **Do not "optimize" it back to a `sed -E` regex
   without re-validating against the test cases in this doc.**

## Args

```
quality-gate.sh <log-path> [min-bps=9500]
```

- `log-path` (required) — path to a file containing a `"N passed"` and
  optionally a `"M failed"` line. Both forms work; any test runner that
  emits this shape (Playwright, vitest, pytest with the right reporter)
  is supported.
- `min-bps` (optional, default `9500`) — minimum pass-rate in basis
  points. 9500 = 95.00%. Pass the threshold your process is comfortable
  shipping at.

## Idiomatic usage in a process file

Inside a process file's full-regression shell task:

```js
shell: {
  command:
    'cd "${PROJECT_DIR}" && ' +
    'npm run typecheck && npm run lint && npm run test:unit && npm run test:data && ' +
    'npx playwright test --reporter=list > /tmp/cookbook-playwright.log 2>&1 || true; ' +
    'bash library/specializations/qa-testing-automation/quality-gate.sh ' +
    '/tmp/cookbook-playwright.log 9500',
  env: { PROJECT_DIR: args.projectDir },
  timeoutMs: 1800000,
}
```

Key points:

- The `|| true` after Playwright keeps the shell from short-circuiting on
  any test failure — let the gate make the pass/fail decision against the
  log, not against Playwright's exit code. (Playwright exits non-zero if
  *any* test failed, which is too strict for a "≥95% is fine" workflow.)
- The redirect-to-file pattern means the orchestrator can `tail -f` the
  log mid-run for visibility, instead of waiting for `... | tail -N` to
  flush at the end.
- `bash` invocation (not `source`) — the gate exits the subshell on
  failure without unwinding the caller's other env state.

## Test cases (run these if you ever change the parsing line)

```bash
# Case 1: 98/101 (97.02%) — should PASS at 9500 threshold
printf '  98 passed (12.0m)\n  3 failed\n' > /tmp/qg-test.log
bash library/specializations/qa-testing-automation/quality-gate.sh /tmp/qg-test.log 9500
# Expected: ratio_bps=9702, QUALITY_GATE_PASS, exit 0

# Case 2: 90/100 (90.00%) — should FAIL at 9500 threshold
printf '  90 passed (5.0m)\n  10 failed\n' > /tmp/qg-test.log
bash library/specializations/qa-testing-automation/quality-gate.sh /tmp/qg-test.log 9500
# Expected: ratio_bps=9000, QUALITY_GATE_FAIL, exit 1

# Case 3: 50/100 (50.00%) — should PASS at 5000 threshold
printf '  50 passed\n  50 failed\n' > /tmp/qg-test.log
bash library/specializations/qa-testing-automation/quality-gate.sh /tmp/qg-test.log 5000
# Expected: ratio_bps=5000, QUALITY_GATE_PASS, exit 0

# Case 4: missing log — should fail with a clear error
bash library/specializations/qa-testing-automation/quality-gate.sh /no/such/file 9500
# Expected: "QUALITY_GATE_FAIL: log not found at /no/such/file", exit 1

# Case 5: log with no counts — should fail with a clear parse error
printf 'no test output here\n' > /tmp/qg-test.log
bash library/specializations/qa-testing-automation/quality-gate.sh /tmp/qg-test.log 9500
# Expected: "QUALITY_GATE_PARSE_FAIL: could not parse pass/fail counts from ...", exit 1
```

## Provenance

Extracted from a Next.js + Supabase project where this gate caught a real
4-test Playwright suite regression *and* surfaced the greedy-regex bug
above during the same run. The 14-line implementation is intentionally
trivial — the contribution is mostly the docs, the test cases, and the
"don't simplify back to sed" guardrail.
