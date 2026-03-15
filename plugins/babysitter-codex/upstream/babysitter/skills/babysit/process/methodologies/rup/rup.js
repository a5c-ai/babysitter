/**
 * @process methodologies/rup
 * @description RUP (Rational Unified Process) - Iterative software development framework with four phases (Inception, Elaboration, Construction, Transition) and use-case driven, architecture-centric approach
 * @inputs { projectName: string, projectVision: string, iterationsPerPhase?: object, teamSize?: number, useCaseSource?: string, architectureStyle?: string }
 * @outputs { success: boolean, inceptionResult: object, elaborationResult: object, constructionResult: object, transitionResult: object, useCaseModel: object, architecture: object, artifacts: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * RUP (Rational Unified Process)
 *
 * Created by Rational Software (Grady Booch, Ivar Jacobson, James Rumbaugh) - 1990s
 *
 * The Rational Unified Process is an iterative software development framework that combines
 * phases with workflows. It emphasizes use-case driven development, architecture-centric design,
 * and risk-driven iteration planning across four sequential phases.
 *
 * Four Phases:
 * 1. Inception - Define project scope, identify risks, create business case, initial use-case model
 * 2. Elaboration - Detailed requirements, architecture baseline, risk mitigation, executable prototype
 * 3. Construction - Iterative development, incremental builds, beta releases, user documentation
 * 4. Transition - Beta testing, production deployment, user training, system tuning, warranty
 *
 * Six Core Workflows (across all phases):
 * 1. Business Modeling - Understand business context and requirements
 * 2. Requirements - Capture what system should do (use-case driven)
 * 3. Analysis & Design - Architecture and detailed design
 * 4. Implementation - Code the system
 * 5. Test - Verify implementation
 * 6. Deployment - Deliver to users
 *
 * Key Principles:
 * - Iterative development - Build incrementally through iterations
 * - Risk-driven - Address highest risks first
 * - Architecture-centric - Establish solid architecture early (Elaboration phase)
 * - Use-case driven - Use cases capture functional requirements
 * - Each phase ends with milestone review
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project/system
 * @param {string} inputs.projectVision - High-level vision and goals for the project
 * @param {Object} inputs.iterationsPerPhase - Number of iterations per phase (default: {inception: 1, elaboration: 2, construction: 4, transition: 1})
 * @param {number} inputs.teamSize - Development team size (default: 10)
 * @param {string} inputs.useCaseSource - Source for use cases (default: 'stakeholder-workshops')
 * @param {string} inputs.architectureStyle - Preferred architecture (default: 'layered')
 * @param {Array<Object>} inputs.predefinedUseCases - Pre-defined use cases (optional)
 * @param {Array<Object>} inputs.predefinedRisks - Pre-defined risks (optional)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with all phase outputs, artifacts, and metrics
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    projectVision,
    iterationsPerPhase = { inception: 1, elaboration: 2, construction: 4, transition: 1 },
    teamSize = 10,
    useCaseSource = 'stakeholder-workshops',
    architectureStyle = 'layered',
    predefinedUseCases = null,
    predefinedRisks = null
  } = inputs;

  // Validate required inputs
  if (!projectName || !projectVision) {
    throw new Error('projectName and projectVision are required');
  }

  // ============================================================================
  // PHASE 1: INCEPTION
  // Milestone: Lifecycle Objective Milestone (LCO)
  // ============================================================================

  const inceptionResult = await executePhase('Inception', iterationsPerPhase.inception, ctx, async (iteration) => {
    // Iteration-level tasks for Inception
    const iterationData = {
      phase: 'Inception',
      iteration,
      projectName,
      projectVision,
      predefinedUseCases,
      predefinedRisks,
      teamSize
    };

    // Vision Document
    const visionResult = await ctx.task(createVisionDocumentTask, {
      projectName,
      projectVision,
      iteration
    });

    // Business Case
    const businessCaseResult = await ctx.task(createBusinessCaseTask, {
      projectName,
      projectVision,
      visionDocument: visionResult,
      iteration
    });

    // Initial Use Case Model
    const useCaseModelResult = await ctx.task(createUseCaseModelTask, {
      projectName,
      visionDocument: visionResult,
      predefinedUseCases,
      useCaseSource,
      detailLevel: 'brief', // Brief descriptions in Inception
      iteration
    });

    // Risk Assessment
    const riskAssessmentResult = await ctx.task(assessRisksTask, {
      projectName,
      phase: 'Inception',
      visionDocument: visionResult,
      businessCase: businessCaseResult,
      useCaseModel: useCaseModelResult,
      predefinedRisks,
      iteration
    });

    // Initial Project Plan
    const projectPlanResult = await ctx.task(createProjectPlanTask, {
      projectName,
      phase: 'Inception',
      visionDocument: visionResult,
      businessCase: businessCaseResult,
      useCaseModel: useCaseModelResult,
      riskAssessment: riskAssessmentResult,
      teamSize,
      iterationsPerPhase,
      iteration
    });

    return {
      visionDocument: visionResult,
      businessCase: businessCaseResult,
      useCaseModel: useCaseModelResult,
      riskAssessment: riskAssessmentResult,
      projectPlan: projectPlanResult
    };
  });

  // Milestone: Lifecycle Objective (LCO) - Decision point
  await ctx.breakpoint({
    question: `Inception phase complete for "${projectName}". Vision document and business case established. ${inceptionResult.useCaseModel.totalUseCases} use cases identified. ${inceptionResult.riskAssessment.highRisks} high risks, ${inceptionResult.riskAssessment.mediumRisks} medium risks identified. Estimated ${inceptionResult.projectPlan.totalIterations} iterations across all phases. Project viable and worth continuing? (Lifecycle Objective Milestone)`,
    title: 'Phase Milestone: Inception Complete (LCO)',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/rup/phase-1-inception/vision-document.md', format: 'markdown', label: 'Vision Document' },
        { path: 'artifacts/rup/phase-1-inception/business-case.md', format: 'markdown', label: 'Business Case' },
        { path: 'artifacts/rup/phase-1-inception/use-case-model.md', format: 'markdown', label: 'Initial Use Case Model' },
        { path: 'artifacts/rup/phase-1-inception/risk-list.md', format: 'markdown', label: 'Risk List' },
        { path: 'artifacts/rup/phase-1-inception/project-plan.md', format: 'markdown', label: 'Initial Project Plan' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: ELABORATION
  // Milestone: Lifecycle Architecture Milestone (LCA)
  // ============================================================================

  const elaborationResult = await executePhase('Elaboration', iterationsPerPhase.elaboration, ctx, async (iteration) => {
    // Refine use case model to detailed level
    const detailedUseCasesResult = await ctx.task(refineUseCaseModelTask, {
      projectName,
      phase: 'Elaboration',
      initialUseCaseModel: inceptionResult.useCaseModel,
      detailLevel: 'detailed', // Full detail in Elaboration
      iteration
    });

    // Architecture Baseline
    const architectureResult = await ctx.task(defineArchitectureTask, {
      projectName,
      phase: 'Elaboration',
      visionDocument: inceptionResult.visionDocument,
      useCaseModel: detailedUseCasesResult,
      architectureStyle,
      iteration
    });

    // Build Executable Architecture Prototype
    const prototypeResult = await ctx.task(buildArchitecturePrototypeTask, {
      projectName,
      phase: 'Elaboration',
      architecture: architectureResult,
      useCaseModel: detailedUseCasesResult,
      riskAssessment: inceptionResult.riskAssessment,
      iteration
    });

    // Risk Mitigation (focus on high-risk items)
    const riskMitigationResult = await ctx.task(mitigateRisksTask, {
      projectName,
      phase: 'Elaboration',
      riskAssessment: inceptionResult.riskAssessment,
      architecture: architectureResult,
      prototype: prototypeResult,
      iteration
    });

    // Refined Project Plan for Construction
    const refinedPlanResult = await ctx.task(refineProjectPlanTask, {
      projectName,
      phase: 'Elaboration',
      initialPlan: inceptionResult.projectPlan,
      architecture: architectureResult,
      detailedUseCases: detailedUseCasesResult,
      riskMitigation: riskMitigationResult,
      iteration
    });

    return {
      detailedUseCases: detailedUseCasesResult,
      architecture: architectureResult,
      prototype: prototypeResult,
      riskMitigation: riskMitigationResult,
      refinedPlan: refinedPlanResult
    };
  });

  // Milestone: Lifecycle Architecture (LCA) - Decision point
  await ctx.breakpoint({
    question: `Elaboration phase complete. Architecture baseline established with ${elaborationResult.architecture.components.length} components using ${elaborationResult.architecture.architectureStyle} style. Executable prototype validated ${elaborationResult.prototype.validatedScenarios} scenarios. ${elaborationResult.riskMitigation.mitigatedRisks} risks mitigated. ${elaborationResult.detailedUseCases.totalDetailedUseCases} use cases fully detailed. Architecture stable enough for Construction phase? (Lifecycle Architecture Milestone)`,
    title: 'Phase Milestone: Elaboration Complete (LCA)',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/rup/phase-2-elaboration/detailed-use-cases.md', format: 'markdown', label: 'Detailed Use Case Model' },
        { path: 'artifacts/rup/phase-2-elaboration/architecture-baseline.md', format: 'markdown', label: 'Architecture Baseline' },
        { path: 'artifacts/rup/phase-2-elaboration/architecture-prototype.md', format: 'markdown', label: 'Executable Prototype' },
        { path: 'artifacts/rup/phase-2-elaboration/risk-mitigation.md', format: 'markdown', label: 'Risk Mitigation Report' },
        { path: 'artifacts/rup/phase-2-elaboration/refined-project-plan.md', format: 'markdown', label: 'Refined Project Plan' }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: CONSTRUCTION
  // Milestone: Initial Operational Capability (IOC)
  // ============================================================================

  const constructionResult = await executePhase('Construction', iterationsPerPhase.construction, ctx, async (iteration) => {
    // Plan iteration based on use cases and risks
    const iterationPlanResult = await ctx.task(planIterationTask, {
      projectName,
      phase: 'Construction',
      iteration,
      totalIterations: iterationsPerPhase.construction,
      useCaseModel: elaborationResult.detailedUseCases,
      architecture: elaborationResult.architecture,
      refinedPlan: elaborationResult.refinedPlan,
      previousIterations: iteration > 1 ? 'previous-iterations-data' : null
    });

    // Implement iteration (analysis, design, implementation, test)
    const implementationResult = await ctx.task(implementIterationTask, {
      projectName,
      phase: 'Construction',
      iteration,
      iterationPlan: iterationPlanResult,
      architecture: elaborationResult.architecture,
      useCaseModel: elaborationResult.detailedUseCases
    });

    // Integration testing for iteration
    const integrationResult = await ctx.task(integrateAndTestTask, {
      projectName,
      phase: 'Construction',
      iteration,
      implementation: implementationResult,
      architecture: elaborationResult.architecture,
      previousBuilds: iteration > 1 ? 'previous-builds' : null
    });

    // Generate user documentation
    const documentationResult = await ctx.task(generateUserDocumentationTask, {
      projectName,
      phase: 'Construction',
      iteration,
      implementation: implementationResult,
      useCaseModel: elaborationResult.detailedUseCases
    });

    // Iteration review
    const reviewResult = await ctx.task(reviewIterationTask, {
      projectName,
      phase: 'Construction',
      iteration,
      iterationPlan: iterationPlanResult,
      implementation: implementationResult,
      integration: integrationResult,
      documentation: documentationResult
    });

    return {
      iterationPlan: iterationPlanResult,
      implementation: implementationResult,
      integration: integrationResult,
      documentation: documentationResult,
      review: reviewResult
    };
  });

  // Milestone: Initial Operational Capability (IOC) - Decision point
  await ctx.breakpoint({
    question: `Construction phase complete. ${iterationsPerPhase.construction} iterations executed. ${constructionResult.implementations.length} incremental builds completed. ${constructionResult.totalFeaturesImplemented} features implemented across ${constructionResult.totalModules} modules. ${constructionResult.testsPassed}/${constructionResult.totalTests} tests passing. Beta release ready for deployment. System operational enough for beta release? (Initial Operational Capability Milestone)`,
    title: 'Phase Milestone: Construction Complete (IOC)',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/rup/phase-3-construction/final-build.md', format: 'markdown', label: 'Final Build Report' },
        { path: 'artifacts/rup/phase-3-construction/test-results.md', format: 'markdown', label: 'Test Results Summary' },
        { path: 'artifacts/rup/phase-3-construction/user-documentation.md', format: 'markdown', label: 'User Documentation' },
        { path: 'artifacts/rup/phase-3-construction/iteration-reviews.md', format: 'markdown', label: 'Iteration Reviews' }
      ]
    }
  });

  // ============================================================================
  // PHASE 4: TRANSITION
  // Milestone: Product Release (PR)
  // ============================================================================

  const transitionResult = await executePhase('Transition', iterationsPerPhase.transition, ctx, async (iteration) => {
    // Beta Testing
    const betaTestingResult = await ctx.task(conductBetaTestingTask, {
      projectName,
      phase: 'Transition',
      iteration,
      constructionBuild: constructionResult,
      useCaseModel: elaborationResult.detailedUseCases
    });

    // Address beta feedback and finalize
    const finalizationResult = await ctx.task(finalizeProductTask, {
      projectName,
      phase: 'Transition',
      iteration,
      betaTesting: betaTestingResult,
      constructionBuild: constructionResult
    });

    // Production Deployment
    const deploymentResult = await ctx.task(deployToProductionTask, {
      projectName,
      phase: 'Transition',
      iteration,
      finalizedProduct: finalizationResult,
      architecture: elaborationResult.architecture
    });

    // User Training
    const trainingResult = await ctx.task(conductUserTrainingTask, {
      projectName,
      phase: 'Transition',
      iteration,
      userDocumentation: constructionResult.documentation,
      deployment: deploymentResult
    });

    // System Tuning and Optimization
    const tuningResult = await ctx.task(tuneSystemTask, {
      projectName,
      phase: 'Transition',
      iteration,
      deployment: deploymentResult,
      betaFeedback: betaTestingResult
    });

    // Warranty and Post-Deployment Support Setup
    const warrantyResult = await ctx.task(setupWarrantySupportTask, {
      projectName,
      phase: 'Transition',
      iteration,
      deployment: deploymentResult,
      training: trainingResult,
      tuning: tuningResult
    });

    return {
      betaTesting: betaTestingResult,
      finalization: finalizationResult,
      deployment: deploymentResult,
      training: trainingResult,
      tuning: tuningResult,
      warranty: warrantyResult
    };
  });

  // Milestone: Product Release (PR) - Final milestone
  await ctx.breakpoint({
    question: `Transition phase complete for "${projectName}". Beta testing with ${transitionResult.betaTesting.betaUsers} users completed. ${transitionResult.betaTesting.defectsFixed} defects fixed. Production deployment successful. ${transitionResult.training.usersTrained} users trained. System tuned and optimized. Warranty support established. Product ready for full release? (Product Release Milestone)`,
    title: 'Phase Milestone: Transition Complete (PR) - Product Release',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/rup/phase-4-transition/beta-test-report.md', format: 'markdown', label: 'Beta Test Report' },
        { path: 'artifacts/rup/phase-4-transition/deployment-report.md', format: 'markdown', label: 'Production Deployment' },
        { path: 'artifacts/rup/phase-4-transition/training-report.md', format: 'markdown', label: 'User Training Report' },
        { path: 'artifacts/rup/phase-4-transition/system-tuning.md', format: 'markdown', label: 'System Tuning Report' },
        { path: 'artifacts/rup/phase-4-transition/warranty-plan.md', format: 'markdown', label: 'Warranty Support Plan' }
      ]
    }
  });

  // ============================================================================
  // PROJECT COMPLETION AND METRICS
  // ============================================================================

  const projectMetrics = calculateProjectMetrics(
    inceptionResult,
    elaborationResult,
    constructionResult,
    transitionResult,
    iterationsPerPhase
  );

  // Final project closure breakpoint
  await ctx.breakpoint({
    question: `RUP process complete for "${projectName}". All four phases (Inception, Elaboration, Construction, Transition) completed successfully. Total ${projectMetrics.totalIterations} iterations executed. ${projectMetrics.totalUseCases} use cases implemented. ${projectMetrics.totalModules} modules developed with ${projectMetrics.testPassRate} test pass rate. Product released to production. Review final project summary and lessons learned?`,
    title: 'RUP Process Complete - Project Closure',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/rup/project-summary.md', format: 'markdown', label: 'Project Summary' },
        { path: 'artifacts/rup/project-metrics.json', format: 'code', language: 'json', label: 'Project Metrics' },
        { path: 'artifacts/rup/lessons-learned.md', format: 'markdown', label: 'Lessons Learned' },
        { path: 'artifacts/rup/final-documentation-index.md', format: 'markdown', label: 'Documentation Index' }
      ]
    }
  });

  return {
    success: true,
    projectName,
    projectVision,
    phases: {
      inception: inceptionResult,
      elaboration: elaborationResult,
      construction: constructionResult,
      transition: transitionResult
    },
    useCaseModel: elaborationResult.detailedUseCases,
    architecture: elaborationResult.architecture,
    projectMetrics,
    summary: {
      phasesCompleted: 4,
      totalIterations: projectMetrics.totalIterations,
      totalUseCases: projectMetrics.totalUseCases,
      architectureComponents: elaborationResult.architecture.components.length,
      modulesImplemented: projectMetrics.totalModules,
      linesOfCode: projectMetrics.totalLinesOfCode,
      testPassRate: projectMetrics.testPassRate,
      betaUsersInvolved: transitionResult.betaTesting.betaUsers,
      productionDeploymentStatus: transitionResult.deployment.status,
      usersTrained: transitionResult.training.usersTrained
    },
    artifacts: {
      inception: 'artifacts/rup/phase-1-inception/',
      elaboration: 'artifacts/rup/phase-2-elaboration/',
      construction: 'artifacts/rup/phase-3-construction/',
      transition: 'artifacts/rup/phase-4-transition/',
      projectSummary: 'artifacts/rup/project-summary.md',
      lessonsLearned: 'artifacts/rup/lessons-learned.md'
    },
    metadata: {
      processId: 'methodologies/rup',
      methodology: 'RUP (Rational Unified Process)',
      creators: 'Grady Booch, Ivar Jacobson, James Rumbaugh',
      year: '1990s',
      framework: 'Rational Software',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// HELPER FUNCTION: EXECUTE PHASE WITH ITERATIONS
// ============================================================================

/**
 * Execute a phase with multiple iterations
 * @param {string} phaseName - Name of the phase
 * @param {number} iterationCount - Number of iterations in this phase
 * @param {Object} ctx - Process context
 * @param {Function} iterationFunction - Function to execute for each iteration
 * @returns {Promise<Object>} Aggregated results from all iterations
 */
