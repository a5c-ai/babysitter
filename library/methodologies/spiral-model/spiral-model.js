/**
 * @process methodologies/spiral-model
 * @description Spiral Model - Risk-driven iterative development with four phases per spiral: Planning, Risk Analysis, Engineering, Evaluation
 * @inputs { projectName: string, projectDescription: string, maxSpirals: number, convergenceCriteria: string, stakeholders?: array, riskTolerance?: string }
 * @outputs { success: boolean, spirals: array, risks: object, prototypes: array, deliverables: object, spiralDiagram: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Spiral Model Process
 *
 * Created by Barry Boehm (1986)
 *
 * The Spiral Model is a risk-driven software development process model where development
 * progresses through multiple spirals (iterations), each containing four phases:
 * 1. Planning - Determine objectives, alternatives, constraints
 * 2. Risk Analysis - Identify and resolve risks, build prototypes
 * 3. Engineering - Develop and test the product
 * 4. Evaluation - Customer evaluation, plan next iteration
 *
 * Key Characteristics:
 * - Risk-driven approach with risk analysis in each iteration
 * - Iterative spirals that progressively elaborate the system
 * - Prototype-heavy to resolve high-risk areas early
 * - Flexible - can incorporate waterfall, incremental, evolutionary approaches
 * - Well-suited for: large complex projects, high-risk projects, unclear requirements
 * - Each spiral increases cumulative cost (radius) and angular progress (phase)
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project/system
 * @param {string} inputs.projectDescription - High-level description and goals
 * @param {number} inputs.maxSpirals - Maximum number of spirals (default: 6)
 * @param {string} inputs.convergenceCriteria - When to stop spiraling (default: all-risks-resolved)
 * @param {Array<Object>} inputs.stakeholders - Project stakeholders (optional)
 * @param {string} inputs.riskTolerance - Risk tolerance level: low, medium, high (default: medium)
 * @param {string} inputs.initialRisks - Known risks at project start (optional)
 * @param {boolean} inputs.generateVisualizations - Generate spiral diagram and risk heatmaps (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with all spirals, risks, prototypes, deliverables
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    projectDescription,
    maxSpirals = 6,
    convergenceCriteria = 'all-risks-resolved',
    stakeholders = [],
    riskTolerance = 'medium',
    initialRisks = null,
    generateVisualizations = true
  } = inputs;

  // Validate required inputs
  if (!projectName || !projectDescription) {
    throw new Error('projectName and projectDescription are required');
  }

  // ============================================================================
  // SPIRAL INITIALIZATION
  // ============================================================================

  const spiralResults = [];
  let cumulativeCost = 0;
  let unresolvedRisks = [];
  let prototypes = [];
  let currentSystem = null;
  let converged = false;

  // Initial breakpoint
  await ctx.breakpoint({
    question: `Begin Spiral Model development for "${projectName}". This risk-driven iterative approach will progress through multiple spirals, each containing Planning, Risk Analysis, Engineering, and Evaluation phases. Maximum ${maxSpirals} spirals planned. Convergence criteria: ${convergenceCriteria}. Risk tolerance: ${riskTolerance}. Proceed with Spiral 1?`,
    title: 'Spiral Model - Project Initialization',
    context: {
      runId: ctx.runId,
      files: []
    }
  });

  // ============================================================================
  // SPIRAL ITERATIONS
  // ============================================================================

  for (let spiralIdx = 0; spiralIdx < maxSpirals && !converged; spiralIdx++) {
    const spiralNumber = spiralIdx + 1;
    const spiralStartCost = cumulativeCost;

    ctx.log(`\n${'='.repeat(80)}`);
    ctx.log(`SPIRAL ${spiralNumber} - Beginning risk-driven iteration`);
    ctx.log(`${'='.repeat(80)}\n`);

    // ==========================================================================
    // PHASE 1: PLANNING
    // ==========================================================================

    const planningResult = await ctx.task(planningPhaseTask, {
      projectName,
      projectDescription,
      spiralNumber,
      previousSpirals: spiralResults,
      currentSystem,
      unresolvedRisks,
      stakeholders,
      convergenceCriteria
    });

    // Planning Phase Gate
    await ctx.breakpoint({
      question: `Spiral ${spiralNumber} Planning complete. Objectives: ${planningResult.objectives.length} defined. Alternatives: ${planningResult.alternatives.length} identified. Constraints: ${planningResult.constraints.length} documented. Estimated cost: $${planningResult.costEstimate.total}. Proceed to Risk Analysis phase?`,
      title: `Spiral ${spiralNumber} - Planning Phase Gate`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/phase-1-planning/objectives.md`, format: 'markdown', label: 'Objectives' },
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/phase-1-planning/alternatives.md`, format: 'markdown', label: 'Alternatives' },
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/phase-1-planning/constraints.json`, format: 'code', language: 'json', label: 'Constraints' }
        ]
      }
    });

    // ==========================================================================
    // PHASE 2: RISK ANALYSIS
    // ==========================================================================

    const riskAnalysisResult = await ctx.task(riskAnalysisTask, {
      projectName,
      spiralNumber,
      objectives: planningResult.objectives,
      alternatives: planningResult.alternatives,
      constraints: planningResult.constraints,
      previousRisks: unresolvedRisks,
      riskTolerance,
      prototypes: prototypes
    });

    // Update unresolved risks
    unresolvedRisks = riskAnalysisResult.unresolvedRisks;

    // Risk Analysis Phase Gate with Go/No-Go decision
    const criticalRisks = riskAnalysisResult.risks.filter(r => r.severity === 'critical' && r.status === 'unresolved');
    const highRisks = riskAnalysisResult.risks.filter(r => r.severity === 'high' && r.status === 'unresolved');

    await ctx.breakpoint({
      question: `Spiral ${spiralNumber} Risk Analysis complete. Identified ${riskAnalysisResult.risks.length} risks: ${criticalRisks.length} critical, ${highRisks.length} high. ${riskAnalysisResult.prototypes.length} prototypes planned for risk mitigation. ${riskAnalysisResult.mitigationStrategies.length} mitigation strategies defined. Go/No-Go decision: ${riskAnalysisResult.goNoGoDecision === 'go' ? 'GO - Proceed to Engineering' : 'NO-GO - Review required'}. Continue?`,
      title: `Spiral ${spiralNumber} - Risk Analysis Gate (Go/No-Go)`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/phase-2-risk-analysis/risk-register.json`, format: 'code', language: 'json', label: 'Risk Register' },
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/phase-2-risk-analysis/prototypes.md`, format: 'markdown', label: 'Prototype Plans' },
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/phase-2-risk-analysis/mitigation-strategies.md`, format: 'markdown', label: 'Mitigation Strategies' },
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/phase-2-risk-analysis/go-no-go-analysis.md`, format: 'markdown', label: 'Go/No-Go Analysis' }
        ]
      }
    });

    // If No-Go decision, terminate or re-plan
    if (riskAnalysisResult.goNoGoDecision === 'no-go') {
      ctx.log(`Spiral ${spiralNumber}: NO-GO decision made. Project terminated or requires re-planning.`);
      break;
    }

    // Add new prototypes to collection
    prototypes.push(...riskAnalysisResult.prototypes);

    // ==========================================================================
    // PHASE 3: ENGINEERING
    // ==========================================================================

    const engineeringResult = await ctx.task(engineeringPhaseTask, {
      projectName,
      spiralNumber,
      objectives: planningResult.objectives,
      selectedAlternative: planningResult.selectedAlternative,
      mitigationStrategies: riskAnalysisResult.mitigationStrategies,
      prototypes: riskAnalysisResult.prototypes,
      currentSystem,
      previousSpirals: spiralResults
    });

    // Update current system state
    currentSystem = engineeringResult.systemState;

    // Engineering Phase Gate
    await ctx.breakpoint({
      question: `Spiral ${spiralNumber} Engineering complete. ${engineeringResult.components.length} components developed. ${engineeringResult.tests.total} tests executed (${engineeringResult.tests.passed} passed). Prototype deliverables: ${engineeringResult.prototypeDeliverables.length}. Integration: ${engineeringResult.integrationStatus}. Proceed to Evaluation phase?`,
      title: `Spiral ${spiralNumber} - Engineering Phase Gate`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/phase-3-engineering/deliverables.md`, format: 'markdown', label: 'Deliverables' },
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/phase-3-engineering/components.json`, format: 'code', language: 'json', label: 'Components' },
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/phase-3-engineering/test-results.md`, format: 'markdown', label: 'Test Results' },
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/phase-3-engineering/prototypes.md`, format: 'markdown', label: 'Prototypes' }
        ]
      }
    });

    // ==========================================================================
    // PHASE 4: EVALUATION
    // ==========================================================================

    const evaluationResult = await ctx.task(evaluationPhaseTask, {
      projectName,
      spiralNumber,
      objectives: planningResult.objectives,
      engineeringDeliverables: engineeringResult,
      risks: riskAnalysisResult.risks,
      prototypes: riskAnalysisResult.prototypes,
      stakeholders,
      currentSystem,
      maxSpirals,
      convergenceCriteria
    });

    // Update cumulative cost
    cumulativeCost += planningResult.costEstimate.total;

    // Store spiral result
    const spiralData = {
      spiralNumber,
      startCost: spiralStartCost,
      endCost: cumulativeCost,
      costIncurred: planningResult.costEstimate.total,
      phase1Planning: planningResult,
      phase2RiskAnalysis: riskAnalysisResult,
      phase3Engineering: engineeringResult,
      phase4Evaluation: evaluationResult,
      unresolvedRisksAtEnd: unresolvedRisks.length,
      converged: evaluationResult.convergenceAssessment.converged
    };

    spiralResults.push(spiralData);

    // Evaluation Phase Gate
    await ctx.breakpoint({
      question: `Spiral ${spiralNumber} Evaluation complete. Customer satisfaction: ${evaluationResult.customerSatisfaction}/10. Stakeholder feedback: ${evaluationResult.stakeholderFeedback.length} items. Risk resolution: ${evaluationResult.risksResolved}/${riskAnalysisResult.risks.length} resolved. Convergence: ${evaluationResult.convergenceAssessment.converged ? 'YES - Ready to conclude' : 'NO - Continue spiraling'}. ${evaluationResult.convergenceAssessment.converged ? 'Project complete?' : `Plan next spiral (${spiralNumber + 1})?`}`,
      title: `Spiral ${spiralNumber} - Evaluation Gate & Convergence Check`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/phase-4-evaluation/evaluation-report.md`, format: 'markdown', label: 'Evaluation Report' },
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/phase-4-evaluation/stakeholder-feedback.json`, format: 'code', language: 'json', label: 'Stakeholder Feedback' },
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/phase-4-evaluation/convergence-assessment.md`, format: 'markdown', label: 'Convergence Assessment' },
          { path: `artifacts/spiral-model/spiral-${spiralNumber}/spiral-summary.json`, format: 'code', language: 'json', label: 'Spiral Summary' }
        ]
      }
    });

    // Check for convergence
    converged = evaluationResult.convergenceAssessment.converged;

    if (converged) {
      ctx.log(`\nSpiral ${spiralNumber}: CONVERGENCE ACHIEVED - Project objectives met, risks resolved.`);
      break;
    } else {
      ctx.log(`\nSpiral ${spiralNumber}: Convergence not yet achieved. Planning next spiral...\n`);
    }
  }

  // ============================================================================
  // SPIRAL TRACKING & VISUALIZATION
  // ============================================================================

  let spiralVisualization = null;
  if (generateVisualizations) {
    spiralVisualization = await ctx.task(spiralTrackingTask, {
      projectName,
      spirals: spiralResults,
      cumulativeCost,
      prototypes,
      unresolvedRisks
    });
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  const finalMetrics = calculateFinalMetrics(spiralResults, cumulativeCost, prototypes);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Spiral Model complete for "${projectName}". ${spiralResults.length} spirals executed. ${converged ? 'Convergence achieved successfully.' : 'Maximum spirals reached.'} Total cost: $${cumulativeCost}. ${prototypes.length} prototypes built. ${finalMetrics.totalRisksIdentified} risks identified, ${finalMetrics.risksResolved} resolved. Final system delivered with ${finalMetrics.totalComponents} components. Review final documentation?`,
    title: 'Spiral Model Complete - Final Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/spiral-model/project-summary.md', format: 'markdown', label: 'Project Summary' },
        { path: 'artifacts/spiral-model/spiral-diagram.svg', format: 'image', label: 'Spiral Diagram' },
        { path: 'artifacts/spiral-model/risk-heatmap.svg', format: 'image', label: 'Risk Heatmap' },
        { path: 'artifacts/spiral-model/final-metrics.json', format: 'code', language: 'json', label: 'Final Metrics' },
        { path: 'artifacts/spiral-model/final-deliverable.md', format: 'markdown', label: 'Final Deliverable' }
      ]
    }
  });

  return {
    success: true,
    projectName,
    projectDescription,
    spirals: spiralResults,
    spiralCount: spiralResults.length,
    converged,
    convergenceCriteria,
    risks: {
      totalIdentified: finalMetrics.totalRisksIdentified,
      resolved: finalMetrics.risksResolved,
      unresolved: unresolvedRisks.length,
      unresolvedList: unresolvedRisks
    },
    prototypes: {
      total: prototypes.length,
      list: prototypes
    },
    deliverables: {
      finalSystem: currentSystem,
      components: finalMetrics.totalComponents,
      testsPassed: finalMetrics.totalTestsPassed,
      integrationComplete: finalMetrics.integrationComplete
    },
    cost: {
      total: cumulativeCost,
      breakdown: spiralResults.map(s => ({
        spiral: s.spiralNumber,
        cost: s.costIncurred
      }))
    },
    spiralDiagram: spiralVisualization,
    metrics: finalMetrics,
    artifacts: {
      spirals: spiralResults.map(s => `artifacts/spiral-model/spiral-${s.spiralNumber}/`),
      summary: 'artifacts/spiral-model/project-summary.md',
      diagram: 'artifacts/spiral-model/spiral-diagram.svg',
      riskHeatmap: 'artifacts/spiral-model/risk-heatmap.svg'
    },
    metadata: {
      processId: 'methodologies/spiral-model',
      methodology: 'Spiral Model',
      creator: 'Barry Boehm',
      year: 1986,
      riskTolerance,
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS - ALL INLINE
// ============================================================================

/**
 * Phase 1: Planning
 * Determine objectives, alternatives, and constraints for this spiral
 */
