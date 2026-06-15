/**
 * @process repo/issue-831-adapters-directory-moves-tdd
 * @description TDD, spec-driven convergence plan for moving mux packages under packages/adapters for issue #831.
 * @inputs {
 *   issueNumber: number,
 *   baseBranch: string,
 *   implementationBranch: string,
 *   targetQuality: number,
 *   maxIterationsPerPhase: number,
 *   designDocs: string[],
 *   processLibraryReferences: string[],
 *   packageMoves: Array<{ from: string, to: string, currentPackage: string, targetPackage: string }>,
 *   legacyDirectoryMoves: Array<{ from: string, to: string }>,
 *   verificationCommands: string[],
 *   phaseSpecs: Array<{ id: string, title: string, scope: string[], acceptance: string[], testFocus: string[], verification: string[] }>
 * }
 * @outputs {
 *   success: boolean,
 *   issueContext: object,
 *   reuseAudit: object,
 *   specContract: object,
 *   phaseResults: object[],
 *   finalVerification: object,
 *   finalReview: object
 * }
 *
 * Research basis:
 * - Issue #831: move transport-mux, extension-mux, triggers-mux, tasks-mux, tool-mux, and hooks-mux under packages/adapters.
 * - docs/adapters/terminology-and-structure-gaps/directory-moves.md
 * - docs/adapters/terminology-and-structure-gaps/package-renames.md
 * - docs/adapters/terminology-and-structure-gaps/README.md
 * - docs/agent-reference/process-authoring.md
 * - /home/runner/.a5c/process-library/babysitter-repo/library/tdd-quality-convergence.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/tdd-quality-convergence.md
 * - /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared/tdd-triplet.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared/completeness-gate.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/metaswarm/skills/adversarial-review/SKILL.md
 *
 * Process-library note:
 * - The requested repo-local .a5c/process-library/ directory is absent in this checkout.
 * - Matching methodologies were researched in /home/runner/.a5c/process-library/babysitter-repo/library and reflected here.
 *
 * Repo-specific authoring note:
 * - This process intentionally uses agent tasks instead of kind: "shell" tasks, honoring docs/agent-reference/process-authoring.md.
 * - Future executor agents may run deterministic commands inside agent tasks, but this process definition does not create shell subtasks.
 *
 * @process babysitter/tdd-quality-convergence
 * @process processes/shared/tdd-triplet
 * @process processes/shared/completeness-gate
 * @process methodologies/metaswarm/adversarial-review
 * @agent spec-architect methodologies/superpowers/agents/spec-reviewer/AGENT.md
 * @agent tdd-enforcer methodologies/pilot-shell/agents/tdd-enforcer/AGENT.md
 * @agent monorepo-implementer methodologies/superpowers/agents/implementer/AGENT.md
 * @agent adversarial-reviewer methodologies/metaswarm/agents/code-reviewer/AGENT.md
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

const DEFAULT_TARGET_QUALITY = 90;
const DEFAULT_MAX_ITERATIONS_PER_PHASE = 4;

function valueOf(result) {
  return result?.value ?? result ?? null;
}

function scoreOf(review) {
  const value = valueOf(review);
  return Number(value?.score ?? value?.overallScore ?? 0);
}

function phasePassed(checkpoint, review, targetQuality) {
  const checkpointValue = valueOf(checkpoint);
  const reviewValue = valueOf(review);
  return checkpointValue?.passed === true
    && reviewValue?.approved === true
    && scoreOf(reviewValue) >= targetQuality
    && (reviewValue?.blockingIssues?.length ?? 0) === 0;
}

export async function process(inputs, ctx) {
  const issueNumber = inputs.issueNumber ?? 831;
  const targetQuality = inputs.targetQuality ?? DEFAULT_TARGET_QUALITY;
  const maxIterationsPerPhase = inputs.maxIterationsPerPhase ?? DEFAULT_MAX_ITERATIONS_PER_PHASE;
  const phaseSpecs = inputs.phaseSpecs ?? [];

  const issueContext = await ctx.task(readIssueContextTask, {
    ...inputs,
    issueNumber,
  }, { key: "issue-831.phase-0.issue-context" });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext: valueOf(issueContext),
  }, { key: "issue-831.phase-0.reuse-audit" });

  const specContract = await ctx.task(specContractTask, {
    inputs,
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
  }, { key: "issue-831.phase-0.spec-contract" });

  const phasePlan = await ctx.task(phasePlanTask, {
    inputs,
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
    specContract: valueOf(specContract),
    phaseSpecs,
    targetQuality,
  }, { key: "issue-831.phase-0.phase-plan" });

  const phaseResults = [];

  for (const phaseSpec of phaseSpecs) {
    let checkpoint = null;
    let review = null;
    const iterations = [];

    for (let iteration = 1; iteration <= maxIterationsPerPhase; iteration += 1) {
      const red = await ctx.task(redTestsTask, {
        inputs,
        issueContext: valueOf(issueContext),
        reuseAudit: valueOf(reuseAudit),
        specContract: valueOf(specContract),
        phasePlan: valueOf(phasePlan),
        phaseSpec,
        previousReview: valueOf(review),
        iteration,
      }, { key: `issue-831.${phaseSpec.id}.iteration-${iteration}.red` });

      const green = await ctx.task(greenImplementationTask, {
        inputs,
        issueContext: valueOf(issueContext),
        specContract: valueOf(specContract),
        phasePlan: valueOf(phasePlan),
        phaseSpec,
        red: valueOf(red),
        previousReview: valueOf(review),
        iteration,
      }, { key: `issue-831.${phaseSpec.id}.iteration-${iteration}.green` });

      const refactor = await ctx.task(refactorTask, {
        inputs,
        issueContext: valueOf(issueContext),
        specContract: valueOf(specContract),
        phasePlan: valueOf(phasePlan),
        phaseSpec,
        red: valueOf(red),
        green: valueOf(green),
        previousReview: valueOf(review),
        iteration,
      }, { key: `issue-831.${phaseSpec.id}.iteration-${iteration}.refactor` });

      checkpoint = await ctx.task(verificationCheckpointTask, {
        inputs,
        issueContext: valueOf(issueContext),
        specContract: valueOf(specContract),
        phaseSpec,
        red: valueOf(red),
        green: valueOf(green),
        refactor: valueOf(refactor),
        iteration,
      }, { key: `issue-831.${phaseSpec.id}.iteration-${iteration}.verification` });

      review = await ctx.task(adversarialReviewTask, {
        inputs,
        issueContext: valueOf(issueContext),
        specContract: valueOf(specContract),
        phaseSpec,
        red: valueOf(red),
        green: valueOf(green),
        refactor: valueOf(refactor),
        checkpoint: valueOf(checkpoint),
        targetQuality,
        iteration,
      }, { key: `issue-831.${phaseSpec.id}.iteration-${iteration}.adversarial-review` });

      iterations.push({
        iteration,
        red: valueOf(red),
        green: valueOf(green),
        refactor: valueOf(refactor),
        checkpoint: valueOf(checkpoint),
        review: valueOf(review),
        score: scoreOf(review),
      });

      if (phasePassed(checkpoint, review, targetQuality)) {
        break;
      }
    }

    if (!phasePassed(checkpoint, review, targetQuality)) {
      await ctx.breakpoint({
        title: `Issue #${issueNumber} ${phaseSpec.title} did not converge`,
        question: `Phase ${phaseSpec.id} did not reach score >= ${targetQuality} within ${maxIterationsPerPhase} iterations. Review blockers before continuing.`,
        context: {
          runId: ctx.runId,
          issueNumber,
          phaseSpec,
          latestCheckpoint: valueOf(checkpoint),
          latestReview: valueOf(review),
          iterations,
        },
      }, {
        breakpointId: `issue-831.${phaseSpec.id}.non-convergence`,
        tags: ["issue-831", "adapters", "quality-gate"],
        strategy: "single",
      });
    }

    const phaseGate = await ctx.task(interPhaseGateTask, {
      inputs,
      issueContext: valueOf(issueContext),
      specContract: valueOf(specContract),
      phaseSpec,
      iterations,
      checkpoint: valueOf(checkpoint),
      review: valueOf(review),
      targetQuality,
    }, { key: `issue-831.${phaseSpec.id}.inter-phase-gate` });

    phaseResults.push({
      phase: phaseSpec.id,
      title: phaseSpec.title,
      iterations,
      checkpoint: valueOf(checkpoint),
      review: valueOf(review),
      phaseGate: valueOf(phaseGate),
      passed: phasePassed(checkpoint, review, targetQuality) && valueOf(phaseGate)?.passed === true,
    });
  }

  const finalVerification = await ctx.task(finalVerificationTask, {
    inputs,
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
    specContract: valueOf(specContract),
    phasePlan: valueOf(phasePlan),
    phaseResults,
  }, { key: "issue-831.final.verification" });

  const finalReview = await ctx.task(finalAdversarialReviewTask, {
    inputs,
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
    specContract: valueOf(specContract),
    phasePlan: valueOf(phasePlan),
    phaseResults,
    finalVerification: valueOf(finalVerification),
    targetQuality,
  }, { key: "issue-831.final.adversarial-review" });

  const success = valueOf(finalVerification)?.passed === true
    && valueOf(finalReview)?.approved === true
    && scoreOf(finalReview) >= targetQuality
    && phaseResults.every((phase) => phase.passed === true);

  return {
    success,
    issueNumber,
    baseBranch: inputs.baseBranch ?? "staging",
    implementationBranch: inputs.implementationBranch ?? "issue-831-adapters-directory-moves",
    targetQuality,
    maxIterationsPerPhase,
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
    specContract: valueOf(specContract),
    phasePlan: valueOf(phasePlan),
    phaseResults,
    finalVerification: valueOf(finalVerification),
    finalReview: valueOf(finalReview),
  };
}

export const readIssueContextTask = defineTask("issue-831/read-issue-context", (args) => ({
  kind: "agent",
  title: "Phase 0 - Read issue and referenced docs",
  labels: ["issue-831", "research", "spec"],
  agent: {
    name: "spec-architect",
    prompt: {
      role: "senior maintainer extracting source-of-truth requirements",
      task: "Read issue #831, labels, comments, and referenced docs before any implementation.",
      context: args,
      instructions: [
        `Run gh issue view ${args.issueNumber} --json title,body,labels,comments,state,url.`,
        `Confirm it is not a PR with gh pr view ${args.issueNumber} --json files,title,body,comments, and record the result.`,
        "Read every path in inputs.designDocs, especially directory-moves.md and package-renames.md.",
        "Extract explicit acceptance criteria, implied acceptance criteria, non-goals, and ambiguous points.",
        "Do not edit repository files in this phase.",
        "Return JSON with title, url, labels, issueSummary, commentTimeline, referencedDocs, acceptanceCriteria, ambiguities, and nonGoals.",
      ],
    },
  },
}));

export const reuseAuditTask = defineTask("issue-831/reuse-audit", (args) => ({
  kind: "agent",
  title: "Phase 0 - Reuse audit",
  labels: ["issue-831", "reuse-audit", "monorepo"],
  agent: {
    name: "spec-architect",
    prompt: {
      role: "senior TypeScript monorepo architect",
      task: "Audit current mux package layout and existing migration helpers before drafting implementation changes.",
      context: args,
      instructions: [
        "Start the report with exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).",
        "Extract keywords: transport-mux, extension-mux, triggers-mux, tasks-mux, tool-mux, hooks-mux, adapters-proxy, package workspaces, tsconfig references, CI workflows, atlas graph, package-lock, import paths.",
        "Scan package.json, tsconfig.json, scripts, .github/workflows, packages/atlas/graph, docs, and each target package package.json/tsconfig.",
        "Identify existing helper scripts such as scripts/adapters-build.cjs and scripts/hooks-mux-build.cjs that may need path updates or can be reused for verification.",
        "Record all source and target directories, package names, bin names, workspace globs, and references that must change.",
        "Do not edit repository files in this phase.",
        "Return JSON with findings, currentLayout, targetLayout, reusableInfrastructure, referenceSurfaces, likelyTestLocations, risks, and blockers.",
      ],
    },
  },
}));

export const specContractTask = defineTask("issue-831/spec-contract", (args) => ({
  kind: "agent",
  title: "Phase 0 - Spec contract and acceptance matrix",
  labels: ["issue-831", "spec", "acceptance"],
  agent: {
    name: "spec-architect",
    prompt: {
      role: "specification engineer for a TypeScript monorepo refactor",
      task: "Turn issue #831 and referenced docs into a concrete acceptance matrix for TDD execution.",
      context: args,
      instructions: [
        "Define the exact move map from inputs.packageMoves and inputs.legacyDirectoryMoves.",
        "Define package-name expectations from package-renames.md for moved packages.",
        "Define reference-update expectations for root workspace globs, package-lock, tsconfig references, CI workflow uses/build paths, atlas graph metadata, docs, and source imports.",
        "Separate must-have issue #831 acceptance from broader terminology cleanup that should not be bundled unless directly required by referenced directory/package move docs.",
        "List deterministic tests and static checks that should fail before each phase and pass after it.",
        "Return JSON with moveContract, packageRenameContract, referenceContract, tddExpectations, phaseAcceptance, nonGoals, and riskControls.",
      ],
    },
  },
}));

export const phasePlanTask = defineTask("issue-831/phase-plan", (args) => ({
  kind: "agent",
  title: "Phase 0 - Iterative TDD phase plan",
  labels: ["issue-831", "plan", "tdd"],
  agent: {
    name: "tdd-enforcer",
    prompt: {
      role: "TDD lead planning red-green-refactor convergence",
      task: "Create the execution map for issue #831 using the supplied phase specs.",
      context: args,
      instructions: [
        "For every phase, map red tests, minimum green implementation, refactor goals, verification commands, and adversarial review criteria.",
        "Require the red step to demonstrate at least one failing test or static assertion before implementation for that phase.",
        "Require the green step to make only the minimum changes needed for the phase tests to pass.",
        "Require the refactor step to preserve behavior while reducing duplication or stale compatibility paths.",
        `Require adversarial review score >= ${args.targetQuality} before proceeding to the next phase.`,
        "Return JSON with phases, dependencies, expectedChangedSurfaces, commandMatrix, scoringRubric, and exitCriteria.",
      ],
    },
  },
}));

export const redTestsTask = defineTask("issue-831/red-tests", (args) => ({
  kind: "agent",
  title: `Red - ${args.phaseSpec?.title ?? "phase tests"}`,
  labels: ["issue-831", "red", "tests-first"],
  agent: {
    name: "tdd-enforcer",
    responderType: "agent",
    adapter: "codex",
    fallbackType: "internal",
    prompt: {
      role: "strict TDD engineer",
      task: "Write failing tests or static checks for this phase before implementation.",
      context: args,
      instructions: [
        "Edit only test, fixture, or validation/check files needed to expose the phase gap.",
        "Do not perform production/source directory moves or reference updates in the red step.",
        "Create tests that fail on the pre-implementation tree for the specific phase acceptance criteria.",
        "Run the narrowest relevant command(s) to prove the new checks fail for the expected reason.",
        "Record exact commands, expected failures, observed failures, and paths of tests/checks added.",
        "Return JSON with changedFiles, testFiles, commandsRun, redConfirmed, failureEvidence, and nextGreenInstructions.",
      ],
    },
  },
}));

export const greenImplementationTask = defineTask("issue-831/green-implementation", (args) => ({
  kind: "agent",
  title: `Green - ${args.phaseSpec?.title ?? "phase implementation"}`,
  labels: ["issue-831", "green", "implementation"],
  agent: {
    name: "monorepo-implementer",
    responderType: "agent",
    adapter: "codex",
    fallbackType: "internal",
    prompt: {
      role: "senior TypeScript monorepo implementer",
      task: "Implement the minimum production changes needed to pass the red tests for this phase.",
      context: args,
      instructions: [
        "Use git mv for directory moves so history is preserved.",
        "Keep edits scoped to this phase and the tests written in the red step.",
        "Update package names, imports, tsconfig references, workspace globs, CI paths, docs, atlas graph metadata, and lockfile entries only when required by this phase's acceptance criteria.",
        "Preserve public compatibility only when the spec or tests require it; otherwise remove stale path references in the same phase that invalidates them.",
        "Run the red-step commands again and the phase verification commands until they pass.",
        "Return JSON with changedFiles, commandsRun, passingEvidence, deferredItems, and riskNotes.",
      ],
    },
  },
}));

export const refactorTask = defineTask("issue-831/refactor", (args) => ({
  kind: "agent",
  title: `Refactor - ${args.phaseSpec?.title ?? "phase cleanup"}`,
  labels: ["issue-831", "refactor", "cleanup"],
  agent: {
    name: "monorepo-implementer",
    responderType: "agent",
    adapter: "codex",
    fallbackType: "internal",
    prompt: {
      role: "senior refactoring engineer",
      task: "Refactor the phase implementation while preserving all passing tests.",
      context: args,
      instructions: [
        "Remove duplicated path maps, stale references, obsolete directory-specific assumptions, and temporary compatibility code introduced during green.",
        "Do not broaden scope beyond this phase.",
        "Rerun the phase tests after refactoring.",
        "Return JSON with changedFiles, refactorsApplied, commandsRun, passingEvidence, and remainingDebt.",
      ],
    },
  },
}));

export const verificationCheckpointTask = defineTask("issue-831/verification-checkpoint", (args) => ({
  kind: "agent",
  title: `Checkpoint - ${args.phaseSpec?.title ?? "phase verification"}`,
  labels: ["issue-831", "verification", "checkpoint"],
  agent: {
    name: "tdd-enforcer",
    responderType: "agent",
    adapter: "codex",
    fallbackType: "internal",
    prompt: {
      role: "verification engineer",
      task: "Run the phase verification checkpoint and collect evidence.",
      context: args,
      instructions: [
        "Run every command listed in phaseSpec.verification plus any narrow command introduced by the red tests.",
        "Verify there are no stale source or metadata references to moved directories except documented historical docs or explicitly accepted compatibility references.",
        "Verify the package-lock and npm workspaces resolve the new package locations.",
        "Verify no unrelated files were modified.",
        "Return JSON with passed, commandsRun, staleReferenceScan, changedFileAudit, failures, and evidence.",
      ],
    },
  },
}));

export const adversarialReviewTask = defineTask("issue-831/adversarial-review", (args) => ({
  kind: "agent",
  title: `Adversarial review - ${args.phaseSpec?.title ?? "phase"}`,
  labels: ["issue-831", "adversarial-review", "quality-score"],
  agent: {
    name: "adversarial-reviewer",
    responderType: "agent",
    adapter: "codex",
    fallbackType: "internal",
    prompt: {
      role: "fresh adversarial reviewer with no attachment to the implementation",
      task: "Review this phase for spec compliance and score quality from 0 to 100.",
      context: args,
      instructions: [
        "Spawn conceptually fresh: do not anchor on prior review conclusions.",
        "Use PASS/FAIL reasoning with file:line evidence for every blocking issue.",
        "Score 0-100 using this rubric: tests-first proof 20, move/package/reference correctness 30, verification evidence 20, minimal scoped implementation 15, maintainability/refactor quality 15.",
        `Approve only when score >= ${args.targetQuality}, checkpoint passed, and no blocking issues remain.`,
        "Return JSON with approved, score, dimensionScores, blockingIssues, evidence, requiredFixes, and nextIterationFocus.",
      ],
    },
  },
}));

export const interPhaseGateTask = defineTask("issue-831/inter-phase-gate", (args) => ({
  kind: "agent",
  title: `Inter-phase gate - ${args.phaseSpec?.title ?? "phase"}`,
  labels: ["issue-831", "gate", "checkpoint"],
  agent: {
    name: "spec-architect",
    prompt: {
      role: "release gatekeeper",
      task: "Decide whether this phase is safe to compose with subsequent phases.",
      context: args,
      instructions: [
        "Confirm phase review score meets targetQuality and verification passed.",
        "Confirm there are no known broken workspaces, stale path references, or deferred must-have acceptance criteria.",
        "Confirm the next phase can proceed from the current tree without relying on hidden assumptions.",
        "Return JSON with passed, summary, blockers, handoffNotes, and nextPhaseRisks.",
      ],
    },
  },
}));

export const finalVerificationTask = defineTask("issue-831/final-verification", (args) => ({
  kind: "agent",
  title: "Final verification - full mux move acceptance",
  labels: ["issue-831", "final", "verification"],
  agent: {
    name: "tdd-enforcer",
    responderType: "agent",
    adapter: "codex",
    fallbackType: "internal",
    prompt: {
      role: "final verification engineer",
      task: "Run the full deterministic verification suite for issue #831.",
      context: args,
      instructions: [
        "Run every command in inputs.verificationCommands and record exact output summaries.",
        "Run stale-reference scans for old directory paths, old package names, and legacy adapters directory names.",
        "Verify all packageMoves and legacyDirectoryMoves are present at target paths and absent from old paths.",
        "Verify root workspaces, tsconfig references, package-lock, CI workflows, atlas graph metadata, docs, source imports, and package scripts are internally consistent.",
        "Return JSON with passed, commandsRun, staleReferenceReport, moveReport, workspaceReport, failures, and evidence.",
      ],
    },
  },
}));

export const finalAdversarialReviewTask = defineTask("issue-831/final-adversarial-review", (args) => ({
  kind: "agent",
  title: "Final adversarial review - issue #831",
  labels: ["issue-831", "final", "adversarial-review"],
  agent: {
    name: "adversarial-reviewer",
    responderType: "agent",
    adapter: "codex",
    fallbackType: "internal",
    prompt: {
      role: "fresh final adversarial reviewer",
      task: "Review the complete implementation against issue #831 and referenced docs.",
      context: args,
      instructions: [
        "Treat this as a fresh review independent of earlier phase reviews.",
        "Require file:line evidence for every PASS claim on critical acceptance criteria and every FAIL finding.",
        "Score 0-100 using this rubric: complete directory/package move contract 25, workspace/tsconfig/lockfile correctness 20, CI/docs/atlas/reference correctness 20, test quality and red-green evidence 20, maintainability and scope control 15.",
        `Approve only when finalVerification passed, every phase passed, and score >= ${args.targetQuality}.`,
        "Return JSON with approved, score, dimensionScores, blockingIssues, evidence, residualRisks, and releaseRecommendation.",
      ],
    },
  },
}));