async function executePhase(phaseName, iterationCount, ctx, iterationFunction) {
  const iterations = [];

  for (let i = 1; i <= iterationCount; i++) {
    const iterationResult = await iterationFunction(i);
    iterations.push({
      iteration: i,
      ...iterationResult
    });
  }

  // Aggregate results (phase-specific logic would go here)
  const lastIteration = iterations[iterations.length - 1];

  return {
    ...lastIteration,
    iterations,
    totalIterations: iterationCount
  };
}

// ============================================================================
// TASK DEFINITIONS - ALL INLINE
// ============================================================================

/**
 * INCEPTION PHASE TASKS
 */

/**
 * Create Vision Document
 * Define the project vision, scope, and key stakeholders
 */
export const createVisionDocumentTask = defineTask('create-vision-document', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Vision Document: ${args.projectName}`,
  description: 'Define project vision, scope, stakeholders, and success criteria',

  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'experienced business analyst and requirements specialist',
      task: 'Create comprehensive Vision Document for the project',
      context: {
        projectName: args.projectName,
        projectVision: args.projectVision,
        iteration: args.iteration
      },
      instructions: [
        'Document the product vision and positioning statement',
        'Identify all stakeholders and their concerns',
        'Define product features and benefits at high level',
        'Establish scope boundaries (in-scope and out-of-scope)',
        'Define success criteria and business objectives',
        'Identify constraints (technical, organizational, budgetary)',
        'Document assumptions about the project',
        'Define key quality attributes expected',
        'Create stakeholder needs summary',
        'Establish problem statement and solution overview'
      ],
      outputFormat: 'JSON with vision statement, stakeholders, scope, features, constraints'
    },
    outputSchema: {
      type: 'object',
      required: ['visionStatement', 'stakeholders', 'scope', 'features', 'successCriteria'],
      properties: {
        visionStatement: { type: 'string' },
        positioningStatement: { type: 'string' },
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              concerns: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        scope: {
          type: 'object',
          properties: {
            inScope: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } }
          }
        },
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        successCriteria: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        qualityAttributes: { type: 'array', items: { type: 'string' } },
        problemStatement: { type: 'string' },
        solutionOverview: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/rup/phase-1-inception/vision-document.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'inception', 'vision-document']
}));

/**
 * Create Business Case
 * Economic justification for the project
 */
export const createBusinessCaseTask = defineTask('create-business-case', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Business Case: ${args.projectName}`,
  description: 'Develop economic justification and ROI analysis for the project',

  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'experienced business analyst specializing in ROI and cost-benefit analysis',
      task: 'Create comprehensive Business Case with financial justification',
      context: {
        projectName: args.projectName,
        projectVision: args.projectVision,
        visionDocument: args.visionDocument,
        iteration: args.iteration
      },
      instructions: [
        'Estimate development costs (labor, tools, infrastructure)',
        'Estimate operational costs (maintenance, support, hosting)',
        'Estimate benefits (revenue increase, cost savings, efficiency gains)',
        'Calculate ROI (Return on Investment)',
        'Calculate NPV (Net Present Value)',
        'Calculate payback period',
        'Identify financial risks and opportunities',
        'Justify investment based on business value',
        'Create alternative solution analysis (build vs buy vs nothing)',
        'Document market opportunity and competitive advantage'
      ],
      outputFormat: 'JSON with costs, benefits, ROI, NPV, payback period, justification'
    },
    outputSchema: {
      type: 'object',
      required: ['developmentCosts', 'operationalCosts', 'benefits', 'roi', 'paybackPeriod', 'justification'],
      properties: {
        developmentCosts: {
          type: 'object',
          properties: {
            labor: { type: 'number' },
            tools: { type: 'number' },
            infrastructure: { type: 'number' },
            total: { type: 'number' }
          }
        },
        operationalCosts: {
          type: 'object',
          properties: {
            annualMaintenance: { type: 'number' },
            annualSupport: { type: 'number' },
            annualHosting: { type: 'number' },
            totalAnnual: { type: 'number' }
          }
        },
        benefits: {
          type: 'object',
          properties: {
            revenueIncrease: { type: 'number' },
            costSavings: { type: 'number' },
            efficiencyGains: { type: 'number' },
            totalAnnual: { type: 'number' }
          }
        },
        roi: { type: 'number' },
        npv: { type: 'number' },
        paybackPeriod: { type: 'string' },
        financialRisks: { type: 'array', items: { type: 'string' } },
        marketOpportunity: { type: 'string' },
        competitiveAdvantage: { type: 'string' },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              option: { type: 'string' },
              cost: { type: 'number' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        justification: { type: 'string' },
        recommendation: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/rup/phase-1-inception/business-case.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'inception', 'business-case']
}));