export const planningPhaseTask = defineTask('planning-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: `Planning Phase: Spiral ${args.spiralNumber}`,
  description: 'Define objectives, identify alternatives, and document constraints',

  agent: {
    name: 'project-planner',
    prompt: {
      role: 'experienced project planner and systems architect',
      task: 'Plan spiral iteration: define objectives, alternatives, and constraints',
      context: {
        projectName: args.projectName,
        projectDescription: args.projectDescription,
        spiralNumber: args.spiralNumber,
        previousSpirals: args.previousSpirals,
        currentSystem: args.currentSystem,
        unresolvedRisks: args.unresolvedRisks,
        stakeholders: args.stakeholders,
        convergenceCriteria: args.convergenceCriteria
      },
      instructions: [
        'Define specific objectives for this spiral iteration',
        'Consider what needs to be achieved in this cycle',
        'Build on previous spirals if this is not Spiral 1',
        'Identify alternative approaches to achieve objectives',
        'For each alternative: describe approach, pros, cons, cost, risk level',
        'Select the most appropriate alternative based on risk and value',
        'Document all constraints: technical, budget, schedule, resource, regulatory',
        'Estimate resources needed: team size, skills, duration, budget',
        'Provide detailed cost estimate broken down by activity',
        'Identify dependencies on previous work or external systems',
        'Create detailed plan document for this spiral iteration',
        'Ensure objectives align with overall project goals and convergence criteria'
      ],
      outputFormat: 'JSON with objectives, alternatives, selected alternative, constraints, resource estimates'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'alternatives', 'selectedAlternative', 'constraints', 'costEstimate'],
      properties: {
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              successCriteria: { type: 'array', items: { type: 'string' } },
              alignsWithGoal: { type: 'string' }
            }
          }
        },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              approach: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              estimatedCost: { type: 'number' },
              riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              timeEstimate: { type: 'string' }
            }
          }
        },
        selectedAlternative: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['technical', 'budget', 'schedule', 'resource', 'regulatory', 'business'] },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        resourceEstimate: {
          type: 'object',
          properties: {
            teamSize: { type: 'number' },
            skills: { type: 'array', items: { type: 'string' } },
            durationWeeks: { type: 'number' },
            tools: { type: 'array', items: { type: 'string' } }
          }
        },
        costEstimate: {
          type: 'object',
          properties: {
            planning: { type: 'number' },
            riskAnalysis: { type: 'number' },
            engineering: { type: 'number' },
            evaluation: { type: 'number' },
            total: { type: 'number' }
          }
        },
        dependencies: { type: 'array', items: { type: 'string' } },
        planDocument: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-1-planning/objectives.md`, format: 'markdown' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-1-planning/alternatives.md`, format: 'markdown' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-1-planning/constraints.json`, format: 'json' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-1-planning/cost-estimate.json`, format: 'json' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-1-planning/plan-document.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'spiral-model', 'planning', `spiral-${args.spiralNumber}`]
}));

