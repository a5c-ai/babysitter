/**
 * @process business-strategy/core-competency-assessment
 * @description Identification and evaluation of distinctive organizational capabilities that provide competitive advantage
 * @inputs { organizationContext: object, industry: string, competitors: array, outputDir: string }
 * @outputs { success: boolean, coreCompetencies: array, competencyGaps: array, strategicRecommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationContext = {},
    industry = '',
    competitors = [],
    outputDir = 'competency-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Core Competency Assessment Process');

  // ============================================================================
  // PHASE 1: CAPABILITY INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Inventorying organizational capabilities');
  const capabilityInventory = await ctx.task(capabilityInventoryTask, {
    organizationContext,
    outputDir
  });

  artifacts.push(...capabilityInventory.artifacts);

  // ============================================================================
  // PHASE 2: COMPETENCY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying potential core competencies');
  const competencyIdentification = await ctx.task(competencyIdentificationTask, {
    capabilities: capabilityInventory.capabilities,
    organizationContext,
    outputDir
  });

  artifacts.push(...competencyIdentification.artifacts);

  // ============================================================================
  // PHASE 3: CORE COMPETENCY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 3: Testing against core competency criteria');
  const competencyTesting = await ctx.task(competencyTestingTask, {
    potentialCompetencies: competencyIdentification.competencies,
    industry,
    competitors,
    outputDir
  });

  artifacts.push(...competencyTesting.artifacts);

  // ============================================================================
  // PHASE 4: COMPETITIVE BENCHMARKING
  // ============================================================================

  ctx.log('info', 'Phase 4: Benchmarking against competitors');
  const competitiveBenchmarking = await ctx.task(competitiveBenchmarkingTask, {
    coreCompetencies: competencyTesting.coreCompetencies,
    competitors,
    industry,
    outputDir
  });

  artifacts.push(...competitiveBenchmarking.artifacts);

  // Breakpoint: Review core competency identification
  await ctx.breakpoint({
    question: `Core competency analysis complete. Identified ${competencyTesting.coreCompetencies.length} core competencies. Review detailed assessment?`,
    title: 'Core Competency Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        totalCapabilities: capabilityInventory.capabilities.length,
        potentialCompetencies: competencyIdentification.competencies.length,
        confirmedCoreCompetencies: competencyTesting.coreCompetencies.length,
        competitiveAdvantage: competitiveBenchmarking.competitivePosition
      }
    }
  });

  // ============================================================================
  // PHASE 5: COMPETENCY GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing competency gaps');
  const gapAnalysis = await ctx.task(competencyGapAnalysisTask, {
    coreCompetencies: competencyTesting.coreCompetencies,
    competitiveBenchmarking,
    industry,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: COMPETENCY SUSTAINABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Assessing competency sustainability');
  const sustainabilityAssessment = await ctx.task(sustainabilityAssessmentTask, {
    coreCompetencies: competencyTesting.coreCompetencies,
    industry,
    outputDir
  });

  artifacts.push(...sustainabilityAssessment.artifacts);

  // ============================================================================
  // PHASE 7: STRATEGIC RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing strategic recommendations');
  const strategicRecommendations = await ctx.task(strategicRecommendationsTask, {
    coreCompetencies: competencyTesting.coreCompetencies,
    competencyGaps: gapAnalysis.gaps,
    sustainabilityAssessment,
    organizationContext,
    outputDir
  });

  artifacts.push(...strategicRecommendations.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive report');
  const competencyReport = await ctx.task(competencyReportTask, {
    capabilityInventory,
    competencyIdentification,
    competencyTesting,
    competitiveBenchmarking,
    gapAnalysis,
    sustainabilityAssessment,
    strategicRecommendations,
    outputDir
  });

  artifacts.push(...competencyReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    coreCompetencies: competencyTesting.coreCompetencies,
    competencyGaps: gapAnalysis.gaps,
    competitivePosition: competitiveBenchmarking.competitivePosition,
    sustainabilityAssessment: sustainabilityAssessment.assessment,
    strategicRecommendations: strategicRecommendations.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/core-competency-assessment',
      timestamp: startTime,
      industry
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Capability Inventory
export const capabilityInventoryTask = defineTask('capability-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Inventory organizational capabilities',
  agent: {
    name: 'capability-analyst',
    prompt: {
      role: 'organizational capability analyst',
      task: 'Create comprehensive inventory of organizational capabilities',
      context: args,
      instructions: [
        'Inventory capabilities across categories:',
        '  - Technical capabilities (R&D, engineering, IT)',
        '  - Operational capabilities (manufacturing, logistics)',
        '  - Market capabilities (sales, marketing, customer service)',
        '  - Management capabilities (leadership, planning, control)',
        '  - Human capabilities (skills, knowledge, culture)',
        '  - Financial capabilities (capital, credit, cash flow)',
        'For each capability document:',
        '  - Description',
        '  - Maturity level',
        '  - Key resources involved',
        '  - Business impact',
        'Save inventory to output directory'
      ],
      outputFormat: 'JSON with capabilities (array of objects), capabilityMap (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['capabilities', 'artifacts'],
      properties: {
        capabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              maturityLevel: { type: 'string' },
              resources: { type: 'array', items: { type: 'string' } },
              businessImpact: { type: 'string' }
            }
          }
        },
        capabilityMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'core-competency', 'capability-inventory']
}));

// Task 2: Competency Identification
export const competencyIdentificationTask = defineTask('competency-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify potential core competencies',
  agent: {
    name: 'competency-identifier',
    prompt: {
      role: 'core competency identification specialist',
      task: 'Identify capabilities that may qualify as core competencies',
      context: args,
      instructions: [
        'Screen capabilities for core competency potential:',
        '  - Capabilities that span multiple products/services',
        '  - Capabilities central to competitive success',
        '  - Capabilities that are rare in the industry',
        '  - Capabilities built over extended time',
        'Group related capabilities into competency clusters',
        'Identify potential competency combinations',
        'Prioritize for detailed testing',
        'Save identification to output directory'
      ],
      outputFormat: 'JSON with competencies (array of objects with name, description, underlyingCapabilities, initialAssessment), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['competencies', 'artifacts'],
      properties: {
        competencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              underlyingCapabilities: { type: 'array', items: { type: 'string' } },
              initialAssessment: { type: 'string' }
            }
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
  labels: ['agent', 'core-competency', 'identification']
}));

// Task 3: Competency Testing
export const competencyTestingTask = defineTask('competency-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test against core competency criteria',
  agent: {
    name: 'competency-tester',
    prompt: {
      role: 'core competency validation expert',
      task: 'Test potential competencies against Prahalad & Hamel criteria',
      context: args,
      instructions: [
        'Apply three-test framework to each potential competency:',
        '  Test 1: Customer Value',
        '    - Does it contribute significantly to customer-perceived value?',
        '    - Would customers notice its absence?',
        '  Test 2: Competitor Differentiation',
        '    - Is it unique or rare among competitors?',
        '    - Is it difficult for competitors to imitate?',
        '  Test 3: Extendability',
        '    - Can it provide access to new markets?',
        '    - Can it be leveraged across products/businesses?',
        'Score each test (1-5)',
        'Classify as core competency if passes all three',
        'Save testing results to output directory'
      ],
      outputFormat: 'JSON with coreCompetencies (array), nonCoreCompetencies (array), testResults (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['coreCompetencies', 'artifacts'],
      properties: {
        coreCompetencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              customerValueScore: { type: 'number' },
              differentiationScore: { type: 'number' },
              extendabilityScore: { type: 'number' },
              overallScore: { type: 'number' },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        nonCoreCompetencies: { type: 'array' },
        testResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'core-competency', 'testing']
}));

// Task 4: Competitive Benchmarking
export const competitiveBenchmarkingTask = defineTask('competitive-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Benchmark against competitors',
  agent: {
    name: 'benchmarking-analyst',
    prompt: {
      role: 'competitive benchmarking analyst',
      task: 'Benchmark core competencies against competitor capabilities',
      context: args,
      instructions: [
        'For each core competency:',
        '  - Assess competitor capability levels',
        '  - Determine competitive advantage gap',
        '  - Identify best-in-class performers',
        '  - Assess imitation difficulty for competitors',
        'Create competency comparison matrix',
        'Determine overall competitive position',
        'Identify competency leadership areas',
        'Save benchmarking to output directory'
      ],
      outputFormat: 'JSON with benchmarking (array of objects), competitivePosition (string), competencyLeadership (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['benchmarking', 'competitivePosition', 'artifacts'],
      properties: {
        benchmarking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competency: { type: 'string' },
              ourLevel: { type: 'number' },
              competitorLevels: { type: 'object' },
              advantageGap: { type: 'string' },
              imitationDifficulty: { type: 'string' }
            }
          }
        },
        competitivePosition: { type: 'string' },
        competencyLeadership: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'core-competency', 'benchmarking']
}));

// Task 5: Competency Gap Analysis
export const competencyGapAnalysisTask = defineTask('competency-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze competency gaps',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'competency gap analyst',
      task: 'Identify and analyze gaps in core competencies',
      context: args,
      instructions: [
        'Identify competency gaps:',
        '  - Competencies needed but not present',
        '  - Competencies below competitive parity',
        '  - Emerging competencies required by market',
        'For each gap assess:',
        '  - Strategic importance',
        '  - Current vs required level',
        '  - Root cause of gap',
        '  - Closure options (build, buy, partner)',
        'Prioritize gaps by strategic impact',
        'Save gap analysis to output directory'
      ],
      outputFormat: 'JSON with gaps (array of objects with competency, currentLevel, requiredLevel, importance, closureOption), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'artifacts'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competency: { type: 'string' },
              currentLevel: { type: 'number' },
              requiredLevel: { type: 'number' },
              importance: { type: 'string' },
              rootCause: { type: 'string' },
              closureOption: { type: 'string', enum: ['build', 'buy', 'partner', 'combination'] }
            }
          }
        },
        prioritizedGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'core-competency', 'gap-analysis']
}));

// Task 6: Sustainability Assessment
export const sustainabilityAssessmentTask = defineTask('sustainability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess competency sustainability',
  agent: {
    name: 'sustainability-analyst',
    prompt: {
      role: 'competency sustainability analyst',
      task: 'Assess the long-term sustainability of core competencies',
      context: args,
      instructions: [
        'Assess sustainability factors for each competency:',
        '  - Tacitness (how explicit is the knowledge?)',
        '  - Complexity (how many interdependent elements?)',
        '  - Specificity (how firm-specific?)',
        '  - Path dependency (how history-dependent?)',
        '  - Causal ambiguity (how unclear is the source?)',
        'Evaluate competitive threats:',
        '  - Imitation speed potential',
        '  - Substitution risk',
        '  - Obsolescence risk',
        'Calculate sustainability index (1-10)',
        'Save assessment to output directory'
      ],
      outputFormat: 'JSON with assessment (array of objects with competency, sustainabilityFactors, threats, sustainabilityIndex), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'artifacts'],
      properties: {
        assessment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competency: { type: 'string' },
              sustainabilityFactors: { type: 'object' },
              threats: { type: 'array', items: { type: 'string' } },
              sustainabilityIndex: { type: 'number' },
              timeHorizon: { type: 'string' }
            }
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
  labels: ['agent', 'core-competency', 'sustainability']
}));

// Task 7: Strategic Recommendations
export const strategicRecommendationsTask = defineTask('strategic-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop strategic recommendations',
  agent: {
    name: 'strategy-advisor',
    prompt: {
      role: 'core competency strategy advisor',
      task: 'Develop strategic recommendations for competency management',
      context: args,
      instructions: [
        'Develop recommendations across areas:',
        '  - Protect: How to sustain existing competencies',
        '  - Extend: How to leverage competencies in new areas',
        '  - Build: How to develop new competencies',
        '  - Acquire: What competencies to buy or partner for',
        '  - Divest: What non-core activities to outsource',
        'Prioritize recommendations by:',
        '  - Strategic impact',
        '  - Implementation feasibility',
        '  - Resource requirements',
        'Create competency roadmap',
        'Save recommendations to output directory'
      ],
      outputFormat: 'JSON with recommendations (array of objects), roadmap (object), resourceRequirements (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              type: { type: 'string', enum: ['protect', 'extend', 'build', 'acquire', 'divest'] },
              competency: { type: 'string' },
              priority: { type: 'string' },
              timeline: { type: 'string' },
              resources: { type: 'string' }
            }
          }
        },
        roadmap: { type: 'object' },
        resourceRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'core-competency', 'recommendations']
}));

// Task 8: Competency Report
export const competencyReportTask = defineTask('competency-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive competency report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'core competency consultant and technical writer',
      task: 'Generate comprehensive Core Competency Assessment report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document methodology (Prahalad & Hamel framework)',
        'Present capability inventory',
        'Document competency identification process',
        'Present core competency testing results',
        'Include competitive benchmarking',
        'Present gap analysis',
        'Include sustainability assessment',
        'Present strategic recommendations',
        'Include competency roadmap',
        'Format as professional strategy document',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), keyFindings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
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
  labels: ['agent', 'core-competency', 'reporting', 'documentation']
}));
