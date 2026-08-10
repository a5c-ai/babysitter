/**
 * @process methodologies/composition-open-source-data-validation
 * @description Open-source data-validation library composition (methodology backlog Example 7):
 *   composes TDD (red-green-refactor per validation rule) + BDD Specification by Example
 *   (Gherkin acceptance scenarios per behavior) + Kanban (community-contribution flow:
 *   Backlog -> In Progress -> Review -> Done, no WIP limit) + XP (collective ownership,
 *   coding standards, simple design, continuous integration, small releases) + Continuous
 *   Deployment (stage-promotion pipeline to a public package registry). Requirements are mined
 *   from community signals into a prioritized RFC; BDD scenarios are authored per rule (parallel);
 *   rules are implemented test-first on a Kanban board under XP constraints (parallel); an
 *   executed TDD+BDD suite gate proves a rule -> scenario -> test traceability matrix; an inline
 *   CD pipeline promotes stage-by-stage as a dry-run; package publish, breaking-change release,
 *   and community announcement are policy-gated with routed-breakpoint provenance.
 * @composes library/methodologies/tdd.js (red-green-refactor loop; a FILE exporting only
 *   `process`, so this composition defines its own cod.* tasks mirroring its phase semantics
 *   rather than importing task constants),
 *   library/methodologies/bdd-specification-by-example/bdd-process.js (discovery-workshop /
 *   gherkin-formulation / execute-tests semantics mirrored by cod.bdd-scenario-authoring),
 *   library/methodologies/kanban/kanban.js (pull-system / flow-metrics semantics mirrored by
 *   cod.contribution-triage), library/methodologies/extreme-programming/xp-process.js
 *   (continuous-integration / refactoring semantics mirrored by cod.ci-check and the XP
 *   constraints in cod.tdd-implement-rule). INLINE-CD NOTE: no
 *   library/methodologies/continuous-deployment/ directory exists; per the batch-3 strangler-fig
 *   inline-ingredient precedent (composition-legacy-modernization models the Strangler Fig cutover
 *   inline via clm.cutover.* rather than importing a nonexistent dir), the Continuous Deployment
 *   ingredient is modeled INLINE here via cod.cd-pipeline-stage over a frozen ordered
 *   PIPELINE_STAGES list, borrowing the stage-promotion semantics of
 *   library/specializations/release-engineering/release-lifecycle.js (frozen ordered stages,
 *   entry-gated promotion, executed per-stage verification). This module NEVER imports or
 *   references a continuous-deployment path and NEVER falls back.
 * @policyGatedActions package-publish-approval (project-maintainer) — approve publishing a new
 *   package version to the public registry; breaking-change-release (project-maintainer) —
 *   approve a semver-major release containing breaking API changes, raised ONLY when semver
 *   analysis classifies the bump as major; community-announcement-send (community-manager) —
 *   approve sending the release announcement to community channels. Each raised via
 *   routedBreakpoint with breakpointId = actionId, tags ['policy-gated','cod', <phase-tag>],
 *   strategy 'single', no autoApproveAfterN; every executor branch guards on approved === true
 *   and records { approved, autoApproved: response?.autoApproved === true, breakpointId, expert,
 *   response } provenance.
 * @supersedes the '📝 Not Implemented' status of backlog Example 7 only
 *   (library/methodologies/backlog.md ~line 2291, "Open Source Library — Data Validation
 *   Framework"); no code module is replaced.
 * @graph
 *   domains: [domain:software-engineering, domain:open-source]
 *   specializations: [specialization:qa-testing-automation, specialization:release-engineering]
 *   skillAreas: [skill-area:acceptance-testing, skill-area:continuous-delivery]
 *   workflows: [workflow:feature-development, workflow:release-management, workflow:community-contribution]
 *   topics: [topic:test-driven-development, topic:behavior-driven-development, topic:continuous-deployment]
 *   roles: [role:maintainer, role:contributor, role:community-manager]
 * @inputs { libraryName: string (required), libraryDescription: string (required),
 *   validationRules?: Array<{ ruleId, title, description, priority?, votes?, parallelSafe?,
 *   dependsOn? }>, communitySignals?: string, contributions?: Array<{ contributionId,
 *   kind: 'feature'|'bug'|'documentation', ruleRef?, summary, parallelSafe?, dependsOn? }>,
 *   currentVersion?: string (default '0.0.0'), registry?: string (default 'npm'),
 *   pipelineStagesOverride?: string[]|null (default null — strict prefix-ordered subset of
 *   PIPELINE_STAGES; unknown stage THROWS), maxFixAttempts?: number (default 2),
 *   kipEnabled?: boolean (default true), kipDir?: string (default '.a5c/kip'),
 *   kipModel?: string (default 'sonnet') }
 * @outputs { success: boolean, rfc, scenarios, bddGate, board, implementations, reviews,
 *   suiteGate, cdPipeline, semver, breakingChange, publish, release, announcement, retro,
 *   kipFactsAsserted: number, artifacts: array,
 *   metadata: { processId, runId, breakpointsHit, pipeline: { stages, dryRun: true } } }
 * @example
 *   const result = await orchestrate('methodologies/composition-open-source-data-validation', {
 *     libraryName: 'valides',
 *     libraryDescription: 'A schema-first data validation framework for JavaScript',
 *     communitySignals: 'Users want async validators and clearer error messages (#12, #34).',
 *     currentVersion: '1.2.0',
 *   });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../../specializations/common-utilities/routed-gate-combinators.js';

const PROCESS_ID = 'methodologies/composition-open-source-data-validation';

// ---------------------------------------------------------------------------
// Inline Continuous Deployment — frozen ordered pipeline stages.
//
// No library/methodologies/continuous-deployment/ directory exists. Per the
// batch-3 strangler-fig inline-ingredient precedent, the CD ingredient is
// modeled INLINE here: a frozen ordered stage list borrowing release-lifecycle
// stage-promotion semantics (entry-gated promotion, executed per-stage
// verification). pipelineStagesOverride must be a strict prefix-ordered subset;
// an unknown stage THROWS (no fallback stage plan). Internal promotions are
// orchestrator-driven — the ONLY human policy gates are package-publish-approval,
// breaking-change-release, and community-announcement-send.
// ---------------------------------------------------------------------------

const PIPELINE_STAGES = Object.freeze([
  Object.freeze({
    stage: 'ci',
    entryGate: 'pipeline-entry',
    description: 'Run the full TDD+BDD suite + lint + coverage on the merge candidate.',
    verify: 'executed suite output, coverage %, zero lint errors',
  }),
  Object.freeze({
    stage: 'build',
    entryGate: 'internal-promotion',
    description: 'Build the distributable package artifact (bundle + types).',
    verify: 'built artifact ref exists, importable smoke of the built entrypoint',
  }),
  Object.freeze({
    stage: 'publish-dry-run',
    entryGate: 'internal-promotion',
    description:
      'Dry-run the registry publish (npm publish --dry-run semantics): pack the tarball, resolve the semver, validate the manifest WITHOUT a real publish.',
    verify:
      'executed dry-run output showing the resolved version + packed file list; the REAL publish is the separate policy-gated cod.package-publish executor, never this stage',
  }),
  Object.freeze({
    stage: 'docs-deploy-dry-run',
    entryGate: 'internal-promotion',
    description:
      'Build living documentation (BDD scenarios as examples + JSDoc API docs) and stage the docs site (GitHub Pages semantics) as a dry-run.',
    verify: 'docs built, dead-link check executed',
  }),
]);

// ===========================================================================
// P1 — Community requirements intake + RFC
// ===========================================================================

export const requirementsIntakeTask = defineTask('cod.requirements-intake', (args, taskCtx) => ({
  kind: 'agent',
  title: `Community requirements intake for ${args.libraryName}`,
  agent: {
    name: 'community-product-owner',
    prompt: {
      role: 'Open-source product owner',
      task: `Derive and vote-order validation rules for ${args.libraryName} from community signals + any seed rules`,
      context: args,
      instructions: [
        'Merge seed validationRules with rules mined from communitySignals (GitHub Discussions/Issues); dedupe by intent.',
        'Assign each rule a priority from vote/impact signals; never invent demand not present in the signals.',
        'Emit a stable ruleId per rule.',
      ],
      outputFormat:
        'JSON with prioritizedRules array [{ruleId, title, description, priority, votes}]',
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedRules'],
      properties: {
        prioritizedRules: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['ruleId', 'title', 'description', 'priority', 'votes'],
            properties: {
              ruleId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              priority: {},
              votes: {},
            },
          },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'requirements', 'community'],
}));

export const rfcAuthoringTask = defineTask('cod.rfc-authoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Author the validation-framework RFC for ${args.libraryName}`,
  agent: {
    name: 'rfc-author',
    prompt: {
      role: 'RFC author',
      task: 'Write the RFC document from the prioritized rules with one acceptance criterion per rule',
      context: args,
      instructions: [
        'Write the RFC to rfcPath; one section per prioritized rule with a single-line acceptance criterion.',
        'Do not add rules outside the prioritized set.',
      ],
      outputFormat:
        'JSON with rfcPath string, ruleCriteria array [{ruleId, acceptanceCriterion}], accepted boolean',
    },
    outputSchema: {
      type: 'object',
      required: ['rfcPath', 'ruleCriteria', 'accepted'],
      properties: {
        rfcPath: { type: 'string' },
        ruleCriteria: {
          type: 'array',
          items: {
            type: 'object',
            required: ['ruleId', 'acceptanceCriterion'],
            properties: {
              ruleId: { type: 'string' },
              acceptanceCriterion: { type: 'string' },
            },
          },
        },
        accepted: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'rfc'],
}));

// ===========================================================================
// P2 — BDD acceptance scenarios (parallel per rule)
// ===========================================================================

export const bddScenarioAuthoringTask = defineTask('cod.bdd-scenario-authoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `BDD scenarios for rule ${args.rule.ruleId}`,
  agent: {
    name: 'bdd-scenario-author',
    prompt: {
      role: 'BDD specification-by-example author',
      task: `Produce a Gherkin feature file for validation rule ${args.rule.ruleId}`,
      context: args,
      instructions: [
        'Write Given/When/Then scenarios: at least one valid-input pass scenario and one invalid-input fail scenario with the expected error message, per the rule acceptance criterion.',
        'Embed a stable scenarioId in every scenario name.',
        'Write the .feature file to featurePath; do NOT implement step code here.',
      ],
      outputFormat:
        'JSON with ruleId, featurePath, scenarios array [{scenarioId, kind:"valid"|"invalid", title}]',
    },
    outputSchema: {
      type: 'object',
      required: ['ruleId', 'featurePath', 'scenarios'],
      properties: {
        ruleId: { type: 'string' },
        featurePath: { type: 'string' },
        scenarios: {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            required: ['scenarioId', 'kind', 'title'],
            properties: {
              scenarioId: { type: 'string' },
              kind: { type: 'string', enum: ['valid', 'invalid'] },
              title: { type: 'string' },
            },
          },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'bdd', 'scenarios'],
}));

// ===========================================================================
// P3 — Kanban triage + TDD/XP implementation + CI + review (parallel)
// ===========================================================================

export const contributionTriageTask = defineTask('cod.contribution-triage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kanban triage: contribution ${args.contribution.contributionId}`,
  agent: {
    name: 'kanban-triager',
    prompt: {
      role: 'Kanban flow manager',
      task: `Place community contribution ${args.contribution.contributionId} on the board with labels`,
      context: args,
      instructions: [
        'Assign a column (Backlog|In Progress|Review|Done) and labels (bug|feature|documentation|good-first-issue); no WIP limit (open-source contributor availability).',
        'Link the contribution to a ruleRef when it maps to a prioritized rule; flag orphans.',
      ],
      outputFormat: 'JSON with contributionId, column, labels array, ruleRef (nullable)',
    },
    outputSchema: {
      type: 'object',
      required: ['contributionId', 'column', 'labels'],
      properties: {
        contributionId: { type: 'string' },
        column: { type: 'string', enum: ['Backlog', 'In Progress', 'Review', 'Done'] },
        labels: { type: 'array' },
        ruleRef: {},
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'kanban', 'triage'],
}));

export const tddImplementRuleTask = defineTask('cod.tdd-implement-rule', (args, taskCtx) => ({
  kind: 'agent',
  title: `TDD implement rule ${args.rule.ruleId}`,
  agent: {
    name: 'tdd-xp-implementer',
    prompt: {
      role: 'TDD/XP implementer',
      task: `Implement validation rule ${args.rule.ruleId} test-first from its BDD scenarios under XP constraints`,
      context: args,
      instructions: [
        'For EACH scenario: write the failing test first (from the Gherkin), make it pass minimally, refactor; record scenarioId->testId mapping with cycle "red-green-refactor".',
        'XP constraints: collective code ownership, project coding standards (lint/format), simple design (no speculative features beyond the rule).',
        'Run the tests and paste the executed output excerpt — never claim green without running.',
        'Stay inside the rule scope; adversarial critics re-execute.',
      ],
      outputFormat:
        'JSON with ruleId, summary, filesChanged array, scenarioTestMap array [{scenarioId, testId, testPath, cycle}]',
    },
    outputSchema: {
      type: 'object',
      required: ['ruleId', 'summary', 'filesChanged', 'scenarioTestMap'],
      properties: {
        ruleId: { type: 'string' },
        summary: { type: 'string' },
        filesChanged: { type: 'array' },
        scenarioTestMap: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['scenarioId', 'testId', 'testPath', 'cycle'],
            properties: {
              scenarioId: { type: 'string' },
              testId: { type: 'string' },
              testPath: { type: 'string' },
              cycle: { type: 'string', const: 'red-green-refactor' },
            },
          },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'tdd', 'xp', 'implementation'],
}));

export const ciCheckTask = defineTask('cod.ci-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Continuous integration check for ${args.libraryName}`,
  agent: {
    name: 'ci-runner',
    prompt: {
      role: 'CI runner (XP continuous integration)',
      task: 'Run tests + lint + coverage across the aggregate merge candidate',
      context: args,
      instructions: [
        'EXECUTE the test suite, linter, and coverage yourself; paste raw output.',
        'Report pass only if tests pass, lint is clean, and coverage meets the stated goal.',
      ],
      outputFormat:
        'JSON with passed boolean, totals {tests,passed,failed}, lintClean boolean, coveragePct number, executedOutputExcerpt string',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'totals', 'lintClean', 'coveragePct', 'executedOutputExcerpt'],
      properties: {
        passed: { type: 'boolean' },
        totals: {
          type: 'object',
          required: ['tests', 'passed', 'failed'],
          properties: {
            tests: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' },
          },
        },
        lintClean: { type: 'boolean' },
        coveragePct: { type: 'number' },
        executedOutputExcerpt: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'xp', 'ci'],
}));

export const contributionReviewTask = defineTask('cod.contribution-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Contribution review: ${args.contribution.contributionId}`,
  agent: {
    name: 'maintainer-reviewer',
    prompt: {
      role: 'Maintainer reviewer',
      task: `PR-workflow review of contribution ${args.contribution.contributionId}`,
      context: args,
      instructions: [
        'Review the contribution for correctness, coding standards, and scenario coverage; inspect the actual diff and executed tests, not the summary.',
        'Approve only when CI-equivalent checks pass; list concrete findings otherwise.',
      ],
      outputFormat: 'JSON with contributionId, approved boolean, reviewer string, findings array',
    },
    outputSchema: {
      type: 'object',
      required: ['contributionId', 'approved', 'reviewer', 'findings'],
      properties: {
        contributionId: { type: 'string' },
        approved: { type: 'boolean' },
        reviewer: { type: 'string' },
        findings: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'review'],
}));

// ===========================================================================
// P4 — Executed TDD+BDD suite (gate artifact producer)
// ===========================================================================

export const testSuiteExecutionTask = defineTask('cod.test-suite-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute full TDD+BDD suite + build ship-readiness report for ${args.libraryName}`,
  agent: {
    name: 'suite-executor',
    prompt: {
      role: 'Test suite executor',
      task: 'Execute both suites and build the rule->scenario->test traceability matrix',
      context: args,
      instructions: [
        'EXECUTE the full TDD suite AND the BDD/Gherkin suite yourself; paste raw output for both — a report without executed output is invalid.',
        'Build the traceability matrix joining every prioritized ruleId to its scenarioIds and executed test results; unmatched rules/scenarios appear with status "unmapped".',
        'Write the report to reportPath; suitePassed only if failed === 0 AND no prioritized rule/scenario is unmapped or skipped.',
      ],
      outputFormat:
        'JSON with reportPath, suitePassed boolean, totals {tests,passed,failed,skipped}, traceabilityMatrix array [{ruleId, scenarioId, testId, status}], executedOutputExcerpt string',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'suitePassed', 'totals', 'traceabilityMatrix', 'executedOutputExcerpt'],
      properties: {
        reportPath: { type: 'string' },
        suitePassed: { type: 'boolean' },
        totals: {
          type: 'object',
          required: ['tests', 'passed', 'failed', 'skipped'],
          properties: {
            tests: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' },
            skipped: { type: 'number' },
          },
        },
        traceabilityMatrix: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['ruleId', 'scenarioId', 'testId', 'status'],
            properties: {
              ruleId: { type: 'string' },
              scenarioId: { type: 'string' },
              testId: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
        executedOutputExcerpt: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'tdd', 'bdd', 'verification'],
}));

// ===========================================================================
// P5 — Inline CD pipeline (stage promotion, dry-run) + semver analysis
// ===========================================================================

export const semverAnalysisTask = defineTask('cod.semver-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Semver analysis for ${args.libraryName} vs ${args.currentVersion}`,
  agent: {
    name: 'semver-analyst',
    prompt: {
      role: 'Semantic-versioning analyst',
      task: 'Classify the bump and detect breaking API changes from the API diff',
      context: args,
      instructions: [
        'Compute the public API diff against currentVersion; classify the bump as major|minor|patch per semver rules.',
        'breaking === true iff the diff removes/renames/changes-signature of a public export; write the API diff to apiDiffPath.',
        'Never soften a breaking change to minor — an unknown/ambiguous change is treated as breaking (fail-closed).',
      ],
      outputFormat: 'JSON with bump "major"|"minor"|"patch", breaking boolean, apiDiffPath string, rationale string',
    },
    outputSchema: {
      type: 'object',
      required: ['bump', 'breaking', 'apiDiffPath', 'rationale'],
      properties: {
        bump: { type: 'string', enum: ['major', 'minor', 'patch'] },
        breaking: { type: 'boolean' },
        apiDiffPath: { type: 'string' },
        rationale: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'semver'],
}));

export const cdPipelineStageTask = defineTask('cod.cd-pipeline-stage', (args, taskCtx) => ({
  kind: 'agent',
  title: `CD pipeline stage ${args.stage.stage} (dry-run) for ${args.libraryName}`,
  agent: {
    name: 'cd-pipeline-runner',
    prompt: {
      role: 'Continuous-deployment pipeline runner (inline stage-promotion)',
      task: `Execute inline CD pipeline stage "${args.stage.stage}" with executed verification`,
      context: args,
      instructions: [
        'Run this stage per the frozen PIPELINE_STAGES definition in the context; EXECUTE the stage verification (suite/build/pack --dry-run/docs build) and paste output.',
        'For publish-dry-run: pack the tarball and resolve the version WITHOUT a real publish — the real publish is the separate policy-gated executor.',
        'verified === true only when the executed verification for this stage passes; never promote on unexecuted claims.',
      ],
      outputFormat:
        'JSON with stage, verified boolean, dryRun const true, executedOutputExcerpt string, artifactRef (nullable)',
    },
    outputSchema: {
      type: 'object',
      required: ['stage', 'verified', 'dryRun', 'executedOutputExcerpt'],
      properties: {
        stage: { type: 'string' },
        verified: { type: 'boolean' },
        dryRun: { type: 'boolean', const: true },
        executedOutputExcerpt: { type: 'string' },
        artifactRef: {},
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'cd', 'pipeline'],
}));

// ===========================================================================
// P6 — Guarded package-publish executor (invoked ONLY when approved === true)
// ===========================================================================

export const packagePublishTask = defineTask('cod.package-publish', (args, taskCtx) => ({
  kind: 'agent',
  title: `Publish ${args.libraryName} ${args.version} to ${args.registry}`,
  agent: {
    name: 'release-publisher',
    prompt: {
      role: 'Release publisher (guarded executor)',
      task: `Perform the real registry publish of ${args.libraryName} ${args.version}`,
      context: args,
      instructions: [
        'Perform the publish steps recorded in the approved plan exactly (tag/pack/publish); deviations require re-approval, not improvisation.',
        'Record every produced artifact path and the published version.',
      ],
      outputFormat: 'JSON with published boolean, version string, registry string, artifacts array',
    },
    outputSchema: {
      type: 'object',
      required: ['published', 'version', 'registry', 'artifacts'],
      properties: {
        published: { type: 'boolean' },
        version: { type: 'string' },
        registry: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'publish', 'policy-gated'],
}));

// ===========================================================================
// P7 — Versioned release: changelog + living docs
// ===========================================================================

export const changelogGenerationTask = defineTask('cod.changelog-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Changelog + living docs for ${args.libraryName} ${args.version}`,
  agent: {
    name: 'release-scribe',
    prompt: {
      role: 'Release scribe',
      task: 'Write the CHANGELOG entry and generate living documentation',
      context: args,
      instructions: [
        'Write the CHANGELOG entry for the published version (semver-labeled, grouped by feature/bug/docs).',
        'Generate living docs: BDD scenarios as usage examples, JSDoc-derived API docs, README quick-start; write to docsPath.',
      ],
      outputFormat: 'JSON with changelogPath string, docsPath string, version string, livingDocs boolean',
    },
    outputSchema: {
      type: 'object',
      required: ['changelogPath', 'docsPath', 'version', 'livingDocs'],
      properties: {
        changelogPath: { type: 'string' },
        docsPath: { type: 'string' },
        version: { type: 'string' },
        livingDocs: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'release', 'docs'],
}));

// ===========================================================================
// P8 — Community announcement (draft + guarded send)
// ===========================================================================

export const releaseAnnouncementDraftTask = defineTask('cod.release-announcement-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft release announcement for ${args.libraryName} ${args.version}`,
  agent: {
    name: 'community-manager',
    prompt: {
      role: 'Community manager',
      task: 'Draft the community release announcement',
      context: args,
      instructions: [
        'Draft the announcement from the changelog and highlights; name target channels.',
        'Do not send — sending is the separate policy-gated executor.',
      ],
      outputFormat: 'JSON with draftPath string, channels array, highlights array',
    },
    outputSchema: {
      type: 'object',
      required: ['draftPath', 'channels', 'highlights'],
      properties: {
        draftPath: { type: 'string' },
        channels: { type: 'array' },
        highlights: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'announcement', 'draft'],
}));

export const announcementSendTask = defineTask('cod.announcement-send', (args, taskCtx) => ({
  kind: 'agent',
  title: `Send release announcement for ${args.libraryName} ${args.version}`,
  agent: {
    name: 'community-manager',
    prompt: {
      role: 'Community manager (guarded executor)',
      task: 'Send the announcement to community channels',
      context: args,
      instructions: [
        'Send exactly the approved draft to the approved channels; record delivery per channel.',
      ],
      outputFormat: 'JSON with sent boolean, channels array, deliveries array',
    },
    outputSchema: {
      type: 'object',
      required: ['sent', 'channels', 'deliveries'],
      properties: {
        sent: { type: 'boolean' },
        channels: { type: 'array' },
        deliveries: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'announcement', 'policy-gated'],
}));

// ===========================================================================
// P9 — Whole-cycle retrospective
// ===========================================================================

export const retrospectiveTask = defineTask('cod.retrospective', (args, taskCtx) => ({
  kind: 'agent',
  title: `Whole-cycle retrospective for ${args.libraryName}`,
  agent: {
    name: 'xp-kanban-facilitator',
    prompt: {
      role: 'XP/Kanban facilitator',
      task: 'Run the whole-cycle retro; methodology seams are first-class topics',
      context: args,
      instructions: [
        'Retro across the whole cycle: where did BDD->TDD, TDD->Kanban, Kanban->CD, CD->release handoffs leak?',
        'Actions must be concrete and owner-assigned.',
      ],
      outputFormat: 'JSON with wentWell array, couldImprove array, actions array',
    },
    outputSchema: {
      type: 'object',
      required: ['wentWell', 'couldImprove', 'actions'],
      properties: {
        wentWell: { type: 'array' },
        couldImprove: { type: 'array' },
        actions: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'cod', 'retro'],
}));

// ---------------------------------------------------------------------------
// helpers (pure, no fallbacks)
// ---------------------------------------------------------------------------

/**
 * Order the given rules so every rule appears after all of its in-set
 * dependsOn rules. A dependency cycle is a planning bug, not a schedulable
 * state, so it THROWS instead of being silently linearized.
 *
 * @param {Array<{ruleId: string, dependsOn?: string[]}>} rules - Dependent rules
 * @returns {Array<object>} Rules ordered so dependsOn precede dependents
 */
