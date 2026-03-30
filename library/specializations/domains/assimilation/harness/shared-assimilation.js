import { defineTask } from '@a5c-ai/babysitter-sdk';

const canonicalReferences = [
  'plugins/babysitter/skills/babysit/SKILL.md',
  'docs/assimilation/harness/claude-code-integration.md',
  'docs/assimilation/harness/generic-harness-guide.md'
];

const edgeCaseMatrix = [
  're-entrant run binding and stale session state recovery',
  'lock contention, missing run directory, and CLI restart recovery',
  'completion proof mismatch and premature <promise> output rejection',
  'ambiguous or dismissed breakpoint response handling',
  'user rejection posted with --status ok and approved=false',
  'direct result.json writes rejected in favor of output.json + task:post',
  'no generated kind: "node" effects anywhere in the process or skill adaptation',
  'hook race conditions, repeated user yields, and harness restart recovery',
  'upgrade, reinstall, disable, rollback, and upstream sync behavior'
];

export const runHarnessResearchTask = defineTask('harness-runtime-research', (args, taskCtx) => ({
  kind: 'agent',
  title: `Research ${args.harnessName} distribution and hook model`,
  description: 'Research upstream distribution, runtime install path, hook points, and orchestration loop behavior before implementation',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior integration researcher and harness architect',
      task: `Research the real distribution and integration model for ${args.harnessName} before making any implementation decisions`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        upstreamSource: args.upstreamSource,
        distributionTarget: args.distributionTarget,
        loopModel: args.loopModel,
        canonicalReferences
      },
      instructions: [
        `Start with repository research in ${args.projectDir}, then research the upstream distribution model for ${args.harnessName}.`,
        `Determine how ${args.harnessName} plugins, extensions, packages, commands, or runtime libraries are actually distributed, installed, upgraded, enabled, disabled, and removed.`,
        `Identify the real hook points, lifecycle callbacks, wrapper entry points, or continuation APIs used to keep the orchestration loop alive under the loop model "${args.loopModel}".`,
        'Treat the current babysit skill and Claude Code harness integration as the canonical orchestration contract.',
        'Treat the canonical babysit process library in the original upstream repo as the source of truth. Do not assume a harness-specific bundled copy should be the long-term distribution model.',
        'Extract the concrete rules that must be preserved: run:create --harness first when native binding exists, stop-or-yield after task:post, exact completion proof handling, output.json posting protocol, breakpoint approval semantics, no node effects, and state file expectations.',
        'Document whether the harness supports first-class binding, fallback external binding, or a non-stop-hook continuation pattern such as followUp or after-agent reentry.',
        'Document the clean-room runtime install story from GitHub or the official upstream source, including any packaging manifests, registry format, signed artifact expectations, or plugin manager commands.',
        'Document the actual process-library runtime capabilities the integration can rely on today: clone or sync workflow, active binding behavior, active-root inspection, path discovery, revision pinning, and any harness-specific fallback order.',
        `Name the docs that must be updated for ${args.harnessName}, including install, upgrade, troubleshooting, and operator verification guidance.`,
        'Return a migration brief that implementation tasks can follow without guessing.'
      ],
      outputFormat: 'JSON with findings, hookPoints, installStrategy, upstreamSyncStrategy, processLibraryCapabilities, docsTargets, loopContract, risks, artifactsCreated'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'hookPoints', 'installStrategy', 'upstreamSyncStrategy', 'processLibraryCapabilities', 'docsTargets', 'loopContract', 'risks', 'artifactsCreated'],
      properties: {
        findings: { type: 'array', items: { type: 'string' } },
        hookPoints: { type: 'array', items: { type: 'string' } },
        installStrategy: { type: 'array', items: { type: 'string' } },
        upstreamSyncStrategy: { type: 'array', items: { type: 'string' } },
        processLibraryCapabilities: { type: 'array', items: { type: 'string' } },
        docsTargets: { type: 'array', items: { type: 'string' } },
        loopContract: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        artifactsCreated: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'research', 'runtime']
}));