/**
 * Create Use Case Model
 * Use-case driven development - capture functional requirements
 */
export const createUseCaseModelTask = defineTask('create-use-case-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Use Case Model: ${args.projectName}`,
  description: 'Identify actors and use cases for use-case driven development',

  agent: {
    name: 'use-case-analyst',
    prompt: {
      role: 'experienced use-case analyst and requirements engineer',
      task: 'Create comprehensive Use Case Model with actors and use cases',
      context: {
        projectName: args.projectName,
        visionDocument: args.visionDocument,
        predefinedUseCases: args.predefinedUseCases,
        useCaseSource: args.useCaseSource,
        detailLevel: args.detailLevel, // 'brief' or 'detailed'
        iteration: args.iteration
      },
      instructions: [
        'Identify all actors (users, external systems, time)',
        'Identify all use cases from vision and stakeholder needs',
        'For each use case: name, brief description, actor(s), preconditions, postconditions',
        'If detailLevel=brief: provide brief descriptions only (Inception phase)',
        'If detailLevel=detailed: provide full use case specifications (Elaboration phase)',
        'Prioritize use cases by business value and risk',
        'Identify relationships between use cases (includes, extends, generalizes)',
        'Create use case diagram showing actors and use cases',
        'Map use cases to features from vision document',
        'Identify critical use cases that drive architecture'
      ],
      outputFormat: 'JSON with actors, use cases, relationships, priorities'
    },
    outputSchema: {
      type: 'object',
      required: ['actors', 'useCases', 'totalUseCases'],
      properties: {
        actors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['primary', 'secondary', 'system', 'time'] },
              description: { type: 'string' }
            }
          }
        },
        useCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              briefDescription: { type: 'string' },
              actors: { type: 'array', items: { type: 'string' } },
              preconditions: { type: 'array', items: { type: 'string' } },
              postconditions: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              architectureSignificant: { type: 'boolean' },
              complexity: { type: 'string', enum: ['simple', 'average', 'complex'] }
            }
          }
        },
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['includes', 'extends', 'generalizes'] },
              fromUseCaseId: { type: 'string' },
              toUseCaseId: { type: 'string' }
            }
          }
        },
        useCaseDiagram: { type: 'string' },
        totalUseCases: { type: 'number' },
        criticalUseCases: { type: 'number' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/rup/phase-1-inception/use-case-model.md', format: 'markdown' },
      { path: 'artifacts/rup/phase-1-inception/use-case-diagram.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'inception', 'use-case-model']
}));

