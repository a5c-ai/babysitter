/**
 * @process internationalization/localization-lifecycle
 * @description Flagship extraction-to-release localization lifecycle with per-locale
 *   parallel translation, adversarial translation-QA gates carrying executed evidence,
 *   an executed regression sweep (pseudo-locale + RTL + length-expansion), and two
 *   policy-gated release actions. Single owner for localization across the library:
 *   kip recall of glossary + prior locale issues -> string extraction & externalization
 *   with key hygiene -> conditional translation-vendor-spend policy gate -> per-locale
 *   parallel pipeline (translate -> adversarial translation-QA gate -> executed
 *   regression sweep) -> per-locale policy-gated release -> kip assert at close.
 * @inputs {
 *   sourceRoot: string,          // required — repo/app root whose UI strings are localized (default '.')
 *   sourceLocale: string,        // the authored/base locale, e.g. 'en-US' (default 'en-US')
 *   targetLocales: string[],     // required non-empty — BCP-47 tags; each MUST resolve in LOCALE_TIERS
 *   vendor: {                    // external translation vendor identity — REQUIRED when any
 *     name: string,              //   target locale routes to a human-vendor tier (throws if absent)
 *     contactRef: string
 *   } | null,
 *   glossary: {                  // base terminology; augmented by kipRecall
 *     terms: Array<{ source: string, target?: string, doNotTranslate?: boolean, note?: string }>
 *   } | null,
 *   resourceDir: string,         // where externalized resource bundles live/land (default 'artifacts/i18n/locales')
 *   maxFixAttempts: number,      // bounded fixer budget for the translation-QA gate (default 2)
 *   kipEnabled: boolean,         // recall + assert glossary/locale knowledge via kip (default true)
 *   kipDir: string,              // kip store directory (default '.a5c/kip')
 *   kipModel: string,            // model for kip structured paths (default 'sonnet')
 *   artifactsDir: string         // where extraction/pseudo/regression artifacts land (default ctx.artifactsDir)
 * }
 * @outputs {
 *   success: boolean,
 *   extraction: object,          // { catalogPath, keyCount, externalizedCount, keyHygiene {duplicates, concatenations, placeholderStyle, violations[]}, untranslatedKeys[] }
 *   locales: Array<object>,      // one per target locale: { locale, tier, route, rtl, translation, qaGate {passed,attempts,escalated,issues[],evidence[]}, regression {passed, pseudo, rtl, lengthExpansion, evidence[]}, released, blocked, blockedReason }
 *   gatedActions: object,        // { commitVendorSpend, publishLocale } — publishLocale keyed per-locale; each { actionId, required, approved, autoApproved, response, executed }
 *   glossaryAdditions: Array<object>, // new/confirmed terms surfaced during QA, asserted to kip
 *   kipFactsAsserted: number,
 *   artifacts: string[],
 *   metadata: object             // { processId, runId, breakpointsHit[], localesReleased, localesBlocked[], timings }
 * }
 * @graph
 *   domains: [domain:internationalization, domain:software-engineering]
 *   specializations: [specialization:internationalization]
 *   workflows: [workflow:localization-pipeline, workflow:release-management, workflow:content-translation]
 *   roles: [role:localization-lead, role:localization-engineer, role:translation-vendor, role:budget-owner]
 *   skillAreas: [skill-area:localization, skill-area:quality-assurance, skill-area:orchestration-loop]
 *   topics: [topic:internationalization, topic:accessibility, topic:quality-assurance]
 * @policyGatedActions locale-publish-approval, translation-vendor-spend
 *
 * LOCALE_TIERS (reproduced verbatim — the frozen const below is the implementation):
 *   ar-SA: tier1 | human-vendor              | vendorSpendGated:true   (RTL)
 *   de-DE: tier1 | human-vendor              | vendorSpendGated:true
 *   es-ES: tier2 | machine-plus-human-review | vendorSpendGated:false
 *   fr-FR: tier1 | human-vendor              | vendorSpendGated:true
 *   he-IL: tier2 | machine-plus-human-review | vendorSpendGated:false  (RTL)
 *   ja-JP: tier1 | human-vendor              | vendorSpendGated:true
 *   nl-NL: tier3 | machine-only              | vendorSpendGated:false
 *   pt-BR: tier2 | machine-plus-human-review | vendorSpendGated:false
 * Looking up a locale absent from the table THROWS in tierRouteFor — there is no default
 * tier (fallbacks forbidden). Operators extend the table per product.
 *
 * Hard rules: Style-A agent tasks only (zero kind:'shell'); every evidence-carrying
 * outputSchema declares evidence { type:'array', minItems:1 }; NO fallbacks — an unknown
 * locale tier throws (tierRouteFor), an unknown locale directionality throws (isRtl), an
 * empty targetLocales throws, a vendor-tier locale without inputs.vendor throws BEFORE the
 * spend gate, and a gate-unapproved release is never executed via an alternate path; the
 * QA gate and regression sweep must EXECUTE (back-translation diff, pseudo-localization
 * render, RTL mirror check, length-expansion measurement) — read-only review does not
 * satisfy the evidence contract; a locale that fails its QA gate (incl. escalation reject)
 * or its regression sweep is BLOCKED, its publish breakpoint is never raised, and it is
 * surfaced in metadata.localesBlocked.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  gateFixerTask,
  kipRecall,
  kipAssert,
} from '../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Locale model — frozen routing tables, throwing lookups (no fallbacks)
// ---------------------------------------------------------------------------

/**
 * Routing table keyed by BCP-47 locale tag. Each entry freezes { tier, route,
 * vendorSpendGated }. route is one of 'human-vendor' | 'machine-plus-human-review' |
 * 'machine-only'. vendorSpendGated:true means the locale's translation contributes to
 * the translation-vendor-spend gate. Looking up a locale absent from the table throws
 * in tierRouteFor — no default tier exists. Operators extend it per product.
 */
