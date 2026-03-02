/**
 * @process gsd/new-project
 * @description GSD-inspired project initialization with vision capture, research, and roadmap
 * @inputs { projectName: string, projectType?: string, initialIdea?: string }
 * @outputs { success: boolean, vision: object, requirements: object, roadmap: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * New Project Initialization
 *
 * GSD Methodology: Systematic questioning → Parallel research → Requirements → Roadmap
 *
 * Phases:
 * 1. Vision Capture - Agent-guided questioning until vision is clear
 * 2. Domain Research - Parallel research across stack, features, architecture, pitfalls
 * 3. Requirements Scoping - v1/v2 separation with traceability
 * 4. Roadmap Creation - Phased milestones with dependencies
 *
 * Agents referenced from agents/ directory:
 *   - gsd-project-researcher: Vision capture and initial project analysis
 *   - gsd-phase-researcher: Parallel domain research (stack, features, architecture, pitfalls)
 *   - gsd-planner: Requirements scoping with v1/v2 separation
 *   - gsd-roadmapper: Phased roadmap creation with milestones
 *
 * Skills referenced from skills/ directory:
 *   - gsd-tools: Config loading and project initialization
 *   - template-scaffolding: PROJECT.md, REQUIREMENTS.md, ROADMAP.md templates
 *   - state-management: Project state initialization
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.projectType - Type of project (web, mobile, api, etc.)
 * @param {string} inputs.initialIdea - Initial project description
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with vision, requirements, and roadmap
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    projectType = 'web',
    initialIdea = ''
  } = inputs;

  // ============================================================================
  // PHASE 1: VISION CAPTURE
  // ============================================================================

  const visionResult = await ctx.task(visionCaptureTask, {
    projectName,
    projectType,
    initialIdea,
    context: inputs.context || {}
  });

  // Breakpoint: Review captured vision
  await ctx.breakpoint({
    question: `Review the project vision for "${projectName}". Is this accurate and complete?`,
    title: 'Vision Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/PROJECT.md', format: 'markdown', label: 'Project Vision' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: PARALLEL DOMAIN RESEARCH
  // ============================================================================

  // Run 4 parallel research agents (GSD pattern)
  const [
    stackResearch,
    featuresResearch,
    architectureResearch,
    pitfallsResearch
  ] = await ctx.parallel.all([
    () => ctx.task(stackResearchTask, { projectName, projectType, vision: visionResult }),
    () => ctx.task(featuresResearchTask, { projectName, projectType, vision: visionResult }),
    () => ctx.task(architectureResearchTask, { projectName, projectType, vision: visionResult }),
    () => ctx.task(pitfallsResearchTask, { projectName, projectType, vision: visionResult })
  ]);

  const research = {
    stack: stackResearch,
    features: featuresResearch,
    architecture: architectureResearch,
    pitfalls: pitfallsResearch
  };

  // ============================================================================
  // PHASE 3: REQUIREMENTS SCOPING
  // ============================================================================

  const requirementsResult = await ctx.task(requirementsScopingTask, {
    projectName,
    vision: visionResult,
    research
  });

  // Breakpoint: Review requirements
  await ctx.breakpoint({
    question: `Review scoped requirements (v1/v2) for "${projectName}". Approve to proceed with roadmap?`,
    title: 'Requirements Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/REQUIREMENTS.md', format: 'markdown', label: 'Requirements' }
      ]
    }
  });

  // ============================================================================
  // PHASE 4: ROADMAP CREATION
  // ============================================================================

  const roadmapResult = await ctx.task(roadmapCreationTask, {
    projectName,
    vision: visionResult,
    requirements: requirementsResult,
    research
  });

  // Final breakpoint: Review complete initialization
  await ctx.breakpoint({
    question: `Project "${projectName}" initialized. Review vision, requirements, and roadmap. Ready to begin development?`,
    title: 'Project Initialization Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/PROJECT.md', format: 'markdown', label: 'Vision' },
        { path: 'artifacts/REQUIREMENTS.md', format: 'markdown', label: 'Requirements' },
        { path: 'artifacts/ROADMAP.md', format: 'markdown', label: 'Roadmap' },
        { path: 'artifacts/research/summary.md', format: 'markdown', label: 'Research Summary' }
      ]
    }
  });

  return {
    success: true,
    projectName,
    vision: visionResult,
    requirements: requirementsResult,
    research,
    roadmap: roadmapResult,
    artifacts: {
      project: 'artifacts/PROJECT.md',
      requirements: 'artifacts/REQUIREMENTS.md',
      roadmap: 'artifacts/ROADMAP.md',
      research: 'artifacts/research/'
    },
    metadata: {
      processId: 'gsd/new-project',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Vision Capture Task
 * Agent-guided questioning to capture clear project vision
 */
