# internationalization

The first **internationalization / i18n** specialization in the library. It owns the full
agentic localization pipeline — carrying a source codebase from hardcoded strings through
per-locale translation to a policy-gated production release — with per-locale parallel
fan-out and human approval on every action that commits spend or ships a locale to users.
No i18n specialization existed anywhere in `library/` before this one.

## Flagship process: localization-lifecycle

`localization-lifecycle.js` (`@process internationalization/localization-lifecycle`) walks
one source root through the whole lifecycle:

| Phase | What happens |
|---|---|
| 0 | `kipRecall` at start — glossary terms + prior locale issues thread into every translate and QA task (`kipEnabled`, kind `i18n-glossary`) |
| 1 | String extraction & externalization (`i18n.extract-externalize`) — hardcoded literals rewritten to resource keys, key hygiene enforced (stable dotted keys, dedup, NO runtime concatenation, ICU placeholders/plurals), source catalog + `keyHygiene` report written |
| 2 | Conditional `translation-vendor-spend` policy gate — raised **once** when any target locale routes to a human-vendor tier; `i18n.commit-vendor-spend` executor runs only on `approved===true` |
| 3 | Per-locale parallel pipeline via `ctx.parallel.all` — (3a) `i18n.translate-locale` per `tierRouteFor(locale).route`, (3b) adversarial `internationalization.translation-qa.<locale>` gate, (3c) executed `i18n.regression-sweep` (pseudo-locale + RTL + length-expansion) |
| 4 | Per-locale `locale-publish-approval` policy gate — raised only for locales that PASSED both 3b and 3c; `i18n.publish-locale` executor runs only on `approved===true` |
| 5 | `kipAssert` at close — glossary additions + per-locale QA outcome, regression outcome, and release decision |

**Inputs:** `{ sourceRoot (required, default '.'), sourceLocale?='en-US', targetLocales (required non-empty BCP-47 tags — each must resolve in LOCALE_TIERS), vendor? {name, contactRef} (required when any target routes to a human-vendor tier), glossary? {terms:[{source,target?,doNotTranslate?,note?}]}, resourceDir?='artifacts/i18n/locales', maxFixAttempts?=2, kipEnabled?=true, kipDir?='.a5c/kip', kipModel?='sonnet', artifactsDir? }`

**Outputs:** `{ success, extraction, locales, gatedActions, glossaryAdditions, kipFactsAsserted, artifacts, metadata }` — `success = extraction ok && at least one locale released && every released locale had approved===executed`. Blocked locales are surfaced honestly in `metadata.localesBlocked`, never silently dropped.

## LOCALE_TIERS routing table

A frozen (`Object.freeze`) routing table keyed by BCP-47 tag, styled on
`incident-lifecycle.js` `SEVERITY_ROUTING`. `tierRouteFor(locale)` returns the frozen
entry and **throws** on any locale absent from the table — there is **no default tier**
(fallbacks forbidden). `isRtl(locale)` derives directionality from `RTL_LOCALES`
(`['ar','he','fa','ur']`) and throws on an empty/invalid tag. Operators extend the table
per product.

| locale | tier | route | vendorSpendGated | rtl |
|---|---|---|---|---|
| `ar-SA` | tier1 | human-vendor | true | yes |
| `de-DE` | tier1 | human-vendor | true | no |
| `es-ES` | tier2 | machine-plus-human-review | false | no |
| `fr-FR` | tier1 | human-vendor | true | no |
| `he-IL` | tier2 | machine-plus-human-review | false | yes |
| `ja-JP` | tier1 | human-vendor | true | no |
| `nl-NL` | tier3 | machine-only | false | no |
| `pt-BR` | tier2 | machine-plus-human-review | false | no |

`route` is one of `human-vendor` | `machine-plus-human-review` | `machine-only`.
`vendorSpendGated:true` means the locale's translation contributes to the
`translation-vendor-spend` gate. `LENGTH_EXPANSION_BUDGET` (also frozen) supplies the
per-locale length-expansion threshold used by the regression sweep (German expands most at
1.35; CJK contracts, e.g. `ja-JP` 0.6); it ships an explicit documented `default` entry.

## Policy-gated actions

All approvals go through `routedBreakpoint`; for both policy-gated actions the
`breakpointId` **equals** the actionId and tags are `['policy-gated','internationalization']`.
Fail-closed: the executor task runs **only** on `approved===true` — a rejection is honored,
recorded, and never worked around (no machine-substitution fallback).

