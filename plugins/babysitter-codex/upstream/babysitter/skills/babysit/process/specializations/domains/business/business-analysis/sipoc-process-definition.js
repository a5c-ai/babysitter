/**
 * @process business-analysis/sipoc-process-definition
 * @description Create high-level process definitions identifying Suppliers, Inputs, Process steps, Outputs, and Customers. Serves as foundation for detailed process analysis and improvement initiatives.
 * @inputs { projectName: string, processName: string, processContext: object, stakeholders: array }
 * @outputs { success: boolean, sipocDiagram: object, processScope: object, stakeholderMap: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    processName = 'Business Process',
    processContext = {},
    stakeholders = [],
    outputDir = 'sipoc-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SIPOC Process Definition for ${processName}`);

  // ============================================================================
  // PHASE 1: PROCESS IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying and scoping the process');
  const processIdentification = await ctx.task(processIdentificationTask, {
    projectName,
    processName,
    processContext,
    stakeholders,
    outputDir
  });

  artifacts.push(...processIdentification.artifacts);

  // ============================================================================
  // PHASE 2: CUSTOMER IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying customers and their requirements');
  const customerIdentification = await ctx.task(customerIdentificationTask, {
    projectName,
    processName,
    processIdentification,
    stakeholders,
    outputDir
  });

  artifacts.push(...customerIdentification.artifacts);

  // ============================================================================
  // PHASE 3: OUTPUT DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining process outputs');
  const outputDefinition = await ctx.task(outputDefinitionTask, {
    projectName,
    processName,
    customerIdentification,
    processContext,
    outputDir
  });

  artifacts.push(...outputDefinition.artifacts);

  // ============================================================================
  // PHASE 4: PROCESS STEPS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining high-level process steps');
  const processStepsDefinition = await ctx.task(processStepsDefinitionTask, {
    projectName,
    processName,
    outputDefinition,
    processContext,
    outputDir
  });

  artifacts.push(...processStepsDefinition.artifacts);

  // ============================================================================
  // PHASE 5: INPUT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying process inputs');
  const inputIdentification = await ctx.task(inputIdentificationTask, {
    projectName,
    processName,
    processStepsDefinition,
    outputDir
  });

  artifacts.push(...inputIdentification.artifacts);

  // ============================================================================
  // PHASE 6: SUPPLIER IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying suppliers');
  const supplierIdentification = await ctx.task(supplierIdentificationTask, {
    projectName,
    processName,
    inputIdentification,
    outputDir
  });

  artifacts.push(...supplierIdentification.artifacts);

  // ============================================================================
  // PHASE 7: SIPOC DIAGRAM CREATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating SIPOC diagram');
  const sipocDiagram = await ctx.task(sipocDiagramCreationTask, {
    projectName,
    processName,
    supplierIdentification,
    inputIdentification,
    processStepsDefinition,
    outputDefinition,
    customerIdentification,
    outputDir
  });

  artifacts.push(...sipocDiagram.artifacts);

  // ============================================================================
  // PHASE 8: VALIDATION AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating and documenting SIPOC');
  const validation = await ctx.task(sipocValidationTask, {
    projectName,
    processName,
    sipocDiagram,
    stakeholders,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  // Breakpoint: Review SIPOC
  await ctx.breakpoint({
    question: `SIPOC complete for ${processName}. Completeness score: ${validation.completenessScore}/100. Review and approve?`,
    title: 'SIPOC Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        processName,
        completenessScore: validation.completenessScore,
        suppliers: supplierIdentification.suppliers?.length || 0,
        inputs: inputIdentification.inputs?.length || 0,
        processSteps: processStepsDefinition.steps?.length || 0,
        outputs: outputDefinition.outputs?.length || 0,
        customers: customerIdentification.customers?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    processName,
    completenessScore: validation.completenessScore,
    sipocDiagram: {
      diagramPath: sipocDiagram.diagramPath,
      suppliers: supplierIdentification.suppliers,
      inputs: inputIdentification.inputs,
      process: processStepsDefinition.steps,
      outputs: outputDefinition.outputs,
      customers: customerIdentification.customers
    },
    processScope: {
      startTrigger: processIdentification.startTrigger,
      endTrigger: processIdentification.endTrigger,
      boundaries: processIdentification.boundaries
    },
    stakeholderMap: customerIdentification.stakeholderMap,
    validation: {
      completenessScore: validation.completenessScore,
      issues: validation.issues,
      recommendations: validation.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/sipoc-process-definition',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const processIdentificationTask = defineTask('process-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and scope process',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior process analyst with Six Sigma expertise',
      task: 'Identify and scope the process for SIPOC analysis',
      context: args,
      instructions: [
        'Define clear process name and purpose',
        'Identify process start trigger (what initiates the process)',
        'Identify process end trigger (what marks completion)',
        'Define process boundaries (what is in/out of scope)',
        'Identify process owner and stakeholders',
        'Document process frequency and volume',
        'Identify related/connected processes',
        'Document key performance indicators',
        'Define success criteria for the process',
        'Note any known issues or improvement areas'
      ],
      outputFormat: 'JSON with processDefinition, startTrigger, endTrigger, boundaries, owner, kpis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['processDefinition', 'startTrigger', 'endTrigger', 'artifacts'],
      properties: {
        processDefinition: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            purpose: { type: 'string' },
            frequency: { type: 'string' },
            volume: { type: 'string' }
          }
        },
        startTrigger: { type: 'string' },
        endTrigger: { type: 'string' },
        boundaries: {
          type: 'object',
          properties: {
            inScope: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } }
          }
        },
        owner: { type: 'string' },
        relatedProcesses: { type: 'array', items: { type: 'string' } },
        kpis: { type: 'array', items: { type: 'string' } },
        knownIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'sipoc', 'process-identification']
}));

export const customerIdentificationTask = defineTask('customer-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify customers',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'customer-focused business analyst',
      task: 'Identify all customers of the process and their requirements',
      context: args,
      instructions: [
        'Identify internal customers (departments, teams, roles)',
        'Identify external customers (clients, partners, regulators)',
        'Document customer requirements and expectations',
        'Define customer quality criteria (CTQs)',
        'Identify primary vs secondary customers',
        'Document customer feedback mechanisms',
        'Identify customer pain points',
        'Create customer segmentation',
        'Document customer communication channels',
        'Create stakeholder map'
      ],
      outputFormat: 'JSON with customers, requirements, ctqs, stakeholderMap, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['customers', 'requirements', 'artifacts'],
      properties: {
        customers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['internal', 'external'] },
              category: { type: 'string', enum: ['primary', 'secondary'] },
              requirements: { type: 'array', items: { type: 'string' } },
              ctqs: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        requirements: { type: 'array', items: { type: 'object' } },
        ctqs: { type: 'array', items: { type: 'string' } },
        painPoints: { type: 'array', items: { type: 'string' } },
        stakeholderMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'sipoc', 'customer']
}));

export const outputDefinitionTask = defineTask('output-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define process outputs',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'process analyst with output quality expertise',
      task: 'Define all outputs produced by the process',
      context: args,
      instructions: [
        'Identify all process outputs (products, services, information)',
        'Map outputs to customers',
        'Define output specifications and quality criteria',
        'Identify primary vs secondary outputs',
        'Document output format and delivery method',
        'Define output acceptance criteria',
        'Identify output dependencies',
        'Document output volume and frequency',
        'Identify output defects or issues',
        'Define output metrics'
      ],
      outputFormat: 'JSON with outputs, outputToCustomerMap, specifications, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['outputs', 'artifacts'],
      properties: {
        outputs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              category: { type: 'string', enum: ['primary', 'secondary'] },
              customer: { type: 'string' },
              format: { type: 'string' },
              qualityCriteria: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' }
            }
          }
        },
        outputToCustomerMap: { type: 'object' },
        specifications: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'array', items: { type: 'string' } },
        defects: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'sipoc', 'output']
}));

export const processStepsDefinitionTask = defineTask('process-steps-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define process steps',
  agent: {
    name: 'process-analyst',
    prompt: {
      role: 'process mapping specialist',
      task: 'Define high-level process steps (4-7 major steps)',
      context: args,
      instructions: [
        'Identify 4-7 major process steps (macro level)',
        'Start with verb (action) for each step',
        'Ensure steps are sequential and logical',
        'Each step should transform inputs to outputs',
        'Keep steps at consistent level of detail',
        'Do NOT include decision points (save for detailed mapping)',
        'Document brief description for each step',
        'Identify step owner/responsible party',
        'Note key activities within each step',
        'Document step sequence dependencies'
      ],
      outputFormat: 'JSON with steps, stepSequence, stepOwners, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['steps', 'artifacts'],
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepNumber: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string' },
              owner: { type: 'string' },
              keyActivities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        stepSequence: { type: 'array', items: { type: 'number' } },
        stepOwners: { type: 'object' },
        totalSteps: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'sipoc', 'process-steps']
}));

export const inputIdentificationTask = defineTask('input-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify process inputs',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'input quality analyst',
      task: 'Identify all inputs required by the process',
      context: args,
      instructions: [
        'Identify all inputs needed for process (materials, information, resources)',
        'Map inputs to process steps that consume them',
        'Define input specifications and requirements',
        'Identify critical inputs vs supporting inputs',
        'Document input source (which supplier provides)',
        'Define input quality criteria',
        'Identify input constraints or issues',
        'Document input volume and frequency',
        'Identify input dependencies',
        'Note any input variations'
      ],
      outputFormat: 'JSON with inputs, inputToStepMap, specifications, criticalInputs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['inputs', 'artifacts'],
      properties: {
        inputs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              category: { type: 'string', enum: ['critical', 'supporting'] },
              usedByStep: { type: 'array', items: { type: 'number' } },
              source: { type: 'string' },
              specifications: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' }
            }
          }
        },
        inputToStepMap: { type: 'object' },
        criticalInputs: { type: 'array', items: { type: 'string' } },
        inputIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'sipoc', 'input']
}));

export const supplierIdentificationTask = defineTask('supplier-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify suppliers',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'supplier relationship analyst',
      task: 'Identify all suppliers providing inputs to the process',
      context: args,
      instructions: [
        'Identify internal suppliers (departments, teams, systems)',
        'Identify external suppliers (vendors, partners)',
        'Map suppliers to inputs they provide',
        'Define supplier quality expectations',
        'Identify primary vs secondary suppliers',
        'Document supplier performance metrics',
        'Identify supplier issues or constraints',
        'Document communication channels with suppliers',
        'Note supplier dependencies',
        'Identify backup/alternative suppliers'
      ],
      outputFormat: 'JSON with suppliers, supplierToInputMap, qualityExpectations, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['suppliers', 'artifacts'],
      properties: {
        suppliers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['internal', 'external'] },
              category: { type: 'string', enum: ['primary', 'secondary', 'backup'] },
              provides: { type: 'array', items: { type: 'string' } },
              qualityExpectations: { type: 'array', items: { type: 'string' } },
              contact: { type: 'string' }
            }
          }
        },
        supplierToInputMap: { type: 'object' },
        qualityExpectations: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'sipoc', 'supplier']
}));

export const sipocDiagramCreationTask = defineTask('sipoc-diagram-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create SIPOC diagram',
  agent: {
    name: 'process-visualizer',
    prompt: {
      role: 'process documentation specialist',
      task: 'Create comprehensive SIPOC diagram document',
      context: args,
      instructions: [
        'Create SIPOC table with five columns',
        'Align rows to show relationships',
        'Include all identified Suppliers',
        'Include all identified Inputs',
        'Include Process steps (4-7 high-level)',
        'Include all identified Outputs',
        'Include all identified Customers',
        'Add process title and scope statement',
        'Include legend and notes',
        'Create visual diagram representation'
      ],
      outputFormat: 'JSON with diagramPath, sipocTable, diagramElements, notes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['diagramPath', 'sipocTable', 'artifacts'],
      properties: {
        diagramPath: { type: 'string' },
        sipocTable: {
          type: 'object',
          properties: {
            suppliers: { type: 'array', items: { type: 'string' } },
            inputs: { type: 'array', items: { type: 'string' } },
            process: { type: 'array', items: { type: 'string' } },
            outputs: { type: 'array', items: { type: 'string' } },
            customers: { type: 'array', items: { type: 'string' } }
          }
        },
        diagramElements: { type: 'object' },
        scopeStatement: { type: 'string' },
        notes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'sipoc', 'diagram']
}));

export const sipocValidationTask = defineTask('sipoc-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate SIPOC',
  agent: {
    name: 'quality-analyst',
    prompt: {
      role: 'process quality analyst',
      task: 'Validate SIPOC completeness and quality',
      context: args,
      instructions: [
        'Verify all SIPOC elements are populated',
        'Check supplier-input-process alignment',
        'Check process-output-customer alignment',
        'Verify process steps are at correct level (4-7)',
        'Check for missing elements',
        'Verify naming conventions',
        'Validate scope boundaries',
        'Check stakeholder coverage',
        'Calculate completeness score',
        'Provide improvement recommendations'
      ],
      outputFormat: 'JSON with completenessScore, validation, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['completenessScore', 'artifacts'],
      properties: {
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        validation: {
          type: 'object',
          properties: {
            suppliersComplete: { type: 'boolean' },
            inputsComplete: { type: 'boolean' },
            processComplete: { type: 'boolean' },
            outputsComplete: { type: 'boolean' },
            customersComplete: { type: 'boolean' },
            alignmentValid: { type: 'boolean' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'sipoc', 'validation']
}));
