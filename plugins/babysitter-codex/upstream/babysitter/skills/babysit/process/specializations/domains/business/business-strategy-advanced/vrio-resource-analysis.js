/**
 * @process business-strategy/vrio-resource-analysis
 * @description Resource-based competitive advantage analysis using VRIO framework to identify sustainable competitive advantages
 * @inputs { organizationName: string, resources: array, capabilities: array, competitorBenchmarks: object }
 * @outputs { success: boolean, vrioAnalysis: array, competitiveAdvantages: object, investmentPriorities: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    resources = [],
    capabilities = [],
    competitorBenchmarks = {},
    outputDir = 'vrio-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting VRIO Resource Analysis for ${organizationName}`);

  // ============================================================================
  // PHASE 1: RESOURCE AND CAPABILITY INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Building resource and capability inventory');
  const inventoryResult = await ctx.task(resourceInventoryTask, {
    organizationName,
    resources,
    capabilities,
    outputDir
  });

  artifacts.push(...inventoryResult.artifacts);

  // ============================================================================
  // PHASE 2: VALUE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing value of resources and capabilities');
  const valueAssessment = await ctx.task(valueAssessmentTask, {
    organizationName,
    inventoryResult,
    competitorBenchmarks,
    outputDir
  });

  artifacts.push(...valueAssessment.artifacts);

  // ============================================================================
  // PHASE 3: RARITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing rarity of resources and capabilities');
  const rarityAssessment = await ctx.task(rarityAssessmentTask, {
    organizationName,
    inventoryResult,
    valueAssessment,
    competitorBenchmarks,
    outputDir
  });

  artifacts.push(...rarityAssessment.artifacts);

  // ============================================================================
  // PHASE 4: IMITABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing imitability of resources and capabilities');
  const imitabilityAssessment = await ctx.task(imitabilityAssessmentTask, {
    organizationName,
    inventoryResult,
    rarityAssessment,
    competitorBenchmarks,
    outputDir
  });

  artifacts.push(...imitabilityAssessment.artifacts);

  // ============================================================================
  // PHASE 5: ORGANIZATION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing organizational support and exploitation');
  const organizationAssessment = await ctx.task(organizationAssessmentTask, {
    organizationName,
    inventoryResult,
    imitabilityAssessment,
    outputDir
  });

  artifacts.push(...organizationAssessment.artifacts);

  // ============================================================================
  // PHASE 6: COMPETITIVE IMPLICATION CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Classifying competitive implications');
  const competitiveClassification = await ctx.task(competitiveClassificationTask, {
    organizationName,
    valueAssessment,
    rarityAssessment,
    imitabilityAssessment,
    organizationAssessment,
    outputDir
  });

  artifacts.push(...competitiveClassification.artifacts);

  // ============================================================================
  // PHASE 7: INVESTMENT PRIORITIES
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing resource investment priorities');
  const investmentPriorities = await ctx.task(investmentPrioritiesTask, {
    organizationName,
    competitiveClassification,
    inventoryResult,
    outputDir
  });

  artifacts.push(...investmentPriorities.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive VRIO report');
  const vrioReport = await ctx.task(vrioReportTask, {
    organizationName,
    inventoryResult,
    valueAssessment,
    rarityAssessment,
    imitabilityAssessment,
    organizationAssessment,
    competitiveClassification,
    investmentPriorities,
    outputDir
  });

  artifacts.push(...vrioReport.artifacts);

  // Breakpoint: Review VRIO analysis
  await ctx.breakpoint({
    question: `VRIO analysis complete for ${organizationName}. ${competitiveClassification.sustainedAdvantages?.length || 0} sustained competitive advantages identified. Review?`,
    title: 'VRIO Resource Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        organizationName,
        totalResources: inventoryResult.totalResources,
        competitiveImplications: {
          sustainedAdvantages: competitiveClassification.sustainedAdvantages?.length || 0,
          temporaryAdvantages: competitiveClassification.temporaryAdvantages?.length || 0,
          competitiveParity: competitiveClassification.competitiveParity?.length || 0,
          competitiveDisadvantage: competitiveClassification.competitiveDisadvantage?.length || 0
        }
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    vrioAnalysis: competitiveClassification.vrioMatrix,
    competitiveAdvantages: {
      sustained: competitiveClassification.sustainedAdvantages,
      temporary: competitiveClassification.temporaryAdvantages,
      parity: competitiveClassification.competitiveParity,
      disadvantage: competitiveClassification.competitiveDisadvantage
    },
    investmentPriorities: investmentPriorities.priorities,
    resourceDevelopmentStrategy: investmentPriorities.developmentStrategy,
    reportPath: vrioReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/vrio-resource-analysis',
      timestamp: startTime,
      organizationName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Resource and Capability Inventory
export const resourceInventoryTask = defineTask('resource-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build resource and capability inventory',
  agent: {
    name: 'resource-analyst',
    prompt: {
      role: 'resource-based view strategist',
      task: 'Create comprehensive inventory of organizational resources and capabilities',
      context: args,
      instructions: [
        'Inventory tangible resources (physical, financial, technological)',
        'Inventory intangible resources (brand, reputation, IP, culture)',
        'Identify organizational capabilities (skills, routines, processes)',
        'Categorize resources by type and strategic relevance',
        'Assess current state and condition of each resource',
        'Identify resource bundles and capability clusters',
        'Map resources to business functions and processes',
        'Document resource acquisition history and development',
        'Generate comprehensive resource inventory'
      ],
      outputFormat: 'JSON with totalResources, tangibleResources, intangibleResources, capabilities, resourceCategories, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalResources', 'tangibleResources', 'intangibleResources', 'capabilities', 'artifacts'],
      properties: {
        totalResources: { type: 'number' },
        tangibleResources: { type: 'array', items: { type: 'object' } },
        intangibleResources: { type: 'array', items: { type: 'object' } },
        capabilities: { type: 'array', items: { type: 'object' } },
        resourceCategories: { type: 'object' },
        resourceBundles: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vrio', 'inventory']
}));

// Task 2: Value Assessment
export const valueAssessmentTask = defineTask('value-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess value of resources and capabilities',
  agent: {
    name: 'value-analyst',
    prompt: {
      role: 'strategic value analyst',
      task: 'Assess whether resources enable value creation or threat neutralization',
      context: args,
      instructions: [
        'Evaluate each resource for customer value creation',
        'Assess ability to exploit market opportunities',
        'Evaluate ability to neutralize competitive threats',
        'Analyze contribution to cost reduction',
        'Assess revenue generation potential',
        'Evaluate strategic flexibility enabled',
        'Score value (Yes/No) with detailed justification',
        'Identify non-valuable resources for potential divestment',
        'Generate value assessment matrix'
      ],
      outputFormat: 'JSON with valueAssessments (array with resource, isValuable, valueJustification, valueScore), valuableResources, nonValuableResources, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['valueAssessments', 'valuableResources', 'artifacts'],
      properties: {
        valueAssessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              isValuable: { type: 'boolean' },
              valueJustification: { type: 'string' },
              valueScore: { type: 'number', minimum: 1, maximum: 5 }
            }
          }
        },
        valuableResources: { type: 'array', items: { type: 'string' } },
        nonValuableResources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vrio', 'value']
}));

// Task 3: Rarity Assessment
export const rarityAssessmentTask = defineTask('rarity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess rarity of resources and capabilities',
  agent: {
    name: 'rarity-analyst',
    prompt: {
      role: 'competitive rarity analyst',
      task: 'Assess whether resources are scarce among competitors',
      context: args,
      instructions: [
        'Evaluate resource scarcity among current competitors',
        'Assess scarcity among potential future competitors',
        'Analyze resource availability in factor markets',
        'Evaluate uniqueness of capability combinations',
        'Assess historical path dependency creating rarity',
        'Evaluate geographic or market-specific rarity',
        'Score rarity (Yes/No) with detailed justification',
        'Identify truly rare resources vs. commonly held',
        'Generate rarity assessment matrix'
      ],
      outputFormat: 'JSON with rarityAssessments (array with resource, isRare, rarityJustification, competitorAnalysis), rareResources, commonResources, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rarityAssessments', 'rareResources', 'artifacts'],
      properties: {
        rarityAssessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              isRare: { type: 'boolean' },
              rarityJustification: { type: 'string' },
              competitorAnalysis: { type: 'string' }
            }
          }
        },
        rareResources: { type: 'array', items: { type: 'string' } },
        commonResources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vrio', 'rarity']
}));

// Task 4: Imitability Assessment
export const imitabilityAssessmentTask = defineTask('imitability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess imitability of resources and capabilities',
  agent: {
    name: 'imitability-analyst',
    prompt: {
      role: 'imitation barrier analyst',
      task: 'Assess whether resources are difficult or costly to imitate',
      context: args,
      instructions: [
        'Evaluate historical uniqueness and path dependency',
        'Assess causal ambiguity (unclear success factors)',
        'Analyze social complexity barriers',
        'Evaluate legal protections (patents, trademarks, copyrights)',
        'Assess time compression diseconomies',
        'Evaluate tacit knowledge and organizational routines',
        'Analyze cost of imitation vs. benefits',
        'Score imitability difficulty (Yes/No costly to imitate)',
        'Identify resources with high imitation barriers',
        'Generate imitability assessment matrix'
      ],
      outputFormat: 'JSON with imitabilityAssessments (array with resource, isCostlyToImitate, barriers, timeToImitate), hardToImitate, easyToImitate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['imitabilityAssessments', 'hardToImitate', 'artifacts'],
      properties: {
        imitabilityAssessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              isCostlyToImitate: { type: 'boolean' },
              barriers: { type: 'array', items: { type: 'string' } },
              timeToImitate: { type: 'string' }
            }
          }
        },
        hardToImitate: { type: 'array', items: { type: 'string' } },
        easyToImitate: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vrio', 'imitability']
}));

// Task 5: Organization Assessment
export const organizationAssessmentTask = defineTask('organization-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess organizational support and exploitation',
  agent: {
    name: 'organization-analyst',
    prompt: {
      role: 'organizational alignment analyst',
      task: 'Assess whether organization is structured to exploit resources',
      context: args,
      instructions: [
        'Evaluate organizational structure alignment',
        'Assess management systems and processes',
        'Analyze compensation and incentive alignment',
        'Evaluate formal and informal reporting relationships',
        'Assess culture support for resource exploitation',
        'Evaluate coordination mechanisms',
        'Analyze strategic control systems',
        'Score organization support (Yes/No) for each resource',
        'Identify organizational gaps hindering exploitation',
        'Generate organization assessment matrix'
      ],
      outputFormat: 'JSON with organizationAssessments (array with resource, isOrganized, organizationalSupport, gaps), wellOrganized, poorlyOrganized, organizationalGaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['organizationAssessments', 'wellOrganized', 'artifacts'],
      properties: {
        organizationAssessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              isOrganized: { type: 'boolean' },
              organizationalSupport: { type: 'string' },
              gaps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        wellOrganized: { type: 'array', items: { type: 'string' } },
        poorlyOrganized: { type: 'array', items: { type: 'string' } },
        organizationalGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vrio', 'organization']
}));

// Task 6: Competitive Implication Classification
export const competitiveClassificationTask = defineTask('competitive-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify competitive implications',
  agent: {
    name: 'competitive-strategist',
    prompt: {
      role: 'competitive strategy analyst',
      task: 'Classify resources by competitive implication using VRIO results',
      context: args,
      instructions: [
        'Apply VRIO logic: V+R+I+O = Sustained competitive advantage',
        'V+R+I = Temporary competitive advantage (unused potential)',
        'V+R = Temporary competitive advantage',
        'V only = Competitive parity',
        'Not valuable = Competitive disadvantage',
        'Create comprehensive VRIO matrix',
        'Classify each resource by competitive implication',
        'Identify sources of sustained competitive advantage',
        'Document temporary advantages needing protection',
        'Generate competitive classification report'
      ],
      outputFormat: 'JSON with vrioMatrix, sustainedAdvantages, temporaryAdvantages, competitiveParity, competitiveDisadvantage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['vrioMatrix', 'sustainedAdvantages', 'artifacts'],
      properties: {
        vrioMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              valuable: { type: 'boolean' },
              rare: { type: 'boolean' },
              costlyToImitate: { type: 'boolean' },
              organized: { type: 'boolean' },
              competitiveImplication: { type: 'string' }
            }
          }
        },
        sustainedAdvantages: { type: 'array', items: { type: 'object' } },
        temporaryAdvantages: { type: 'array', items: { type: 'object' } },
        competitiveParity: { type: 'array', items: { type: 'string' } },
        competitiveDisadvantage: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vrio', 'classification']
}));

// Task 7: Investment Priorities
export const investmentPrioritiesTask = defineTask('investment-priorities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop resource investment priorities',
  agent: {
    name: 'investment-strategist',
    prompt: {
      role: 'resource investment strategist',
      task: 'Develop resource development and investment priorities',
      context: args,
      instructions: [
        'Prioritize investments in sustained advantage resources',
        'Recommend protection strategies for temporary advantages',
        'Identify resources needing development or acquisition',
        'Recommend divestment of competitive disadvantage resources',
        'Develop resource protection strategies (IP, secrecy, etc.)',
        'Identify capability building priorities',
        'Estimate investment requirements',
        'Create resource development roadmap',
        'Generate investment priorities report'
      ],
      outputFormat: 'JSON with priorities, developmentStrategy, protectionStrategies, divestmentCandidates, investmentRoadmap, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['priorities', 'developmentStrategy', 'artifacts'],
      properties: {
        priorities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              action: { type: 'string', enum: ['invest', 'protect', 'develop', 'divest', 'maintain'] },
              rationale: { type: 'string' },
              investmentLevel: { type: 'string' }
            }
          }
        },
        developmentStrategy: { type: 'object' },
        protectionStrategies: { type: 'array', items: { type: 'object' } },
        divestmentCandidates: { type: 'array', items: { type: 'string' } },
        investmentRoadmap: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vrio', 'investment']
}));

// Task 8: VRIO Report Generation
export const vrioReportTask = defineTask('vrio-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive VRIO report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategy consultant and report author',
      task: 'Generate comprehensive VRIO resource analysis report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Present resource and capability inventory',
        'Document VRIO assessment for each resource',
        'Include VRIO analysis matrix visualization',
        'Present competitive advantage assessment',
        'Document investment priorities and recommendations',
        'Include resource development roadmap',
        'Add appendices with detailed assessments',
        'Format as professional Markdown report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vrio', 'reporting']
}));