export const visionCaptureTask = defineTask('vision-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capture vision: ${args.projectName}`,
  description: 'Systematic questioning to clarify project vision',

  agent: {
    name: 'gsd-project-researcher',
    prompt: {
      role: 'senior product manager and technical visionary',
      task: 'Through systematic questioning and analysis, capture a complete, clear project vision',
      context: {
        projectName: args.projectName,
        projectType: args.projectType,
        initialIdea: args.initialIdea,
        additionalContext: args.context
      },
      instructions: [
        'Analyze the initial idea and identify missing pieces',
        'Define the core problem this project solves',
        'Identify target users and their needs',
        'Clarify success metrics and goals',
        'Define scope boundaries (what this is NOT)',
        'Identify key constraints (technical, business, timeline)',
        'Articulate the unique value proposition',
        'Generate a complete PROJECT.md document with: problem, solution, users, goals, scope, constraints'
      ],
      outputFormat: 'JSON with problem (string), solution (string), targetUsers (array), goals (array), successMetrics (array), scope (object with inScope and outOfScope arrays), constraints (array), valueProposition (string), projectMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['problem', 'solution', 'targetUsers', 'goals', 'scope', 'projectMarkdown'],
      properties: {
        problem: { type: 'string' },
        solution: { type: 'string' },
        targetUsers: { type: 'array', items: { type: 'string' } },
        goals: { type: 'array', items: { type: 'string' } },
        successMetrics: { type: 'array', items: { type: 'string' } },
        scope: {
          type: 'object',
          properties: {
            inScope: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } }
          }
        },
        constraints: { type: 'array', items: { type: 'string' } },
        valueProposition: { type: 'string' },
        projectMarkdown: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'vision']
}));

/**
 * Stack Research Task
 */
export const stackResearchTask = defineTask('stack-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research technology stack',
  description: 'Investigate appropriate technologies and tools',

  agent: {
    name: 'gsd-phase-researcher',
    prompt: {
      role: 'senior technology consultant and architect',
      task: 'Research and recommend technology stack for the project',
      context: {
        projectName: args.projectName,
        projectType: args.projectType,
        vision: args.vision
      },
      instructions: [
        'Analyze project requirements and constraints',
        'Research current best practices for this project type',
        'Evaluate technology options across: languages, frameworks, databases, hosting',
        'Consider: maturity, community, performance, learning curve, cost',
        'Recommend primary stack with justification',
        'Identify alternative options with trade-offs',
        'List required tools and dependencies'
      ],
      outputFormat: 'JSON with recommended (object), alternatives (array), tools (array), justification (string), tradeoffs (object)'
    },
    outputSchema: {
      type: 'object',
      required: ['recommended', 'justification'],
      properties: {
        recommended: {
          type: 'object',
          properties: {
            language: { type: 'string' },
            framework: { type: 'string' },
            database: { type: 'string' },
            hosting: { type: 'string' },
            additionalTools: { type: 'array', items: { type: 'string' } }
          }
        },
        alternatives: { type: 'array', items: { type: 'object' } },
        tools: { type: 'array', items: { type: 'string' } },
        justification: { type: 'string' },
        tradeoffs: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'research', 'stack']
}));

/**
 * Features Research Task
 */
export const featuresResearchTask = defineTask('features-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research feature implementation patterns',
  description: 'Investigate how similar features are typically implemented',

  agent: {
    name: 'gsd-phase-researcher',
    prompt: {
      role: 'senior product engineer and UX specialist',
      task: 'Research feature implementation patterns and best practices',
      context: {
        projectName: args.projectName,
        vision: args.vision
      },
      instructions: [
        'Identify core features from the vision',
        'Research implementation patterns for each feature type',
        'Analyze UX best practices for these features',
        'Identify common libraries/packages used',
        'Document accessibility considerations',
        'Note mobile/responsive requirements',
        'Provide implementation complexity estimates'
      ],
      outputFormat: 'JSON with features (array of objects with name, pattern, libraries, complexity, uxConsiderations)'
    },
    outputSchema: {
      type: 'object',
      required: ['features'],
      properties: {
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              pattern: { type: 'string' },
              libraries: { type: 'array', items: { type: 'string' } },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
              uxConsiderations: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'research', 'features']
}));

/**
 * Architecture Research Task
 */
