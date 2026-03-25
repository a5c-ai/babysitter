/**
 * @process specializations/domains/science/automotive-engineering/ota-update-implementation
 * @description Over-the-Air (OTA) Update Implementation - Implement secure OTA software update capability
 * for vehicle ECUs including update orchestration, delta updates, and rollback mechanisms.
 * @inputs { projectName: string, updateScope: string, targetEcus?: string[], securityRequirements?: object }
 * @outputs { success: boolean, otaSystemDesign: object, securityArchitecture: object, testReports: object, deploymentProcedures: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/ota-update-implementation', {
 *   projectName: 'Vehicle-OTA-Platform',
 *   updateScope: 'full-vehicle',
 *   targetEcus: ['VCU', 'BMS', 'ADAS-Controller', 'Gateway'],
 *   securityRequirements: { authentication: 'PKI', encryption: 'AES-256' }
 * });
 *
 * @references
 * - UN ECE R156 Software Update Management
 * - ISO 24089 Software Update Engineering
 * - UPTANE Framework
 * - ISO/SAE 21434 Cybersecurity
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    updateScope,
    targetEcus = [],
    securityRequirements = {}
  } = inputs;

  // Phase 1: OTA Architecture Design
  const otaArchitecture = await ctx.task(otaArchitectureTask, {
    projectName,
    updateScope,
    targetEcus
  });

  // Phase 2: Security Architecture
  const securityArchitecture = await ctx.task(securityArchitectureTask, {
    projectName,
    otaArchitecture,
    securityRequirements
  });

  // Breakpoint: Security architecture review
  await ctx.breakpoint({
    question: `Review OTA security architecture for ${projectName}. Approve security design?`,
    title: 'OTA Security Review',
    context: {
      runId: ctx.runId,
      projectName,
      securityArchitecture,
      files: [{
        path: `artifacts/ota-security.json`,
        format: 'json',
        content: securityArchitecture
      }]
    }
  });

  // Phase 3: Update Client Implementation
  const updateClient = await ctx.task(updateClientTask, {
    projectName,
    otaArchitecture,
    securityArchitecture,
    targetEcus
  });

  // Phase 4: Campaign Management
  const campaignManagement = await ctx.task(campaignManagementTask, {
    projectName,
    otaArchitecture,
    updateClient
  });

  // Phase 5: Rollback and Recovery
  const rollbackRecovery = await ctx.task(rollbackRecoveryTask, {
    projectName,
    otaArchitecture,
    updateClient
  });

  // Phase 6: OTA Validation
  const otaValidation = await ctx.task(otaValidationTask, {
    projectName,
    otaArchitecture,
    securityArchitecture,
    updateClient,
    rollbackRecovery
  });

  // Final Breakpoint: OTA implementation approval
  await ctx.breakpoint({
    question: `OTA Update Implementation complete for ${projectName}. UN R156 compliance: ${otaValidation.r156Compliance}. Approve?`,
    title: 'OTA Implementation Approval',
    context: {
      runId: ctx.runId,
      projectName,
      otaValidation,
      files: [
        { path: `artifacts/ota-system-design.json`, format: 'json', content: otaArchitecture },
        { path: `artifacts/deployment-procedures.json`, format: 'json', content: campaignManagement }
      ]
    }
  });

  return {
    success: true,
    projectName,
    otaSystemDesign: otaArchitecture.design,
    securityArchitecture: securityArchitecture.architecture,
    testReports: otaValidation.reports,
    deploymentProcedures: campaignManagement.procedures,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/ota-update-implementation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

export const otaArchitectureTask = defineTask('ota-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: OTA Architecture Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OTA Systems Architect',
      task: 'Design OTA system architecture',
      context: args,
      instructions: [
        '1. Define OTA system topology',
        '2. Design backend infrastructure',
        '3. Design vehicle gateway integration',
        '4. Define ECU update interfaces',
        '5. Design delta update mechanism',
        '6. Define update orchestration',
        '7. Design status reporting',
        '8. Define bandwidth management',
        '9. Design failure handling',
        '10. Document architecture specifications'
      ],
      outputFormat: 'JSON object with OTA architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'topology', 'orchestration'],
      properties: {
        design: { type: 'object' },
        topology: { type: 'object' },
        orchestration: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'OTA', 'architecture', 'software-update']
}));

export const securityArchitectureTask = defineTask('security-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Security Architecture - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OTA Security Architect',
      task: 'Design OTA security architecture',
      context: args,
      instructions: [
        '1. Design PKI infrastructure',
        '2. Implement code signing',
        '3. Design secure boot chain',
        '4. Implement transport encryption',
        '5. Design authentication mechanisms',
        '6. Implement integrity verification',
        '7. Design key management',
        '8. Implement UPTANE framework',
        '9. Design secure storage',
        '10. Document security specifications'
      ],
      outputFormat: 'JSON object with security architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'pki', 'mechanisms'],
      properties: {
        architecture: { type: 'object' },
        pki: { type: 'object' },
        mechanisms: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'OTA', 'security', 'UPTANE']
}));

export const updateClientTask = defineTask('update-client', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Update Client Implementation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OTA Client Developer',
      task: 'Implement OTA update client',
      context: args,
      instructions: [
        '1. Implement update manager',
        '2. Design download handling',
        '3. Implement verification logic',
        '4. Design installation sequencing',
        '5. Implement A/B partition handling',
        '6. Design progress reporting',
        '7. Implement user consent handling',
        '8. Design scheduling logic',
        '9. Implement resume capability',
        '10. Document client specifications'
      ],
      outputFormat: 'JSON object with update client'
    },
    outputSchema: {
      type: 'object',
      required: ['client', 'features', 'interfaces'],
      properties: {
        client: { type: 'object' },
        features: { type: 'array', items: { type: 'string' } },
        interfaces: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'OTA', 'client', 'implementation']
}));

export const campaignManagementTask = defineTask('campaign-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Campaign Management - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OTA Campaign Manager',
      task: 'Design campaign management system',
      context: args,
      instructions: [
        '1. Design campaign creation workflow',
        '2. Implement targeting criteria',
        '3. Design phased rollout',
        '4. Implement monitoring dashboard',
        '5. Design approval workflow',
        '6. Implement analytics',
        '7. Design notification system',
        '8. Implement compliance reporting',
        '9. Design recall capability',
        '10. Document procedures'
      ],
      outputFormat: 'JSON object with campaign management'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'workflows', 'monitoring'],
      properties: {
        procedures: { type: 'object' },
        workflows: { type: 'array', items: { type: 'object' } },
        monitoring: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'OTA', 'campaign', 'management']
}));

export const rollbackRecoveryTask = defineTask('rollback-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Rollback and Recovery - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OTA Recovery Engineer',
      task: 'Design rollback and recovery mechanisms',
      context: args,
      instructions: [
        '1. Design A/B partition scheme',
        '2. Implement automatic rollback',
        '3. Design manual rollback procedure',
        '4. Implement health check',
        '5. Design recovery mode',
        '6. Implement fail-safe states',
        '7. Design brick prevention',
        '8. Implement bootloader recovery',
        '9. Test recovery scenarios',
        '10. Document recovery procedures'
      ],
      outputFormat: 'JSON object with rollback and recovery'
    },
    outputSchema: {
      type: 'object',
      required: ['rollback', 'recovery', 'failsafe'],
      properties: {
        rollback: { type: 'object' },
        recovery: { type: 'object' },
        failsafe: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'OTA', 'rollback', 'recovery']
}));

export const otaValidationTask = defineTask('ota-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: OTA Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OTA Validation Engineer',
      task: 'Validate OTA system implementation',
      context: args,
      instructions: [
        '1. Validate update functionality',
        '2. Test security mechanisms',
        '3. Validate rollback capability',
        '4. Test failure scenarios',
        '5. Validate campaign management',
        '6. Test edge conditions',
        '7. Validate UN R156 compliance',
        '8. Test performance',
        '9. Generate test reports',
        '10. Document validation evidence'
      ],
      outputFormat: 'JSON object with OTA validation'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'r156Compliance', 'testResults'],
      properties: {
        reports: { type: 'object' },
        r156Compliance: { type: 'string' },
        testResults: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'OTA', 'validation', 'UN-R156']
}));