/**
 * Phase 2: Risk Analysis
 * Identify and resolve risks, build prototypes for high-risk areas
 */
export const riskAnalysisTask = defineTask('risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Risk Analysis: Spiral ${args.spiralNumber}`,
  description: 'Identify risks, assess severity, plan prototypes, develop mitigation strategies',

  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'experienced risk analyst and technical architect',
      task: 'Conduct comprehensive risk analysis and plan risk mitigation',
      context: {
        projectName: args.projectName,
        spiralNumber: args.spiralNumber,
        objectives: args.objectives,
        alternatives: args.alternatives,
        constraints: args.constraints,
        previousRisks: args.previousRisks,
        riskTolerance: args.riskTolerance,
        prototypes: args.prototypes
      },
      instructions: [
        'Identify all potential risks for this spiral iteration',
        'Categorize risks: technical, schedule, budget, quality, security, integration, performance',
        'Assess each risk: probability (low/medium/high), impact (low/medium/high/critical)',
        'Calculate risk severity: probability × impact',
        'Review unresolved risks from previous spirals',
        'Plan prototypes to address high-risk areas',
        'For each prototype: purpose, what it validates, scope, deliverables, timeline',
        'Prototypes should be throwaway or evolutionary based on risk level',
        'Develop mitigation strategies for each identified risk',
        'For each strategy: risk addressed, approach, cost, effectiveness',
        'Make Go/No-Go decision: can project proceed with acceptable risk?',
        'Go if: critical risks have mitigation OR risk tolerance allows',
        'No-Go if: critical risks unmitigatable AND exceed risk tolerance',
        'Document all risks in risk register with tracking status'
      ],
      outputFormat: 'JSON with risks, risk register, prototypes, mitigation strategies, Go/No-Go decision'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'prototypes', 'mitigationStrategies', 'goNoGoDecision', 'unresolvedRisks'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              category: { type: 'string', enum: ['technical', 'schedule', 'budget', 'quality', 'security', 'integration', 'performance', 'business'] },
              description: { type: 'string' },
              probability: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              status: { type: 'string', enum: ['identified', 'mitigated', 'resolved', 'unresolved', 'accepted'] },
              mitigationPlan: { type: 'string' },
              prototypeNeeded: { type: 'boolean' },
              prototypeId: { type: 'string' }
            }
          }
        },
        prototypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              purpose: { type: 'string' },
              risksAddressed: { type: 'array', items: { type: 'string' } },
              type: { type: 'string', enum: ['throwaway', 'evolutionary', 'proof-of-concept', 'ui-mockup', 'technical-spike'] },
              scope: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } },
              timelineWeeks: { type: 'number' },
              validationCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        mitigationStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              strategy: { type: 'string' },
              approach: { type: 'string' },
              cost: { type: 'number' },
              effectiveness: { type: 'string', enum: ['low', 'medium', 'high'] },
              timeline: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        goNoGoDecision: {
          type: 'string',
          enum: ['go', 'no-go']
        },
        goNoGoRationale: { type: 'string' },
        riskSummary: {
          type: 'object',
          properties: {
            totalRisks: { type: 'number' },
            criticalRisks: { type: 'number' },
            highRisks: { type: 'number' },
            mediumRisks: { type: 'number' },
            lowRisks: { type: 'number' },
            mitigatedRisks: { type: 'number' },
            unresolvedRisks: { type: 'number' }
          }
        },
        unresolvedRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' }
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
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-2-risk-analysis/risk-register.json`, format: 'json' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-2-risk-analysis/risk-register.md`, format: 'markdown' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-2-risk-analysis/prototypes.md`, format: 'markdown' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-2-risk-analysis/mitigation-strategies.md`, format: 'markdown' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-2-risk-analysis/go-no-go-analysis.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'spiral-model', 'risk-analysis', `spiral-${args.spiralNumber}`]
}));

