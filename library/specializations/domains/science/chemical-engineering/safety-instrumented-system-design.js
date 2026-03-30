/**
 * @process chemical-engineering/safety-instrumented-system-design
 * @description Design safety instrumented systems (SIS) to achieve required Safety Integrity Levels (SIL) per IEC 61511
 * @inputs { processName: string, safetyRequirements: object, hazardScenarios: array, outputDir: string }
 * @outputs { success: boolean, sisDesign: object, srsDocument: object, validationPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    safetyRequirements,
    hazardScenarios,
    existingProtection = [],
    outputDir = 'sis-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Identify Safety Instrumented Functions
  ctx.log('info', 'Starting SIS design: Identifying safety instrumented functions');
  const sifIdentificationResult = await ctx.task(sifIdentificationTask, {
    processName,
    hazardScenarios,
    safetyRequirements,
    existingProtection,
    outputDir
  });

  if (!sifIdentificationResult.success) {
    return {
      success: false,
      error: 'SIF identification failed',
      details: sifIdentificationResult,
      metadata: { processId: 'chemical-engineering/safety-instrumented-system-design', timestamp: startTime }
    };
  }

  artifacts.push(...sifIdentificationResult.artifacts);

  // Task 2: Determine Required SIL for Each SIF
  ctx.log('info', 'Determining required SIL for each SIF');
  const silDeterminationResult = await ctx.task(silDeterminationTask, {
    processName,
    sifs: sifIdentificationResult.sifs,
    hazardScenarios,
    safetyRequirements,
    outputDir
  });

  artifacts.push(...silDeterminationResult.artifacts);

  // Task 3: Select SIS Architecture and Components
  ctx.log('info', 'Selecting SIS architecture and components');
  const architectureResult = await ctx.task(sisArchitectureTask, {
    processName,
    sifs: silDeterminationResult.sifsWithSil,
    outputDir
  });

  artifacts.push(...architectureResult.artifacts);

  // Task 4: Calculate Achieved SIL through Reliability Analysis
  ctx.log('info', 'Performing SIL verification calculations');
  const silVerificationResult = await ctx.task(silVerificationTask, {
    processName,
    sisArchitecture: architectureResult.architecture,
    sifs: silDeterminationResult.sifsWithSil,
    outputDir
  });

  artifacts.push(...silVerificationResult.artifacts);

  // Task 5: Design for Diagnostics and Testing
  ctx.log('info', 'Designing diagnostics and proof testing');
  const diagnosticsResult = await ctx.task(diagnosticsDesignTask, {
    processName,
    sisArchitecture: architectureResult.architecture,
    silVerification: silVerificationResult,
    outputDir
  });

  artifacts.push(...diagnosticsResult.artifacts);

  // Breakpoint: Review SIS design
  await ctx.breakpoint({
    question: `SIS design complete for ${processName}. SIFs identified: ${sifIdentificationResult.sifs.length}. All SIL targets met: ${silVerificationResult.allTargetsMet}. Architecture: ${architectureResult.architecture.type}. Review design?`,
    title: 'SIS Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        sifsCount: sifIdentificationResult.sifs.length,
        silTargetsMet: silVerificationResult.allTargetsMet,
        architectureType: architectureResult.architecture.type,
        proofTestInterval: diagnosticsResult.proofTestInterval
      }
    }
  });

  // Task 6: Develop Safety Requirements Specification
  ctx.log('info', 'Developing Safety Requirements Specification');
  const srsResult = await ctx.task(srsDocumentTask, {
    processName,
    sifs: silDeterminationResult.sifsWithSil,
    sisArchitecture: architectureResult.architecture,
    silVerification: silVerificationResult,
    diagnostics: diagnosticsResult,
    outputDir
  });

  artifacts.push(...srsResult.artifacts);

  // Task 7: Develop SIS Validation Test Plan
  ctx.log('info', 'Developing SIS validation test plan');
  const validationResult = await ctx.task(validationTestPlanTask, {
    processName,
    sifs: silDeterminationResult.sifsWithSil,
    sisArchitecture: architectureResult.architecture,
    srs: srsResult.srs,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    sisDesign: {
      architecture: architectureResult.architecture,
      sifs: silDeterminationResult.sifsWithSil,
      silVerification: silVerificationResult
    },
    srsDocument: srsResult.srs,
    validationPlan: validationResult.testPlan,
    diagnostics: diagnosticsResult,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/safety-instrumented-system-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: SIF Identification
export const sifIdentificationTask = defineTask('sif-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify safety instrumented functions',
  agent: {
    name: 'safety-systems-engineer',
    prompt: {
      role: 'safety instrumented systems engineer',
      task: 'Identify required safety instrumented functions',
      context: args,
      instructions: [
        'Review hazard scenarios requiring SIS protection',
        'Identify SIF for each unacceptable risk',
        'Define process variable to be monitored',
        'Define safe state for each SIF',
        'Define action required to reach safe state',
        'Identify sensors, logic solvers, and final elements',
        'Document SIF functional descriptions',
        'Create SIF register'
      ],
      outputFormat: 'JSON with SIF list, functional descriptions, safe states, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sifs', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sifs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              processVariable: { type: 'string' },
              safeState: { type: 'string' },
              action: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'sis', 'sif-identification']
}));

// Task 2: SIL Determination
export const silDeterminationTask = defineTask('sil-determination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine required SIL for each SIF',
  agent: {
    name: 'safety-systems-engineer',
    prompt: {
      role: 'SIL determination analyst',
      task: 'Determine required Safety Integrity Level for each SIF',
      context: args,
      instructions: [
        'Apply SIL determination method (risk graph, LOPA, risk matrix)',
        'Assess consequence severity for each scenario',
        'Assess likelihood/frequency of initiating event',
        'Account for existing independent protection layers',
        'Calculate required risk reduction',
        'Assign target SIL (1, 2, 3, or 4)',
        'Document SIL determination rationale',
        'Create SIL determination record'
      ],
      outputFormat: 'JSON with SIFs and assigned SIL, LOPA worksheets, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sifsWithSil', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sifsWithSil: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sifId: { type: 'string' },
              targetSil: { type: 'number' },
              riskReductionRequired: { type: 'number' },
              determinationMethod: { type: 'string' }
            }
          }
        },
        lopaWorksheets: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'sis', 'sil-determination']
}));

// Task 3: SIS Architecture Selection
export const sisArchitectureTask = defineTask('sis-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select SIS architecture and components',
  agent: {
    name: 'safety-systems-engineer',
    prompt: {
      role: 'SIS architecture engineer',
      task: 'Select SIS architecture and specify components',
      context: args,
      instructions: [
        'Select voting architecture (1oo1, 1oo2, 2oo3, etc.) per SIL',
        'Select certified safety logic solver',
        'Select SIL-rated sensors and transmitters',
        'Select SIL-rated final elements (valves, etc.)',
        'Design separation from BPCS',
        'Specify communication interfaces',
        'Consider common cause failures',
        'Document architecture design'
      ],
      outputFormat: 'JSON with SIS architecture, component specifications, voting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'architecture', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        architecture: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            logicSolver: { type: 'object' },
            sensors: { type: 'array' },
            finalElements: { type: 'array' },
            votingConfigurations: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'sis', 'architecture']
}));

// Task 4: SIL Verification
export const silVerificationTask = defineTask('sil-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate achieved SIL through reliability analysis',
  agent: {
    name: 'safety-systems-engineer',
    prompt: {
      role: 'SIS reliability engineer',
      task: 'Perform SIL verification calculations',
      context: args,
      instructions: [
        'Calculate PFDavg for each SIF using reliability data',
        'Account for diagnostic coverage',
        'Account for proof test interval',
        'Account for common cause failures (beta factor)',
        'Verify architectural constraints per IEC 61511',
        'Compare achieved SIL with target SIL',
        'Identify any shortfalls',
        'Document SIL verification calculations'
      ],
      outputFormat: 'JSON with PFDavg, achieved SIL, verification status, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'allTargetsMet', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        verificationResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sifId: { type: 'string' },
              targetSil: { type: 'number' },
              achievedSil: { type: 'number' },
              pfdAvg: { type: 'number' },
              targetMet: { type: 'boolean' }
            }
          }
        },
        allTargetsMet: { type: 'boolean' },
        calculations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'sis', 'sil-verification']
}));

// Task 5: Diagnostics Design
export const diagnosticsDesignTask = defineTask('diagnostics-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design diagnostics and proof testing',
  agent: {
    name: 'safety-systems-engineer',
    prompt: {
      role: 'SIS diagnostics engineer',
      task: 'Design diagnostics and proof test procedures',
      context: args,
      instructions: [
        'Define automatic diagnostic coverage requirements',
        'Specify online diagnostics for sensors',
        'Specify logic solver self-diagnostics',
        'Design partial stroke testing for valves',
        'Determine proof test interval',
        'Develop proof test procedures',
        'Specify bypass and override requirements',
        'Document diagnostic design'
      ],
      outputFormat: 'JSON with diagnostics design, proof test procedures, intervals, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'proofTestInterval', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        diagnostics: {
          type: 'object',
          properties: {
            sensorDiagnostics: { type: 'array' },
            valveDiagnostics: { type: 'array' },
            logicSolverDiagnostics: { type: 'object' }
          }
        },
        proofTestInterval: { type: 'string' },
        proofTestProcedures: { type: 'array' },
        bypassRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'sis', 'diagnostics']
}));

// Task 6: Safety Requirements Specification
export const srsDocumentTask = defineTask('srs-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Safety Requirements Specification',
  agent: {
    name: 'safety-systems-engineer',
    prompt: {
      role: 'SRS document author',
      task: 'Develop comprehensive Safety Requirements Specification',
      context: args,
      instructions: [
        'Document scope and application',
        'Specify each SIF with functional requirements',
        'Document target SIL and verification',
        'Specify process inputs and safe states',
        'Document response times',
        'Specify failure modes and actions',
        'Document interface requirements',
        'Create complete SRS per IEC 61511'
      ],
      outputFormat: 'JSON with SRS document path, summary, key requirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'srs', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        srs: {
          type: 'object',
          properties: {
            documentPath: { type: 'string' },
            version: { type: 'string' },
            sifCount: { type: 'number' },
            keyRequirements: { type: 'array' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'sis', 'srs']
}));

// Task 7: Validation Test Plan
export const validationTestPlanTask = defineTask('validation-test-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop SIS validation test plan',
  agent: {
    name: 'safety-systems-engineer',
    prompt: {
      role: 'SIS validation engineer',
      task: 'Develop comprehensive SIS validation test plan',
      context: args,
      instructions: [
        'Define validation test objectives',
        'Develop test cases for each SIF',
        'Define acceptance criteria',
        'Plan functional testing procedures',
        'Plan integration testing',
        'Plan site acceptance testing',
        'Define documentation requirements',
        'Create validation test plan'
      ],
      outputFormat: 'JSON with test plan, test cases, acceptance criteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testPlan', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testPlan: {
          type: 'object',
          properties: {
            objectives: { type: 'array' },
            testCases: { type: 'array' },
            acceptanceCriteria: { type: 'object' },
            schedule: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'sis', 'validation']
}));
