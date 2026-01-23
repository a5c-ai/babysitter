/**
 * @process specializations/software-architecture/migration-strategy
 * @description Migration Strategy Planning - Comprehensive migration strategy development for legacy systems,
 * platform migrations, cloud migrations, and technology stack modernization with phased approach,
 * risk assessment, and detailed execution roadmap.
 * @inputs { projectName: string, currentState?: object, targetState?: object, migrationGoals?: array, constraints?: object }
 * @outputs { success: boolean, strategy: object, migrationPlan: object, roadmap: object, risks: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/software-architecture/migration-strategy', {
 *   projectName: 'Legacy Monolith to Microservices',
 *   currentState: { architecture: 'monolith', technology: 'Java EE', database: 'Oracle' },
 *   targetState: { architecture: 'microservices', technology: 'Spring Boot', database: 'PostgreSQL', cloud: 'AWS' },
 *   migrationGoals: ['reduce operational costs', 'improve scalability', 'enable faster deployments'],
 *   constraints: { budget: '$500K', timeline: '12 months', maxDowntime: '4 hours' }
 * });
 *
 * @references
 * - Strangler Fig Pattern: https://martinfowler.com/bliki/StranglerFigApplication.html
 * - Cloud Migration Patterns: https://docs.aws.amazon.com/prescriptive-guidance/latest/migration-strategies/welcome.html
 * - The Software Architect's Handbook: https://www.oreilly.com/library/view/the-software-architects/9781788624060/
 * - Building Microservices (Sam Newman): https://www.oreilly.com/library/view/building-microservices-2nd/9781492034018/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    currentState = {},
    targetState = {},
    migrationGoals = [],
    constraints = {},
    outputDir = 'migration-strategy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Migration Strategy Planning for ${projectName}`);

  // ============================================================================
  // PHASE 1: CURRENT STATE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing current system state and architecture');
  const currentStateAssessment = await ctx.task(currentStateAssessmentTask, {
    projectName,
    currentState,
    outputDir
  });

  artifacts.push(...currentStateAssessment.artifacts);

  // Quality Gate: Current state must be sufficiently documented
  if (currentStateAssessment.completenessScore < 70) {
    await ctx.breakpoint({
      question: `Current state assessment completeness: ${currentStateAssessment.completenessScore}%. Additional discovery needed. Should we conduct deeper analysis before proceeding?`,
      title: 'Current State Assessment Warning',
      context: {
        runId: ctx.runId,
        projectName,
        assessment: currentStateAssessment,
        recommendation: 'Conduct architecture discovery workshops and technical documentation review'
      }
    });
  }

  // ============================================================================
  // PHASE 2: TARGET STATE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining target architecture and technology stack');
  const targetStateDefinition = await ctx.task(targetStateDefinitionTask, {
    projectName,
    currentState: currentStateAssessment,
    targetState,
    migrationGoals,
    constraints,
    outputDir
  });

  artifacts.push(...targetStateDefinition.artifacts);

  // Breakpoint: Review target architecture
  await ctx.breakpoint({
    question: `Review target architecture for ${projectName}. Target: ${targetStateDefinition.architecturePattern}. Alignment with goals: ${targetStateDefinition.goalAlignmentScore}%. Approve?`,
    title: 'Target Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      targetDefinition: targetStateDefinition,
      files: [{
        path: 'artifacts/phase2-target-architecture.json',
        format: 'json',
        content: targetStateDefinition
      }, {
        path: 'artifacts/phase2-target-architecture-diagram.md',
        format: 'markdown',
        content: targetStateDefinition.diagram
      }]
    }
  });

  // ============================================================================
  // PHASE 3: GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting gap analysis between current and target states');
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    projectName,
    currentState: currentStateAssessment,
    targetState: targetStateDefinition,
    migrationGoals,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: MIGRATION STRATEGY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Selecting optimal migration strategy and approach');
  const migrationStrategy = await ctx.task(migrationStrategySelectionTask, {
    projectName,
    currentState: currentStateAssessment,
    targetState: targetStateDefinition,
    gapAnalysis,
    migrationGoals,
    constraints,
    outputDir
  });

  artifacts.push(...migrationStrategy.artifacts);

  // Quality Gate: Migration strategy must be feasible within constraints
  if (!migrationStrategy.feasibilityAssessment.withinConstraints) {
    await ctx.breakpoint({
      question: `Migration strategy exceeds constraints. Budget: ${migrationStrategy.estimatedCost} vs ${constraints.budget}, Timeline: ${migrationStrategy.estimatedDuration} vs ${constraints.timeline}. Adjust strategy or constraints?`,
      title: 'Migration Feasibility Warning',
      context: {
        runId: ctx.runId,
        projectName,
        strategy: migrationStrategy,
        constraintViolations: migrationStrategy.feasibilityAssessment.violations,
        recommendation: 'Consider phased approach or adjust scope/constraints'
      }
    });
  }

  // ============================================================================
  // PHASE 5: RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Conducting comprehensive migration risk assessment');
  const riskAssessment = await ctx.task(migrationRiskAssessmentTask, {
    projectName,
    currentState: currentStateAssessment,
    targetState: targetStateDefinition,
    migrationStrategy,
    constraints,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // Quality Gate: Critical risks must have mitigation plans
  const criticalRisksWithoutMitigation = riskAssessment.risks.filter(
    risk => risk.severity === 'critical' && !risk.mitigationPlan
  );

  if (criticalRisksWithoutMitigation.length > 0) {
    await ctx.breakpoint({
      question: `${criticalRisksWithoutMitigation.length} critical risks lack mitigation plans. Should we develop mitigation strategies before proceeding?`,
      title: 'Critical Risk Warning',
      context: {
        runId: ctx.runId,
        projectName,
        criticalRisks: criticalRisksWithoutMitigation,
        recommendation: 'Develop mitigation strategies for all critical risks'
      }
    });
  }

  // ============================================================================
  // PHASE 6: PHASED MIGRATION ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing phased migration roadmap');
  const migrationRoadmap = await ctx.task(migrationRoadmapTask, {
    projectName,
    currentState: currentStateAssessment,
    targetState: targetStateDefinition,
    gapAnalysis,
    migrationStrategy,
    riskAssessment,
    constraints,
    outputDir
  });

  artifacts.push(...migrationRoadmap.artifacts);

  // ============================================================================
  // PHASE 7: DATA MIGRATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 7: Planning data migration strategy');
  const dataMigrationStrategy = await ctx.task(dataMigrationStrategyTask, {
    projectName,
    currentState: currentStateAssessment,
    targetState: targetStateDefinition,
    migrationStrategy,
    migrationRoadmap,
    constraints,
    outputDir
  });

  artifacts.push(...dataMigrationStrategy.artifacts);

  // ============================================================================
  // PHASE 8: TESTING AND VALIDATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing testing and validation strategy');
  const testingStrategy = await ctx.task(migrationTestingStrategyTask, {
    projectName,
    currentState: currentStateAssessment,
    targetState: targetStateDefinition,
    migrationStrategy,
    migrationRoadmap,
    outputDir
  });

  artifacts.push(...testingStrategy.artifacts);

  // ============================================================================
  // PHASE 9: ROLLBACK AND CONTINGENCY PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 9: Designing rollback and contingency plans');
  const rollbackPlan = await ctx.task(rollbackContingencyTask, {
    projectName,
    currentState: currentStateAssessment,
    targetState: targetStateDefinition,
    migrationStrategy,
    migrationRoadmap,
    riskAssessment,
    constraints,
    outputDir
  });

  artifacts.push(...rollbackPlan.artifacts);

  // ============================================================================
  // PHASE 10: ORGANIZATIONAL CHANGE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Planning organizational change management');
  const changeManagement = await ctx.task(changeManagementTask, {
    projectName,
    currentState: currentStateAssessment,
    targetState: targetStateDefinition,
    migrationStrategy,
    migrationRoadmap,
    outputDir
  });

  artifacts.push(...changeManagement.artifacts);

  // ============================================================================
  // PHASE 11: COST-BENEFIT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 11: Conducting cost-benefit analysis');
  const costBenefitAnalysis = await ctx.task(costBenefitAnalysisTask, {
    projectName,
    currentState: currentStateAssessment,
    targetState: targetStateDefinition,
    migrationStrategy,
    migrationRoadmap,
    migrationGoals,
    constraints,
    outputDir
  });

  artifacts.push(...costBenefitAnalysis.artifacts);

  // ============================================================================
  // PHASE 12: COMPREHENSIVE STRATEGY DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating comprehensive migration strategy document');
  const strategyDocument = await ctx.task(strategyDocumentGenerationTask, {
    projectName,
    currentState: currentStateAssessment,
    targetState: targetStateDefinition,
    gapAnalysis,
    migrationStrategy,
    riskAssessment,
    migrationRoadmap,
    dataMigrationStrategy,
    testingStrategy,
    rollbackPlan,
    changeManagement,
    costBenefitAnalysis,
    migrationGoals,
    constraints,
    outputDir
  });

  artifacts.push(...strategyDocument.artifacts);

  // ============================================================================
  // PHASE 13: STRATEGY QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Validating migration strategy quality and completeness');
  const strategyValidation = await ctx.task(strategyValidationTask, {
    projectName,
    currentState: currentStateAssessment,
    targetState: targetStateDefinition,
    gapAnalysis,
    migrationStrategy,
    riskAssessment,
    migrationRoadmap,
    dataMigrationStrategy,
    testingStrategy,
    rollbackPlan,
    changeManagement,
    costBenefitAnalysis,
    strategyDocument,
    outputDir
  });

  artifacts.push(...strategyValidation.artifacts);

  const strategyScore = strategyValidation.overallScore;
  const qualityMet = strategyScore >= 85;

  // Final Breakpoint: Migration Strategy Approval
  await ctx.breakpoint({
    question: `Migration strategy complete for ${projectName}. Quality score: ${strategyScore}/100. ${qualityMet ? 'Strategy meets quality standards!' : 'Strategy may need refinement.'} Total cost: ${costBenefitAnalysis.totalCost}, Duration: ${migrationRoadmap.timeline.totalDuration}, ROI: ${costBenefitAnalysis.roi.percentage}%. Approve to proceed?`,
    title: 'Migration Strategy Approval',
    context: {
      runId: ctx.runId,
      projectName,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        strategyScore,
        qualityMet,
        projectName,
        migrationApproach: migrationStrategy.approach,
        totalPhases: migrationRoadmap.phases.length,
        estimatedDuration: migrationRoadmap.timeline.totalDuration,
        estimatedCost: costBenefitAnalysis.totalCost,
        expectedROI: costBenefitAnalysis.roi.percentage,
        criticalRisks: riskAssessment.criticalRisks.length,
        documentPath: strategyDocument.documentPath
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    strategyScore,
    qualityMet,
    strategy: {
      approach: migrationStrategy.approach,
      pattern: migrationStrategy.pattern,
      description: migrationStrategy.description,
      rationale: migrationStrategy.rationale,
      feasibility: migrationStrategy.feasibilityAssessment
    },
    currentState: {
      architecture: currentStateAssessment.architecture,
      technology: currentStateAssessment.technology,
      completenessScore: currentStateAssessment.completenessScore,
      strengths: currentStateAssessment.strengths,
      weaknesses: currentStateAssessment.weaknesses
    },
    targetState: {
      architecture: targetStateDefinition.architecturePattern,
      technology: targetStateDefinition.technology,
      goalAlignment: targetStateDefinition.goalAlignmentScore,
      capabilities: targetStateDefinition.capabilities
    },
    gapAnalysis: {
      totalGaps: gapAnalysis.gaps.length,
      criticalGaps: gapAnalysis.criticalGaps,
      effortEstimate: gapAnalysis.totalEffort
    },
    migrationPlan: {
      phases: migrationRoadmap.phases,
      timeline: migrationRoadmap.timeline,
      dependencies: migrationRoadmap.dependencies,
      milestones: migrationRoadmap.milestones
    },
    dataMigration: {
      strategy: dataMigrationStrategy.strategy,
      approach: dataMigrationStrategy.approach,
      estimatedDataVolume: dataMigrationStrategy.dataVolume,
      estimatedDuration: dataMigrationStrategy.estimatedDuration
    },
    testing: {
      strategy: testingStrategy.strategy,
      testLevels: testingStrategy.testLevels,
      validationCriteria: testingStrategy.validationCriteria,
      estimatedEffort: testingStrategy.estimatedEffort
    },
    risks: {
      totalRisks: riskAssessment.risks.length,
      criticalRisks: riskAssessment.criticalRisks,
      highRisks: riskAssessment.highRisks,
      overallRiskLevel: riskAssessment.overallRiskLevel,
      mitigationPlan: riskAssessment.mitigationPlan
    },
    rollback: {
      strategy: rollbackPlan.strategy,
      triggerConditions: rollbackPlan.triggerConditions,
      rollbackSteps: rollbackPlan.rollbackSteps,
      estimatedRollbackTime: rollbackPlan.estimatedRollbackTime
    },
    changeManagement: {
      stakeholders: changeManagement.stakeholders,
      trainingPlan: changeManagement.trainingPlan,
      communicationPlan: changeManagement.communicationPlan,
      estimatedEffort: changeManagement.estimatedEffort
    },
    costBenefit: {
      totalCost: costBenefitAnalysis.totalCost,
      breakdown: costBenefitAnalysis.costBreakdown,
      benefits: costBenefitAnalysis.benefits,
      roi: costBenefitAnalysis.roi,
      paybackPeriod: costBenefitAnalysis.paybackPeriod
    },
    roadmap: migrationRoadmap,
    strategyDocument: strategyDocument.documentPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/software-architecture/migration-strategy',
      timestamp: startTime,
      projectName,
      outputDir,
      version: '1.0.0'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Current State Assessment
export const currentStateAssessmentTask = defineTask('current-state-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Current State Assessment - ${args.projectName}`,
  agent: {
    name: 'architecture-analyst',
    prompt: {
      role: 'senior software architect and systems analyst',
      task: 'Conduct comprehensive assessment of current system architecture, technology stack, and operational characteristics',
      context: args,
      instructions: [
        '1. Document current architecture pattern (monolith, microservices, SOA, layered, etc.)',
        '2. Inventory technology stack (languages, frameworks, databases, infrastructure)',
        '3. Analyze system components and dependencies',
        '4. Document integration points and external dependencies',
        '5. Assess current performance characteristics (throughput, latency, scalability)',
        '6. Identify technical debt and pain points',
        '7. Document operational aspects (deployment, monitoring, maintenance)',
        '8. Assess data architecture and storage systems',
        '9. Evaluate security posture and compliance status',
        '10. Identify strengths and weaknesses of current state',
        '11. Calculate completeness score based on documentation quality',
        '12. Generate current state architecture diagram and documentation'
      ],
      outputFormat: 'JSON with architecture, technology, components, integrations, performance, technicalDebt, operations, data, security, strengths, weaknesses, completenessScore, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'technology', 'completenessScore', 'artifacts'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            pattern: { type: 'string', enum: ['monolith', 'microservices', 'soa', 'layered', 'modular-monolith', 'serverless', 'hybrid'] },
            description: { type: 'string' },
            components: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  responsibilities: { type: 'string' },
                  dependencies: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            diagram: { type: 'string' }
          }
        },
        technology: {
          type: 'object',
          properties: {
            languages: { type: 'array', items: { type: 'string' } },
            frameworks: { type: 'array', items: { type: 'string' } },
            databases: { type: 'array', items: { type: 'string' } },
            infrastructure: { type: 'array', items: { type: 'string' } },
            tools: { type: 'array', items: { type: 'string' } }
          }
        },
        integrations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              type: { type: 'string' },
              protocol: { type: 'string' },
              criticality: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        performance: {
          type: 'object',
          properties: {
            throughput: { type: 'string' },
            latency: { type: 'string' },
            scalability: { type: 'string' },
            availability: { type: 'string' }
          }
        },
        technicalDebt: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string' }
            }
          }
        },
        operations: {
          type: 'object',
          properties: {
            deploymentFrequency: { type: 'string' },
            deploymentProcess: { type: 'string' },
            monitoring: { type: 'array', items: { type: 'string' } },
            maintenanceChallenges: { type: 'array', items: { type: 'string' } }
          }
        },
        data: {
          type: 'object',
          properties: {
            dataVolume: { type: 'string' },
            dataTypes: { type: 'array', items: { type: 'string' } },
            storageSystem: { type: 'string' },
            dataFlow: { type: 'string' }
          }
        },
        security: {
          type: 'object',
          properties: {
            authentication: { type: 'string' },
            authorization: { type: 'string' },
            encryption: { type: 'string' },
            compliance: { type: 'array', items: { type: 'string' } },
            vulnerabilities: { type: 'array', items: { type: 'string' } }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-strategy', 'assessment', 'current-state', 'architecture-analysis']
}));

// Task 2: Target State Definition
export const targetStateDefinitionTask = defineTask('target-state-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Target State Definition - ${args.projectName}`,
  agent: {
    name: 'architecture-designer',
    prompt: {
      role: 'principal software architect specializing in modern architecture patterns',
      task: 'Define comprehensive target architecture aligned with migration goals and constraints',
      context: args,
      instructions: [
        '1. Design target architecture pattern based on goals and constraints',
        '2. Select modern technology stack aligned with industry best practices',
        '3. Design target system components and their interactions',
        '4. Define target integration architecture and API strategies',
        '5. Specify target performance characteristics and scalability goals',
        '6. Design target data architecture and storage strategy',
        '7. Define target security architecture and compliance requirements',
        '8. Plan target operational capabilities (CI/CD, monitoring, observability)',
        '9. Design cloud architecture if applicable (AWS, Azure, GCP)',
        '10. Ensure alignment with migration goals and validate against constraints',
        '11. Calculate goal alignment score',
        '12. Generate target architecture diagram and detailed specifications'
      ],
      outputFormat: 'JSON with architecturePattern, technology, components, integrations, performance, data, security, operations, cloud, capabilities, goalAlignmentScore, diagram, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architecturePattern', 'technology', 'goalAlignmentScore', 'artifacts'],
      properties: {
        architecturePattern: {
          type: 'string',
          enum: ['microservices', 'event-driven', 'serverless', 'modular-monolith', 'layered', 'hexagonal', 'hybrid']
        },
        technology: {
          type: 'object',
          properties: {
            languages: { type: 'array', items: { type: 'string' } },
            frameworks: { type: 'array', items: { type: 'string' } },
            databases: { type: 'array', items: { type: 'string' } },
            infrastructure: { type: 'array', items: { type: 'string' } },
            tools: { type: 'array', items: { type: 'string' } },
            justification: { type: 'string' }
          }
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              responsibilities: { type: 'string' },
              apis: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        integrations: {
          type: 'object',
          properties: {
            internalApi: { type: 'string' },
            externalApi: { type: 'string' },
            messaging: { type: 'string' },
            eventDriven: { type: 'boolean' }
          }
        },
        performance: {
          type: 'object',
          properties: {
            targetThroughput: { type: 'string' },
            targetLatency: { type: 'string' },
            scalabilityStrategy: { type: 'string' },
            availabilityTarget: { type: 'string' }
          }
        },
        data: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            databases: { type: 'array', items: { type: 'string' } },
            dataManagement: { type: 'string' },
            caching: { type: 'string' }
          }
        },
        security: {
          type: 'object',
          properties: {
            authentication: { type: 'string' },
            authorization: { type: 'string' },
            encryption: { type: 'string' },
            compliance: { type: 'array', items: { type: 'string' } },
            securityControls: { type: 'array', items: { type: 'string' } }
          }
        },
        operations: {
          type: 'object',
          properties: {
            cicd: { type: 'string' },
            monitoring: { type: 'string' },
            logging: { type: 'string' },
            observability: { type: 'string' },
            deploymentStrategy: { type: 'string' }
          }
        },
        cloud: {
          type: 'object',
          properties: {
            provider: { type: 'string' },
            services: { type: 'array', items: { type: 'string' } },
            architecture: { type: 'string' },
            costOptimization: { type: 'array', items: { type: 'string' } }
          }
        },
        capabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              capability: { type: 'string' },
              description: { type: 'string' },
              alignsWithGoal: { type: 'string' }
            }
          }
        },
        goalAlignmentScore: { type: 'number', minimum: 0, maximum: 100 },
        diagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-strategy', 'target-state', 'architecture-design', 'planning']
}));

// Task 3: Gap Analysis
export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Gap Analysis - ${args.projectName}`,
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'enterprise architect specializing in gap analysis and transformation planning',
      task: 'Conduct comprehensive gap analysis between current and target states',
      context: args,
      instructions: [
        '1. Compare current vs target architecture patterns and identify architectural gaps',
        '2. Analyze technology stack differences and required technology transitions',
        '3. Identify capability gaps and missing functionalities',
        '4. Assess performance gaps and required improvements',
        '5. Analyze data architecture gaps and migration requirements',
        '6. Identify security and compliance gaps',
        '7. Assess operational capability gaps (DevOps, monitoring, automation)',
        '8. Identify integration gaps and required interface changes',
        '9. Categorize gaps by priority (critical, high, medium, low)',
        '10. Estimate effort for closing each gap',
        '11. Calculate total effort and identify critical gaps',
        '12. Generate comprehensive gap analysis report'
      ],
      outputFormat: 'JSON with gaps (array), criticalGaps (array), gapsByCategory (object), totalEffort (string), prioritizationMatrix (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'criticalGaps', 'totalEffort', 'artifacts'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gapId: { type: 'string' },
              category: { type: 'string', enum: ['architecture', 'technology', 'capability', 'performance', 'data', 'security', 'operations', 'integration'] },
              description: { type: 'string' },
              currentState: { type: 'string' },
              targetState: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              effort: { type: 'string' },
              complexity: { type: 'string', enum: ['high', 'medium', 'low'] },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalGaps: {
          type: 'array',
          items: { type: 'string' }
        },
        gapsByCategory: {
          type: 'object',
          properties: {
            architecture: { type: 'number' },
            technology: { type: 'number' },
            capability: { type: 'number' },
            performance: { type: 'number' },
            data: { type: 'number' },
            security: { type: 'number' },
            operations: { type: 'number' },
            integration: { type: 'number' }
          }
        },
        totalEffort: { type: 'string' },
        prioritizationMatrix: {
          type: 'object',
          properties: {
            highPriorityHighEffort: { type: 'array', items: { type: 'string' } },
            highPriorityLowEffort: { type: 'array', items: { type: 'string' } },
            lowPriorityHighEffort: { type: 'array', items: { type: 'string' } },
            lowPriorityLowEffort: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-strategy', 'gap-analysis', 'assessment', 'planning']
}));

// Task 4: Migration Strategy Selection
export const migrationStrategySelectionTask = defineTask('migration-strategy-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Migration Strategy Selection - ${args.projectName}`,
  agent: {
    name: 'migration-strategist',
    prompt: {
      role: 'migration architect specializing in large-scale system transformations',
      task: 'Select optimal migration strategy and approach based on gap analysis, goals, and constraints',
      context: args,
      instructions: [
        '1. Evaluate migration strategies: Big Bang, Strangler Fig, Parallel Run, Phased Migration',
        '2. For cloud migrations, consider 7Rs: Rehost, Replatform, Refactor, Rearchitect, Rebuild, Replace, Retain',
        '3. Assess trade-offs for each strategy (speed vs risk, cost vs benefit)',
        '4. Evaluate migration patterns: Strangler Fig, Branch by Abstraction, Feature Toggles, Database First',
        '5. Consider hybrid approaches combining multiple strategies',
        '6. Assess feasibility against constraints (budget, timeline, downtime)',
        '7. Estimate cost and duration for each viable strategy',
        '8. Evaluate risk level for each strategy',
        '9. Recommend optimal strategy with detailed justification',
        '10. Define high-level migration approach and sequencing',
        '11. Validate feasibility within constraints',
        '12. Generate migration strategy recommendation document'
      ],
      outputFormat: 'JSON with approach, pattern, description, rationale, alternatives, estimatedCost, estimatedDuration, riskLevel, feasibilityAssessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'pattern', 'description', 'rationale', 'feasibilityAssessment', 'artifacts'],
      properties: {
        approach: {
          type: 'string',
          enum: ['big-bang', 'strangler-fig', 'parallel-run', 'phased-migration', 'hybrid']
        },
        pattern: {
          type: 'string',
          enum: ['rehost', 'replatform', 'refactor', 'rearchitect', 'rebuild', 'replace', 'retain', 'combined']
        },
        description: { type: 'string' },
        rationale: { type: 'string' },
        migrationSequence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              activity: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              approach: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              whyNotChosen: { type: 'string' }
            }
          }
        },
        estimatedCost: { type: 'string' },
        estimatedDuration: { type: 'string' },
        riskLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
        feasibilityAssessment: {
          type: 'object',
          properties: {
            withinConstraints: { type: 'boolean' },
            budgetFeasibility: { type: 'string' },
            timelineFeasibility: { type: 'string' },
            downtimeFeasibility: { type: 'string' },
            violations: { type: 'array', items: { type: 'string' } },
            adjustments: { type: 'array', items: { type: 'string' } }
          }
        },
        successCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-strategy', 'strategy-selection', 'decision-making', 'planning']
}));

// Task 5: Migration Risk Assessment
export const migrationRiskAssessmentTask = defineTask('migration-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Migration Risk Assessment - ${args.projectName}`,
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'enterprise risk analyst specializing in migration and transformation risks',
      task: 'Conduct comprehensive risk assessment for migration strategy',
      context: args,
      instructions: [
        '1. Identify technical risks (compatibility, performance degradation, data loss)',
        '2. Identify operational risks (downtime, service disruption, rollback complexity)',
        '3. Identify business risks (revenue impact, customer experience, SLA violations)',
        '4. Identify organizational risks (skill gaps, resistance to change, communication)',
        '5. Identify security risks (data exposure, vulnerability introduction, compliance)',
        '6. Identify schedule risks (delays, resource availability, dependencies)',
        '7. Identify cost risks (budget overruns, unexpected expenses)',
        '8. Assess likelihood and impact for each risk',
        '9. Develop mitigation strategies for critical and high risks',
        '10. Create contingency plans for high-impact risks',
        '11. Calculate overall risk level',
        '12. Generate comprehensive risk register and mitigation plan'
      ],
      outputFormat: 'JSON with risks (array), criticalRisks (array), highRisks (array), overallRiskLevel (string), mitigationPlan (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'criticalRisks', 'overallRiskLevel', 'mitigationPlan', 'artifacts'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              category: { type: 'string', enum: ['technical', 'operational', 'business', 'organizational', 'security', 'schedule', 'cost'] },
              description: { type: 'string' },
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              mitigationPlan: { type: 'string' },
              contingencyPlan: { type: 'string' },
              owner: { type: 'string' },
              phase: { type: 'string' }
            }
          }
        },
        criticalRisks: {
          type: 'array',
          items: { type: 'string' }
        },
        highRisks: {
          type: 'array',
          items: { type: 'string' }
        },
        overallRiskLevel: {
          type: 'string',
          enum: ['high', 'medium', 'low']
        },
        mitigationPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              strategy: { type: 'string' },
              actions: { type: 'array', items: { type: 'string' } },
              owner: { type: 'string' },
              timeline: { type: 'string' },
              successMetrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        riskMatrix: {
          type: 'object',
          description: 'Risk matrix visualization data'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-strategy', 'risk-assessment', 'risk-management', 'planning']
}));

// Task 6: Migration Roadmap
export const migrationRoadmapTask = defineTask('migration-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Migration Roadmap Development - ${args.projectName}`,
  agent: {
    name: 'roadmap-planner',
    prompt: {
      role: 'migration program manager specializing in phased transformation roadmaps',
      task: 'Develop detailed phased migration roadmap with milestones, dependencies, and success criteria',
      context: args,
      instructions: [
        '1. Break migration into logical phases based on strategy and gap analysis',
        '2. Define objectives, scope, and deliverables for each phase',
        '3. Sequence phases to minimize risk and maximize value delivery',
        '4. Identify dependencies between phases and activities',
        '5. Define milestones and success criteria for each phase',
        '6. Estimate effort, duration, and resources for each phase',
        '7. Plan for quick wins to demonstrate progress and build momentum',
        '8. Define quality gates and approval points',
        '9. Include buffer for risks and unknowns',
        '10. Create timeline with critical path analysis',
        '11. Generate Gantt chart or timeline visualization',
        '12. Generate comprehensive migration roadmap document'
      ],
      outputFormat: 'JSON with phases (array), timeline (object), dependencies (array), milestones (array), quickWins (array), criticalPath (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'milestones', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phaseNumber: { type: 'number' },
              phaseName: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              scope: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } },
              activities: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              effort: { type: 'string' },
              resources: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            buffer: { type: 'string' }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string', enum: ['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish'] },
              description: { type: 'string' }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              phase: { type: 'string' },
              targetDate: { type: 'string' },
              criteria: { type: 'string' },
              criticalPath: { type: 'boolean' }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              win: { type: 'string' },
              phase: { type: 'string' },
              value: { type: 'string' },
              effort: { type: 'string' }
            }
          }
        },
        criticalPath: {
          type: 'array',
          items: { type: 'string' }
        },
        ganttChart: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-strategy', 'roadmap', 'project-planning', 'scheduling']
}));

// Task 7: Data Migration Strategy
export const dataMigrationStrategyTask = defineTask('data-migration-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Data Migration Strategy - ${args.projectName}`,
  agent: {
    name: 'data-migration-specialist',
    prompt: {
      role: 'data migration architect specializing in large-scale data transitions',
      task: 'Design comprehensive data migration strategy including extraction, transformation, loading, and validation',
      context: args,
      instructions: [
        '1. Assess data migration complexity and volume',
        '2. Design data migration approach (cutover, trickle, parallel sync, hybrid)',
        '3. Plan data extraction from source systems',
        '4. Design data transformation and mapping logic',
        '5. Plan data loading and synchronization to target systems',
        '6. Design data validation and reconciliation strategy',
        '7. Plan for data quality improvement during migration',
        '8. Design rollback and recovery mechanisms for data',
        '9. Estimate data migration timeline and downtime requirements',
        '10. Identify data migration tools and technologies',
        '11. Plan for data migration testing and validation',
        '12. Generate comprehensive data migration plan document'
      ],
      outputFormat: 'JSON with strategy, approach, dataVolume, extractionPlan, transformationPlan, loadingPlan, validationPlan, tools, estimatedDuration, downtimeRequired, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'approach', 'dataVolume', 'estimatedDuration', 'artifacts'],
      properties: {
        strategy: {
          type: 'string',
          description: 'Overall data migration strategy description'
        },
        approach: {
          type: 'string',
          enum: ['big-bang-cutover', 'trickle-migration', 'parallel-sync', 'hybrid']
        },
        dataVolume: {
          type: 'object',
          properties: {
            totalRecords: { type: 'string' },
            totalSizeGB: { type: 'string' },
            breakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  entity: { type: 'string' },
                  records: { type: 'string' },
                  sizeGB: { type: 'string' }
                }
              }
            }
          }
        },
        extractionPlan: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            tools: { type: 'array', items: { type: 'string' } },
            schedule: { type: 'string' },
            incremental: { type: 'boolean' }
          }
        },
        transformationPlan: {
          type: 'object',
          properties: {
            mappings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  source: { type: 'string' },
                  target: { type: 'string' },
                  transformation: { type: 'string' }
                }
              }
            },
            dataQualityRules: { type: 'array', items: { type: 'string' } },
            cleansingStrategy: { type: 'string' }
          }
        },
        loadingPlan: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            tools: { type: 'array', items: { type: 'string' } },
            batchSize: { type: 'string' },
            parallelization: { type: 'boolean' }
          }
        },
        validationPlan: {
          type: 'object',
          properties: {
            reconciliationStrategy: { type: 'string' },
            validationChecks: { type: 'array', items: { type: 'string' } },
            acceptanceCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' },
              justification: { type: 'string' }
            }
          }
        },
        estimatedDuration: { type: 'string' },
        downtimeRequired: { type: 'string' },
        rollbackStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-strategy', 'data-migration', 'etl', 'planning']
}));

// Task 8: Testing and Validation Strategy
export const migrationTestingStrategyTask = defineTask('migration-testing-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Testing and Validation Strategy - ${args.projectName}`,
  agent: {
    name: 'test-strategist',
    prompt: {
      role: 'QA architect specializing in migration testing and validation',
      task: 'Design comprehensive testing strategy for migration including functional, performance, and acceptance testing',
      context: args,
      instructions: [
        '1. Define testing objectives and success criteria for migration',
        '2. Design test levels: unit, integration, system, UAT, performance, security',
        '3. Plan functional testing to validate feature parity',
        '4. Design performance testing to validate non-functional requirements',
        '5. Plan data validation and reconciliation testing',
        '6. Design user acceptance testing approach',
        '7. Plan production validation and smoke testing',
        '8. Define test data strategy and test environment requirements',
        '9. Plan for parallel testing (old vs new system)',
        '10. Estimate testing effort and timeline',
        '11. Identify testing tools and automation opportunities',
        '12. Generate comprehensive testing strategy document'
      ],
      outputFormat: 'JSON with strategy, testLevels (array), functionalTesting (object), performanceTesting (object), dataValidation (object), uat (object), testEnvironments (array), validationCriteria (array), estimatedEffort (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'testLevels', 'validationCriteria', 'estimatedEffort', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        testLevels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              scope: { type: 'string' },
              approach: { type: 'string' },
              coverage: { type: 'string' },
              tools: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        functionalTesting: {
          type: 'object',
          properties: {
            featureParityValidation: { type: 'string' },
            testScenarios: { type: 'array', items: { type: 'string' } },
            automationRatio: { type: 'string' }
          }
        },
        performanceTesting: {
          type: 'object',
          properties: {
            objectives: { type: 'array', items: { type: 'string' } },
            scenarios: { type: 'array', items: { type: 'string' } },
            successCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        dataValidation: {
          type: 'object',
          properties: {
            reconciliationApproach: { type: 'string' },
            validationChecks: { type: 'array', items: { type: 'string' } },
            acceptanceThreshold: { type: 'string' }
          }
        },
        uat: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            participants: { type: 'array', items: { type: 'string' } },
            duration: { type: 'string' },
            signoffCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        testEnvironments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              environment: { type: 'string' },
              purpose: { type: 'string' },
              configuration: { type: 'string' }
            }
          }
        },
        validationCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              measurement: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
        estimatedEffort: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-strategy', 'testing', 'validation', 'quality-assurance']
}));

// Task 9: Rollback and Contingency Planning
export const rollbackContingencyTask = defineTask('rollback-contingency', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Rollback and Contingency Planning - ${args.projectName}`,
  agent: {
    name: 'contingency-planner',
    prompt: {
      role: 'migration risk specialist focusing on rollback and contingency planning',
      task: 'Design comprehensive rollback and contingency plans for migration failure scenarios',
      context: args,
      instructions: [
        '1. Define rollback trigger conditions and decision criteria',
        '2. Design rollback procedures for each migration phase',
        '3. Plan for data rollback and consistency restoration',
        '4. Design application rollback procedures',
        '5. Plan for infrastructure rollback',
        '6. Estimate rollback time for each phase',
        '7. Identify point of no return for each phase',
        '8. Design contingency plans for partial failures',
        '9. Plan for communication during rollback scenarios',
        '10. Define rollback testing and validation',
        '11. Document rollback decision tree and escalation procedures',
        '12. Generate comprehensive rollback playbook'
      ],
      outputFormat: 'JSON with strategy, triggerConditions (array), rollbackProcedures (array), rollbackSteps (array), dataRollback (object), estimatedRollbackTime (string), pointOfNoReturn (object), contingencyPlans (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'triggerConditions', 'rollbackSteps', 'estimatedRollbackTime', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        triggerConditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium'] },
              decision: { type: 'string', enum: ['immediate-rollback', 'evaluate', 'proceed-with-fix'] },
              authority: { type: 'string' }
            }
          }
        },
        rollbackProcedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              procedure: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              estimatedTime: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        rollbackSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              action: { type: 'string' },
              owner: { type: 'string' },
              estimatedTime: { type: 'string' }
            }
          }
        },
        dataRollback: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            backupApproach: { type: 'string' },
            restoreProcess: { type: 'string' },
            validationSteps: { type: 'array', items: { type: 'string' } }
          }
        },
        estimatedRollbackTime: { type: 'string' },
        pointOfNoReturn: {
          type: 'object',
          properties: {
            phase: { type: 'string' },
            criteria: { type: 'string' },
            implications: { type: 'string' }
          }
        },
        contingencyPlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              impact: { type: 'string' },
              response: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        communicationPlan: {
          type: 'object',
          properties: {
            stakeholders: { type: 'array', items: { type: 'string' } },
            escalationPath: { type: 'array', items: { type: 'string' } },
            messageTemplates: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-strategy', 'rollback', 'contingency', 'risk-mitigation']
}));

// Task 10: Organizational Change Management
export const changeManagementTask = defineTask('change-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Organizational Change Management - ${args.projectName}`,
  agent: {
    name: 'change-manager',
    prompt: {
      role: 'organizational change management specialist',
      task: 'Develop comprehensive change management plan for migration including stakeholder management, training, and communication',
      context: args,
      instructions: [
        '1. Identify all stakeholders and assess change impact',
        '2. Develop stakeholder engagement and communication plan',
        '3. Design training program for new technology and processes',
        '4. Plan for knowledge transfer and documentation',
        '5. Address organizational resistance and change barriers',
        '6. Design change champion network and support structure',
        '7. Plan for post-migration support and stabilization',
        '8. Define success metrics for organizational adoption',
        '9. Estimate change management effort and resources',
        '10. Create communication schedule and content',
        '11. Plan for celebrating wins and building momentum',
        '12. Generate comprehensive change management plan'
      ],
      outputFormat: 'JSON with stakeholders (array), communicationPlan (object), trainingPlan (object), knowledgeTransfer (object), resistanceManagement (object), supportStructure (object), estimatedEffort (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholders', 'communicationPlan', 'trainingPlan', 'estimatedEffort', 'artifacts'],
      properties: {
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              group: { type: 'string' },
              impactLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
              concerns: { type: 'array', items: { type: 'string' } },
              engagementStrategy: { type: 'string' }
            }
          }
        },
        communicationPlan: {
          type: 'object',
          properties: {
            objectives: { type: 'array', items: { type: 'string' } },
            channels: { type: 'array', items: { type: 'string' } },
            schedule: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timing: { type: 'string' },
                  audience: { type: 'string' },
                  message: { type: 'string' },
                  channel: { type: 'string' }
                }
              }
            }
          }
        },
        trainingPlan: {
          type: 'object',
          properties: {
            objectives: { type: 'array', items: { type: 'string' } },
            programs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  program: { type: 'string' },
                  audience: { type: 'string' },
                  duration: { type: 'string' },
                  format: { type: 'string' },
                  topics: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            timeline: { type: 'string' },
            estimatedCost: { type: 'string' }
          }
        },
        knowledgeTransfer: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            documentation: { type: 'array', items: { type: 'string' } },
            mentoring: { type: 'string' },
            timeline: { type: 'string' }
          }
        },
        resistanceManagement: {
          type: 'object',
          properties: {
            anticipatedResistance: { type: 'array', items: { type: 'string' } },
            mitigationStrategies: { type: 'array', items: { type: 'string' } },
            changeChampions: { type: 'array', items: { type: 'string' } }
          }
        },
        supportStructure: {
          type: 'object',
          properties: {
            helpDesk: { type: 'string' },
            expertSupport: { type: 'string' },
            escalationPath: { type: 'array', items: { type: 'string' } },
            duration: { type: 'string' }
          }
        },
        estimatedEffort: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-strategy', 'change-management', 'training', 'communication']
}));

// Task 11: Cost-Benefit Analysis
export const costBenefitAnalysisTask = defineTask('cost-benefit-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Cost-Benefit Analysis - ${args.projectName}`,
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'IT financial analyst specializing in migration business cases',
      task: 'Conduct comprehensive cost-benefit analysis for migration strategy',
      context: args,
      instructions: [
        '1. Calculate total migration costs (development, infrastructure, tools, personnel, training)',
        '2. Estimate ongoing operational costs for target state',
        '3. Calculate cost savings from target state (infrastructure, licensing, operational efficiency)',
        '4. Quantify business benefits (improved performance, scalability, time to market)',
        '5. Calculate net present value (NPV) and return on investment (ROI)',
        '6. Determine payback period',
        '7. Assess opportunity costs and business value',
        '8. Conduct sensitivity analysis for key assumptions',
        '9. Compare costs vs alternative approaches (maintain current state, different strategy)',
        '10. Validate alignment with migration goals',
        '11. Provide financial recommendation and justification',
        '12. Generate comprehensive business case document'
      ],
      outputFormat: 'JSON with totalCost, costBreakdown (object), benefits (array), costSavings (object), roi (object), paybackPeriod (string), npv (object), businessCase (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCost', 'costBreakdown', 'benefits', 'roi', 'paybackPeriod', 'artifacts'],
      properties: {
        totalCost: { type: 'string' },
        costBreakdown: {
          type: 'object',
          properties: {
            development: { type: 'string' },
            infrastructure: { type: 'string' },
            tools: { type: 'string' },
            personnel: { type: 'string' },
            training: { type: 'string' },
            testing: { type: 'string' },
            contingency: { type: 'string' },
            other: { type: 'string' }
          }
        },
        ongoingCosts: {
          type: 'object',
          properties: {
            currentState: { type: 'string' },
            targetState: { type: 'string' },
            difference: { type: 'string' }
          }
        },
        benefits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              benefit: { type: 'string' },
              category: { type: 'string', enum: ['cost-savings', 'revenue-increase', 'efficiency', 'risk-reduction', 'strategic'] },
              quantified: { type: 'boolean' },
              value: { type: 'string' },
              timeframe: { type: 'string' }
            }
          }
        },
        costSavings: {
          type: 'object',
          properties: {
            year1: { type: 'string' },
            year2: { type: 'string' },
            year3: { type: 'string' },
            cumulative5Year: { type: 'string' }
          }
        },
        roi: {
          type: 'object',
          properties: {
            percentage: { type: 'string' },
            calculation: { type: 'string' },
            timeframe: { type: 'string' }
          }
        },
        paybackPeriod: { type: 'string' },
        npv: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            discountRate: { type: 'string' },
            timeframe: { type: 'string' }
          }
        },
        sensitivityAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              scenario: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        businessCase: { type: 'string' },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-strategy', 'cost-benefit', 'financial-analysis', 'business-case']
}));

// Task 12: Strategy Document Generation
export const strategyDocumentGenerationTask = defineTask('strategy-document-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Strategy Document Generation - ${args.projectName}`,
  agent: {
    name: 'strategy-writer',
    prompt: {
      role: 'senior technical writer and migration architect',
      task: 'Generate comprehensive, executive-ready migration strategy document consolidating all planning artifacts',
      context: args,
      instructions: [
        '1. Create executive summary with key recommendations and decision points',
        '2. Document current state assessment and target state vision',
        '3. Present gap analysis with prioritized remediation',
        '4. Explain migration strategy selection and rationale',
        '5. Detail phased migration roadmap with timelines',
        '6. Document data migration strategy and approach',
        '7. Present testing and validation strategy',
        '8. Detail rollback and contingency plans',
        '9. Present change management and training plans',
        '10. Include cost-benefit analysis and business case',
        '11. Document risk register and mitigation strategies',
        '12. Include appendices: architecture diagrams, detailed plans, decision matrices',
        '13. Format as professional Markdown document with visualizations',
        '14. Ensure document is actionable and ready for stakeholder approval',
        '15. Save strategy document to output directory'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, keyRecommendations (array), criticalDecisions (array), nextSteps (array), readinessScore (number 0-100), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'keyRecommendations', 'readinessScore', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyRecommendations: { type: 'array', items: { type: 'string' } },
        criticalDecisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              options: { type: 'array', items: { type: 'string' } },
              recommendation: { type: 'string' },
              authority: { type: 'string' }
            }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-strategy', 'documentation', 'strategy-document', 'deliverable']
}));

// Task 13: Strategy Validation
export const strategyValidationTask = defineTask('strategy-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Strategy Validation - ${args.projectName}`,
  agent: {
    name: 'strategy-validator',
    prompt: {
      role: 'principal architect and migration auditor',
      task: 'Validate migration strategy quality, completeness, and readiness for execution',
      context: args,
      instructions: [
        '1. Evaluate current state assessment completeness (weight: 10%)',
        '2. Assess target state design quality and goal alignment (weight: 15%)',
        '3. Validate gap analysis thoroughness (weight: 10%)',
        '4. Evaluate migration strategy feasibility and risk mitigation (weight: 20%)',
        '5. Assess roadmap clarity and achievability (weight: 15%)',
        '6. Validate data migration strategy completeness (weight: 10%)',
        '7. Evaluate testing strategy adequacy (weight: 10%)',
        '8. Assess rollback and contingency planning (weight: 5%)',
        '9. Evaluate change management completeness (weight: 5%)',
        '10. Calculate weighted overall score (0-100)',
        '11. Identify gaps and missing elements',
        '12. Provide specific recommendations for improvement',
        '13. Assess stakeholder approval readiness'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), completeness (object), gaps (array), recommendations (array), approvalReadiness (string), strengths (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'approvalReadiness', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            currentStateAssessment: { type: 'number' },
            targetStateDesign: { type: 'number' },
            gapAnalysis: { type: 'number' },
            migrationStrategy: { type: 'number' },
            roadmap: { type: 'number' },
            dataMigration: { type: 'number' },
            testing: { type: 'number' },
            rollback: { type: 'number' },
            changeManagement: { type: 'number' }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            allCriticalGapsAddressed: { type: 'boolean' },
            risksMitigated: { type: 'boolean' },
            feasibilityValidated: { type: 'boolean' },
            businessCaseJustified: { type: 'boolean' },
            stakeholdersIdentified: { type: 'boolean' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        approvalReadiness: {
          type: 'string',
          enum: ['ready', 'minor-revisions-needed', 'major-revisions-needed']
        },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['migration-strategy', 'validation', 'quality-assurance', 'approval']
}));