/**
 * Phase 3: Engineering
 * Develop and test the product for this spiral iteration
 */
export const engineeringPhaseTask = defineTask('engineering-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: `Engineering Phase: Spiral ${args.spiralNumber}`,
  description: 'Design, implement, test, and integrate components; build prototypes',

  agent: {
    name: 'engineering-team',
    prompt: {
      role: 'experienced engineering team: developers, testers, architects',
      task: 'Execute engineering phase: design, implementation, testing, prototyping',
      context: {
        projectName: args.projectName,
        spiralNumber: args.spiralNumber,
        objectives: args.objectives,
        selectedAlternative: args.selectedAlternative,
        mitigationStrategies: args.mitigationStrategies,
        prototypes: args.prototypes,
        currentSystem: args.currentSystem,
        previousSpirals: args.previousSpirals
      },
      instructions: [
        'Design components and architecture for this spiral iteration',
        'Implement design based on selected alternative from planning',
        'Build all planned prototypes to validate risky assumptions',
        'For each prototype: implement, test against validation criteria, document findings',
        'Develop production code incrementally based on objectives',
        'Write comprehensive tests: unit, integration, system tests',
        'Execute all tests and document results',
        'Integrate with existing system from previous spirals (if any)',
        'Ensure each objective from planning is addressed',
        'Apply mitigation strategies during development',
        'Document all components, APIs, interfaces',
        'Create iteration deliverable: working subset of system',
        'Track what has been built vs what remains',
        'Ensure deliverable is demonstrable to stakeholders'
      ],
      outputFormat: 'JSON with components, prototypes, tests, integration status, deliverables'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'prototypeDeliverables', 'tests', 'integrationStatus', 'systemState'],
      properties: {
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              objectivesAddressed: { type: 'array', items: { type: 'string' } },
              linesOfCode: { type: 'number' },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
              status: { type: 'string', enum: ['complete', 'in-progress', 'tested', 'integrated'] }
            }
          }
        },
        prototypeDeliverables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prototypeId: { type: 'string' },
              name: { type: 'string' },
              status: { type: 'string', enum: ['built', 'tested', 'validated', 'failed'] },
              findings: { type: 'array', items: { type: 'string' } },
              risksValidated: { type: 'array', items: { type: 'string' } },
              decisions: { type: 'array', items: { type: 'string' } },
              disposition: { type: 'string', enum: ['throwaway', 'evolve-to-product', 'archive'] }
            }
          }
        },
        tests: {
          type: 'object',
          properties: {
            unit: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                passed: { type: 'number' },
                failed: { type: 'number' },
                coverage: { type: 'number' }
              }
            },
            integration: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                passed: { type: 'number' },
                failed: { type: 'number' }
              }
            },
            system: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                passed: { type: 'number' },
                failed: { type: 'number' }
              }
            },
            total: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' }
          }
        },
        integrationStatus: {
          type: 'string',
          enum: ['not-started', 'in-progress', 'complete', 'partial']
        },
        integrationDetails: {
          type: 'object',
          properties: {
            integratedWith: { type: 'array', items: { type: 'string' } },
            integrationPoints: { type: 'number' },
            integrationIssues: { type: 'array', items: { type: 'string' } }
          }
        },
        systemState: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            componentsTotal: { type: 'number' },
            featuresImplemented: { type: 'array', items: { type: 'string' } },
            percentComplete: { type: 'number' },
            operational: { type: 'boolean' }
          }
        },
        documentation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        deliverableDescription: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-3-engineering/deliverables.md`, format: 'markdown' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-3-engineering/components.json`, format: 'json' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-3-engineering/prototypes.md`, format: 'markdown' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-3-engineering/test-results.md`, format: 'markdown' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-3-engineering/integration-report.md`, format: 'markdown' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-3-engineering/system-state.json`, format: 'json' }
    ]
  },

  labels: ['agent', 'spiral-model', 'engineering', `spiral-${args.spiralNumber}`]
}));

