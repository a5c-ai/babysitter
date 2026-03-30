/**
 * @process specializations/domains/business/project-management/risk-planning-assessment
 * @description Risk Planning and Assessment - Conduct risk identification workshops, qualitative and
 * quantitative analysis, response planning, and establish risk monitoring processes.
 * @inputs { projectName: string, projectContext: object, stakeholders?: array, existingRisks?: array }
 * @outputs { success: boolean, riskRegister: array, riskResponsePlan: object, riskManagementPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/risk-planning-assessment', {
 *   projectName: 'Data Center Migration',
 *   projectContext: { scope: 'Migrate 500 servers', timeline: '8 months', budget: 2000000 },
 *   stakeholders: [{ name: 'CIO', role: 'sponsor' }, { name: 'IT Director', role: 'owner' }],
 *   existingRisks: ['Data loss', 'Extended downtime']
 * });
 *
 * @references
 * - PMI PMBOK Risk Management: https://www.pmi.org/pmbok-guide-standards/foundational/pmbok
 * - Identifying and Managing Project Risk: https://www.amazon.com/Identifying-Managing-Project-Risk-Essential/dp/0814413404
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    projectContext,
    stakeholders = [],
    existingRisks = [],
    riskTolerance = 'moderate',
    organizationalContext = {}
  } = inputs;

  // Phase 1: Risk Management Planning
  const riskManagementPlan = await ctx.task(riskManagementPlanningTask, {
    projectName,
    projectContext,
    stakeholders,
    riskTolerance,
    organizationalContext
  });

  // Quality Gate: Risk management approach must be defined
  if (!riskManagementPlan.methodology || !riskManagementPlan.roles) {
    return {
      success: false,
      error: 'Risk management approach not properly defined',
      phase: 'planning',
      riskRegister: null
    };
  }

  // Breakpoint: Review risk management plan
  await ctx.breakpoint({
    question: `Review risk management plan for ${projectName}. Methodology: ${riskManagementPlan.methodology}. Risk tolerance: ${riskTolerance}. Proceed with risk identification?`,
    title: 'Risk Management Plan Review',
    context: {
      runId: ctx.runId,
      projectName,
      methodology: riskManagementPlan.methodology,
      tolerance: riskTolerance,
      files: [{
        path: `artifacts/phase1-risk-management-plan.json`,
        format: 'json',
        content: riskManagementPlan
      }]
    }
  });

  // Phase 2: Risk Identification
  const riskIdentification = await ctx.task(riskIdentificationTask, {
    projectName,
    projectContext,
    existingRisks,
    stakeholders,
    riskManagementPlan
  });

  // Phase 3: Risk Categorization
  const riskCategorization = await ctx.task(riskCategorizationTask, {
    projectName,
    identifiedRisks: riskIdentification.risks,
    riskManagementPlan
  });

  // Phase 4: Qualitative Risk Analysis
  const qualitativeAnalysis = await ctx.task(qualitativeRiskAnalysisTask, {
    projectName,
    categorizedRisks: riskCategorization.categorizedRisks,
    riskManagementPlan
  });

  // Quality Gate: High-priority risks identified
  const highPriorityRisks = qualitativeAnalysis.risks?.filter(r => r.priority === 'high') || [];
  if (highPriorityRisks.length === 0) {
    await ctx.breakpoint({
      question: `No high-priority risks identified for ${projectName}. Review analysis criteria or proceed with current assessment?`,
      title: 'Risk Priority Review',
      context: {
        runId: ctx.runId,
        totalRisks: qualitativeAnalysis.risks?.length || 0,
        recommendation: 'Review risk criteria and stakeholder input'
      }
    });
  }

  // Phase 5: Quantitative Risk Analysis (for high-priority risks)
  const quantitativeAnalysis = await ctx.task(quantitativeRiskAnalysisTask, {
    projectName,
    highPriorityRisks,
    projectContext,
    riskManagementPlan
  });

  // Phase 6: Risk Response Planning
  const riskResponsePlanning = await ctx.task(riskResponsePlanningTask, {
    projectName,
    analyzedRisks: qualitativeAnalysis.risks,
    quantitativeAnalysis,
    projectContext
  });

  // Phase 7: Contingency Planning
  const contingencyPlanning = await ctx.task(contingencyPlanningTask, {
    projectName,
    riskResponsePlanning,
    projectContext
  });

  // Phase 8: Risk Register Development
  const riskRegister = await ctx.task(riskRegisterDevelopmentTask, {
    projectName,
    qualitativeAnalysis,
    quantitativeAnalysis,
    riskResponsePlanning,
    contingencyPlanning
  });

  // Phase 9: Risk Monitoring Setup
  const riskMonitoringSetup = await ctx.task(riskMonitoringSetupTask, {
    projectName,
    riskRegister,
    riskManagementPlan
  });

  // Phase 10: Risk Documentation Generation
  const riskDocumentation = await ctx.task(riskDocumentationGenerationTask, {
    projectName,
    riskManagementPlan,
    riskRegister,
    riskResponsePlanning,
    contingencyPlanning,
    riskMonitoringSetup,
    quantitativeAnalysis
  });

  // Final Quality Gate
  const completenessScore = riskDocumentation.completenessScore || 0;
  const ready = completenessScore >= 80;

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Risk assessment complete for ${projectName}. Total risks: ${riskRegister.risks.length}, High priority: ${highPriorityRisks.length}. Completeness: ${completenessScore}/100. Approve?`,
    title: 'Risk Assessment Approval',
    context: {
      runId: ctx.runId,
      projectName,
      totalRisks: riskRegister.risks.length,
      highPriority: highPriorityRisks.length,
      expectedMonetaryValue: quantitativeAnalysis.totalEMV,
      files: [
        { path: `artifacts/risk-register.json`, format: 'json', content: riskRegister },
        { path: `artifacts/risk-management-plan.md`, format: 'markdown', content: riskDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    completenessScore,
    ready,
    riskRegister: riskRegister.risks,
    riskResponsePlan: {
      strategies: riskResponsePlanning.strategies,
      contingencyPlans: contingencyPlanning.plans,
      fallbackPlans: contingencyPlanning.fallbackPlans
    },
    riskManagementPlan: {
      methodology: riskManagementPlan.methodology,
      roles: riskManagementPlan.roles,
      processSchedule: riskManagementPlan.processSchedule,
      toleranceThresholds: riskManagementPlan.toleranceThresholds
    },
    quantitativeResults: {
      totalEMV: quantitativeAnalysis.totalEMV,
      contingencyRecommendation: quantitativeAnalysis.contingencyRecommendation,
      scheduleRisk: quantitativeAnalysis.scheduleRisk
    },
    monitoring: riskMonitoringSetup,
    topRisks: highPriorityRisks.slice(0, 10),
    recommendations: riskDocumentation.recommendations,
    metadata: {
      processId: 'specializations/domains/business/project-management/risk-planning-assessment',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const riskManagementPlanningTask = defineTask('risk-management-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Risk Management Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Management Professional',
      task: 'Develop risk management plan defining approach, roles, and processes',
      context: {
        projectName: args.projectName,
        projectContext: args.projectContext,
        stakeholders: args.stakeholders,
        riskTolerance: args.riskTolerance,
        organizationalContext: args.organizationalContext
      },
      instructions: [
        '1. Define risk management methodology and approach',
        '2. Establish risk management roles and responsibilities',
        '3. Define risk categories and breakdown structure',
        '4. Set probability and impact definitions/scales',
        '5. Define risk tolerance thresholds',
        '6. Establish risk scoring and prioritization criteria',
        '7. Define risk response strategy options',
        '8. Set risk review and audit schedule',
        '9. Define risk reporting requirements',
        '10. Document risk management budget and tools'
      ],
      outputFormat: 'JSON object with risk management plan'
    },
    outputSchema: {
      type: 'object',
      required: ['methodology', 'roles', 'probabilityScale', 'impactScale'],
      properties: {
        methodology: { type: 'string' },
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              assignee: { type: 'string' }
            }
          }
        },
        riskCategories: { type: 'array', items: { type: 'string' } },
        probabilityScale: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              description: { type: 'string' },
              range: { type: 'string' }
            }
          }
        },
        impactScale: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              cost: { type: 'string' },
              schedule: { type: 'string' },
              scope: { type: 'string' },
              quality: { type: 'string' }
            }
          }
        },
        toleranceThresholds: {
          type: 'object',
          properties: {
            cost: { type: 'string' },
            schedule: { type: 'string' },
            scope: { type: 'string' }
          }
        },
        processSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              frequency: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        reportingRequirements: { type: 'array', items: { type: 'string' } },
        tools: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'planning', 'management-plan']
}));

export const riskIdentificationTask = defineTask('risk-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Risk Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Analyst',
      task: 'Identify all potential project risks through systematic analysis',
      context: {
        projectName: args.projectName,
        projectContext: args.projectContext,
        existingRisks: args.existingRisks,
        stakeholders: args.stakeholders,
        riskManagementPlan: args.riskManagementPlan
      },
      instructions: [
        '1. Review project documents for risk indicators',
        '2. Apply checklist-based identification from risk categories',
        '3. Consider assumptions as potential risk sources',
        '4. Identify risks from constraints',
        '5. Review lessons learned from similar projects',
        '6. Consider external and environmental risks',
        '7. Identify technical and technology risks',
        '8. Consider resource and organizational risks',
        '9. Identify schedule and cost risks',
        '10. Document risk statements in cause-risk-effect format'
      ],
      outputFormat: 'JSON object with identified risks'
    },
    outputSchema: {
      type: 'object',
      required: ['risks'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              statement: { type: 'string' },
              cause: { type: 'string' },
              risk: { type: 'string' },
              effect: { type: 'string' },
              category: { type: 'string' },
              source: { type: 'string' },
              identifiedBy: { type: 'string' },
              dateIdentified: { type: 'string' }
            }
          }
        },
        identificationMethods: { type: 'array', items: { type: 'string' } },
        assumptionRisks: { type: 'array', items: { type: 'string' } },
        constraintRisks: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'identification', 'analysis']
}));

export const riskCategorizationTask = defineTask('risk-categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Risk Categorization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Manager',
      task: 'Categorize identified risks using Risk Breakdown Structure',
      context: {
        projectName: args.projectName,
        identifiedRisks: args.identifiedRisks,
        riskManagementPlan: args.riskManagementPlan
      },
      instructions: [
        '1. Apply Risk Breakdown Structure (RBS) categories',
        '2. Group risks by technical, external, organizational, project management',
        '3. Identify common root causes across risks',
        '4. Map risks to project phases/WBS elements',
        '5. Identify risk clusters and concentrations',
        '6. Tag risks with multiple applicable categories',
        '7. Identify cross-cutting risks',
        '8. Separate threats from opportunities',
        '9. Document categorization rationale',
        '10. Create risk category summary'
      ],
      outputFormat: 'JSON object with categorized risks'
    },
    outputSchema: {
      type: 'object',
      required: ['categorizedRisks', 'categoryBreakdown'],
      properties: {
        categorizedRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              statement: { type: 'string' },
              primaryCategory: { type: 'string' },
              secondaryCategories: { type: 'array', items: { type: 'string' } },
              projectPhase: { type: 'string' },
              wbsElement: { type: 'string' },
              riskType: { type: 'string', enum: ['threat', 'opportunity'] }
            }
          }
        },
        categoryBreakdown: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        riskClusters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cluster: { type: 'string' },
              rootCause: { type: 'string' },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        crossCuttingRisks: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'categorization', 'rbs']
}));

export const qualitativeRiskAnalysisTask = defineTask('qualitative-risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Qualitative Risk Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Analyst',
      task: 'Assess risk probability and impact to prioritize risks',
      context: {
        projectName: args.projectName,
        categorizedRisks: args.categorizedRisks,
        riskManagementPlan: args.riskManagementPlan
      },
      instructions: [
        '1. Assess probability of each risk occurring',
        '2. Assess impact on project objectives (cost, schedule, scope, quality)',
        '3. Calculate risk score (probability x impact)',
        '4. Apply probability-impact matrix',
        '5. Prioritize risks (high, medium, low)',
        '6. Assess risk urgency (how soon response needed)',
        '7. Evaluate risk manageability',
        '8. Assess data quality/confidence in assessment',
        '9. Identify risks requiring quantitative analysis',
        '10. Create prioritized risk list'
      ],
      outputFormat: 'JSON object with qualitative analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'probabilityImpactMatrix'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              statement: { type: 'string' },
              probability: { type: 'string', enum: ['very-high', 'high', 'medium', 'low', 'very-low'] },
              probabilityScore: { type: 'number' },
              impact: {
                type: 'object',
                properties: {
                  cost: { type: 'string' },
                  schedule: { type: 'string' },
                  scope: { type: 'string' },
                  quality: { type: 'string' },
                  overall: { type: 'string' }
                }
              },
              impactScore: { type: 'number' },
              riskScore: { type: 'number' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              urgency: { type: 'string', enum: ['immediate', 'near-term', 'long-term'] },
              manageability: { type: 'string', enum: ['high', 'medium', 'low'] },
              dataQuality: { type: 'string', enum: ['high', 'medium', 'low'] },
              requiresQuantitative: { type: 'boolean' }
            }
          }
        },
        probabilityImpactMatrix: { type: 'object' },
        risksByPriority: {
          type: 'object',
          properties: {
            critical: { type: 'array', items: { type: 'string' } },
            high: { type: 'array', items: { type: 'string' } },
            medium: { type: 'array', items: { type: 'string' } },
            low: { type: 'array', items: { type: 'string' } }
          }
        },
        watchList: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'qualitative-analysis', 'prioritization']
}));

export const quantitativeRiskAnalysisTask = defineTask('quantitative-risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Quantitative Risk Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Analyst with quantitative expertise',
      task: 'Numerically analyze high-priority risks and overall project risk',
      context: {
        projectName: args.projectName,
        highPriorityRisks: args.highPriorityRisks,
        projectContext: args.projectContext,
        riskManagementPlan: args.riskManagementPlan
      },
      instructions: [
        '1. Estimate cost impact range for each high-priority risk',
        '2. Estimate schedule impact range for each risk',
        '3. Calculate Expected Monetary Value (EMV) for each risk',
        '4. Sum EMV for total risk exposure',
        '5. Perform sensitivity analysis on key risks',
        '6. Identify risks with highest impact variability',
        '7. Recommend contingency reserve based on analysis',
        '8. Assess schedule risk and confidence levels',
        '9. Identify critical risks for project success',
        '10. Document quantitative analysis assumptions'
      ],
      outputFormat: 'JSON object with quantitative analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['analyzedRisks', 'totalEMV'],
      properties: {
        analyzedRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              statement: { type: 'string' },
              probabilityPercent: { type: 'number' },
              costImpact: {
                type: 'object',
                properties: {
                  low: { type: 'number' },
                  likely: { type: 'number' },
                  high: { type: 'number' }
                }
              },
              scheduleImpact: {
                type: 'object',
                properties: {
                  low: { type: 'number' },
                  likely: { type: 'number' },
                  high: { type: 'number' }
                }
              },
              emv: { type: 'number' }
            }
          }
        },
        totalEMV: { type: 'number' },
        sensitivityAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              sensitivityRating: { type: 'string' },
              impactVariability: { type: 'number' }
            }
          }
        },
        contingencyRecommendation: {
          type: 'object',
          properties: {
            costContingency: { type: 'number' },
            scheduleContingency: { type: 'string' },
            confidenceLevel: { type: 'number' }
          }
        },
        scheduleRisk: {
          type: 'object',
          properties: {
            p50Completion: { type: 'string' },
            p80Completion: { type: 'string' },
            p90Completion: { type: 'string' }
          }
        },
        criticalRisks: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'quantitative-analysis', 'emv']
}));

export const riskResponsePlanningTask = defineTask('risk-response-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Risk Response Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Response Planner',
      task: 'Develop response strategies for identified risks',
      context: {
        projectName: args.projectName,
        analyzedRisks: args.analyzedRisks,
        quantitativeAnalysis: args.quantitativeAnalysis,
        projectContext: args.projectContext
      },
      instructions: [
        '1. Select response strategy for each risk (avoid, transfer, mitigate, accept)',
        '2. For opportunities: exploit, share, enhance, accept',
        '3. Develop specific response actions for each risk',
        '4. Assign risk owners for each response',
        '5. Estimate cost of risk responses',
        '6. Identify secondary risks from responses',
        '7. Define residual risk after response',
        '8. Set target dates for response implementation',
        '9. Define triggers for response activation',
        '10. Document response effectiveness criteria'
      ],
      outputFormat: 'JSON object with risk response strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              statement: { type: 'string' },
              strategy: { type: 'string', enum: ['avoid', 'transfer', 'mitigate', 'accept', 'exploit', 'share', 'enhance'] },
              responseActions: { type: 'array', items: { type: 'string' } },
              owner: { type: 'string' },
              responseCost: { type: 'number' },
              secondaryRisks: { type: 'array', items: { type: 'string' } },
              residualRisk: { type: 'string' },
              targetDate: { type: 'string' },
              trigger: { type: 'string' },
              effectivenessCriteria: { type: 'string' }
            }
          }
        },
        totalResponseCost: { type: 'number' },
        acceptedRisks: { type: 'array', items: { type: 'string' } },
        secondaryRisksSummary: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'response-planning', 'mitigation']
}));

export const contingencyPlanningTask = defineTask('contingency-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Contingency Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Contingency Planner',
      task: 'Develop contingency and fallback plans for high-impact risks',
      context: {
        projectName: args.projectName,
        riskResponsePlanning: args.riskResponsePlanning,
        projectContext: args.projectContext
      },
      instructions: [
        '1. Identify risks requiring contingency plans',
        '2. Develop detailed contingency plan for each',
        '3. Define triggers for contingency activation',
        '4. Estimate contingency plan cost and duration',
        '5. Identify resources needed for contingency',
        '6. Develop fallback plans if primary response fails',
        '7. Define decision criteria for plan activation',
        '8. Assign contingency plan owners',
        '9. Document escalation procedures',
        '10. Create contingency reserve recommendations'
      ],
      outputFormat: 'JSON object with contingency plans'
    },
    outputSchema: {
      type: 'object',
      required: ['plans'],
      properties: {
        plans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              planName: { type: 'string' },
              trigger: { type: 'string' },
              actions: { type: 'array', items: { type: 'string' } },
              owner: { type: 'string' },
              estimatedCost: { type: 'number' },
              estimatedDuration: { type: 'string' },
              resourcesNeeded: { type: 'array', items: { type: 'string' } },
              decisionCriteria: { type: 'string' }
            }
          }
        },
        fallbackPlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              fallbackAction: { type: 'string' },
              trigger: { type: 'string' }
            }
          }
        },
        escalationProcedures: { type: 'array', items: { type: 'string' } },
        contingencyReserveRecommendation: {
          type: 'object',
          properties: {
            cost: { type: 'number' },
            schedule: { type: 'string' },
            justification: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'contingency', 'planning']
}));

export const riskRegisterDevelopmentTask = defineTask('risk-register-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Risk Register Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Documentation Specialist',
      task: 'Compile comprehensive risk register',
      context: {
        projectName: args.projectName,
        qualitativeAnalysis: args.qualitativeAnalysis,
        quantitativeAnalysis: args.quantitativeAnalysis,
        riskResponsePlanning: args.riskResponsePlanning,
        contingencyPlanning: args.contingencyPlanning
      },
      instructions: [
        '1. Compile all risk information into register format',
        '2. Include risk ID, statement, category',
        '3. Include probability and impact assessments',
        '4. Include risk scores and priority',
        '5. Include response strategy and actions',
        '6. Include risk owner and due dates',
        '7. Include current status and last update',
        '8. Include contingency plan references',
        '9. Include residual risk assessment',
        '10. Create summary statistics'
      ],
      outputFormat: 'JSON object with complete risk register'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'summary'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              statement: { type: 'string' },
              category: { type: 'string' },
              cause: { type: 'string' },
              effect: { type: 'string' },
              probability: { type: 'string' },
              impact: { type: 'string' },
              riskScore: { type: 'number' },
              priority: { type: 'string' },
              strategy: { type: 'string' },
              responseActions: { type: 'array', items: { type: 'string' } },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              status: { type: 'string', enum: ['identified', 'analyzing', 'responding', 'monitoring', 'closed'] },
              residualRisk: { type: 'string' },
              contingencyPlan: { type: 'string' },
              lastUpdated: { type: 'string' }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalRisks: { type: 'number' },
            byPriority: { type: 'object' },
            byCategory: { type: 'object' },
            byStatus: { type: 'object' },
            totalEMV: { type: 'number' }
          }
        },
        registerVersion: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'register', 'documentation']
}));

export const riskMonitoringSetupTask = defineTask('risk-monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Risk Monitoring Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Controller',
      task: 'Establish risk monitoring and control processes',
      context: {
        projectName: args.projectName,
        riskRegister: args.riskRegister,
        riskManagementPlan: args.riskManagementPlan
      },
      instructions: [
        '1. Define risk review meeting schedule',
        '2. Establish risk status reporting requirements',
        '3. Define risk metrics and KPIs',
        '4. Set up risk trigger monitoring',
        '5. Define risk audit schedule',
        '6. Establish early warning indicators',
        '7. Define risk escalation criteria and paths',
        '8. Set up risk tracking tools/systems',
        '9. Define risk closure criteria',
        '10. Document monitoring responsibilities'
      ],
      outputFormat: 'JSON object with risk monitoring setup'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewSchedule', 'metrics', 'escalationCriteria'],
      properties: {
        reviewSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              meeting: { type: 'string' },
              frequency: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } },
              agenda: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        reportingRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              report: { type: 'string' },
              frequency: { type: 'string' },
              audience: { type: 'array', items: { type: 'string' } },
              content: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              calculation: { type: 'string' },
              target: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        earlyWarningIndicators: { type: 'array', items: { type: 'string' } },
        escalationCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              escalateTo: { type: 'string' },
              timeframe: { type: 'string' }
            }
          }
        },
        closureCriteria: { type: 'array', items: { type: 'string' } },
        monitoringTools: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'monitoring', 'control']
}));

export const riskDocumentationGenerationTask = defineTask('risk-documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Risk Documentation Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Management Professional and Technical Writer',
      task: 'Generate comprehensive risk management documentation',
      context: {
        projectName: args.projectName,
        riskManagementPlan: args.riskManagementPlan,
        riskRegister: args.riskRegister,
        riskResponsePlanning: args.riskResponsePlanning,
        contingencyPlanning: args.contingencyPlanning,
        riskMonitoringSetup: args.riskMonitoringSetup,
        quantitativeAnalysis: args.quantitativeAnalysis
      },
      instructions: [
        '1. Compile risk management plan document',
        '2. Include risk register with all details',
        '3. Document response strategies and plans',
        '4. Include contingency plans',
        '5. Document monitoring and control processes',
        '6. Create executive risk summary',
        '7. Generate both JSON and markdown versions',
        '8. Calculate completeness score',
        '9. Identify gaps and recommendations',
        '10. Add version control information'
      ],
      outputFormat: 'JSON object with complete risk documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'completenessScore'],
      properties: {
        markdown: { type: 'string' },
        executiveSummary: { type: 'string' },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        documentControl: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            date: { type: 'string' },
            status: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'documentation', 'deliverable']
}));
