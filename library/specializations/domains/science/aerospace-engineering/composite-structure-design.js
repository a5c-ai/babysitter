/**
 * @process specializations/domains/science/aerospace-engineering/composite-structure-design
 * @description Workflow for designing and analyzing composite aerospace structures including layup optimization,
 * manufacturing considerations, and certification evidence.
 * @inputs { projectName: string, componentDefinition: object, loadRequirements: object, materialSystem?: string }
 * @outputs { success: boolean, laminateDesign: object, analysisResults: object, manufacturingPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/composite-structure-design', {
 *   projectName: 'Horizontal Stabilizer Skin',
 *   componentDefinition: { type: 'skin-panel', geometry: 'curved' },
 *   loadRequirements: { type: 'compression-dominated' },
 *   materialSystem: 'IM7/8552'
 * });
 *
 * @references
 * - MIL-HDBK-17 Composite Materials Handbook
 * - CMH-17 (Rev G) Composite Materials Handbook
 * - AC 20-107B Composite Aircraft Structure
 * - ASTM D3039, D3518, D5528 Composite Test Standards
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    componentDefinition,
    loadRequirements,
    materialSystem = 'T800/3900-2'
  } = inputs;

  // Phase 1: Requirements and Material Selection
  const requirementsAnalysis = await ctx.task(compositeRequirementsTask, {
    projectName,
    componentDefinition,
    loadRequirements,
    materialSystem
  });

  // Phase 2: Material Allowables
  const materialAllowables = await ctx.task(materialAllowablesTask, {
    projectName,
    materialSystem,
    environment: requirementsAnalysis.environment,
    processingMethod: requirementsAnalysis.processingMethod
  });

  // Phase 3: Preliminary Layup Design
  const preliminaryDesign = await ctx.task(preliminaryLayupTask, {
    projectName,
    requirementsAnalysis,
    materialAllowables,
    loadRequirements
  });

  // Breakpoint: Preliminary design review
  await ctx.breakpoint({
    question: `Review preliminary layup for ${projectName}. Ply count: ${preliminaryDesign.totalPlies}. Proceed with optimization?`,
    title: 'Preliminary Layup Review',
    context: {
      runId: ctx.runId,
      layup: preliminaryDesign,
      stackingSequence: preliminaryDesign.stackingSequence
    }
  });

  // Phase 4: Layup Optimization
  const optimizedDesign = await ctx.task(layupOptimizationTask, {
    projectName,
    preliminaryDesign,
    constraints: requirementsAnalysis.constraints,
    objectives: requirementsAnalysis.objectives
  });

  // Phase 5: Laminate Analysis
  const laminateAnalysis = await ctx.task(laminateAnalysisTask, {
    projectName,
    layup: optimizedDesign,
    materialAllowables,
    loadRequirements
  });

  // Quality Gate: First ply failure check
  if (laminateAnalysis.firstPlyFailureMargin < 0) {
    await ctx.breakpoint({
      question: `First ply failure predicted at ${laminateAnalysis.firstPlyFailureLoad}. Redesign or investigate?`,
      title: 'Ply Failure Warning',
      context: {
        runId: ctx.runId,
        failureAnalysis: laminateAnalysis.failureAnalysis
      }
    });
  }

  // Phase 6: Detailed Stress Analysis
  const stressAnalysis = await ctx.task(compositeStressAnalysisTask, {
    projectName,
    optimizedDesign,
    loadRequirements,
    materialAllowables
  });

  // Phase 7: Damage Tolerance Assessment
  const damageAssessment = await ctx.task(compositeDamageToleranceTask, {
    projectName,
    design: optimizedDesign,
    loadRequirements,
    impactRequirements: requirementsAnalysis.impactRequirements
  });

  // Phase 8: Manufacturing Planning
  const manufacturingPlan = await ctx.task(compositeManufacturingTask, {
    projectName,
    design: optimizedDesign,
    componentDefinition,
    processingMethod: requirementsAnalysis.processingMethod
  });

  // Phase 9: Quality and Inspection Planning
  const qualityPlan = await ctx.task(compositeQualityTask, {
    projectName,
    manufacturingPlan,
    design: optimizedDesign,
    certificationRequirements: requirementsAnalysis.certificationRequirements
  });

  // Phase 10: Certification Documentation
  const certificationDocs = await ctx.task(compositeCertificationTask, {
    projectName,
    stressAnalysis,
    damageAssessment,
    materialAllowables,
    qualityPlan
  });

  // Phase 11: Report Generation
  const reportGeneration = await ctx.task(compositeReportTask, {
    projectName,
    requirementsAnalysis,
    optimizedDesign,
    laminateAnalysis,
    stressAnalysis,
    damageAssessment,
    manufacturingPlan,
    certificationDocs
  });

  // Final Breakpoint: Design Approval
  await ctx.breakpoint({
    question: `Composite design complete for ${projectName}. Min margin: ${stressAnalysis.minimumMargin}. Approve design?`,
    title: 'Composite Design Approval',
    context: {
      runId: ctx.runId,
      summary: {
        totalPlies: optimizedDesign.totalPlies,
        weight: optimizedDesign.arealWeight,
        minimumMargin: stressAnalysis.minimumMargin,
        certificationStatus: certificationDocs.status
      },
      files: [
        { path: 'artifacts/composite-design.json', format: 'json', content: reportGeneration },
        { path: 'artifacts/composite-design.md', format: 'markdown', content: reportGeneration.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    laminateDesign: {
      stackingSequence: optimizedDesign.stackingSequence,
      totalPlies: optimizedDesign.totalPlies,
      thickness: optimizedDesign.thickness,
      arealWeight: optimizedDesign.arealWeight
    },
    analysisResults: {
      stressResults: stressAnalysis,
      laminateAnalysis: laminateAnalysis,
      damageAssessment: damageAssessment
    },
    manufacturingPlan: manufacturingPlan,
    certification: certificationDocs,
    report: reportGeneration,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/composite-structure-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const compositeRequirementsTask = defineTask('composite-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Composite Structures Engineer',
      task: 'Define requirements for composite structure design',
      context: args,
      instructions: [
        '1. Define structural requirements and load cases',
        '2. Identify environmental conditions (temperature, moisture)',
        '3. Define impact damage requirements (BVID, VID)',
        '4. Establish stiffness requirements',
        '5. Define repair and maintenance requirements',
        '6. Identify manufacturing constraints',
        '7. Define certification basis and requirements',
        '8. Establish weight targets',
        '9. Define optimization objectives',
        '10. Document design constraints'
      ],
      outputFormat: 'JSON object with requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['loadCases', 'environment', 'constraints'],
      properties: {
        loadCases: { type: 'array', items: { type: 'object' } },
        environment: { type: 'object' },
        impactRequirements: { type: 'object' },
        constraints: { type: 'object' },
        objectives: { type: 'array', items: { type: 'string' } },
        processingMethod: { type: 'string' },
        certificationRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['composites', 'requirements', 'aerospace']
}));

export const materialAllowablesTask = defineTask('material-allowables', (args, taskCtx) => ({
  kind: 'agent',
  title: `Material Allowables - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Composite Materials Engineer',
      task: 'Define material allowables for composite system',
      context: args,
      instructions: [
        '1. Compile ply properties (E1, E2, G12, nu12)',
        '2. Define strength allowables (tension, compression, shear)',
        '3. Apply environmental knockdowns (CTD, RTD, ETW)',
        '4. Define notched allowables (OHC, OHT, FHC, FHT)',
        '5. Define bearing and pull-through allowables',
        '6. Apply A-basis vs B-basis factors',
        '7. Define interlaminar properties (ILSS, GIc, GIIc)',
        '8. Document data source and qualification',
        '9. Apply batch-to-batch variations',
        '10. Create allowables database'
      ],
      outputFormat: 'JSON object with material allowables'
    },
    outputSchema: {
      type: 'object',
      required: ['plyProperties', 'strengthAllowables'],
      properties: {
        plyProperties: { type: 'object' },
        strengthAllowables: { type: 'object' },
        environmentalFactors: { type: 'object' },
        notchedAllowables: { type: 'object' },
        interlaminatProperties: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['composites', 'materials', 'aerospace']
}));

export const preliminaryLayupTask = defineTask('preliminary-layup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Preliminary Layup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Laminate Design Engineer',
      task: 'Develop preliminary laminate layup',
      context: args,
      instructions: [
        '1. Determine dominant load direction',
        '2. Select basic laminate family (quasi-isotropic, orthotropic)',
        '3. Calculate minimum ply requirements',
        '4. Apply ply orientation rules (balanced, symmetric)',
        '5. Apply 10% rule for each orientation',
        '6. Define ply drops and buildups',
        '7. Consider manufacturing orientation limits',
        '8. Define core requirements if applicable',
        '9. Calculate preliminary properties',
        '10. Document preliminary stacking sequence'
      ],
      outputFormat: 'JSON object with preliminary layup'
    },
    outputSchema: {
      type: 'object',
      required: ['stackingSequence', 'totalPlies'],
      properties: {
        stackingSequence: { type: 'array', items: { type: 'number' } },
        totalPlies: { type: 'number' },
        thickness: { type: 'number' },
        plyPercentages: { type: 'object' },
        laminateProperties: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['composites', 'layup', 'aerospace']
}));

export const layupOptimizationTask = defineTask('layup-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Layup Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Composite Optimization Engineer',
      task: 'Optimize laminate layup',
      context: args,
      instructions: [
        '1. Define optimization variables (ply angles, thicknesses)',
        '2. Apply design constraints (symmetry, balance, 10% rule)',
        '3. Optimize for minimum weight or cost',
        '4. Apply buckling constraints',
        '5. Apply strength constraints',
        '6. Apply stiffness constraints',
        '7. Apply manufacturing constraints',
        '8. Validate optimized design feasibility',
        '9. Compare with baseline design',
        '10. Document optimization results'
      ],
      outputFormat: 'JSON object with optimized layup'
    },
    outputSchema: {
      type: 'object',
      required: ['stackingSequence', 'totalPlies', 'improvement'],
      properties: {
        stackingSequence: { type: 'array', items: { type: 'number' } },
        totalPlies: { type: 'number' },
        thickness: { type: 'number' },
        arealWeight: { type: 'number' },
        improvement: { type: 'object' },
        constraints: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['composites', 'optimization', 'aerospace']
}));

export const laminateAnalysisTask = defineTask('laminate-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Laminate Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Classical Laminate Theory Analyst',
      task: 'Perform laminate analysis using CLT',
      context: args,
      instructions: [
        '1. Calculate ABD stiffness matrix',
        '2. Analyze ply-by-ply stresses and strains',
        '3. Apply failure criteria (Tsai-Wu, max strain, Puck)',
        '4. Calculate first ply failure (FPF)',
        '5. Calculate last ply failure (LPF)',
        '6. Analyze through-thickness stress distribution',
        '7. Calculate interlaminar stresses at free edges',
        '8. Assess delamination risk',
        '9. Calculate thermal residual stresses',
        '10. Document laminate analysis results'
      ],
      outputFormat: 'JSON object with laminate analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['ABDmatrix', 'firstPlyFailureMargin'],
      properties: {
        ABDmatrix: { type: 'object' },
        plyStresses: { type: 'array', items: { type: 'object' } },
        firstPlyFailureMargin: { type: 'number' },
        firstPlyFailureLoad: { type: 'number' },
        failureAnalysis: { type: 'object' },
        thermalStresses: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['composites', 'analysis', 'aerospace']
}));

export const compositeStressAnalysisTask = defineTask('composite-stress-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stress Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Composite Stress Analysis Engineer',
      task: 'Perform detailed stress analysis',
      context: args,
      instructions: [
        '1. Analyze primary loaded structure',
        '2. Calculate notched strength (bolted joints)',
        '3. Analyze bearing/bypass interaction',
        '4. Calculate stability margins (buckling)',
        '5. Analyze post-buckling behavior if applicable',
        '6. Calculate bonded joint stresses',
        '7. Analyze cutout and reinforcement stresses',
        '8. Calculate repair region stresses',
        '9. Compute margins of safety',
        '10. Document critical locations and margins'
      ],
      outputFormat: 'JSON object with stress analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['minimumMargin', 'criticalLocations'],
      properties: {
        minimumMargin: { type: 'number' },
        criticalLocations: { type: 'array', items: { type: 'object' } },
        bucklingMargins: { type: 'object' },
        jointAnalysis: { type: 'object' },
        margins: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['composites', 'stress-analysis', 'aerospace']
}));

export const compositeDamageToleranceTask = defineTask('composite-damage-tolerance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Damage Tolerance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Composite Damage Tolerance Engineer',
      task: 'Assess composite damage tolerance',
      context: args,
      instructions: [
        '1. Define BVID and VID impact damage scenarios',
        '2. Analyze CAI (compression after impact) capability',
        '3. Assess delamination growth under fatigue',
        '4. Calculate residual strength with damage',
        '5. Define inspection requirements',
        '6. Assess discrete source damage capability',
        '7. Define repair size limits',
        '8. Analyze environmental degradation',
        '9. Document damage tolerance compliance',
        '10. Create damage assessment summary'
      ],
      outputFormat: 'JSON object with damage tolerance assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['bvidCapability', 'caiStrength'],
      properties: {
        bvidCapability: { type: 'object' },
        caiStrength: { type: 'number' },
        delaminationAnalysis: { type: 'object' },
        residualStrength: { type: 'object' },
        inspectionRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['composites', 'damage-tolerance', 'aerospace']
}));

export const compositeManufacturingTask = defineTask('composite-manufacturing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Manufacturing Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Composite Manufacturing Engineer',
      task: 'Develop manufacturing plan',
      context: args,
      instructions: [
        '1. Define layup method (hand layup, AFP, ATL)',
        '2. Design tooling concept',
        '3. Define cure cycle',
        '4. Plan ply cutting and nesting',
        '5. Define debulk and vacuum bag schedule',
        '6. Plan secondary bonding operations',
        '7. Define trim and drill operations',
        '8. Plan assembly sequence',
        '9. Estimate manufacturing costs',
        '10. Document manufacturing plan'
      ],
      outputFormat: 'JSON object with manufacturing plan'
    },
    outputSchema: {
      type: 'object',
      required: ['layupMethod', 'cureCycle', 'tooling'],
      properties: {
        layupMethod: { type: 'string' },
        cureCycle: { type: 'object' },
        tooling: { type: 'object' },
        assemblySequence: { type: 'array', items: { type: 'string' } },
        costEstimate: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['composites', 'manufacturing', 'aerospace']
}));

export const compositeQualityTask = defineTask('composite-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Composite Quality Engineer',
      task: 'Develop quality and inspection plan',
      context: args,
      instructions: [
        '1. Define incoming material inspection',
        '2. Plan in-process inspections',
        '3. Define NDI requirements (UT, radiography)',
        '4. Establish acceptance criteria',
        '5. Define traveler and process control',
        '6. Plan first article inspection',
        '7. Define witness and hold points',
        '8. Plan coupon testing requirements',
        '9. Define non-conformance procedures',
        '10. Document quality plan'
      ],
      outputFormat: 'JSON object with quality plan'
    },
    outputSchema: {
      type: 'object',
      required: ['ndiRequirements', 'acceptanceCriteria'],
      properties: {
        ndiRequirements: { type: 'object' },
        acceptanceCriteria: { type: 'object' },
        inspectionPlan: { type: 'array', items: { type: 'object' } },
        couponTesting: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['composites', 'quality', 'aerospace']
}));

export const compositeCertificationTask = defineTask('composite-certification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Certification Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Composite Certification Engineer',
      task: 'Prepare certification documentation',
      context: args,
      instructions: [
        '1. Compile building block test evidence',
        '2. Document material qualification data',
        '3. Prepare stress analysis report',
        '4. Document damage tolerance compliance',
        '5. Compile environmental test evidence',
        '6. Document manufacturing process spec',
        '7. Prepare repair documentation',
        '8. Document conformity evidence',
        '9. Prepare certification summary',
        '10. Compile substantiation report'
      ],
      outputFormat: 'JSON object with certification documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'substantiationReport'],
      properties: {
        status: { type: 'string' },
        buildingBlockEvidence: { type: 'object' },
        substantiationReport: { type: 'object' },
        complianceMatrix: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['composites', 'certification', 'aerospace']
}));

export const compositeReportTask = defineTask('composite-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Composite Design Report Engineer',
      task: 'Generate composite design report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document design requirements',
        '3. Present material selection',
        '4. Present layup design and optimization',
        '5. Document stress analysis results',
        '6. Present damage tolerance assessment',
        '7. Document manufacturing plan',
        '8. Present certification evidence',
        '9. Provide conclusions',
        '10. Generate JSON and markdown'
      ],
      outputFormat: 'JSON object with design report'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'markdown'],
      properties: {
        report: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['composites', 'reporting', 'aerospace']
}));