export const adaptOriginalBabysitTask = defineTask('adapt-original-babysit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adapt canonical babysit assets into ${args.harnessName}`,
  description: 'Install or sync the original babysit process library at runtime and adapt the important Claude Code skill semantics into the target harness',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior orchestration engineer specializing in skill migration and plugin packaging',
      task: `Adapt the canonical babysit skill, process library, and harness contract into ${args.harnessName} without drifting from the source of truth`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        upstreamSource: args.upstreamSource,
        research: args.research,
        canonicalReferences
      },
      instructions: [
        'Read the current babysit skill and the Claude Code harness documentation as the source of truth.',
        'Copy and adapt the important operational parts of the original babysit Claude Code skill instead of rewriting a weaker local version from scratch.',
        'Preserve the orchestration contract: stop or yield after task:post, hook-owned continuation, exact completion proof semantics, output.json posting, breakpoint approval rules, and no node effects.',
        'Keep user-facing README and install docs focused on harness installation, activation, commands, and troubleshooting. Put raw Babysitter CLI or SDK orchestration mechanics into harness-internal command docs, skill docs, agent context docs, or maintainer docs instead.',
        'When the harness has a command surface, keep literal primitives such as run:create, run:iterate, task:list, task:post, session:init, and session:associate out of user-facing README and install docs entirely.',
        'Design the runtime install or sync path for the original process library from the upstream GitHub repo or official source into the target plugin or extension layout.',
        'Prefer clone-and-sync of the canonical process library over bundling a frozen copy into the harness package. If the harness still needs a fallback snapshot, describe it as temporary compatibility, not the primary source of truth.',
        'If the harness cannot install directly from GitHub at runtime, define the supported fallback order, revision pinning strategy, update workflow, and stale-copy detection markers.',
        'Update the target harness skill, command entry points, references, process-library resolution logic, and setup scripts so they point back to the canonical babysit contract.',
        'Make explicit what was copied, what was adapted, what stayed harness-specific, what remains upstream-owned, and how updates from upstream will be merged later.',
        'Reject stale patterns from older process files, especially session:associate-first designs, direct result.json writes, implicit breakpoint approval, and kind: node effects.'
      ],
      outputFormat: 'JSON with filesCreated, filesModified, copiedAssets, adaptedAssets, syncPlan, runtimeInstallPlan, processLibraryCapabilities, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'copiedAssets', 'adaptedAssets', 'syncPlan', 'runtimeInstallPlan', 'processLibraryCapabilities', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        copiedAssets: { type: 'array', items: { type: 'string' } },
        adaptedAssets: { type: 'array', items: { type: 'string' } },
        syncPlan: { type: 'array', items: { type: 'string' } },
        runtimeInstallPlan: { type: 'array', items: { type: 'string' } },
        processLibraryCapabilities: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'migration', 'skill']
}));

