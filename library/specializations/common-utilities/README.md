# common-utilities

Shared composition utilities for babysitter processes. These modules package the
current quality bar — routed breakpoints, adversarial evidence-mandatory gates,
parallel fan-out, kip recall/assert checkpoints — as importable helpers so
processes stop re-implementing the patterns by hand.

Import pattern (from a process file elsewhere in the library):

```js
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
  KIP_CLI_NOTE,
} from '../common-utilities/routed-gate-combinators.js';
// or via the barrel:
import { fanOutFanIn, pipeline, routedBreakpoint } from '../common-utilities/index.js';
```

## Module catalog

| Module | Exports | Purpose |
| --- | --- | --- |
| `docx-conversion.js` | `convertToDocxTask` | Convert an HTML artifact to .docx via pandoc |
| `parallel-combinator.js` | `fanOutFanIn`, `pipeline` | Fan-out/fan-in and phased pipelines for concurrent tasks |
| `routed-gate-combinators.js` | `routedBreakpoint`, `adversarialGate`, `adversarialCriticTask`, `gateFixerTask`, `kipRecall`, `kipAssert`, `kipRecallTask`, `kipAssertTask`, `KIP_CLI_NOTE` | Routed breakpoints, adversarial IRON-LAW quality gates, kip checkpoints |
| `routed-gate-combinators-demo.js` | `routedGateCombinatorsDemo`, `draftUsageGuideTask` | Exemplar process exercising all three combinators end-to-end |

### docx-conversion

A shared HTML-to-DOCX conversion task using pandoc with graceful fallback.

**Usage:**
```javascript
import { convertToDocxTask } from '../common-utilities/index.js';

// In your process:
const result = await ctx.task(convertToDocxTask, {
  htmlPath: '/path/to/input.html',
  docxPath: '/path/to/output.docx'
});
// result: { success: true, path: '...', converter: 'pandoc' }
// or:     { success: false, path: '...', reason: 'pandoc not installed', converter: 'none' }
```

### parallel-combinator

Utility functions for parallel task execution with fan-out/fan-in patterns.

**fanOutFanIn** - Run multiple tasks in parallel with shared input:
```javascript
import { fanOutFanIn } from '../common-utilities/index.js';

const [strengths, weaknesses] = await fanOutFanIn(ctx, { essay, analysis }, [
  { task: evaluateStrengthsTask },
  { task: evaluateWeaknessesTask }
]);
```

**pipeline** - Sequential phases with optional parallel steps (a nested array
means the steps inside it run in parallel as one phase):
```javascript
import { pipeline } from '../common-utilities/index.js';

const result = await pipeline(ctx, { essay }, [
  { task: analyzeTask, key: 'analysis' },
  [
    { task: strengthsTask, key: 'strengths' },
    { task: weaknessesTask, key: 'weaknesses' }
  ],
  { task: synthesizeTask, key: 'document' }
]);
```

## routedBreakpoint

Thin wrapper over `ctx.breakpoint` that makes routing metadata non-optional:
`breakpointId`, `expert`, and non-empty `tags` are **required** (the helper
throws if any is missing — no fallbacks), `strategy` defaults to `'single'`,
and `label` defaults to the `breakpointId`. Real call site from the demo
process:

```js
const acceptance = await routedBreakpoint(ctx, {
  question: 'Usage guide passed the adversarial gate. Approve the combinators API ergonomics and accept the demo?',
  artifactPath,
  gate,
}, {
  breakpointId: 'common-utilities.demo.owner-acceptance',
  expert: 'owner',
  tags: ['common-utilities', 'combinators', 'acceptance'],
  strategy: 'single',
});
```

Optional routing fields: `label`, `autoApproveAfterN`, `presentAlwaysApprove`.
The `BreakpointResult` is returned unchanged.

## adversarialGate

Fans out independent IRON-LAW critics over an artifact (concurrently, via
`ctx.parallel.all` thunks), reduces their verdicts, runs a bounded fixer loop
between rounds, and escalates to a routed owner breakpoint
(`<gateId>.gate-escalation`) when the fix budget is exhausted. Real call site
from the demo process:

