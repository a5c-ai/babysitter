/**
 * @process methodologies/bmad-method/bmad-orchestrator
 * @description BMAD Method - Full lifecycle AI-driven agile orchestrator with specialized agent personas
 * @inputs { projectName: string, projectDescription: string, complexity?: string, teamMode?: string, phases?: array }
 * @outputs { success: boolean, productBrief: object, prd: object, architecture: object, epics: array, sprints: array, artifacts: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * BMAD Method - Full Lifecycle Orchestrator
 *
 * Adapted from the BMAD Method (https://github.com/bmad-code-org/BMAD-METHOD)
 * An AI-driven agile development framework with specialized agent personas
 * and structured workflows guiding projects from brainstorming to deployment.
 *
 * Agent Personas:
 * - Mary (Analyst) - Strategic business analysis and requirements
 * - John (Product Manager) - PRD creation and stakeholder alignment
 * - Winston (Architect) - System architecture and technical design
 * - Bob (Scrum Master) - Sprint planning and agile ceremonies
 * - Amelia (Developer) - Test-driven implementation
 * - Quinn (QA Engineer) - Test automation and coverage
 * - Sally (UX Designer) - User experience and interaction design
 * - Paige (Tech Writer) - Technical documentation
 * - Barry (Solo Dev) - Quick flow full-stack development
 * - BMad Master - Orchestration and workflow management
 *
 * Phases:
 * 1. Analysis - Product brief, market/domain/technical research
 * 2. Planning - PRD creation, UX design, validation
 * 3. Solutioning - Architecture, epics and stories, readiness checks
 * 4. Implementation - Sprint planning, story dev, code review, retrospectives
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.projectDescription - High-level project description and goals
 * @param {string} inputs.complexity - Project complexity: 'small', 'medium', 'large', 'enterprise' (default: 'medium')
 * @param {string} inputs.teamMode - 'full-team' or 'solo' (default: 'full-team')
 * @param {Array<string>} inputs.phases - Phases to execute (default: all four)
 * @param {string} inputs.domainContext - Domain-specific context (optional)
 * @param {number} inputs.sprintCount - Number of implementation sprints (default: 3)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Complete project lifecycle results
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    projectDescription,
    complexity = 'medium',
    teamMode = 'full-team',
    phases = ['analysis', 'planning', 'solutioning', 'implementation'],
    domainContext = null,
    sprintCount = 3
  } = inputs;

  const results = {
    projectName,
    complexity,
    teamMode,
    phases: {}
  };

  // ============================================================================
  // PHASE 1: ANALYSIS (Agent: Mary - Analyst)
  // ============================================================================

  if (phases.includes('analysis')) {
    // Market and domain research
    const researchResult = await ctx.task(domainResearchTask, {
      projectName,
      projectDescription,
      domainContext,
      complexity
    });

    // Product brief creation
    const productBriefResult = await ctx.task(createProductBriefTask, {
      projectName,
      projectDescription,
      researchFindings: researchResult,
      complexity
    });

    await ctx.breakpoint({
      question: `Review the Product Brief for "${projectName}". Mary (Analyst) has completed market research and created a comprehensive product brief covering problem statement, target users, value proposition, and success metrics. Approve to proceed to planning phase?`,
      title: 'Phase 1: Analysis Complete - Product Brief Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/bmad/analysis/product-brief.md', format: 'markdown', label: 'Product Brief' },
          { path: 'artifacts/bmad/analysis/research-findings.md', format: 'markdown', label: 'Research Findings' }
        ]
      }
    });

    results.phases.analysis = {
      research: researchResult,
      productBrief: productBriefResult
    };
  }

  // ============================================================================
  // PHASE 2: PLANNING (Agents: John - PM, Sally - UX Designer)
  // ============================================================================

  if (phases.includes('planning')) {
    const analysisData = results.phases.analysis || {};

    // PRD creation by John (Product Manager)
    const prdResult = await ctx.task(createPrdTask, {
      projectName,
      projectDescription,
      productBrief: analysisData.productBrief || null,
      complexity
    });

    // PRD validation
    const prdValidationResult = await ctx.task(validatePrdTask, {
      projectName,
      prd: prdResult,
      complexity
    });

    await ctx.breakpoint({
      question: `Review the PRD for "${projectName}". John (PM) has created a Product Requirements Document with ${prdResult.featureCount || 'multiple'} features defined. Validation ${prdValidationResult.passed ? 'PASSED' : 'found issues'}. Approve to proceed with UX design?`,
      title: 'Phase 2: PRD Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/bmad/planning/prd.md', format: 'markdown', label: 'PRD' },
          { path: 'artifacts/bmad/planning/prd-validation.md', format: 'markdown', label: 'Validation Report' }
        ]
      }
    });

    // UX Design by Sally (UX Designer)
    const uxDesignResult = await ctx.task(createUxDesignTask, {
      projectName,
      prd: prdResult,
      complexity
    });

    await ctx.breakpoint({
      question: `Review UX Design for "${projectName}". Sally (UX Designer) has created user flows, wireframes, and interaction patterns. Approve to proceed to solutioning phase?`,
      title: 'Phase 2: UX Design Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/bmad/planning/ux-design.md', format: 'markdown', label: 'UX Design' }
        ]
      }
    });

    results.phases.planning = {
      prd: prdResult,
      prdValidation: prdValidationResult,
      uxDesign: uxDesignResult
    };
  }

  // ============================================================================
  // PHASE 3: SOLUTIONING (Agent: Winston - Architect)
  // ============================================================================

  if (phases.includes('solutioning')) {
    const planningData = results.phases.planning || {};

    // Architecture design by Winston (Architect)
    const architectureResult = await ctx.task(createArchitectureTask, {
      projectName,
      projectDescription,
      prd: planningData.prd || null,
      uxDesign: planningData.uxDesign || null,
      complexity
    });

    // Epics and stories creation by Bob (Scrum Master)
    const epicsResult = await ctx.task(createEpicsAndStoriesTask, {
      projectName,
      prd: planningData.prd || null,
      architecture: architectureResult,
      complexity
    });

    // Implementation readiness check
    const readinessResult = await ctx.task(checkImplementationReadinessTask, {
      projectName,
      prd: planningData.prd || null,
      architecture: architectureResult,
      epics: epicsResult,
      uxDesign: planningData.uxDesign || null
    });

    await ctx.breakpoint({
      question: `Implementation Readiness Check for "${projectName}": ${readinessResult.ready ? 'READY' : 'ISSUES FOUND'}. Winston (Architect) designed the system architecture. Bob (Scrum Master) created ${epicsResult.epicCount || 'multiple'} epics with stories. ${readinessResult.ready ? 'Approve to begin implementation?' : 'Review issues before proceeding.'}`,
      title: 'Phase 3: Solutioning Complete - Readiness Check',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/bmad/solutioning/architecture.md', format: 'markdown', label: 'Architecture' },
          { path: 'artifacts/bmad/solutioning/epics-and-stories.md', format: 'markdown', label: 'Epics & Stories' },
          { path: 'artifacts/bmad/solutioning/readiness-check.md', format: 'markdown', label: 'Readiness Check' }
        ]
      }
    });

    results.phases.solutioning = {
      architecture: architectureResult,
      epics: epicsResult,
      readiness: readinessResult
    };
  }

  // ============================================================================
  // PHASE 4: IMPLEMENTATION (Agents: Amelia - Dev, Bob - SM, Quinn - QA)
  // ============================================================================

  if (phases.includes('implementation')) {
    const solutioningData = results.phases.solutioning || {};
    const sprintResults = [];

    for (let sprintIdx = 0; sprintIdx < sprintCount; sprintIdx++) {
      const sprintNumber = sprintIdx + 1;

      // Sprint planning by Bob (Scrum Master)
      const sprintPlan = await ctx.task(bmadSprintPlanningTask, {
        projectName,
        sprintNumber,
        epics: solutioningData.epics || null,
        previousSprints: sprintResults,
        complexity
      });

      await ctx.breakpoint({
        question: `Sprint ${sprintNumber} Plan ready for "${projectName}". Bob (SM) selected ${sprintPlan.storyCount || 'multiple'} stories. Sprint goal: "${sprintPlan.sprintGoal || 'Deliver planned stories'}". Approve to start development?`,
        title: `Sprint ${sprintNumber} Planning Review`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/bmad/implementation/sprint-${sprintNumber}/plan.md`, format: 'markdown', label: 'Sprint Plan' }
          ]
        }
      });

      // Story development by Amelia (Developer) - process each story
      const storyResults = [];
      const stories = sprintPlan.stories || [];

      for (let storyIdx = 0; storyIdx < stories.length; storyIdx++) {
        const story = stories[storyIdx];

        const devResult = await ctx.task(developStoryTask, {
          projectName,
          sprintNumber,
          story,
          storyIndex: storyIdx + 1,
          totalStories: stories.length
        });

        storyResults.push(devResult);
      }

      // Code review by Amelia (Developer) - cross-review
      const codeReviewResult = await ctx.task(bmadCodeReviewTask, {
        projectName,
        sprintNumber,
        storyResults,
        complexity
      });

      // QA testing by Quinn (QA Engineer)
      const qaResult = await ctx.task(qaTestingTask, {
        projectName,
        sprintNumber,
        storyResults,
        codeReview: codeReviewResult
      });

      // Sprint retrospective by Bob (Scrum Master)
      const retroResult = await ctx.task(bmadRetrospectiveTask, {
        projectName,
        sprintNumber,
        sprintPlan,
        storyResults,
        codeReview: codeReviewResult,
        qaResult
      });

      await ctx.breakpoint({
        question: `Sprint ${sprintNumber} complete for "${projectName}". ${storyResults.length} stories implemented. Code review: ${codeReviewResult.overallRating || 'complete'}. QA: ${qaResult.testsPassed || 0}/${qaResult.totalTests || 0} tests passing. ${retroResult.improvements?.length || 0} improvements identified. Proceed to ${sprintIdx < sprintCount - 1 ? 'next sprint' : 'final summary'}?`,
        title: `Sprint ${sprintNumber} Retrospective`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/bmad/implementation/sprint-${sprintNumber}/retrospective.md`, format: 'markdown', label: 'Retrospective' },
            { path: `artifacts/bmad/implementation/sprint-${sprintNumber}/code-review.md`, format: 'markdown', label: 'Code Review' },
            { path: `artifacts/bmad/implementation/sprint-${sprintNumber}/qa-report.md`, format: 'markdown', label: 'QA Report' }
          ]
        }
      });

      sprintResults.push({
        sprintNumber,
        plan: sprintPlan,
        stories: storyResults,
        codeReview: codeReviewResult,
        qa: qaResult,
        retrospective: retroResult
      });
    }

    results.phases.implementation = { sprints: sprintResults };
  }

  // ============================================================================
  // FINAL: PROJECT DOCUMENTATION (Agent: Paige - Tech Writer)
  // ============================================================================

  const documentationResult = await ctx.task(generateProjectDocumentationTask, {
    projectName,
    projectDescription,
    results,
    complexity
  });

  await ctx.breakpoint({
    question: `BMAD Method process complete for "${projectName}". Paige (Tech Writer) has generated comprehensive project documentation. ${Object.keys(results.phases).length} phases executed across ${Object.keys(results.phases).length} lifecycle stages. Review final documentation?`,
    title: 'BMAD Method - Process Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/bmad/documentation/project-overview.md', format: 'markdown', label: 'Project Overview' },
        { path: 'artifacts/bmad/documentation/technical-docs.md', format: 'markdown', label: 'Technical Documentation' },
        { path: 'artifacts/bmad/final-summary.md', format: 'markdown', label: 'Final Summary' }
      ]
    }
  });

  return {
    success: true,
    projectName,
    complexity,
    teamMode,
    phases: results.phases,
    documentation: documentationResult,
    artifacts: {
      productBrief: 'artifacts/bmad/analysis/product-brief.md',
      researchFindings: 'artifacts/bmad/analysis/research-findings.md',
      prd: 'artifacts/bmad/planning/prd.md',
      uxDesign: 'artifacts/bmad/planning/ux-design.md',
      architecture: 'artifacts/bmad/solutioning/architecture.md',
      epicsAndStories: 'artifacts/bmad/solutioning/epics-and-stories.md',
      projectOverview: 'artifacts/bmad/documentation/project-overview.md',
      finalSummary: 'artifacts/bmad/final-summary.md'
    },
    metadata: {
      processId: 'methodologies/bmad-method/bmad-orchestrator',
      timestamp: ctx.now(),
      framework: 'BMAD Method',
      source: 'https://github.com/bmad-code-org/BMAD-METHOD'
    }
  };
}

// ============================================================================
// PHASE 1: ANALYSIS TASKS
// ============================================================================

/**
 * Domain and market research - Agent: Mary (Analyst)
 */
