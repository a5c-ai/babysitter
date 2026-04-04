/**
 * @process specializations/domains/science/nanotechnology/green-synthesis
 * @description Green Synthesis Route Development - Design environmentally sustainable nanomaterial
 * synthesis routes using bio-based precursors, aqueous solvents, and energy-efficient processes
 * with lifecycle assessment, waste minimization validation, and comparison against conventional methods.
 * @inputs { targetNanomaterial: object, sustainabilityGoals: object, constraints?: object }
 * @outputs { success: boolean, greenRoute: object, lcaResults: object, comparisonMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/green-synthesis', {
 *   targetNanomaterial: { type: 'silver-nanoparticle', size: 20, shape: 'spherical' },
 *   sustainabilityGoals: { reducingAgent: 'plant-extract', solvent: 'water', energyEfficiency: 'high' },
 *   constraints: { biocompatible: true, costEffective: true }
 * });
 *
 * @references
 * - Green Synthesis of Nanomaterials: https://www.frontiersin.org/articles/10.3389/fchem.2019.00187/full
 * - EPA Nanotechnology White Paper: https://www.epa.gov/chemical-research/nanotechnology-white-paper
 * - OECD Guidelines for Testing of Manufactured Nanomaterials: https://www.oecd.org/science/nanotechnology/testing-nanomaterials/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    targetNanomaterial,
    sustainabilityGoals,
    constraints = {},
    maxIterations = 4,
    greenScoreTarget = 80
  } = inputs;

  // Phase 1: Green Chemistry Analysis
  const greenChemistryAnalysis = await ctx.task(greenChemistryAnalysisTask, {
    targetNanomaterial,
    sustainabilityGoals,
    constraints
  });

  // Phase 2: Bio-based Precursor Selection
  const precursorSelection = await ctx.task(bioPrecursorSelectionTask, {
    targetNanomaterial,
    sustainabilityGoals,
    greenChemistryAnalysis
  });

  await ctx.breakpoint({
    question: `Bio-based precursors identified for ${targetNanomaterial.type}. Review and approve?`,
    title: 'Green Precursor Selection Review',
    context: {
      runId: ctx.runId,
      precursors: precursorSelection.selectedPrecursors,
      sustainabilityScore: precursorSelection.sustainabilityScore
    }
  });

  // Phase 3: Green Route Design with Iteration
  let iteration = 0;
  let currentGreenScore = 0;
  let greenRoute = null;
  const optimizationHistory = [];

  while (iteration < maxIterations && currentGreenScore < greenScoreTarget) {
    iteration++;

    const routeDesign = await ctx.task(greenRouteDesignTask, {
      targetNanomaterial,
      precursorSelection,
      sustainabilityGoals,
      iteration,
      previousResults: iteration > 1 ? optimizationHistory[iteration - 2] : null
    });

    // Lifecycle assessment
    const lcaAssessment = await ctx.task(lifecycleAssessmentTask, {
      greenRoute: routeDesign,
      targetNanomaterial
    });

    currentGreenScore = lcaAssessment.overallGreenScore;
    greenRoute = routeDesign;

    optimizationHistory.push({
      iteration,
      route: routeDesign,
      lcaAssessment,
      greenScore: currentGreenScore
    });

    if (currentGreenScore < greenScoreTarget && iteration < maxIterations) {
      await ctx.breakpoint({
        question: `Green score: ${currentGreenScore}/${greenScoreTarget}. Continue optimization?`,
        title: 'Green Synthesis Optimization Progress',
        context: { runId: ctx.runId, iteration, currentGreenScore, lcaAssessment }
      });
    }
  }

  // Phase 4: Waste Minimization Validation
  const wasteValidation = await ctx.task(wasteMinimizationTask, {
    greenRoute,
    targetNanomaterial
  });

  // Phase 5: Energy Efficiency Assessment
  const energyAssessment = await ctx.task(energyEfficiencyTask, {
    greenRoute,
    targetNanomaterial
  });

  // Phase 6: Comparison with Conventional Methods
  const comparisonAnalysis = await ctx.task(conventionalComparisonTask, {
    greenRoute,
    targetNanomaterial,
    optimizationHistory
  });

  // Phase 7: Property Parity Validation
  const propertyValidation = await ctx.task(propertyParityTask, {
    greenRoute,
    targetNanomaterial,
    comparisonAnalysis
  });

  // Quality Gate: Must achieve property parity
  if (!propertyValidation.parityAchieved) {
    await ctx.breakpoint({
      question: `Property parity not achieved. Gap: ${propertyValidation.parityGap}%. Accept trade-off or continue development?`,
      title: 'Property Parity Warning',
      context: {
        runId: ctx.runId,
        propertyValidation,
        recommendations: propertyValidation.recommendations
      }
    });
  }

  // Phase 8: Documentation and Certification
  const documentation = await ctx.task(greenSynthesisDocumentationTask, {
    greenRoute,
    targetNanomaterial,
    lcaResults: optimizationHistory[iteration - 1].lcaAssessment,
    wasteValidation,
    energyAssessment,
    comparisonAnalysis,
    propertyValidation
  });

  await ctx.breakpoint({
    question: `Green synthesis route complete. Green Score: ${currentGreenScore}. Approve for implementation?`,
    title: 'Green Synthesis Approval',
    context: {
      runId: ctx.runId,
      greenScore: currentGreenScore,
      wasteReduction: wasteValidation.reductionPercentage,
      energySavings: energyAssessment.savingsPercentage,
      propertyParity: propertyValidation.parityAchieved
    }
  });

  return {
    success: true,
    greenRoute,
    lcaResults: optimizationHistory[iteration - 1].lcaAssessment,
    comparisonMetrics: comparisonAnalysis,
    wasteMetrics: wasteValidation,
    energyMetrics: energyAssessment,
    propertyParity: propertyValidation,
    greenScore: currentGreenScore,
    documentation,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/green-synthesis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const greenChemistryAnalysisTask = defineTask('green-chemistry-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze green chemistry principles',
  agent: {
    name: 'green-chemistry-expert',
    prompt: {
      role: 'Green Chemistry Expert',
      task: 'Analyze green chemistry opportunities for nanomaterial synthesis',
      context: args,
      instructions: [
        '1. Evaluate all 12 principles of green chemistry applicability',
        '2. Identify conventional synthesis hazards and waste streams',
        '3. Map opportunities for green alternatives',
        '4. Assess atom economy potential',
        '5. Evaluate solvent selection for sustainability',
        '6. Identify energy reduction opportunities',
        '7. Assess renewable feedstock possibilities',
        '8. Evaluate toxicity reduction potential',
        '9. Consider real-time monitoring for waste prevention',
        '10. Prioritize green chemistry interventions by impact'
      ],
      outputFormat: 'JSON object with green chemistry analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['greenPrinciplesAnalysis', 'opportunities', 'priorities'],
      properties: {
        greenPrinciplesAnalysis: { type: 'object' },
        opportunities: { type: 'array', items: { type: 'object' } },
        conventionalHazards: { type: 'array', items: { type: 'string' } },
        priorities: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'green-chemistry', 'analysis']
}));

export const bioPrecursorSelectionTask = defineTask('bio-precursor-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select bio-based precursors',
  agent: {
    name: 'bio-materials-scientist',
    prompt: {
      role: 'Bio-based Materials Scientist',
      task: 'Select sustainable bio-based precursors for green synthesis',
      context: args,
      instructions: [
        '1. Identify plant extracts with reducing/capping capability',
        '2. Evaluate microbial synthesis options',
        '3. Screen biomolecules for nanoparticle synthesis',
        '4. Assess precursor availability and cost',
        '5. Evaluate batch-to-batch consistency of bio-sources',
        '6. Consider seasonal/regional availability',
        '7. Assess processing requirements for bio-precursors',
        '8. Evaluate scalability potential',
        '9. Compare with conventional precursor performance',
        '10. Calculate sustainability score for each option'
      ],
      outputFormat: 'JSON object with precursor selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedPrecursors', 'sustainabilityScore', 'feasibilityAssessment'],
      properties: {
        selectedPrecursors: { type: 'array', items: { type: 'object' } },
        sustainabilityScore: { type: 'number' },
        feasibilityAssessment: { type: 'object' },
        alternatives: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'green-synthesis', 'precursors']
}));

export const greenRouteDesignTask = defineTask('green-route-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design green synthesis route (iteration ${args.iteration})`,
  agent: {
    name: 'process-chemist',
    prompt: {
      role: 'Green Process Chemist',
      task: 'Design environmentally sustainable synthesis route',
      context: args,
      instructions: [
        '1. Design aqueous-based reaction system',
        '2. Optimize bio-precursor concentrations',
        '3. Minimize reaction temperature requirements',
        '4. Reduce reaction time through optimization',
        '5. Eliminate or minimize hazardous reagents',
        '6. Design for catalyst-free or bio-catalyst systems',
        '7. Implement solvent-free or water-only processes',
        '8. Design for minimal downstream processing',
        '9. Consider continuous vs batch processing',
        '10. Incorporate previous iteration learnings'
      ],
      outputFormat: 'JSON object with green route design'
    },
    outputSchema: {
      type: 'object',
      required: ['reactionProtocol', 'greenFeatures', 'expectedOutcomes'],
      properties: {
        reactionProtocol: { type: 'object' },
        greenFeatures: { type: 'array', items: { type: 'string' } },
        expectedOutcomes: { type: 'object' },
        processParameters: { type: 'object' },
        improvements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'green-synthesis', 'route-design', `iteration-${args.iteration}`]
}));

export const lifecycleAssessmentTask = defineTask('lifecycle-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct lifecycle assessment',
  agent: {
    name: 'lca-specialist',
    prompt: {
      role: 'Lifecycle Assessment Specialist',
      task: 'Conduct comprehensive LCA of green synthesis route',
      context: args,
      instructions: [
        '1. Define system boundaries for LCA',
        '2. Inventory all material inputs and outputs',
        '3. Calculate carbon footprint (CO2 equivalent)',
        '4. Assess water usage and water quality impact',
        '5. Evaluate energy consumption across lifecycle',
        '6. Assess toxicity potential (human and ecological)',
        '7. Calculate resource depletion metrics',
        '8. Compare with conventional synthesis LCA',
        '9. Identify hotspots for further improvement',
        '10. Calculate overall green score'
      ],
      outputFormat: 'JSON object with LCA results'
    },
    outputSchema: {
      type: 'object',
      required: ['overallGreenScore', 'carbonFootprint', 'waterUsage', 'energyConsumption'],
      properties: {
        overallGreenScore: { type: 'number' },
        carbonFootprint: { type: 'object' },
        waterUsage: { type: 'object' },
        energyConsumption: { type: 'object' },
        toxicityPotential: { type: 'object' },
        resourceDepletion: { type: 'object' },
        hotspots: { type: 'array', items: { type: 'string' } },
        improvementOpportunities: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'lca', 'sustainability']
}));

export const wasteMinimizationTask = defineTask('waste-minimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate waste minimization',
  agent: {
    name: 'environmental-engineer',
    prompt: {
      role: 'Environmental Engineer',
      task: 'Validate waste minimization achievements',
      context: args,
      instructions: [
        '1. Quantify all waste streams from green synthesis',
        '2. Compare with conventional synthesis waste',
        '3. Classify waste by hazard category',
        '4. Assess waste treatment requirements',
        '5. Evaluate potential for waste valorization',
        '6. Calculate E-factor (kg waste/kg product)',
        '7. Assess circular economy potential',
        '8. Verify compliance with regulations',
        '9. Recommend further waste reduction strategies',
        '10. Calculate waste reduction percentage'
      ],
      outputFormat: 'JSON object with waste minimization validation'
    },
    outputSchema: {
      type: 'object',
      required: ['reductionPercentage', 'eFactor', 'wasteStreams'],
      properties: {
        reductionPercentage: { type: 'number' },
        eFactor: { type: 'number' },
        wasteStreams: { type: 'array', items: { type: 'object' } },
        valorization: { type: 'object' },
        compliance: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'waste-minimization', 'sustainability']
}));

export const energyEfficiencyTask = defineTask('energy-efficiency', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess energy efficiency',
  agent: {
    name: 'energy-analyst',
    prompt: {
      role: 'Energy Efficiency Analyst',
      task: 'Assess energy efficiency of green synthesis route',
      context: args,
      instructions: [
        '1. Calculate total energy input for synthesis',
        '2. Break down energy by process step',
        '3. Compare with conventional synthesis energy',
        '4. Assess potential for renewable energy use',
        '5. Evaluate heating/cooling energy requirements',
        '6. Consider process intensification options',
        '7. Assess ambient condition synthesis potential',
        '8. Calculate energy savings percentage',
        '9. Recommend energy optimization strategies',
        '10. Project energy costs at scale'
      ],
      outputFormat: 'JSON object with energy assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['savingsPercentage', 'totalEnergy', 'breakdown'],
      properties: {
        savingsPercentage: { type: 'number' },
        totalEnergy: { type: 'object' },
        breakdown: { type: 'object' },
        renewableIntegration: { type: 'object' },
        optimizationOpportunities: { type: 'array', items: { type: 'string' } },
        costProjection: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'energy-efficiency', 'sustainability']
}));

export const conventionalComparisonTask = defineTask('conventional-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare with conventional methods',
  agent: {
    name: 'comparative-analyst',
    prompt: {
      role: 'Nanomaterial Synthesis Analyst',
      task: 'Compare green route with conventional synthesis methods',
      context: args,
      instructions: [
        '1. Identify standard conventional synthesis method',
        '2. Compare yield and productivity',
        '3. Compare product quality metrics',
        '4. Compare environmental impact metrics',
        '5. Compare cost per unit product',
        '6. Compare scalability potential',
        '7. Compare process complexity',
        '8. Compare safety profiles',
        '9. Identify trade-offs and advantages',
        '10. Provide overall recommendation'
      ],
      outputFormat: 'JSON object with comparison analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['yieldComparison', 'qualityComparison', 'environmentalComparison', 'costComparison'],
      properties: {
        yieldComparison: { type: 'object' },
        qualityComparison: { type: 'object' },
        environmentalComparison: { type: 'object' },
        costComparison: { type: 'object' },
        scalabilityComparison: { type: 'object' },
        tradeoffs: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'comparison', 'analysis']
}));

export const propertyParityTask = defineTask('property-parity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate property parity',
  agent: {
    name: 'materials-characterization-expert',
    prompt: {
      role: 'Materials Characterization Expert',
      task: 'Validate that green synthesis achieves property parity with conventional methods',
      context: args,
      instructions: [
        '1. Define critical quality attributes for comparison',
        '2. Compare particle size and distribution',
        '3. Compare morphology and crystallinity',
        '4. Compare surface properties',
        '5. Compare optical/electronic properties',
        '6. Compare stability and shelf-life',
        '7. Compare application performance',
        '8. Calculate parity gap for each attribute',
        '9. Identify attributes not meeting parity',
        '10. Recommend strategies to close gaps'
      ],
      outputFormat: 'JSON object with property parity validation'
    },
    outputSchema: {
      type: 'object',
      required: ['parityAchieved', 'parityGap', 'attributeComparison'],
      properties: {
        parityAchieved: { type: 'boolean' },
        parityGap: { type: 'number' },
        attributeComparison: { type: 'array', items: { type: 'object' } },
        attributesNotMeetingParity: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'property-parity', 'validation']
}));

export const greenSynthesisDocumentationTask = defineTask('green-synthesis-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document green synthesis protocol',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer specializing in Green Chemistry',
      task: 'Generate comprehensive green synthesis documentation',
      context: args,
      instructions: [
        '1. Create executive summary highlighting sustainability achievements',
        '2. Document complete green synthesis protocol',
        '3. Include LCA results and environmental metrics',
        '4. Document comparison with conventional methods',
        '5. Include safety and handling information',
        '6. Document quality control procedures',
        '7. Add troubleshooting guide',
        '8. Include regulatory compliance information',
        '9. Generate sustainability certification documentation',
        '10. Create operator and technical versions'
      ],
      outputFormat: 'JSON object with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'protocol', 'certificationDocs', 'artifacts'],
      properties: {
        markdown: { type: 'string' },
        protocol: { type: 'object' },
        certificationDocs: { type: 'object' },
        regulatoryCompliance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'documentation', 'green-synthesis']
}));
