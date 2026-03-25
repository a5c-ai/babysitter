/**
 * @process methodologies/ccpm/ccpm-epic-planning
 * @description CCPM Implementation Planning - Parse PRD into technical epic with architecture decisions, tech approach, and dependency mapping
 * @inputs { projectName: string, featureName: string, prd: object, existingCodebase?: object }
 * @outputs { success: boolean, epic: object, architectureDecisions: array, dependencies: array, validation: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * CCPM Epic Planning Process
 *
 * Adapted from CCPM (https://github.com/automazeio/ccpm)
 * Phase 2: Implementation Planning - Transforms a finalized PRD into a technical epic
 * with architecture decisions, technology approach, and dependency mapping.
 *
 * Workflow:
 * 1. Parse PRD - Extract requirements and constraints
 * 2. Architecture Decisions - Define system design choices with rationale
 * 3. Technology Approach - Specify stack, frameworks, and tools
 * 4. Dependency Mapping - Identify internal and external dependencies
 * 5. Epic Creation - Assemble complete epic document
 * 6. Validation - Verify epic covers all PRD requirements
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.featureName - Feature name
 * @param {Object} inputs.prd - Finalized PRD object from Phase 1
 * @param {Object} inputs.existingCodebase - Existing codebase analysis (optional, for brownfield)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Epic planning results
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    featureName,
    prd,
    existingCodebase = null
  } = inputs;

  ctx.log('Starting CCPM Epic Planning', { projectName, featureName });

  // ============================================================================
  // STEP 1: PARSE PRD AND EXTRACT REQUIREMENTS
  // ============================================================================

  ctx.log('Step 1: Parsing PRD');

  const parsedRequirements = await ctx.task(parsePrdTask, {
    prd,
    projectName,
    featureName
  });

  // ============================================================================
  // STEP 2: ARCHITECTURE DECISIONS
  // ============================================================================

  ctx.log('Step 2: Architecture Decisions');

  const archDecisions = await ctx.task(architectureDecisionsTask, {
    requirements: parsedRequirements,
    projectName,
    featureName,
    existingCodebase
  });

  // ============================================================================
  // STEP 3: TECHNOLOGY APPROACH
  // ============================================================================

  ctx.log('Step 3: Technology Approach');

  const techApproach = await ctx.task(technologyApproachTask, {
    requirements: parsedRequirements,
    architectureDecisions: archDecisions,
    projectName,
    existingCodebase
  });

  // ============================================================================
  // STEP 4: DEPENDENCY MAPPING
  // ============================================================================

  ctx.log('Step 4: Dependency Mapping');

  const dependencies = await ctx.task(dependencyMappingTask, {
    requirements: parsedRequirements,
    architectureDecisions: archDecisions,
    techApproach,
    projectName,
    existingCodebase
  });

  // ============================================================================
  // STEP 5: ASSEMBLE EPIC
  // ============================================================================

  ctx.log('Step 5: Assembling Epic');

  const epic = await ctx.task(assembleEpicTask, {
    projectName,
    featureName,
    prd,
    requirements: parsedRequirements,
    architectureDecisions: archDecisions,
    techApproach,
    dependencies
  });

  // ============================================================================
  // STEP 6: VALIDATE EPIC
  // ============================================================================

  ctx.log('Step 6: Validating Epic');

  const validation = await ctx.task(validateEpicTask, {
    epic,
    prd,
    requirements: parsedRequirements,
    projectName
  });

  // Quality convergence: revise if validation fails
  let currentEpic = epic;
  let revisionCount = 0;
  while (!validation.passes && revisionCount < 2) {
    revisionCount++;
    ctx.log('Epic revision', { iteration: revisionCount, issues: validation.issues });

    currentEpic = await ctx.task(reviseEpicTask, {
      epic: currentEpic,
      validationFeedback: validation,
      prd,
      requirements: parsedRequirements
    });

    const revalidation = await ctx.task(validateEpicTask, {
      epic: currentEpic,
      prd,
      requirements: parsedRequirements,
      projectName
    });

    if (revalidation.passes) {
      validation.passes = true;
      validation.score = revalidation.score;
      break;
    }
  }

  await ctx.breakpoint({
    question: `Review the technical epic for "${featureName}". ${archDecisions.decisions?.length || 0} architecture decisions made, ${dependencies.internal?.length || 0} internal and ${dependencies.external?.length || 0} external dependencies mapped. Quality score: ${validation.score}/100. Approve epic?`,
    title: 'Epic Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `.claude/epics/${featureName}/epic.md`, format: 'markdown', label: 'Epic Document' }
      ]
    }
  });

  return {
    success: validation.passes,
    projectName,
    featureName,
    epic: currentEpic,
    architectureDecisions: archDecisions,
    techApproach,
    dependencies,
    validation,
    revisionCount,
    artifacts: {
      epicPath: `.claude/epics/${featureName}/epic.md`
    },
    metadata: {
      processId: 'methodologies/ccpm/ccpm-epic-planning',
      attribution: 'https://github.com/automazeio/ccpm',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const parsePrdTask = defineTask('ccpm-parse-prd', (args, taskCtx) => ({
  kind: 'agent',
  title: `Parse PRD: ${args.featureName}`,
  agent: {
    name: 'architect',
    prompt: {
      role: 'Requirements analyst',
      task: 'Parse PRD and extract structured requirements for technical planning',
      context: { prd: args.prd, projectName: args.projectName },
      instructions: [
        'Extract all functional requirements with priorities',
        'Extract non-functional requirements (performance, security, scalability)',
        'Identify data models and entities',
        'List API surface areas needed',
        'Identify UI/UX components needed',
        'Map user stories to technical domains'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['functional', 'nonFunctional', 'dataModels', 'apiSurface', 'uiComponents'],
      properties: {
        functional: { type: 'array' },
        nonFunctional: { type: 'array' },
        dataModels: { type: 'array' },
        apiSurface: { type: 'array' },
        uiComponents: { type: 'array' },
        domainMapping: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'parse', 'epic-planning']
}));

export const architectureDecisionsTask = defineTask('ccpm-arch-decisions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Architecture Decisions: ${args.featureName}`,
  agent: {
    name: 'architect',
    prompt: {
      role: 'Solutions architect making architecture decisions',
      task: 'Define architecture decisions with rationale using ADR format',
      context: { requirements: args.requirements, existingCodebase: args.existingCodebase },
      instructions: [
        'Document each decision using ADR format (Context, Decision, Consequences)',
        'Consider trade-offs for each decision',
        'Address scalability, security, and maintainability',
        'Factor in existing codebase patterns if brownfield',
        'Define component boundaries and interfaces',
        'Document rejected alternatives with reasons'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['decisions', 'componentBoundaries'],
      properties: {
        decisions: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, context: { type: 'string' }, decision: { type: 'string' }, consequences: { type: 'array' }, alternatives: { type: 'array' } } } },
        componentBoundaries: { type: 'array' },
        patterns: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'architecture', 'epic-planning']
}));

export const technologyApproachTask = defineTask('ccpm-tech-approach', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Technology Approach',
  agent: {
    name: 'architect',
    prompt: {
      role: 'Technology stack specialist',
      task: 'Define technology approach aligned with architecture decisions',
      context: { requirements: args.requirements, architectureDecisions: args.architectureDecisions, existingCodebase: args.existingCodebase },
      instructions: [
        'Specify programming languages and frameworks',
        'Define database and storage choices',
        'Select testing frameworks and strategies',
        'Identify required third-party libraries',
        'Define build, deploy, and CI/CD approach',
        'Document compatibility requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['stack', 'frameworks', 'testingStrategy'],
      properties: {
        stack: { type: 'object' },
        frameworks: { type: 'array' },
        databases: { type: 'array' },
        testingStrategy: { type: 'object' },
        thirdPartyLibraries: { type: 'array' },
        buildAndDeploy: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'technology', 'epic-planning']
}));

export const dependencyMappingTask = defineTask('ccpm-dependency-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Dependency Mapping',
  agent: {
    name: 'architect',
    prompt: {
      role: 'Dependency analysis specialist',
      task: 'Map all internal and external dependencies',
      context: { requirements: args.requirements, architectureDecisions: args.architectureDecisions, techApproach: args.techApproach, existingCodebase: args.existingCodebase },
      instructions: [
        'Identify internal module dependencies',
        'Map external service dependencies',
        'Document package and library dependencies',
        'Identify cross-team dependencies',
        'Create dependency graph with ordering',
        'Flag circular dependency risks'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['internal', 'external', 'packages'],
      properties: {
        internal: { type: 'array' },
        external: { type: 'array' },
        packages: { type: 'array' },
        crossTeam: { type: 'array' },
        dependencyOrder: { type: 'array' },
        circularRisks: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'dependencies', 'epic-planning']
}));

export const assembleEpicTask = defineTask('ccpm-assemble-epic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assemble Epic: ${args.featureName}`,
  agent: {
    name: 'architect',
    prompt: {
      role: 'Epic document assembler',
      task: `Assemble complete epic document for "${args.featureName}"`,
      context: {
        prd: args.prd,
        requirements: args.requirements,
        architectureDecisions: args.architectureDecisions,
        techApproach: args.techApproach,
        dependencies: args.dependencies
      },
      instructions: [
        'Create epic document with all sections',
        'Include PRD reference and traceability',
        'Document architecture decisions',
        'Specify technology approach',
        'List all dependencies with ordering',
        'Define integration points and interfaces',
        'Write to .claude/epics/<featureName>/epic.md'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['epicPath', 'sections', 'requirementsCovered'],
      properties: {
        epicPath: { type: 'string' },
        sections: { type: 'array' },
        requirementsCovered: { type: 'number' },
        integrationPoints: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'assemble', 'epic-planning']
}));

export const validateEpicTask = defineTask('ccpm-validate-epic', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Epic',
  agent: {
    name: 'architect',
    prompt: {
      role: 'Epic quality reviewer',
      task: 'Validate epic completeness and PRD alignment',
      context: { epic: args.epic, prd: args.prd, requirements: args.requirements },
      instructions: [
        'Verify every PRD requirement has architectural support',
        'Check architecture decisions are consistent',
        'Validate dependency graph has no cycles',
        'Ensure technology choices align with constraints',
        'Score epic quality 0-100'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['passes', 'score', 'issues'],
      properties: {
        passes: { type: 'boolean' },
        score: { type: 'number' },
        issues: { type: 'array' },
        requirementCoverage: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'validation', 'epic-planning']
}));

export const reviseEpicTask = defineTask('ccpm-revise-epic', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Revise Epic',
  agent: {
    name: 'architect',
    prompt: {
      role: 'Epic revision specialist',
      task: 'Revise epic based on validation feedback',
      context: { epic: args.epic, feedback: args.validationFeedback, prd: args.prd, requirements: args.requirements },
      instructions: [
        'Address all validation issues',
        'Maintain PRD traceability',
        'Update architecture decisions if needed',
        'Revise dependency ordering'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['epicPath', 'changesApplied'],
      properties: {
        epicPath: { type: 'string' },
        changesApplied: { type: 'array' },
        sections: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ccpm', 'revision', 'epic-planning']
}));