function orderByDependencies(rules) {
  const inSet = new Map(rules.map((r) => [r.ruleId, r]));
  const ordered = [];
  const done = new Set();
  const visiting = new Set();

  const visit = (rule) => {
    if (done.has(rule.ruleId)) return;
    if (visiting.has(rule.ruleId)) {
      throw new Error(
        `composition-open-source-data-validation: dependency cycle detected at rule ${rule.ruleId}`,
      );
    }
    visiting.add(rule.ruleId);
    for (const depId of rule.dependsOn ?? []) {
      const dep = inSet.get(depId);
      if (dep) visit(dep);
    }
    visiting.delete(rule.ruleId);
    done.add(rule.ruleId);
    ordered.push(rule);
  };

  for (const rule of rules) visit(rule);
  return ordered;
}

/**
 * Validate an optional pipeline-stages override. null/undefined selects the
 * full frozen PIPELINE_STAGES; otherwise the override must be a strict
 * prefix-ordered subset (override[i] === PIPELINE_STAGES[i].stage). An unknown
 * or out-of-order stage THROWS — there is deliberately no fallback stage plan.
 *
 * @param {string[]|null|undefined} override - Requested stage subset
 * @returns {ReadonlyArray<object>} The resolved frozen stage definitions
 */
function validatePipelineStages(override) {
  if (override === null || override === undefined) {
    return PIPELINE_STAGES;
  }
  if (!Array.isArray(override) || override.length === 0) {
    throw new Error(
      `composition-open-source-data-validation: pipelineStagesOverride must be null or a non-empty string[] (got ${JSON.stringify(override)})`,
    );
  }
  if (override.length > PIPELINE_STAGES.length) {
    throw new Error(
      `composition-open-source-data-validation: pipelineStagesOverride has ${override.length} stages but PIPELINE_STAGES has only ${PIPELINE_STAGES.length}`,
    );
  }
  const canonicalNames = PIPELINE_STAGES.map((s) => s.stage);
  const resolved = [];
  for (let i = 0; i < override.length; i++) {
    if (override[i] !== canonicalNames[i]) {
      throw new Error(
        `composition-open-source-data-validation: pipelineStagesOverride must be a strict prefix-ordered subset of [${canonicalNames.join(', ')}]; stage ${JSON.stringify(override[i])} at index ${i} is unknown or out of order`,
      );
    }
    resolved.push(PIPELINE_STAGES[i]);
  }
  return resolved;
}

