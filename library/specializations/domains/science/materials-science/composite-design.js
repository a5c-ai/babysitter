/**
 * @process MS-022: Composite Design & Optimization
 * @description Comprehensive composite material design including laminate analysis,
 * fiber-matrix selection, layup optimization, and manufacturing process specification
 * @inputs {
 *   applicationRequirements: object,
 *   loadCases: object[], // mechanical, thermal, environmental loads
 *   geometryConstraints: object,
 *   compositeType: string, // CFRP, GFRP, aramid, hybrid, CMC
 *   manufacturingProcess: string, // autoclave, RTM, filament-winding, pultrusion
 *   designStandards: string[],
 *   projectContext: string
 * }
 * @outputs {
 *   compositeDesign: object,
 *   laminateDefinition: object,
 *   structuralAnalysis: object,
 *   manufacturingSpecification: object,
 *   qualificationPlan: object,
 *   artifacts: string[]
 * }
 * @example
 * {
 *   "applicationRequirements": { "component": "wing-skin", "loadType": "combined", "environment": "aerospace" },
 *   "loadCases": [{ "type": "tension", "magnitude": "500MPa" }, { "type": "compression", "magnitude": "300MPa" }],
 *   "compositeType": "CFRP",
 *   "manufacturingProcess": "autoclave",
 *   "designStandards": ["CMH-17", "MIL-HDBK-17"]
 * }
 * @references CMH-17 Composite Materials Handbook, ASTM D Standards, MIL-HDBK-17
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    applicationRequirements,
    loadCases,
    geometryConstraints,
    compositeType,
    manufacturingProcess,
    designStandards,
    projectContext
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Requirements Analysis and Constituent Selection
  ctx.log('info', 'Phase 1: Analyzing requirements and selecting constituents');
  const constituentSelection = await ctx.task(selectConstituents, {
    applicationRequirements,
    compositeType,
    loadCases,
    environmentalConditions: inputs.environmentalConditions,
    designStandards,
    projectContext
  });
  artifacts.push(...(constituentSelection.artifacts || []));

  // Phase 2: Micromechanics Analysis
  ctx.log('info', 'Phase 2: Performing micromechanics analysis');
  const micromechanicsAnalysis = await ctx.task(analyzeMicromechanics, {
    fiberProperties: constituentSelection.fiberProperties,
    matrixProperties: constituentSelection.matrixProperties,
    fiberVolumeFraction: inputs.targetVf || 0.60,
    interfaceProperties: inputs.interfaceProperties
  });
  artifacts.push(...(micromechanicsAnalysis.artifacts || []));

  // Phase 3: Laminate Design
  ctx.log('info', 'Phase 3: Designing laminate architecture');
  const laminateDesign = await ctx.task(designLaminate, {
    plyProperties: micromechanicsAnalysis.plyProperties,
    loadCases,
    geometryConstraints,
    designRules: inputs.designRules || 'standard',
    symmetryRequirements: inputs.symmetryRequirements,
    balanceRequirements: inputs.balanceRequirements
  });
  artifacts.push(...(laminateDesign.artifacts || []));

  // Phase 4: Classical Laminate Theory Analysis
  ctx.log('info', 'Phase 4: Performing CLT analysis');
  const cltAnalysis = await ctx.task(performCLTAnalysis, {
    laminateDefinition: laminateDesign.laminate,
    plyProperties: micromechanicsAnalysis.plyProperties,
    loadCases,
    thermalLoads: inputs.thermalLoads,
    moistureEffects: inputs.moistureEffects
  });
  artifacts.push(...(cltAnalysis.artifacts || []));

  // Phase 5: Failure Analysis
  ctx.log('info', 'Phase 5: Performing failure analysis');
  const failureAnalysis = await ctx.task(analyzeFailure, {
    laminateStresses: cltAnalysis.stresses,
    plyStrengths: micromechanicsAnalysis.plyStrengths,
    failureCriteria: inputs.failureCriteria || ['Tsai-Wu', 'Puck', 'LaRC'],
    designAllowables: inputs.designAllowables
  });
  artifacts.push(...(failureAnalysis.artifacts || []));

  // Quality Gate: Review initial design
  await ctx.breakpoint({
    question: 'Review the laminate design and failure analysis. Is the design adequate for the load cases?',
    title: 'Laminate Design Review',
    context: {
      runId: ctx.runId,
      summary: {
        laminate: laminateDesign.laminate,
        margins: failureAnalysis.margins,
        criticalPly: failureAnalysis.criticalPly,
        criticalMode: failureAnalysis.criticalMode
      },
      files: artifacts
    }
  });

  // Phase 6: Design Optimization
  ctx.log('info', 'Phase 6: Optimizing laminate design');
  const designOptimization = await ctx.task(optimizeLaminate, {
    initialDesign: laminateDesign.laminate,
    failureResults: failureAnalysis.results,
    optimizationObjectives: inputs.optimizationObjectives || ['minimize weight'],
    constraints: {
      geometry: geometryConstraints,
      manufacturing: inputs.manufacturingConstraints,
      minMargin: inputs.minimumMargin || 1.0
    }
  });
  artifacts.push(...(designOptimization.artifacts || []));

  // Phase 7: Detailed Structural Analysis
  ctx.log('info', 'Phase 7: Performing detailed structural analysis');
  const detailedAnalysis = await ctx.task(performDetailedAnalysis, {
    optimizedLaminate: designOptimization.optimizedLaminate,
    loadCases,
    analysisTypes: inputs.analysisTypes || ['buckling', 'damage-tolerance', 'fatigue'],
    geometryConstraints
  });
  artifacts.push(...(detailedAnalysis.artifacts || []));

  // Phase 8: Manufacturing Specification
  ctx.log('info', 'Phase 8: Developing manufacturing specification');
  const manufacturingSpec = await ctx.task(specifyManufacturing, {
    finalLaminate: designOptimization.optimizedLaminate,
    manufacturingProcess,
    constituentMaterials: constituentSelection.selectedMaterials,
    qualityRequirements: inputs.qualityRequirements,
    toleranceRequirements: inputs.toleranceRequirements
  });
  artifacts.push(...(manufacturingSpec.artifacts || []));

  // Phase 9: Qualification Plan
  ctx.log('info', 'Phase 9: Developing qualification plan');
  const qualificationPlan = await ctx.task(developQualificationPlan, {
    compositeDesign: designOptimization.optimizedLaminate,
    designStandards,
    testingRequirements: inputs.testingRequirements,
    certificationBasis: inputs.certificationBasis,
    buildingBlockApproach: inputs.buildingBlockApproach
  });
  artifacts.push(...(qualificationPlan.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true,
    compositeDesign: {
      constituents: constituentSelection.selectedMaterials,
      fiberVolumeFraction: micromechanicsAnalysis.actualVf,
      architecture: designOptimization.architecture,
      plyProperties: micromechanicsAnalysis.plyProperties,
      laminateProperties: cltAnalysis.laminateProperties
    },
    laminateDefinition: {
      stackingSequence: designOptimization.optimizedLaminate.stackingSequence,
      plyOrientations: designOptimization.optimizedLaminate.orientations,
      plyThicknesses: designOptimization.optimizedLaminate.thicknesses,
      totalThickness: designOptimization.optimizedLaminate.totalThickness,
      symmetry: designOptimization.optimizedLaminate.symmetry,
      balance: designOptimization.optimizedLaminate.balance
    },
    structuralAnalysis: {
      cltResults: cltAnalysis.results,
      failureAnalysis: failureAnalysis.results,
      margins: failureAnalysis.margins,
      bucklingAnalysis: detailedAnalysis.buckling,
      damageTolerance: detailedAnalysis.damageTolerance,
      fatigueAnalysis: detailedAnalysis.fatigue
    },
    manufacturingSpecification: {
      processParameters: manufacturingSpec.processParameters,
      layupSequence: manufacturingSpec.layupSequence,
      curingCycle: manufacturingSpec.curingCycle,
      qualityControl: manufacturingSpec.qualityControl,
      inspectionRequirements: manufacturingSpec.inspection
    },
    qualificationPlan: {
      testMatrix: qualificationPlan.testMatrix,
      buildingBlocks: qualificationPlan.buildingBlocks,
      couponTests: qualificationPlan.couponTests,
      elementTests: qualificationPlan.elementTests,
      subcomponentTests: qualificationPlan.subcomponentTests,
      certificationPath: qualificationPlan.certificationPath
    },
    artifacts,
    metadata: {
      processId: 'MS-022',
      startTime,
      endTime,
      duration: endTime - startTime
    }
  };
}

export const selectConstituents = defineTask('select-constituents', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Constituent Material Selection',
  agent: {
    name: 'composite-constituents-specialist',
    prompt: {
      role: 'Composite materials engineer specializing in fiber and matrix selection',
      task: `Select fiber and matrix constituents for ${args.compositeType} composite`,
      context: args,
      instructions: [
        'Evaluate fiber options (carbon, glass, aramid, etc.)',
        'Select appropriate fiber grade and form',
        'Evaluate matrix systems (epoxy, BMI, PEEK, etc.)',
        'Consider cure temperature and Tg requirements',
        'Assess fiber-matrix compatibility',
        'Review prepreg or dry fiber options',
        'Consider cost and availability factors',
        'Reference qualified material systems'
      ],
      outputFormat: 'JSON with selected constituents and properties'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedMaterials', 'fiberProperties', 'matrixProperties', 'artifacts'],
      properties: {
        selectedMaterials: { type: 'object' },
        fiberProperties: { type: 'object' },
        matrixProperties: { type: 'object' },
        interfaceCharacteristics: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'constituents', 'selection', 'composites']
}));

export const analyzeMicromechanics = defineTask('analyze-micromechanics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Micromechanics Analysis',
  agent: {
    name: 'micromechanics-analyst',
    prompt: {
      role: 'Composite micromechanics specialist',
      task: 'Perform micromechanics analysis to derive ply properties',
      context: args,
      instructions: [
        'Apply rule of mixtures for longitudinal properties',
        'Use Halpin-Tsai or other models for transverse properties',
        'Calculate shear moduli and Poisson ratios',
        'Derive ply strength values',
        'Account for fiber volume fraction effects',
        'Consider void content effects',
        'Calculate thermal expansion coefficients',
        'Document model assumptions and validity'
      ],
      outputFormat: 'JSON with ply properties'
    },
    outputSchema: {
      type: 'object',
      required: ['plyProperties', 'plyStrengths', 'actualVf', 'artifacts'],
      properties: {
        plyProperties: { type: 'object' },
        plyStrengths: { type: 'object' },
        actualVf: { type: 'number' },
        thermalProperties: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'micromechanics', 'analysis', 'composites']
}));

export const designLaminate = defineTask('design-laminate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Laminate Architecture Design',
  agent: {
    name: 'laminate-design-engineer',
    prompt: {
      role: 'Composite structures engineer for laminate design',
      task: 'Design laminate stacking sequence for load requirements',
      context: args,
      instructions: [
        'Analyze load cases and determine dominant loads',
        'Select ply orientations to carry loads efficiently',
        'Apply design rules (symmetric, balanced, etc.)',
        'Distribute plies to avoid excessive angle changes',
        'Protect outer surfaces from impact damage',
        'Consider manufacturing constraints on angles',
        'Minimize coupling effects unless desired',
        'Document design rationale for each ply group'
      ],
      outputFormat: 'JSON with laminate definition'
    },
    outputSchema: {
      type: 'object',
      required: ['laminate', 'artifacts'],
      properties: {
        laminate: { type: 'object' },
        designRationale: { type: 'object' },
        plyGroups: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'laminate-design', 'architecture', 'composites']
}));

export const performCLTAnalysis = defineTask('perform-clt-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classical Laminate Theory Analysis',
  agent: {
    name: 'clt-analyst',
    prompt: {
      role: 'Structural analyst for composite laminate analysis',
      task: 'Perform Classical Laminate Theory analysis',
      context: args,
      instructions: [
        'Build ply stiffness matrices [Q]',
        'Transform to laminate coordinates',
        'Assemble [A], [B], [D] matrices',
        'Apply loads and calculate strains',
        'Calculate ply stresses and strains',
        'Account for thermal and moisture effects',
        'Calculate laminate engineering constants',
        'Check for coupling behavior'
      ],
      outputFormat: 'JSON with CLT analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'stresses', 'laminateProperties', 'artifacts'],
      properties: {
        results: { type: 'object' },
        stresses: { type: 'object' },
        strains: { type: 'object' },
        laminateProperties: { type: 'object' },
        abdMatrices: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clt', 'structural-analysis', 'composites']
}));

export const analyzeFailure = defineTask('analyze-failure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Composite Failure Analysis',
  agent: {
    name: 'composite-failure-analyst',
    prompt: {
      role: 'Composite failure analysis specialist',
      task: 'Analyze composite laminate failure using multiple criteria',
      context: args,
      instructions: [
        'Apply selected failure criteria to each ply',
        'Calculate failure indices for fiber and matrix modes',
        'Identify first ply failure load',
        'Determine progressive failure sequence',
        'Calculate margins of safety',
        'Identify critical ply and failure mode',
        'Compare results across failure theories',
        'Apply knockdown factors per design standards'
      ],
      outputFormat: 'JSON with failure analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'margins', 'criticalPly', 'criticalMode', 'artifacts'],
      properties: {
        results: { type: 'object' },
        margins: { type: 'object' },
        failureIndices: { type: 'array' },
        criticalPly: { type: 'number' },
        criticalMode: { type: 'string' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-analysis', 'strength', 'composites']
}));

export const optimizeLaminate = defineTask('optimize-laminate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Laminate Optimization',
  agent: {
    name: 'laminate-optimization-engineer',
    prompt: {
      role: 'Composite optimization specialist',
      task: 'Optimize laminate design for objectives and constraints',
      context: args,
      instructions: [
        'Define optimization variables (plies, angles, thickness)',
        'Formulate objective function (weight, cost, etc.)',
        'Apply strength and stiffness constraints',
        'Apply manufacturing and design rule constraints',
        'Use gradient or genetic algorithm optimization',
        'Verify optimized design meets all requirements',
        'Round to manufacturable ply counts',
        'Document optimization process and convergence'
      ],
      outputFormat: 'JSON with optimized laminate'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedLaminate', 'architecture', 'artifacts'],
      properties: {
        optimizedLaminate: { type: 'object' },
        architecture: { type: 'object' },
        optimizationHistory: { type: 'array' },
        improvement: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'optimization', 'design', 'composites']
}));

export const performDetailedAnalysis = defineTask('perform-detailed-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detailed Structural Analysis',
  agent: {
    name: 'detailed-analysis-engineer',
    prompt: {
      role: 'Senior composite structures analyst',
      task: 'Perform detailed structural analysis of optimized laminate',
      context: args,
      instructions: [
        'Perform buckling analysis for compression/shear loads',
        'Analyze damage tolerance and BVID effects',
        'Conduct fatigue analysis for cyclic loads',
        'Evaluate notched strength and open hole effects',
        'Analyze bolted joint bearing/bypass',
        'Check environmental degradation effects',
        'Apply appropriate knockdown factors',
        'Document analysis methods and assumptions'
      ],
      outputFormat: 'JSON with detailed analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['buckling', 'damageTolerance', 'fatigue', 'artifacts'],
      properties: {
        buckling: { type: 'object' },
        damageTolerance: { type: 'object' },
        fatigue: { type: 'object' },
        notchedStrength: { type: 'object' },
        jointAnalysis: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'structural-analysis', 'detailed', 'composites']
}));

export const specifyManufacturing = defineTask('specify-manufacturing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manufacturing Specification',
  agent: {
    name: 'composite-manufacturing-engineer',
    prompt: {
      role: 'Composite manufacturing engineer',
      task: `Specify manufacturing requirements for ${args.manufacturingProcess} process`,
      context: args,
      instructions: [
        'Define layup sequence and ply book',
        'Specify material handling and out-time limits',
        'Define debulk and compaction requirements',
        'Specify cure cycle parameters and tolerances',
        'Define tooling requirements and tool materials',
        'Establish quality control checkpoints',
        'Define NDT inspection requirements',
        'Document process specifications and work instructions'
      ],
      outputFormat: 'JSON with manufacturing specification'
    },
    outputSchema: {
      type: 'object',
      required: ['processParameters', 'layupSequence', 'curingCycle', 'qualityControl', 'inspection', 'artifacts'],
      properties: {
        processParameters: { type: 'object' },
        layupSequence: { type: 'array' },
        curingCycle: { type: 'object' },
        qualityControl: { type: 'object' },
        inspection: { type: 'object' },
        toolingRequirements: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'manufacturing', 'specification', 'composites']
}));

export const developQualificationPlan = defineTask('develop-qualification-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Qualification Plan Development',
  agent: {
    name: 'qualification-plan-engineer',
    prompt: {
      role: 'Composite qualification engineer',
      task: 'Develop building block qualification plan',
      context: args,
      instructions: [
        'Define building block test pyramid',
        'Specify coupon-level tests (tension, compression, shear)',
        'Define element-level tests (OHT, OHC, CAI)',
        'Plan subcomponent tests',
        'Specify environmental conditioning requirements',
        'Define statistical basis and sampling',
        'Map tests to allowables generation',
        'Document certification approach'
      ],
      outputFormat: 'JSON with qualification plan'
    },
    outputSchema: {
      type: 'object',
      required: ['testMatrix', 'buildingBlocks', 'couponTests', 'elementTests', 'subcomponentTests', 'certificationPath', 'artifacts'],
      properties: {
        testMatrix: { type: 'object' },
        buildingBlocks: { type: 'array' },
        couponTests: { type: 'array' },
        elementTests: { type: 'array' },
        subcomponentTests: { type: 'array' },
        certificationPath: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qualification', 'testing', 'composites']
}));
