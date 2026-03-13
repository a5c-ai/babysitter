/**
 * @process specializations/domains/science/automotive-engineering/ecu-software-development
 * @description ECU Software Development and Testing - Develop embedded software for automotive ECUs following
 * ASPICE processes including requirements, design, implementation, and verification.
 * @inputs { projectName: string, ecuType: string, aspiceTarget?: string, safetyRelevant?: boolean }
 * @outputs { success: boolean, softwareReleases: object, testReports: object, misraCompliance: object, aspiceEvidence: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/ecu-software-development', {
 *   projectName: 'BMS-Software-Development',
 *   ecuType: 'battery-management-system',
 *   aspiceTarget: 'Level-2',
 *   safetyRelevant: true
 * });
 *
 * @references
 * - Automotive SPICE 3.1
 * - ISO 26262 Software Development
 * - MISRA C:2012 Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    ecuType,
    aspiceTarget = 'Level-2',
    safetyRelevant = false
  } = inputs;

  // Phase 1: Software Requirements Specification
  const swRequirements = await ctx.task(swRequirementsTask, {
    projectName,
    ecuType,
    aspiceTarget,
    safetyRelevant
  });

  // Phase 2: Software Architecture Design
  const swArchitecture = await ctx.task(swArchitectureTask, {
    projectName,
    swRequirements,
    safetyRelevant
  });

  // Breakpoint: Architecture review
  await ctx.breakpoint({
    question: `Review software architecture for ${projectName}. Approve architecture?`,
    title: 'Software Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      swArchitecture,
      files: [{
        path: `artifacts/sw-architecture.json`,
        format: 'json',
        content: swArchitecture
      }]
    }
  });

  // Phase 3: Software Implementation
  const swImplementation = await ctx.task(swImplementationTask, {
    projectName,
    swArchitecture,
    safetyRelevant
  });

  // Phase 4: Static Analysis and MISRA
  const staticAnalysis = await ctx.task(staticAnalysisTask, {
    projectName,
    swImplementation,
    safetyRelevant
  });

  // Quality Gate: MISRA compliance
  if (staticAnalysis.misraViolations > 0) {
    await ctx.breakpoint({
      question: `Static analysis found ${staticAnalysis.misraViolations} MISRA violations. Review and approve remediation plan?`,
      title: 'MISRA Violations Found',
      context: {
        runId: ctx.runId,
        staticAnalysis,
        recommendation: 'Fix all mandatory rules, document deviations for advisory rules'
      }
    });
  }

  // Phase 5: Unit and Integration Testing
  const softwareTesting = await ctx.task(softwareTestingTask, {
    projectName,
    swImplementation,
    swRequirements,
    aspiceTarget
  });

  // Final Breakpoint: Software release approval
  await ctx.breakpoint({
    question: `ECU Software Development complete for ${projectName}. Test coverage: ${softwareTesting.coverage}%. Approve release?`,
    title: 'Software Release Approval',
    context: {
      runId: ctx.runId,
      projectName,
      softwareTesting,
      files: [
        { path: `artifacts/software-release.json`, format: 'json', content: swImplementation },
        { path: `artifacts/test-reports.json`, format: 'json', content: softwareTesting }
      ]
    }
  });

  return {
    success: true,
    projectName,
    softwareReleases: swImplementation.releases,
    testReports: softwareTesting.reports,
    misraCompliance: staticAnalysis.compliance,
    aspiceEvidence: softwareTesting.aspiceEvidence,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/ecu-software-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

export const swRequirementsTask = defineTask('sw-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Software Requirements Specification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Requirements Engineer',
      task: 'Develop software requirements specification',
      context: args,
      instructions: [
        '1. Derive software requirements from system requirements',
        '2. Define functional requirements',
        '3. Define non-functional requirements',
        '4. Define interface requirements',
        '5. Define timing requirements',
        '6. Define safety requirements (if applicable)',
        '7. Establish requirements traceability',
        '8. Define acceptance criteria',
        '9. Review requirements quality',
        '10. Document SRS per ASPICE'
      ],
      outputFormat: 'JSON object with software requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'traceability', 'srs'],
      properties: {
        requirements: { type: 'array', items: { type: 'object' } },
        traceability: { type: 'object' },
        srs: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'software', 'requirements', 'ASPICE']
}));

export const swArchitectureTask = defineTask('sw-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Software Architecture Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Architect',
      task: 'Design software architecture',
      context: args,
      instructions: [
        '1. Define software architecture',
        '2. Design software components',
        '3. Define component interfaces',
        '4. Design data flow',
        '5. Define timing architecture',
        '6. Design memory architecture',
        '7. Define safety mechanisms (if applicable)',
        '8. Document design decisions',
        '9. Verify architecture against requirements',
        '10. Create design documentation'
      ],
      outputFormat: 'JSON object with software architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'components', 'interfaces'],
      properties: {
        architecture: { type: 'object' },
        components: { type: 'array', items: { type: 'object' } },
        interfaces: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'software', 'architecture', 'design']
}));

export const swImplementationTask = defineTask('sw-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Software Implementation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Embedded Software Developer',
      task: 'Implement embedded software',
      context: args,
      instructions: [
        '1. Implement software units',
        '2. Apply coding guidelines',
        '3. Implement interfaces',
        '4. Implement safety mechanisms',
        '5. Implement diagnostics',
        '6. Perform code reviews',
        '7. Manage software configuration',
        '8. Build and link software',
        '9. Create software releases',
        '10. Document implementation'
      ],
      outputFormat: 'JSON object with software implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['releases', 'implementation', 'configuration'],
      properties: {
        releases: { type: 'object' },
        implementation: { type: 'object' },
        configuration: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'software', 'implementation', 'embedded']
}));

export const staticAnalysisTask = defineTask('static-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Static Analysis and MISRA - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code Quality Engineer',
      task: 'Execute static analysis and MISRA compliance check',
      context: args,
      instructions: [
        '1. Execute MISRA-C compliance check',
        '2. Execute static code analysis',
        '3. Check code complexity metrics',
        '4. Analyze code coverage potential',
        '5. Identify coding standard violations',
        '6. Document rule deviations',
        '7. Execute security analysis',
        '8. Check memory safety',
        '9. Generate compliance reports',
        '10. Document analysis results'
      ],
      outputFormat: 'JSON object with static analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['compliance', 'misraViolations', 'analysis'],
      properties: {
        compliance: { type: 'object' },
        misraViolations: { type: 'number' },
        analysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'software', 'MISRA', 'static-analysis']
}));

export const softwareTestingTask = defineTask('software-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Unit and Integration Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Test Engineer',
      task: 'Execute software testing',
      context: args,
      instructions: [
        '1. Execute unit tests',
        '2. Measure code coverage',
        '3. Execute integration tests',
        '4. Execute regression tests',
        '5. Verify requirements coverage',
        '6. Execute equivalence class testing',
        '7. Execute boundary value testing',
        '8. Generate test reports',
        '9. Document ASPICE evidence',
        '10. Track defects to closure'
      ],
      outputFormat: 'JSON object with testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'coverage', 'aspiceEvidence'],
      properties: {
        reports: { type: 'object' },
        coverage: { type: 'number' },
        aspiceEvidence: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'software', 'testing', 'ASPICE']
}));
