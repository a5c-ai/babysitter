/**
 * @process methodologies/everything-claude-code/ecc-continuous-learning
 * @description Everything Claude Code Continuous Learning Pipeline - Pattern extraction, evaluation with confidence scoring, skill creation, organization, versioning, and export
 * @inputs { sessionData?: object, projectRoot?: string, patternSources?: array, confidenceThreshold?: number, exportEnabled?: boolean, compactionEnabled?: boolean }
 * @outputs { success: boolean, patternsExtracted: array, skillCandidates: array, skillsCreated: array, compactionSuggestions: array, exportResult: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const extractPatternsTask = defineTask('ecc-learn-extract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract Patterns from Session',
  agent: {
    name: 'continuous-learning',
    prompt: {
      role: 'ECC Pattern Extractor',
      task: 'Analyze the development session data and extract reusable patterns, conventions, and learnings.',
      context: { ...args },
      instructions: [
        'Review all code changes made during the session',
        'Identify recurring patterns in implementation approaches',
        'Extract architectural decisions and their rationale',
        'Identify error resolution patterns (what worked, what did not)',
        'Note testing strategies that proved effective',
        'Capture tool usage patterns and configurations',
        'Extract naming conventions and code organization patterns',
        'Record performance optimization discoveries',
        'Assign a confidence score (0-100) to each pattern',
        'Tag patterns by category: architecture, testing, debugging, tooling, convention'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'learning', 'extraction']
}));

const evaluatePatternsTask = defineTask('ecc-learn-evaluate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate Pattern Quality and Relevance',
  agent: {
    name: 'continuous-learning',
    prompt: {
      role: 'ECC Pattern Evaluator',
      task: 'Evaluate extracted patterns for quality, generalizability, and conversion potential. Filter out low-confidence and project-specific patterns.',
      context: { ...args },
      instructions: [
        'Score each pattern on generalizability (0-100): can it apply to other projects?',
        'Score each pattern on reliability (0-100): has it been validated multiple times?',
        'Score each pattern on impact (0-100): how much does it improve outcomes?',
        'Calculate composite score: (generalizability * 0.3 + reliability * 0.4 + impact * 0.3)',
        'Filter patterns below the confidence threshold',
        'Identify patterns that conflict with existing skills',
        'Merge similar patterns into consolidated versions',
        'Rank patterns by composite score for skill conversion priority',
        'Flag patterns that need more evidence before conversion'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'learning', 'evaluation']
}));

const createSkillsTask = defineTask('ecc-learn-create-skills', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Convert Patterns to Skills',
  agent: {
    name: 'continuous-learning',
    prompt: {
      role: 'ECC Skill Creator',
      task: 'Convert high-confidence evaluated patterns into reusable babysitter skills with SKILL.md, README.md, and usage examples.',
      context: { ...args },
      instructions: [
        'For each pattern above the conversion threshold:',
        '  - Create a SKILL.md with frontmatter (name, description, allowed-tools)',
        '  - Write clear instructions organized by phases',
        '  - Include when-to-use and when-not-to-use sections',
        '  - Create a README.md with invocation examples',
        '  - Define the agents and processes that should use this skill',
        'Ensure skill names follow kebab-case convention',
        'Include attribution to the session where the pattern was discovered',
        'Validate skill structure matches babysitter conventions',
        'Return the list of created skills with file paths'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'learning', 'skill-creation']
}));

const organizeSkillsTask = defineTask('ecc-learn-organize', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Organize and Categorize Skills',
  agent: {
    name: 'continuous-learning',
    prompt: {
      role: 'ECC Skill Organizer',
      task: 'Organize newly created skills into the appropriate category structure, resolve naming conflicts, and update skill indexes.',
      context: { ...args },
      instructions: [
        'Categorize each skill: language-specific, domain, business, or meta',
        'Check for naming conflicts with existing skills',
        'Resolve conflicts by merging or renaming',
        'Place skills in the correct directory structure',
        'Update any skill indexes or manifests',
        'Verify cross-references between skills and agents are valid',
        'Create dependency graph if skills reference each other',
        'Generate a changelog entry for new skills'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'learning', 'organization']
}));

const compactionAnalysisTask = defineTask('ecc-learn-compaction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Strategic Compaction Analysis',
  agent: {
    name: 'context-engineering',
    prompt: {
      role: 'ECC Compaction Strategist',
      task: 'Analyze current context usage and suggest compaction strategies for token optimization. Identify what can be safely compressed, archived, or removed.',
      context: { ...args },
      instructions: [
        'Measure current context token usage by category',
        'Identify low-value context: resolved issues, completed phases, old discussions',
        'Suggest context that can be safely compressed (summarize instead of retain verbatim)',
        'Identify context that should be archived to memory files',
        'Calculate potential token savings per suggestion',
        'Rank suggestions by savings-to-risk ratio',
        'Preserve: active decisions, unresolved issues, current phase context',
        'Generate pre-compaction state preservation plan'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'learning', 'compaction']
}));

const versionExportTask = defineTask('ecc-learn-export', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Version and Export Skills',
  agent: {
    name: 'continuous-learning',
    prompt: {
      role: 'ECC Skill Exporter',
      task: 'Version new skills and export them for cross-project reuse. Create portable skill bundles that can be imported into other workspaces.',
      context: { ...args },
      instructions: [
        'Assign semantic version to each new skill based on maturity',
        'Create export manifest with skill metadata',
        'Bundle skill files into portable format',
        'Include usage examples and test cases in the bundle',
        'Generate import instructions for target workspaces',
        'Record export in the learning ledger',
        'Tag skills with origin project and confidence scores'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'learning', 'export']
}));

// ============================================================================
// PROCESS FUNCTION
// ============================================================================

/**
 * Everything Claude Code Continuous Learning Pipeline
 *
 * Extracts patterns from development sessions, evaluates them with confidence
 * scoring, converts high-quality patterns into reusable skills, organizes
 * them into the skill library, and optionally exports for cross-project reuse.
 *
 * @param {Object} inputs - Process inputs
 * @param {Object} inputs.sessionData - Session data to learn from (plan, code, reviews, etc.)
 * @param {string} inputs.projectRoot - Project root directory (default: '.')
 * @param {Array<string>} inputs.patternSources - Sources to extract from (default: all)
 * @param {number} inputs.confidenceThreshold - Min confidence for skill conversion (default: 75)
 * @param {boolean} inputs.exportEnabled - Enable cross-project export (default: false)
 * @param {boolean} inputs.compactionEnabled - Enable compaction analysis (default: true)
 * @param {Object} ctx - Process context
 */
