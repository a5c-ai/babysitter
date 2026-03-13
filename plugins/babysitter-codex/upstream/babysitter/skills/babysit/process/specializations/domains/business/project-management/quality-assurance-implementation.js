/**
 * @process specializations/domains/business/project-management/quality-assurance-implementation
 * @description Quality Assurance Implementation - Establish quality standards, develop quality plans,
 * implement quality control processes, and ensure deliverables meet requirements.
 * @inputs { projectName: string, qualityRequirements: array, deliverables: array, standards: array }
 * @outputs { success: boolean, qualityPlan: object, controlProcesses: array, metrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/quality-assurance-implementation', {
 *   projectName: 'Enterprise Platform',
 *   qualityRequirements: [{ id: 'QR001', description: 'System uptime 99.9%' }],
 *   deliverables: [{ name: 'API Gateway', acceptance: [...] }],
 *   standards: ['ISO 9001', 'CMMI Level 3']
 * });
 *
 * @references
 * - PMI Quality Management: https://www.pmi.org/pmbok-guide-standards/foundational/pmbok
 * - ISO 9001: https://www.iso.org/iso-9001-quality-management.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    qualityRequirements = [],
    deliverables = [],
    standards = [],
    organizationalPolicies = {}
  } = inputs;

  // Phase 1: Quality Standards Definition
  const standardsDefinition = await ctx.task(qualityStandardsTask, {
    projectName,
    qualityRequirements,
    standards,
    organizationalPolicies
  });

  // Phase 2: Quality Metrics Development
  const metricsDevlopment = await ctx.task(qualityMetricsTask, {
    projectName,
    standards: standardsDefinition,
    deliverables
  });

  // Phase 3: Quality Plan Development
  const qualityPlan = await ctx.task(qualityPlanTask, {
    projectName,
    standards: standardsDefinition,
    metrics: metricsDevlopment,
    deliverables
  });

  // Breakpoint: Review quality plan
  await ctx.breakpoint({
    question: `Quality plan developed for ${projectName} with ${metricsDevlopment.metrics?.length || 0} metrics. Review and approve?`,
    title: 'Quality Plan Review',
    context: {
      runId: ctx.runId,
      projectName,
      files: [{
        path: `artifacts/quality-plan.json`,
        format: 'json',
        content: qualityPlan
      }]
    }
  });

  // Phase 4: Quality Control Processes
  const controlProcesses = await ctx.task(qualityControlTask, {
    projectName,
    qualityPlan,
    deliverables
  });

  // Phase 5: Inspection and Testing Framework
  const testingFramework = await ctx.task(testingFrameworkTask, {
    projectName,
    controlProcesses,
    deliverables,
    metrics: metricsDevlopment
  });

  // Phase 6: Quality Audit Planning
  const auditPlan = await ctx.task(qualityAuditTask, {
    projectName,
    qualityPlan,
    controlProcesses,
    standards: standardsDefinition
  });

  // Phase 7: Defect Management Process
  const defectManagement = await ctx.task(defectManagementTask, {
    projectName,
    controlProcesses,
    testingFramework
  });

  // Phase 8: Continuous Improvement Framework
  const improvementFramework = await ctx.task(continuousImprovementTask, {
    projectName,
    qualityPlan,
    metrics: metricsDevlopment,
    defectManagement
  });

  // Phase 9: Quality Documentation
  const qualityDocumentation = await ctx.task(qualityDocumentationTask, {
    projectName,
    qualityPlan,
    controlProcesses,
    testingFramework,
    auditPlan,
    defectManagement,
    improvementFramework
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Quality assurance implementation complete for ${projectName}. ${controlProcesses.processes?.length || 0} control processes defined. Approve implementation?`,
    title: 'QA Implementation Approval',
    context: {
      runId: ctx.runId,
      projectName,
      files: [
        { path: `artifacts/qa-implementation.json`, format: 'json', content: qualityDocumentation },
        { path: `artifacts/qa-implementation.md`, format: 'markdown', content: qualityDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    qualityPlan: qualityPlan,
    controlProcesses: controlProcesses.processes,
    testingFramework: testingFramework,
    auditPlan: auditPlan,
    defectManagement: defectManagement,
    improvementFramework: improvementFramework,
    metrics: metricsDevlopment.metrics,
    documentation: qualityDocumentation,
    metadata: {
      processId: 'specializations/domains/business/project-management/quality-assurance-implementation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const qualityStandardsTask = defineTask('quality-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Quality Standards - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Manager',
      task: 'Define quality standards for the project',
      context: {
        projectName: args.projectName,
        qualityRequirements: args.qualityRequirements,
        standards: args.standards,
        organizationalPolicies: args.organizationalPolicies
      },
      instructions: [
        '1. Review quality requirements',
        '2. Identify applicable standards',
        '3. Define quality objectives',
        '4. Establish acceptance criteria',
        '5. Document quality thresholds',
        '6. Align with organizational policies',
        '7. Define compliance requirements',
        '8. Create standards matrix',
        '9. Identify certification needs',
        '10. Summarize quality standards'
      ],
      outputFormat: 'JSON object with quality standards'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'objectives'],
      properties: {
        standards: { type: 'array' },
        objectives: { type: 'array' },
        acceptanceCriteria: { type: 'object' },
        thresholds: { type: 'object' },
        complianceRequirements: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality', 'standards', 'planning']
}));

export const qualityMetricsTask = defineTask('quality-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Quality Metrics - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Analyst',
      task: 'Develop quality metrics and KPIs',
      context: {
        projectName: args.projectName,
        standards: args.standards,
        deliverables: args.deliverables
      },
      instructions: [
        '1. Define quality KPIs',
        '2. Establish measurement methods',
        '3. Set target values',
        '4. Define data collection approach',
        '5. Create metrics dashboard design',
        '6. Establish reporting frequency',
        '7. Define escalation thresholds',
        '8. Link metrics to deliverables',
        '9. Create measurement plan',
        '10. Document metrics framework'
      ],
      outputFormat: 'JSON object with quality metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              target: { type: 'number' },
              unit: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        measurementPlan: { type: 'object' },
        dashboardDesign: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality', 'metrics', 'KPIs']
}));

export const qualityPlanTask = defineTask('quality-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Quality Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Planner',
      task: 'Develop comprehensive quality management plan',
      context: {
        projectName: args.projectName,
        standards: args.standards,
        metrics: args.metrics,
        deliverables: args.deliverables
      },
      instructions: [
        '1. Define quality approach',
        '2. Document roles and responsibilities',
        '3. Establish quality activities',
        '4. Create quality schedule',
        '5. Define resource requirements',
        '6. Document tools and techniques',
        '7. Establish review processes',
        '8. Define approval workflows',
        '9. Create communication plan',
        '10. Compile quality management plan'
      ],
      outputFormat: 'JSON object with quality plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan'],
      properties: {
        plan: { type: 'object' },
        roles: { type: 'array' },
        activities: { type: 'array' },
        schedule: { type: 'object' },
        resources: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality', 'plan', 'management']
}));

export const qualityControlTask = defineTask('quality-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Quality Control - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Controller',
      task: 'Establish quality control processes',
      context: {
        projectName: args.projectName,
        qualityPlan: args.qualityPlan,
        deliverables: args.deliverables
      },
      instructions: [
        '1. Define control points',
        '2. Establish inspection processes',
        '3. Create checklists',
        '4. Define sampling approaches',
        '5. Establish control charts',
        '6. Document verification methods',
        '7. Create validation procedures',
        '8. Define non-conformance handling',
        '9. Establish corrective actions',
        '10. Document control processes'
      ],
      outputFormat: 'JSON object with quality control processes'
    },
    outputSchema: {
      type: 'object',
      required: ['processes'],
      properties: {
        processes: { type: 'array' },
        controlPoints: { type: 'array' },
        checklists: { type: 'array' },
        nonConformanceProcess: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality', 'control', 'processes']
}));

export const testingFrameworkTask = defineTask('testing-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Testing Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Manager',
      task: 'Develop inspection and testing framework',
      context: {
        projectName: args.projectName,
        controlProcesses: args.controlProcesses,
        deliverables: args.deliverables,
        metrics: args.metrics
      },
      instructions: [
        '1. Define test strategy',
        '2. Identify test types needed',
        '3. Create test plans',
        '4. Define test cases',
        '5. Establish test environments',
        '6. Define acceptance testing',
        '7. Create traceability matrix',
        '8. Document test procedures',
        '9. Define test reporting',
        '10. Compile testing framework'
      ],
      outputFormat: 'JSON object with testing framework'
    },
    outputSchema: {
      type: 'object',
      required: ['framework'],
      properties: {
        framework: { type: 'object' },
        testStrategy: { type: 'string' },
        testTypes: { type: 'array' },
        testPlans: { type: 'array' },
        traceabilityMatrix: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality', 'testing', 'framework']
}));

export const qualityAuditTask = defineTask('quality-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Quality Audit - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Auditor',
      task: 'Plan quality audits',
      context: {
        projectName: args.projectName,
        qualityPlan: args.qualityPlan,
        controlProcesses: args.controlProcesses,
        standards: args.standards
      },
      instructions: [
        '1. Define audit objectives',
        '2. Create audit schedule',
        '3. Identify audit scope',
        '4. Develop audit checklists',
        '5. Define audit team',
        '6. Establish audit procedures',
        '7. Define reporting requirements',
        '8. Plan corrective action follow-up',
        '9. Document audit trail',
        '10. Compile audit plan'
      ],
      outputFormat: 'JSON object with audit plan'
    },
    outputSchema: {
      type: 'object',
      required: ['auditPlan'],
      properties: {
        auditPlan: { type: 'object' },
        schedule: { type: 'array' },
        checklists: { type: 'array' },
        procedures: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality', 'audit', 'compliance']
}));

export const defectManagementTask = defineTask('defect-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Defect Management - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Defect Manager',
      task: 'Establish defect management process',
      context: {
        projectName: args.projectName,
        controlProcesses: args.controlProcesses,
        testingFramework: args.testingFramework
      },
      instructions: [
        '1. Define defect categories',
        '2. Establish severity levels',
        '3. Create defect lifecycle',
        '4. Define triage process',
        '5. Establish resolution workflows',
        '6. Define root cause analysis',
        '7. Create defect tracking approach',
        '8. Define metrics and reporting',
        '9. Establish escalation procedures',
        '10. Document defect management process'
      ],
      outputFormat: 'JSON object with defect management process'
    },
    outputSchema: {
      type: 'object',
      required: ['process'],
      properties: {
        process: { type: 'object' },
        categories: { type: 'array' },
        severityLevels: { type: 'array' },
        lifecycle: { type: 'object' },
        escalationProcedures: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality', 'defects', 'management']
}));

export const continuousImprovementTask = defineTask('continuous-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Continuous Improvement - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Process Improvement Specialist',
      task: 'Develop continuous improvement framework',
      context: {
        projectName: args.projectName,
        qualityPlan: args.qualityPlan,
        metrics: args.metrics,
        defectManagement: args.defectManagement
      },
      instructions: [
        '1. Define improvement methodology',
        '2. Establish feedback mechanisms',
        '3. Create improvement identification process',
        '4. Define prioritization criteria',
        '5. Establish implementation process',
        '6. Define success measurement',
        '7. Create lessons learned process',
        '8. Document best practices capture',
        '9. Define knowledge sharing',
        '10. Compile improvement framework'
      ],
      outputFormat: 'JSON object with improvement framework'
    },
    outputSchema: {
      type: 'object',
      required: ['framework'],
      properties: {
        framework: { type: 'object' },
        methodology: { type: 'string' },
        feedbackMechanisms: { type: 'array' },
        improvementProcess: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality', 'improvement', 'continuous']
}));

export const qualityDocumentationTask = defineTask('quality-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Quality Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer',
      task: 'Compile comprehensive quality documentation',
      context: {
        projectName: args.projectName,
        qualityPlan: args.qualityPlan,
        controlProcesses: args.controlProcesses,
        testingFramework: args.testingFramework,
        auditPlan: args.auditPlan,
        defectManagement: args.defectManagement,
        improvementFramework: args.improvementFramework
      },
      instructions: [
        '1. Compile quality manual',
        '2. Document all procedures',
        '3. Create process maps',
        '4. Generate templates',
        '5. Create training materials',
        '6. Document version control',
        '7. Generate markdown report',
        '8. Add recommendations',
        '9. Include appendices',
        '10. Finalize documentation package'
      ],
      outputFormat: 'JSON object with quality documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'markdown'],
      properties: {
        documentation: { type: 'object' },
        markdown: { type: 'string' },
        templates: { type: 'array' },
        trainingMaterials: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality', 'documentation', 'deliverable']
}));