/**
 * Phase 4: Evaluation
 * Customer evaluation, stakeholder feedback, convergence assessment
 */
export const evaluationPhaseTask = defineTask('evaluation-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluation Phase: Spiral ${args.spiralNumber}`,
  description: 'Customer review, stakeholder evaluation, convergence assessment, next spiral planning',

  agent: {
    name: 'evaluation-team',
    prompt: {
      role: 'evaluation team including customer representatives and stakeholders',
      task: 'Evaluate spiral deliverables, assess risks, determine convergence',
      context: {
        projectName: args.projectName,
        spiralNumber: args.spiralNumber,
        objectives: args.objectives,
        engineeringDeliverables: args.engineeringDeliverables,
        risks: args.risks,
        prototypes: args.prototypes,
        stakeholders: args.stakeholders,
        currentSystem: args.currentSystem,
        maxSpirals: args.maxSpirals,
        convergenceCriteria: args.convergenceCriteria
      },
      instructions: [
        'Conduct customer review of iteration deliverables',
        'Demonstrate working system and prototypes',
        'Gather stakeholder feedback on what was delivered',
        'Evaluate whether objectives were achieved',
        'For each objective: achieved, partially achieved, or not achieved',
        'Review risk status: which risks were resolved, which remain',
        'Analyze prototype findings and decisions made',
        'Assess customer satisfaction on scale 1-10',
        'Identify issues discovered during spiral',
        'Document change requests or new requirements',
        'Perform convergence assessment against criteria',
        'Convergence criteria examples: all risks resolved, objectives met, stakeholder satisfaction, no critical issues',
        'Determine if project has converged (ready to conclude)',
        'If not converged: identify what needs to happen in next spiral',
        'Plan objectives for next spiral if needed',
        'Make recommendation: continue spiraling or conclude project'
      ],
      outputFormat: 'JSON with evaluation results, feedback, convergence assessment, next spiral recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['objectivesAchievement', 'customerSatisfaction', 'stakeholderFeedback', 'risksResolved', 'convergenceAssessment'],
      properties: {
        objectivesAchievement: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objectiveId: { type: 'string' },
              status: { type: 'string', enum: ['achieved', 'partially-achieved', 'not-achieved'] },
              evidence: { type: 'string' },
              issues: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        customerSatisfaction: { type: 'number', minimum: 1, maximum: 10 },
        stakeholderFeedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              feedback: { type: 'string' },
              category: { type: 'string', enum: ['positive', 'concern', 'change-request', 'issue'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        prototypeEvaluations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prototypeId: { type: 'string' },
              validated: { type: 'boolean' },
              findings: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        risksResolved: { type: 'number' },
        risksRemaining: { type: 'number' },
        issuesDiscovered: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' }
            }
          }
        },
        changeRequests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              requestedBy: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        convergenceAssessment: {
          type: 'object',
          properties: {
            converged: { type: 'boolean' },
            rationale: { type: 'string' },
            criteriaEvaluation: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  criterion: { type: 'string' },
                  met: { type: 'boolean' },
                  details: { type: 'string' }
                }
              }
            },
            readyForProduction: { type: 'boolean' },
            outstandingWork: { type: 'array', items: { type: 'string' } }
          }
        },
        nextSpiralRecommendation: {
          type: 'object',
          properties: {
            recommended: { type: 'boolean' },
            proposedObjectives: { type: 'array', items: { type: 'string' } },
            estimatedCost: { type: 'number' },
            estimatedDuration: { type: 'string' },
            keyFocus: { type: 'array', items: { type: 'string' } }
          }
        },
        evaluationSummary: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-4-evaluation/evaluation-report.md`, format: 'markdown' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-4-evaluation/stakeholder-feedback.json`, format: 'json' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-4-evaluation/convergence-assessment.md`, format: 'markdown' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-4-evaluation/issues-discovered.json`, format: 'json' },
      { path: `artifacts/spiral-model/spiral-${args.spiralNumber}/phase-4-evaluation/next-spiral-plan.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'spiral-model', 'evaluation', `spiral-${args.spiralNumber}`]
}));

/**
 * Spiral Tracking and Visualization
 * Generate spiral diagram showing radial (cost) and angular (phase) progress
 */
export const spiralTrackingTask = defineTask('spiral-tracking', (args, taskCtx) => ({
  kind: 'node',
  title: `Spiral Tracking & Visualization`,
  description: 'Generate spiral diagram, risk heatmap, and progress visualizations',

  node: {
    run: async (taskArgs) => {
      const { projectName, spirals, cumulativeCost, prototypes, unresolvedRisks } = taskArgs;

      // Generate spiral diagram (radial = cost, angular = phase)
      const spiralDiagram = generateSpiralDiagramSVG(spirals, cumulativeCost);

      // Generate risk heatmap across spirals
      const riskHeatmap = generateRiskHeatmapSVG(spirals);

      // Calculate tracking metrics
      const trackingMetrics = {
        spiralsExecuted: spirals.length,
        totalCost: cumulativeCost,
        costPerSpiral: spirals.map(s => ({
          spiral: s.spiralNumber,
          cost: s.costIncurred,
          cumulativeCost: s.endCost
        })),
        riskTrend: spirals.map(s => ({
          spiral: s.spiralNumber,
          risksIdentified: s.phase2RiskAnalysis.risks.length,
          risksResolved: s.phase4Evaluation.risksResolved,
          unresolvedAtEnd: s.unresolvedRisksAtEnd
        })),
        prototypesBuilt: prototypes.length,
        prototypesBySpiral: spirals.map(s => ({
          spiral: s.spiralNumber,
          prototypes: s.phase2RiskAnalysis.prototypes.length
        })),
        phaseDistribution: {
          planning: spirals.reduce((sum, s) => sum + s.costIncurred * 0.15, 0),
          riskAnalysis: spirals.reduce((sum, s) => sum + s.costIncurred * 0.25, 0),
          engineering: spirals.reduce((sum, s) => sum + s.costIncurred * 0.45, 0),
          evaluation: spirals.reduce((sum, s) => sum + s.costIncurred * 0.15, 0)
        }
      };

      return {
        spiralDiagram: {
          svg: spiralDiagram,
          description: 'Spiral diagram showing cost (radius) and phase (angle) progression'
        },
        riskHeatmap: {
          svg: riskHeatmap,
          description: 'Risk heatmap showing risk severity across spirals'
        },
        trackingMetrics,
        costTrend: trackingMetrics.costPerSpiral,
        riskTrend: trackingMetrics.riskTrend,
        radialDistance: cumulativeCost,
        angularProgressDegrees: spirals.length * 360
      };
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/spiral-model/spiral-diagram.svg', format: 'image' },
      { path: 'artifacts/spiral-model/risk-heatmap.svg', format: 'image' },
      { path: 'artifacts/spiral-model/tracking-metrics.json', format: 'json' }
    ]
  },

  labels: ['node', 'spiral-model', 'visualization', 'tracking']
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate final project metrics
 */
function calculateFinalMetrics(spiralResults, cumulativeCost, prototypes) {
  const totalRisksIdentified = spiralResults.reduce(
    (sum, s) => sum + s.phase2RiskAnalysis.risks.length,
    0
  );

  const risksResolved = spiralResults.reduce(
    (sum, s) => sum + s.phase4Evaluation.risksResolved,
    0
  );

  const totalComponents = spiralResults[spiralResults.length - 1]?.phase3Engineering.systemState.componentsTotal || 0;

  const totalTestsPassed = spiralResults.reduce(
    (sum, s) => sum + (s.phase3Engineering.tests?.passed || 0),
    0
  );

  const averageCustomerSatisfaction = spiralResults.reduce(
    (sum, s) => sum + s.phase4Evaluation.customerSatisfaction,
    0
  ) / spiralResults.length;

  const integrationComplete = spiralResults[spiralResults.length - 1]?.phase3Engineering.integrationStatus === 'complete';

  return {
    spiralCount: spiralResults.length,
    totalCost: cumulativeCost,
    averageCostPerSpiral: cumulativeCost / spiralResults.length,
    totalRisksIdentified,
    risksResolved,
    riskResolutionRate: ((risksResolved / totalRisksIdentified) * 100).toFixed(1) + '%',
    totalPrototypes: prototypes.length,
    totalComponents,
    totalTestsPassed,
    averageCustomerSatisfaction: averageCustomerSatisfaction.toFixed(1),
    integrationComplete,
    systemCompleteness: spiralResults[spiralResults.length - 1]?.phase3Engineering.systemState.percentComplete || 0
  };
}

/**
 * Generate spiral diagram SVG
 */
function generateSpiralDiagramSVG(spirals, maxCost) {
  const width = 800;
  const height = 800;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 60;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="#f8f9fa"/>`;

  // Draw title
  svg += `<text x="${centerX}" y="30" text-anchor="middle" font-size="20" font-weight="bold" fill="#333">Spiral Model Progression</text>`;

  // Draw phase labels around the spiral
  const phaseLabels = ['Planning', 'Risk Analysis', 'Engineering', 'Evaluation'];
  const phaseAngles = [45, 135, 225, 315];

  phaseAngles.forEach((angle, idx) => {
    const rad = (angle - 90) * Math.PI / 180;
    const labelRadius = maxRadius + 40;
    const x = centerX + labelRadius * Math.cos(rad);
    const y = centerY + labelRadius * Math.sin(rad);
    svg += `<text x="${x}" y="${y}" text-anchor="middle" font-size="14" font-weight="bold" fill="#2196F3">${phaseLabels[idx]}</text>`;
  });

  // Draw spirals
  const phases = 4;
  const anglePerPhase = 360 / phases;

  spirals.forEach((spiral, idx) => {
    const spiralNumber = spiral.spiralNumber;
    const startRadius = idx === 0 ? 30 : (spiral.startCost / maxCost) * maxRadius;
    const endRadius = (spiral.endCost / maxCost) * maxRadius;

    // Draw spiral arc through all 4 phases
    for (let phase = 0; phase < phases; phase++) {
      const startAngle = (spiralNumber - 1) * 360 + phase * anglePerPhase - 90;
      const endAngle = startAngle + anglePerPhase;
      const radius = startRadius + (endRadius - startRadius) * (phase / phases);
      const nextRadius = startRadius + (endRadius - startRadius) * ((phase + 1) / phases);

      const x1 = centerX + radius * Math.cos(startAngle * Math.PI / 180);
      const y1 = centerY + radius * Math.sin(startAngle * Math.PI / 180);
      const x2 = centerX + nextRadius * Math.cos(endAngle * Math.PI / 180);
      const y2 = centerY + nextRadius * Math.sin(endAngle * Math.PI / 180);

      // Draw arc
      const largeArcFlag = anglePerPhase > 180 ? 1 : 0;
      svg += `<path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}" stroke="#2196F3" stroke-width="3" fill="none"/>`;
    }

    // Draw spiral number label
    const labelAngle = (spiralNumber - 1) * 360 + 180 - 90;
    const labelRadius = (startRadius + endRadius) / 2;
    const labelX = centerX + labelRadius * Math.cos(labelAngle * Math.PI / 180);
    const labelY = centerY + labelRadius * Math.sin(labelAngle * Math.PI / 180);
    svg += `<circle cx="${labelX}" cy="${labelY}" r="15" fill="#2196F3"/>`;
    svg += `<text x="${labelX}" y="${labelY + 5}" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${spiralNumber}</text>`;
  });

  // Draw legend
  svg += `<text x="50" y="${height - 50}" font-size="12" fill="#666">Radius = Cumulative Cost | Angle = Phase Progress</text>`;
  svg += `<text x="50" y="${height - 30}" font-size="12" fill="#666">Total Spirals: ${spirals.length} | Total Cost: $${maxCost}</text>`;

  svg += '</svg>';
  return svg;
}

