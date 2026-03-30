/**
 * @process specializations/domains/science/mechanical-engineering/material-selection
 * @description Material Selection Methodology - Systematic material selection using Ashby charts
 * and performance indices, considering mechanical properties, environmental compatibility,
 * manufacturing constraints, cost, and availability.
 * @inputs { projectName: string, application: string, requirements: object, constraints: object }
 * @outputs { success: boolean, recommendedMaterials: array, selectionMatrix: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/material-selection', {
 *   projectName: 'Lightweight Bracket Design',
 *   application: 'aerospace structural bracket',
 *   requirements: { minYieldStrength: 300, maxDensity: 4.5, serviceTemp: 150 },
 *   constraints: { manufacturingProcess: 'machining', budget: 'medium' }
 * });
 *
 * @references
 * - Materials Selection in Mechanical Design (Ashby): https://www.elsevier.com/books/materials-selection-in-mechanical-design/ashby/978-0-08-100666-8
 * - ASM Handbook: https://www.asminternational.org/
 * - Cambridge Engineering Selector (CES): https://www.ansys.com/products/materials
 * - MatWeb Materials Database: https://www.matweb.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    application,
    requirements = {},
    constraints = {},
    loadingConditions = {},
    environmentalConditions = {},
    manufacturingProcess = null,
    outputDir = 'material-selection-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Material Selection for ${projectName}`);
  ctx.log('info', `Application: ${application}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Requirements Definition');

  const requirementsResult = await ctx.task(requirementsDefinitionTask, {
    projectName,
    application,
    requirements,
    loadingConditions,
    environmentalConditions,
    outputDir
  });

  artifacts.push(...requirementsResult.artifacts);

  ctx.log('info', `Requirements defined - ${requirementsResult.criticalProperties.length} critical properties`);

  // ============================================================================
  // PHASE 2: FUNCTION AND CONSTRAINTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Function and Constraints Analysis');

  const functionResult = await ctx.task(functionConstraintsTask, {
    projectName,
    application,
    requirementsResult,
    constraints,
    manufacturingProcess,
    outputDir
  });

  artifacts.push(...functionResult.artifacts);

  ctx.log('info', `Function analysis complete - Objective: ${functionResult.objective}`);

  // ============================================================================
  // PHASE 3: PERFORMANCE INDEX DERIVATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Performance Index Derivation');

  const indexResult = await ctx.task(performanceIndexTask, {
    projectName,
    functionResult,
    requirementsResult,
    outputDir
  });

  artifacts.push(...indexResult.artifacts);

  ctx.log('info', `Performance indices derived: ${indexResult.indices.join(', ')}`);

  // Breakpoint: Review performance indices
  await ctx.breakpoint({
    question: `Performance indices derived. Primary: ${indexResult.primaryIndex}. ${indexResult.indices.length} indices identified. Review material selection criteria?`,
    title: 'Performance Index Review',
    context: {
      runId: ctx.runId,
      indices: indexResult.indices,
      indexDerivations: indexResult.derivations,
      files: indexResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: MATERIAL SCREENING
  // ============================================================================

  ctx.log('info', 'Phase 4: Material Screening');

  const screeningResult = await ctx.task(materialScreeningTask, {
    projectName,
    requirementsResult,
    constraints,
    outputDir
  });

  artifacts.push(...screeningResult.artifacts);

  ctx.log('info', `Screening complete - ${screeningResult.candidateMaterials.length} candidates from ${screeningResult.totalMaterialsConsidered}`);

  // ============================================================================
  // PHASE 5: MATERIAL RANKING
  // ============================================================================

  ctx.log('info', 'Phase 5: Material Ranking');

  const rankingResult = await ctx.task(materialRankingTask, {
    projectName,
    screeningResult,
    indexResult,
    outputDir
  });

  artifacts.push(...rankingResult.artifacts);

  ctx.log('info', `Ranking complete - Top material: ${rankingResult.topMaterial}`);

  // ============================================================================
  // PHASE 6: DETAILED EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Detailed Material Evaluation');

  const evaluationResult = await ctx.task(detailedEvaluationTask, {
    projectName,
    rankingResult,
    requirementsResult,
    environmentalConditions,
    manufacturingProcess,
    outputDir
  });

  artifacts.push(...evaluationResult.artifacts);

  ctx.log('info', `Detailed evaluation complete for top ${evaluationResult.evaluatedMaterials.length} materials`);

  // ============================================================================
  // PHASE 7: COST AND AVAILABILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Cost and Availability Analysis');

  const costResult = await ctx.task(costAvailabilityTask, {
    projectName,
    evaluationResult,
    constraints,
    outputDir
  });

  artifacts.push(...costResult.artifacts);

  ctx.log('info', `Cost analysis complete - Best value: ${costResult.bestValueMaterial}`);

  // ============================================================================
  // PHASE 8: FINAL SELECTION AND RECOMMENDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Final Selection and Recommendation');

  const selectionResult = await ctx.task(finalSelectionTask, {
    projectName,
    evaluationResult,
    costResult,
    requirementsResult,
    outputDir
  });

  artifacts.push(...selectionResult.artifacts);

  ctx.log('info', `Final selection: ${selectionResult.recommendedMaterial}`);

  // Breakpoint: Review recommendation
  await ctx.breakpoint({
    question: `Material selection complete. Recommended: ${selectionResult.recommendedMaterial}. ${selectionResult.alternativeMaterials.length} alternatives identified. Review selection rationale?`,
    title: 'Material Selection Review',
    context: {
      runId: ctx.runId,
      recommendation: selectionResult.recommendedMaterial,
      alternatives: selectionResult.alternativeMaterials,
      selectionRationale: selectionResult.rationale,
      files: selectionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 9: GENERATE SELECTION REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating Material Selection Report');

  const reportResult = await ctx.task(generateMaterialReportTask, {
    projectName,
    application,
    requirementsResult,
    functionResult,
    indexResult,
    screeningResult,
    rankingResult,
    evaluationResult,
    costResult,
    selectionResult,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Material Selection Complete for ${projectName}. Recommended: ${selectionResult.recommendedMaterial}. Approve selection?`,
    title: 'Material Selection Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        recommendedMaterial: selectionResult.recommendedMaterial,
        performanceScore: selectionResult.performanceScore,
        estimatedCost: costResult.materialCosts[selectionResult.recommendedMaterial]
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'Material Selection Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    recommendedMaterials: [selectionResult.recommendedMaterial, ...selectionResult.alternativeMaterials],
    selectionMatrix: rankingResult.selectionMatrix,
    materialProperties: evaluationResult.materialProperties,
    outputFiles: {
      report: reportResult.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/material-selection',
      processSlug: 'material-selection',
      category: 'mechanical-engineering',
      timestamp: startTime,
      application
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsDefinitionTask = defineTask('requirements-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Requirements Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Engineer',
      task: 'Define material requirements for application',
      context: {
        projectName: args.projectName,
        application: args.application,
        requirements: args.requirements,
        loadingConditions: args.loadingConditions,
        environmentalConditions: args.environmentalConditions,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify mechanical property requirements:',
        '   - Strength (yield, ultimate, fatigue)',
        '   - Stiffness (elastic modulus)',
        '   - Hardness, toughness',
        '2. Identify physical property requirements:',
        '   - Density',
        '   - Thermal expansion',
        '   - Thermal/electrical conductivity',
        '3. Identify environmental requirements:',
        '   - Corrosion resistance',
        '   - Temperature range',
        '   - UV/chemical resistance',
        '4. Classify as must-have vs nice-to-have',
        '5. Define acceptance limits',
        '6. Document critical properties'
      ],
      outputFormat: 'JSON object with requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'criticalProperties', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        criticalProperties: { type: 'array' },
        mechanicalRequirements: { type: 'object' },
        physicalRequirements: { type: 'object' },
        environmentalRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'materials', 'requirements']
}));

export const functionConstraintsTask = defineTask('function-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: `Function Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Engineer',
      task: 'Analyze function and constraints per Ashby method',
      context: {
        projectName: args.projectName,
        application: args.application,
        requirementsResult: args.requirementsResult,
        constraints: args.constraints,
        manufacturingProcess: args.manufacturingProcess,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define component function:',
        '   - Structural, thermal, electrical, etc.',
        '2. Identify design objective:',
        '   - Minimize mass',
        '   - Minimize cost',
        '   - Maximize stiffness',
        '3. Identify constraints:',
        '   - Fixed dimensions',
        '   - Required strength/stiffness',
        '   - Manufacturing limits',
        '4. Identify free variables',
        '5. Create function-constraint table',
        '6. Document analysis'
      ],
      outputFormat: 'JSON object with function analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'objective', 'constraints', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        function: { type: 'string' },
        objective: { type: 'string' },
        constraints: { type: 'array' },
        freeVariables: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'materials', 'ashby-method']
}));

export const performanceIndexTask = defineTask('performance-index', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Index - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Engineer',
      task: 'Derive material performance indices',
      context: {
        projectName: args.projectName,
        functionResult: args.functionResult,
        requirementsResult: args.requirementsResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Derive performance index from function analysis:',
        '   Common indices:',
        '   - Stiff, light beam: E^(1/2)/rho',
        '   - Strong, light beam: sigma_y^(2/3)/rho',
        '   - Stiff, light panel: E^(1/3)/rho',
        '   - Thermal shock: sigma_y / (E*alpha)',
        '2. Identify primary performance index',
        '3. Identify secondary indices',
        '4. Define selection guidelines',
        '5. Document derivation steps',
        '6. Create Ashby chart selection lines'
      ],
      outputFormat: 'JSON object with performance indices'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'primaryIndex', 'indices', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        primaryIndex: { type: 'string' },
        indices: { type: 'array' },
        derivations: { type: 'object' },
        selectionGuidelines: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'materials', 'performance-index']
}));

export const materialScreeningTask = defineTask('material-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: `Material Screening - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Engineer',
      task: 'Screen materials against requirements',
      context: {
        projectName: args.projectName,
        requirementsResult: args.requirementsResult,
        constraints: args.constraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply attribute limits (pass/fail):',
        '   - Minimum strength',
        '   - Maximum density',
        '   - Temperature capability',
        '   - Corrosion resistance',
        '2. Screen by manufacturing compatibility',
        '3. Screen by availability',
        '4. Create candidate list from:',
        '   - Metals and alloys',
        '   - Polymers',
        '   - Ceramics',
        '   - Composites',
        '5. Document screening criteria',
        '6. Create screening matrix'
      ],
      outputFormat: 'JSON object with screening results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'candidateMaterials', 'totalMaterialsConsidered', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        candidateMaterials: { type: 'array' },
        totalMaterialsConsidered: { type: 'number' },
        screeningMatrix: { type: 'object' },
        rejectedMaterials: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'materials', 'screening']
}));

export const materialRankingTask = defineTask('material-ranking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Material Ranking - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Engineer',
      task: 'Rank candidate materials by performance index',
      context: {
        projectName: args.projectName,
        screeningResult: args.screeningResult,
        indexResult: args.indexResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate performance index for each candidate',
        '2. Rank by primary performance index',
        '3. Apply secondary index rankings',
        '4. Create weighted composite score',
        '5. Identify top performers',
        '6. Create selection matrix',
        '7. Plot on Ashby charts'
      ],
      outputFormat: 'JSON object with ranking results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'topMaterial', 'rankings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        topMaterial: { type: 'string' },
        rankings: { type: 'array' },
        selectionMatrix: { type: 'object' },
        ashbyPlots: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'materials', 'ranking']
}));

export const detailedEvaluationTask = defineTask('detailed-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Detailed Evaluation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Engineer',
      task: 'Perform detailed evaluation of top materials',
      context: {
        projectName: args.projectName,
        rankingResult: args.rankingResult,
        requirementsResult: args.requirementsResult,
        environmentalConditions: args.environmentalConditions,
        manufacturingProcess: args.manufacturingProcess,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Gather detailed property data for top candidates',
        '2. Evaluate fatigue performance',
        '3. Evaluate corrosion/degradation behavior',
        '4. Assess manufacturing characteristics:',
        '   - Machinability',
        '   - Weldability',
        '   - Formability',
        '5. Evaluate joining methods',
        '6. Check available forms (bar, sheet, tube)',
        '7. Identify potential issues',
        '8. Document material specifications'
      ],
      outputFormat: 'JSON object with detailed evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'evaluatedMaterials', 'materialProperties', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        evaluatedMaterials: { type: 'array' },
        materialProperties: { type: 'object' },
        manufacturingAssessment: { type: 'object' },
        potentialIssues: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'materials', 'evaluation']
}));

export const costAvailabilityTask = defineTask('cost-availability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cost Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Engineer',
      task: 'Analyze cost and availability',
      context: {
        projectName: args.projectName,
        evaluationResult: args.evaluationResult,
        constraints: args.constraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Obtain material costs ($/kg)',
        '2. Calculate component cost considering:',
        '   - Material volume',
        '   - Scrap/buyout ratio',
        '   - Processing cost',
        '3. Evaluate supplier availability',
        '4. Check lead times',
        '5. Consider alternative grades',
        '6. Calculate total cost of ownership',
        '7. Identify best value option'
      ],
      outputFormat: 'JSON object with cost analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'materialCosts', 'bestValueMaterial', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        materialCosts: { type: 'object' },
        bestValueMaterial: { type: 'string' },
        availability: { type: 'object' },
        leadTimes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'materials', 'cost-analysis']
}));

export const finalSelectionTask = defineTask('final-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Final Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Engineer',
      task: 'Make final material selection',
      context: {
        projectName: args.projectName,
        evaluationResult: args.evaluationResult,
        costResult: args.costResult,
        requirementsResult: args.requirementsResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Combine performance and cost rankings',
        '2. Apply weighting factors',
        '3. Consider risk factors',
        '4. Select recommended material',
        '5. Identify alternative materials',
        '6. Document selection rationale',
        '7. Specify material completely:',
        '   - Grade/alloy',
        '   - Condition/temper',
        '   - Specifications',
        '8. Note any special considerations'
      ],
      outputFormat: 'JSON object with final selection'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'recommendedMaterial', 'alternativeMaterials', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        recommendedMaterial: { type: 'string' },
        alternativeMaterials: { type: 'array' },
        performanceScore: { type: 'number' },
        rationale: { type: 'string' },
        specification: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'materials', 'selection']
}));

export const generateMaterialReportTask = defineTask('generate-material-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Material Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive material selection report',
      context: {
        projectName: args.projectName,
        application: args.application,
        requirementsResult: args.requirementsResult,
        functionResult: args.functionResult,
        indexResult: args.indexResult,
        screeningResult: args.screeningResult,
        rankingResult: args.rankingResult,
        evaluationResult: args.evaluationResult,
        costResult: args.costResult,
        selectionResult: args.selectionResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary',
        '2. Document requirements and constraints',
        '3. Present Ashby method analysis',
        '4. Show screening results',
        '5. Present ranking and evaluation',
        '6. Include cost analysis',
        '7. State final recommendation',
        '8. Include material data sheets',
        '9. Document procurement specs',
        '10. State conclusions'
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
  labels: ['mechanical-engineering', 'materials', 'reporting']
}));
