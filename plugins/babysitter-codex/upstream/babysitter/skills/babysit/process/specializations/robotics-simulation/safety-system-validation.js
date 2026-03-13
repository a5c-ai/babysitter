/**
 * @process specializations/robotics-simulation/safety-system-validation
 * @description Safety System Validation and Certification - Comprehensive validation of robot safety systems
 * for regulatory compliance including FMEA analysis, safety testing, certification documentation, and audit preparation.
 * @inputs { robotName: string, safetyStandard?: string, certificationLevel?: string, outputDir?: string }
 * @outputs { success: boolean, validationReport: object, certificationStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/safety-system-validation', {
 *   robotName: 'industrial_robot',
 *   safetyStandard: 'iso-13849',
 *   certificationLevel: 'pl-d'
 * });
 *
 * @references
 * - ISO 13849: https://www.iso.org/standard/73481.html
 * - ISO 10218: https://www.iso.org/standard/51330.html
 * - IEC 62443: https://www.iec.ch/cyber-security
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    safetyStandard = 'iso-13849',
    certificationLevel = 'pl-d',
    outputDir = 'safety-validation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Safety System Validation for ${robotName}`);

  const hazardAnalysis = await ctx.task(hazardAnalysisTask, { robotName, safetyStandard, outputDir });
  artifacts.push(...hazardAnalysis.artifacts);

  const fmeaAnalysis = await ctx.task(fmeaAnalysisTask, { robotName, hazardAnalysis, outputDir });
  artifacts.push(...fmeaAnalysis.artifacts);

  const riskAssessment = await ctx.task(riskAssessmentTask, { robotName, fmeaAnalysis, certificationLevel, outputDir });
  artifacts.push(...riskAssessment.artifacts);

  const safetyFunctionDesign = await ctx.task(safetyFunctionDesignTask, { robotName, riskAssessment, safetyStandard, outputDir });
  artifacts.push(...safetyFunctionDesign.artifacts);

  const hardwareSafetyTesting = await ctx.task(hardwareSafetyTestingTask, { robotName, safetyFunctionDesign, outputDir });
  artifacts.push(...hardwareSafetyTesting.artifacts);

  const softwareSafetyTesting = await ctx.task(softwareSafetyTestingTask, { robotName, safetyFunctionDesign, outputDir });
  artifacts.push(...softwareSafetyTesting.artifacts);

  const emergencyStopValidation = await ctx.task(emergencyStopValidationTask, { robotName, safetyFunctionDesign, outputDir });
  artifacts.push(...emergencyStopValidation.artifacts);

  const safetyPLCalculation = await ctx.task(safetyPLCalculationTask, { robotName, hardwareSafetyTesting, softwareSafetyTesting, certificationLevel, outputDir });
  artifacts.push(...safetyPLCalculation.artifacts);

  const certificationDocumentation = await ctx.task(certificationDocumentationTask, { robotName, safetyPLCalculation, safetyStandard, outputDir });
  artifacts.push(...certificationDocumentation.artifacts);

  await ctx.breakpoint({
    question: `Safety Validation Complete for ${robotName}. Achieved PL: ${safetyPLCalculation.achievedPL}, Target: ${certificationLevel}. Ready for certification?`,
    title: 'Safety Validation Complete',
    context: { runId: ctx.runId, achievedPL: safetyPLCalculation.achievedPL, targetPL: certificationLevel }
  });

  return {
    success: safetyPLCalculation.achievedPL >= certificationLevel,
    robotName,
    validationReport: { reportPath: certificationDocumentation.reportPath, findings: riskAssessment.findings },
    certificationStatus: { achievedPL: safetyPLCalculation.achievedPL, targetPL: certificationLevel, standard: safetyStandard },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/robotics-simulation/safety-system-validation', timestamp: startTime, outputDir }
  };
}

export const hazardAnalysisTask = defineTask('hazard-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hazard Analysis - ${args.robotName}`,
  agent: {
    name: 'safety-engineer',
    prompt: { role: 'Safety Engineer', task: 'Perform hazard identification', context: args, instructions: ['1. Identify all hazards', '2. Categorize hazard types', '3. Determine exposure', '4. Assess severity', '5. Document hazard list'] },
    outputSchema: { type: 'object', required: ['hazards', 'categories', 'artifacts'], properties: { hazards: { type: 'array' }, categories: { type: 'array' }, exposureMatrix: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'safety', 'hazard-analysis']
}));

export const fmeaAnalysisTask = defineTask('fmea-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `FMEA Analysis - ${args.robotName}`,
  agent: {
    name: 'safety-engineer',
    prompt: { role: 'Safety Engineer', task: 'Perform FMEA analysis', context: args, instructions: ['1. List failure modes', '2. Determine effects', '3. Identify causes', '4. Calculate RPN values', '5. Prioritize mitigations'] },
    outputSchema: { type: 'object', required: ['failureModes', 'rpnValues', 'artifacts'], properties: { failureModes: { type: 'array' }, rpnValues: { type: 'object' }, mitigations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'safety', 'fmea']
}));

export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Risk Assessment - ${args.robotName}`,
  agent: {
    name: 'safety-engineer',
    prompt: { role: 'Safety Engineer', task: 'Perform risk assessment', context: args, instructions: ['1. Calculate risk levels', '2. Determine required PL', '3. Define risk reduction', '4. Validate residual risk', '5. Document assessment'] },
    outputSchema: { type: 'object', required: ['riskMatrix', 'findings', 'artifacts'], properties: { riskMatrix: { type: 'object' }, findings: { type: 'array' }, requiredPL: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'safety', 'risk-assessment']
}));

export const safetyFunctionDesignTask = defineTask('safety-function-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Safety Function Design - ${args.robotName}`,
  agent: {
    name: 'safety-engineer',
    prompt: { role: 'Safety Engineer', task: 'Design safety functions', context: args, instructions: ['1. Define safety functions', '2. Design safety architecture', '3. Select safety components', '4. Calculate SIL/PL', '5. Document design'] },
    outputSchema: { type: 'object', required: ['safetyFunctions', 'architecture', 'artifacts'], properties: { safetyFunctions: { type: 'array' }, architecture: { type: 'object' }, components: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'safety', 'function-design']
}));

export const hardwareSafetyTestingTask = defineTask('hardware-safety-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hardware Safety Testing - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test hardware safety systems', context: args, instructions: ['1. Test safety relays', '2. Test safety PLCs', '3. Test safety sensors', '4. Verify redundancy', '5. Document test results'] },
    outputSchema: { type: 'object', required: ['testResults', 'passRate', 'artifacts'], properties: { testResults: { type: 'array' }, passRate: { type: 'number' }, diagnosticCoverage: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'safety', 'hardware-testing']
}));

export const softwareSafetyTestingTask = defineTask('software-safety-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Software Safety Testing - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Test software safety systems', context: args, instructions: ['1. Test safety software', '2. Verify watchdogs', '3. Test safe states', '4. Verify fault detection', '5. Document test results'] },
    outputSchema: { type: 'object', required: ['testResults', 'coverage', 'artifacts'], properties: { testResults: { type: 'array' }, coverage: { type: 'number' }, faultDetectionRate: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'safety', 'software-testing']
}));

export const emergencyStopValidationTask = defineTask('emergency-stop-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `E-Stop Validation - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: { role: 'Test Engineer', task: 'Validate emergency stop systems', context: args, instructions: ['1. Test all e-stop buttons', '2. Measure stopping time', '3. Test from all states', '4. Verify safe state', '5. Document validation'] },
    outputSchema: { type: 'object', required: ['estopTests', 'stoppingTime', 'artifacts'], properties: { estopTests: { type: 'array' }, stoppingTime: { type: 'number' }, allPassed: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'safety', 'estop']
}));

export const safetyPLCalculationTask = defineTask('safety-pl-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `PL Calculation - ${args.robotName}`,
  agent: {
    name: 'safety-engineer',
    prompt: { role: 'Safety Engineer', task: 'Calculate achieved Performance Level', context: args, instructions: ['1. Calculate MTTFd', '2. Determine DC', '3. Calculate CCF', '4. Apply ISO 13849 formulas', '5. Document PL achievement'] },
    outputSchema: { type: 'object', required: ['achievedPL', 'calculations', 'artifacts'], properties: { achievedPL: { type: 'string' }, calculations: { type: 'object' }, mttfd: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'safety', 'pl-calculation']
}));

export const certificationDocumentationTask = defineTask('certification-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Certification Docs - ${args.robotName}`,
  agent: {
    name: 'safety-engineer',
    prompt: { role: 'Safety Engineer', task: 'Prepare certification documentation', context: args, instructions: ['1. Compile test evidence', '2. Create safety manual', '3. Prepare declaration', '4. Document traceability', '5. Prepare for audit'] },
    outputSchema: { type: 'object', required: ['reportPath', 'documents', 'artifacts'], properties: { reportPath: { type: 'string' }, documents: { type: 'array' }, declaration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['robotics-simulation', 'safety', 'certification']
}));