/**
 * Assess Risks
 * Risk-driven iteration planning
 */
export const assessRisksTask = defineTask('assess-risks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Risk Assessment: ${args.projectName} - ${args.phase}`,
  description: 'Identify and assess project risks for risk-driven planning',

  agent: {
    name: 'risk-manager',
    prompt: {
      role: 'experienced project risk manager',
      task: 'Identify, assess, and prioritize project risks',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        visionDocument: args.visionDocument,
        businessCase: args.businessCase,
        useCaseModel: args.useCaseModel,
        predefinedRisks: args.predefinedRisks,
        iteration: args.iteration
      },
      instructions: [
        'Identify technical risks (architecture, technology, complexity)',
        'Identify schedule risks (estimates, dependencies, resource availability)',
        'Identify business risks (market changes, competition, funding)',
        'Identify organizational risks (skills, politics, process maturity)',
        'Assess each risk: probability (high/medium/low) and impact (high/medium/low)',
        'Calculate risk exposure (probability × impact)',
        'Prioritize risks by exposure',
        'Propose mitigation strategies for high-priority risks',
        'Identify triggers and warning signs for each risk',
        'Document contingency plans'
      ],
      outputFormat: 'JSON with risks, assessments, priorities, mitigation strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'highRisks', 'mediumRisks', 'lowRisks'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              category: { type: 'string', enum: ['technical', 'schedule', 'business', 'organizational'] },
              description: { type: 'string' },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              exposure: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              mitigationStrategy: { type: 'string' },
              contingencyPlan: { type: 'string' },
              triggers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        highRisks: { type: 'number' },
        mediumRisks: { type: 'number' },
        lowRisks: { type: 'number' },
        topRisks: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/rup/phase-${args.phase.toLowerCase()}/risk-list.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', args.phase.toLowerCase(), 'risk-assessment']
}));

/**
 * Create Project Plan
 * Initial planning for phases and iterations
 */
export const createProjectPlanTask = defineTask('create-project-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Project Plan: ${args.projectName}`,
  description: 'Plan phases, iterations, resources, and schedule',

  agent: {
    name: 'project-manager',
    prompt: {
      role: 'experienced RUP project manager',
      task: 'Create comprehensive project plan with phases and iterations',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        visionDocument: args.visionDocument,
        businessCase: args.businessCase,
        useCaseModel: args.useCaseModel,
        riskAssessment: args.riskAssessment,
        teamSize: args.teamSize,
        iterationsPerPhase: args.iterationsPerPhase,
        iteration: args.iteration
      },
      instructions: [
        'Plan all four phases: Inception, Elaboration, Construction, Transition',
        'Define iterations within each phase based on iterationsPerPhase config',
        'Estimate duration for each phase and iteration',
        'Allocate use cases to iterations (risk-driven)',
        'Assign resources and roles to iterations',
        'Define iteration objectives and success criteria',
        'Create project schedule with milestones',
        'Identify dependencies between iterations',
        'Plan for architecture-centric iterations in Elaboration',
        'Plan for risk mitigation activities'
      ],
      outputFormat: 'JSON with phases, iterations, schedule, resources, milestones'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'totalIterations', 'estimatedDuration', 'milestones'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phaseName: { type: 'string', enum: ['Inception', 'Elaboration', 'Construction', 'Transition'] },
              iterations: { type: 'number' },
              estimatedWeeks: { type: 'number' },
              objectives: { type: 'array', items: { type: 'string' } },
              milestone: { type: 'string' }
            }
          }
        },
        iterations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              iterationNumber: { type: 'number' },
              objectives: { type: 'array', items: { type: 'string' } },
              useCaseIds: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } },
              estimatedWeeks: { type: 'number' }
            }
          }
        },
        totalIterations: { type: 'number' },
        estimatedDuration: { type: 'string' },
        resources: {
          type: 'object',
          properties: {
            teamSize: { type: 'number' },
            roles: { type: 'array', items: { type: 'string' } }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              phase: { type: 'string' },
              date: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } }
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
      { path: 'artifacts/rup/phase-1-inception/project-plan.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'inception', 'project-plan']
}));

/**
 * ELABORATION PHASE TASKS
 */

/**
 * Refine Use Case Model to Detailed Level
 */
export const refineUseCaseModelTask = defineTask('refine-use-case-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine Use Case Model: ${args.projectName} - ${args.phase}`,
  description: 'Elaborate use cases to full detail with scenarios',

  agent: {
    name: 'use-case-analyst',
    prompt: {
      role: 'experienced use-case analyst',
      task: 'Refine use cases to detailed specifications with full scenarios',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        initialUseCaseModel: args.initialUseCaseModel,
        detailLevel: args.detailLevel,
        iteration: args.iteration
      },
      instructions: [
        'Elaborate each use case from brief to detailed specification',
        'For each use case: full description, main flow, alternate flows, exception flows',
        'Define detailed preconditions and postconditions',
        'Add special requirements (non-functional) per use case',
        'Create use case realizations showing interactions',
        'Identify all scenarios within each use case',
        'Add data requirements and business rules',
        'Create sequence diagrams for complex use cases',
        'Ensure all actors interactions are captured',
        'Trace use cases to system requirements'
      ],
      outputFormat: 'JSON with detailed use cases, flows, scenarios, realizations'
    },
    outputSchema: {
      type: 'object',
      required: ['detailedUseCases', 'totalDetailedUseCases'],
      properties: {
        detailedUseCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              fullDescription: { type: 'string' },
              actors: { type: 'array', items: { type: 'string' } },
              preconditions: { type: 'array', items: { type: 'string' } },
              postconditions: { type: 'array', items: { type: 'string' } },
              mainFlow: { type: 'array', items: { type: 'string' } },
              alternateFlows: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    steps: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              exceptionFlows: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    exception: { type: 'string' },
                    handling: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              specialRequirements: { type: 'array', items: { type: 'string' } },
              businessRules: { type: 'array', items: { type: 'string' } },
              scenarios: { type: 'number' }
            }
          }
        },
        totalDetailedUseCases: { type: 'number' },
        totalScenarios: { type: 'number' },
        sequenceDiagrams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              useCaseId: { type: 'string' },
              diagram: { type: 'string' }
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
      { path: 'artifacts/rup/phase-2-elaboration/detailed-use-cases.md', format: 'markdown' },
      { path: 'artifacts/rup/phase-2-elaboration/use-case-realizations.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'elaboration', 'use-case-refinement']
}));