export const writeHarnessInstallDocsTask = defineTask('write-harness-install-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write ${args.harnessName} install and operator docs`,
  description: 'Author install, upgrade, sync, troubleshooting, and runtime verification documentation for the harness integration',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior technical writer and release engineer',
      task: `Write the missing installation and lifecycle documentation for the ${args.harnessName} babysitter integration`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        research: args.research,
        assimilation: args.assimilation
      },
      instructions: [
        'Create or update documentation for initial installation, runtime installation from GitHub or upstream source, local development linking, upgrade, reinstall, disable, uninstall, and rollback.',
        'Keep the top-level README and user-facing install docs at the harness command level: how the user installs the harness, activates it, starts or resumes runs through harness commands, and where to look when it gets stuck.',
        'Do not tell end users to manually drive raw Babysitter SDK or CLI primitives such as run:create, run:iterate, task:list, task:post, session:init, or session:associate from the README unless the harness truly exposes no higher-level command surface.',
        'If the harness does expose a higher-level command surface, treat any literal mention of those primitives in README or install docs as a documentation bug and move that detail into internal command, skill, hook, or maintainer docs.',
        'Move low-level Babysitter CLI or SDK mechanics into harness-internal command docs, skill docs, agent context files, hook docs, or maintainer/operator docs for that harness.',
        'Document the canonical process-library source repo, the exact clone or sync command path, revision pinning, update checks, and what temporary fallback exists if upstream sync is unavailable.',
        'Document the actual process-library lifecycle the harness uses in practice: clone or sync path, active binding behavior, active-root inspection, and fallback behavior when the preferred path is unavailable.',
        'Document the exact verification steps that prove the plugin or extension is active, the babysitter CLI is reachable, and the orchestration loop is bound to the harness.',
        'Document where session state lives, how the harness resumes after yielding to the user, and how operators diagnose stuck loops or broken hook registration.',
        'Include troubleshooting for permission issues, missing binaries, hook registration failures, stale session files, lock conflicts, and completion proof mismatches.',
        'Reference the canonical babysit skill semantics and explain any harness-specific differences without weakening the contract.',
        'Return the list of docs created or updated.'
      ],
      outputFormat: 'JSON with filesCreated, filesModified, docsCovered, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'docsCovered', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        docsCovered: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'docs', 'install']
}));

export const runHarnessRuntimeValidationTask = defineTask('run-harness-runtime-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate full ${args.harnessName} orchestration runtime`,
  description: 'Run the actual harness integration, validate user-yield continuation, and exercise the edge-case matrix',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'staff QA engineer specializing in plugin and harness integration testing',
      task: `Execute a real validation plan for the ${args.harnessName} babysitter integration instead of a structural smoke test`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        loopModel: args.loopModel,
        research: args.research,
        docs: args.docs,
        integrationFiles: args.integrationFiles,
        localTestResult: args.localTestResult,
        edgeCaseMatrix
      },
      instructions: [
        'Install or activate the harness integration exactly as an operator would, using the documented runtime install path from GitHub or the upstream source when possible.',
        'Validate the canonical process-library integration path itself: clone or sync the upstream library, record the resolved root path, and verify the harness uses that root instead of silently preferring a bundled copy.',
        `Run a real babysitter process through ${args.harnessName} and validate the full loop model "${args.loopModel}".`,
        'Exercise run:create through the harness-native path first. Only use explicit session association as a documented fallback when the harness truly lacks first-class binding.',
        'Verify that after an effect is posted the harness yields control and the hook, after-agent callback, idle callback, or followUp mechanism resumes the orchestration loop instead of inline multi-iteration spinning.',
        'Verify that the original babysit skill adaptation is actually loaded by the target harness and that important canonical instructions survived the migration.',
        'Verify that the integration exposes or documents a concrete active process-library root for the current run or session and that the documented install or sync path matches what the runtime actually uses.',
        'Verify that user-facing README and install docs rely on harness commands and activation flow rather than instructing the end user to manually operate raw Babysitter CLI or SDK primitives, unless that is truly the only supported harness UX.',
        'Fail the validation when user-facing README or install docs still name run:create, run:iterate, task:list, task:post, session:init, or session:associate even though the harness already exposes higher-level commands.',
        'Run the edge-case matrix and record pass or fail for each scenario.',
        'Confirm that result posting uses output.json plus task:post, and explicitly fail the validation if any generated path still instructs direct result.json writes.',
        'Confirm that no process or generated skill emits kind: node.',
        'Return a runtime report with blocking issues, test evidence, and the final verdict.'
      ],
      outputFormat: 'JSON with passed, failed, total, allPassed, tests, blockers, evidence, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'failed', 'total', 'allPassed', 'tests', 'blockers', 'evidence', 'summary'],
      properties: {
        passed: { type: 'number' },
        failed: { type: 'number' },
        total: { type: 'number' },
        allPassed: { type: 'boolean' },
        tests: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'passed', 'details'],
            properties: {
              name: { type: 'string' },
              passed: { type: 'boolean' },
              details: { type: 'string' }
            }
          }
        },
        blockers: { type: 'array', items: { type: 'string' } },
        evidence: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'test', 'e2e']
}));

