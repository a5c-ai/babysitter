/**
 * @process specializations/domains/science/biomedical-engineering/orthopedic-biomechanical-testing
 * @description Orthopedic Implant Biomechanical Testing - Conduct standardized biomechanical testing of
 * orthopedic implants per ASTM and ISO standards including fatigue, wear, and mechanical characterization.
 * @inputs { implantName: string, implantType: string, applicableStandards: string[], testRequirements: object }
 * @outputs { success: boolean, testProtocols: object[], testReports: object[], complianceDocumentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/orthopedic-biomechanical-testing', {
 *   implantName: 'Total Hip Replacement System',
 *   implantType: 'Hip Prosthesis',
 *   applicableStandards: ['ISO 7206', 'ASTM F1440', 'ISO 14242'],
 *   testRequirements: { fatigueLife: '10M cycles', wearRate: '<80mm³/10⁶ cycles' }
 * });
 *
 * @references
 * - ISO 7206 Series - Implants for surgery - Partial and total hip joint prostheses
 * - ASTM F1717 - Standard Test Methods for Spinal Implant Constructs
 * - ISO 14242 - Implants for surgery - Wear of total hip-joint prostheses
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    implantName,
    implantType,
    applicableStandards,
    testRequirements
  } = inputs;

  // Phase 1: Test Standard Identification
  const standardIdentification = await ctx.task(standardIdentificationTask, {
    implantName,
    implantType,
    applicableStandards
  });

  // Phase 2: Test Fixture Design
  const fixtureDesign = await ctx.task(fixtureDesignTask, {
    implantName,
    implantType,
    standards: standardIdentification.standards
  });

  // Phase 3: Sample Preparation
  const samplePreparation = await ctx.task(samplePreparationTask, {
    implantName,
    testRequirements,
    standards: standardIdentification.standards
  });

  // Phase 4: Static Mechanical Testing
  const staticTesting = await ctx.task(staticTestingTask, {
    implantName,
    standards: standardIdentification.standards,
    fixtureDesign,
    testRequirements
  });

  // Breakpoint: Review static test results
  await ctx.breakpoint({
    question: `Review static mechanical test results for ${implantName}. Are results within acceptance criteria?`,
    title: 'Static Testing Review',
    context: {
      runId: ctx.runId,
      implantName,
      testResults: staticTesting.results,
      files: [{
        path: `artifacts/phase4-static-testing.json`,
        format: 'json',
        content: staticTesting
      }]
    }
  });

  // Phase 5: Dynamic Fatigue Testing
  const fatigueTesting = await ctx.task(fatigueTestingTask, {
    implantName,
    standards: standardIdentification.standards,
    fixtureDesign,
    testRequirements
  });

  // Phase 6: Wear Testing
  const wearTesting = await ctx.task(wearTestingTask, {
    implantName,
    implantType,
    standards: standardIdentification.standards,
    testRequirements
  });

  // Phase 7: Data Analysis and Reporting
  const dataAnalysis = await ctx.task(dataAnalysisTask, {
    implantName,
    staticTesting,
    fatigueTesting,
    wearTesting,
    testRequirements
  });

  // Final Breakpoint: Test Report Approval
  await ctx.breakpoint({
    question: `Biomechanical testing complete for ${implantName}. Pass/Fail: ${dataAnalysis.overallResult}. Approve test reports?`,
    title: 'Test Report Approval',
    context: {
      runId: ctx.runId,
      implantName,
      overallResult: dataAnalysis.overallResult,
      files: [
        { path: `artifacts/biomechanical-test-report.json`, format: 'json', content: dataAnalysis }
      ]
    }
  });

  return {
    success: true,
    implantName,
    testProtocols: standardIdentification.protocols,
    testReports: {
      static: staticTesting.report,
      fatigue: fatigueTesting.report,
      wear: wearTesting.report
    },
    complianceDocumentation: dataAnalysis.complianceDocumentation,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/orthopedic-biomechanical-testing',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const standardIdentificationTask = defineTask('standard-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Standard Identification - ${args.implantName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Orthopedic Test Engineer with expertise in implant testing standards',
      task: 'Identify applicable test standards and requirements',
      context: {
        implantName: args.implantName,
        implantType: args.implantType,
        applicableStandards: args.applicableStandards
      },
      instructions: [
        '1. Review device classification and type',
        '2. Identify ISO standards (7206, 14242, 12189, etc.)',
        '3. Identify ASTM standards (F1717, F2033, F1440, etc.)',
        '4. Determine required test methods',
        '5. Define test configurations',
        '6. Document loading parameters',
        '7. Define sample size requirements',
        '8. Create test protocol matrix',
        '9. Document regulatory expectations',
        '10. Create standards compliance checklist'
      ],
      outputFormat: 'JSON object with standards identification'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'protocols', 'testMatrix'],
      properties: {
        standards: { type: 'array', items: { type: 'object' } },
        protocols: { type: 'array', items: { type: 'object' } },
        testMatrix: { type: 'object' },
        regulatoryExpectations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomechanical-testing', 'standards', 'orthopedic']
}));

export const fixtureDesignTask = defineTask('fixture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Fixture Design - ${args.implantName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Fixture Design Engineer',
      task: 'Design and validate test fixtures',
      context: {
        implantName: args.implantName,
        implantType: args.implantType,
        standards: args.standards
      },
      instructions: [
        '1. Review standard fixture requirements',
        '2. Design fixtures per standard specifications',
        '3. Consider anatomical loading simulation',
        '4. Design sample potting procedures',
        '5. Validate fixture stiffness',
        '6. Document alignment procedures',
        '7. Create fixture drawings',
        '8. Plan fixture qualification',
        '9. Document fixture materials',
        '10. Create fixture design report'
      ],
      outputFormat: 'JSON object with fixture design'
    },
    outputSchema: {
      type: 'object',
      required: ['fixtureDesigns', 'qualificationPlan', 'specifications'],
      properties: {
        fixtureDesigns: { type: 'array', items: { type: 'object' } },
        qualificationPlan: { type: 'object' },
        specifications: { type: 'object' },
        alignmentProcedures: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomechanical-testing', 'fixtures', 'orthopedic']
}));

export const samplePreparationTask = defineTask('sample-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Sample Preparation - ${args.implantName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Laboratory Technician',
      task: 'Define sample preparation procedures',
      context: {
        implantName: args.implantName,
        testRequirements: args.testRequirements,
        standards: args.standards
      },
      instructions: [
        '1. Define sample selection criteria',
        '2. Document sample measurements',
        '3. Define potting procedures',
        '4. Specify embedding materials',
        '5. Define conditioning requirements',
        '6. Document traceability',
        '7. Create sample preparation SOP',
        '8. Define inspection criteria',
        '9. Document storage conditions',
        '10. Create sample tracking log'
      ],
      outputFormat: 'JSON object with sample preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['preparationProcedures', 'sampleRequirements', 'sop'],
      properties: {
        preparationProcedures: { type: 'array', items: { type: 'object' } },
        sampleRequirements: { type: 'object' },
        sop: { type: 'object' },
        traceability: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomechanical-testing', 'sample-prep', 'orthopedic']
}));

export const staticTestingTask = defineTask('static-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Static Testing - ${args.implantName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mechanical Test Engineer',
      task: 'Plan and execute static mechanical testing',
      context: {
        implantName: args.implantName,
        standards: args.standards,
        fixtureDesign: args.fixtureDesign,
        testRequirements: args.testRequirements
      },
      instructions: [
        '1. Define static test configurations',
        '2. Specify loading rates',
        '3. Define ultimate strength tests',
        '4. Define stiffness tests',
        '5. Plan subsidence tests if applicable',
        '6. Document data acquisition',
        '7. Define acceptance criteria',
        '8. Execute static tests',
        '9. Analyze test data',
        '10. Create static test report'
      ],
      outputFormat: 'JSON object with static test results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'report', 'compliance'],
      properties: {
        results: { type: 'object' },
        report: { type: 'object' },
        compliance: { type: 'object' },
        failureModes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomechanical-testing', 'static', 'orthopedic']
}));

export const fatigueTestingTask = defineTask('fatigue-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Fatigue Testing - ${args.implantName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fatigue Test Specialist',
      task: 'Plan and execute dynamic fatigue testing',
      context: {
        implantName: args.implantName,
        standards: args.standards,
        fixtureDesign: args.fixtureDesign,
        testRequirements: args.testRequirements
      },
      instructions: [
        '1. Define fatigue test parameters',
        '2. Specify loading frequency',
        '3. Define load levels and R-ratio',
        '4. Set runout criteria',
        '5. Plan test monitoring',
        '6. Define failure criteria',
        '7. Execute fatigue tests',
        '8. Monitor test progress',
        '9. Analyze fatigue data',
        '10. Create fatigue test report'
      ],
      outputFormat: 'JSON object with fatigue test results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'report', 'fatigueLife'],
      properties: {
        results: { type: 'object' },
        report: { type: 'object' },
        fatigueLife: { type: 'object' },
        failureAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomechanical-testing', 'fatigue', 'orthopedic']
}));

export const wearTestingTask = defineTask('wear-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Wear Testing - ${args.implantName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Tribology Specialist',
      task: 'Plan and execute wear testing',
      context: {
        implantName: args.implantName,
        implantType: args.implantType,
        standards: args.standards,
        testRequirements: args.testRequirements
      },
      instructions: [
        '1. Identify wear test standard (ISO 14242, etc.)',
        '2. Define wear test conditions',
        '3. Specify lubricant and temperature',
        '4. Define loading and motion profiles',
        '5. Set test duration',
        '6. Plan gravimetric measurements',
        '7. Execute wear tests',
        '8. Measure wear volume',
        '9. Analyze wear particles',
        '10. Create wear test report'
      ],
      outputFormat: 'JSON object with wear test results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'report', 'wearRate'],
      properties: {
        results: { type: 'object' },
        report: { type: 'object' },
        wearRate: { type: 'string' },
        particleAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomechanical-testing', 'wear', 'orthopedic']
}));

export const dataAnalysisTask = defineTask('data-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Data Analysis - ${args.implantName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Data Analyst',
      task: 'Analyze test data and compile reports',
      context: {
        implantName: args.implantName,
        staticTesting: args.staticTesting,
        fatigueTesting: args.fatigueTesting,
        wearTesting: args.wearTesting,
        testRequirements: args.testRequirements
      },
      instructions: [
        '1. Compile all test data',
        '2. Perform statistical analysis',
        '3. Compare to acceptance criteria',
        '4. Document compliance status',
        '5. Analyze failure modes',
        '6. Create summary tables',
        '7. Generate test report',
        '8. Document deviations',
        '9. Provide conclusions',
        '10. Create compliance documentation'
      ],
      outputFormat: 'JSON object with data analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['overallResult', 'analysisResults', 'complianceDocumentation'],
      properties: {
        overallResult: { type: 'string', enum: ['pass', 'fail', 'conditional'] },
        analysisResults: { type: 'object' },
        complianceDocumentation: { type: 'object' },
        deviations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['biomechanical-testing', 'analysis', 'orthopedic']
}));