/**
 * Define Architecture Baseline
 * Architecture-centric development
 */
export const defineArchitectureTask = defineTask('define-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Architecture: ${args.projectName} - ${args.phase}`,
  description: 'Create architecture baseline with components and patterns',

  agent: {
    name: 'software-architect',
    prompt: {
      role: 'experienced software architect',
      task: 'Define comprehensive architecture baseline for the system',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        visionDocument: args.visionDocument,
        useCaseModel: args.useCaseModel,
        architectureStyle: args.architectureStyle,
        iteration: args.iteration
      },
      instructions: [
        'Define architectural style (layered, microservices, event-driven, etc.)',
        'Identify major architectural components and their responsibilities',
        'Define component interfaces and interactions',
        'Create architectural views: logical, process, deployment, implementation',
        'Define design patterns to be used',
        'Address architecturally significant use cases',
        'Define technology stack and frameworks',
        'Design for quality attributes (performance, security, scalability)',
        'Create deployment architecture',
        'Document architectural decisions and rationale'
      ],
      outputFormat: 'JSON with architecture style, components, views, patterns, technology stack'
    },
    outputSchema: {
      type: 'object',
      required: ['architectureStyle', 'components', 'views', 'technologyStack'],
      properties: {
        architectureStyle: { type: 'string' },
        architectureDescription: { type: 'string' },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              interfaces: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        views: {
          type: 'object',
          properties: {
            logicalView: { type: 'string' },
            processView: { type: 'string' },
            deploymentView: { type: 'string' },
            implementationView: { type: 'string' }
          }
        },
        designPatterns: { type: 'array', items: { type: 'string' } },
        technologyStack: {
          type: 'object',
          properties: {
            frontend: { type: 'array', items: { type: 'string' } },
            backend: { type: 'array', items: { type: 'string' } },
            database: { type: 'array', items: { type: 'string' } },
            infrastructure: { type: 'array', items: { type: 'string' } }
          }
        },
        qualityAttributes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              attribute: { type: 'string' },
              approach: { type: 'string' }
            }
          }
        },
        architecturalDecisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } }
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
      { path: 'artifacts/rup/phase-2-elaboration/architecture-baseline.md', format: 'markdown' },
      { path: 'artifacts/rup/phase-2-elaboration/architecture-views.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'elaboration', 'architecture']
}));

/**
 * Build Architecture Prototype
 * Executable architecture to validate design
 */
export const buildArchitecturePrototypeTask = defineTask('build-architecture-prototype', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Architecture Prototype: ${args.projectName}`,
  description: 'Create executable architecture prototype to validate design',

  agent: {
    name: 'prototype-developer',
    prompt: {
      role: 'experienced developer building architecture prototypes',
      task: 'Build executable architecture prototype addressing key scenarios',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        architecture: args.architecture,
        useCaseModel: args.useCaseModel,
        riskAssessment: args.riskAssessment,
        iteration: args.iteration
      },
      instructions: [
        'Implement skeleton architecture with all major components',
        'Focus on architecturally significant use cases',
        'Validate component interfaces and interactions',
        'Test critical technical risks through prototype',
        'Implement key design patterns',
        'Validate performance and scalability assumptions',
        'Test integration with external systems',
        'Demonstrate end-to-end scenarios',
        'Document findings and architecture adjustments needed',
        'Ensure prototype is evolutionary (not throwaway)'
      ],
      outputFormat: 'JSON with prototype description, validated scenarios, findings'
    },
    outputSchema: {
      type: 'object',
      required: ['prototypeDescription', 'validatedScenarios', 'findings'],
      properties: {
        prototypeDescription: { type: 'string' },
        componentsImplemented: { type: 'array', items: { type: 'string' } },
        validatedScenarios: { type: 'number' },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              useCaseId: { type: 'string' },
              scenario: { type: 'string' },
              result: { type: 'string', enum: ['validated', 'issues-found', 'failed'] },
              notes: { type: 'string' }
            }
          }
        },
        risksAddressed: { type: 'array', items: { type: 'string' } },
        performanceResults: {
          type: 'object',
          properties: {
            responseTime: { type: 'string' },
            throughput: { type: 'string' },
            meetsRequirements: { type: 'boolean' }
          }
        },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              impact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        architectureAdjustments: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/rup/phase-2-elaboration/architecture-prototype.md', format: 'markdown' },
      { path: 'artifacts/rup/phase-2-elaboration/prototype-validation.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'elaboration', 'prototype']
}));

/**
 * Mitigate Risks
 */
export const mitigateRisksTask = defineTask('mitigate-risks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mitigate Risks: ${args.projectName} - ${args.phase}`,
  description: 'Execute risk mitigation strategies for high-priority risks',

  agent: {
    name: 'risk-manager',
    prompt: {
      role: 'experienced risk manager',
      task: 'Execute mitigation strategies and track risk resolution',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        riskAssessment: args.riskAssessment,
        architecture: args.architecture,
        prototype: args.prototype,
        iteration: args.iteration
      },
      instructions: [
        'Review high-priority risks from risk assessment',
        'Execute mitigation strategies for each high risk',
        'Use architecture and prototype results to address technical risks',
        'Track risk status changes (open → mitigated → closed)',
        'Identify any new risks discovered during phase',
        'Document mitigation actions taken and results',
        'Re-assess risk probability and impact after mitigation',
        'Update risk list with current status',
        'Plan ongoing risk monitoring',
        'Report residual risks that remain'
      ],
      outputFormat: 'JSON with mitigated risks, actions taken, new risks, residual risks'
    },
    outputSchema: {
      type: 'object',
      required: ['mitigatedRisks', 'riskStatus', 'residualRisks'],
      properties: {
        mitigatedRisks: { type: 'number' },
        mitigationActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              action: { type: 'string' },
              result: { type: 'string' },
              newStatus: { type: 'string', enum: ['mitigated', 'closed', 'monitoring'] }
            }
          }
        },
        riskStatus: {
          type: 'object',
          properties: {
            closed: { type: 'number' },
            mitigated: { type: 'number' },
            monitoring: { type: 'number' },
            open: { type: 'number' }
          }
        },
        newRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              exposure: { type: 'string' }
            }
          }
        },
        residualRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              description: { type: 'string' },
              residualExposure: { type: 'string' },
              monitoringPlan: { type: 'string' }
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
      { path: `artifacts/rup/phase-${args.phase === 'Elaboration' ? '2-elaboration' : 'current'}/risk-mitigation.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', args.phase.toLowerCase(), 'risk-mitigation']
}));

/**
 * Refine Project Plan
 */
export const refineProjectPlanTask = defineTask('refine-project-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refine Project Plan: ${args.projectName}`,
  description: 'Update project plan based on architecture and detailed use cases',

  agent: {
    name: 'project-manager',
    prompt: {
      role: 'experienced RUP project manager',
      task: 'Refine project plan with detailed estimates and iteration assignments',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        initialPlan: args.initialPlan,
        architecture: args.architecture,
        detailedUseCases: args.detailedUseCases,
        riskMitigation: args.riskMitigation,
        iteration: args.iteration
      },
      instructions: [
        'Update iteration plans based on architecture and detailed use cases',
        'Refine estimates for Construction phase iterations',
        'Assign use cases to specific Construction iterations',
        'Plan for incremental builds and releases',
        'Update resource allocation based on architecture',
        'Adjust schedule based on risk mitigation results',
        'Plan testing strategy per iteration',
        'Define iteration acceptance criteria',
        'Update milestones and checkpoints',
        'Create detailed plan for Construction phase'
      ],
      outputFormat: 'JSON with refined iterations, estimates, assignments'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedIterations', 'constructionPlan', 'updatedEstimates'],
      properties: {
        refinedIterations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              iterationNumber: { type: 'number' },
              objectives: { type: 'array', items: { type: 'string' } },
              useCaseIds: { type: 'array', items: { type: 'string' } },
              estimatedWeeks: { type: 'number' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        constructionPlan: {
          type: 'object',
          properties: {
            totalIterations: { type: 'number' },
            incrementalBuilds: { type: 'number' },
            betaReleases: { type: 'number' },
            testingStrategy: { type: 'string' }
          }
        },
        updatedEstimates: {
          type: 'object',
          properties: {
            totalWeeks: { type: 'number' },
            constructionWeeks: { type: 'number' },
            transitionWeeks: { type: 'number' }
          }
        },
        resourcePlan: {
          type: 'object',
          properties: {
            developers: { type: 'number' },
            testers: { type: 'number' },
            architects: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/rup/phase-2-elaboration/refined-project-plan.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'elaboration', 'project-planning']
}));

/**
 * CONSTRUCTION PHASE TASKS
 */

/**
 * Plan Iteration
 */
export const planIterationTask = defineTask('plan-iteration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan Iteration ${args.iteration}: ${args.projectName}`,
  description: 'Plan work for this Construction iteration',

  agent: {
    name: 'iteration-manager',
    prompt: {
      role: 'experienced iteration manager',
      task: 'Plan iteration work including use cases, tasks, and goals',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        iteration: args.iteration,
        totalIterations: args.totalIterations,
        useCaseModel: args.useCaseModel,
        architecture: args.architecture,
        refinedPlan: args.refinedPlan,
        previousIterations: args.previousIterations
      },
      instructions: [
        'Select use cases for this iteration from refined plan',
        'Define iteration goals and objectives',
        'Break down use cases into implementation tasks',
        'Estimate effort for each task',
        'Assign tasks to team members',
        'Identify dependencies and risks for this iteration',
        'Plan testing activities for iteration',
        'Define iteration acceptance criteria',
        'Plan integration activities',
        'Set up iteration tracking'
      ],
      outputFormat: 'JSON with iteration goals, use cases, tasks, assignments'
    },
    outputSchema: {
      type: 'object',
      required: ['iterationGoals', 'selectedUseCases', 'tasks'],
      properties: {
        iterationGoals: { type: 'array', items: { type: 'string' } },
        selectedUseCases: { type: 'array', items: { type: 'string' } },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              useCaseId: { type: 'string' },
              type: { type: 'string', enum: ['analysis', 'design', 'implementation', 'test'] },
              estimatedHours: { type: 'number' },
              assignedTo: { type: 'string' }
            }
          }
        },
        dependencies: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        acceptanceCriteria: { type: 'array', items: { type: 'string' } },
        estimatedDuration: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/rup/phase-3-construction/iteration-${args.iteration}/plan.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'construction', `iteration-${args.iteration}`, 'planning']
}));