| actionId | expert | when | fail-closed behavior |
|---|---|---|---|
| `translation-vendor-spend` | budget-owner | conditional — raised once when `vendorLocales` (any target whose `LOCALE_TIERS` entry has `vendorSpendGated:true`) is non-empty; requires `inputs.vendor` (throws if absent) | executor runs only on `approved===true`; on rejection the vendor-tier locales are recorded **blocked-for-spend** and NOT machine-substituted; skipped entirely (`required:false`) when no vendor tier is targeted |
| `locale-publish-approval` | localization-lead | per locale — raised only for locales that PASSED both the translation-QA gate and the regression sweep | executor runs only on `approved===true`; rejection leaves the locale unreleased (`approved:false`/`executed:false`); blocked locales are recorded `required:false` and never reach the gate |

Additional (non-gated) breakpoint on the surface:

- `internationalization.translation-qa.<locale>.gate-escalation` — raised internally by the
  `adversarialGate` combinator per locale on fix-budget exhaustion (expert `owner`,
  combinator-fixed). The process does not re-declare it; an escalation reject blocks that
  locale.

`outputs.gatedActions` records **every** decision — `{ actionId, required, approved,
autoApproved, response, executed }` — including auto-approvals (recorded raw from the
BreakpointResult) and skipped conditional gates (`{ required:false, approved:false,
autoApproved:false, response:null, executed:false }` — never omitted). `publishLocale` is
keyed per-locale. `metadata.breakpointsHit` logs every raised breakpointId in order.

## Quality bar

- **adversarialGate translation-QA with executed evidence** — three independent critics
  (`glossary-conformance-critic`, `placeholder-integrity-critic`,
  `cultural-back-translation-critic`) fanned out in parallel, all distinct from the
  `localization-translator`. Critics must RUN an executed back-translation diff and a
  programmatic source-vs-target placeholder diff; file-read citations alone do not satisfy
  the gate, and `passed:true` with an empty evidence array is a protocol failure enforced by
  the combinator.
- **Executed regression sweep** — `i18n.regression-sweep` EXECUTES a pseudo-localization
  render, an RTL mirror check (`isRtl`-driven), and a length-expansion measurement vs
  `LENGTH_EXPANSION_BUDGET`; `evidence` is `minItems:1` and the orchestrator honors
  `passed:true` only with non-empty executed evidence.
- **Bounded fix loop** — the shared `gateFixerTask` edits the locale bundle for up to
  `maxFixAttempts` rounds, then the combinator escalates to the owner.
- **No fallbacks** — an unknown locale tier throws (`tierRouteFor`), an unknown locale
  directionality throws (`isRtl`), an empty `targetLocales` throws, a vendor-tier locale
  without `inputs.vendor` throws **before** the spend gate, and a gate-unapproved release is
  never executed via an alternate path. A locale that fails its QA gate (incl. escalation
  reject) or its regression sweep is BLOCKED and surfaced in `metadata.localesBlocked`.

## kip integration

`kipRecall` at start (topic: glossary terms and prior locale issues for the source targets,
kind `i18n-glossary`) and `kipAssert` at close — confirmed/added glossary terms
(`term:<source>` --localizes-to--> `<target>` `{locale}`), per-locale QA outcome
(`locale:<tag>` --qa-gate-outcome-->), regression outcome, and release decision — per
`shared/skills/kip-librarian`. An empty store is a fresh brain, never an error; assert
failures are reported by the librarian task, never swallowed.

## Usage

```bash
babysitter run:create \
  --process library/specializations/internationalization/localization-lifecycle.js \
  --inputs '{
    "sourceRoot": ".",
    "sourceLocale": "en-US",
    "targetLocales": ["de-DE", "ja-JP", "ar-SA", "nl-NL"],
    "vendor": { "name": "Acme Localization", "contactRef": "vendor@acme-loc.example" },
    "glossary": {
      "terms": [
        { "source": "Dashboard", "target": "Übersicht", "note": "de-DE product term" },
        { "source": "Acme", "doNotTranslate": true }
      ]
    },
    "resourceDir": "artifacts/i18n/locales",
    "maxFixAttempts": 2
  }'
```

`targetLocales` above mixes tiers deliberately — `de-DE`/`ja-JP`/`ar-SA` are human-vendor
(so the `translation-vendor-spend` gate fires and `vendor` is required), `ar-SA` is RTL (so
the regression sweep runs a mirror check), and `nl-NL` is machine-only.

## Files

- [`localization-lifecycle.js`](./localization-lifecycle.js) — the flagship process (the
  `i18n.*` Style-A agent tasks + the frozen `LOCALE_TIERS`/`RTL_LOCALES`/
  `LENGTH_EXPANSION_BUDGET` routing tables with throwing lookups + orchestration).
- Combinators: [`../common-utilities/routed-gate-combinators.js`](../common-utilities/routed-gate-combinators.js)
  — `routedBreakpoint`, `adversarialGate`, `gateFixerTask`, `kipRecall`, `kipAssert`.
```
