/**
 * @process specializations/domains/science/automotive-engineering/autosar-implementation
 * @description AUTOSAR Architecture Implementation - Implement AUTOSAR Classic or Adaptive Platform architecture
 * for ECU software development including software component design and basic software configuration.
 * @inputs { projectName: string, autosarPlatform: string, ecuType?: string, swcList?: string[] }
 * @outputs { success: boolean, autosarConfiguration: object, softwareComponents: object, integrationReports: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/autosar-implementation', {
 *   projectName: 'VCU-AUTOSAR-Implementation',
 *   autosarPlatform: 'Classic',
 *   ecuType: 'vehicle-control-unit',
 *   swcList: ['BMS_SWC', 'TM_SWC', 'VDC_SWC']
 * });
 *
 * @references
 * - AUTOSAR Classic Platform
 * - AUTOSAR Adaptive Platform
 * - AUTOSAR Methodology
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    autosarPlatform,
    ecuType = 'generic-ecu',
    swcList = []
  } = inputs;

  // Phase 1: AUTOSAR Architecture Design
  const autosarArchitecture = await ctx.task(autosarArchitectureTask, {
    projectName,
    autosarPlatform,
    ecuType,
    swcList
  });

  // Phase 2: Software Component Design
  const swcDesign = await ctx.task(swcDesignTask, {
    projectName,
    autosarArchitecture,
    swcList
  });

  // Breakpoint: SWC design review
  await ctx.breakpoint({
    question: `Review SWC design for ${projectName}. ${swcDesign.components?.length || 0} components defined. Approve design?`,
    title: 'SWC Design Review',
    context: {
      runId: ctx.runId,
      projectName,
      swcDesign,
      files: [{
        path: `artifacts/swc-design.json`,
        format: 'json',
        content: swcDesign
      }]
    }
  });

  // Phase 3: Basic Software Configuration
  const bswConfiguration = await ctx.task(bswConfigurationTask, {
    projectName,
    autosarPlatform,
    autosarArchitecture
  });

  // Phase 4: RTE Generation and Integration
  const rteIntegration = await ctx.task(rteIntegrationTask, {
    projectName,
    swcDesign,
    bswConfiguration
  });

  // Phase 5: AUTOSAR Compliance Validation
  const complianceValidation = await ctx.task(complianceValidationTask, {
    projectName,
    autosarPlatform,
    swcDesign,
    bswConfiguration,
    rteIntegration
  });

  // Final Breakpoint: AUTOSAR implementation approval
  await ctx.breakpoint({
    question: `AUTOSAR Implementation complete for ${projectName}. Compliance score: ${complianceValidation.complianceScore}%. Approve?`,
    title: 'AUTOSAR Implementation Approval',
    context: {
      runId: ctx.runId,
      projectName,
      complianceValidation,
      files: [
        { path: `artifacts/autosar-configuration.json`, format: 'json', content: bswConfiguration },
        { path: `artifacts/integration-reports.json`, format: 'json', content: rteIntegration }
      ]
    }
  });

  return {
    success: true,
    projectName,
    autosarConfiguration: bswConfiguration.configuration,
    softwareComponents: swcDesign.components,
    integrationReports: rteIntegration.reports,
    complianceScore: complianceValidation.complianceScore,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/autosar-implementation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

export const autosarArchitectureTask = defineTask('autosar-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: AUTOSAR Architecture Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AUTOSAR Architect',
      task: 'Design AUTOSAR system architecture',
      context: args,
      instructions: [
        '1. Define ECU extract from system architecture',
        '2. Design software architecture (SWC allocation)',
        '3. Define communication matrix',
        '4. Design port interfaces',
        '5. Define data types and constants',
        '6. Design system services usage',
        '7. Define memory mapping',
        '8. Design timing requirements',
        '9. Define diagnostic services',
        '10. Document architecture decisions'
      ],
      outputFormat: 'JSON object with AUTOSAR architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'swcAllocation', 'communication'],
      properties: {
        architecture: { type: 'object' },
        swcAllocation: { type: 'array', items: { type: 'object' } },
        communication: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'AUTOSAR', 'architecture', 'software']
}));

export const swcDesignTask = defineTask('swc-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Software Component Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AUTOSAR SWC Designer',
      task: 'Design AUTOSAR software components',
      context: args,
      instructions: [
        '1. Define SWC internal behavior',
        '2. Design runnables and tasks',
        '3. Define ports (sender/receiver, client/server)',
        '4. Design internal data flow',
        '5. Define mode management',
        '6. Design calibration parameters',
        '7. Define NvM data handling',
        '8. Design diagnostic event handling',
        '9. Define SWC interfaces',
        '10. Document component specifications'
      ],
      outputFormat: 'JSON object with SWC design'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'behaviors', 'interfaces'],
      properties: {
        components: { type: 'array', items: { type: 'object' } },
        behaviors: { type: 'array', items: { type: 'object' } },
        interfaces: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'AUTOSAR', 'SWC', 'design']
}));

export const bswConfigurationTask = defineTask('bsw-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Basic Software Configuration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AUTOSAR BSW Engineer',
      task: 'Configure AUTOSAR basic software',
      context: args,
      instructions: [
        '1. Configure COM stack (CAN, LIN, Ethernet)',
        '2. Configure memory stack (NvM, Fee, Fls)',
        '3. Configure diagnostic stack (Dcm, Dem)',
        '4. Configure system services (EcuM, BswM)',
        '5. Configure OS (tasks, alarms, resources)',
        '6. Configure memory protection',
        '7. Configure watchdog management',
        '8. Configure I/O hardware abstraction',
        '9. Generate BSW modules',
        '10. Document BSW configuration'
      ],
      outputFormat: 'JSON object with BSW configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'modules', 'parameters'],
      properties: {
        configuration: { type: 'object' },
        modules: { type: 'array', items: { type: 'object' } },
        parameters: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'AUTOSAR', 'BSW', 'configuration']
}));

export const rteIntegrationTask = defineTask('rte-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: RTE Generation and Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AUTOSAR Integration Engineer',
      task: 'Generate RTE and integrate software',
      context: args,
      instructions: [
        '1. Configure RTE contract phase',
        '2. Generate RTE code',
        '3. Integrate SWCs with RTE',
        '4. Integrate BSW with RTE',
        '5. Configure scheduling',
        '6. Resolve integration issues',
        '7. Execute build process',
        '8. Validate integration',
        '9. Generate integration reports',
        '10. Document integration status'
      ],
      outputFormat: 'JSON object with RTE integration'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'integrationStatus', 'issues'],
      properties: {
        reports: { type: 'object' },
        integrationStatus: { type: 'string' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'AUTOSAR', 'RTE', 'integration']
}));

export const complianceValidationTask = defineTask('compliance-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: AUTOSAR Compliance Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AUTOSAR Compliance Engineer',
      task: 'Validate AUTOSAR compliance',
      context: args,
      instructions: [
        '1. Validate SWC compliance',
        '2. Validate BSW compliance',
        '3. Check naming conventions',
        '4. Validate ARXML files',
        '5. Check interface consistency',
        '6. Validate communication configuration',
        '7. Check methodology compliance',
        '8. Calculate compliance score',
        '9. Identify deviations',
        '10. Document compliance report'
      ],
      outputFormat: 'JSON object with compliance validation'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'validation', 'deviations'],
      properties: {
        complianceScore: { type: 'number' },
        validation: { type: 'object' },
        deviations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'AUTOSAR', 'compliance', 'validation']
}));