export const LOCALE_TIERS = Object.freeze({
  'ar-SA': Object.freeze({ tier: 'tier1', route: 'human-vendor', vendorSpendGated: true }),
  'de-DE': Object.freeze({ tier: 'tier1', route: 'human-vendor', vendorSpendGated: true }),
  'es-ES': Object.freeze({ tier: 'tier2', route: 'machine-plus-human-review', vendorSpendGated: false }),
  'fr-FR': Object.freeze({ tier: 'tier1', route: 'human-vendor', vendorSpendGated: true }),
  'he-IL': Object.freeze({ tier: 'tier2', route: 'machine-plus-human-review', vendorSpendGated: false }),
  'ja-JP': Object.freeze({ tier: 'tier1', route: 'human-vendor', vendorSpendGated: true }),
  'nl-NL': Object.freeze({ tier: 'tier3', route: 'machine-only', vendorSpendGated: false }),
  'pt-BR': Object.freeze({ tier: 'tier2', route: 'machine-plus-human-review', vendorSpendGated: false }),
});

/**
 * RTL locale language subtags. isRtl splits the BCP-47 tag and checks membership; it
 * throws only when handed an empty/invalid tag. Drives the regression sweep's RTL mirror
 * check and the rtl flag reported per locale.
 */
export const RTL_LOCALES = Object.freeze(['ar', 'he', 'fa', 'ur']);

/**
 * Expected worst-case UI length-expansion ratio vs. source, per locale (German expands
 * most; CJK contracts). The regression sweep uses it as the pass/fail threshold for
 * length-expansion overflow — a measured expansion beyond budget with clipped/overflowing
 * layout is a regression, not a warning. The table ships an explicit 'default' budget
 * entry: applying it is a documented table value, not a synthesized fallback (an unknown
 * locale still throws upstream in tierRouteFor before it is ever measured).
 */
export const LENGTH_EXPANSION_BUDGET = Object.freeze({
  'de-DE': 1.35,
  'fr-FR': 1.3,
  'es-ES': 1.3,
  'pt-BR': 1.3,
  'nl-NL': 1.3,
  'ar-SA': 1.2,
  'he-IL': 1.2,
  'ja-JP': 0.6,
  default: 1.3,
});

/**
 * Routing lookup. THROWS on an empty/invalid tag and on a locale absent from
 * LOCALE_TIERS — there is deliberately no default tier (fallbacks forbidden).
 *
 * @param {string} locale - A BCP-47 locale tag present in LOCALE_TIERS
 * @returns {{ tier: string, route: string, vendorSpendGated: boolean }} The frozen entry
 */
export function tierRouteFor(locale) {
  if (!locale || typeof locale !== 'string') {
    throw new Error(`tierRouteFor: locale must be a non-empty BCP-47 tag (got ${JSON.stringify(locale)})`);
  }
  const entry = LOCALE_TIERS[locale];
  if (!entry) {
    throw new Error(
      `Unknown locale tier for ${locale} — LOCALE_TIERS has no entry and no default tier exists ` +
      `(fallbacks forbidden). Known locales: ${Object.keys(LOCALE_TIERS).join(', ')}.`
    );
  }
  return entry;
}

