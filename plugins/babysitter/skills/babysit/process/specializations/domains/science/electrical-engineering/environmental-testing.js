/**
 * @process specializations/domains/science/electrical-engineering/environmental-testing
 * @description Environmental and Reliability Testing - Guide comprehensive environmental and reliability testing programs.
 * Covers thermal, humidity, vibration, shock, altitude, EMC, and accelerated life testing per industry standards.
 * @inputs { projectName: string, productType: string, testRequirements: object, standards?: string[] }
 * @outputs { success: boolean, thermalResults: object, mechanicalResults: object, emcResults: object, reliabilityResults: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/environmental-testing', {
 *   projectName: 'Industrial Controller',
 *   productType: 'embedded-system',
 *   testRequirements: { class: 'industrial', lifetime: '10years' },
 *   standards: ['IEC 60068', 'MIL-STD-810']
 * });
 *
 * @references
 * - IEC 60068 (Environmental Testing)
 * - MIL-STD-810 (Environmental Engineering Considerations)
 * - MIL-STD-883 (Test Methods for Microelectronics)
 * - JEDEC Standards (JESD22 Series)
 * - IEC 61000 (EMC Standards)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    productType,
    testRequirements,
    standards = ['IEC 60068']
  } = inputs;

  // Phase 1: Define Test Plan and Requirements
  const testPlanDefinition = await ctx.task(testPlanDefinitionTask, {
    projectName,
    productType,
    testRequirements,
    standards
  });

  // Phase 2: Thermal Testing (Temperature and Humidity)
  const thermalTesting = await ctx.task(thermalTestingTask, {
    projectName,
    testPlan: testPlanDefinition.thermalPlan,
    standards
  });

  // Breakpoint: Review thermal test results
  await ctx.breakpoint({
    question: `Thermal testing complete for ${projectName}. Pass rate: ${thermalTesting.passRate}%. Failures: ${thermalTesting.failures.length}. Proceed with mechanical testing?`,
    title: 'Thermal Test Review',
    context: {
      runId: ctx.runId,
      projectName,
      thermalTesting,
      files: [{
        path: `artifacts/phase2-thermal.json`,
        format: 'json',
        content: thermalTesting
      }]
    }
  });

  // Phase 3: Mechanical Testing (Vibration and Shock)
  const mechanicalTesting = await ctx.task(mechanicalTestingTask, {
    projectName,
    testPlan: testPlanDefinition.mechanicalPlan,
    standards
  });

  // Phase 4: Environmental Stress Screening (ESS)
  const essResults = await ctx.task(essTask, {
    projectName,
    thermalResults: thermalTesting.results,
    mechanicalResults: mechanicalTesting.results,
    testRequirements
  });

  // Breakpoint: Review mechanical and ESS results
  await ctx.breakpoint({
    question: `Mechanical testing pass rate: ${mechanicalTesting.passRate}%. ESS screening: ${essResults.screeningEffectiveness}%. Proceed with EMC testing?`,
    title: 'Mechanical and ESS Review',
    context: {
      runId: ctx.runId,
      mechanicalTesting,
      essResults,
      files: [
        { path: `artifacts/phase3-mechanical.json`, format: 'json', content: mechanicalTesting },
        { path: `artifacts/phase4-ess.json`, format: 'json', content: essResults }
      ]
    }
  });

  // Phase 5: EMC Testing (Emissions and Immunity)
  const emcTesting = await ctx.task(emcTestingTask, {
    projectName,
    testPlan: testPlanDefinition.emcPlan,
    standards
  });

  // Phase 6: Accelerated Life Testing (ALT/HALT)
  const acceleratedLifeTesting = await ctx.task(acceleratedLifeTestingTask, {
    projectName,
    testPlan: testPlanDefinition.reliabilityPlan,
    thermalResults: thermalTesting.results,
    mechanicalResults: mechanicalTesting.results
  });

  // Quality Gate: Check for critical failures
  const allFailures = [
    ...thermalTesting.failures,
    ...mechanicalTesting.failures,
    ...emcTesting.failures,
    ...acceleratedLifeTesting.failures
  ];

  if (allFailures.length > 0) {
    await ctx.breakpoint({
      question: `${allFailures.length} total failures found across all tests. Critical: ${allFailures.filter(f => f.severity === 'critical').length}. Review failure analysis?`,
      title: 'Test Failures Detected',
      context: {
        runId: ctx.runId,
        failureSummary: allFailures,
        recommendations: acceleratedLifeTesting.recommendations
      }
    });
  }

  // Phase 7: Failure Analysis and Root Cause
  const failureAnalysis = await ctx.task(failureAnalysisTask, {
    projectName,
    failures: allFailures,
    testData: {
      thermal: thermalTesting.results,
      mechanical: mechanicalTesting.results,
      emc: emcTesting.results,
      alt: acceleratedLifeTesting.results
    }
  });

  // Phase 8: Generate Test Report and Certification Summary
  const testReport = await ctx.task(testReportTask, {
    projectName,
    thermalResults: thermalTesting,
    mechanicalResults: mechanicalTesting,
    essResults,
    emcResults: emcTesting,
    reliabilityResults: acceleratedLifeTesting,
    failureAnalysis,
    standards
  });

  // Final Breakpoint: Test Program Approval
  await ctx.breakpoint({
    question: `Environmental testing complete for ${projectName}. Overall pass rate: ${testReport.overallPassRate}%. Certification ready: ${testReport.certificationReady}. Approve test results?`,
    title: 'Environmental Test Approval',
    context: {
      runId: ctx.runId,
      projectName,
      summary: testReport.summary,
      files: [
        { path: `artifacts/test-results.json`, format: 'json', content: { thermal: thermalTesting, mechanical: mechanicalTesting, emc: emcTesting } },
        { path: `artifacts/environmental-test-report.md`, format: 'markdown', content: testReport.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    thermalResults: thermalTesting.results,
    mechanicalResults: mechanicalTesting.results,
    emcResults: emcTesting.results,
    reliabilityResults: {
      ess: essResults.results,
      alt: acceleratedLifeTesting.results
    },
    failureAnalysis: failureAnalysis.results,
    certification: {
      ready: testReport.certificationReady,
      standards: testReport.standardsCompliance
    },
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/environmental-testing',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const testPlanDefinitionTask = defineTask('test-plan-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Test Plan Definition - ${args.projectName}`,
  skill: { name: 'test-automation' },
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'Environmental Test Engineer',
      task: 'Define comprehensive environmental test plan',
      context: args,
      instructions: [
        '1. Identify applicable test standards',
        '2. Define thermal test requirements',
        '3. Define humidity test requirements',
        '4. Define vibration test profiles',
        '5. Define shock test requirements',
        '6. Define EMC test requirements',
        '7. Define accelerated life test plan',
        '8. Specify sample sizes and acceptance criteria',
        '9. Define test sequence and priorities',
        '10. Document comprehensive test plan'
      ],
      outputFormat: 'JSON object with test plan'
    },
    outputSchema: {
      type: 'object',
      required: ['thermalPlan', 'mechanicalPlan', 'emcPlan', 'reliabilityPlan'],
      properties: {
        thermalPlan: { type: 'object' },
        mechanicalPlan: { type: 'object' },
        emcPlan: { type: 'object' },
        reliabilityPlan: { type: 'object' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'environmental', 'test-plan']
}));

export const thermalTestingTask = defineTask('thermal-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Thermal Testing - ${args.projectName}`,
  skill: { name: 'test-automation' },
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'Thermal Test Engineer',
      task: 'Execute thermal testing program',
      context: args,
      instructions: [
        '1. Perform high temperature operation test',
        '2. Perform low temperature operation test',
        '3. Execute temperature cycling test',
        '4. Perform thermal shock testing',
        '5. Execute humidity testing (85/85)',
        '6. Perform temperature humidity cycling',
        '7. Monitor for thermal-induced failures',
        '8. Record thermal performance data',
        '9. Analyze thermal test results',
        '10. Document thermal test outcomes'
      ],
      outputFormat: 'JSON object with thermal test results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'passRate', 'failures'],
      properties: {
        results: { type: 'object' },
        passRate: { type: 'string' },
        failures: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'environmental', 'thermal']
}));

export const mechanicalTestingTask = defineTask('mechanical-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Mechanical Testing - ${args.projectName}`,
  skill: { name: 'test-automation' },
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'Mechanical Test Engineer',
      task: 'Execute mechanical testing program',
      context: args,
      instructions: [
        '1. Perform sinusoidal vibration test',
        '2. Execute random vibration test',
        '3. Perform mechanical shock test',
        '4. Execute drop testing',
        '5. Perform altitude/pressure testing',
        '6. Execute combined environment testing',
        '7. Monitor for mechanical failures',
        '8. Record vibration and shock data',
        '9. Analyze mechanical test results',
        '10. Document mechanical test outcomes'
      ],
      outputFormat: 'JSON object with mechanical test results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'passRate', 'failures'],
      properties: {
        results: { type: 'object' },
        passRate: { type: 'string' },
        failures: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'environmental', 'mechanical']
}));

export const essTask = defineTask('ess-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Environmental Stress Screening - ${args.projectName}`,
  skill: { name: 'test-automation' },
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'ESS Test Engineer',
      task: 'Execute environmental stress screening',
      context: args,
      instructions: [
        '1. Define ESS profile parameters',
        '2. Execute thermal cycling ESS',
        '3. Execute vibration ESS',
        '4. Combine thermal and vibration stresses',
        '5. Monitor for latent defects',
        '6. Track failure modes',
        '7. Calculate screening effectiveness',
        '8. Optimize ESS profile',
        '9. Determine production ESS requirements',
        '10. Document ESS results'
      ],
      outputFormat: 'JSON object with ESS results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'screeningEffectiveness'],
      properties: {
        results: { type: 'object' },
        screeningEffectiveness: { type: 'string' },
        defectsFound: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'environmental', 'ess']
}));

export const emcTestingTask = defineTask('emc-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: EMC Testing - ${args.projectName}`,
  skill: { name: 'test-automation' },
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'EMC Test Engineer',
      task: 'Execute EMC testing program',
      context: args,
      instructions: [
        '1. Perform conducted emissions test',
        '2. Perform radiated emissions test',
        '3. Execute conducted immunity test',
        '4. Execute radiated immunity test',
        '5. Perform ESD immunity test',
        '6. Execute surge immunity test',
        '7. Perform EFT/burst immunity test',
        '8. Execute power line harmonics test',
        '9. Analyze EMC test results',
        '10. Document EMC compliance status'
      ],
      outputFormat: 'JSON object with EMC test results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'compliance', 'failures'],
      properties: {
        results: { type: 'object' },
        compliance: { type: 'object' },
        failures: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'environmental', 'emc']
}));

export const acceleratedLifeTestingTask = defineTask('accelerated-life-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Accelerated Life Testing - ${args.projectName}`,
  skill: { name: 'test-automation' },
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'Reliability Test Engineer',
      task: 'Execute accelerated life testing (ALT/HALT)',
      context: args,
      instructions: [
        '1. Define acceleration factors',
        '2. Execute HALT (destruct limits)',
        '3. Perform ALT with thermal stress',
        '4. Perform ALT with humidity stress',
        '5. Execute combined stress ALT',
        '6. Monitor degradation and failures',
        '7. Apply Arrhenius/Coffin-Manson models',
        '8. Calculate MTBF/FIT rates',
        '9. Determine design margins',
        '10. Document reliability predictions'
      ],
      outputFormat: 'JSON object with ALT results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'mtbf', 'failures'],
      properties: {
        results: { type: 'object' },
        mtbf: { type: 'string' },
        failures: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'environmental', 'reliability']
}));

export const failureAnalysisTask = defineTask('failure-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Failure Analysis - ${args.projectName}`,
  skill: { name: 'test-automation' },
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'Failure Analysis Engineer',
      task: 'Perform root cause analysis of failures',
      context: args,
      instructions: [
        '1. Categorize failure modes',
        '2. Perform visual inspection',
        '3. Execute electrical characterization',
        '4. Perform cross-sectional analysis',
        '5. Execute X-ray/CT analysis if needed',
        '6. Determine root causes',
        '7. Identify design weaknesses',
        '8. Propose corrective actions',
        '9. Assess impact on reliability',
        '10. Document failure analysis results'
      ],
      outputFormat: 'JSON object with failure analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'rootCauses', 'correctiveActions'],
      properties: {
        results: { type: 'object' },
        rootCauses: { type: 'array', items: { type: 'object' } },
        correctiveActions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'environmental', 'failure-analysis']
}));

export const testReportTask = defineTask('test-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Environmental Test Report - ${args.projectName}`,
  skill: { name: 'test-automation' },
  agent: {
    name: 'hardware-test-engineer',
    prompt: {
      role: 'Environmental Test Lead',
      task: 'Generate comprehensive test report',
      context: args,
      instructions: [
        '1. Summarize thermal test results',
        '2. Summarize mechanical test results',
        '3. Summarize ESS results',
        '4. Summarize EMC test results',
        '5. Summarize reliability test results',
        '6. Document failure analysis findings',
        '7. Assess standards compliance',
        '8. Determine certification readiness',
        '9. Provide recommendations',
        '10. Create comprehensive test report'
      ],
      outputFormat: 'JSON object with test report'
    },
    outputSchema: {
      type: 'object',
      required: ['overallPassRate', 'certificationReady', 'summary'],
      properties: {
        overallPassRate: { type: 'string' },
        certificationReady: { type: 'boolean' },
        standardsCompliance: { type: 'object' },
        summary: { type: 'string' },
        markdown: { type: 'string' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'environmental', 'report']
}));