export const verifyHarnessAssimilationTask = defineTask('verify-harness-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify ${args.harnessName} assimilation quality`,
  description: 'Score the harness integration against research, runtime validation, installability, and canonical babysit fidelity',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'principal integration reviewer',
      task: `Score the ${args.harnessName} harness assimilation against the target quality threshold`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        targetQuality: args.targetQuality,
        research: args.research,
        assimilation: args.assimilation,
        docs: args.docs,
        localTestResult: args.localTestResult,
        runtimeValidation: args.runtimeValidation,
        integrationFiles: args.integrationFiles
      },
      instructions: [
        'Score research quality, implementation fidelity, runtime proof, installability, and operator readiness on a 0-100 scale.',
        'Deduct heavily for any of the following: no upstream research, no runtime install story, no canonical babysit skill adaptation, no full harness run, no user-yield continuation test, missing install docs, user-facing README or install docs that tell end users to drive raw Babysitter CLI or SDK primitives instead of harness commands, direct result.json write guidance, implicit breakpoint approval, node effects, or bundled-library-first distribution.',
        'Deduct heavily if user-facing docs mention literal runtime primitives by name when the harness has a higher-level command surface and that detail could live in internal command or skill docs instead.',
        'Verify that the runtime validation actually exercises the real harness loop instead of a dry-run surrogate.',
        'Verify that the install docs and sync plan are sufficient for a new operator to reproduce the integration from the upstream repo.',
        'Verify that the process-library install, sync, and active-root behavior is documented accurately for the harness and matches the runtime validation evidence.',
        'Return both score and qualityScore so existing processes can consume the result without local translation.'
      ],
      outputFormat: 'JSON with score, qualityScore, issues, recommendations, dimensions, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'qualityScore', 'issues', 'recommendations', 'dimensions', 'summary'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        qualityScore: { type: 'number', minimum: 0, maximum: 100 },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        dimensions: {
          type: 'object',
          properties: {
            research: { type: 'number' },
            fidelity: { type: 'number' },
            runtime: { type: 'number' },
            docs: { type: 'number' },
            edgeCases: { type: 'number' }
          }
        },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'verify', 'quality']
}));

export const refineHarnessAssimilationTask = defineTask('refine-harness-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine ${args.harnessName} assimilation (iteration ${args.iteration})`,
  description: 'Apply targeted fixes to close research, install, loop-validation, and docs gaps',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'staff integration engineer',
      task: `Fix the highest-impact gaps in the ${args.harnessName} harness assimilation`,
      context: {
        projectDir: args.projectDir,
        harnessName: args.harnessName,
        iteration: args.iteration,
        issues: args.issues,
        recommendations: args.recommendations,
        integrationFiles: args.integrationFiles
      },
      instructions: [
        'Prioritize fixes that restore the canonical babysit contract before aesthetic cleanup.',
        'Close research gaps, upstream install gaps, missing skill migration details, loop validation gaps, docs omissions, and edge-case blind spots before lower-priority cleanup.',
        'If an old prompt or artifact still tells end users to use raw Babysitter CLI or SDK primitives from user-facing README or install docs, move that guidance into harness-internal command docs, skill docs, hook docs, or maintainer docs and replace the user-facing copy with the actual harness command flow.',
        'If a user-facing README or install doc still mentions literal primitives like run:create, run:iterate, task:list, task:post, session:init, or session:associate even though the harness has a command surface, remove those names from the user-facing doc and relocate the details.',
        'If an old prompt or artifact still mentions session:associate-first, direct result.json writes, implicit breakpoint approval, or node effects, replace it with the current contract.',
        'Return the files created or modified and summarize the fixes applied.'
      ],
      outputFormat: 'JSON with filesCreated, filesModified, fixesApplied, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified', 'fixesApplied', 'summary'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        fixesApplied: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'assimilation', 'harness', 'converge']
}));