/**
 * Implement Iteration
 */
export const implementIterationTask = defineTask('implement-iteration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Iteration ${args.iteration}: ${args.projectName}`,
  description: 'Execute iteration: analysis, design, implementation, unit testing',

  agent: {
    name: 'development-team',
    prompt: {
      role: 'development team executing iteration work',
      task: 'Implement iteration following RUP workflows: analysis, design, implementation, test',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        iteration: args.iteration,
        iterationPlan: args.iterationPlan,
        architecture: args.architecture,
        useCaseModel: args.useCaseModel
      },
      instructions: [
        'Analysis: Refine use case realizations for selected use cases',
        'Design: Create detailed design for components and classes',
        'Implementation: Write code following design and architecture',
        'Test: Write and execute unit tests for all code',
        'Follow coding standards and design patterns',
        'Ensure code meets architecture guidelines',
        'Document complex logic and APIs',
        'Conduct code reviews',
        'Track progress against iteration plan',
        'Report any impediments or risks'
      ],
      outputFormat: 'JSON with implementation results, modules, tests, metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['implementedUseCases', 'modules', 'unitTests'],
      properties: {
        implementedUseCases: { type: 'array', items: { type: 'string' } },
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              component: { type: 'string' },
              linesOfCode: { type: 'number' },
              complexity: { type: 'string' }
            }
          }
        },
        unitTests: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            passed: { type: 'number' },
            coverage: { type: 'number' }
          }
        },
        codeReviews: {
          type: 'object',
          properties: {
            completed: { type: 'number' },
            issues: { type: 'number' },
            resolved: { type: 'number' }
          }
        },
        tasksCompleted: { type: 'number' },
        tasksRemaining: { type: 'number' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/rup/phase-3-construction/iteration-${args.iteration}/implementation-report.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'construction', `iteration-${args.iteration}`, 'implementation']
}));

/**
 * Integrate and Test
 */
export const integrateAndTestTask = defineTask('integrate-and-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration Testing - Iteration ${args.iteration}: ${args.projectName}`,
  description: 'Integrate iteration build and execute integration tests',

  agent: {
    name: 'integration-team',
    prompt: {
      role: 'integration and testing team',
      task: 'Integrate iteration build with previous builds and execute tests',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        iteration: args.iteration,
        implementation: args.implementation,
        architecture: args.architecture,
        previousBuilds: args.previousBuilds
      },
      instructions: [
        'Integrate new modules with existing system',
        'Execute integration tests between components',
        'Execute system-level tests for implemented use cases',
        'Run regression tests on previous functionality',
        'Test non-functional requirements (performance, security)',
        'Log defects found during testing',
        'Track test coverage',
        'Verify iteration acceptance criteria',
        'Create incremental build artifact',
        'Document integration issues and resolutions'
      ],
      outputFormat: 'JSON with integration results, test results, defects, build info'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationTests', 'systemTests', 'defects', 'buildInfo'],
      properties: {
        integrationTests: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' }
          }
        },
        systemTests: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' }
          }
        },
        regressionTests: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' }
          }
        },
        defects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        buildInfo: {
          type: 'object',
          properties: {
            buildNumber: { type: 'string' },
            buildStatus: { type: 'string', enum: ['successful', 'successful-with-issues', 'failed'] },
            buildArtifact: { type: 'string' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/rup/phase-3-construction/iteration-${args.iteration}/integration-test-report.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'construction', `iteration-${args.iteration}`, 'testing']
}));

/**
 * Generate User Documentation
 */
export const generateUserDocumentationTask = defineTask('generate-user-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `User Documentation - Iteration ${args.iteration}: ${args.projectName}`,
  description: 'Create user documentation for implemented features',

  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer and documentation specialist',
      task: 'Create comprehensive user documentation for implemented features',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        iteration: args.iteration,
        implementation: args.implementation,
        useCaseModel: args.useCaseModel
      },
      instructions: [
        'Document user guides for implemented use cases',
        'Create step-by-step tutorials for key workflows',
        'Write feature descriptions and benefits',
        'Include screenshots and examples',
        'Document API reference if applicable',
        'Create troubleshooting guides',
        'Write release notes for iteration',
        'Ensure documentation matches implementation',
        'Use clear, user-friendly language',
        'Organize documentation logically'
      ],
      outputFormat: 'JSON with documentation sections, guides, release notes'
    },
    outputSchema: {
      type: 'object',
      required: ['userGuides', 'releaseNotes'],
      properties: {
        userGuides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              useCaseId: { type: 'string' },
              sections: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        tutorials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        apiDocumentation: {
          type: 'object',
          properties: {
            endpoints: { type: 'number' },
            documented: { type: 'boolean' }
          }
        },
        releaseNotes: {
          type: 'object',
          properties: {
            newFeatures: { type: 'array', items: { type: 'string' } },
            improvements: { type: 'array', items: { type: 'string' } },
            knownIssues: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/rup/phase-3-construction/iteration-${args.iteration}/user-documentation.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'construction', `iteration-${args.iteration}`, 'documentation']
}));

