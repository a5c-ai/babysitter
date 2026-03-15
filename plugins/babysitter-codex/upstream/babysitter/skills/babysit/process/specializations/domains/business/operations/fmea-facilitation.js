/**
 * @process specializations/domains/business/operations/fmea-facilitation
 * @description FMEA Facilitation Process - Facilitate Failure Mode and Effects Analysis for products and processes,
 * prioritize risks, and implement controls for proactive quality and reliability improvement.
 * @inputs { fmeaType: string, scope: string, teamMembers?: array, rpnThreshold?: number }
 * @outputs { success: boolean, fmeaResults: object, highRiskItems: array, actions: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/fmea-facilitation', {
 *   fmeaType: 'process',
 *   scope: 'Assembly Process Step 5',
 *   teamMembers: ['process-engineer', 'quality', 'operations'],
 *   rpnThreshold: 100
 * });
 *
 * @references
 * - AIAG & VDA FMEA Handbook (2019)
 * - SAE J1739 - Potential Failure Mode and Effects Analysis
 * - ISO/TS 16949 / IATF 16949
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    fmeaType = 'process',
    scope = '',
    teamMembers = [],
    rpnThreshold = 100,
    apThreshold = 'H',
    methodology = 'AIAG-VDA',
    outputDir = 'fmea-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const fmeaId = `FMEA-${Date.now()}`;

  ctx.log('info', `Starting ${fmeaType.toUpperCase()} FMEA ${fmeaId} for scope: ${scope}`);

  // Phase 1: FMEA Planning
  ctx.log('info', 'Phase 1: FMEA Planning and Team Formation');
  const planning = await ctx.task(fmeaPlanningTask, {
    fmeaId,
    fmeaType,
    scope,
    teamMembers,
    methodology,
    outputDir
  });

  artifacts.push(...planning.artifacts);

  // Phase 2: Scope Definition
  ctx.log('info', 'Phase 2: Scope Definition and Boundary Analysis');
  const scopeDefinition = await ctx.task(scopeDefinitionTask, {
    fmeaId,
    fmeaType,
    scope,
    planning,
    outputDir
  });

  artifacts.push(...scopeDefinition.artifacts);

  // Quality Gate: Scope Review
  await ctx.breakpoint({
    question: `FMEA scope defined. Type: ${fmeaType}. Items to analyze: ${scopeDefinition.itemCount}. Functions/Steps: ${scopeDefinition.functionCount}. Team ready: ${planning.teamReady}. Proceed with analysis?`,
    title: 'FMEA Scope Review',
    context: {
      runId: ctx.runId,
      fmeaId,
      scopeDetails: scopeDefinition.scopeDetails,
      boundaryDiagram: scopeDefinition.boundaryDiagram,
      files: [...planning.artifacts, ...scopeDefinition.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Structure Analysis
  ctx.log('info', 'Phase 3: Structure Analysis');
  const structureAnalysis = await ctx.task(structureAnalysisTask, {
    fmeaId,
    fmeaType,
    scopeDefinition,
    outputDir
  });

  artifacts.push(...structureAnalysis.artifacts);

  // Phase 4: Function Analysis
  ctx.log('info', 'Phase 4: Function Analysis');
  const functionAnalysis = await ctx.task(functionAnalysisTask, {
    fmeaId,
    fmeaType,
    structureAnalysis,
    outputDir
  });

  artifacts.push(...functionAnalysis.artifacts);

  // Phase 5: Failure Analysis
  ctx.log('info', 'Phase 5: Failure Mode Identification');
  const failureAnalysis = await ctx.task(failureAnalysisTask, {
    fmeaId,
    fmeaType,
    functionAnalysis,
    outputDir
  });

  artifacts.push(...failureAnalysis.artifacts);

  // Phase 6: Risk Analysis
  ctx.log('info', 'Phase 6: Risk Analysis - Severity, Occurrence, Detection');
  const riskAnalysis = await ctx.task(riskAnalysisTask, {
    fmeaId,
    failureAnalysis,
    methodology,
    outputDir
  });

  artifacts.push(...riskAnalysis.artifacts);

  // Quality Gate: Risk Analysis Review
  await ctx.breakpoint({
    question: `Risk analysis complete. Total failure modes: ${failureAnalysis.totalFailureModes}. High RPN (>${rpnThreshold}): ${riskAnalysis.highRpnCount}. High AP items: ${riskAnalysis.highApCount}. Review before action planning?`,
    title: 'FMEA Risk Analysis Review',
    context: {
      runId: ctx.runId,
      fmeaId,
      riskSummary: riskAnalysis.summary,
      highRiskItems: riskAnalysis.highRiskItems,
      files: riskAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Risk Prioritization
  ctx.log('info', 'Phase 7: Risk Prioritization');
  const prioritization = await ctx.task(riskPrioritizationTask, {
    fmeaId,
    riskAnalysis,
    rpnThreshold,
    apThreshold,
    outputDir
  });

  artifacts.push(...prioritization.artifacts);

  // Phase 8: Optimization (Action Planning)
  ctx.log('info', 'Phase 8: Optimization - Action Planning');
  const optimization = await ctx.task(optimizationTask, {
    fmeaId,
    prioritization,
    outputDir
  });

  artifacts.push(...optimization.artifacts);

  // Phase 9: Results Documentation
  ctx.log('info', 'Phase 9: Results Documentation and Effectiveness');
  const resultsDocumentation = await ctx.task(resultsDocumentationTask, {
    fmeaId,
    optimization,
    riskAnalysis,
    outputDir
  });

  artifacts.push(...resultsDocumentation.artifacts);

  // Phase 10: FMEA Report Generation
  ctx.log('info', 'Phase 10: FMEA Report Generation');
  const report = await ctx.task(fmeaReportTask, {
    fmeaId,
    fmeaType,
    scope,
    planning,
    scopeDefinition,
    structureAnalysis,
    functionAnalysis,
    failureAnalysis,
    riskAnalysis,
    prioritization,
    optimization,
    resultsDocumentation,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    fmeaId,
    fmeaType,
    scope,
    fmeaResults: {
      totalFailureModes: failureAnalysis.totalFailureModes,
      totalRpnBefore: riskAnalysis.totalRpn,
      highRpnItems: riskAnalysis.highRpnCount,
      highApItems: riskAnalysis.highApCount,
      actionsAssigned: optimization.totalActions
    },
    highRiskItems: prioritization.prioritizedRisks,
    actions: optimization.actions,
    controls: {
      preventionControls: riskAnalysis.preventionControls,
      detectionControls: riskAnalysis.detectionControls
    },
    artifacts,
    fmeaWorksheetPath: report.worksheetPath,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/fmea-facilitation',
      timestamp: startTime,
      methodology,
      outputDir
    }
  };
}

// Task 1: FMEA Planning
export const fmeaPlanningTask = defineTask('fmea-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `FMEA Planning - ${args.fmeaId}`,
  agent: {
    name: 'fmea-facilitator',
    prompt: {
      role: 'FMEA Facilitator',
      task: 'Plan FMEA session',
      context: args,
      instructions: [
        '1. Form cross-functional FMEA team',
        '2. Define team roles (facilitator, scribe, experts)',
        '3. Schedule FMEA sessions',
        '4. Gather required inputs (drawings, specs, history)',
        '5. Review customer requirements',
        '6. Review historical data (warranty, complaints)',
        '7. Obtain similar FMEAs for reference',
        '8. Prepare FMEA worksheet template',
        '9. Train team on FMEA methodology',
        '10. Document planning details'
      ],
      outputFormat: 'JSON with FMEA planning'
    },
    outputSchema: {
      type: 'object',
      required: ['team', 'teamReady', 'schedule', 'artifacts'],
      properties: {
        team: { type: 'array', items: { type: 'object' } },
        teamReady: { type: 'boolean' },
        schedule: { type: 'object' },
        inputsGathered: { type: 'array', items: { type: 'string' } },
        referenceFmeas: { type: 'array', items: { type: 'string' } },
        worksheetTemplate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'planning']
}));

// Task 2: Scope Definition
export const scopeDefinitionTask = defineTask('fmea-scope', (args, taskCtx) => ({
  kind: 'agent',
  title: `FMEA Scope Definition - ${args.fmeaId}`,
  agent: {
    name: 'scope-analyst',
    prompt: {
      role: 'FMEA Scope Analyst',
      task: 'Define FMEA scope and boundaries',
      context: args,
      instructions: [
        '1. Define focus element (process/product)',
        '2. Create boundary diagram',
        '3. Identify interfaces',
        '4. Define included/excluded items',
        '5. List customer requirements',
        '6. Define analysis depth',
        '7. Identify known issues',
        '8. Define assumptions',
        '9. List constraints',
        '10. Document scope definition'
      ],
      outputFormat: 'JSON with scope definition'
    },
    outputSchema: {
      type: 'object',
      required: ['scopeDetails', 'itemCount', 'functionCount', 'boundaryDiagram', 'artifacts'],
      properties: {
        scopeDetails: { type: 'object' },
        focusElement: { type: 'string' },
        itemCount: { type: 'number' },
        functionCount: { type: 'number' },
        boundaryDiagram: { type: 'object' },
        interfaces: { type: 'array', items: { type: 'object' } },
        customerRequirements: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'scope']
}));

// Task 3: Structure Analysis
export const structureAnalysisTask = defineTask('fmea-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `FMEA Structure Analysis - ${args.fmeaId}`,
  agent: {
    name: 'structure-analyst',
    prompt: {
      role: 'Structure Analysis Specialist',
      task: 'Analyze system/process structure',
      context: args,
      instructions: [
        '1. Create structure tree/block diagram',
        '2. Identify system elements',
        '3. Define element hierarchy',
        '4. Identify next higher level',
        '5. Identify next lower level',
        '6. Map element relationships',
        '7. Identify 4Ms (Man, Machine, Material, Method) for PFMEA',
        '8. Document structure analysis',
        '9. Review with team',
        '10. Finalize structure'
      ],
      outputFormat: 'JSON with structure analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['structureTree', 'elements', 'hierarchy', 'artifacts'],
      properties: {
        structureTree: { type: 'object' },
        elements: { type: 'array', items: { type: 'object' } },
        hierarchy: { type: 'object' },
        nextHigherLevel: { type: 'array', items: { type: 'string' } },
        nextLowerLevel: { type: 'array', items: { type: 'string' } },
        fourMs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'structure']
}));

// Task 4: Function Analysis
export const functionAnalysisTask = defineTask('fmea-function', (args, taskCtx) => ({
  kind: 'agent',
  title: `FMEA Function Analysis - ${args.fmeaId}`,
  agent: {
    name: 'function-analyst',
    prompt: {
      role: 'Function Analysis Specialist',
      task: 'Analyze functions and requirements',
      context: args,
      instructions: [
        '1. Identify functions for each element',
        '2. Use verb-noun format for functions',
        '3. Link functions to customer requirements',
        '4. Define function characteristics',
        '5. Create function network/tree',
        '6. Identify function interactions',
        '7. Document function requirements',
        '8. Review function completeness',
        '9. Validate with specifications',
        '10. Document function analysis'
      ],
      outputFormat: 'JSON with function analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['functions', 'functionNetwork', 'artifacts'],
      properties: {
        functions: { type: 'array', items: { type: 'object' } },
        functionNetwork: { type: 'object' },
        functionRequirements: { type: 'array', items: { type: 'object' } },
        characteristicsMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'function']
}));

// Task 5: Failure Analysis
export const failureAnalysisTask = defineTask('fmea-failure', (args, taskCtx) => ({
  kind: 'agent',
  title: `FMEA Failure Analysis - ${args.fmeaId}`,
  agent: {
    name: 'failure-analyst',
    prompt: {
      role: 'Failure Mode Analyst',
      task: 'Identify and analyze failure modes',
      context: args,
      instructions: [
        '1. Identify potential failure modes for each function',
        '2. Consider how function can fail (no, partial, degraded, intermittent, unintended)',
        '3. Identify failure effects at local level',
        '4. Identify failure effects at higher level',
        '5. Identify failure effects at customer/end user',
        '6. Identify potential causes for each failure mode',
        '7. Link causes to 4Ms',
        '8. Create failure chain (cause-FM-effect)',
        '9. Review historical failures',
        '10. Document failure analysis'
      ],
      outputFormat: 'JSON with failure analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['failureModes', 'totalFailureModes', 'failureChains', 'artifacts'],
      properties: {
        failureModes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              function: { type: 'string' },
              failureMode: { type: 'string' },
              localEffect: { type: 'string' },
              higherEffect: { type: 'string' },
              endEffect: { type: 'string' },
              causes: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        totalFailureModes: { type: 'number' },
        failureChains: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'failure']
}));

// Task 6: Risk Analysis
export const riskAnalysisTask = defineTask('fmea-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: `FMEA Risk Analysis - ${args.fmeaId}`,
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'FMEA Risk Analyst',
      task: 'Rate severity, occurrence, and detection',
      context: args,
      instructions: [
        '1. Rate Severity (S) for each effect (1-10 scale)',
        '2. Identify current prevention controls',
        '3. Rate Occurrence (O) based on cause frequency (1-10)',
        '4. Identify current detection controls',
        '5. Rate Detection (D) ability to detect (1-10)',
        '6. Calculate RPN (S x O x D)',
        '7. Calculate AP (Action Priority) per AIAG-VDA',
        '8. Document rating rationale',
        '9. Validate ratings with team',
        '10. Summarize risk analysis'
      ],
      outputFormat: 'JSON with risk analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['riskRatings', 'totalRpn', 'highRpnCount', 'highApCount', 'summary', 'artifacts'],
      properties: {
        riskRatings: { type: 'array', items: { type: 'object' } },
        totalRpn: { type: 'number' },
        averageRpn: { type: 'number' },
        highRpnCount: { type: 'number' },
        highApCount: { type: 'number' },
        preventionControls: { type: 'array', items: { type: 'object' } },
        detectionControls: { type: 'array', items: { type: 'object' } },
        highRiskItems: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'risk-analysis']
}));

// Task 7: Risk Prioritization
export const riskPrioritizationTask = defineTask('fmea-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `FMEA Risk Prioritization - ${args.fmeaId}`,
  agent: {
    name: 'prioritization-analyst',
    prompt: {
      role: 'Risk Prioritization Specialist',
      task: 'Prioritize risks for action',
      context: args,
      instructions: [
        '1. Sort by AP (Action Priority) - H, M, L',
        '2. Sort by RPN descending',
        '3. Apply severity threshold (S >= 9 gets priority)',
        '4. Apply RPN threshold',
        '5. Consider customer-identified risks',
        '6. Consider regulatory requirements',
        '7. Create Pareto of risks',
        '8. Identify top priority items',
        '9. Create prioritized action list',
        '10. Document prioritization'
      ],
      outputFormat: 'JSON with prioritization results'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedRisks', 'topPriorityItems', 'paretoAnalysis', 'artifacts'],
      properties: {
        prioritizedRisks: { type: 'array', items: { type: 'object' } },
        topPriorityItems: { type: 'array', items: { type: 'object' } },
        highApItems: { type: 'array', items: { type: 'object' } },
        highSeverityItems: { type: 'array', items: { type: 'object' } },
        paretoAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'prioritization']
}));

// Task 8: Optimization
export const optimizationTask = defineTask('fmea-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `FMEA Optimization - ${args.fmeaId}`,
  agent: {
    name: 'optimization-planner',
    prompt: {
      role: 'FMEA Optimization Specialist',
      task: 'Develop recommended actions',
      context: args,
      instructions: [
        '1. Develop prevention actions to reduce O',
        '2. Develop detection actions to improve D',
        '3. Consider design changes for S reduction',
        '4. Use hierarchy: eliminate > substitute > engineer > admin',
        '5. Assign responsible person',
        '6. Set target completion date',
        '7. Define action status tracking',
        '8. Estimate expected risk reduction',
        '9. Plan effectiveness verification',
        '10. Document recommended actions'
      ],
      outputFormat: 'JSON with optimization actions'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'totalActions', 'expectedRpnReduction', 'artifacts'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              failureModeId: { type: 'string' },
              actionType: { type: 'string' },
              action: { type: 'string' },
              responsible: { type: 'string' },
              targetDate: { type: 'string' },
              expectedS: { type: 'number' },
              expectedO: { type: 'number' },
              expectedD: { type: 'number' },
              expectedRpn: { type: 'number' }
            }
          }
        },
        totalActions: { type: 'number' },
        preventionActions: { type: 'number' },
        detectionActions: { type: 'number' },
        expectedRpnReduction: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'optimization']
}));

// Task 9: Results Documentation
export const resultsDocumentationTask = defineTask('fmea-results', (args, taskCtx) => ({
  kind: 'agent',
  title: `FMEA Results Documentation - ${args.fmeaId}`,
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'FMEA Documentation Specialist',
      task: 'Document action results and effectiveness',
      context: args,
      instructions: [
        '1. Track action implementation status',
        '2. Document actions taken',
        '3. Re-rate S, O, D after actions',
        '4. Calculate revised RPN',
        '5. Calculate revised AP',
        '6. Compare before/after RPN',
        '7. Verify effectiveness',
        '8. Document lessons learned',
        '9. Update control plan',
        '10. Archive FMEA documentation'
      ],
      outputFormat: 'JSON with results documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['actionResults', 'revisedRatings', 'rpnComparison', 'artifacts'],
      properties: {
        actionResults: { type: 'array', items: { type: 'object' } },
        revisedRatings: { type: 'array', items: { type: 'object' } },
        rpnComparison: {
          type: 'object',
          properties: {
            totalBefore: { type: 'number' },
            totalAfter: { type: 'number' },
            reduction: { type: 'number' }
          }
        },
        effectivenessVerified: { type: 'boolean' },
        controlPlanUpdates: { type: 'array', items: { type: 'object' } },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'results']
}));

// Task 10: FMEA Report
export const fmeaReportTask = defineTask('fmea-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `FMEA Report - ${args.fmeaId}`,
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate comprehensive FMEA report',
      context: args,
      instructions: [
        '1. Generate FMEA worksheet (standard format)',
        '2. Write executive summary',
        '3. Document scope and methodology',
        '4. Present high-risk items',
        '5. Summarize actions taken',
        '6. Present risk reduction results',
        '7. Document control plan updates',
        '8. Include Pareto charts',
        '9. Document team and sign-offs',
        '10. Format professionally'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['worksheetPath', 'reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        worksheetPath: { type: 'string' },
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'reporting']
}));
