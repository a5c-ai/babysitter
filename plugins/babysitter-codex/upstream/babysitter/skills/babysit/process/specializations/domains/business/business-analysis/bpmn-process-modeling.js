/**
 * @process business-analysis/bpmn-process-modeling
 * @description Document business processes using BPMN 2.0 notation including flow objects, connecting objects, swimlanes, and artifacts. Create current-state (AS-IS) and future-state (TO-BE) process models.
 * @inputs { projectName: string, processName: string, processContext: object, stakeholders: array, existingDocumentation: array }
 * @outputs { success: boolean, asIsModel: object, toBeModel: object, gapAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    processName = 'Business Process',
    processContext = {},
    stakeholders = [],
    existingDocumentation = [],
    outputDir = 'bpmn-output',
    modelingTool = 'bpmn-js'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting BPMN Process Modeling for ${processName}`);

  // ============================================================================
  // PHASE 1: PROCESS DISCOVERY
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering current process state');
  const processDiscovery = await ctx.task(processDiscoveryTask, {
    projectName,
    processName,
    processContext,
    stakeholders,
    existingDocumentation,
    outputDir
  });

  artifacts.push(...processDiscovery.artifacts);

  // ============================================================================
  // PHASE 2: AS-IS PROCESS MODELING
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating AS-IS BPMN model');
  const asIsModeling = await ctx.task(asIsModelingTask, {
    projectName,
    processName,
    processDiscovery,
    stakeholders,
    outputDir
  });

  artifacts.push(...asIsModeling.artifacts);

  // ============================================================================
  // PHASE 3: PROCESS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing current process for improvements');
  const processAnalysis = await ctx.task(processAnalysisTask, {
    projectName,
    processName,
    asIsModel: asIsModeling.model,
    processContext,
    outputDir
  });

  artifacts.push(...processAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: TO-BE PROCESS DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing TO-BE process model');
  const toBeDesign = await ctx.task(toBeDesignTask, {
    projectName,
    processName,
    asIsModel: asIsModeling.model,
    processAnalysis,
    processContext,
    outputDir
  });

  artifacts.push(...toBeDesign.artifacts);

  // ============================================================================
  // PHASE 5: GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Conducting AS-IS to TO-BE gap analysis');
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    projectName,
    processName,
    asIsModel: asIsModeling.model,
    toBeModel: toBeDesign.model,
    processAnalysis,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: BPMN VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Validating BPMN models');
  const bpmnValidation = await ctx.task(bpmnValidationTask, {
    projectName,
    processName,
    asIsModel: asIsModeling.model,
    toBeModel: toBeDesign.model,
    outputDir
  });

  artifacts.push(...bpmnValidation.artifacts);

  const validationPassed = bpmnValidation.overallScore >= 85;

  // Breakpoint: Review BPMN models
  await ctx.breakpoint({
    question: `BPMN modeling complete for ${processName}. Validation score: ${bpmnValidation.overallScore}/100. ${validationPassed ? 'Models are valid!' : 'Some validation issues found.'} Review and approve?`,
    title: 'BPMN Model Review',
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
        validationScore: bpmnValidation.overallScore,
        validationPassed,
        asIsActivities: asIsModeling.model?.activities?.length || 0,
        toBeActivities: toBeDesign.model?.activities?.length || 0,
        gapsIdentified: gapAnalysis.gaps?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 7: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating process documentation');
  const documentation = await ctx.task(documentationGenerationTask, {
    projectName,
    processName,
    asIsModel: asIsModeling.model,
    toBeModel: toBeDesign.model,
    gapAnalysis,
    bpmnValidation,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    processName,
    validationScore: bpmnValidation.overallScore,
    validationPassed,
    asIsModel: {
      modelPath: asIsModeling.modelPath,
      activities: asIsModeling.model?.activities?.length || 0,
      gateways: asIsModeling.model?.gateways?.length || 0,
      swimlanes: asIsModeling.model?.swimlanes?.length || 0
    },
    toBeModel: {
      modelPath: toBeDesign.modelPath,
      activities: toBeDesign.model?.activities?.length || 0,
      improvements: toBeDesign.improvements
    },
    gapAnalysis: {
      totalGaps: gapAnalysis.gaps?.length || 0,
      gaps: gapAnalysis.gaps,
      recommendations: gapAnalysis.recommendations
    },
    processMetrics: {
      asIs: processAnalysis.metrics,
      toBe: toBeDesign.projectedMetrics
    },
    documentation: {
      documentPath: documentation.documentPath,
      sections: documentation.sections
    },
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/bpmn-process-modeling',
      timestamp: startTime,
      modelingTool,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const processDiscoveryTask = defineTask('process-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover current process',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior process analyst with BPMN 2.0 certification',
      task: 'Discover and document current state business process',
      context: args,
      instructions: [
        'Interview stakeholders to understand current process flow',
        'Review existing process documentation',
        'Identify process start and end events',
        'Document all activities and tasks in the process',
        'Identify decision points and gateways',
        'Map participants and their roles (swimlanes)',
        'Document inputs and outputs for each activity',
        'Identify exceptions and error handling paths',
        'Document process triggers and frequency',
        'Capture process metrics and KPIs'
      ],
      outputFormat: 'JSON with processFlow, activities, gateways, participants, inputs, outputs, exceptions, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['processFlow', 'activities', 'participants', 'artifacts'],
      properties: {
        processFlow: {
          type: 'object',
          properties: {
            startEvent: { type: 'string' },
            endEvents: { type: 'array', items: { type: 'string' } },
            triggers: { type: 'array', items: { type: 'string' } }
          }
        },
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              participant: { type: 'string' },
              inputs: { type: 'array', items: { type: 'string' } },
              outputs: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' }
            }
          }
        },
        gateways: { type: 'array', items: { type: 'object' } },
        participants: { type: 'array', items: { type: 'object' } },
        exceptions: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'process-discovery', 'bpmn']
}));

export const asIsModelingTask = defineTask('as-is-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create AS-IS BPMN model',
  agent: {
    name: 'process-modeler',
    prompt: {
      role: 'BPMN 2.0 certified process modeler',
      task: 'Create AS-IS BPMN 2.0 process model from discovered process',
      context: args,
      instructions: [
        'Create BPMN 2.0 compliant process model',
        'Define pools and swimlanes for participants',
        'Model all activities using appropriate BPMN task types',
        'Add start and end events with proper event types',
        'Model decision points using appropriate gateway types (XOR, AND, OR)',
        'Add sequence flows connecting all elements',
        'Include message flows for inter-process communication',
        'Add data objects and data stores',
        'Include annotations for clarification',
        'Apply BPMN best practices for layout and naming'
      ],
      outputFormat: 'JSON with model, modelPath, elements, validation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'modelPath', 'artifacts'],
      properties: {
        model: {
          type: 'object',
          properties: {
            activities: { type: 'array', items: { type: 'object' } },
            gateways: { type: 'array', items: { type: 'object' } },
            events: { type: 'array', items: { type: 'object' } },
            swimlanes: { type: 'array', items: { type: 'object' } },
            flows: { type: 'array', items: { type: 'object' } },
            dataObjects: { type: 'array', items: { type: 'object' } }
          }
        },
        modelPath: { type: 'string' },
        elements: {
          type: 'object',
          properties: {
            totalActivities: { type: 'number' },
            totalGateways: { type: 'number' },
            totalEvents: { type: 'number' },
            totalFlows: { type: 'number' }
          }
        },
        validation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'bpmn-modeling', 'as-is']
}));

export const processAnalysisTask = defineTask('process-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze current process',
  agent: {
    name: 'process-analyst',
    prompt: {
      role: 'senior process improvement analyst',
      task: 'Analyze AS-IS process for inefficiencies and improvement opportunities',
      context: args,
      instructions: [
        'Identify bottlenecks and delays in process flow',
        'Analyze handoffs between participants',
        'Identify redundant or unnecessary activities',
        'Assess automation opportunities',
        'Identify error-prone activities',
        'Analyze cycle time for each activity',
        'Identify value-adding vs non-value-adding activities',
        'Assess process complexity metrics',
        'Identify compliance and risk issues',
        'Document improvement opportunities'
      ],
      outputFormat: 'JSON with metrics, bottlenecks, redundancies, automationOpportunities, improvements, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'improvements', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            cycleTime: { type: 'string' },
            processTime: { type: 'string' },
            waitTime: { type: 'string' },
            handoffs: { type: 'number' },
            activityCount: { type: 'number' },
            complexityScore: { type: 'number' }
          }
        },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              issue: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        redundancies: { type: 'array', items: { type: 'string' } },
        automationOpportunities: { type: 'array', items: { type: 'object' } },
        improvements: { type: 'array', items: { type: 'object' } },
        risks: { type: 'array', items: { type: 'object' } },
        valueAnalysis: {
          type: 'object',
          properties: {
            valueAdding: { type: 'number' },
            nonValueAdding: { type: 'number' },
            necessary: { type: 'number' }
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
  labels: ['agent', 'business-analysis', 'process-analysis', 'improvement']
}));

export const toBeDesignTask = defineTask('to-be-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design TO-BE process',
  agent: {
    name: 'process-designer',
    prompt: {
      role: 'senior process designer with lean/six sigma expertise',
      task: 'Design optimized TO-BE BPMN process model',
      context: args,
      instructions: [
        'Apply improvements identified in process analysis',
        'Eliminate redundant and non-value-adding activities',
        'Optimize handoffs and reduce wait times',
        'Introduce automation where identified',
        'Simplify decision logic where possible',
        'Reduce process complexity',
        'Apply lean principles (eliminate waste)',
        'Design for scalability and flexibility',
        'Include error handling improvements',
        'Project improved metrics'
      ],
      outputFormat: 'JSON with model, modelPath, improvements, projectedMetrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'modelPath', 'improvements', 'artifacts'],
      properties: {
        model: {
          type: 'object',
          properties: {
            activities: { type: 'array', items: { type: 'object' } },
            gateways: { type: 'array', items: { type: 'object' } },
            events: { type: 'array', items: { type: 'object' } },
            swimlanes: { type: 'array', items: { type: 'object' } },
            flows: { type: 'array', items: { type: 'object' } }
          }
        },
        modelPath: { type: 'string' },
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              improvement: { type: 'string' },
              type: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' }
            }
          }
        },
        projectedMetrics: {
          type: 'object',
          properties: {
            cycleTimeReduction: { type: 'string' },
            efficiencyGain: { type: 'string' },
            costSavings: { type: 'string' },
            qualityImprovement: { type: 'string' }
          }
        },
        automationImplemented: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'bpmn-modeling', 'to-be']
}));

export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct gap analysis',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with transformation expertise',
      task: 'Analyze gaps between AS-IS and TO-BE process models',
      context: args,
      instructions: [
        'Compare AS-IS and TO-BE models element by element',
        'Identify added activities in TO-BE',
        'Identify removed activities',
        'Identify modified activities',
        'Document technology gaps',
        'Document skill/capability gaps',
        'Identify organizational change requirements',
        'Estimate effort for each gap closure',
        'Prioritize gaps by impact and feasibility',
        'Create gap closure roadmap'
      ],
      outputFormat: 'JSON with gaps, addedElements, removedElements, modifiedElements, recommendations, roadmap, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'recommendations', 'artifacts'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              currentState: { type: 'string' },
              futureState: { type: 'string' },
              gapDescription: { type: 'string' },
              type: { type: 'string', enum: ['process', 'technology', 'skill', 'organization'] },
              effort: { type: 'string', enum: ['high', 'medium', 'low'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        addedElements: { type: 'array', items: { type: 'string' } },
        removedElements: { type: 'array', items: { type: 'string' } },
        modifiedElements: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        roadmap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              gaps: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' }
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
  labels: ['agent', 'business-analysis', 'gap-analysis', 'transformation']
}));

export const bpmnValidationTask = defineTask('bpmn-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate BPMN models',
  agent: {
    name: 'bpmn-validator',
    prompt: {
      role: 'BPMN 2.0 specification expert',
      task: 'Validate BPMN models for compliance and best practices',
      context: args,
      instructions: [
        'Validate BPMN 2.0 syntax compliance',
        'Check for unconnected elements',
        'Validate gateway logic (split/join consistency)',
        'Check event types and triggers',
        'Validate message flows between pools',
        'Check data object associations',
        'Validate subprocess structures',
        'Check naming conventions',
        'Assess model readability and layout',
        'Generate validation report with recommendations'
      ],
      outputFormat: 'JSON with overallScore, syntaxErrors, warnings, bestPracticeViolations, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        syntaxErrors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              error: { type: 'string' },
              severity: { type: 'string', enum: ['error', 'warning'] }
            }
          }
        },
        warnings: { type: 'array', items: { type: 'string' } },
        bestPracticeViolations: { type: 'array', items: { type: 'string' } },
        unconnectedElements: { type: 'array', items: { type: 'string' } },
        gatewayIssues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        asIsValidation: { type: 'object' },
        toBeValidation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'bpmn-validation', 'quality']
}));

export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate process documentation',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer with process documentation expertise',
      task: 'Generate comprehensive process documentation package',
      context: args,
      instructions: [
        'Create executive summary of process modeling effort',
        'Document AS-IS process narrative',
        'Document TO-BE process narrative',
        'Include gap analysis summary',
        'Create process glossary',
        'Document roles and responsibilities',
        'Include BPMN diagram references',
        'Create implementation recommendations',
        'Document assumptions and constraints',
        'Create appendices with supporting materials'
      ],
      outputFormat: 'JSON with documentPath, sections, glossary, appendices, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'sections', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
              pageCount: { type: 'number' }
            }
          }
        },
        glossary: { type: 'array', items: { type: 'object' } },
        appendices: { type: 'array', items: { type: 'string' } },
        diagramReferences: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'documentation', 'bpmn']
}));