export const domainResearchTask = defineTask('bmad-domain-research', (args, taskCtx) => ({
  kind: 'agent',
  title: `Domain Research: ${args.projectName}`,
  description: 'Mary (Analyst) conducts market, domain, and technical research',

  agent: {
    name: 'bmad-analyst-mary',
    prompt: {
      role: 'Mary - Strategic Business Analyst with expertise in market research, competitive analysis, and requirements elicitation. Approaches challenges with curiosity and structures insights methodically.',
      task: 'Conduct comprehensive domain, market, and technical research for the project',
      context: {
        projectName: args.projectName,
        projectDescription: args.projectDescription,
        domainContext: args.domainContext,
        complexity: args.complexity
      },
      instructions: [
        'Conduct market research: identify competitors, market size, trends',
        'Perform domain research: understand problem space, user pain points',
        'Evaluate technical feasibility: assess technology options and constraints',
        'Apply SWOT analysis and competitive intelligence frameworks',
        'Identify key stakeholders and their needs',
        'Document assumptions and risks discovered during research',
        'Provide actionable recommendations based on findings',
        'Scale research depth to project complexity level'
      ],
      outputFormat: 'JSON with research findings organized by market, domain, and technical areas'
    },
    outputSchema: {
      type: 'object',
      required: ['marketResearch', 'domainResearch', 'technicalResearch'],
      properties: {
        marketResearch: {
          type: 'object',
          properties: {
            competitors: { type: 'array', items: { type: 'object' } },
            marketSize: { type: 'string' },
            trends: { type: 'array', items: { type: 'string' } },
            opportunities: { type: 'array', items: { type: 'string' } }
          }
        },
        domainResearch: {
          type: 'object',
          properties: {
            problemSpace: { type: 'string' },
            userPainPoints: { type: 'array', items: { type: 'string' } },
            stakeholders: { type: 'array', items: { type: 'object' } },
            assumptions: { type: 'array', items: { type: 'string' } }
          }
        },
        technicalResearch: {
          type: 'object',
          properties: {
            technologyOptions: { type: 'array', items: { type: 'object' } },
            feasibilityAssessment: { type: 'string' },
            constraints: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        risks: { type: 'array', items: { type: 'object' } },
        swotAnalysis: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/analysis/research-findings.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'analysis', 'research', 'mary']
}));

/**
 * Product brief creation - Agent: Mary (Analyst)
 */
export const createProductBriefTask = defineTask('bmad-create-product-brief', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Product Brief: ${args.projectName}`,
  description: 'Mary (Analyst) creates a comprehensive product brief from research findings',

  agent: {
    name: 'bmad-analyst-mary',
    prompt: {
      role: 'Mary - Strategic Business Analyst specializing in translating unclear needs into actionable specifications',
      task: 'Create a comprehensive product brief synthesizing research into a clear project foundation',
      context: {
        projectName: args.projectName,
        projectDescription: args.projectDescription,
        researchFindings: args.researchFindings,
        complexity: args.complexity
      },
      instructions: [
        'Define the problem statement clearly and concisely',
        'Identify target users with personas and demographics',
        'Articulate the value proposition and unique selling points',
        'Define success metrics and KPIs',
        'Outline scope boundaries (in-scope vs out-of-scope)',
        'List key assumptions and dependencies',
        'Define initial feature themes at a high level',
        'Include competitive positioning',
        'Set project constraints (timeline, budget, technology)',
        'Provide recommendation for next steps'
      ],
      outputFormat: 'JSON with structured product brief sections'
    },
    outputSchema: {
      type: 'object',
      required: ['problemStatement', 'targetUsers', 'valueProposition', 'successMetrics', 'scope'],
      properties: {
        problemStatement: { type: 'string' },
        targetUsers: { type: 'array', items: { type: 'object' } },
        valueProposition: { type: 'string' },
        successMetrics: { type: 'array', items: { type: 'object' } },
        scope: {
          type: 'object',
          properties: {
            inScope: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } }
          }
        },
        featureThemes: { type: 'array', items: { type: 'string' } },
        competitivePositioning: { type: 'string' },
        constraints: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/analysis/product-brief.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'analysis', 'product-brief', 'mary']
}));

// ============================================================================
// PHASE 2: PLANNING TASKS
// ============================================================================

/**
 * PRD creation - Agent: John (Product Manager)
 */
export const createPrdTask = defineTask('bmad-create-prd', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create PRD: ${args.projectName}`,
  description: 'John (PM) creates a Product Requirements Document through structured discovery',

  agent: {
    name: 'bmad-pm-john',
    prompt: {
      role: 'John - Product Manager with 8+ years launching B2B and consumer products. Expert in user-centered design and Jobs-to-be-Done framework. Asks WHY relentlessly.',
      task: 'Create a comprehensive PRD through structured requirements discovery',
      context: {
        projectName: args.projectName,
        projectDescription: args.projectDescription,
        productBrief: args.productBrief,
        complexity: args.complexity
      },
      instructions: [
        'Start with user interviews and Jobs-to-be-Done analysis',
        'Define clear product goals aligned with business objectives',
        'Create detailed feature specifications with acceptance criteria',
        'Prioritize features using MoSCoW or RICE framework',
        'Define user stories for each feature',
        'Specify non-functional requirements (performance, security, scalability)',
        'Include data requirements and integration points',
        'Define release strategy and MVP scope',
        'Add success criteria and measurement plan',
        'Validate assumptions through iterative questioning',
        'Scale PRD depth to project complexity'
      ],
      outputFormat: 'JSON with structured PRD sections including features, stories, and requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['productGoals', 'features', 'userStories', 'mvpScope'],
      properties: {
        productGoals: { type: 'array', items: { type: 'string' } },
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        featureCount: { type: 'number' },
        userStories: { type: 'array', items: { type: 'object' } },
        nonFunctionalRequirements: { type: 'object' },
        mvpScope: { type: 'object' },
        releaseStrategy: { type: 'string' },
        dataRequirements: { type: 'object' },
        measurementPlan: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/planning/prd.md', format: 'markdown' },
      { path: 'artifacts/bmad/planning/prd.json', format: 'json' }
    ]
  },

  labels: ['agent', 'bmad', 'planning', 'prd', 'john']
}));

/**
 * PRD validation - cross-agent validation
 */
export const validatePrdTask = defineTask('bmad-validate-prd', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate PRD: ${args.projectName}`,
  description: 'Cross-agent validation of PRD for completeness and consistency',

  agent: {
    name: 'bmad-master',
    prompt: {
      role: 'BMad Master - Master Task Executor and validation orchestrator ensuring quality across all BMAD artifacts',
      task: 'Validate the PRD for completeness, consistency, and implementation readiness',
      context: {
        projectName: args.projectName,
        prd: args.prd,
        complexity: args.complexity
      },
      instructions: [
        'Check completeness: all required sections present',
        'Validate consistency: features align with goals and user stories',
        'Verify acceptance criteria are testable and measurable',
        'Check prioritization is logical and justified',
        'Ensure non-functional requirements are specified',
        'Validate MVP scope is achievable',
        'Check for ambiguity and vague requirements',
        'Verify edge cases are considered',
        'Ensure requirements are traceable to business goals'
      ],
      outputFormat: 'JSON with validation results, issues found, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'score', 'issues'],
      properties: {
        passed: { type: 'boolean' },
        score: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/planning/prd-validation.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'planning', 'validation', 'bmad-master']
}));

/**
 * UX Design - Agent: Sally (UX Designer)
 */
export const createUxDesignTask = defineTask('bmad-create-ux-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create UX Design: ${args.projectName}`,
  description: 'Sally (UX Designer) creates user flows, wireframes, and interaction patterns',

  agent: {
    name: 'bmad-ux-sally',
    prompt: {
      role: 'Sally - Senior UX Designer with 7+ years experience. Uses storytelling to illustrate user problems. Balances simplicity with comprehensive edge case consideration.',
      task: 'Create comprehensive UX design including user flows, wireframes, and interaction patterns',
      context: {
        projectName: args.projectName,
        prd: args.prd,
        complexity: args.complexity
      },
      instructions: [
        'Conduct user research synthesis from PRD personas',
        'Create user journey maps for primary user flows',
        'Design information architecture and navigation structure',
        'Create wireframes for key screens and interactions',
        'Define interaction patterns and micro-interactions',
        'Establish visual design system foundations (typography, color, spacing)',
        'Design for accessibility (WCAG compliance)',
        'Consider responsive design across device types',
        'Document edge cases and error states',
        'Create design specifications for developer handoff'
      ],
      outputFormat: 'JSON with UX design artifacts including user flows, wireframes, and design system'
    },
    outputSchema: {
      type: 'object',
      required: ['userFlows', 'wireframes', 'designSystem'],
      properties: {
        userFlows: { type: 'array', items: { type: 'object' } },
        wireframes: { type: 'array', items: { type: 'object' } },
        informationArchitecture: { type: 'object' },
        designSystem: {
          type: 'object',
          properties: {
            typography: { type: 'object' },
            colorPalette: { type: 'object' },
            spacing: { type: 'object' },
            components: { type: 'array', items: { type: 'object' } }
          }
        },
        interactionPatterns: { type: 'array', items: { type: 'object' } },
        accessibilityNotes: { type: 'array', items: { type: 'string' } },
        responsiveBreakpoints: { type: 'array', items: { type: 'object' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/planning/ux-design.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'planning', 'ux-design', 'sally']
}));

// ============================================================================
// PHASE 3: SOLUTIONING TASKS
// ============================================================================

/**
 * Architecture design - Agent: Winston (Architect)
 */
export const createArchitectureTask = defineTask('bmad-create-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Architecture: ${args.projectName}`,
  description: 'Winston (Architect) designs system architecture with technical decisions',

  agent: {
    name: 'bmad-architect-winston',
    prompt: {
      role: 'Winston - System Architect specializing in distributed systems, cloud infrastructure, and API design. Calm, pragmatic, connects every decision to business value.',
      task: 'Design comprehensive system architecture documenting all technical decisions',
      context: {
        projectName: args.projectName,
        projectDescription: args.projectDescription,
        prd: args.prd,
        uxDesign: args.uxDesign,
        complexity: args.complexity
      },
      instructions: [
        'Define high-level system architecture with component diagram',
        'Select technology stack with justification for each choice',
        'Design data model and database architecture',
        'Define API contracts and integration patterns',
        'Plan infrastructure and deployment architecture',
        'Address security architecture and authentication',
        'Design for scalability and performance requirements',
        'Document Architecture Decision Records (ADRs)',
        'Define development environment setup',
        'Plan CI/CD pipeline architecture',
        'Consider developer productivity in all decisions',
        'Prefer proven technologies over experimental ones'
      ],
      outputFormat: 'JSON with architecture design, ADRs, technology stack, and data model'
    },
    outputSchema: {
      type: 'object',
      required: ['systemArchitecture', 'technologyStack', 'dataModel'],
      properties: {
        systemArchitecture: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            components: { type: 'array', items: { type: 'object' } },
            integrations: { type: 'array', items: { type: 'object' } }
          }
        },
        technologyStack: {
          type: 'object',
          properties: {
            frontend: { type: 'object' },
            backend: { type: 'object' },
            database: { type: 'object' },
            infrastructure: { type: 'object' },
            devTools: { type: 'object' }
          }
        },
        dataModel: {
          type: 'object',
          properties: {
            entities: { type: 'array', items: { type: 'object' } },
            relationships: { type: 'array', items: { type: 'object' } }
          }
        },
        apiContracts: { type: 'array', items: { type: 'object' } },
        securityArchitecture: { type: 'object' },
        deploymentArchitecture: { type: 'object' },
        adrs: { type: 'array', items: { type: 'object' } },
        scalabilityPlan: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/solutioning/architecture.md', format: 'markdown' },
      { path: 'artifacts/bmad/solutioning/architecture.json', format: 'json' }
    ]
  },

  labels: ['agent', 'bmad', 'solutioning', 'architecture', 'winston']
}));

/**
 * Epics and stories creation - Agent: Bob (Scrum Master)
 */
export const createEpicsAndStoriesTask = defineTask('bmad-create-epics-stories', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Epics & Stories: ${args.projectName}`,
  description: 'Bob (Scrum Master) creates implementation-ready epics and user stories',

  agent: {
    name: 'bmad-sm-bob',
    prompt: {
      role: 'Bob - Technical Scrum Master specializing in story preparation, sprint planning, and task sequencing. Direct, checklist-oriented, eliminates ambiguity.',
      task: 'Create comprehensive epics and implementation-ready user stories from PRD and architecture',
      context: {
        projectName: args.projectName,
        prd: args.prd,
        architecture: args.architecture,
        complexity: args.complexity
      },
      instructions: [
        'Break PRD features into logical epics',
        'Create user stories for each epic with INVEST criteria',
        'Write clear acceptance criteria for each story',
        'Add implementation context from architecture decisions',
        'Estimate stories using story points (Fibonacci)',
        'Identify dependencies between stories',
        'Order stories for optimal development flow',
        'Tag stories by type: feature, technical, infrastructure',
        'Ensure stories are small enough for a single sprint',
        'Include technical tasks alongside user stories'
      ],
      outputFormat: 'JSON with epics, stories, estimates, and dependency graph'
    },
    outputSchema: {
      type: 'object',
      required: ['epics', 'epicCount', 'totalStories'],
      properties: {
        epics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              stories: { type: 'array', items: { type: 'object' } },
              totalPoints: { type: 'number' }
            }
          }
        },
        epicCount: { type: 'number' },
        totalStories: { type: 'number' },
        totalStoryPoints: { type: 'number' },
        dependencyGraph: { type: 'object' },
        suggestedOrder: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/solutioning/epics-and-stories.md', format: 'markdown' },
      { path: 'artifacts/bmad/solutioning/epics-and-stories.json', format: 'json' }
    ]
  },

  labels: ['agent', 'bmad', 'solutioning', 'epics', 'stories', 'bob']
}));

/**
 * Implementation readiness check
 */
export const checkImplementationReadinessTask = defineTask('bmad-check-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation Readiness: ${args.projectName}`,
  description: 'Winston (Architect) validates alignment across PRD, design, architecture, and stories',

  agent: {
    name: 'bmad-architect-winston',
    prompt: {
      role: 'Winston - Architect conducting implementation readiness assessment to validate all artifacts are aligned and development can begin',
      task: 'Validate implementation readiness by checking alignment across all project artifacts',
      context: {
        projectName: args.projectName,
        prd: args.prd,
        architecture: args.architecture,
        epics: args.epics,
        uxDesign: args.uxDesign
      },
      instructions: [
        'Verify PRD requirements are fully covered by architecture',
        'Check all features have corresponding stories',
        'Validate architecture supports all non-functional requirements',
        'Ensure UX design is feasible with chosen technology stack',
        'Check for gaps between design and implementation plan',
        'Verify data model supports all required features',
        'Assess risk areas and mitigation strategies',
        'Validate development environment requirements are specified',
        'Check CI/CD pipeline is defined',
        'Provide GO/NO-GO recommendation with rationale'
      ],
      outputFormat: 'JSON with readiness assessment, gaps, risks, and recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'score', 'assessment'],
      properties: {
        ready: { type: 'boolean' },
        score: { type: 'number' },
        assessment: {
          type: 'object',
          properties: {
            prdCoverage: { type: 'number' },
            architectureCompleteness: { type: 'number' },
            storyCoverage: { type: 'number' },
            uxFeasibility: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'object' } },
        risks: { type: 'array', items: { type: 'object' } },
        recommendation: { type: 'string' },
        blockers: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/solutioning/readiness-check.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'solutioning', 'readiness', 'winston']
}));

// ============================================================================
// PHASE 4: IMPLEMENTATION TASKS
// ============================================================================

/**
 * Sprint planning - Agent: Bob (Scrum Master)
 */
export const bmadSprintPlanningTask = defineTask('bmad-sprint-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `BMAD Sprint ${args.sprintNumber} Planning: ${args.projectName}`,
  description: 'Bob (SM) plans sprint with story selection and goal definition',

  agent: {
    name: 'bmad-sm-bob',
    prompt: {
      role: 'Bob - Technical Scrum Master facilitating sprint planning with focus on clear goals and achievable commitments',
      task: 'Plan sprint by selecting stories, defining sprint goal, and creating execution plan',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        epics: args.epics,
        previousSprints: args.previousSprints,
        complexity: args.complexity
      },
      instructions: [
        'Review available stories from epic backlog',
        'Consider velocity from previous sprints if available',
        'Select stories that form a coherent sprint goal',
        'Ensure stories are implementation-ready with clear acceptance criteria',
        'Order stories by dependency and priority',
        'Define clear sprint goal statement',
        'Identify potential blockers and mitigation plans',
        'Balance feature work with technical debt',
        'Ensure workload is achievable within sprint timeframe'
      ],
      outputFormat: 'JSON with sprint goal, selected stories, and execution plan'
    },
    outputSchema: {
      type: 'object',
      required: ['sprintGoal', 'stories', 'storyCount'],
      properties: {
        sprintGoal: { type: 'string' },
        stories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              storyPoints: { type: 'number' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              tasks: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        storyCount: { type: 'number' },
        totalStoryPoints: { type: 'number' },
        blockers: { type: 'array', items: { type: 'string' } },
        executionOrder: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/bmad/implementation/sprint-${args.sprintNumber}/plan.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'implementation', 'sprint-planning', 'bob', `sprint-${args.sprintNumber}`]
}));

/**
 * Story development - Agent: Amelia (Developer)
 */
export const developStoryTask = defineTask('bmad-develop-story', (args, taskCtx) => ({
  kind: 'agent',
  title: `Develop Story ${args.storyIndex}/${args.totalStories}: ${args.story?.title || 'Story'}`,
  description: 'Amelia (Developer) implements story with TDD methodology',

  agent: {
    name: 'bmad-dev-amelia',
    prompt: {
      role: 'Amelia - Senior Software Engineer implementing stories with strict TDD methodology. Ultra-succinct, speaks in file paths and AC IDs.',
      task: 'Implement the assigned story following test-driven development',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        story: args.story,
        storyIndex: args.storyIndex,
        totalStories: args.totalStories
      },
      instructions: [
        'Read entire story before implementation',
        'Write failing tests first for each acceptance criterion',
        'Implement minimum code to pass tests',
        'Refactor while keeping tests green',
        'Execute tasks sequentially as written',
        'Run full test suite after each task',
        'Never proceed with failing tests',
        'Document all implementation decisions',
        'Update story file with completion status',
        'Ensure code meets Definition of Done'
      ],
      outputFormat: 'JSON with implementation results, test results, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['completed', 'testsWritten', 'testsPassed'],
      properties: {
        completed: { type: 'boolean' },
        storyId: { type: 'string' },
        testsWritten: { type: 'number' },
        testsPassed: { type: 'number' },
        filesChanged: { type: 'array', items: { type: 'string' } },
        implementationNotes: { type: 'string' },
        acceptanceCriteriaResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterionId: { type: 'string' },
              met: { type: 'boolean' },
              notes: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/bmad/implementation/sprint-${args.sprintNumber}/story-${args.storyIndex}.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'implementation', 'development', 'amelia', `sprint-${args.sprintNumber}`]
}));

/**
 * Code review - Agent: Amelia (Developer) cross-review
 */
export const bmadCodeReviewTask = defineTask('bmad-code-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Code Review Sprint ${args.sprintNumber}: ${args.projectName}`,
  description: 'Amelia (Developer) performs comprehensive code review across quality dimensions',

  agent: {
    name: 'bmad-dev-amelia',
    prompt: {
      role: 'Amelia - Senior Developer conducting comprehensive code review across correctness, security, performance, maintainability, and test coverage',
      task: 'Perform thorough code review of all sprint deliverables',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        storyResults: args.storyResults,
        complexity: args.complexity
      },
      instructions: [
        'Review correctness: logic errors, edge cases, error handling',
        'Review security: input validation, authentication, data protection',
        'Review performance: algorithmic efficiency, resource usage, caching',
        'Review maintainability: code clarity, naming, SOLID principles',
        'Review test coverage: missing tests, test quality, edge cases',
        'Check adherence to architecture decisions',
        'Verify acceptance criteria are properly tested',
        'Identify technical debt introduced',
        'Provide actionable improvement suggestions',
        'Rate overall code quality'
      ],
      outputFormat: 'JSON with review findings by category, overall rating, and action items'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRating', 'findings'],
      properties: {
        overallRating: { type: 'string' },
        score: { type: 'number' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' },
              suggestion: { type: 'string' },
              file: { type: 'string' }
            }
          }
        },
        categoryScores: {
          type: 'object',
          properties: {
            correctness: { type: 'number' },
            security: { type: 'number' },
            performance: { type: 'number' },
            maintainability: { type: 'number' },
            testCoverage: { type: 'number' }
          }
        },
        technicalDebt: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'object' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/bmad/implementation/sprint-${args.sprintNumber}/code-review.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'implementation', 'code-review', 'amelia', `sprint-${args.sprintNumber}`]
}));