/**
 * Directionality lookup. Splits the BCP-47 tag to its language subtag and checks RTL
 * membership. THROWS on an empty/invalid tag — never guesses a direction.
 *
 * @param {string} locale - A BCP-47 locale tag
 * @returns {boolean} true when the language subtag is right-to-left
 */
export function isRtl(locale) {
  if (!locale || typeof locale !== 'string') {
    throw new Error(`isRtl: locale must be a non-empty BCP-47 tag (got ${JSON.stringify(locale)})`);
  }
  const subtag = locale.split('-')[0].trim().toLowerCase();
  if (!subtag) {
    throw new Error(`isRtl: could not extract a language subtag from ${JSON.stringify(locale)} — no fallback direction is assumed.`);
  }
  return RTL_LOCALES.includes(subtag);
}

/**
 * Length-expansion budget lookup for a locale. Returns the per-locale budget when the
 * table has one, otherwise the table's explicit documented 'default' entry.
 *
 * @param {string} locale - A BCP-47 locale tag
 * @returns {number} The worst-case expansion ratio budget
 */
export function lengthBudgetFor(locale) {
  if (!locale || typeof locale !== 'string') {
    throw new Error(`lengthBudgetFor: locale must be a non-empty BCP-47 tag (got ${JSON.stringify(locale)})`);
  }
  return Object.prototype.hasOwnProperty.call(LENGTH_EXPANSION_BUDGET, locale)
    ? LENGTH_EXPANSION_BUDGET[locale]
    : LENGTH_EXPANSION_BUDGET.default;
}

/**
 * Fail-closed audit record for one policy-gated action.
 * approved is strictly bpResult.approved === true; autoApproved is read from the
 * BreakpointResult's raw auto-approval marker fields (recorded raw — never inferred from
 * interactivity); response is bpResult.response ?? bpResult.feedback ?? null. A skipped
 * conditional gate is recorded as
 * { required:false, approved:false, autoApproved:false, response:null, executed:false }
 * — never omitted.
 *
 * @param {string} actionId - The policy-gated action id (equals its breakpointId)
 * @param {boolean} required - Whether the gate was raised for this run
 * @param {object|null} bpResult - The BreakpointResult, or null when not required
 * @param {boolean} executed - Whether the guarded executor actually ran
 * @returns {{actionId: string, required: boolean, approved: boolean, autoApproved: boolean, response: (string|null), executed: boolean}}
 */
export function recordGatedAction(actionId, required, bpResult, executed) {
  if (!required) {
    return { actionId, required: false, approved: false, autoApproved: false, response: null, executed: false };
  }
  return {
    actionId,
    required: true,
    approved: bpResult.approved === true,
    autoApproved: bpResult.autoApproved === true || bpResult.autoApprove === true,
    response: bpResult.response ?? bpResult.feedback ?? null,
    executed: executed === true,
  };
}

// ---------------------------------------------------------------------------
// Phase 1 — String extraction & externalization + key hygiene
// ---------------------------------------------------------------------------

