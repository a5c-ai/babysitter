/**
 * @process chemical-engineering/hazop-study
 * @description Conduct systematic Hazard and Operability studies for new and modified processes with proper documentation
 * @inputs { processName: string, pidDrawings: array, processDescription: object, studyScope: object, outputDir: string }
 * @outputs { success: boolean, hazopReport: object, actionItems: array, riskRegister: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    pidDrawings,
    processDescription,
    studyScope,
    teamMembers = [],
    outputDir = 'hazop-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Define Study Scope and Objectives
  ctx.log('info', 'Starting HAZOP study: Defining scope and objectives');
  const scopeResult = await ctx.task(scopeDefinitionTask, {
    processName,
    studyScope,
    processDescription,
    outputDir
  });

  if (!scopeResult.success) {
    return {
      success: false,
      error: 'HAZOP scope definition failed',
      details: scopeResult,
      metadata: { processId: 'chemical-engineering/hazop-study', timestamp: startTime }
    };
  }

  artifacts.push(...scopeResult.artifacts);

  // Task 2: Assemble Multi-Disciplinary Team
  ctx.log('info', 'Assembling HAZOP team');
  const teamResult = await ctx.task(teamAssemblyTask, {
    processName,
    studyScope: scopeResult.studyScope,
    teamMembers,
    outputDir
  });

  artifacts.push(...teamResult.artifacts);

  // Task 3: Review P&IDs Systematically
  ctx.log('info', 'Reviewing P&IDs and identifying nodes');
  const nodeIdentificationResult = await ctx.task(nodeIdentificationTask, {
    processName,
    pidDrawings,
    studyScope: scopeResult.studyScope,
    outputDir
  });

  artifacts.push(...nodeIdentificationResult.artifacts);

  // Task 4: Apply Guidewords and Identify Deviations
  ctx.log('info', 'Applying guidewords and identifying deviations');
  const deviationResult = await ctx.task(deviationAnalysisTask, {
    processName,
    nodes: nodeIdentificationResult.nodes,
    processDescription,
    outputDir
  });

  artifacts.push(...deviationResult.artifacts);

  // Task 5: Evaluate Causes and Consequences
  ctx.log('info', 'Evaluating causes and consequences');
  const causesConsequencesResult = await ctx.task(causesConsequencesTask, {
    processName,
    deviations: deviationResult.deviations,
    processDescription,
    outputDir
  });

  artifacts.push(...causesConsequencesResult.artifacts);

  // Breakpoint: Review HAZOP findings
  await ctx.breakpoint({
    question: `HAZOP analysis in progress for ${processName}. Nodes analyzed: ${nodeIdentificationResult.nodes.length}. Deviations identified: ${deviationResult.deviations.length}. High-risk scenarios: ${causesConsequencesResult.highRiskCount}. Review findings?`,
    title: 'HAZOP Study Progress Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        nodesAnalyzed: nodeIdentificationResult.nodes.length,
        deviationsIdentified: deviationResult.deviations.length,
        highRiskScenarios: causesConsequencesResult.highRiskCount,
        safeguardsIdentified: causesConsequencesResult.existingSafeguards.length
      }
    }
  });

  // Task 6: Evaluate Existing Safeguards
  ctx.log('info', 'Evaluating existing safeguards');
  const safeguardsResult = await ctx.task(safeguardsEvaluationTask, {
    processName,
    scenarios: causesConsequencesResult.scenarios,
    pidDrawings,
    outputDir
  });

  artifacts.push(...safeguardsResult.artifacts);

  // Task 7: Recommend Additional Safeguards
  ctx.log('info', 'Recommending additional safeguards');
  const recommendationsResult = await ctx.task(safeguardRecommendationsTask, {
    processName,
    scenarios: causesConsequencesResult.scenarios,
    existingSafeguards: safeguardsResult.safeguards,
    gaps: safeguardsResult.gaps,
    outputDir
  });

  artifacts.push(...recommendationsResult.artifacts);

  // Task 8: Document Findings and Actions
  ctx.log('info', 'Documenting HAZOP findings and actions');
  const documentationResult = await ctx.task(hazopDocumentationTask, {
    processName,
    studyScope: scopeResult.studyScope,
    team: teamResult.team,
    nodes: nodeIdentificationResult.nodes,
    scenarios: causesConsequencesResult.scenarios,
    safeguards: safeguardsResult.safeguards,
    recommendations: recommendationsResult.recommendations,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    hazopReport: {
      reportPath: documentationResult.reportPath,
      nodesAnalyzed: nodeIdentificationResult.nodes.length,
      deviationsIdentified: deviationResult.deviations.length,
      scenariosEvaluated: causesConsequencesResult.scenarios.length
    },
    actionItems: recommendationsResult.actionItems,
    riskRegister: documentationResult.riskRegister,
    recommendations: recommendationsResult.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/hazop-study',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Scope Definition
export const scopeDefinitionTask = defineTask('scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define HAZOP study scope and objectives',
  agent: {
    name: 'hazop-leader',
    prompt: {
      role: 'HAZOP study facilitator',
      task: 'Define the scope and objectives for the HAZOP study',
      context: args,
      instructions: [
        'Define study boundaries (battery limits)',
        'Identify systems included and excluded',
        'Define study objectives (new design, MOC, revalidation)',
        'Identify applicable standards (IEC 61882, etc.)',
        'Define risk assessment criteria',
        'Set study schedule and milestones',
        'Identify required documentation',
        'Document study scope and charter'
      ],
      outputFormat: 'JSON with study scope, objectives, boundaries, schedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'studyScope', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        studyScope: {
          type: 'object',
          properties: {
            boundaries: { type: 'object' },
            objectives: { type: 'array' },
            inclusions: { type: 'array' },
            exclusions: { type: 'array' },
            standards: { type: 'array' }
          }
        },
        schedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'hazop', 'scope']
}));

// Task 2: Team Assembly
export const teamAssemblyTask = defineTask('team-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble multi-disciplinary HAZOP team',
  agent: {
    name: 'hazop-leader',
    prompt: {
      role: 'HAZOP team coordinator',
      task: 'Assemble and prepare multi-disciplinary HAZOP team',
      context: args,
      instructions: [
        'Identify required disciplines (process, operations, safety, etc.)',
        'Define roles (facilitator, scribe, SMEs)',
        'Ensure adequate process knowledge representation',
        'Schedule team availability',
        'Prepare team briefing materials',
        'Define team ground rules',
        'Plan team logistics',
        'Document team composition and roles'
      ],
      outputFormat: 'JSON with team composition, roles, preparation materials, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'team', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        team: {
          type: 'object',
          properties: {
            facilitator: { type: 'string' },
            scribe: { type: 'string' },
            members: { type: 'array' },
            disciplines: { type: 'array' }
          }
        },
        preparation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'hazop', 'team']
}));

// Task 3: Node Identification
export const nodeIdentificationTask = defineTask('node-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review P&IDs and identify study nodes',
  agent: {
    name: 'hazop-leader',
    prompt: {
      role: 'P&ID analyst',
      task: 'Identify study nodes from P&ID review',
      context: args,
      instructions: [
        'Review all P&IDs within scope',
        'Divide system into logical study nodes',
        'Define node boundaries clearly',
        'Identify design intent for each node',
        'Note operating conditions per node',
        'Identify interconnections between nodes',
        'Prioritize nodes by risk potential',
        'Document node breakdown structure'
      ],
      outputFormat: 'JSON with node list, boundaries, design intent, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'nodes', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              boundaries: { type: 'object' },
              designIntent: { type: 'string' },
              operatingConditions: { type: 'object' }
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
  labels: ['agent', 'chemical-engineering', 'hazop', 'nodes']
}));

// Task 4: Deviation Analysis
export const deviationAnalysisTask = defineTask('deviation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply guidewords and identify deviations',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'HAZOP deviation analyst',
      task: 'Apply guidewords systematically to identify deviations',
      context: args,
      instructions: [
        'Apply standard guidewords (No, More, Less, Part of, etc.)',
        'Apply guidewords to process parameters (flow, pressure, temperature, etc.)',
        'Identify meaningful deviations for each node',
        'Consider operating phase deviations (startup, shutdown)',
        'Document all identified deviations',
        'Note non-applicable guideword combinations',
        'Link deviations to design intent',
        'Create deviation register'
      ],
      outputFormat: 'JSON with deviations per node, guideword matrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deviations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        deviations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nodeId: { type: 'string' },
              guideword: { type: 'string' },
              parameter: { type: 'string' },
              deviation: { type: 'string' }
            }
          }
        },
        guidewordMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'hazop', 'deviations']
}));

// Task 5: Causes and Consequences
export const causesConsequencesTask = defineTask('causes-consequences', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate causes and consequences of deviations',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'HAZOP risk analyst',
      task: 'Identify causes and consequences for each deviation',
      context: args,
      instructions: [
        'Identify credible causes for each deviation',
        'Determine consequences of each deviation',
        'Assess severity of consequences',
        'Estimate likelihood of causes',
        'Identify potential escalation scenarios',
        'Note existing safeguards',
        'Flag high-risk scenarios',
        'Create cause-consequence mapping'
      ],
      outputFormat: 'JSON with scenarios, causes, consequences, risk ratings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scenarios', 'highRiskCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              deviationId: { type: 'string' },
              causes: { type: 'array' },
              consequences: { type: 'array' },
              severity: { type: 'string' },
              likelihood: { type: 'string' },
              riskRating: { type: 'string' }
            }
          }
        },
        highRiskCount: { type: 'number' },
        existingSafeguards: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'hazop', 'causes-consequences']
}));

// Task 6: Safeguards Evaluation
export const safeguardsEvaluationTask = defineTask('safeguards-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate existing safeguards',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'process safety engineer',
      task: 'Evaluate adequacy of existing safeguards',
      context: args,
      instructions: [
        'Identify all existing safeguards per scenario',
        'Classify safeguards (preventive, mitigative)',
        'Assess safeguard independence',
        'Evaluate safeguard reliability',
        'Identify protection layers (LOPA basis)',
        'Assess residual risk with safeguards',
        'Identify safeguard gaps',
        'Document safeguard assessment'
      ],
      outputFormat: 'JSON with safeguards list, assessment, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'safeguards', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        safeguards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioId: { type: 'string' },
              safeguard: { type: 'string' },
              type: { type: 'string' },
              reliability: { type: 'string' }
            }
          }
        },
        gaps: { type: 'array' },
        residualRisks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'hazop', 'safeguards']
}));

// Task 7: Safeguard Recommendations
export const safeguardRecommendationsTask = defineTask('safeguard-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Recommend additional safeguards',
  agent: {
    name: 'hazop-leader',
    prompt: {
      role: 'safety recommendations engineer',
      task: 'Recommend additional safeguards to close gaps',
      context: args,
      instructions: [
        'Address all identified safeguard gaps',
        'Prioritize recommendations by risk reduction',
        'Consider hierarchy of controls',
        'Recommend design changes where appropriate',
        'Recommend procedural controls',
        'Recommend SIS requirements',
        'Assign responsibility and target dates',
        'Create actionable recommendations'
      ],
      outputFormat: 'JSON with recommendations, action items, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'recommendations', 'actionItems', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              scenarioId: { type: 'string' },
              recommendation: { type: 'string' },
              type: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              action: { type: 'string' },
              responsible: { type: 'string' },
              targetDate: { type: 'string' },
              status: { type: 'string' }
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
  labels: ['agent', 'chemical-engineering', 'hazop', 'recommendations']
}));

// Task 8: HAZOP Documentation
export const hazopDocumentationTask = defineTask('hazop-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document HAZOP findings and create report',
  agent: {
    name: 'hazop-leader',
    prompt: {
      role: 'HAZOP documentation engineer',
      task: 'Create comprehensive HAZOP study documentation',
      context: args,
      instructions: [
        'Compile complete HAZOP worksheets',
        'Create executive summary',
        'Document all scenarios and risk ratings',
        'Include action item register',
        'Update risk register',
        'Create P&ID markup with safeguards',
        'Document study attendance and sign-off',
        'Generate final HAZOP report'
      ],
      outputFormat: 'JSON with report path, risk register, documentation package, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'riskRegister', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string' },
        riskRegister: {
          type: 'object',
          properties: {
            highRisks: { type: 'array' },
            mediumRisks: { type: 'array' },
            lowRisks: { type: 'array' }
          }
        },
        documentationPackage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'hazop', 'documentation']
}));