```js
const gate = await adversarialGate(ctx, {
  gateId: 'common-utilities.demo.usage-guide',
  artifact: {
    path: artifactPath,
    description: 'Usage guide for the routed-gate combinators',
  },
  critics: [
    {
      name: 'accuracy-critic',
      role: 'API accuracy reviewer',
      focus: 'every documented signature, default, and contract must match the module source exactly',
    },
    {
      name: 'ergonomics-critic',
      role: 'API ergonomics reviewer',
      focus: 'call sites must be shorter and safer than hand-rolled ctx.breakpoint/ctx.parallel equivalents; flag any awkward required argument or footgun',
    },
  ],
  ironLaw: [
    'Verify every code snippet in the guide against the actual exports in library/specializations/common-utilities/routed-gate-combinators.js — cite file and line for each verified claim.',
  ],
  maxFixAttempts,
  fixer: {},
});
```

Gate contract — the result is always
`{ passed, issues: [{critic, severity, description}], evidence: [{critic, evidence: string[]}], attempts, escalated }`.
**Evidence is mandatory for a pass**: a critic verdict counts as passed only
when `passed === true` AND its `evidence` array is non-empty; an
evidence-empty pass is coerced to a `severity: 'protocol'` failure
(`PASS verdict rejected: no evidence supplied`). `gateId`, a non-empty
`critics` array, and an `artifact.path` are required — the combinator throws
otherwise. `fixer: {}` opts into the built-in `gateFixerTask`; pass
`fixer: { task, args }` for a custom fixer; omit `fixer` entirely to skip the
fix loop and escalate directly on failure.

## kipRecall / kipAssert

Recall-at-start and assert-at-end checkpoints wrapping agent tasks whose
prompts embed `KIP_CLI_NOTE`. `kipRecall` requires a `topic` (throws if
missing); a fresh or missing store is initialized and reported as
`factCount: 0` / `storeInitialized: true`, never an error. `kipAssert`
requires a **non-empty** `facts` array (asserting nothing is a caller bug and
throws); per-fact failures are reported in `failed`, never swallowed. Real
call sites from the demo process:

```js
const recall = await kipRecall(ctx, {
  kipDir,
  topic: 'routed-gate-combinators usage',
  kipModel,
  kind: 'library-enrichment',
});

const assertResult = await kipAssert(ctx, {
  kipDir,
  kipModel,
  kind: 'library-enrichment',
  facts: [
    {
      subject: 'process:routed-gate-combinators-demo',
      predicate: 'exercised',
      object: 'combinator:adversarialGate',
      props: { gateId: 'common-utilities.demo.usage-guide' },
    },
  ],
});
```

## kip CLI note (Windows-safe)

Embedded verbatim into every kip-touching agent prompt as `KIP_CLI_NOTE`:

> kip CLI resolution: use `kip` if on PATH; otherwise invoke Windows-safe as
> `node packages/kip-sdk/dist/cli/kip.js` (npm exec bin resolution is
> unreliable on Windows). Always pass `--dir <kipDir>` and `--json`. If the
> store does not exist yet, run `kip init --dir <kipDir> --create` first and
> treat an empty recall as a fresh brain, not an error. For `kip ask` /
> `kip resolve` structured paths always pass `--model <kipModel>` explicitly
> (weak default models under-fire on JSON-schema adjudication).

## Why these helpers exist (quality-bar rationale)

The `docx-conversion` and `parallel-combinator` utilities were extracted from
a retrospective analysis of essay-critique, extract-oral-prep, and
essay-grading processes where identical patterns were duplicated across
multiple files.

A census of the library found only ~15 of ~2035 breakpoint-using files pass
routing options to `ctx.breakpoint`, and common-utilities had no gate or
breakpoint combinators at all. Every future retrofit batch and new process
should import these helpers instead of re-implementing routing metadata,
IRON-LAW critic prompts, evidence reduction, and Windows-safe kip invocation
by hand — the combinators make the quality bar the path of least resistance.

## Running the demo process

The exemplar process `routedGateCombinatorsDemo` exercises all three
combinators end-to-end and writes its artifact under `ctx.artifactsDir`
(no repo files are touched by demo runs):

```bash
babysitter run:create \
  --process specializations/common-utilities/routed-gate-combinators-demo#routedGateCombinatorsDemo \
  --inputs '{"kipEnabled": true, "maxFixAttempts": 2}'
babysitter run:iterate <runId>
```

Inputs (all optional): `topic`, `kipEnabled` (default `true`), `kipDir`
(default `.a5c/kip`), `kipModel` (default `sonnet`), `maxFixAttempts`
(default `2`). The run pauses at the
`common-utilities.demo.owner-acceptance` breakpoint for owner review, and —
only if the gate exhausts its fix budget — at the routed
`common-utilities.demo.usage-guide.gate-escalation` breakpoint.
