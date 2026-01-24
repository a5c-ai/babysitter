/**
 * @process business-strategy/stp-market-positioning
 * @description Segmentation-Targeting-Positioning (STP) framework for market positioning strategy development
 * @inputs { organizationName: string, marketData: object, customerData: object, capabilities: object }
 * @outputs { success: boolean, segmentation: object, targetSegments: array, positioningStrategy: object, perceptualMaps: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    marketData = {},
    customerData = {},
    capabilities = {},
    outputDir = 'stp-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting STP Market Positioning for ${organizationName}`);

  // ============================================================================
  // PHASE 1: MARKET SEGMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting market segmentation analysis');
  const segmentationAnalysis = await ctx.task(marketSegmentationTask, {
    organizationName,
    marketData,
    customerData,
    outputDir
  });

  artifacts.push(...segmentationAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: SEGMENT PROFILING
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating detailed segment profiles');
  const segmentProfiles = await ctx.task(segmentProfilingTask, {
    organizationName,
    segmentationAnalysis,
    customerData,
    outputDir
  });

  artifacts.push(...segmentProfiles.artifacts);

  // ============================================================================
  // PHASE 3: SEGMENT ATTRACTIVENESS EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Evaluating segment attractiveness');
  const attractivenessEvaluation = await ctx.task(segmentAttractivenessTask, {
    organizationName,
    segmentProfiles,
    marketData,
    outputDir
  });

  artifacts.push(...attractivenessEvaluation.artifacts);

  // ============================================================================
  // PHASE 4: STRATEGIC FIT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing strategic fit with capabilities');
  const strategicFitAssessment = await ctx.task(strategicFitAssessmentTask, {
    organizationName,
    segmentProfiles,
    attractivenessEvaluation,
    capabilities,
    outputDir
  });

  artifacts.push(...strategicFitAssessment.artifacts);

  // ============================================================================
  // PHASE 5: TARGET SEGMENT SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Selecting target segments');
  const targetSelection = await ctx.task(targetSegmentSelectionTask, {
    organizationName,
    attractivenessEvaluation,
    strategicFitAssessment,
    capabilities,
    outputDir
  });

  artifacts.push(...targetSelection.artifacts);

  // ============================================================================
  // PHASE 6: POSITIONING STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing positioning strategy for target segments');
  const positioningStrategy = await ctx.task(positioningStrategyTask, {
    organizationName,
    targetSelection,
    segmentProfiles,
    capabilities,
    outputDir
  });

  artifacts.push(...positioningStrategy.artifacts);

  // ============================================================================
  // PHASE 7: PERCEPTUAL MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating perceptual maps');
  const perceptualMapping = await ctx.task(perceptualMappingTask, {
    organizationName,
    positioningStrategy,
    targetSelection,
    marketData,
    outputDir
  });

  artifacts.push(...perceptualMapping.artifacts);

  // ============================================================================
  // PHASE 8: POSITIONING VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating positioning strategy');
  const positioningValidation = await ctx.task(positioningValidationTask, {
    organizationName,
    positioningStrategy,
    perceptualMapping,
    targetSelection,
    outputDir
  });

  artifacts.push(...positioningValidation.artifacts);

  // ============================================================================
  // PHASE 9: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive STP report');
  const stpReport = await ctx.task(stpReportTask, {
    organizationName,
    segmentationAnalysis,
    segmentProfiles,
    attractivenessEvaluation,
    strategicFitAssessment,
    targetSelection,
    positioningStrategy,
    perceptualMapping,
    positioningValidation,
    outputDir
  });

  artifacts.push(...stpReport.artifacts);

  // Breakpoint: Review STP analysis
  await ctx.breakpoint({
    question: `STP market positioning complete for ${organizationName}. ${targetSelection.selectedSegments?.length || 0} target segments selected. Review positioning strategy?`,
    title: 'STP Market Positioning Review',
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
        totalSegments: segmentationAnalysis.segments?.length || 0,
        targetSegments: targetSelection.selectedSegments?.length || 0,
        positioningStatements: positioningStrategy.statements?.length || 0,
        validationScore: positioningValidation.overallScore
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    segmentation: {
      segments: segmentationAnalysis.segments,
      segmentationBases: segmentationAnalysis.bases,
      profiles: segmentProfiles.profiles
    },
    targetSegments: targetSelection.selectedSegments,
    selectionRationale: targetSelection.rationale,
    positioningStrategy: {
      strategies: positioningStrategy.strategies,
      statements: positioningStrategy.statements,
      valuePropositions: positioningStrategy.valuePropositions
    },
    perceptualMaps: perceptualMapping.maps,
    validationResults: positioningValidation.results,
    reportPath: stpReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/stp-market-positioning',
      timestamp: startTime,
      organizationName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Market Segmentation
export const marketSegmentationTask = defineTask('market-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct market segmentation analysis',
  agent: {
    name: 'segmentation-analyst',
    prompt: {
      role: 'market segmentation specialist',
      task: 'Segment the market using multiple segmentation bases',
      context: args,
      instructions: [
        'Segment by demographics (age, income, occupation, education)',
        'Segment by geographic factors (region, urban/rural, climate)',
        'Segment by psychographics (lifestyle, values, personality)',
        'Segment by behavioral factors (usage, loyalty, benefits sought)',
        'Identify B2B segmentation if applicable (firmographics)',
        'Apply multiple bases for multi-dimensional segmentation',
        'Ensure segments are measurable, accessible, substantial, differentiable, actionable',
        'Create segment taxonomy',
        'Generate segmentation analysis report'
      ],
      outputFormat: 'JSON with segments (array), bases, segmentTaxonomy, segmentationCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'bases', 'artifacts'],
      properties: {
        segments: { type: 'array', items: { type: 'object' } },
        bases: {
          type: 'object',
          properties: {
            demographic: { type: 'array', items: { type: 'string' } },
            geographic: { type: 'array', items: { type: 'string' } },
            psychographic: { type: 'array', items: { type: 'string' } },
            behavioral: { type: 'array', items: { type: 'string' } }
          }
        },
        segmentTaxonomy: { type: 'object' },
        segmentationCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stp', 'segmentation']
}));

// Task 2: Segment Profiling
export const segmentProfilingTask = defineTask('segment-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create detailed segment profiles',
  agent: {
    name: 'segment-profiler',
    prompt: {
      role: 'customer insights specialist',
      task: 'Create detailed profiles for each market segment',
      context: args,
      instructions: [
        'Create comprehensive profile for each segment',
        'Document demographic characteristics',
        'Describe needs, wants, and pain points',
        'Identify decision-making criteria and process',
        'Document media consumption and channel preferences',
        'Describe typical customer journey',
        'Identify key influencers and information sources',
        'Create segment personas with representative examples',
        'Generate segment profile documentation'
      ],
      outputFormat: 'JSON with profiles (array with segment, demographics, needs, decisionCriteria, channels, journey, persona), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['profiles', 'artifacts'],
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              demographics: { type: 'object' },
              needs: { type: 'array', items: { type: 'string' } },
              painPoints: { type: 'array', items: { type: 'string' } },
              decisionCriteria: { type: 'array', items: { type: 'string' } },
              channels: { type: 'array', items: { type: 'string' } },
              journey: { type: 'object' },
              persona: { type: 'object' }
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
  labels: ['agent', 'stp', 'profiling']
}));

// Task 3: Segment Attractiveness Evaluation
export const segmentAttractivenessTask = defineTask('segment-attractiveness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate segment attractiveness',
  agent: {
    name: 'attractiveness-evaluator',
    prompt: {
      role: 'market attractiveness analyst',
      task: 'Evaluate attractiveness of each segment',
      context: args,
      instructions: [
        'Assess segment size (current and potential)',
        'Evaluate segment growth rate and trajectory',
        'Analyze segment profitability potential',
        'Assess competitive intensity within segment',
        'Evaluate barriers to entry for segment',
        'Assess customer accessibility',
        'Analyze price sensitivity and willingness to pay',
        'Score each segment on attractiveness dimensions',
        'Create segment attractiveness matrix',
        'Generate attractiveness evaluation report'
      ],
      outputFormat: 'JSON with evaluations (array with segment, size, growth, profitability, competition, accessibility, attractivenessScore), attractivenessMatrix, rankings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluations', 'attractivenessMatrix', 'artifacts'],
      properties: {
        evaluations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              size: { type: 'object' },
              growth: { type: 'string' },
              profitability: { type: 'string' },
              competition: { type: 'string' },
              accessibility: { type: 'string' },
              attractivenessScore: { type: 'number' }
            }
          }
        },
        attractivenessMatrix: { type: 'object' },
        rankings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stp', 'attractiveness']
}));

// Task 4: Strategic Fit Assessment
export const strategicFitAssessmentTask = defineTask('strategic-fit-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess strategic fit with organizational capabilities',
  agent: {
    name: 'fit-assessor',
    prompt: {
      role: 'strategic fit analyst',
      task: 'Assess strategic fit between segments and organizational capabilities',
      context: args,
      instructions: [
        'Assess capability match for each segment',
        'Evaluate resource requirements vs. availability',
        'Assess alignment with strategic objectives',
        'Evaluate brand fit and positioning compatibility',
        'Assess channel and distribution fit',
        'Evaluate technology and product fit',
        'Assess organizational readiness',
        'Score strategic fit for each segment',
        'Create fit assessment matrix',
        'Generate strategic fit report'
      ],
      outputFormat: 'JSON with assessments (array with segment, capabilityMatch, resourceFit, strategicAlignment, brandFit, fitScore), fitMatrix, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessments', 'fitMatrix', 'artifacts'],
      properties: {
        assessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              capabilityMatch: { type: 'number' },
              resourceFit: { type: 'number' },
              strategicAlignment: { type: 'number' },
              brandFit: { type: 'number' },
              fitScore: { type: 'number' }
            }
          }
        },
        fitMatrix: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stp', 'strategic-fit']
}));

// Task 5: Target Segment Selection
export const targetSegmentSelectionTask = defineTask('target-segment-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select target segments',
  agent: {
    name: 'targeting-strategist',
    prompt: {
      role: 'market targeting specialist',
      task: 'Select target segments based on attractiveness and fit',
      context: args,
      instructions: [
        'Combine attractiveness and fit scores',
        'Apply targeting strategy (undifferentiated, differentiated, concentrated, micromarketing)',
        'Select primary and secondary target segments',
        'Provide detailed rationale for selection',
        'Identify segments to deprioritize or avoid',
        'Assess targeting risks and mitigation',
        'Define segment prioritization for resource allocation',
        'Create targeting strategy summary',
        'Generate target selection documentation'
      ],
      outputFormat: 'JSON with selectedSegments, rationale, targetingStrategy, prioritization, avoidSegments, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedSegments', 'rationale', 'targetingStrategy', 'artifacts'],
      properties: {
        selectedSegments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              priority: { type: 'string', enum: ['primary', 'secondary', 'tertiary'] },
              rationale: { type: 'string' }
            }
          }
        },
        rationale: { type: 'string' },
        targetingStrategy: { type: 'string' },
        prioritization: { type: 'array', items: { type: 'string' } },
        avoidSegments: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stp', 'targeting']
}));

// Task 6: Positioning Strategy Development
export const positioningStrategyTask = defineTask('positioning-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop positioning strategy for target segments',
  agent: {
    name: 'positioning-strategist',
    prompt: {
      role: 'positioning strategy specialist',
      task: 'Develop positioning strategy for each target segment',
      context: args,
      instructions: [
        'Identify points of difference for each segment',
        'Identify points of parity required',
        'Develop positioning statement for each segment',
        'Create value proposition for each segment',
        'Ensure positioning is relevant, distinctive, credible',
        'Align positioning with brand identity',
        'Develop positioning execution guidelines',
        'Create positioning architecture across segments',
        'Generate positioning strategy documentation'
      ],
      outputFormat: 'JSON with strategies (array with segment, pointsOfDifference, pointsOfParity, statement), statements, valuePropositions, executionGuidelines, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'statements', 'valuePropositions', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              pointsOfDifference: { type: 'array', items: { type: 'string' } },
              pointsOfParity: { type: 'array', items: { type: 'string' } },
              positioningConcept: { type: 'string' }
            }
          }
        },
        statements: { type: 'array', items: { type: 'object' } },
        valuePropositions: { type: 'array', items: { type: 'object' } },
        executionGuidelines: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stp', 'positioning-strategy']
}));

// Task 7: Perceptual Mapping
export const perceptualMappingTask = defineTask('perceptual-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create perceptual maps',
  agent: {
    name: 'perceptual-mapper',
    prompt: {
      role: 'market research and perceptual mapping specialist',
      task: 'Create perceptual maps to visualize competitive positioning',
      context: args,
      instructions: [
        'Identify key perceptual dimensions for each segment',
        'Map current positioning vs. competitors',
        'Map desired/target positioning',
        'Identify positioning gaps and opportunities',
        'Create multiple perceptual maps with different dimensions',
        'Visualize positioning trajectory',
        'Identify positioning conflicts or overlaps',
        'Generate perceptual map visualizations'
      ],
      outputFormat: 'JSON with maps (array with segment, dimensions, currentPosition, targetPosition, competitors), gaps, conflicts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['maps', 'artifacts'],
      properties: {
        maps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              dimensions: { type: 'array', items: { type: 'string' } },
              currentPosition: { type: 'object' },
              targetPosition: { type: 'object' },
              competitors: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        conflicts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stp', 'perceptual-mapping']
}));

// Task 8: Positioning Validation
export const positioningValidationTask = defineTask('positioning-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate positioning strategy',
  agent: {
    name: 'positioning-validator',
    prompt: {
      role: 'positioning validation specialist',
      task: 'Validate positioning strategy for effectiveness',
      context: args,
      instructions: [
        'Validate positioning clarity and simplicity',
        'Assess positioning distinctiveness vs. competitors',
        'Evaluate positioning credibility',
        'Assess positioning relevance to target segments',
        'Evaluate sustainability of positioning',
        'Test positioning consistency across touchpoints',
        'Identify potential positioning vulnerabilities',
        'Recommend refinements if needed',
        'Generate validation report'
      ],
      outputFormat: 'JSON with results (clarity, distinctiveness, credibility, relevance, sustainability scores), overallScore, vulnerabilities, refinements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'overallScore', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            clarity: { type: 'number' },
            distinctiveness: { type: 'number' },
            credibility: { type: 'number' },
            relevance: { type: 'number' },
            sustainability: { type: 'number' }
          }
        },
        overallScore: { type: 'number' },
        vulnerabilities: { type: 'array', items: { type: 'string' } },
        refinements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stp', 'validation']
}));

// Task 9: STP Report Generation
export const stpReportTask = defineTask('stp-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive STP report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'marketing strategy report author',
      task: 'Generate comprehensive STP market positioning report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Document segmentation methodology and results',
        'Present segment profiles and personas',
        'Include segment attractiveness and fit analysis',
        'Document target segment selection rationale',
        'Present positioning strategies and statements',
        'Include perceptual maps',
        'Document validation results',
        'Add visualizations and frameworks',
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
  labels: ['agent', 'stp', 'reporting']
}));