/**
 * QA testing - Agent: Quinn (QA Engineer)
 */
export const qaTestingTask = defineTask('bmad-qa-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `QA Testing Sprint ${args.sprintNumber}: ${args.projectName}`,
  description: 'Quinn (QA) generates and runs API/E2E tests for sprint deliverables',

  agent: {
    name: 'bmad-qa-quinn',
    prompt: {
      role: 'Quinn - QA Engineer specializing in API and E2E test automation. Pragmatic, ship-it-and-iterate mentality. Focuses on rapid test coverage.',
      task: 'Generate and execute tests for sprint deliverables ensuring quality standards',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        storyResults: args.storyResults,
        codeReview: args.codeReview
      },
      instructions: [
        'Generate API tests for all new endpoints',
        'Create E2E tests for critical user flows',
        'Test edge cases identified in code review',
        'Validate all acceptance criteria through automated tests',
        'Run regression tests to verify no breakage',
        'Check tests pass on first run without external dependencies',
        'Generate coverage report',
        'Prioritize coverage of critical paths',
        'Document any manual testing needed',
        'Provide go/no-go quality recommendation'
      ],
      outputFormat: 'JSON with test results, coverage, and quality recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'testsPassed', 'qualityGate'],
      properties: {
        totalTests: { type: 'number' },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        coveragePercent: { type: 'number' },
        qualityGate: { type: 'string' },
        testCategories: {
          type: 'object',
          properties: {
            api: { type: 'object' },
            e2e: { type: 'object' },
            regression: { type: 'object' }
          }
        },
        failedTests: { type: 'array', items: { type: 'object' } },
        manualTestsNeeded: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/bmad/implementation/sprint-${args.sprintNumber}/qa-report.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'implementation', 'qa', 'quinn', `sprint-${args.sprintNumber}`]
}));