/**
 * Record breakpoint provenance. autoApproved surfaces harness-level
 * auto-approval from response?.autoApproved (fail-closed posture).
 *
 * @param {string} breakpointId - The breakpoint id (=== actionId)
 * @param {string} expert - The routed expert
 * @param {object} result - The BreakpointResult
 * @returns {{approved: boolean, autoApproved: boolean, breakpointId: string, expert: string, response: object|null}}
 */
function breakpointProvenance(breakpointId, expert, result) {
  return {
    approved: result.approved === true,
    autoApproved: result.response?.autoApproved === true,
    breakpointId,
    expert,
    response: result.response ?? null,
  };
}

/**
 * Compute the next semver from a plain x.y.z current version and a bump class.
 * A malformed current version or unknown bump THROWS (no fallback version).
 *
 * @param {string} current - Current version (x.y.z)
 * @param {string} bump - 'major' | 'minor' | 'patch'
 * @returns {string} The next version
 */
function nextSemver(current, bump) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!m) {
    throw new Error(
      `composition-open-source-data-validation: currentVersion must be a plain x.y.z semver (got ${JSON.stringify(current)})`,
    );
  }
  const major = Number(m[1]);
  const minor = Number(m[2]);
  const patch = Number(m[3]);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  if (bump === 'patch') return `${major}.${minor}.${patch + 1}`;
  throw new Error(
    `composition-open-source-data-validation: unknown semver bump ${JSON.stringify(bump)} (expected major|minor|patch)`,
  );
}