/**
 * Generate risk heatmap SVG
 */
function generateRiskHeatmapSVG(spirals) {
  const width = 800;
  const height = 400;
  const padding = 60;
  const cellWidth = (width - 2 * padding) / spirals.length;
  const cellHeight = 40;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="#f8f9fa"/>`;

  // Draw title
  svg += `<text x="${width / 2}" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#333">Risk Heatmap Across Spirals</text>`;

  // Draw risk categories
  const categories = ['Critical', 'High', 'Medium', 'Low'];
  const colors = { 'Critical': '#f44336', 'High': '#ff9800', 'Medium': '#ffc107', 'Low': '#4caf50' };

  categories.forEach((category, catIdx) => {
    const y = padding + catIdx * (cellHeight + 5);

    // Draw category label
    svg += `<text x="30" y="${y + cellHeight / 2 + 5}" text-anchor="end" font-size="12" fill="#666">${category}</text>`;

    // Draw cells for each spiral
    spirals.forEach((spiral, spiralIdx) => {
      const x = padding + spiralIdx * cellWidth;
      const risks = spiral.phase2RiskAnalysis.risks.filter(r =>
        r.severity.toLowerCase() === category.toLowerCase()
      );
      const count = risks.length;
      const opacity = Math.min(count / 5, 1); // Max 5 risks for full opacity

      svg += `<rect x="${x}" y="${y}" width="${cellWidth - 2}" height="${cellHeight}" fill="${colors[category]}" opacity="${opacity}" stroke="#fff" stroke-width="1"/>`;
      if (count > 0) {
        svg += `<text x="${x + cellWidth / 2}" y="${y + cellHeight / 2 + 5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#fff">${count}</text>`;
      }
    });
  });

  // Draw spiral labels
  spirals.forEach((spiral, idx) => {
    const x = padding + idx * cellWidth + cellWidth / 2;
    svg += `<text x="${x}" y="${padding + 4 * (cellHeight + 5) + 20}" text-anchor="middle" font-size="12" fill="#666">S${spiral.spiralNumber}</text>`;
  });

  // Draw legend
  svg += `<text x="${padding}" y="${height - 20}" font-size="11" fill="#666">Numbers show risk count | Color intensity shows relative severity</text>`;

  svg += '</svg>';
  return svg;
}