/**
 * Sprint retrospective - Agent: Bob (Scrum Master)
 */
export const bmadRetrospectiveTask = defineTask('bmad-retrospective', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sprint ${args.sprintNumber} Retrospective: ${args.projectName}`,
  description: 'Bob (SM) facilitates sprint retrospective for continuous improvement',

  agent: {
    name: 'bmad-sm-bob',
    prompt: {
      role: 'Bob - Scrum Master facilitating retrospective as servant-leader. Champions agile process improvement.',
      task: 'Facilitate sprint retrospective to identify improvements and celebrate successes',
      context: {
        projectName: args.projectName,
        sprintNumber: args.sprintNumber,
        sprintPlan: args.sprintPlan,
        storyResults: args.storyResults,
        codeReview: args.codeReview,
        qaResult: args.qaResult
      },
      instructions: [
        'Review sprint goal achievement',
        'Analyze what went well across all activities',
        'Identify what could be improved',
        'Review velocity and predictability',
        'Assess code quality trends from reviews',
        'Review QA results and testing effectiveness',
        'Create actionable improvement items with owners',
        'Celebrate team successes',
        'Plan implementation of improvements in next sprint',
        'Update team working agreements if needed'
      ],
      outputFormat: 'JSON with retrospective results, improvements, and action items'
    },
    outputSchema: {
      type: 'object',
      required: ['wentWell', 'toImprove', 'improvements'],
      properties: {
        wentWell: { type: 'array', items: { type: 'string' } },
        toImprove: { type: 'array', items: { type: 'string' } },
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              owner: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        sprintGoalAchieved: { type: 'boolean' },
        velocityActual: { type: 'number' },
        qualityScore: { type: 'number' },
        teamMorale: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/bmad/implementation/sprint-${args.sprintNumber}/retrospective.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'implementation', 'retrospective', 'bob', `sprint-${args.sprintNumber}`]
}));

/**
 * Project documentation - Agent: Paige (Tech Writer)
 */
export const generateProjectDocumentationTask = defineTask('bmad-project-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Documentation: ${args.projectName}`,
  description: 'Paige (Tech Writer) generates comprehensive project documentation',

  agent: {
    name: 'bmad-writer-paige',
    prompt: {
      role: 'Paige - Technical Documentation Specialist who transforms complex concepts into structured, understandable documentation. Every word serves a purpose.',
      task: 'Generate comprehensive project documentation from all lifecycle artifacts',
      context: {
        projectName: args.projectName,
        projectDescription: args.projectDescription,
        results: args.results,
        complexity: args.complexity
      },
      instructions: [
        'Create project overview document synthesizing all phases',
        'Generate technical documentation from architecture decisions',
        'Create API documentation from contracts',
        'Write developer onboarding guide',
        'Document deployment procedures',
        'Create user-facing documentation',
        'Include Mermaid diagrams for architecture visualization',
        'Follow CommonMark standards',
        'Ensure accessibility of documentation',
        'Create final project summary with metrics and outcomes'
      ],
      outputFormat: 'JSON with documentation artifacts and metadata'
    },
    outputSchema: {
      type: 'object',
      required: ['documents', 'summary'],
      properties: {
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        summary: { type: 'string' },
        totalDocuments: { type: 'number' },
        diagramsGenerated: { type: 'number' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/documentation/project-overview.md', format: 'markdown' },
      { path: 'artifacts/bmad/documentation/technical-docs.md', format: 'markdown' },
      { path: 'artifacts/bmad/final-summary.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'documentation', 'paige']
}));
