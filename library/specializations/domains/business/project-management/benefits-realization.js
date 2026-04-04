/**
 * @process specializations/domains/business/project-management/benefits-realization
 * @description Benefits Realization Management - Define benefit metrics, create realization plan, track benefits
 * delivery, and ensure intended business outcomes are achieved from project and program investments.
 * @inputs { programName: string, expectedBenefits: array, investmentAmount: number, stakeholders: array, timeline: object }
 * @outputs { success: boolean, benefitsFramework: object, realizationPlan: object, trackingMetrics: object, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/benefits-realization', {
 *   programName: 'Customer Experience Transformation',
 *   expectedBenefits: [{ id: 'B001', name: 'Revenue Increase', category: 'financial', target: 5000000 }],
 *   investmentAmount: 3000000,
 *   stakeholders: [{ name: 'CFO', role: 'benefit-owner' }, { name: 'CTO', role: 'enabler' }],
 *   timeline: { startDate: '2024-01-01', benefitsWindow: 36 }
 * });
 *
 * @references
 * - MSP (Managing Successful Programmes): https://www.axelos.com/certifications/msp
 * - PMI Benefits Realization Management: https://www.pmi.org/learning/library/benefits-realization-management-framework-10206
 * - Gartner Benefits Management: https://www.gartner.com/en/documents/3895263
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    programName,
    expectedBenefits = [],
    investmentAmount,
    stakeholders = [],
    timeline = {},
    currency = 'USD',
    trackingFrequency = 'quarterly',
    benefitCategories = ['financial', 'operational', 'strategic', 'customer', 'employee']
  } = inputs;

  // Phase 1: Benefits Definition and Validation
  const benefitsDefinition = await ctx.task(benefitsDefinitionTask, {
    programName,
    expectedBenefits,
    investmentAmount,
    benefitCategories,
    currency
  });

  // Quality Gate: Benefits must be well-defined
  if (!benefitsDefinition.benefitsValidated || benefitsDefinition.validBenefits < 1) {
    return {
      success: false,
      error: 'Benefits not properly defined or measurable',
      issues: benefitsDefinition.issues,
      phase: 'benefits-definition',
      benefitsFramework: null
    };
  }

  // Phase 2: Benefits Mapping and Dependencies
  const benefitsMapping = await ctx.task(benefitsMappingTask, {
    programName,
    benefits: benefitsDefinition.definedBenefits,
    timeline
  });

  // Phase 3: Benefit Owner Assignment
  const ownerAssignment = await ctx.task(benefitOwnerAssignmentTask, {
    programName,
    benefits: benefitsDefinition.definedBenefits,
    stakeholders,
    benefitsMapping
  });

  // Breakpoint: Review benefit ownership
  await ctx.breakpoint({
    question: `Review benefit ownership assignments for ${programName}. ${ownerAssignment.assignedBenefits} of ${benefitsDefinition.validBenefits} benefits have owners. Confirm assignments?`,
    title: 'Benefit Ownership Review',
    context: {
      runId: ctx.runId,
      programName,
      ownershipMatrix: ownerAssignment.ownershipMatrix,
      unassignedBenefits: ownerAssignment.unassignedBenefits,
      files: [{
        path: `artifacts/benefit-ownership.json`,
        format: 'json',
        content: ownerAssignment
      }]
    }
  });

  // Phase 4: Baseline Establishment
  const baselineEstablishment = await ctx.task(baselineEstablishmentTask, {
    programName,
    benefits: benefitsDefinition.definedBenefits,
    timeline
  });

  // Phase 5: Benefits Realization Plan Development
  const realizationPlan = await ctx.task(realizationPlanDevelopmentTask, {
    programName,
    benefits: benefitsDefinition.definedBenefits,
    benefitsMapping,
    ownerAssignment,
    baselineEstablishment,
    timeline,
    trackingFrequency
  });

  // Phase 6: Metrics and KPI Definition
  const metricsDefinition = await ctx.task(metricsDefinitionTask, {
    programName,
    benefits: benefitsDefinition.definedBenefits,
    realizationPlan,
    trackingFrequency
  });

  // Phase 7: Measurement Approach Design
  const measurementApproach = await ctx.task(measurementApproachTask, {
    programName,
    metricsDefinition,
    baselineEstablishment,
    trackingFrequency
  });

  // Phase 8: Benefits Tracking Dashboard Design
  const dashboardDesign = await ctx.task(trackingDashboardDesignTask, {
    programName,
    metricsDefinition,
    realizationPlan,
    measurementApproach
  });

  // Phase 9: Risk and Dis-benefit Analysis
  const riskAnalysis = await ctx.task(benefitsRiskAnalysisTask, {
    programName,
    benefits: benefitsDefinition.definedBenefits,
    realizationPlan,
    investmentAmount
  });

  // Quality Gate: Check for critical benefit risks
  if (riskAnalysis.criticalRisks && riskAnalysis.criticalRisks.length > 0) {
    await ctx.breakpoint({
      question: `${riskAnalysis.criticalRisks.length} critical risks identified that may prevent benefit realization. Review risk mitigation strategies?`,
      title: 'Critical Benefit Risk Alert',
      context: {
        runId: ctx.runId,
        criticalRisks: riskAnalysis.criticalRisks,
        disBenefits: riskAnalysis.disBenefits,
        recommendation: 'Address critical risks before proceeding with benefit commitments'
      }
    });
  }

  // Phase 10: Governance Framework
  const governanceFramework = await ctx.task(benefitsGovernanceTask, {
    programName,
    stakeholders,
    realizationPlan,
    metricsDefinition,
    trackingFrequency
  });

  // Phase 11: Benefits Case Documentation
  const benefitsCase = await ctx.task(benefitsCaseDocumentationTask, {
    programName,
    benefitsDefinition,
    benefitsMapping,
    ownerAssignment,
    baselineEstablishment,
    realizationPlan,
    metricsDefinition,
    measurementApproach,
    riskAnalysis,
    governanceFramework,
    investmentAmount,
    currency
  });

  // Phase 12: Implementation Readiness Assessment
  const readinessAssessment = await ctx.task(implementationReadinessTask, {
    programName,
    benefitsCase,
    ownerAssignment,
    governanceFramework,
    measurementApproach
  });

  // Final Breakpoint: Benefits Framework Approval
  const readinessScore = readinessAssessment.readinessScore || 0;
  const ready = readinessScore >= 75;

  await ctx.breakpoint({
    question: `Benefits realization framework complete for ${programName}. Expected total benefits: ${currency} ${benefitsDefinition.totalBenefitValue?.toLocaleString()}. Readiness score: ${readinessScore}/100. Approve framework?`,
    title: 'Benefits Framework Approval',
    context: {
      runId: ctx.runId,
      programName,
      totalBenefits: benefitsDefinition.totalBenefitValue,
      investmentAmount,
      roi: ((benefitsDefinition.totalBenefitValue - investmentAmount) / investmentAmount * 100).toFixed(1),
      readinessStatus: ready ? 'Ready for implementation' : 'Needs improvement',
      files: [
        { path: `artifacts/benefits-case.json`, format: 'json', content: benefitsCase },
        { path: `artifacts/benefits-case.md`, format: 'markdown', content: benefitsCase.markdown }
      ]
    }
  });

  return {
    success: true,
    programName,
    readinessScore,
    ready,
    benefitsFramework: {
      totalBenefits: benefitsDefinition.validBenefits,
      totalBenefitValue: benefitsDefinition.totalBenefitValue,
      benefitsByCategory: benefitsDefinition.benefitsByCategory,
      benefitMap: benefitsMapping.benefitMap,
      dependencies: benefitsMapping.dependencies
    },
    realizationPlan: {
      phases: realizationPlan.phases,
      milestones: realizationPlan.milestones,
      timelineMonths: realizationPlan.totalDuration,
      quickWins: realizationPlan.quickWins,
      criticalPath: realizationPlan.criticalPath
    },
    trackingMetrics: {
      kpis: metricsDefinition.kpis,
      measurementMethods: measurementApproach.methods,
      trackingFrequency,
      dashboardComponents: dashboardDesign.components,
      baselineValues: baselineEstablishment.baselines
    },
    ownership: {
      ownershipMatrix: ownerAssignment.ownershipMatrix,
      accountabilityStructure: governanceFramework.accountabilityStructure
    },
    risks: {
      totalRisks: riskAnalysis.totalRisks,
      criticalRisks: riskAnalysis.criticalRisks,
      disBenefits: riskAnalysis.disBenefits,
      mitigationStrategies: riskAnalysis.mitigationStrategies
    },
    governance: {
      reviewCadence: governanceFramework.reviewCadence,
      escalationPath: governanceFramework.escalationPath,
      decisionRights: governanceFramework.decisionRights
    },
    recommendations: readinessAssessment.recommendations,
    benefitsCase: benefitsCase.document,
    metadata: {
      processId: 'specializations/domains/business/project-management/benefits-realization',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const benefitsDefinitionTask = defineTask('benefits-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Benefits Definition and Validation - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Benefits Management Specialist',
      task: 'Define and validate expected benefits with clear measures and targets',
      context: {
        programName: args.programName,
        expectedBenefits: args.expectedBenefits,
        investmentAmount: args.investmentAmount,
        benefitCategories: args.benefitCategories,
        currency: args.currency
      },
      instructions: [
        '1. Review and refine each expected benefit',
        '2. Ensure benefits are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)',
        '3. Categorize benefits (financial, operational, strategic, customer, employee)',
        '4. Quantify financial benefits with clear calculations',
        '5. Define qualitative benefits with measurable proxies',
        '6. Validate benefit targets are realistic and achievable',
        '7. Identify dis-benefits (negative impacts) to consider',
        '8. Calculate total expected benefit value',
        '9. Validate benefits justify the investment (ROI)',
        '10. Document benefit assumptions and dependencies'
      ],
      outputFormat: 'JSON object with validated benefits definition'
    },
    outputSchema: {
      type: 'object',
      required: ['definedBenefits', 'benefitsValidated', 'validBenefits', 'totalBenefitValue'],
      properties: {
        definedBenefits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              benefitId: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              type: { type: 'string', enum: ['financial', 'non-financial'] },
              measurementUnit: { type: 'string' },
              baselineValue: { type: 'number' },
              targetValue: { type: 'number' },
              monetaryValue: { type: 'number' },
              timing: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              assumptions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        benefitsValidated: { type: 'boolean' },
        validBenefits: { type: 'number' },
        invalidBenefits: { type: 'array' },
        totalBenefitValue: { type: 'number' },
        benefitsByCategory: { type: 'object' },
        disBenefitsIdentified: { type: 'array' },
        roi: { type: 'number' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['benefits', 'definition', 'validation', 'brm']
}));

export const benefitsMappingTask = defineTask('benefits-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Benefits Mapping and Dependencies - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Program Architect with expertise in benefits mapping',
      task: 'Create benefits map showing relationships, dependencies, and enablers',
      context: {
        programName: args.programName,
        benefits: args.benefits,
        timeline: args.timeline
      },
      instructions: [
        '1. Create benefit dependency map (which benefits enable others)',
        '2. Identify capability changes required for each benefit',
        '3. Map benefits to program deliverables/outputs',
        '4. Identify outcome chains (output -> outcome -> benefit)',
        '5. Sequence benefits based on dependencies',
        '6. Identify leading and lagging indicators for each benefit',
        '7. Map external dependencies and assumptions',
        '8. Create visual benefits map structure',
        '9. Identify benefit clusters and themes',
        '10. Document benefit realization pathways'
      ],
      outputFormat: 'JSON object with benefits mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['benefitMap', 'dependencies', 'outcomeChains'],
      properties: {
        benefitMap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              benefitId: { type: 'string' },
              enablers: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } },
              capabilityChanges: { type: 'array', items: { type: 'string' } },
              leadingIndicators: { type: 'array', items: { type: 'string' } },
              laggingIndicators: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              benefitId: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } },
              enables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        outcomeChains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              chain: { type: 'string' },
              outputs: { type: 'array', items: { type: 'string' } },
              outcomes: { type: 'array', items: { type: 'string' } },
              benefits: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        benefitClusters: { type: 'array' },
        externalDependencies: { type: 'array', items: { type: 'string' } },
        realizationSequence: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['benefits', 'mapping', 'dependencies', 'brm']
}));

export const benefitOwnerAssignmentTask = defineTask('benefit-owner-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Benefit Owner Assignment - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Program Manager with expertise in stakeholder management',
      task: 'Assign benefit owners and define accountability structure',
      context: {
        programName: args.programName,
        benefits: args.benefits,
        stakeholders: args.stakeholders,
        benefitsMapping: args.benefitsMapping
      },
      instructions: [
        '1. Identify appropriate owner for each benefit (has authority and accountability)',
        '2. Ensure owners are at appropriate organizational level',
        '3. Assign supporting stakeholders for each benefit',
        '4. Define owner responsibilities and accountabilities',
        '5. Create RACI matrix for benefit delivery',
        '6. Identify capability/change owners vs. benefit owners',
        '7. Ensure no orphan benefits (all have owners)',
        '8. Define escalation paths for benefit issues',
        '9. Document owner acceptance and commitment',
        '10. Create ownership communication plan'
      ],
      outputFormat: 'JSON object with benefit ownership assignments'
    },
    outputSchema: {
      type: 'object',
      required: ['ownershipMatrix', 'assignedBenefits'],
      properties: {
        ownershipMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              benefitId: { type: 'string' },
              benefitName: { type: 'string' },
              owner: { type: 'string' },
              ownerRole: { type: 'string' },
              supporters: { type: 'array', items: { type: 'string' } },
              responsibilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        assignedBenefits: { type: 'number' },
        unassignedBenefits: { type: 'array' },
        raciMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              responsible: { type: 'string' },
              accountable: { type: 'string' },
              consulted: { type: 'array', items: { type: 'string' } },
              informed: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        escalationPaths: { type: 'array' },
        commitmentStatus: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['benefits', 'ownership', 'accountability', 'brm']
}));

export const baselineEstablishmentTask = defineTask('baseline-establishment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Baseline Establishment - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Measurement Analyst',
      task: 'Establish baselines for all benefit metrics',
      context: {
        programName: args.programName,
        benefits: args.benefits,
        timeline: args.timeline
      },
      instructions: [
        '1. Identify current state measurements for each benefit',
        '2. Collect baseline data from appropriate sources',
        '3. Validate baseline data quality and reliability',
        '4. Document data collection methodology for each baseline',
        '5. Establish baseline date and period covered',
        '6. Identify baseline data gaps and estimation approach',
        '7. Create baseline documentation with evidence',
        '8. Define baseline refresh/update triggers',
        '9. Establish baseline approval process',
        '10. Document baseline assumptions and limitations'
      ],
      outputFormat: 'JSON object with baseline establishment'
    },
    outputSchema: {
      type: 'object',
      required: ['baselines', 'baselineDate'],
      properties: {
        baselines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              benefitId: { type: 'string' },
              metricName: { type: 'string' },
              baselineValue: { type: 'number' },
              unit: { type: 'string' },
              dataSource: { type: 'string' },
              collectionMethod: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              dataPeriod: { type: 'string' }
            }
          }
        },
        baselineDate: { type: 'string' },
        dataGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              benefitId: { type: 'string' },
              gap: { type: 'string' },
              mitigationApproach: { type: 'string' }
            }
          }
        },
        baselineAssumptions: { type: 'array', items: { type: 'string' } },
        refreshTriggers: { type: 'array', items: { type: 'string' } },
        approvalStatus: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['benefits', 'baseline', 'measurement', 'brm']
}));

export const realizationPlanDevelopmentTask = defineTask('realization-plan-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Benefits Realization Plan Development - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Benefits Realization Manager',
      task: 'Develop comprehensive benefits realization plan with phases and milestones',
      context: {
        programName: args.programName,
        benefits: args.benefits,
        benefitsMapping: args.benefitsMapping,
        ownerAssignment: args.ownerAssignment,
        baselineEstablishment: args.baselineEstablishment,
        timeline: args.timeline,
        trackingFrequency: args.trackingFrequency
      },
      instructions: [
        '1. Define benefit realization phases aligned with program delivery',
        '2. Create timeline for each benefit with key milestones',
        '3. Identify quick wins (benefits achievable early)',
        '4. Define critical path for benefit realization',
        '5. Specify transition activities needed for benefit capture',
        '6. Plan business change activities required',
        '7. Define review and checkpoint schedule',
        '8. Create benefit realization roadmap',
        '9. Identify enablers and pre-requisites by phase',
        '10. Document assumptions and constraints'
      ],
      outputFormat: 'JSON object with realization plan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'milestones', 'totalDuration'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              benefits: { type: 'array', items: { type: 'string' } },
              enablers: { type: 'array', items: { type: 'string' } },
              transitionActivities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              date: { type: 'string' },
              benefits: { type: 'array', items: { type: 'string' } },
              criteria: { type: 'string' }
            }
          }
        },
        totalDuration: { type: 'number' },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              benefitId: { type: 'string' },
              expectedDate: { type: 'string' },
              value: { type: 'number' }
            }
          }
        },
        criticalPath: { type: 'array', items: { type: 'string' } },
        changeActivities: { type: 'array' },
        checkpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              checkpoint: { type: 'string' },
              date: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        roadmap: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['benefits', 'realization-plan', 'planning', 'brm']
}));

export const metricsDefinitionTask = defineTask('metrics-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Metrics and KPI Definition - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Metrics Specialist',
      task: 'Define comprehensive metrics and KPIs for benefit tracking',
      context: {
        programName: args.programName,
        benefits: args.benefits,
        realizationPlan: args.realizationPlan,
        trackingFrequency: args.trackingFrequency
      },
      instructions: [
        '1. Define KPIs for each benefit (leading and lagging)',
        '2. Specify metric calculation formulas',
        '3. Define target values and thresholds (red/amber/green)',
        '4. Establish measurement frequency for each metric',
        '5. Identify data sources for each metric',
        '6. Define metric ownership and reporting responsibility',
        '7. Create metric hierarchy (operational to strategic)',
        '8. Define aggregation rules for portfolio view',
        '9. Specify variance tolerance levels',
        '10. Document metric definitions in data dictionary'
      ],
      outputFormat: 'JSON object with metrics definition'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'metricDefinitions'],
      properties: {
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kpiId: { type: 'string' },
              benefitId: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['leading', 'lagging'] },
              formula: { type: 'string' },
              unit: { type: 'string' },
              frequency: { type: 'string' },
              dataSource: { type: 'string' },
              owner: { type: 'string' },
              target: { type: 'number' },
              thresholds: {
                type: 'object',
                properties: {
                  green: { type: 'number' },
                  amber: { type: 'number' },
                  red: { type: 'number' }
                }
              }
            }
          }
        },
        metricDefinitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              definition: { type: 'string' },
              calculation: { type: 'string' },
              dataElements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        metricHierarchy: { type: 'object' },
        aggregationRules: { type: 'array' },
        varianceTolerances: { type: 'object' },
        dataDictionary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['benefits', 'metrics', 'kpis', 'brm']
}));

export const measurementApproachTask = defineTask('measurement-approach', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Measurement Approach Design - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Measurement Systems Analyst',
      task: 'Design comprehensive measurement approach and data collection processes',
      context: {
        programName: args.programName,
        metricsDefinition: args.metricsDefinition,
        baselineEstablishment: args.baselineEstablishment,
        trackingFrequency: args.trackingFrequency
      },
      instructions: [
        '1. Design data collection processes for each metric',
        '2. Identify automation opportunities for measurement',
        '3. Define data quality controls and validation',
        '4. Establish data integration requirements',
        '5. Design measurement sampling approach where applicable',
        '6. Define attribution methodology (isolate benefit from other factors)',
        '7. Create measurement calendar and schedule',
        '8. Design data storage and retention approach',
        '9. Define measurement audit process',
        '10. Document measurement limitations and assumptions'
      ],
      outputFormat: 'JSON object with measurement approach'
    },
    outputSchema: {
      type: 'object',
      required: ['methods', 'dataCollection', 'attributionApproach'],
      properties: {
        methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricId: { type: 'string' },
              collectionMethod: { type: 'string' },
              frequency: { type: 'string' },
              responsible: { type: 'string' },
              automationLevel: { type: 'string', enum: ['manual', 'semi-automated', 'automated'] }
            }
          }
        },
        dataCollection: {
          type: 'object',
          properties: {
            sources: { type: 'array', items: { type: 'string' } },
            integrations: { type: 'array', items: { type: 'string' } },
            qualityControls: { type: 'array', items: { type: 'string' } }
          }
        },
        attributionApproach: {
          type: 'object',
          properties: {
            methodology: { type: 'string' },
            controlGroups: { type: 'boolean' },
            isolationTechniques: { type: 'array', items: { type: 'string' } }
          }
        },
        measurementCalendar: { type: 'array' },
        auditProcess: { type: 'string' },
        dataRetention: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['benefits', 'measurement', 'data-collection', 'brm']
}));

export const trackingDashboardDesignTask = defineTask('tracking-dashboard-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Benefits Tracking Dashboard Design - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Intelligence Designer',
      task: 'Design benefits tracking dashboard and reporting structure',
      context: {
        programName: args.programName,
        metricsDefinition: args.metricsDefinition,
        realizationPlan: args.realizationPlan,
        measurementApproach: args.measurementApproach
      },
      instructions: [
        '1. Design executive summary dashboard view',
        '2. Create benefit-by-benefit tracking view',
        '3. Design trend analysis visualizations',
        '4. Create variance analysis displays',
        '5. Design milestone tracking view',
        '6. Include leading indicator early warning displays',
        '7. Create drill-down capability specifications',
        '8. Design comparative analysis views (planned vs. actual)',
        '9. Specify reporting cadence and distribution',
        '10. Define alert and notification triggers'
      ],
      outputFormat: 'JSON object with dashboard design'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'views', 'reportingCadence'],
      properties: {
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              componentId: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } },
              visualization: { type: 'string' }
            }
          }
        },
        views: {
          type: 'object',
          properties: {
            executive: { type: 'object' },
            operational: { type: 'object' },
            detailed: { type: 'object' }
          }
        },
        reportingCadence: {
          type: 'object',
          properties: {
            executive: { type: 'string' },
            operational: { type: 'string' },
            adhoc: { type: 'string' }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              condition: { type: 'string' },
              recipients: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        drillDownPaths: { type: 'array' },
        distributionList: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['benefits', 'dashboard', 'reporting', 'brm']
}));

export const benefitsRiskAnalysisTask = defineTask('benefits-risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Risk and Dis-benefit Analysis - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Management Specialist',
      task: 'Analyze risks to benefit realization and identify potential dis-benefits',
      context: {
        programName: args.programName,
        benefits: args.benefits,
        realizationPlan: args.realizationPlan,
        investmentAmount: args.investmentAmount
      },
      instructions: [
        '1. Identify risks to each benefit realization',
        '2. Assess probability and impact of each risk',
        '3. Identify dis-benefits (negative outcomes)',
        '4. Quantify potential dis-benefit impacts',
        '5. Develop risk mitigation strategies',
        '6. Create risk response plans',
        '7. Define risk triggers and early warning signs',
        '8. Assign risk owners',
        '9. Calculate risk-adjusted benefit values',
        '10. Recommend risk management approach'
      ],
      outputFormat: 'JSON object with risk analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalRisks', 'criticalRisks', 'disBenefits'],
      properties: {
        benefitRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              benefitId: { type: 'string' },
              risks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    riskId: { type: 'string' },
                    description: { type: 'string' },
                    probability: { type: 'string', enum: ['high', 'medium', 'low'] },
                    impact: { type: 'string', enum: ['high', 'medium', 'low'] },
                    riskLevel: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        totalRisks: { type: 'number' },
        criticalRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              benefitId: { type: 'string' },
              description: { type: 'string' },
              mitigationStrategy: { type: 'string' }
            }
          }
        },
        disBenefits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              disBenefitId: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'number' },
              mitigation: { type: 'string' }
            }
          }
        },
        mitigationStrategies: { type: 'array' },
        riskOwners: { type: 'object' },
        riskAdjustedValues: { type: 'object' },
        earlyWarnings: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['benefits', 'risk-analysis', 'dis-benefits', 'brm']
}));

export const benefitsGovernanceTask = defineTask('benefits-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Governance Framework - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Governance Specialist',
      task: 'Establish governance framework for benefits realization management',
      context: {
        programName: args.programName,
        stakeholders: args.stakeholders,
        realizationPlan: args.realizationPlan,
        metricsDefinition: args.metricsDefinition,
        trackingFrequency: args.trackingFrequency
      },
      instructions: [
        '1. Define governance structure for benefits management',
        '2. Establish review cadence and meeting structure',
        '3. Define decision rights and approval authorities',
        '4. Create escalation paths and triggers',
        '5. Define roles in benefits governance (board, owners, etc.)',
        '6. Establish change control for benefit targets',
        '7. Define reporting requirements by stakeholder level',
        '8. Create accountability structure',
        '9. Define audit and assurance approach',
        '10. Document governance procedures and templates'
      ],
      outputFormat: 'JSON object with governance framework'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewCadence', 'accountabilityStructure', 'decisionRights'],
      properties: {
        governanceStructure: {
          type: 'object',
          properties: {
            benefitsBoard: { type: 'object' },
            workingGroups: { type: 'array' },
            reportingLines: { type: 'object' }
          }
        },
        reviewCadence: {
          type: 'object',
          properties: {
            boardReviews: { type: 'string' },
            operationalReviews: { type: 'string' },
            ownerReviews: { type: 'string' }
          }
        },
        decisionRights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              authority: { type: 'string' },
              escalation: { type: 'string' }
            }
          }
        },
        escalationPath: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              level1: { type: 'string' },
              level2: { type: 'string' },
              level3: { type: 'string' }
            }
          }
        },
        accountabilityStructure: { type: 'object' },
        changeControl: { type: 'object' },
        auditApproach: { type: 'string' },
        templates: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['benefits', 'governance', 'accountability', 'brm']
}));

export const benefitsCaseDocumentationTask = defineTask('benefits-case-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Benefits Case Documentation - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Benefits Management Technical Writer',
      task: 'Create comprehensive benefits case documentation',
      context: {
        programName: args.programName,
        benefitsDefinition: args.benefitsDefinition,
        benefitsMapping: args.benefitsMapping,
        ownerAssignment: args.ownerAssignment,
        baselineEstablishment: args.baselineEstablishment,
        realizationPlan: args.realizationPlan,
        metricsDefinition: args.metricsDefinition,
        measurementApproach: args.measurementApproach,
        riskAnalysis: args.riskAnalysis,
        governanceFramework: args.governanceFramework,
        investmentAmount: args.investmentAmount,
        currency: args.currency
      },
      instructions: [
        '1. Create executive summary of benefits case',
        '2. Document all defined benefits with details',
        '3. Include benefits map and dependencies',
        '4. Present ownership and accountability matrix',
        '5. Document baselines and targets',
        '6. Include realization plan and timeline',
        '7. Present metrics and measurement approach',
        '8. Document risks and mitigation strategies',
        '9. Include governance framework',
        '10. Generate both JSON and markdown versions',
        '11. Include approval section and sign-off',
        '12. Provide appendices with detailed data'
      ],
      outputFormat: 'JSON object with complete benefits case'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'markdown'],
      properties: {
        document: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            programOverview: { type: 'object' },
            benefitsDefinition: { type: 'object' },
            benefitsMap: { type: 'object' },
            ownershipMatrix: { type: 'object' },
            baselines: { type: 'object' },
            realizationPlan: { type: 'object' },
            metrics: { type: 'object' },
            risks: { type: 'object' },
            governance: { type: 'object' },
            approvals: { type: 'object' }
          }
        },
        markdown: { type: 'string' },
        appendices: { type: 'array' },
        version: { type: 'string' },
        lastUpdated: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['benefits', 'documentation', 'benefits-case', 'brm']
}));

export const implementationReadinessTask = defineTask('implementation-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Implementation Readiness Assessment - ${args.programName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Benefits Implementation Advisor',
      task: 'Assess readiness to implement benefits realization framework',
      context: {
        programName: args.programName,
        benefitsCase: args.benefitsCase,
        ownerAssignment: args.ownerAssignment,
        governanceFramework: args.governanceFramework,
        measurementApproach: args.measurementApproach
      },
      instructions: [
        '1. Assess benefits definition completeness',
        '2. Evaluate ownership commitment level',
        '3. Assess baseline data availability',
        '4. Evaluate measurement capability readiness',
        '5. Assess governance structure adequacy',
        '6. Evaluate stakeholder engagement level',
        '7. Assess tool and system readiness',
        '8. Identify implementation gaps',
        '9. Calculate overall readiness score',
        '10. Provide prioritized recommendations'
      ],
      outputFormat: 'JSON object with readiness assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['readinessScore', 'assessmentAreas', 'recommendations'],
      properties: {
        readinessScore: { type: 'number' },
        assessmentAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              score: { type: 'number' },
              status: { type: 'string', enum: ['ready', 'partial', 'not-ready'] },
              gaps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        overallStatus: { type: 'string', enum: ['ready', 'partial', 'not-ready'] },
        criticalGaps: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'number' },
              recommendation: { type: 'string' },
              area: { type: 'string' },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        implementationRoadmap: { type: 'object' },
        nextSteps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['benefits', 'readiness', 'implementation', 'brm']
}));