export const extractExternalizeTask = defineTask('i18n.extract-externalize', (args, taskCtx) => ({
  kind: 'agent',
  title: `Extract & externalize source strings from ${args.sourceRoot}`,
  agent: {
    name: 'i18n-extraction-engineer',
    prompt: {
      role: 'String extraction & externalization engineer',
      task: `Scan ${args.sourceRoot} for user-facing strings and externalize them into a resource catalog under ${args.catalogDir}`,
      context: args,
      instructions: [
        'Scan the source root for hardcoded user-facing string literals and rewrite them to resource-key references.',
        `Write the source-locale catalog under ${args.catalogDir} and report its exact catalogPath.`,
        'Enforce key hygiene: stable dotted keys, dedup duplicate messages, and flag every runtime string concatenation as a violation (concatenation defeats translation).',
        'Normalize ICU / message-format placeholders; express plurals as ICU plural, NOT as conditional string assembly.',
        'keyHygiene.violations[] must list each concrete offender (file:key) — do not summarize away real problems.',
        'untranslatedKeys[] enumerates every key that still needs translation; it seeds the per-locale fan-out.',
        'EXECUTE the scan (grep/AST) and cite the raw scan output as evidence — at least one entry; a claim without a run is not evidence.',
      ],
      outputFormat: 'JSON with catalogPath string, keyCount number, externalizedCount number, keyHygiene { duplicates array, concatenations array, placeholderStyle string, violations array }, untranslatedKeys array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['catalogPath', 'keyCount', 'externalizedCount', 'keyHygiene', 'untranslatedKeys', 'evidence'],
      properties: {
        catalogPath: { type: 'string' },
        keyCount: { type: 'number' },
        externalizedCount: { type: 'number' },
        keyHygiene: {
          type: 'object',
          required: ['duplicates', 'concatenations', 'placeholderStyle', 'violations'],
          properties: {
            duplicates: { type: 'array' },
            concatenations: { type: 'array' },
            placeholderStyle: { type: 'string' },
            violations: { type: 'array' },
          },
        },
        untranslatedKeys: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'i18n', 'internationalization', 'extraction'],
}));

// ---------------------------------------------------------------------------
// Phase 2 — Vendor-spend executor (guarded: runs ONLY on approved === true)
// ---------------------------------------------------------------------------

export const commitVendorSpendTask = defineTask('i18n.commit-vendor-spend', (args, taskCtx) => ({
  kind: 'agent',
  title: `Commit vendor spend with ${args.vendor.name} for ${args.locales.length} locale(s)`,
  agent: {
    name: 'localization-coordinator',
    prompt: {
      role: 'Vendor-spend executor',
      task: 'Record the approved vendor commitment and hand the segment manifest to the vendor-tier translate strands',
      context: args,
      instructions: [
        'This task only ever runs AFTER the translation-vendor-spend policy gate approved the commitment in context — there is no alternate path.',
        `Record the commitment (vendor, locales, estimatedSegments, approved amount) to ${args.commitmentPath} and report that exact path back.`,
        'Prepare the per-locale segment manifest the human-vendor strands will consume; do NOT machine-substitute any vendor-tier locale.',
        'Report the estimatedSegments you committed against so downstream cost reconciliation is honest.',
      ],
      outputFormat: 'JSON with committed boolean, commitmentPath string, vendor string, locales array, estimatedSegments number',
    },
    outputSchema: {
      type: 'object',
      required: ['committed', 'commitmentPath'],
      properties: {
        committed: { type: 'boolean' },
        commitmentPath: { type: 'string' },
        vendor: { type: 'string' },
        locales: { type: 'array' },
        estimatedSegments: { type: 'number' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'i18n', 'internationalization', 'policy-gated', 'vendor'],
}));

// ---------------------------------------------------------------------------
// Phase 3a — Per-locale translation
// ---------------------------------------------------------------------------

export const translateLocaleTask = defineTask('i18n.translate-locale', (args, taskCtx) => ({
  kind: 'agent',
  title: `Translate ${args.catalogPath} into ${args.locale} (${args.route})`,
  agent: {
    name: 'localization-translator',
    prompt: {
      role: 'Per-locale translator',
      task: `Produce the ${args.locale} resource bundle from the source catalog via the ${args.route} route`,
      context: args,
      instructions: [
        `Translate every untranslated key of ${args.catalogPath} into ${args.locale} and write the bundle to ${args.bundlePath}; report that exact path.`,
        'Route rules: human-vendor -> consume the vendor-committed segments in context (never machine-substitute); machine-only -> translate directly; machine-plus-human-review -> translate and add each uncertain segment to flaggedForReview.',
        'Preserve ICU / message-format placeholders and interpolation variables EXACTLY as in the source — a dropped or renamed placeholder is a hard defect.',
        'Apply the working glossary in context: render each glossary term to its approved target; leave doNotTranslate terms untouched. Return the terms you actually used in glossaryUsed.',
        'Thread priorKnowledge (recalled prior locale issues) so known problems are not reintroduced.',
        'placeholderPreserved reports honestly whether every placeholder survived; do not claim true if you dropped any.',
      ],
      outputFormat: 'JSON with locale string, bundlePath string, route string, translatedCount number, placeholderPreserved boolean, flaggedForReview array, glossaryUsed array',
    },
    outputSchema: {
      type: 'object',
      required: ['locale', 'bundlePath', 'route', 'translatedCount', 'placeholderPreserved'],
      properties: {
        locale: { type: 'string' },
        bundlePath: { type: 'string' },
        route: { type: 'string' },
        translatedCount: { type: 'number' },
        placeholderPreserved: { type: 'boolean' },
        flaggedForReview: { type: 'array' },
        glossaryUsed: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'i18n', 'internationalization', 'translation'],
}));

// ---------------------------------------------------------------------------
// Phase 3c — Executed regression sweep (pseudo-locale + RTL + length-expansion)
// ---------------------------------------------------------------------------

export const regressionSweepTask = defineTask('i18n.regression-sweep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Regression sweep for ${args.locale} (budget ${args.lengthBudget})`,
  agent: {
    name: 'localization-qa-engineer',
    prompt: {
      role: 'Locale regression engineer',
      task: `EXECUTE the localization regression sweep against the ${args.locale} bundle at ${args.bundlePath}`,
      context: args,
      instructions: [
        'EXECUTE a pseudo-localization render of the bundle and report every clipped/overflowing element in pseudo.overflows[] — a read-only skim is invalid.',
        `RTL: rtl.applicable is ${args.rtl} for this locale. When applicable, EXECUTE a mirror check and report mirrored plus any unmirrored elements in rtl.issues[]; when not applicable, report applicable:false, mirrored:false, issues:[].`,
        `Length-expansion: MEASURE the rendered target length vs source per key and report lengthExpansion.maxRatio; the budget is ${args.lengthBudget}. Any measured expansion beyond budget that clips/overflows layout is a regression recorded in lengthExpansion.overflows[].`,
        'passed:true requires the pseudo render clean, RTL mirror clean where applicable, AND maxRatio within budget (or over-budget strings that still fit). Anything else is passed:false, reported honestly.',
        'evidence[] must carry the RAW executed render/measurement output (pseudo render dump, mirror-check output, per-key ratio table) — at least one entry; passed:true with empty evidence is a protocol failure.',
      ],
      outputFormat: 'JSON with locale string, passed boolean, pseudo { ran boolean, overflows array }, rtl { applicable boolean, mirrored boolean, issues array }, lengthExpansion { maxRatio number, budget number, overflows array }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['locale', 'passed', 'pseudo', 'rtl', 'lengthExpansion', 'evidence'],
      properties: {
        locale: { type: 'string' },
        passed: { type: 'boolean' },
        pseudo: {
          type: 'object',
          required: ['ran', 'overflows'],
          properties: {
            ran: { type: 'boolean' },
            overflows: { type: 'array' },
          },
        },
        rtl: {
          type: 'object',
          required: ['applicable', 'mirrored', 'issues'],
          properties: {
            applicable: { type: 'boolean' },
            mirrored: { type: 'boolean' },
            issues: { type: 'array' },
          },
        },
        lengthExpansion: {
          type: 'object',
          required: ['maxRatio', 'budget', 'overflows'],
          properties: {
            maxRatio: { type: 'number' },
            budget: { type: 'number' },
            overflows: { type: 'array' },
          },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'i18n', 'internationalization', 'regression', 'quality-gate'],
}));

// ---------------------------------------------------------------------------
// Phase 4 — Locale-release executor (guarded: runs ONLY on approved === true)
// ---------------------------------------------------------------------------

export const publishLocaleTask = defineTask('i18n.publish-locale', (args, taskCtx) => ({
  kind: 'agent',
  title: `Publish approved ${args.locale} bundle to the released resource path`,
  agent: {
    name: 'localization-coordinator',
    prompt: {
      role: 'Locale-release executor',
      task: `Promote the approved ${args.locale} bundle from staging to the released resource path`,
      context: args,
      instructions: [
        `This task only ever runs AFTER the ${args.locale} locale-publish-approval breakpoint approved the release in context — there is no alternate release path.`,
        `Promote ${args.bundlePath} to the released resource path under ${args.releasedDir}, applying the approver's edits in context VERBATIM; report the exact releasedPath.`,
        'Record releasedAt as an ISO timestamp.',
        'Do not alter any locale other than the approved one.',
      ],
      outputFormat: 'JSON with released boolean, releasedPath string, locale string, releasedAt string',
    },
    outputSchema: {
      type: 'object',
      required: ['released', 'releasedPath', 'locale'],
      properties: {
        released: { type: 'boolean' },
        releasedPath: { type: 'string' },
        locale: { type: 'string' },
        releasedAt: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'i18n', 'internationalization', 'policy-gated', 'release'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    sourceRoot = '.',
    sourceLocale = 'en-US',
    targetLocales,
    vendor = null,
    glossary = null,
    resourceDir = 'artifacts/i18n/locales',
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    artifactsDir,
  } = inputs || {};

  // -------------------------------------------------------------------------
  // Input validation — no fallbacks: refuse to guess missing/unknown fields
  // -------------------------------------------------------------------------
  if (!Array.isArray(targetLocales) || targetLocales.length === 0) {
    throw new Error(
      'localization-lifecycle requires a non-empty targetLocales array of BCP-47 tags — refusing to localize into nothing.'
    );
  }
  // Every target must resolve in LOCALE_TIERS; tierRouteFor throws on any unknown tag.
  const routing = targetLocales.map((locale) => ({ locale, ...tierRouteFor(locale), rtl: isRtl(locale) }));
  const vendorLocales = routing.filter((r) => r.vendorSpendGated === true).map((r) => r.locale);
  if (vendorLocales.length > 0 && (!vendor || !vendor.name)) {
    throw new Error(
      `localization-lifecycle: target locales ${vendorLocales.join(', ')} route to a human-vendor tier, ` +
      'so inputs.vendor { name, contactRef } is required BEFORE the spend gate — no machine substitution fallback exists.'
    );
  }

  const artifactsRoot = artifactsDir ?? ctx.artifactsDir;
  const nowIso = () => new Date().toISOString();
  const startedAt = nowIso();
  const startMs = ctx.now();

  const breakpointsHit = [];
  const artifacts = [];
  const recordGate = (breakpointId, result) => {
    breakpointsHit.push(breakpointId);
    return result;
  };

  const workingGlossary = { terms: [...((glossary && glossary.terms) || [])] };

  // -------------------------------------------------------------------------
  // Phase 0 — kip recall: glossary terms + prior locale issues
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P0: kip recall — glossary + prior locale issues');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'i18n-glossary',
      topic: `glossary terms and prior locale issues for ${sourceRoot} targets ${targetLocales.join(',')}`,
    });
  }

  // -------------------------------------------------------------------------
  // Phase 1 — string extraction & externalization + key hygiene
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P1: string extraction & externalization');
  const catalogDir = `${resourceDir}/${sourceLocale}`;
  const extraction = await ctx.task(extractExternalizeTask, {
    sourceRoot,
    sourceLocale,
    catalogDir,
    glossary: workingGlossary,
    priorKnowledge,
  });
  artifacts.push(extraction.catalogPath);
  const estimatedSegments = Array.isArray(extraction.untranslatedKeys)
    ? extraction.untranslatedKeys.length
    : extraction.keyCount;

  // -------------------------------------------------------------------------
  // Phase 2 — conditional translation-vendor-spend policy gate (raised ONCE)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P2: translation-vendor-spend gate (conditional, policy-gated)');
  let vendorSpendApproved = false;
  let commitVendorSpend;
  let vendorCommitment = null;
  if (vendorLocales.length > 0) {
    const spendGate = await routedBreakpoint(ctx, {
      question: `Approve committing translation spend with vendor "${vendor.name}" for ${vendorLocales.length} human-vendor locale(s): ${vendorLocales.join(', ')}?`,
      vendor,
      vendorLocales,
      estimatedSegments,
      catalogPath: extraction.catalogPath,
    }, {
      breakpointId: 'translation-vendor-spend',
      expert: 'budget-owner',
      tags: ['policy-gated', 'internationalization'],
      strategy: 'single',
      // Deliberately NO autoApproveAfterN — spend commitment is always a human decision.
    });
    recordGate('translation-vendor-spend', spendGate);
    if (spendGate.approved === true) {
      vendorSpendApproved = true;
      vendorCommitment = await ctx.task(commitVendorSpendTask, {
        vendor,
        locales: vendorLocales,
        estimatedSegments,
        commitmentPath: `${artifactsRoot}/vendor-commitment.json`,
      });
      artifacts.push(vendorCommitment.commitmentPath);
    }
    // Fail closed: on rejection the vendor-tier locales are recorded blocked-for-spend and
    // NOT machine-substituted (substitution would be a forbidden fallback).
    commitVendorSpend = recordGatedAction('translation-vendor-spend', true, spendGate, vendorSpendApproved);
  } else {
    // Skipped entirely — recorded required:false, never omitted.
    commitVendorSpend = recordGatedAction('translation-vendor-spend', false, null, false);
  }

  // -------------------------------------------------------------------------
  // Phase 3 — per-locale parallel pipeline: translate -> QA gate -> regression
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P3: per-locale parallel pipeline (ctx.parallel.all)');
  const runLocaleStrand = (route) => async () => {
    const { locale, tier, route: translationRoute, vendorSpendGated, rtl } = route;
    const record = {
      locale,
      tier,
      route: translationRoute,
      rtl,
      translation: null,
      qaGate: null,
      regression: null,
      released: false,
      blocked: false,
      blockedReason: null,
      breakpoints: [],
    };

    // A vendor-tier locale whose spend gate was rejected is blocked-for-spend. It is NOT
    // machine-substituted — that would be a forbidden fallback.
    if (vendorSpendGated && !vendorSpendApproved) {
      record.blocked = true;
      record.blockedReason = 'vendor-spend-not-approved';
      return record;
    }

    // (3a) translate
    const bundlePath = `${resourceDir}/${locale}/messages.json`;
    record.translation = await ctx.task(translateLocaleTask, {
      locale,
      route: translationRoute,
      tier,
      catalogPath: extraction.catalogPath,
      bundlePath,
      untranslatedKeys: extraction.untranslatedKeys,
      glossary: workingGlossary,
      priorKnowledge,
      vendorCommitment: translationRoute === 'human-vendor' ? vendorCommitment : null,
    });

    // (3b) adversarial translation-QA gate — independent critics, executed evidence
    const gateId = `internationalization.translation-qa.${locale}`;
    const qaGate = await adversarialGate(ctx, {
      gateId,
      artifact: { path: record.translation.bundlePath, description: `${locale} locale resource bundle` },
      critics: [
        {
          name: 'glossary-conformance-critic',
          role: 'Glossary conformance reviewer',
          focus: 'every glossary term rendered per the approved target and every do-not-translate term left untouched — re-check each term against the bundle and CITE the exact key:line; an unverifiable term is an issue, not a pass',
        },
        {
          name: 'placeholder-integrity-critic',
          role: 'Placeholder integrity reviewer',
          focus: 'ICU/message-format placeholders, plural categories, and interpolation vars preserved exactly vs source — DIFF placeholders source-vs-target programmatically and cite the executed diff output; any dropped/renamed placeholder is a hard fail',
        },
        {
          name: 'cultural-back-translation-critic',
          role: 'Cultural & back-translation reviewer',
          focus: 'meaning fidelity and cultural-appropriateness — EXECUTE a back-translation of a representative sample and cite the back-translation diff; flag culturally-sensitive segments explicitly; read-only review is invalid',
        },
      ],
      ironLaw: [
        'Executed evidence only: run the actual back-translation and placeholder diff — a read-only skim of the bundle is not evidence.',
        'Cite file:key or executed-diff output for every claim; passed:true with an empty evidence array is rejected by the combinator.',
      ],
      maxFixAttempts,
      fixer: { task: gateFixerTask },
      context: {
        locale,
        route: translationRoute,
        catalogPath: extraction.catalogPath,
        glossary: workingGlossary,
        priorKnowledge,
        flaggedForReview: record.translation.flaggedForReview ?? [],
      },
    });
    record.qaGate = {
      passed: qaGate.passed,
      attempts: qaGate.attempts,
      escalated: qaGate.escalated,
      issues: qaGate.issues,
      evidence: qaGate.evidence,
    };
    if (qaGate.escalated) {
      record.breakpoints.push(`${gateId}.gate-escalation`);
    }
    if (qaGate.passed !== true) {
      // Failed QA (incl. escalation reject) — blocked, skips the regression sweep and phase 4.
      record.blocked = true;
      record.blockedReason = 'translation-qa-gate-failed';
      return record;
    }

    // (3c) executed regression sweep — gate on passed AND non-empty evidence
    const regression = await ctx.task(regressionSweepTask, {
      locale,
      bundlePath: record.translation.bundlePath,
      rtl,
      lengthBudget: lengthBudgetFor(locale),
      catalogPath: extraction.catalogPath,
    });
    const regressionEvidenceOk = Array.isArray(regression.evidence) && regression.evidence.length > 0;
    record.regression = {
      passed: regression.passed,
      pseudo: regression.pseudo,
      rtl: regression.rtl,
      lengthExpansion: regression.lengthExpansion,
      evidence: regression.evidence,
    };
    if (regression.passed !== true || !regressionEvidenceOk) {
      // Iron law mirrored in the orchestrator: passed:true is only honored with executed evidence.
      record.blocked = true;
      record.blockedReason = regressionEvidenceOk
        ? 'regression-sweep-failed'
        : 'regression-sweep-no-executed-evidence';
      return record;
    }

    return record;
  };

  const localeRecords = await ctx.parallel.all(routing.map((r) => runLocaleStrand(r)));
  // Merge per-strand escalation breakpoints into the ordered run log.
  for (const record of localeRecords) {
    for (const bp of record.breakpoints) {
      breakpointsHit.push(bp);
    }
  }

  // -------------------------------------------------------------------------
  // Phase 4 — per-locale policy-gated release (only locales that cleared 3b + 3c)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P4: per-locale locale-publish-approval gate');
  const publishLocale = {};
  const releasedDir = `${resourceDir}/released`;
  for (const record of localeRecords) {
    if (record.blocked) {
      // Blocked locales never reach the release gate — recorded required:false, not omitted.
      publishLocale[record.locale] = recordGatedAction('locale-publish-approval', false, null, false);
      continue;
    }
    const pubGate = await routedBreakpoint(ctx, {
      question: `Publish the ${record.locale} (${record.tier}/${record.route}) locale to production users?`,
      locale: record.locale,
      rtl: record.rtl,
      qaGate: record.qaGate,
      regressionEvidence: record.regression.evidence,
      bundlePath: record.translation.bundlePath,
    }, {
      breakpointId: 'locale-publish-approval',
      expert: 'localization-lead',
      tags: ['policy-gated', 'internationalization'],
      strategy: 'single',
    });
    recordGate('locale-publish-approval', pubGate);
    let executed = false;
    if (pubGate.approved === true) {
      const published = await ctx.task(publishLocaleTask, {
        locale: record.locale,
        bundlePath: record.translation.bundlePath,
        releasedDir,
        approverEdits: pubGate.response ?? pubGate.feedback ?? null,
      });
      executed = published.released === true;
      record.released = executed;
      if (published.releasedPath) {
        artifacts.push(published.releasedPath);
      }
    }
    // Fail closed: the publish executor is NEVER invoked without approved===true.
    publishLocale[record.locale] = recordGatedAction('locale-publish-approval', true, pubGate, executed);
  }

  // -------------------------------------------------------------------------
  // Phase 5 — kip assert: glossary additions + per-locale QA/regression/release
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P5: kip assert — glossary additions + QA findings');
  const glossaryAdditions = [];
  const seenTerms = new Set();
  for (const record of localeRecords) {
    const used = (record.translation && record.translation.glossaryUsed) || [];
    for (const term of used) {
      if (!term || typeof term !== 'object') continue;
      const source = term.source;
      const target = term.target;
      if (!source || !target) continue;
      const dedupKey = `${source}=>${target}@${record.locale}`;
      if (seenTerms.has(dedupKey)) continue;
      seenTerms.add(dedupKey);
      glossaryAdditions.push({ source, target, locale: record.locale });
    }
  }

  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const facts = [];
    for (const addition of glossaryAdditions) {
      facts.push({
        subject: `term:${addition.source}`,
        predicate: 'localizes-to',
        object: addition.target,
        props: { locale: addition.locale },
      });
    }
    for (const record of localeRecords) {
      if (record.qaGate) {
        facts.push({
          subject: `locale:${record.locale}`,
          predicate: 'qa-gate-outcome',
          object: 'internationalization.translation-qa',
          props: { passed: record.qaGate.passed, attempts: record.qaGate.attempts, escalated: record.qaGate.escalated },
        });
      }
      if (record.regression) {
        facts.push({
          subject: `locale:${record.locale}`,
          predicate: 'regression-outcome',
          object: 'internationalization.regression-sweep',
          props: {
            passed: record.regression.passed,
            rtl: record.rtl,
            maxExpansionRatio: record.regression.lengthExpansion ? record.regression.lengthExpansion.maxRatio : null,
          },
        });
      }
      const decision = publishLocale[record.locale];
      facts.push({
        subject: `locale:${record.locale}`,
        predicate: 'release-decision',
        object: 'locale-publish-approval',
        props: { approved: decision.approved, autoApproved: decision.autoApproved, executed: decision.executed },
      });
    }
    // facts is guaranteed non-empty: every target locale contributes a release-decision fact.
    const asserted = await kipAssert(ctx, { kipDir, kipModel, kind: 'i18n-glossary', facts });
    kipFactsAsserted = asserted.asserted;
  }

  // -------------------------------------------------------------------------
  // Assemble result + metadata
  // -------------------------------------------------------------------------
  const localesOut = localeRecords.map((r) => ({
    locale: r.locale,
    tier: r.tier,
    route: r.route,
    rtl: r.rtl,
    translation: r.translation,
    qaGate: r.qaGate,
    regression: r.regression,
    released: r.released,
    blocked: r.blocked,
    blockedReason: r.blockedReason,
  }));
  const localesReleasedTags = localesOut.filter((r) => r.released === true).map((r) => r.locale);
  const localesBlocked = localesOut.filter((r) => r.blocked === true).map((r) => r.locale);

  // success = extraction ok && at least one locale released && every released locale had
  // approved===executed && no gate protocol failure; blocked locales surfaced honestly.
  const releasedApprovalsConsistent = localesReleasedTags.every((locale) => {
    const decision = publishLocale[locale];
    return decision.approved === decision.executed;
  });
  const success =
    !!extraction &&
    !!extraction.catalogPath &&
    localesReleasedTags.length >= 1 &&
    releasedApprovalsConsistent;

  return {
    success,
    extraction,
    locales: localesOut,
    gatedActions: { commitVendorSpend, publishLocale },
    glossaryAdditions,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'internationalization/localization-lifecycle',
      runId: ctx.runId,
      breakpointsHit,
      localesReleased: localesReleasedTags.length,
      localesBlocked,
      timings: { startedAt, finishedAt: nowIso(), elapsedMs: ctx.now() - startMs },
    },
  };
}