export const architectureResearchTask = defineTask('architecture-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research architecture patterns',
  description: 'Investigate appropriate architecture for project scale and requirements',

  agent: {
    name: 'gsd-phase-researcher',
    prompt: {
      role: 'principal architect and systems designer',
      task: 'Research and recommend architecture patterns for the project',
      context: {
        projectName: args.projectName,
        projectType: args.projectType,
        vision: args.vision
      },
      instructions: [
        'Analyze project scale and complexity requirements',
        'Research architecture patterns: monolith, microservices, serverless, JAMstack, etc.',
        'Consider: scalability, maintainability, team size, deployment complexity',
        'Recommend directory structure and code organization',
        'Define data flow and state management approach',
        'Identify integration points and APIs',
        'Document architecture decision records (ADRs)'
      ],
      outputFormat: 'JSON with recommendedPattern, directoryStructure, dataFlow, integrations, adrs (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedPattern', 'directoryStructure'],
      properties: {
        recommendedPattern: { type: 'string' },
        directoryStructure: { type: 'object' },
        dataFlow: { type: 'string' },
        stateManagement: { type: 'string' },
        integrations: { type: 'array', items: { type: 'string' } },
        adrs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' },
              consequences: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'research', 'architecture']
}));

/**
 * Pitfalls Research Task
 */
export const pitfallsResearchTask = defineTask('pitfalls-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research common pitfalls',
  description: 'Identify common mistakes and how to avoid them',

  agent: {
    name: 'gsd-phase-researcher',
    prompt: {
      role: 'senior engineer with extensive debugging and post-mortem experience',
      task: 'Research common pitfalls for this project type and how to avoid them',
      context: {
        projectName: args.projectName,
        projectType: args.projectType,
        vision: args.vision
      },
      instructions: [
        'Identify common mistakes in similar projects',
        'Research security vulnerabilities specific to this stack',
        'Document performance bottlenecks to watch for',
        'Identify scaling challenges',
        'Note dependency/version management issues',
        'List testing anti-patterns',
        'Provide preventive measures and best practices for each pitfall'
      ],
      outputFormat: 'JSON with pitfalls (array of objects with category, description, prevention, resources)'
    },
    outputSchema: {
      type: 'object',
      required: ['pitfalls'],
      properties: {
        pitfalls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: ['security', 'performance', 'scaling', 'testing', 'dependencies', 'architecture', 'other'] },
              description: { type: 'string' },
              prevention: { type: 'array', items: { type: 'string' } },
              resources: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'research', 'pitfalls']
}));

/**
 * Requirements Scoping Task
 */
export const requirementsScopingTask = defineTask('requirements-scoping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scope requirements (v1/v2)',
  description: 'Create scoped requirements with v1/v2 separation',

  agent: {
    name: 'gsd-planner',
    prompt: {
      role: 'senior product manager and requirements engineer',
      task: 'Create comprehensive, scoped requirements with v1 MVP and v2 enhancements',
      context: {
        projectName: args.projectName,
        vision: args.vision,
        research: args.research
      },
      instructions: [
        'Extract functional requirements from vision and research',
        'Separate MVP (v1) from enhancements (v2)',
        'Define acceptance criteria for each requirement',
        'Identify dependencies between requirements',
        'Assign priorities (must-have, should-have, nice-to-have)',
        'Create traceability to vision goals',
        'Generate REQUIREMENTS.md document'
      ],
      outputFormat: 'JSON with v1 (array of requirements), v2 (array of requirements), requirementsMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['v1', 'v2', 'requirementsMarkdown'],
      properties: {
        v1: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'nice-to-have'] },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        v2: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' }
            }
          }
        },
        requirementsMarkdown: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'requirements']
}));

/**
 * Roadmap Creation Task
 */
export const roadmapCreationTask = defineTask('roadmap-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create development roadmap',
  description: 'Generate phased roadmap with milestones',

  agent: {
    name: 'gsd-roadmapper',
    prompt: {
      role: 'senior project manager and technical lead',
      task: 'Create a phased development roadmap with clear milestones',
      context: {
        projectName: args.projectName,
        vision: args.vision,
        requirements: args.requirements,
        research: args.research
      },
      instructions: [
        'Group requirements into logical phases',
        'Define milestones with definition-of-done criteria',
        'Sequence phases based on dependencies and risk',
        'Estimate phase duration and effort',
        'Identify critical path and parallel work opportunities',
        'Define success criteria for each milestone',
        'Generate ROADMAP.md document'
      ],
      outputFormat: 'JSON with phases (array of phase objects), milestones (array), criticalPath (array), roadmapMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'milestones', 'roadmapMarkdown'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              requirements: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              estimatedEffort: { type: 'string' }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              phases: { type: 'array', items: { type: 'string' } },
              definitionOfDone: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalPath: { type: 'array', items: { type: 'string' } },
        roadmapMarkdown: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'gsd', 'roadmap']
}));