export async function process(inputs, ctx) {
  const {
    sessionData = {},
    projectRoot = '.',
    patternSources = ['code', 'tests', 'reviews', 'architecture', 'debugging'],
    confidenceThreshold = 75,
    exportEnabled = false,
    compactionEnabled = true
  } = inputs;

  ctx.log('info', `Continuous Learning Pipeline starting: sources=${patternSources.join(', ')}`);

  // ── Phase 1: Pattern Extraction ─────────────────────────────────────
  ctx.log('info', 'Phase 1: Extracting patterns from session data');
  const extractionResult = await ctx.task(extractPatternsTask, {
    sessionData,
    projectRoot,
    patternSources
  });

  const patternCount = extractionResult.patterns?.length || 0;
  ctx.log('info', `Extracted ${patternCount} patterns`);

  if (patternCount === 0) {
    ctx.log('info', 'No patterns found, pipeline complete');
    return {
      success: true,
      patternsExtracted: [],
      skillCandidates: [],
      skillsCreated: [],
      compactionSuggestions: [],
      exportResult: null
    };
  }

  // ── Phase 2: Pattern Evaluation ─────────────────────────────────────
  ctx.log('info', 'Phase 2: Evaluating pattern quality and relevance');
  const evaluationResult = await ctx.task(evaluatePatternsTask, {
    patterns: extractionResult.patterns,
    confidenceThreshold
  });

  const candidates = evaluationResult.candidates || [];
  ctx.log('info', `${candidates.length} patterns qualify for skill conversion`);

  // ── Phase 3: Parallel - Skill Creation + Compaction Analysis ────────
  ctx.log('info', 'Phase 3: Creating skills and analyzing compaction (parallel)');

  const phase3Tasks = [];

  if (candidates.length > 0) {
    phase3Tasks.push(
      ctx.task(createSkillsTask, {
        candidates,
        projectRoot,
        confidenceThreshold
      })
    );
  } else {
    phase3Tasks.push(Promise.resolve({ skillsCreated: [] }));
  }

  if (compactionEnabled) {
    phase3Tasks.push(
      ctx.task(compactionAnalysisTask, {
        sessionData,
        projectRoot,
        patternCount,
        candidateCount: candidates.length
      })
    );
  } else {
    phase3Tasks.push(Promise.resolve({ suggestions: [] }));
  }

  const [skillCreationResult, compactionResult] = await ctx.parallel.all(phase3Tasks);

  const skillsCreated = skillCreationResult.skillsCreated || [];
  ctx.log('info', `Created ${skillsCreated.length} new skills`);

  // ── Phase 4: Organize Skills ────────────────────────────────────────
  let organizeResult = null;
  if (skillsCreated.length > 0) {
    ctx.log('info', 'Phase 4: Organizing and categorizing new skills');
    organizeResult = await ctx.task(organizeSkillsTask, {
      skillsCreated,
      projectRoot
    });
  }

  // ── Phase 5: Version and Export (optional) ──────────────────────────
  let exportResult = null;
  if (exportEnabled && skillsCreated.length > 0) {
    ctx.log('info', 'Phase 5: Versioning and exporting skills');
    exportResult = await ctx.task(versionExportTask, {
      skillsCreated,
      organizeResult,
      projectRoot
    });
  }

  // ── Breakpoint: Review new skills ───────────────────────────────────
  if (skillsCreated.length > 0) {
    await ctx.breakpoint({
      title: 'New Skills Created',
      description: `${skillsCreated.length} new skills were created from session patterns. Review before finalizing.`,
      data: { skillsCreated, organizeResult }
    });
  }

  const summary = {
    patternsExtracted: patternCount,
    patternsQualified: candidates.length,
    skillsCreated: skillsCreated.length,
    compactionSuggestions: compactionResult.suggestions?.length || 0,
    exported: exportResult ? true : false
  };

  ctx.log('info', `Continuous Learning complete: ${JSON.stringify(summary)}`);

  return {
    success: true,
    patternsExtracted: extractionResult.patterns || [],
    skillCandidates: candidates,
    skillsCreated,
    compactionSuggestions: compactionResult.suggestions || [],
    exportResult
  };
}
