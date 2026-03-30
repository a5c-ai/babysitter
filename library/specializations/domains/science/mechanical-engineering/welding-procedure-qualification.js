/**
 * @process welding-procedure-qualification
 * @description Welding procedure specification (WPS) development and qualification per AWS/ASME standards
 * @inputs {object} inputs
 * @inputs {string} inputs.projectId - Project identification
 * @inputs {object} inputs.jointDesign - Weld joint configuration and dimensions
 * @inputs {object} inputs.baseMaterials - Base material specifications
 * @inputs {object} inputs.applicationRequirements - Service conditions and code requirements
 * @inputs {string} inputs.applicableCode - Governing code (AWS D1.1, ASME IX, etc.)
 * @outputs {object} wps - Qualified welding procedure specification package
 * @example
 * const result = await process({
 *   projectId: 'WPS-2024-001',
 *   jointDesign: { type: 'butt', thickness: 0.5, groove: 'single-V' },
 *   baseMaterials: { material1: 'A36 Steel', material2: 'A36 Steel' },
 *   applicationRequirements: { service: 'structural', temperature: 'ambient' },
 *   applicableCode: 'AWS D1.1'
 * });
 * @references AWS D1.1, ASME Section IX, AWS B2.1, ISO 15614
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const artifacts = [];

  // Phase 1: Code Requirements Analysis
  const codeAnalysis = await ctx.task(codeAnalysisTask, {
    applicableCode: inputs.applicableCode,
    baseMaterials: inputs.baseMaterials,
    applicationRequirements: inputs.applicationRequirements
  });
  artifacts.push({ phase: 'code-analysis', data: codeAnalysis });

  // Phase 2: Preliminary WPS Development
  const preliminaryWps = await ctx.task(preliminaryWpsTask, {
    jointDesign: inputs.jointDesign,
    baseMaterials: inputs.baseMaterials,
    codeRequirements: codeAnalysis
  });
  artifacts.push({ phase: 'preliminary-wps', data: preliminaryWps });

  // Phase 3: Filler Metal Selection
  const fillerSelection = await ctx.task(fillerSelectionTask, {
    baseMaterials: inputs.baseMaterials,
    weldProcess: preliminaryWps.weldProcess,
    applicationRequirements: inputs.applicationRequirements,
    codeRequirements: codeAnalysis
  });
  artifacts.push({ phase: 'filler-selection', data: fillerSelection });

  // Breakpoint: pWPS Review
  await ctx.breakpoint('pwps-review', {
    question: 'Review preliminary WPS parameters before test coupon fabrication?',
    context: {
      weldProcess: preliminaryWps.weldProcess,
      fillerMetal: fillerSelection.selectedFiller,
      essentialVariables: preliminaryWps.essentialVariables
    }
  });

  // Phase 4: Test Coupon Design
  const couponDesign = await ctx.task(couponDesignTask, {
    jointDesign: inputs.jointDesign,
    baseMaterials: inputs.baseMaterials,
    applicableCode: inputs.applicableCode,
    testRequirements: codeAnalysis.testRequirements
  });
  artifacts.push({ phase: 'coupon-design', data: couponDesign });

  // Phase 5: Welding Parameter Optimization
  const parameterOptimization = await ctx.task(parameterOptimizationTask, {
    preliminaryWps: preliminaryWps,
    fillerMetal: fillerSelection.selectedFiller,
    jointDesign: inputs.jointDesign
  });
  artifacts.push({ phase: 'parameter-optimization', data: parameterOptimization });

  // Phase 6: Procedure Qualification Record (PQR) Planning
  const pqrPlan = await ctx.task(pqrPlanningTask, {
    wpsParameters: parameterOptimization,
    couponDesign: couponDesign,
    testRequirements: codeAnalysis.testRequirements
  });
  artifacts.push({ phase: 'pqr-planning', data: pqrPlan });

  // Phase 7: Test Specimen Requirements
  const specimenRequirements = await ctx.task(specimenRequirementsTask, {
    applicableCode: inputs.applicableCode,
    jointDesign: inputs.jointDesign,
    baseMaterials: inputs.baseMaterials
  });
  artifacts.push({ phase: 'specimen-requirements', data: specimenRequirements });

  // Phase 8: Mechanical Testing Plan
  const testingPlan = await ctx.task(testingPlanTask, {
    specimenRequirements: specimenRequirements,
    codeRequirements: codeAnalysis,
    applicationRequirements: inputs.applicationRequirements
  });
  artifacts.push({ phase: 'testing-plan', data: testingPlan });

  // Phase 9: Final WPS Documentation
  const finalWps = await ctx.task(finalWpsTask, {
    projectId: inputs.projectId,
    preliminaryWps: preliminaryWps,
    fillerSelection: fillerSelection,
    parameterOptimization: parameterOptimization,
    applicableCode: inputs.applicableCode
  });
  artifacts.push({ phase: 'final-wps', data: finalWps });

  // Final Breakpoint: WPS Approval
  await ctx.breakpoint('wps-approval', {
    question: 'Approve WPS for welder qualification testing?',
    context: {
      wpsNumber: finalWps.wpsNumber,
      weldProcess: finalWps.weldProcess,
      qualificationRange: finalWps.qualificationRange
    }
  });

  return {
    success: true,
    results: {
      projectId: inputs.projectId,
      wps: finalWps,
      pqrPlan: pqrPlan,
      testingPlan: testingPlan,
      couponDesign: couponDesign,
      fillerSpecification: fillerSelection
    },
    artifacts,
    metadata: {
      wpsNumber: finalWps.wpsNumber,
      applicableCode: inputs.applicableCode,
      weldProcess: finalWps.weldProcess
    }
  };
}

const codeAnalysisTask = defineTask('code-analysis', (args) => ({
  kind: 'agent',
  title: 'Welding Code Requirements Analysis',
  agent: {
    name: 'welding-engineer',
    prompt: {
      role: 'Certified Welding Engineer (CWEng)',
      task: 'Analyze applicable code requirements for WPS qualification',
      context: args,
      instructions: [
        'Identify applicable code sections for the material combination',
        'Determine essential, supplementary essential, and non-essential variables',
        'Identify required mechanical tests (tensile, bend, impact, hardness)',
        'Determine preheat and interpass temperature requirements',
        'Identify PWHT requirements if applicable',
        'Determine visual and NDT examination requirements',
        'Identify P-number, F-number, and A-number designations',
        'Document qualification range limitations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['codeReferences', 'essentialVariables', 'testRequirements'],
      properties: {
        codeReferences: { type: 'array', items: { type: 'string' } },
        essentialVariables: { type: 'array', items: { type: 'object' } },
        supplementaryVariables: { type: 'array', items: { type: 'object' } },
        testRequirements: { type: 'object' },
        pNumberDesignation: { type: 'string' }
      }
    }
  }
}));

const preliminaryWpsTask = defineTask('preliminary-wps', (args) => ({
  kind: 'agent',
  title: 'Preliminary WPS Development',
  agent: {
    name: 'welding-engineer',
    prompt: {
      role: 'Welding Procedure Specialist',
      task: 'Develop preliminary welding procedure specification',
      context: args,
      instructions: [
        'Select appropriate welding process (SMAW, GMAW, GTAW, FCAW, SAW)',
        'Define joint preparation requirements',
        'Establish weld sequence and pass layout',
        'Determine position(s) to be qualified',
        'Define root pass and fill pass strategies',
        'Establish interpass cleaning requirements',
        'Document essential variable ranges',
        'Plan for backing bar or open root technique'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['weldProcess', 'jointPreparation', 'essentialVariables', 'passSequence'],
      properties: {
        weldProcess: { type: 'string' },
        jointPreparation: { type: 'object' },
        essentialVariables: { type: 'array', items: { type: 'object' } },
        passSequence: { type: 'array', items: { type: 'object' } },
        position: { type: 'string' }
      }
    }
  }
}));

const fillerSelectionTask = defineTask('filler-selection', (args) => ({
  kind: 'agent',
  title: 'Filler Metal Selection',
  agent: {
    name: 'materials-engineer',
    prompt: {
      role: 'Welding Materials Engineer',
      task: 'Select appropriate filler metal for the application',
      context: args,
      instructions: [
        'Match filler metal to base material chemistry',
        'Consider service conditions (temperature, corrosion, fatigue)',
        'Select AWS classification and F-number',
        'Determine electrode/wire diameter range',
        'Specify shielding gas composition if applicable',
        'Verify filler metal certification requirements',
        'Consider hydrogen control requirements',
        'Document filler metal A-number designation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedFiller', 'awsClassification', 'fNumber'],
      properties: {
        selectedFiller: { type: 'object' },
        awsClassification: { type: 'string' },
        fNumber: { type: 'number' },
        aNumber: { type: 'number' },
        shieldingGas: { type: 'object' },
        alternatives: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const couponDesignTask = defineTask('coupon-design', (args) => ({
  kind: 'agent',
  title: 'Test Coupon Design',
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Welding Test Engineer',
      task: 'Design qualification test coupon per code requirements',
      context: args,
      instructions: [
        'Determine minimum coupon dimensions per code',
        'Design joint geometry matching WPS',
        'Include provisions for all required test specimens',
        'Plan for specimen extraction locations',
        'Include material traceability markings',
        'Design backing if required',
        'Account for machining allowances',
        'Plan coupon orientation relative to plate rolling direction'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['couponDimensions', 'jointGeometry', 'specimenLayout'],
      properties: {
        couponDimensions: { type: 'object' },
        jointGeometry: { type: 'object' },
        specimenLayout: { type: 'object' },
        materialRequirements: { type: 'object' },
        drawingReference: { type: 'string' }
      }
    }
  }
}));

const parameterOptimizationTask = defineTask('parameter-optimization', (args) => ({
  kind: 'agent',
  title: 'Welding Parameter Optimization',
  agent: {
    name: 'welding-engineer',
    prompt: {
      role: 'Welding Process Engineer',
      task: 'Optimize welding parameters for quality and productivity',
      context: args,
      instructions: [
        'Calculate heat input ranges per code and material requirements',
        'Determine amperage and voltage ranges',
        'Set travel speed ranges for desired heat input',
        'Define wire feed speed for GMAW/FCAW processes',
        'Establish preheat and interpass temperature ranges',
        'Calculate deposition rates and productivity',
        'Define acceptable heat input variation limits',
        'Consider distortion control parameters'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['parameterRanges', 'heatInput', 'thermalCycle'],
      properties: {
        parameterRanges: { type: 'object' },
        heatInput: { type: 'object' },
        thermalCycle: { type: 'object' },
        depositionRate: { type: 'number' },
        productivityEstimate: { type: 'object' }
      }
    }
  }
}));

const pqrPlanningTask = defineTask('pqr-planning', (args) => ({
  kind: 'agent',
  title: 'PQR Planning',
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Welding Quality Engineer',
      task: 'Plan procedure qualification record documentation',
      context: args,
      instructions: [
        'Define all parameters to be recorded during welding',
        'Plan for witness/inspector hold points',
        'Define documentation requirements (photos, data sheets)',
        'Establish traceability requirements',
        'Plan NDT examination sequence',
        'Define test laboratory requirements',
        'Establish PQR approval workflow',
        'Plan for welder identification and certification verification'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['recordingRequirements', 'holdPoints', 'documentation'],
      properties: {
        recordingRequirements: { type: 'array', items: { type: 'object' } },
        holdPoints: { type: 'array', items: { type: 'object' } },
        documentation: { type: 'array', items: { type: 'string' } },
        approvalWorkflow: { type: 'object' },
        traceability: { type: 'object' }
      }
    }
  }
}));

const specimenRequirementsTask = defineTask('specimen-requirements', (args) => ({
  kind: 'agent',
  title: 'Test Specimen Requirements',
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Mechanical Test Engineer',
      task: 'Define test specimen requirements per applicable code',
      context: args,
      instructions: [
        'Determine required number and type of tensile specimens',
        'Define bend test specimen requirements (face, root, side)',
        'Specify impact test specimen requirements if needed',
        'Define hardness test requirements and locations',
        'Specify macro/micro examination requirements',
        'Document specimen dimensions per code',
        'Define specimen extraction and machining requirements',
        'Establish specimen identification system'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['tensileSpecimens', 'bendSpecimens', 'specimenDimensions'],
      properties: {
        tensileSpecimens: { type: 'object' },
        bendSpecimens: { type: 'object' },
        impactSpecimens: { type: 'object' },
        hardnessRequirements: { type: 'object' },
        specimenDimensions: { type: 'object' },
        macroRequirements: { type: 'object' }
      }
    }
  }
}));

const testingPlanTask = defineTask('testing-plan', (args) => ({
  kind: 'agent',
  title: 'Mechanical Testing Plan',
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Materials Test Engineer',
      task: 'Develop comprehensive mechanical testing plan',
      context: args,
      instructions: [
        'Define tensile test acceptance criteria',
        'Specify bend test radius and acceptance criteria',
        'Define Charpy impact test temperature and requirements',
        'Specify hardness test method and acceptance limits',
        'Define macro/micro examination criteria',
        'Plan test sequence and timing',
        'Identify test equipment and calibration requirements',
        'Establish test report format and requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['testMethods', 'acceptanceCriteria', 'testSequence'],
      properties: {
        testMethods: { type: 'array', items: { type: 'object' } },
        acceptanceCriteria: { type: 'object' },
        testSequence: { type: 'array', items: { type: 'string' } },
        equipmentRequirements: { type: 'array', items: { type: 'object' } },
        reportFormat: { type: 'object' }
      }
    }
  }
}));

const finalWpsTask = defineTask('final-wps', (args) => ({
  kind: 'agent',
  title: 'Final WPS Documentation',
  agent: {
    name: 'welding-engineer',
    prompt: {
      role: 'Certified Welding Engineer',
      task: 'Compile final WPS documentation package',
      context: args,
      instructions: [
        'Assign WPS number per company numbering system',
        'Compile all essential variables with ranges',
        'Document joint design with dimensions',
        'Include weld sequence diagram',
        'Specify filler metal with complete specification',
        'Document preheat and PWHT requirements',
        'Define inspection requirements',
        'Include qualification range and limitations',
        'Reference supporting PQR(s)'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['wpsNumber', 'weldProcess', 'essentialVariables', 'qualificationRange'],
      properties: {
        wpsNumber: { type: 'string' },
        weldProcess: { type: 'string' },
        essentialVariables: { type: 'object' },
        qualificationRange: { type: 'object' },
        jointDesignDetails: { type: 'object' },
        inspectionRequirements: { type: 'object' },
        pqrReferences: { type: 'array', items: { type: 'string' } }
      }
    }
  }
}));

export default { process };