/**
 * Review Iteration
 */
export const reviewIterationTask = defineTask('review-iteration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Iteration Review ${args.iteration}: ${args.projectName}`,
  description: 'Review iteration results against plan and acceptance criteria',

  agent: {
    name: 'iteration-reviewer',
    prompt: {
      role: 'project manager and team reviewing iteration results',
      task: 'Review iteration outcomes and identify improvements',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        iteration: args.iteration,
        iterationPlan: args.iterationPlan,
        implementation: args.implementation,
        integration: args.integration,
        documentation: args.documentation
      },
      instructions: [
        'Compare actual results vs iteration plan',
        'Verify acceptance criteria were met',
        'Review test results and defect status',
        'Assess code quality and technical debt',
        'Review documentation completeness',
        'Identify what went well',
        'Identify what could be improved',
        'Document lessons learned',
        'Update velocity/metrics',
        'Plan adjustments for next iteration'
      ],
      outputFormat: 'JSON with review results, assessment, lessons learned'
    },
    outputSchema: {
      type: 'object',
      required: ['acceptanceCriteriaMet', 'accomplishments', 'improvements'],
      properties: {
        acceptanceCriteriaMet: { type: 'boolean' },
        planVsActual: {
          type: 'object',
          properties: {
            plannedUseCases: { type: 'number' },
            completedUseCases: { type: 'number' },
            plannedTasks: { type: 'number' },
            completedTasks: { type: 'number' }
          }
        },
        accomplishments: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        velocity: {
          type: 'object',
          properties: {
            useCasesPerIteration: { type: 'number' },
            defectRate: { type: 'number' }
          }
        },
        nextIterationRecommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/rup/phase-3-construction/iteration-${args.iteration}/review.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'construction', `iteration-${args.iteration}`, 'review']
}));

/**
 * TRANSITION PHASE TASKS
 */

/**
 * Conduct Beta Testing
 */
export const conductBetaTestingTask = defineTask('conduct-beta-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Beta Testing: ${args.projectName}`,
  description: 'Execute beta testing with real users in real environment',

  agent: {
    name: 'beta-coordinator',
    prompt: {
      role: 'beta testing coordinator',
      task: 'Coordinate beta testing with users and collect feedback',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        iteration: args.iteration,
        constructionBuild: args.constructionBuild,
        useCaseModel: args.useCaseModel
      },
      instructions: [
        'Deploy beta release to beta environment',
        'Recruit and onboard beta users',
        'Provide beta users with documentation and support',
        'Define beta testing scenarios and goals',
        'Collect user feedback systematically',
        'Track issues and defects reported by beta users',
        'Monitor system performance in beta environment',
        'Conduct user surveys and interviews',
        'Analyze feedback and prioritize issues',
        'Report beta testing results'
      ],
      outputFormat: 'JSON with beta users, feedback, defects, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['betaUsers', 'feedback', 'defects'],
      properties: {
        betaUsers: { type: 'number' },
        betaDuration: { type: 'string' },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              usersParticipated: { type: 'number' },
              successRate: { type: 'number' }
            }
          }
        },
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              feedback: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        defects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string', enum: ['open', 'fixed', 'deferred'] }
            }
          }
        },
        defectsFixed: { type: 'number' },
        userSatisfaction: {
          type: 'object',
          properties: {
            averageRating: { type: 'number' },
            wouldRecommend: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/rup/phase-4-transition/beta-test-report.md', format: 'markdown' },
      { path: 'artifacts/rup/phase-4-transition/beta-feedback.json', format: 'json' }
    ]
  },

  labels: ['agent', 'rup', 'transition', 'beta-testing']
}));

/**
 * Finalize Product
 */
export const finalizeProductTask = defineTask('finalize-product', (args, taskCtx) => ({
  kind: 'agent',
  title: `Finalize Product: ${args.projectName}`,
  description: 'Address beta feedback and finalize product for production',

  agent: {
    name: 'finalization-team',
    prompt: {
      role: 'development and QA team finalizing product',
      task: 'Address beta feedback and prepare final production release',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        iteration: args.iteration,
        betaTesting: args.betaTesting,
        constructionBuild: args.constructionBuild
      },
      instructions: [
        'Fix critical and high-priority defects from beta',
        'Address important user feedback',
        'Polish user interface and user experience',
        'Finalize documentation based on beta feedback',
        'Complete any remaining use cases',
        'Execute final regression testing',
        'Optimize performance',
        'Conduct final security review',
        'Create final release candidate',
        'Get sign-off from stakeholders'
      ],
      outputFormat: 'JSON with fixes applied, final tests, release candidate info'
    },
    outputSchema: {
      type: 'object',
      required: ['defectsFixed', 'finalTests', 'releaseCandidateReady'],
      properties: {
        defectsFixed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              defectId: { type: 'string' },
              fix: { type: 'string' },
              verified: { type: 'boolean' }
            }
          }
        },
        feedbackAddressed: { type: 'array', items: { type: 'string' } },
        finalTests: {
          type: 'object',
          properties: {
            regressionTests: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' }
          }
        },
        performanceOptimizations: { type: 'array', items: { type: 'string' } },
        securityReview: {
          type: 'object',
          properties: {
            completed: { type: 'boolean' },
            issues: { type: 'number' },
            resolved: { type: 'number' }
          }
        },
        releaseCandidateReady: { type: 'boolean' },
        releaseVersion: { type: 'string' },
        stakeholderSignoff: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/rup/phase-4-transition/finalization-report.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'transition', 'finalization']
}));

/**
 * Deploy to Production
 */
export const deployToProductionTask = defineTask('deploy-to-production', (args, taskCtx) => ({
  kind: 'agent',
  title: `Production Deployment: ${args.projectName}`,
  description: 'Deploy finalized product to production environment',

  agent: {
    name: 'deployment-team',
    prompt: {
      role: 'DevOps and deployment team',
      task: 'Execute production deployment with verification',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        iteration: args.iteration,
        finalizedProduct: args.finalizedProduct,
        architecture: args.architecture
      },
      instructions: [
        'Prepare production environment per architecture',
        'Execute deployment plan step-by-step',
        'Deploy application to production',
        'Execute database migrations if needed',
        'Configure production settings',
        'Set up monitoring and alerting',
        'Execute smoke tests post-deployment',
        'Verify all critical functionality',
        'Create rollback plan',
        'Document deployment process and configuration'
      ],
      outputFormat: 'JSON with deployment steps, verification, status'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentSteps', 'verificationTests', 'status'],
      properties: {
        deploymentSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              status: { type: 'string', enum: ['completed', 'failed', 'skipped'] },
              timestamp: { type: 'string' }
            }
          }
        },
        verificationTests: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            dashboardUrl: { type: 'string' },
            alertsConfigured: { type: 'number' }
          }
        },
        status: { type: 'string', enum: ['deployed', 'failed', 'rolled-back'] },
        productionUrl: { type: 'string' },
        rollbackPlan: {
          type: 'object',
          properties: {
            available: { type: 'boolean' },
            steps: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/rup/phase-4-transition/deployment-report.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'transition', 'deployment']
}));

/**
 * Conduct User Training
 */
