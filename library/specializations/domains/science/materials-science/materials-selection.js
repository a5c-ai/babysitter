/**
 * @process MS-021: Systematic Materials Selection
 * @description Comprehensive materials selection process using Ashby methodology,
 * multi-criteria decision analysis, and application-specific optimization
 * @inputs {
 *   applicationDescription: string,
 *   functionalRequirements: object,
 *   constraints: object, // geometric, manufacturing, cost, environmental
 *   objectives: string[], // minimize mass, minimize cost, maximize stiffness
 *   materialUniverse: string[], // metals, polymers, ceramics, composites, all
 *   selectionCriteria: object,
 *   projectContext: string
 * }
 * @outputs {
 *   selectionReport: object,
 *   candidateMaterials: object[],
 *   performanceIndices: object,
 *   tradeoffAnalysis: object,
 *   recommendations: object,
 *   artifacts: string[]
 * }
 * @example
 * {
 *   "applicationDescription": "Lightweight structural beam for aerospace",
 *   "functionalRequirements": { "loadType": "bending", "span": "1m", "load": "10kN" },
 *   "constraints": { "maxCost": "100$/kg", "maxDensity": "5g/cc", "minTmax": "150C" },
 *   "objectives": ["minimize mass", "maximize stiffness"],
 *   "materialUniverse": ["metals", "composites"]
 * }
 * @references Ashby Materials Selection, CES EduPack, MMPDS, CAMPUS
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    applicationDescription,
    functionalRequirements,
    constraints,
    objectives,
    materialUniverse,
    selectionCriteria,
    projectContext
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Requirements Translation
  ctx.log('info', 'Phase 1: Translating application requirements');
  const requirementsTranslation = await ctx.task(translateRequirements, {
    applicationDescription,
    functionalRequirements,
    constraints,
    objectives,
    projectContext
  });
  artifacts.push(...(requirementsTranslation.artifacts || []));

  // Phase 2: Function-Objective Mapping
  ctx.log('info', 'Phase 2: Mapping functions to material property objectives');
  const functionMapping = await ctx.task(mapFunctionsToProperties, {
    translatedRequirements: requirementsTranslation.requirements,
    functionalRequirements,
    objectives,
    loadingConditions: inputs.loadingConditions
  });
  artifacts.push(...(functionMapping.artifacts || []));

  // Phase 3: Performance Index Derivation
  ctx.log('info', 'Phase 3: Deriving performance indices');
  const performanceIndices = await ctx.task(derivePerformanceIndices, {
    functionMapping: functionMapping.mapping,
    objectives,
    geometryConstraints: constraints.geometry,
    loadingType: functionalRequirements.loadType
  });
  artifacts.push(...(performanceIndices.artifacts || []));

  // Phase 4: Initial Screening
  ctx.log('info', 'Phase 4: Screening material universe with constraints');
  const materialScreening = await ctx.task(screenMaterials, {
    materialUniverse,
    constraints,
    attributeLimits: requirementsTranslation.attributeLimits,
    performanceIndices: performanceIndices.indices
  });
  artifacts.push(...(materialScreening.artifacts || []));

  // Phase 5: Performance Index Ranking
  ctx.log('info', 'Phase 5: Ranking materials by performance indices');
  const performanceRanking = await ctx.task(rankByPerformance, {
    screenedMaterials: materialScreening.passedMaterials,
    performanceIndices: performanceIndices.indices,
    objectives,
    weightings: selectionCriteria?.weightings
  });
  artifacts.push(...(performanceRanking.artifacts || []));

  // Phase 6: Multi-Criteria Analysis
  ctx.log('info', 'Phase 6: Performing multi-criteria decision analysis');
  const multiCriteriaAnalysis = await ctx.task(performMultiCriteriaAnalysis, {
    rankedMaterials: performanceRanking.rankedList,
    selectionCriteria,
    objectives,
    constraints,
    methodologies: inputs.mcdmMethods || ['weighted-sum', 'TOPSIS']
  });
  artifacts.push(...(multiCriteriaAnalysis.artifacts || []));

  // Quality Gate: Review candidate selection
  await ctx.breakpoint({
    question: 'Review the materials selection analysis. Are the performance indices appropriate and rankings reasonable?',
    title: 'Materials Selection Review',
    context: {
      runId: ctx.runId,
      summary: {
        application: applicationDescription,
        performanceIndices: performanceIndices.indices,
        topCandidates: multiCriteriaAnalysis.topCandidates,
        objectives
      },
      files: artifacts
    }
  });

  // Phase 7: Detailed Candidate Evaluation
  ctx.log('info', 'Phase 7: Evaluating top candidates in detail');
  const candidateEvaluation = await ctx.task(evaluateCandidates, {
    topCandidates: multiCriteriaAnalysis.topCandidates,
    functionalRequirements,
    constraints,
    manufacturingConsiderations: inputs.manufacturingConsiderations,
    supplierConstraints: inputs.supplierConstraints
  });
  artifacts.push(...(candidateEvaluation.artifacts || []));

  // Phase 8: Tradeoff Analysis
  ctx.log('info', 'Phase 8: Analyzing tradeoffs between candidates');
  const tradeoffAnalysis = await ctx.task(analyzeTradeoffs, {
    evaluatedCandidates: candidateEvaluation.evaluations,
    objectives,
    constraints,
    sensitivityFactors: inputs.sensitivityFactors
  });
  artifacts.push(...(tradeoffAnalysis.artifacts || []));

  // Phase 9: Supporting Documentation
  ctx.log('info', 'Phase 9: Generating selection documentation');
  const selectionDocumentation = await ctx.task(generateSelectionReport, {
    requirementsTranslation: requirementsTranslation.requirements,
    performanceIndices: performanceIndices.indices,
    screeningResults: materialScreening.results,
    rankings: performanceRanking.rankedList,
    multiCriteriaResults: multiCriteriaAnalysis.results,
    candidateEvaluation: candidateEvaluation.evaluations,
    tradeoffAnalysis: tradeoffAnalysis.analysis,
    applicationDescription
  });
  artifacts.push(...(selectionDocumentation.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true,
    selectionReport: {
      application: applicationDescription,
      methodology: 'Ashby-based systematic selection',
      requirements: requirementsTranslation.requirements,
      screeningCriteria: materialScreening.criteria,
      selectionBasis: multiCriteriaAnalysis.basis,
      documentation: selectionDocumentation.report
    },
    candidateMaterials: {
      topCandidates: candidateEvaluation.evaluations,
      rankings: performanceRanking.rankedList,
      shortlist: multiCriteriaAnalysis.shortlist,
      alternates: multiCriteriaAnalysis.alternates
    },
    performanceIndices: {
      derivedIndices: performanceIndices.indices,
      indexDerivations: performanceIndices.derivations,
      materialCharts: performanceIndices.charts
    },
    tradeoffAnalysis: {
      comparisons: tradeoffAnalysis.comparisons,
      sensitivityAnalysis: tradeoffAnalysis.sensitivity,
      riskAssessment: tradeoffAnalysis.risks,
      optimalRegions: tradeoffAnalysis.optimalRegions
    },
    recommendations: {
      primaryRecommendation: candidateEvaluation.primaryChoice,
      alternateRecommendations: candidateEvaluation.alternates,
      justification: candidateEvaluation.justification,
      implementationNotes: candidateEvaluation.implementationNotes,
      furtherTesting: candidateEvaluation.testingRecommendations
    },
    artifacts,
    metadata: {
      processId: 'MS-021',
      startTime,
      endTime,
      duration: endTime - startTime
    }
  };
}

export const translateRequirements = defineTask('translate-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Requirements Translation',
  agent: {
    name: 'requirements-translation-specialist',
    prompt: {
      role: 'Materials selection engineer specializing in requirements analysis',
      task: `Translate application requirements for ${args.applicationDescription}`,
      context: args,
      instructions: [
        'Identify the primary function of the component',
        'Translate functional requirements to material attributes',
        'Define quantitative limits for screening',
        'Identify free and fixed variables',
        'Classify objectives (minimize, maximize)',
        'Document assumptions and boundary conditions',
        'Consider environmental and lifecycle requirements',
        'Map soft constraints vs. hard constraints'
      ],
      outputFormat: 'JSON with translated requirements and attribute limits'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'attributeLimits', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        attributeLimits: { type: 'object' },
        freeVariables: { type: 'array' },
        fixedVariables: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'requirements', 'selection', 'materials-science']
}));

export const mapFunctionsToProperties = defineTask('map-functions-to-properties', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Function-Property Mapping',
  agent: {
    name: 'function-property-mapper',
    prompt: {
      role: 'Materials scientist for function-property relationships',
      task: 'Map component functions to material property objectives',
      context: args,
      instructions: [
        'Identify primary and secondary functions',
        'Map each function to governing material properties',
        'Consider multiple property requirements per function',
        'Identify property interactions and dependencies',
        'Account for processing-property relationships',
        'Consider form factors and geometry effects',
        'Document property measurement standards',
        'Identify any missing property data needs'
      ],
      outputFormat: 'JSON with function-property mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['mapping', 'governingProperties', 'artifacts'],
      properties: {
        mapping: { type: 'object' },
        governingProperties: { type: 'array' },
        secondaryProperties: { type: 'array' },
        propertyInteractions: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'function-mapping', 'properties', 'materials-science']
}));

export const derivePerformanceIndices = defineTask('derive-performance-indices', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Performance Index Derivation',
  agent: {
    name: 'performance-index-specialist',
    prompt: {
      role: 'Materials selection specialist for performance index derivation',
      task: 'Derive material performance indices for the application',
      context: args,
      instructions: [
        'Apply Ashby methodology for index derivation',
        'Derive indices for each objective (e.g., E/rho, sigma_y/rho)',
        'Consider loading geometry (tie, beam, plate, shell)',
        'Account for multiple failure modes',
        'Combine indices for multi-objective cases',
        'Generate material property charts',
        'Identify selection guidelines on charts',
        'Document derivation steps and assumptions'
      ],
      outputFormat: 'JSON with performance indices and derivations'
    },
    outputSchema: {
      type: 'object',
      required: ['indices', 'derivations', 'charts', 'artifacts'],
      properties: {
        indices: { type: 'array' },
        derivations: { type: 'object' },
        charts: { type: 'array' },
        guidelines: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-index', 'ashby', 'materials-science']
}));

export const screenMaterials = defineTask('screen-materials', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Material Screening',
  agent: {
    name: 'material-screening-specialist',
    prompt: {
      role: 'Materials database specialist for screening operations',
      task: 'Screen material universe against constraints',
      context: args,
      instructions: [
        'Apply attribute limits as screening criteria',
        'Query material databases (CES, MatWeb, etc.)',
        'Filter by material class constraints',
        'Apply manufacturing process constraints',
        'Screen by cost and availability',
        'Document materials passing each criterion',
        'Identify near-miss materials for consideration',
        'Generate screening summary statistics'
      ],
      outputFormat: 'JSON with screened materials list'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'passedMaterials', 'criteria', 'artifacts'],
      properties: {
        results: { type: 'object' },
        passedMaterials: { type: 'array' },
        failedMaterials: { type: 'object' },
        criteria: { type: 'object' },
        nearMisses: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'screening', 'database', 'materials-science']
}));

export const rankByPerformance = defineTask('rank-by-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Performance Ranking',
  agent: {
    name: 'performance-ranking-analyst',
    prompt: {
      role: 'Materials analyst for performance-based ranking',
      task: 'Rank screened materials by performance indices',
      context: args,
      instructions: [
        'Calculate performance index values for each material',
        'Rank materials by each performance index',
        'Apply weighting factors if specified',
        'Generate combined rankings for multi-objective',
        'Identify Pareto-optimal materials',
        'Plot materials on property charts',
        'Highlight top performers in each category',
        'Document data sources and variability'
      ],
      outputFormat: 'JSON with ranked materials list'
    },
    outputSchema: {
      type: 'object',
      required: ['rankedList', 'indexValues', 'artifacts'],
      properties: {
        rankedList: { type: 'array' },
        indexValues: { type: 'object' },
        paretoOptimal: { type: 'array' },
        propertyCharts: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ranking', 'performance', 'materials-science']
}));

export const performMultiCriteriaAnalysis = defineTask('perform-multi-criteria-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Multi-Criteria Decision Analysis',
  agent: {
    name: 'mcda-specialist',
    prompt: {
      role: 'Decision analyst for multi-criteria materials selection',
      task: 'Perform multi-criteria decision analysis on ranked materials',
      context: args,
      instructions: [
        'Apply MCDA methods (weighted sum, TOPSIS, AHP, etc.)',
        'Normalize criteria for comparison',
        'Apply stakeholder weightings to criteria',
        'Calculate composite scores',
        'Perform sensitivity analysis on weights',
        'Identify robust selections across methods',
        'Generate decision matrices and visualizations',
        'Document MCDA methodology and assumptions'
      ],
      outputFormat: 'JSON with MCDA results and top candidates'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'topCandidates', 'shortlist', 'alternates', 'basis', 'artifacts'],
      properties: {
        results: { type: 'object' },
        topCandidates: { type: 'array' },
        shortlist: { type: 'array' },
        alternates: { type: 'array' },
        basis: { type: 'object' },
        sensitivityResults: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mcda', 'decision-analysis', 'materials-science']
}));

export const evaluateCandidates = defineTask('evaluate-candidates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detailed Candidate Evaluation',
  agent: {
    name: 'candidate-evaluation-specialist',
    prompt: {
      role: 'Materials engineer for detailed candidate evaluation',
      task: 'Evaluate top candidate materials in detail',
      context: args,
      instructions: [
        'Compile detailed property data for candidates',
        'Evaluate manufacturing feasibility for each',
        'Assess supply chain and availability',
        'Consider cost factors (material, processing, lifecycle)',
        'Evaluate environmental and sustainability aspects',
        'Check for historical performance data',
        'Identify risks and mitigation strategies',
        'Develop testing recommendations for validation'
      ],
      outputFormat: 'JSON with detailed candidate evaluations'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluations', 'primaryChoice', 'alternates', 'justification', 'implementationNotes', 'testingRecommendations', 'artifacts'],
      properties: {
        evaluations: { type: 'array' },
        primaryChoice: { type: 'object' },
        alternates: { type: 'array' },
        justification: { type: 'string' },
        implementationNotes: { type: 'object' },
        testingRecommendations: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evaluation', 'candidates', 'materials-science']
}));

export const analyzeTradeoffs = defineTask('analyze-tradeoffs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Tradeoff Analysis',
  agent: {
    name: 'tradeoff-analyst',
    prompt: {
      role: 'Systems engineer for materials tradeoff analysis',
      task: 'Analyze tradeoffs between candidate materials',
      context: args,
      instructions: [
        'Map tradeoff relationships between candidates',
        'Quantify performance differences',
        'Analyze cost-performance tradeoffs',
        'Evaluate risk-benefit relationships',
        'Perform sensitivity analysis on key factors',
        'Identify optimal regions in tradeoff space',
        'Visualize tradeoffs with Pareto charts',
        'Document decision rationale and alternatives'
      ],
      outputFormat: 'JSON with tradeoff analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'comparisons', 'sensitivity', 'risks', 'optimalRegions', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        comparisons: { type: 'array' },
        sensitivity: { type: 'object' },
        risks: { type: 'object' },
        optimalRegions: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tradeoff', 'analysis', 'materials-science']
}));

export const generateSelectionReport = defineTask('generate-selection-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Selection Report Generation',
  agent: {
    name: 'selection-report-generator',
    prompt: {
      role: 'Technical writer for materials selection documentation',
      task: 'Generate comprehensive materials selection report',
      context: args,
      instructions: [
        'Compile all selection analysis results',
        'Document methodology and assumptions',
        'Present screening and ranking results',
        'Include performance index derivations',
        'Show tradeoff analyses and visualizations',
        'Present recommendations with justification',
        'Include data sources and references',
        'Format for technical review audience'
      ],
      outputFormat: 'JSON with selection report'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'artifacts'],
      properties: {
        report: { type: 'object' },
        executiveSummary: { type: 'string' },
        sections: { type: 'array' },
        appendices: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reporting', 'documentation', 'materials-science']
}));
