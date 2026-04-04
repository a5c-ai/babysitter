/**
 * @process specializations/domains/science/mechanical-engineering/dfm-review
 * @description Design for Manufacturing (DFM) Review - Systematic evaluation of designs for manufacturability,
 * including process selection, tooling requirements, cost drivers, and design modifications to improve
 * production efficiency and quality. Covers machining, casting, forging, sheet metal, injection molding,
 * and assembly considerations.
 * @inputs { projectName: string, partNumber: string, cadFiles: array, manufacturingVolume?: string, targetCost?: number }
 * @outputs { success: boolean, dfmScore: number, recommendations: array, costImpact: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/dfm-review', {
 *   projectName: 'Automotive Bracket Design',
 *   partNumber: 'BRK-2024-001',
 *   cadFiles: ['bracket_assembly.step', 'bracket_drawing.pdf'],
 *   manufacturingVolume: 'high', // 'prototype', 'low', 'medium', 'high'
 *   targetCost: 15.00,
 *   primaryProcess: 'die-casting',
 *   material: 'Aluminum A380'
 * });
 *
 * @references
 * - Manufacturing Engineering and Technology: https://www.pearson.com/en-us/subject-catalog/p/manufacturing-engineering-and-technology/P200000003262
 * - DFMA Software: https://www.dfma.com/
 * - ASM Handbook Vol 20 - Materials Selection and Design: https://www.asminternational.org/
 * - Fundamentals of Modern Manufacturing: https://www.wiley.com/en-us/Fundamentals+of+Modern+Manufacturing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    partNumber,
    cadFiles = [],
    manufacturingVolume = 'medium', // 'prototype', 'low', 'medium', 'high'
    targetCost = null,
    primaryProcess = null,
    material = null,
    assemblyComponents = [],
    qualityRequirements = {},
    outputDir = 'dfm-review-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const allRecommendations = [];

  ctx.log('info', `Starting DFM Review for ${projectName} - Part: ${partNumber}`);
  ctx.log('info', `Manufacturing Volume: ${manufacturingVolume}, Target Cost: $${targetCost || 'TBD'}`);

  // ============================================================================
  // PHASE 1: GEOMETRY ANALYSIS AND FEATURE EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Geometry Analysis and Feature Extraction');

  const geometryResult = await ctx.task(geometryAnalysisTask, {
    projectName,
    partNumber,
    cadFiles,
    outputDir
  });

  artifacts.push(...geometryResult.artifacts);

  ctx.log('info', `Geometry analysis complete - ${geometryResult.featureCount} features identified`);

  // Breakpoint: Review geometry complexity
  await ctx.breakpoint({
    question: `Geometry analysis complete. Features: ${geometryResult.featureCount}, Complexity Score: ${geometryResult.complexityScore}/10. Critical features identified: ${geometryResult.criticalFeatures.length}. Review geometry analysis?`,
    title: 'Geometry Analysis Review',
    context: {
      runId: ctx.runId,
      partNumber,
      geometryMetrics: geometryResult.metrics,
      criticalFeatures: geometryResult.criticalFeatures,
      files: geometryResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: MANUFACTURING PROCESS SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Manufacturing Process Selection');

  const processSelectionResult = await ctx.task(processSelectionTask, {
    projectName,
    partNumber,
    geometryResult,
    material,
    manufacturingVolume,
    targetCost,
    primaryProcess,
    outputDir
  });

  artifacts.push(...processSelectionResult.artifacts);

  ctx.log('info', `Process selection complete - Recommended: ${processSelectionResult.recommendedProcess}`);

  // ============================================================================
  // PHASE 3: PROCESS-SPECIFIC DFM ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Process-Specific DFM Analysis');

  const processAnalysisResult = await ctx.task(processSpecificDFMTask, {
    projectName,
    partNumber,
    geometryResult,
    selectedProcess: processSelectionResult.recommendedProcess,
    material,
    manufacturingVolume,
    outputDir
  });

  artifacts.push(...processAnalysisResult.artifacts);
  allRecommendations.push(...processAnalysisResult.recommendations);

  ctx.log('info', `Process DFM analysis complete - ${processAnalysisResult.issues.length} issues identified`);

  // Quality Gate: Critical DFM issues
  if (processAnalysisResult.criticalIssues.length > 0) {
    await ctx.breakpoint({
      question: `${processAnalysisResult.criticalIssues.length} critical DFM issues identified that may prevent manufacturing. Issues: ${processAnalysisResult.criticalIssues.map(i => i.description).join('; ')}. Address before proceeding?`,
      title: 'Critical DFM Issues',
      context: {
        runId: ctx.runId,
        partNumber,
        criticalIssues: processAnalysisResult.criticalIssues,
        allIssues: processAnalysisResult.issues,
        files: processAnalysisResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: TOLERANCE AND GD&T ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Tolerance and GD&T Analysis');

  const toleranceResult = await ctx.task(toleranceAnalysisTask, {
    projectName,
    partNumber,
    geometryResult,
    selectedProcess: processSelectionResult.recommendedProcess,
    qualityRequirements,
    outputDir
  });

  artifacts.push(...toleranceResult.artifacts);
  allRecommendations.push(...toleranceResult.recommendations);

  ctx.log('info', `Tolerance analysis complete - ${toleranceResult.tightTolerances.length} tight tolerances flagged`);

  // ============================================================================
  // PHASE 5: MATERIAL AND FINISH ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Material and Finish Analysis');

  const materialAnalysisResult = await ctx.task(materialFinishAnalysisTask, {
    projectName,
    partNumber,
    material,
    selectedProcess: processSelectionResult.recommendedProcess,
    geometryResult,
    qualityRequirements,
    outputDir
  });

  artifacts.push(...materialAnalysisResult.artifacts);
  allRecommendations.push(...materialAnalysisResult.recommendations);

  ctx.log('info', `Material analysis complete - Machinability: ${materialAnalysisResult.machinabilityRating}`);

  // ============================================================================
  // PHASE 6: ASSEMBLY AND INTEGRATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Assembly and Integration Analysis');

  const assemblyResult = await ctx.task(assemblyAnalysisTask, {
    projectName,
    partNumber,
    geometryResult,
    assemblyComponents,
    outputDir
  });

  artifacts.push(...assemblyResult.artifacts);
  allRecommendations.push(...assemblyResult.recommendations);

  ctx.log('info', `Assembly analysis complete - DFA Score: ${assemblyResult.dfaScore}/100`);

  // Breakpoint: Review assembly complexity
  await ctx.breakpoint({
    question: `Assembly analysis complete. DFA Score: ${assemblyResult.dfaScore}/100. Assembly time estimate: ${assemblyResult.assemblyTimeEstimate} min. Review assembly recommendations?`,
    title: 'Assembly Analysis Review',
    context: {
      runId: ctx.runId,
      partNumber,
      dfaScore: assemblyResult.dfaScore,
      assemblyIssues: assemblyResult.issues,
      recommendations: assemblyResult.recommendations,
      files: assemblyResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 7: COST ESTIMATION AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Cost Estimation and Analysis');

  const costResult = await ctx.task(costEstimationTask, {
    projectName,
    partNumber,
    geometryResult,
    selectedProcess: processSelectionResult.recommendedProcess,
    material,
    manufacturingVolume,
    toleranceResult,
    assemblyResult,
    targetCost,
    outputDir
  });

  artifacts.push(...costResult.artifacts);
  allRecommendations.push(...costResult.recommendations);

  ctx.log('info', `Cost estimation complete - Estimated cost: $${costResult.estimatedCost.toFixed(2)}`);

  // Quality Gate: Cost exceeds target
  if (targetCost && costResult.estimatedCost > targetCost) {
    await ctx.breakpoint({
      question: `Estimated cost $${costResult.estimatedCost.toFixed(2)} exceeds target $${targetCost.toFixed(2)} by ${((costResult.estimatedCost - targetCost) / targetCost * 100).toFixed(1)}%. Cost reduction opportunities identified. Review cost breakdown?`,
      title: 'Cost Target Warning',
      context: {
        runId: ctx.runId,
        partNumber,
        estimatedCost: costResult.estimatedCost,
        targetCost,
        costBreakdown: costResult.costBreakdown,
        costReductionOpportunities: costResult.costReductionOpportunities,
        files: costResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: DFM SCORECARD AND PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 8: DFM Scorecard and Prioritization');

  const scorecardResult = await ctx.task(dfmScorecardTask, {
    projectName,
    partNumber,
    geometryResult,
    processAnalysisResult,
    toleranceResult,
    materialAnalysisResult,
    assemblyResult,
    costResult,
    allRecommendations,
    outputDir
  });

  artifacts.push(...scorecardResult.artifacts);

  ctx.log('info', `DFM scorecard complete - Overall Score: ${scorecardResult.overallScore}/100`);

  // ============================================================================
  // PHASE 9: GENERATE DFM REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating DFM Report');

  const reportResult = await ctx.task(generateDFMReportTask, {
    projectName,
    partNumber,
    manufacturingVolume,
    targetCost,
    geometryResult,
    processSelectionResult,
    processAnalysisResult,
    toleranceResult,
    materialAnalysisResult,
    assemblyResult,
    costResult,
    scorecardResult,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint: DFM Review complete
  await ctx.breakpoint({
    question: `DFM Review Complete for ${partNumber}. Overall DFM Score: ${scorecardResult.overallScore}/100. ${scorecardResult.prioritizedRecommendations.length} recommendations. Estimated cost: $${costResult.estimatedCost.toFixed(2)}. Approve DFM assessment?`,
    title: 'DFM Review Complete',
    context: {
      runId: ctx.runId,
      summary: {
        partNumber,
        dfmScore: scorecardResult.overallScore,
        recommendedProcess: processSelectionResult.recommendedProcess,
        estimatedCost: costResult.estimatedCost,
        targetCost,
        issueCount: processAnalysisResult.issues.length,
        criticalIssueCount: processAnalysisResult.criticalIssues.length
      },
      topRecommendations: scorecardResult.prioritizedRecommendations.slice(0, 5),
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'DFM Report' },
        { path: scorecardResult.scorecardPath, format: 'json', label: 'DFM Scorecard' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    partNumber,
    dfmScore: scorecardResult.overallScore,
    manufacturingProcess: processSelectionResult.recommendedProcess,
    recommendations: scorecardResult.prioritizedRecommendations,
    costImpact: {
      estimatedCost: costResult.estimatedCost,
      targetCost,
      costBreakdown: costResult.costBreakdown,
      potentialSavings: costResult.potentialSavings
    },
    issuesSummary: {
      critical: processAnalysisResult.criticalIssues.length,
      major: processAnalysisResult.majorIssues?.length || 0,
      minor: processAnalysisResult.minorIssues?.length || 0,
      total: processAnalysisResult.issues.length
    },
    categoryScores: scorecardResult.categoryScores,
    outputFiles: {
      report: reportResult.reportPath,
      scorecard: scorecardResult.scorecardPath,
      costAnalysis: costResult.costAnalysisPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/dfm-review',
      processSlug: 'dfm-review',
      category: 'mechanical-engineering',
      timestamp: startTime,
      manufacturingVolume,
      primaryProcess: processSelectionResult.recommendedProcess
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const geometryAnalysisTask = defineTask('geometry-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Geometry Analysis - ${args.partNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CAD/CAM Analysis Specialist',
      task: 'Analyze part geometry for manufacturing considerations',
      context: {
        projectName: args.projectName,
        partNumber: args.partNumber,
        cadFiles: args.cadFiles,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Import and analyze CAD geometry',
        '2. Extract geometric features (holes, pockets, bosses, ribs, walls)',
        '3. Measure critical dimensions (overall size, wall thickness, draft angles)',
        '4. Identify undercuts and internal features',
        '5. Calculate surface area and volume',
        '6. Assess geometric complexity score',
        '7. Identify features that may be difficult to manufacture',
        '8. Check for thin walls, sharp corners, and deep pockets',
        '9. Evaluate symmetry and parting line considerations',
        '10. Generate feature extraction report'
      ],
      outputFormat: 'JSON object with geometry analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'featureCount', 'complexityScore', 'metrics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        featureCount: { type: 'number' },
        complexityScore: { type: 'number' },
        metrics: {
          type: 'object',
          properties: {
            overallDimensions: { type: 'object' },
            volume: { type: 'number' },
            surfaceArea: { type: 'number' },
            minWallThickness: { type: 'number' },
            maxDepth: { type: 'number' }
          }
        },
        features: { type: 'array' },
        criticalFeatures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'dfm', 'geometry-analysis', 'cad']
}));

export const processSelectionTask = defineTask('process-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Process Selection - ${args.partNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Manufacturing Process Engineer',
      task: 'Select optimal manufacturing process based on part requirements',
      context: {
        projectName: args.projectName,
        partNumber: args.partNumber,
        geometryResult: args.geometryResult,
        material: args.material,
        manufacturingVolume: args.manufacturingVolume,
        targetCost: args.targetCost,
        primaryProcess: args.primaryProcess,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate candidate manufacturing processes:',
        '   - Machining (CNC milling, turning, EDM)',
        '   - Casting (die casting, investment casting, sand casting)',
        '   - Forming (stamping, forging, bending)',
        '   - Injection molding (for plastics)',
        '   - Additive manufacturing (3D printing)',
        '2. Score each process against criteria:',
        '   - Geometric capability',
        '   - Material compatibility',
        '   - Volume economics',
        '   - Tolerance capability',
        '   - Surface finish capability',
        '3. Consider secondary operations required',
        '4. Evaluate tooling costs vs. part cost',
        '5. Assess lead time for each option',
        '6. Recommend primary process with alternatives',
        '7. Justify selection with trade-off analysis'
      ],
      outputFormat: 'JSON object with process selection results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'recommendedProcess', 'processScores', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        recommendedProcess: { type: 'string' },
        alternativeProcesses: { type: 'array', items: { type: 'string' } },
        processScores: { type: 'object' },
        selectionRationale: { type: 'string' },
        toolingRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'dfm', 'process-selection', 'manufacturing']
}));

export const processSpecificDFMTask = defineTask('process-specific-dfm', (args, taskCtx) => ({
  kind: 'agent',
  title: `Process-Specific DFM - ${args.partNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DFM Analysis Specialist',
      task: 'Perform detailed DFM analysis for selected manufacturing process',
      context: {
        projectName: args.projectName,
        partNumber: args.partNumber,
        geometryResult: args.geometryResult,
        selectedProcess: args.selectedProcess,
        material: args.material,
        manufacturingVolume: args.manufacturingVolume,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply process-specific DFM guidelines:',
        '   For Machining: tool access, setup minimization, standard tools',
        '   For Casting: draft angles, wall uniformity, parting line',
        '   For Sheet Metal: bend radii, grain direction, nesting',
        '   For Injection Molding: gate location, ejection, sink marks',
        '2. Check each feature against process capabilities',
        '3. Identify violations of DFM rules',
        '4. Classify issues by severity (critical, major, minor)',
        '5. Calculate manufacturability index',
        '6. Suggest design modifications for each issue',
        '7. Estimate impact of issues on cost and quality',
        '8. Identify features requiring secondary operations',
        '9. Check for process-specific constraints',
        '10. Generate detailed DFM issue report'
      ],
      outputFormat: 'JSON object with DFM analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'issues', 'criticalIssues', 'recommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        manufacturabilityIndex: { type: 'number' },
        issues: { type: 'array' },
        criticalIssues: { type: 'array' },
        majorIssues: { type: 'array' },
        minorIssues: { type: 'array' },
        recommendations: { type: 'array' },
        featureAnalysis: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'dfm', 'process-analysis', 'manufacturability']
}));

export const toleranceAnalysisTask = defineTask('tolerance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tolerance Analysis - ${args.partNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GD&T and Tolerance Analysis Specialist',
      task: 'Analyze tolerances for manufacturability and cost impact',
      context: {
        projectName: args.projectName,
        partNumber: args.partNumber,
        geometryResult: args.geometryResult,
        selectedProcess: args.selectedProcess,
        qualityRequirements: args.qualityRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Extract all dimensional tolerances from drawing',
        '2. Extract geometric tolerances (GD&T)',
        '3. Compare tolerances to process capabilities',
        '4. Flag tolerances tighter than standard process capability',
        '5. Identify tolerances requiring secondary operations',
        '6. Perform tolerance stack-up analysis for critical features',
        '7. Calculate Cpk feasibility for each tolerance',
        '8. Recommend tolerance relaxation where possible',
        '9. Identify inspection requirements',
        '10. Estimate cost impact of tight tolerances'
      ],
      outputFormat: 'JSON object with tolerance analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'tightTolerances', 'recommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        toleranceCount: { type: 'number' },
        tightTolerances: { type: 'array' },
        toleranceCapabilityMatrix: { type: 'array' },
        stackUpResults: { type: 'array' },
        recommendations: { type: 'array' },
        inspectionRequirements: { type: 'array' },
        costImpact: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'dfm', 'tolerancing', 'gdt']
}));

export const materialFinishAnalysisTask = defineTask('material-finish-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Material & Finish Analysis - ${args.partNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials and Surface Finish Specialist',
      task: 'Analyze material selection and surface finish requirements',
      context: {
        projectName: args.projectName,
        partNumber: args.partNumber,
        material: args.material,
        selectedProcess: args.selectedProcess,
        geometryResult: args.geometryResult,
        qualityRequirements: args.qualityRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate material machinability/processability',
        '2. Check material availability and lead time',
        '3. Assess material cost relative to alternatives',
        '4. Analyze surface finish requirements vs. process capability',
        '5. Identify surfaces requiring secondary finishing',
        '6. Evaluate heat treatment requirements',
        '7. Assess coating/plating requirements',
        '8. Check material compatibility with process',
        '9. Recommend alternative materials if beneficial',
        '10. Calculate material utilization and scrap rate'
      ],
      outputFormat: 'JSON object with material analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'machinabilityRating', 'recommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        machinabilityRating: { type: 'string' },
        materialCost: { type: 'number' },
        materialUtilization: { type: 'number' },
        surfaceFinishAnalysis: { type: 'object' },
        secondaryOperations: { type: 'array' },
        alternativeMaterials: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'dfm', 'materials', 'surface-finish']
}));

export const assemblyAnalysisTask = defineTask('assembly-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assembly Analysis - ${args.partNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design for Assembly (DFA) Specialist',
      task: 'Analyze design for assembly efficiency',
      context: {
        projectName: args.projectName,
        partNumber: args.partNumber,
        geometryResult: args.geometryResult,
        assemblyComponents: args.assemblyComponents,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Count total number of parts in assembly',
        '2. Apply DFA part reduction analysis',
        '3. Evaluate handling difficulty for each part',
        '4. Assess insertion difficulty and accessibility',
        '5. Identify fastener types and counts',
        '6. Evaluate assembly sequence and fixtures required',
        '7. Check for self-locating and self-aligning features',
        '8. Analyze assembly tool requirements',
        '9. Calculate theoretical minimum part count',
        '10. Estimate assembly time and labor cost'
      ],
      outputFormat: 'JSON object with assembly analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dfaScore', 'assemblyTimeEstimate', 'recommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        partCount: { type: 'number' },
        theoreticalMinimumParts: { type: 'number' },
        dfaScore: { type: 'number' },
        assemblyTimeEstimate: { type: 'number' },
        issues: { type: 'array' },
        recommendations: { type: 'array' },
        fastenerAnalysis: { type: 'object' },
        handlingAnalysis: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'dfm', 'dfa', 'assembly']
}));

export const costEstimationTask = defineTask('cost-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cost Estimation - ${args.partNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Manufacturing Cost Estimation Specialist',
      task: 'Estimate manufacturing cost and identify cost drivers',
      context: {
        projectName: args.projectName,
        partNumber: args.partNumber,
        geometryResult: args.geometryResult,
        selectedProcess: args.selectedProcess,
        material: args.material,
        manufacturingVolume: args.manufacturingVolume,
        toleranceResult: args.toleranceResult,
        assemblyResult: args.assemblyResult,
        targetCost: args.targetCost,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate raw material cost',
        '2. Estimate tooling and fixture costs',
        '3. Calculate processing time and machine cost',
        '4. Add secondary operation costs',
        '5. Include quality inspection costs',
        '6. Factor in scrap and rework allowance',
        '7. Calculate overhead and burden rates',
        '8. Develop cost breakdown structure',
        '9. Identify top cost drivers',
        '10. Calculate cost reduction opportunities'
      ],
      outputFormat: 'JSON object with cost estimation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'estimatedCost', 'costBreakdown', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        estimatedCost: { type: 'number' },
        costBreakdown: {
          type: 'object',
          properties: {
            material: { type: 'number' },
            processing: { type: 'number' },
            tooling: { type: 'number' },
            secondary: { type: 'number' },
            quality: { type: 'number' },
            overhead: { type: 'number' }
          }
        },
        costDrivers: { type: 'array' },
        costReductionOpportunities: { type: 'array' },
        potentialSavings: { type: 'number' },
        costAnalysisPath: { type: 'string' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'dfm', 'cost-estimation', 'manufacturing']
}));

export const dfmScorecardTask = defineTask('dfm-scorecard', (args, taskCtx) => ({
  kind: 'agent',
  title: `DFM Scorecard - ${args.partNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DFM Assessment Specialist',
      task: 'Create comprehensive DFM scorecard and prioritize recommendations',
      context: {
        projectName: args.projectName,
        partNumber: args.partNumber,
        geometryResult: args.geometryResult,
        processAnalysisResult: args.processAnalysisResult,
        toleranceResult: args.toleranceResult,
        materialAnalysisResult: args.materialAnalysisResult,
        assemblyResult: args.assemblyResult,
        costResult: args.costResult,
        allRecommendations: args.allRecommendations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate category scores:',
        '   - Geometry and Features (0-100)',
        '   - Process Compatibility (0-100)',
        '   - Tolerancing (0-100)',
        '   - Material Selection (0-100)',
        '   - Assembly Design (0-100)',
        '   - Cost Efficiency (0-100)',
        '2. Calculate weighted overall DFM score',
        '3. Consolidate all recommendations',
        '4. Prioritize recommendations by impact and effort',
        '5. Categorize recommendations (must-fix, should-fix, nice-to-have)',
        '6. Estimate implementation effort for each recommendation',
        '7. Calculate ROI for cost reduction recommendations',
        '8. Create action item list with owners',
        '9. Generate visual scorecard',
        '10. Summarize key takeaways'
      ],
      outputFormat: 'JSON object with DFM scorecard'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'overallScore', 'categoryScores', 'prioritizedRecommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        overallScore: { type: 'number' },
        categoryScores: {
          type: 'object',
          properties: {
            geometry: { type: 'number' },
            process: { type: 'number' },
            tolerancing: { type: 'number' },
            material: { type: 'number' },
            assembly: { type: 'number' },
            cost: { type: 'number' }
          }
        },
        prioritizedRecommendations: { type: 'array' },
        actionItems: { type: 'array' },
        scorecardPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'dfm', 'scorecard', 'assessment']
}));

export const generateDFMReportTask = defineTask('generate-dfm-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate DFM Report - ${args.partNumber}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive DFM review report',
      context: {
        projectName: args.projectName,
        partNumber: args.partNumber,
        manufacturingVolume: args.manufacturingVolume,
        targetCost: args.targetCost,
        geometryResult: args.geometryResult,
        processSelectionResult: args.processSelectionResult,
        processAnalysisResult: args.processAnalysisResult,
        toleranceResult: args.toleranceResult,
        materialAnalysisResult: args.materialAnalysisResult,
        assemblyResult: args.assemblyResult,
        costResult: args.costResult,
        scorecardResult: args.scorecardResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document part description and requirements',
        '3. Present recommended manufacturing process',
        '4. Summarize DFM scorecard results',
        '5. Detail all identified issues by category',
        '6. Present prioritized recommendations',
        '7. Include cost analysis and breakdown',
        '8. Add tolerance and GD&T assessment',
        '9. Provide assembly analysis results',
        '10. Append supporting data and visualizations'
      ],
      outputFormat: 'JSON object with report path'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'dfm', 'reporting', 'documentation']
}));