export const conductUserTrainingTask = defineTask('conduct-user-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `User Training: ${args.projectName}`,
  description: 'Train users on the new system',

  agent: {
    name: 'training-coordinator',
    prompt: {
      role: 'training coordinator and instructor',
      task: 'Conduct comprehensive user training',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        iteration: args.iteration,
        userDocumentation: args.userDocumentation,
        deployment: args.deployment
      },
      instructions: [
        'Prepare training materials and curriculum',
        'Schedule training sessions for different user groups',
        'Conduct training sessions (hands-on, demos, Q&A)',
        'Provide training documentation and quick reference guides',
        'Set up help desk and support channels',
        'Train support staff on common issues',
        'Collect feedback from training sessions',
        'Track training completion and certification',
        'Create video tutorials and online resources',
        'Provide ongoing training support'
      ],
      outputFormat: 'JSON with training sessions, users trained, materials, feedback'
    },
    outputSchema: {
      type: 'object',
      required: ['trainingSessions', 'usersTrained', 'trainingMaterials'],
      properties: {
        trainingSessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userGroup: { type: 'string' },
              attendees: { type: 'number' },
              duration: { type: 'string' },
              topics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        usersTrained: { type: 'number' },
        certifiedUsers: { type: 'number' },
        trainingMaterials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['slides', 'handouts', 'videos', 'quick-reference', 'online-course'] },
              title: { type: 'string' }
            }
          }
        },
        supportSetup: {
          type: 'object',
          properties: {
            helpDeskAvailable: { type: 'boolean' },
            supportStaffTrained: { type: 'number' },
            supportChannels: { type: 'array', items: { type: 'string' } }
          }
        },
        trainingFeedback: {
          type: 'object',
          properties: {
            averageRating: { type: 'number' },
            completionRate: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/rup/phase-4-transition/training-report.md', format: 'markdown' },
      { path: 'artifacts/rup/phase-4-transition/training-materials.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'transition', 'training']
}));

/**
 * Tune System
 */
export const tuneSystemTask = defineTask('tune-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Tuning: ${args.projectName}`,
  description: 'Optimize system performance and configuration in production',

  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'performance engineer and system administrator',
      task: 'Tune and optimize system based on production metrics',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        iteration: args.iteration,
        deployment: args.deployment,
        betaFeedback: args.betaFeedback
      },
      instructions: [
        'Monitor system performance in production',
        'Analyze performance metrics and bottlenecks',
        'Optimize database queries and indexes',
        'Tune application server configuration',
        'Optimize caching strategies',
        'Adjust resource allocation (CPU, memory, network)',
        'Fine-tune load balancing',
        'Optimize security settings without impacting performance',
        'Address any production issues',
        'Document tuning changes and results'
      ],
      outputFormat: 'JSON with tuning activities, performance improvements, issues resolved'
    },
    outputSchema: {
      type: 'object',
      required: ['tuningActivities', 'performanceImprovements'],
      properties: {
        tuningActivities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              change: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        performanceImprovements: {
          type: 'object',
          properties: {
            responseTimeImprovement: { type: 'string' },
            throughputImprovement: { type: 'string' },
            resourceUtilizationImprovement: { type: 'string' }
          }
        },
        issuesResolved: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        productionMetrics: {
          type: 'object',
          properties: {
            averageResponseTime: { type: 'string' },
            throughput: { type: 'string' },
            uptime: { type: 'string' },
            errorRate: { type: 'string' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/rup/phase-4-transition/system-tuning.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'transition', 'system-tuning']
}));

/**
 * Setup Warranty Support
 */
export const setupWarrantySupportTask = defineTask('setup-warranty-support', (args, taskCtx) => ({
  kind: 'agent',
  title: `Warranty Support Setup: ${args.projectName}`,
  description: 'Establish warranty period support and maintenance plan',

  agent: {
    name: 'support-manager',
    prompt: {
      role: 'support manager and maintenance planner',
      task: 'Set up warranty support procedures and ongoing maintenance',
      context: {
        projectName: args.projectName,
        phase: args.phase,
        iteration: args.iteration,
        deployment: args.deployment,
        training: args.training,
        tuning: args.tuning
      },
      instructions: [
        'Define warranty period and scope',
        'Establish support procedures and SLAs',
        'Set up issue tracking and escalation',
        'Define bug fix and patch process',
        'Create maintenance schedule',
        'Transition system to operations team',
        'Document operational procedures',
        'Plan for future enhancements',
        'Establish feedback collection mechanisms',
        'Create warranty support report'
      ],
      outputFormat: 'JSON with warranty plan, support procedures, transition plan'
    },
    outputSchema: {
      type: 'object',
      required: ['warrantyPeriod', 'supportProcedures', 'maintenancePlan'],
      properties: {
        warrantyPeriod: {
          type: 'object',
          properties: {
            duration: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            scope: { type: 'array', items: { type: 'string' } }
          }
        },
        supportProcedures: {
          type: 'object',
          properties: {
            sla: {
              type: 'object',
              properties: {
                responseTime: { type: 'string' },
                resolutionTime: { type: 'string' }
              }
            },
            supportChannels: { type: 'array', items: { type: 'string' } },
            escalationPath: { type: 'array', items: { type: 'string' } }
          }
        },
        maintenancePlan: {
          type: 'object',
          properties: {
            regularMaintenance: { type: 'string' },
            patchSchedule: { type: 'string' },
            monitoringSchedule: { type: 'string' }
          }
        },
        transitionToOperations: {
          type: 'object',
          properties: {
            transitioned: { type: 'boolean' },
            operationsTeam: { type: 'string' },
            handoverComplete: { type: 'boolean' }
          }
        },
        futureEnhancements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              enhancement: { type: 'string' },
              priority: { type: 'string' }
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
      { path: 'artifacts/rup/phase-4-transition/warranty-plan.md', format: 'markdown' },
      { path: 'artifacts/rup/phase-4-transition/support-procedures.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'rup', 'transition', 'warranty-support']
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate comprehensive project metrics across all phases
 */
function calculateProjectMetrics(inception, elaboration, construction, transition, iterationsPerPhase) {
  const totalIterations =
    iterationsPerPhase.inception +
    iterationsPerPhase.elaboration +
    iterationsPerPhase.construction +
    iterationsPerPhase.transition;

  // Aggregate Construction phase results
  const implementations = construction.iterations || [];
  const totalModules = implementations.reduce((sum, iter) =>
    sum + (iter.implementation?.modules?.length || 0), 0);
  const totalLinesOfCode = implementations.reduce((sum, iter) =>
    sum + iter.implementation?.modules?.reduce((lsum, m) => lsum + (m.linesOfCode || 0), 0) || 0, 0);
  const totalTests = implementations.reduce((sum, iter) =>
    sum + (iter.integration?.integrationTests?.total || 0) + (iter.integration?.systemTests?.total || 0), 0);
  const testsPassed = implementations.reduce((sum, iter) =>
    sum + (iter.integration?.integrationTests?.passed || 0) + (iter.integration?.systemTests?.passed || 0), 0);

  const testPassRate = totalTests > 0 ? ((testsPassed / totalTests) * 100).toFixed(1) + '%' : '100%';

  return {
    totalIterations,
    phases: {
      inception: {
        iterations: iterationsPerPhase.inception,
        useCasesIdentified: inception.useCaseModel.totalUseCases,
        risksIdentified: inception.riskAssessment.highRisks + inception.riskAssessment.mediumRisks + inception.riskAssessment.lowRisks,
        businessCaseROI: inception.businessCase.roi
      },
      elaboration: {
        iterations: iterationsPerPhase.elaboration,
        architectureComponents: elaboration.architecture.components.length,
        detailedUseCases: elaboration.detailedUseCases.totalDetailedUseCases,
        risksMitigated: elaboration.riskMitigation.mitigatedRisks,
        prototypeScenariosValidated: elaboration.prototype.validatedScenarios
      },
      construction: {
        iterations: iterationsPerPhase.construction,
        modulesImplemented: totalModules,
        linesOfCode: totalLinesOfCode,
        totalTests,
        testsPassed
      },
      transition: {
        iterations: iterationsPerPhase.transition,
        betaUsers: transition.betaTesting.betaUsers,
        defectsFixed: transition.betaTesting.defectsFixed,
        usersTrained: transition.training.usersTrained,
        deploymentStatus: transition.deployment.status
      }
    },
    overall: {
      totalUseCases: elaboration.detailedUseCases.totalDetailedUseCases,
      totalModules,
      totalLinesOfCode,
      testPassRate,
      totalImplementations: implementations.length,
      totalFeaturesImplemented: implementations.reduce((sum, iter) =>
        sum + (iter.implementation?.implementedUseCases?.length || 0), 0),
      productionReady: transition.deployment.status === 'deployed'
    }
  };
}
