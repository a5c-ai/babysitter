/**
 * @process specializations/domains/science/automotive-engineering/diagnostic-implementation
 * @description Diagnostic Implementation (UDS/OBD) - Implement diagnostic services per UDS (ISO 14229) and
 * OBD-II standards including diagnostic trouble codes, readiness monitors, and service routines.
 * @inputs { projectName: string, ecuType: string, diagnosticServices?: string[], obdRequired?: boolean }
 * @outputs { success: boolean, diagnosticSpec: object, odxFiles: object, dtcMapping: object, validationReports: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/diagnostic-implementation', {
 *   projectName: 'Powertrain-Diagnostics',
 *   ecuType: 'VCU',
 *   diagnosticServices: ['readDTC', 'clearDTC', 'routineControl', 'downloadUpload'],
 *   obdRequired: true
 * });
 *
 * @references
 * - ISO 14229 UDS Specification
 * - ISO 15765 Diagnostics on CAN
 * - SAE J1979 OBD-II PIDs
 * - ODX (ISO 22901)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    ecuType,
    diagnosticServices = [],
    obdRequired = false
  } = inputs;

  // Phase 1: Diagnostic Requirements
  const diagRequirements = await ctx.task(diagRequirementsTask, {
    projectName,
    ecuType,
    diagnosticServices,
    obdRequired
  });

  // Phase 2: UDS Services Implementation
  const udsImplementation = await ctx.task(udsImplementationTask, {
    projectName,
    diagRequirements,
    diagnosticServices
  });

  // Breakpoint: UDS implementation review
  await ctx.breakpoint({
    question: `Review UDS implementation for ${projectName}. ${udsImplementation.services?.length || 0} services implemented. Approve?`,
    title: 'UDS Implementation Review',
    context: {
      runId: ctx.runId,
      projectName,
      udsImplementation,
      files: [{
        path: `artifacts/uds-implementation.json`,
        format: 'json',
        content: udsImplementation
      }]
    }
  });

  // Phase 3: DTC Configuration
  const dtcConfiguration = await ctx.task(dtcConfigurationTask, {
    projectName,
    diagRequirements,
    ecuType
  });

  // Phase 4: OBD-II Monitors (if required)
  const obdMonitors = await ctx.task(obdMonitorsTask, {
    projectName,
    diagRequirements,
    obdRequired
  });

  // Phase 5: Diagnostic Validation
  const diagValidation = await ctx.task(diagValidationTask, {
    projectName,
    udsImplementation,
    dtcConfiguration,
    obdMonitors
  });

  // Final Breakpoint: Diagnostic implementation approval
  await ctx.breakpoint({
    question: `Diagnostic Implementation complete for ${projectName}. Validation pass rate: ${diagValidation.passRate}%. Approve?`,
    title: 'Diagnostic Implementation Approval',
    context: {
      runId: ctx.runId,
      projectName,
      diagValidation,
      files: [
        { path: `artifacts/diagnostic-spec.json`, format: 'json', content: udsImplementation },
        { path: `artifacts/dtc-mapping.json`, format: 'json', content: dtcConfiguration }
      ]
    }
  });

  return {
    success: true,
    projectName,
    diagnosticSpec: udsImplementation.specification,
    odxFiles: udsImplementation.odxFiles,
    dtcMapping: dtcConfiguration.mapping,
    validationReports: diagValidation.reports,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/diagnostic-implementation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

export const diagRequirementsTask = defineTask('diag-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Diagnostic Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Diagnostic Requirements Engineer',
      task: 'Define diagnostic requirements',
      context: args,
      instructions: [
        '1. Define UDS service requirements',
        '2. Define DTC requirements',
        '3. Define OBD-II requirements (if applicable)',
        '4. Define security access requirements',
        '5. Define routine control requirements',
        '6. Define data identifier requirements',
        '7. Define flash download requirements',
        '8. Define session management',
        '9. Define timing requirements',
        '10. Document diagnostic specifications'
      ],
      outputFormat: 'JSON object with diagnostic requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'services', 'dtcs'],
      properties: {
        requirements: { type: 'array', items: { type: 'object' } },
        services: { type: 'array', items: { type: 'string' } },
        dtcs: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'diagnostics', 'requirements', 'UDS']
}));

export const udsImplementationTask = defineTask('uds-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: UDS Services Implementation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Diagnostic Implementation Engineer',
      task: 'Implement UDS diagnostic services',
      context: args,
      instructions: [
        '1. Implement diagnostic session control (0x10)',
        '2. Implement ECU reset (0x11)',
        '3. Implement security access (0x27)',
        '4. Implement read/write data (0x22/0x2E)',
        '5. Implement DTC services (0x14/0x19)',
        '6. Implement routine control (0x31)',
        '7. Implement download/upload (0x34-0x37)',
        '8. Implement tester present (0x3E)',
        '9. Generate ODX files',
        '10. Document implementation'
      ],
      outputFormat: 'JSON object with UDS implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['specification', 'services', 'odxFiles'],
      properties: {
        specification: { type: 'object' },
        services: { type: 'array', items: { type: 'object' } },
        odxFiles: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'diagnostics', 'UDS', 'implementation']
}));

export const dtcConfigurationTask = defineTask('dtc-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: DTC Configuration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DTC Configuration Engineer',
      task: 'Configure diagnostic trouble codes',
      context: args,
      instructions: [
        '1. Define DTC format (ISO 15031-6)',
        '2. Configure fault memory',
        '3. Define DTC status bits',
        '4. Configure aging and healing',
        '5. Define extended data records',
        '6. Configure snapshot data',
        '7. Define enable conditions',
        '8. Configure fault debouncing',
        '9. Create DTC mapping table',
        '10. Document DTC specifications'
      ],
      outputFormat: 'JSON object with DTC configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['mapping', 'configuration', 'faultMemory'],
      properties: {
        mapping: { type: 'object' },
        configuration: { type: 'object' },
        faultMemory: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'diagnostics', 'DTC', 'configuration']
}));

export const obdMonitorsTask = defineTask('obd-monitors', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: OBD-II Monitors - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OBD Engineer',
      task: 'Implement OBD-II monitors',
      context: args,
      instructions: [
        '1. Implement readiness monitors',
        '2. Configure MIL illumination',
        '3. Implement freeze frame data',
        '4. Configure OBD PIDs',
        '5. Implement emissions monitors',
        '6. Configure IUMPR (if applicable)',
        '7. Implement mode 06 data',
        '8. Configure permanent DTCs',
        '9. Test CARB/EPA compliance',
        '10. Document OBD implementation'
      ],
      outputFormat: 'JSON object with OBD monitors'
    },
    outputSchema: {
      type: 'object',
      required: ['monitors', 'pids', 'compliance'],
      properties: {
        monitors: { type: 'array', items: { type: 'object' } },
        pids: { type: 'array', items: { type: 'object' } },
        compliance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'diagnostics', 'OBD', 'monitors']
}));

export const diagValidationTask = defineTask('diag-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Diagnostic Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Diagnostic Validation Engineer',
      task: 'Validate diagnostic implementation',
      context: args,
      instructions: [
        '1. Validate UDS services',
        '2. Validate DTC functionality',
        '3. Validate security access',
        '4. Validate flash download',
        '5. Test with diagnostic tools',
        '6. Validate ODX files',
        '7. Test OBD compliance',
        '8. Validate timing requirements',
        '9. Generate validation reports',
        '10. Document test results'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'passRate', 'issues'],
      properties: {
        reports: { type: 'object' },
        passRate: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'diagnostics', 'validation', 'testing']
}));