// ---------------------------------------------------------------------------
// process — P0..P9
// ---------------------------------------------------------------------------

/**
 * Open-source data-validation library composition: community requirements/RFC
 * -> BDD acceptance scenarios (parallel) -> Kanban triage + TDD/XP
 * implementation (parallel) -> executed TDD+BDD suite gate -> inline CD
 * pipeline dry-run + semver analysis -> policy-gated breaking-change +
 * package-publish -> changelog + living docs -> policy-gated community
 * announcement -> retro + kip assert. Three adversarial seam gates re-execute
 * artifacts; three policy-gated actions carry routed-breakpoint provenance.
 *
 * @param {object} inputs - Process inputs (see @inputs)
 * @param {object} ctx - Orchestration context
 * @returns {Promise<object>} Result (see @outputs)
 */
export async function process(inputs, ctx) {
  const {
    libraryName,
    libraryDescription,
    validationRules = [],
    communitySignals = '',
    contributions = [],
    currentVersion = '0.0.0',
    registry = 'npm',
    pipelineStagesOverride = null,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs ?? {};

  // No fallbacks: invalid inputs throw before any orchestration happens.
  if (typeof libraryName !== 'string' || libraryName.trim() === '') {
    throw new Error(`composition-open-source-data-validation: libraryName is required (got ${JSON.stringify(libraryName)})`);
  }
  if (typeof libraryDescription !== 'string' || libraryDescription.trim() === '') {
    throw new Error(`composition-open-source-data-validation: libraryDescription is required (got ${JSON.stringify(libraryDescription)})`);
  }
  if (!Array.isArray(validationRules)) {
    throw new Error(`composition-open-source-data-validation: validationRules must be an array when provided (got ${JSON.stringify(validationRules)})`);
  }
  if (typeof communitySignals !== 'string') {
    throw new Error(`composition-open-source-data-validation: communitySignals must be a string when provided (got ${JSON.stringify(communitySignals)})`);
  }
  if (!Array.isArray(contributions)) {
    throw new Error(`composition-open-source-data-validation: contributions must be an array when provided (got ${JSON.stringify(contributions)})`);
  }
  if (typeof currentVersion !== 'string' || currentVersion.trim() === '') {
    throw new Error(`composition-open-source-data-validation: currentVersion must be a non-empty string (got ${JSON.stringify(currentVersion)})`);
  }
  if (typeof registry !== 'string' || registry.trim() === '') {
    throw new Error(`composition-open-source-data-validation: registry must be a non-empty string (got ${JSON.stringify(registry)})`);
  }
  if (!Number.isInteger(maxFixAttempts) || maxFixAttempts < 0) {
    throw new Error(`composition-open-source-data-validation: maxFixAttempts must be a non-negative integer (got ${JSON.stringify(maxFixAttempts)})`);
  }
  if (validationRules.length === 0 && communitySignals.trim() === '') {
    throw new Error('composition-open-source-data-validation: at least one of validationRules or communitySignals is required to derive rules');
  }

  // Unknown pipeline stage in an override THROWS here (no fallback plan).
  const pipelineStages = validatePipelineStages(pipelineStagesOverride);

  const breakpointsHit = [];
  const artifacts = [];

  const buildMetadata = () => ({
    processId: PROCESS_ID,
    runId: ctx.runId,
    breakpointsHit,
    pipeline: { stages: pipelineStages.map((s) => s.stage), dryRun: true },
  });

  // -------------------------------------------------------------------------
  // P0 — kip recall (methodology-composition)
  // -------------------------------------------------------------------------
  let kipInsights = [];
  if (kipEnabled) {
    const recall = await kipRecall(ctx, {
      kipDir,
      topic: `open-source data-validation composition handoffs: BDD scenarios -> TDD tests -> Kanban contribution flow -> CD publish for ${libraryName}`,
      kipModel,
      kind: 'methodology-composition',
    });
    kipInsights = recall.insights ?? [];
  }

  // -------------------------------------------------------------------------
  // P1 — Community requirements intake + RFC
  // -------------------------------------------------------------------------
  const intake = await ctx.task(requirementsIntakeTask, {
    libraryName,
    libraryDescription,
    validationRules,
    communitySignals,
    kipInsights,
  });
  const prioritizedRules = intake.prioritizedRules;

  const rfcResult = await ctx.task(rfcAuthoringTask, {
    libraryName,
    libraryDescription,
    prioritizedRules,
    kipInsights,
  });
  artifacts.push(rfcResult.rfcPath);
  const rfc = {
    rfcPath: rfcResult.rfcPath,
    prioritizedRules: prioritizedRules.map((r) => ({ ruleId: r.ruleId, priority: r.priority, votes: r.votes })),
    accepted: rfcResult.accepted === true,
  };

  // -------------------------------------------------------------------------
  // P2 — BDD acceptance scenarios (parallel per rule) + seam gate
  // -------------------------------------------------------------------------
  const criteriaByRule = new Map((rfcResult.ruleCriteria ?? []).map((c) => [c.ruleId, c.acceptanceCriterion]));
  const scenarioResults = await ctx.parallel.all(
    prioritizedRules.map((rule) => () =>
      ctx.task(bddScenarioAuthoringTask, {
        rule,
        libraryName,
        acceptanceCriterion: criteriaByRule.get(rule.ruleId) ?? null,
        kipInsights,
      }),
    ),
  );
  for (const s of scenarioResults) {
    artifacts.push(s.featurePath);
  }
  const scenarios = scenarioResults.map((s) => ({
    ruleId: s.ruleId,
    featurePath: s.featurePath,
    scenarioCount: s.scenarios.length,
  }));

  const bddGateRaw = await adversarialGate(ctx, {
    gateId: 'cod.bdd-scenarios',
    artifact: {
      path: rfc.rfcPath,
      description: `BDD Gherkin feature files for ${prioritizedRules.length} prioritized rules of ${libraryName}`,
    },
    critics: [
      {
        name: 'scenario-coverage-critic',
        role: 'BDD coverage auditor',
        focus:
          'every prioritized rule has >=1 valid and >=1 invalid scenario with an explicit expected error message; no rule left unscenarioed',
      },
      {
        name: 'gherkin-executability-critic',
        role: 'Gherkin executability reviewer',
        focus:
          'DRY-RUN the Gherkin: parse every .feature and confirm steps are bindable (no unparseable/ambiguous steps); paste parser output',
      },
    ],
    ironLaw: [
      'Do NOT trust the scenario list: parse/dry-run every feature file yourself.',
      'Cite file:line for every claim; a rule with no invalid-input scenario is a FAIL.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      scenarios,
      prioritizedRules,
      featurePaths: scenarioResults.map((s) => s.featurePath),
    },
  });
  if (bddGateRaw.escalated === true) {
    breakpointsHit.push('cod.bdd-scenarios.gate-escalation');
  }
  const bddGate = {
    passed: bddGateRaw.passed === true,
    attempts: bddGateRaw.attempts,
    escalated: bddGateRaw.escalated,
    issues: bddGateRaw.issues,
    evidence: bddGateRaw.evidence,
  };

  if (bddGate.passed !== true) {
    return {
      success: false,
      rfc,
      scenarios,
      bddGate,
      board: null,
      implementations: [],
      reviews: [],
      suiteGate: null,
      cdPipeline: null,
      semver: null,
      breakingChange: null,
      publish: null,
      release: null,
      announcement: null,
      retro: null,
      kipFactsAsserted: 0,
      artifacts,
      metadata: buildMetadata(),
    };
  }

  // -------------------------------------------------------------------------
  // P3 — Kanban triage + TDD/XP implementation (parallel) + CI + reviews
  // -------------------------------------------------------------------------
  const scenariosByRule = new Map(scenarioResults.map((s) => [s.ruleId, s]));
  const implTaskArgsFor = (rule) => ({
    rule,
    libraryName,
    scenarios: scenariosByRule.get(rule.ruleId) ?? null,
    acceptanceCriterion: criteriaByRule.get(rule.ruleId) ?? null,
    kipInsights,
  });

  // parallelSafe rules fan out; dependent rules are ordered by dependsOn
  // (cycle THROWS) and awaited in order — never speculatively co-scheduled.
  const parallelRules = prioritizedRules.filter((r) => r.parallelSafe === true);
  const dependentRules = orderByDependencies(prioritizedRules.filter((r) => r.parallelSafe !== true));

  // Contribution triage fans out CONCURRENTLY with the parallelSafe rule
  // implementations (a single parallel batch). Reviews depend on triaged
  // contributions, so they run afterward.
  const triageThunks = contributions.map((contribution) => () =>
    ctx.task(contributionTriageTask, { contribution, prioritizedRules, libraryName }),
  );
  const parallelImplThunks = parallelRules.map((rule) => () =>
    ctx.task(tddImplementRuleTask, implTaskArgsFor(rule)),
  );

  const concurrentResults = await ctx.parallel.all([...triageThunks, ...parallelImplThunks]);
  const triageResults = concurrentResults.slice(0, triageThunks.length);
  const implementations = concurrentResults.slice(triageThunks.length);

  for (const rule of dependentRules) {
    implementations.push(await ctx.task(tddImplementRuleTask, implTaskArgsFor(rule)));
  }
  for (const impl of implementations) {
    artifacts.push(...(impl.filesChanged ?? []));
  }

  const boardColumns = ['Backlog', 'In Progress', 'Review', 'Done'];
  const boardCards = triageResults.map((t) => ({
    contributionId: t.contributionId,
    column: t.column,
    labels: t.labels ?? [],
  }));
  const flowMetrics = {
    total: boardCards.length,
    byColumn: boardColumns.reduce((acc, col) => {
      acc[col] = boardCards.filter((c) => c.column === col).length;
      return acc;
    }, {}),
  };
  const board = { columns: boardColumns, cards: boardCards, flowMetrics };

  // XP continuous integration over the aggregate merge candidate.
  const ci = await ctx.task(ciCheckTask, {
    libraryName,
    implementations: implementations.map((i) => ({ ruleId: i.ruleId, summary: i.summary, filesChanged: i.filesChanged })),
    prioritizedRules,
  });

  // Maintainer-style reviews run in PARALLEL over the triaged contributions.
  const reviewResults = await ctx.parallel.all(
    triageResults.map((triaged) => () =>
      ctx.task(contributionReviewTask, {
        contribution: triaged,
        libraryName,
        ci: { passed: ci.passed, totals: ci.totals },
      }),
    ),
  );
  const reviews = reviewResults.map((r) => ({
    contributionId: r.contributionId,
    approved: r.approved === true,
    reviewer: r.reviewer,
    findings: r.findings ?? [],
  }));

  // -------------------------------------------------------------------------
  // P4 — Executed TDD+BDD suite gate
  // -------------------------------------------------------------------------
  const suiteRun = await ctx.task(testSuiteExecutionTask, {
    libraryName,
    prioritizedRules,
    scenarios,
    implementations: implementations.map((i) => ({ ruleId: i.ruleId, scenarioTestMap: i.scenarioTestMap })),
    ci: { passed: ci.passed, totals: ci.totals, coveragePct: ci.coveragePct },
  });
  artifacts.push(suiteRun.reportPath);

  const suiteGateRaw = await adversarialGate(ctx, {
    gateId: 'cod.executed-suite',
    artifact: {
      path: suiteRun.reportPath,
      description: 'Ship-readiness report: executed TDD+BDD suite output + rule->scenario->test traceability matrix',
    },
    critics: [
      {
        name: 'coverage-traceability-critic',
        role: 'Coverage traceability auditor',
        focus:
          'every prioritized rule maps to >=1 EXECUTED passing test; re-run both suites and diff against the report matrix + totals',
      },
      {
        name: 'tdd-evidence-critic',
        role: 'TDD forensics reviewer',
        focus:
          'tests are real behavioral tests derived from the Gherkin (not tautologies/empty snapshots); executed output matches claims',
      },
      {
        name: 'xp-standards-critic',
        role: 'XP standards auditor',
        focus:
          'coding standards clean (lint/format), simple design (no speculative API), collective-ownership boundaries respected',
      },
    ],
    ironLaw: [
      'Do NOT trust the report or implementers: re-execute BOTH the TDD and BDD suites yourself and compare output.',
      'A mapping to a skipped/todo/unexecuted test is a FAIL.',
      'Cite executed command output and file:line for every claim.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      traceabilityMatrix: suiteRun.traceabilityMatrix,
      totals: suiteRun.totals,
      prioritizedRules,
      scenarios,
    },
  });
  if (suiteGateRaw.escalated === true) {
    breakpointsHit.push('cod.executed-suite.gate-escalation');
  }
  const suiteGate = {
    passed: suiteGateRaw.passed === true,
    attempts: suiteGateRaw.attempts,
    escalated: suiteGateRaw.escalated,
    issues: suiteGateRaw.issues,
    evidence: suiteGateRaw.evidence,
  };

  if (suiteGate.passed !== true) {
    return {
      success: false,
      rfc,
      scenarios,
      bddGate,
      board,
      implementations,
      reviews,
      suiteGate,
      cdPipeline: null,
      semver: null,
      breakingChange: null,
      publish: null,
      release: null,
      announcement: null,
      retro: null,
      kipFactsAsserted: 0,
      artifacts,
      metadata: buildMetadata(),
    };
  }

  // -------------------------------------------------------------------------
  // P5 — Inline CD pipeline (stage promotion, dry-run) + semver analysis
  // -------------------------------------------------------------------------
  const cdStages = [];
  for (const stageDef of pipelineStages) {
    const stageResult = await ctx.task(cdPipelineStageTask, {
      stage: stageDef,
      pipelineStages: pipelineStages.map((s) => s.stage),
      libraryName,
      currentVersion,
      registry,
      reportPath: suiteRun.reportPath,
    });
    if (stageResult.artifactRef) {
      artifacts.push(stageResult.artifactRef);
    }
    cdStages.push({
      stage: stageDef.stage,
      gate: stageDef.entryGate,
      verified: stageResult.verified === true,
      dryRun: true,
      evidenceRef: stageResult.artifactRef ?? null,
    });
    // Stage promotion requires the current stage verified === true. An
    // unverified stage stops promotion (explicit stop, no fallback); the
    // cd-readiness gate then adjudicates the incomplete pipeline.
    if (stageResult.verified !== true) {
      break;
    }
  }

  const semverResult = await ctx.task(semverAnalysisTask, {
    libraryName,
    currentVersion,
    prioritizedRules,
    implementations: implementations.map((i) => ({ ruleId: i.ruleId, filesChanged: i.filesChanged })),
  });
  artifacts.push(semverResult.apiDiffPath);
  const semver = {
    bump: semverResult.bump,
    breaking: semverResult.breaking === true,
    apiDiffPath: semverResult.apiDiffPath,
    rationale: semverResult.rationale,
  };
  const nextVersion = nextSemver(currentVersion, semver.bump);

  const cdReadinessRaw = await adversarialGate(ctx, {
    gateId: 'cod.cd-readiness',
    artifact: {
      path: semver.apiDiffPath,
      description: `CD pipeline dry-run (${pipelineStages.map((s) => s.stage).join(' -> ')}) + semver classification for ${libraryName}`,
    },
    critics: [
      {
        name: 'pipeline-dry-run-critic',
        role: 'CD pipeline auditor',
        focus:
          'EXECUTE a full pipeline dry-run (ci -> build -> publish-dry-run -> docs-deploy-dry-run); every stage must verify green; paste each stage output',
      },
      {
        name: 'semver-correctness-critic',
        role: 'Semver correctness auditor',
        focus:
          're-derive the semver bump from the actual API diff and confirm cod.semver-analysis classification; a breaking change classified as minor/patch is a FAIL',
      },
    ],
    ironLaw: [
      'Do NOT trust the stage results or the semver report: run the dry-run and re-derive the bump yourself.',
      'The publish-dry-run stage must NOT perform a real publish; a real publish here is a FAIL.',
      'Cite executed command output for every stage.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      cdStages,
      semver,
      currentVersion,
      nextVersion,
      pipelineStages: pipelineStages.map((s) => s.stage),
    },
  });
  if (cdReadinessRaw.escalated === true) {
    breakpointsHit.push('cod.cd-readiness.gate-escalation');
  }
  const readinessGate = {
    passed: cdReadinessRaw.passed === true,
    attempts: cdReadinessRaw.attempts,
    escalated: cdReadinessRaw.escalated,
    issues: cdReadinessRaw.issues,
    evidence: cdReadinessRaw.evidence,
  };
  const cdPipeline = { stages: cdStages, readinessGate };

  if (readinessGate.passed !== true) {
    return {
      success: false,
      rfc,
      scenarios,
      bddGate,
      board,
      implementations,
      reviews,
      suiteGate,
      cdPipeline,
      semver,
      breakingChange: null,
      publish: null,
      release: null,
      announcement: null,
      retro: null,
      kipFactsAsserted: 0,
      artifacts,
      metadata: buildMetadata(),
    };
  }

  // -------------------------------------------------------------------------
  // P6 — Breaking-change + package-publish policy gates
  // -------------------------------------------------------------------------
  let breakingChange = null;
  if (semver.bump === 'major') {
    // Breaking-change gate is a hard precondition on publish when bump is major.
    const breakingResult = await routedBreakpoint(ctx, {
      question: `Breaking-change release for ${libraryName}: approve the semver-MAJOR release ${currentVersion} -> ${nextVersion}?`,
      semver,
      apiDiffPath: semver.apiDiffPath,
      rationale: semver.rationale,
      suiteGateEvidence: suiteGate.evidence,
      kipInsights,
    }, {
      breakpointId: 'breaking-change-release',
      expert: 'project-maintainer',
      tags: ['policy-gated', 'cod', 'breaking-change'],
      strategy: 'single',
    });
    breakpointsHit.push('breaking-change-release');
    breakingChange = { raised: true, ...breakpointProvenance('breaking-change-release', 'project-maintainer', breakingResult) };

    if (breakingChange.approved !== true) {
      // Rejection blocks the publish path entirely — explicit stop, no fallback.
      return {
        success: false,
        rfc,
        scenarios,
        bddGate,
        board,
        implementations,
        reviews,
        suiteGate,
        cdPipeline,
        semver,
        breakingChange,
        publish: null,
        release: null,
        announcement: null,
        retro: null,
        kipFactsAsserted: 0,
        artifacts,
        metadata: buildMetadata(),
      };
    }
  }

  const publishResult = await routedBreakpoint(ctx, {
    question: `Publish ${libraryName} ${nextVersion} to the ${registry} registry?`,
    version: nextVersion,
    registry,
    cdPipelineEvidence: cdStages,
    readinessGateEvidence: readinessGate.evidence,
    traceabilityMatrix: suiteRun.traceabilityMatrix,
    kipInsights,
  }, {
    breakpointId: 'package-publish-approval',
    expert: 'project-maintainer',
    tags: ['policy-gated', 'cod', 'publish'],
    strategy: 'single',
  });
  breakpointsHit.push('package-publish-approval');
  const publishProvenance = breakpointProvenance('package-publish-approval', 'project-maintainer', publishResult);

  let publish;
  if (publishProvenance.approved === true) {
    // Guarded executor: packagePublishTask runs ONLY inside this branch.
    const published = await ctx.task(packagePublishTask, {
      libraryName,
      version: nextVersion,
      registry,
      approvedResponse: publishProvenance.response,
      traceabilityMatrix: suiteRun.traceabilityMatrix,
    });
    artifacts.push(...(published.artifacts ?? []));
    publish = {
      ...publishProvenance,
      published: published.published === true,
      version: published.version,
      registry: published.registry,
      artifacts: published.artifacts ?? [],
    };
  } else {
    publish = {
      ...publishProvenance,
      published: false,
      version: nextVersion,
      registry,
      artifacts: [],
    };
  }

  if (publish.published !== true) {
    // Publish rejected or not performed — no release/announcement, explicit stop.
    let kipFactsAssertedEarly = 0;
    if (kipEnabled) {
      const assertEarly = await kipAssert(ctx, {
        kipDir,
        kipModel,
        kind: 'methodology-composition',
        facts: [
          {
            subject: 'process:composition-open-source-data-validation',
            predicate: 'open-source-release',
            object: `${libraryName}@${nextVersion}`,
            props: {
              published: false,
              registry,
              breakingChangeApproved: breakingChange?.approved ?? null,
              autoApproved: publish.autoApproved,
            },
          },
          {
            subject: 'process:composition-open-source-data-validation',
            predicate: 'provenance-summary',
            object: `publish approved:${publish.approved} auto:${publish.autoApproved}; announce approved:false auto:false`,
            props: { sent: false },
          },
        ],
      });
      kipFactsAssertedEarly = assertEarly.asserted;
    }
    return {
      success: false,
      rfc,
      scenarios,
      bddGate,
      board,
      implementations,
      reviews,
      suiteGate,
      cdPipeline,
      semver,
      breakingChange,
      publish,
      release: null,
      announcement: null,
      retro: null,
      kipFactsAsserted: kipFactsAssertedEarly,
      artifacts,
      metadata: buildMetadata(),
    };
  }

  // -------------------------------------------------------------------------
  // P7 — Versioned release: changelog + living docs (reached only on publish)
  // -------------------------------------------------------------------------
  const changelog = await ctx.task(changelogGenerationTask, {
    libraryName,
    version: publish.version,
    semver,
    scenarios,
    prioritizedRules,
  });
  artifacts.push(changelog.changelogPath, changelog.docsPath);
  const release = {
    changelogPath: changelog.changelogPath,
    docsPath: changelog.docsPath,
    version: changelog.version,
    livingDocs: changelog.livingDocs === true,
  };

  // -------------------------------------------------------------------------
  // P8 — Community announcement (draft + policy-gated send)
  // -------------------------------------------------------------------------
  const draft = await ctx.task(releaseAnnouncementDraftTask, {
    libraryName,
    version: publish.version,
    changelogPath: release.changelogPath,
    semver,
    kipInsights,
  });
  artifacts.push(draft.draftPath);

  const announceResult = await routedBreakpoint(ctx, {
    question: `Send the ${libraryName} ${publish.version} release announcement to community channels?`,
    draftPath: draft.draftPath,
    channels: draft.channels,
    highlights: draft.highlights,
    version: publish.version,
  }, {
    breakpointId: 'community-announcement-send',
    expert: 'community-manager',
    tags: ['policy-gated', 'cod', 'announcement'],
    strategy: 'single',
  });
  breakpointsHit.push('community-announcement-send');
  const announceProvenance = breakpointProvenance('community-announcement-send', 'community-manager', announceResult);

  let announcement;
  if (announceProvenance.approved === true) {
    // Guarded executor: announcementSendTask runs ONLY inside this branch.
    const sent = await ctx.task(announcementSendTask, {
      libraryName,
      version: publish.version,
      draftPath: draft.draftPath,
      channels: draft.channels,
      approvedResponse: announceProvenance.response,
    });
    announcement = {
      ...announceProvenance,
      sent: sent.sent === true,
      channels: sent.channels ?? draft.channels,
      response: announceProvenance.response,
    };
  } else {
    announcement = {
      ...announceProvenance,
      sent: false,
      channels: draft.channels,
      response: announceProvenance.response,
    };
  }

  // -------------------------------------------------------------------------
  // P9 — Retro + kip assert
  // -------------------------------------------------------------------------
  const retroResult = await ctx.task(retrospectiveTask, {
    libraryName,
    scenarios,
    implementations: implementations.map((i) => ({ ruleId: i.ruleId, summary: i.summary })),
    board,
    reviews,
    cdPipeline,
    semver,
    publish: { published: publish.published, version: publish.version },
    announcement: { sent: announcement.sent },
  });
  const retro = {
    wentWell: retroResult.wentWell,
    couldImprove: retroResult.couldImprove,
    actions: retroResult.actions,
  };

  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const totalScenarios = scenarios.reduce((n, s) => n + s.scenarioCount, 0);
    const totalTests = implementations.reduce((n, i) => n + (i.scenarioTestMap?.length ?? 0), 0);
    const stagesVerified = cdStages.filter((s) => s.verified === true).length;
    const unmapped = (suiteRun.traceabilityMatrix ?? []).filter((row) => row.status === 'unmapped').length;
    const assertResult = await kipAssert(ctx, {
      kipDir,
      kipModel,
      kind: 'methodology-composition',
      facts: [
        {
          subject: 'process:composition-open-source-data-validation',
          predicate: 'mapped-rules-to-scenarios-to-tests',
          object: `${prioritizedRules.length} rules -> ${totalScenarios} scenarios -> ${totalTests} tests`,
          props: { bddGateAttempts: bddGate.attempts, suiteGateAttempts: suiteGate.attempts },
        },
        {
          subject: 'process:composition-open-source-data-validation',
          predicate: 'cd-pipeline-outcome',
          object: `${stagesVerified}/${pipelineStages.length}`,
          props: { semver: semver.bump, breaking: semver.breaking, dryRun: true },
        },
        {
          subject: 'process:composition-open-source-data-validation',
          predicate: 'open-source-release',
          object: `${libraryName}@${publish.version}`,
          props: {
            published: publish.published,
            registry: publish.registry,
            breakingChangeApproved: breakingChange?.approved ?? null,
            autoApproved: publish.autoApproved,
          },
        },
        {
          subject: 'process:composition-open-source-data-validation',
          predicate: 'provenance-summary',
          object: `publish approved:${publish.approved} auto:${publish.autoApproved}; announce approved:${announcement.approved} auto:${announcement.autoApproved}`,
          props: { sent: announcement.sent },
        },
        {
          subject: 'process:composition-open-source-data-validation',
          predicate: 'observed-seam',
          object: `requirements->bdd->tdd->kanban->cd seams for ${libraryName}: ${unmapped} unmapped traceability row(s)`,
          props: { unmapped, reviewCount: reviews.length, contributionCount: board.cards.length },
        },
      ],
    });
    kipFactsAsserted = assertResult.asserted;
  }

  return {
    success:
      bddGate.passed === true &&
      suiteGate.passed === true &&
      readinessGate.passed === true &&
      (semver.bump !== 'major' || breakingChange?.approved === true) &&
      publish.approved === true &&
      publish.published === true,
    rfc,
    scenarios,
    bddGate,
    board,
    implementations,
    reviews,
    suiteGate,
    cdPipeline,
    semver,
    breakingChange,
    publish,
    release,
    announcement,
    retro,
    kipFactsAsserted,
    artifacts,
    metadata: buildMetadata(),
  };
}
