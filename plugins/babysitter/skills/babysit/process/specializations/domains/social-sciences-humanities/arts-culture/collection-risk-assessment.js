/**
 * @process arts-culture/collection-risk-assessment
 * @description Framework for identifying, evaluating, and mitigating risks to cultural collections including natural disasters, theft, environmental damage, and deterioration
 * @inputs { collectionName: string, institutionType: string, facilityInfo: object, collectionValue: object }
 * @outputs { success: boolean, riskAssessment: object, mitigationPlan: object, prioritization: array, artifacts: array }
 * @recommendedSkills SK-AC-011 (risk-mitigation-planning), SK-AC-006 (conservation-assessment)
 * @recommendedAgents AG-AC-004 (conservator-agent), AG-AC-006 (registrar-agent), AG-AC-002 (arts-administrator-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    collectionName,
    institutionType = 'museum',
    facilityInfo = {},
    collectionValue = {},
    geographicRisks = [],
    outputDir = 'collection-risk-assessment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Risk Context Analysis
  ctx.log('info', 'Analyzing risk context and environment');
  const riskContext = await ctx.task(riskContextTask, {
    collectionName,
    institutionType,
    facilityInfo,
    geographicRisks,
    outputDir
  });

  if (!riskContext.success) {
    return {
      success: false,
      error: 'Risk context analysis failed',
      details: riskContext,
      metadata: { processId: 'arts-culture/collection-risk-assessment', timestamp: startTime }
    };
  }

  artifacts.push(...riskContext.artifacts);

  // Task 2: Natural Disaster Risk Assessment
  ctx.log('info', 'Assessing natural disaster risks');
  const naturalDisasterRisks = await ctx.task(naturalDisasterTask, {
    facilityInfo,
    geographicRisks,
    collectionName,
    outputDir
  });

  artifacts.push(...naturalDisasterRisks.artifacts);

  // Task 3: Security Risk Assessment
  ctx.log('info', 'Assessing security and theft risks');
  const securityRisks = await ctx.task(securityRiskTask, {
    collectionName,
    collectionValue,
    facilityInfo,
    institutionType,
    outputDir
  });

  artifacts.push(...securityRisks.artifacts);

  // Task 4: Environmental Risk Assessment
  ctx.log('info', 'Assessing environmental risks');
  const environmentalRisks = await ctx.task(environmentalRiskTask, {
    collectionName,
    facilityInfo,
    outputDir
  });

  artifacts.push(...environmentalRisks.artifacts);

  // Task 5: Deterioration Risk Assessment
  ctx.log('info', 'Assessing deterioration and inherent vice risks');
  const deteriorationRisks = await ctx.task(deteriorationRiskTask, {
    collectionName,
    collectionValue,
    outputDir
  });

  artifacts.push(...deteriorationRisks.artifacts);

  // Task 6: Human Factor Risk Assessment
  ctx.log('info', 'Assessing human factor risks');
  const humanFactorRisks = await ctx.task(humanFactorRiskTask, {
    collectionName,
    institutionType,
    facilityInfo,
    outputDir
  });

  artifacts.push(...humanFactorRisks.artifacts);

  // Breakpoint: Review risk assessment
  await ctx.breakpoint({
    question: `Risk assessment for "${collectionName}" complete. Multiple risk categories evaluated. Review and prioritize risks?`,
    title: 'Collection Risk Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        collectionName,
        institutionType,
        naturalDisasterRiskCount: naturalDisasterRisks.risks.length,
        securityRiskCount: securityRisks.risks.length,
        environmentalRiskCount: environmentalRisks.risks.length
      }
    }
  });

  // Task 7: Risk Prioritization and Scoring
  ctx.log('info', 'Prioritizing and scoring identified risks');
  const riskPrioritization = await ctx.task(riskPrioritizationTask, {
    naturalDisasterRisks,
    securityRisks,
    environmentalRisks,
    deteriorationRisks,
    humanFactorRisks,
    collectionValue,
    outputDir
  });

  artifacts.push(...riskPrioritization.artifacts);

  // Task 8: Mitigation Planning
  ctx.log('info', 'Developing risk mitigation strategies');
  const mitigationPlan = await ctx.task(mitigationPlanTask, {
    prioritizedRisks: riskPrioritization.prioritizedRisks,
    facilityInfo,
    collectionValue,
    outputDir
  });

  artifacts.push(...mitigationPlan.artifacts);

  // Task 9: Risk Assessment Report
  ctx.log('info', 'Generating comprehensive risk assessment report');
  const riskReport = await ctx.task(riskReportTask, {
    collectionName,
    riskContext,
    naturalDisasterRisks,
    securityRisks,
    environmentalRisks,
    deteriorationRisks,
    humanFactorRisks,
    riskPrioritization,
    mitigationPlan,
    outputDir
  });

  artifacts.push(...riskReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    riskAssessment: {
      context: riskContext.context,
      naturalDisasters: naturalDisasterRisks.risks,
      security: securityRisks.risks,
      environmental: environmentalRisks.risks,
      deterioration: deteriorationRisks.risks,
      humanFactors: humanFactorRisks.risks
    },
    mitigationPlan: {
      strategies: mitigationPlan.strategies,
      timeline: mitigationPlan.timeline,
      budget: mitigationPlan.budgetEstimate
    },
    prioritization: riskPrioritization.prioritizedRisks,
    riskMatrix: riskPrioritization.riskMatrix,
    report: riskReport.report,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/collection-risk-assessment',
      timestamp: startTime,
      collectionName
    }
  };
}

// Task 1: Risk Context
export const riskContextTask = defineTask('risk-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze risk context',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'collection risk analyst',
      task: 'Analyze risk context and institutional environment',
      context: args,
      instructions: [
        'Document institutional mission and priorities',
        'Assess collection significance and values',
        'Review existing risk management policies',
        'Document building and facility characteristics',
        'Identify stakeholders and responsibilities',
        'Review insurance coverage and requirements',
        'Document geographic and regional factors',
        'Establish risk tolerance thresholds'
      ],
      outputFormat: 'JSON with success, context, stakeholders, baseline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'context', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        context: {
          type: 'object',
          properties: {
            institution: { type: 'object' },
            collection: { type: 'object' },
            facility: { type: 'object' },
            policies: { type: 'array' }
          }
        },
        stakeholders: { type: 'array' },
        baseline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'risk-assessment', 'context', 'analysis']
}));

// Task 2: Natural Disaster Risks
export const naturalDisasterTask = defineTask('natural-disaster-risks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess natural disaster risks',
  agent: {
    name: 'disaster-risk-specialist',
    prompt: {
      role: 'natural disaster risk specialist',
      task: 'Assess natural disaster risks to collection',
      context: args,
      instructions: [
        'Evaluate flood risk and history',
        'Assess earthquake vulnerability',
        'Evaluate fire risk (wildfire, structural)',
        'Assess severe weather risks (tornado, hurricane)',
        'Evaluate climate change impacts',
        'Review building resilience',
        'Assess emergency response capabilities',
        'Document regional disaster history'
      ],
      outputFormat: 'JSON with risks, vulnerabilities, likelihood, impact, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'artifacts'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              likelihood: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        vulnerabilities: { type: 'array' },
        likelihood: { type: 'object' },
        impact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'risk-assessment', 'natural-disaster', 'hazard']
}));

// Task 3: Security Risks
export const securityRiskTask = defineTask('security-risks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess security risks',
  agent: {
    name: 'security-risk-specialist',
    prompt: {
      role: 'museum security specialist',
      task: 'Assess security and theft risks to collection',
      context: args,
      instructions: [
        'Evaluate theft risk by collection type',
        'Assess vandalism vulnerability',
        'Review access control systems',
        'Evaluate surveillance coverage',
        'Assess visitor management',
        'Review staff vetting procedures',
        'Evaluate after-hours security',
        'Assess cyber security for digital collections'
      ],
      outputFormat: 'JSON with risks, vulnerabilities, controls, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'artifacts'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              target: { type: 'string' },
              likelihood: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        vulnerabilities: { type: 'array' },
        controls: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'risk-assessment', 'security', 'theft']
}));

// Task 4: Environmental Risks
export const environmentalRiskTask = defineTask('environmental-risks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess environmental risks',
  agent: {
    name: 'environmental-risk-specialist',
    prompt: {
      role: 'conservation environmental specialist',
      task: 'Assess environmental risks to collection',
      context: args,
      instructions: [
        'Evaluate temperature fluctuation risks',
        'Assess humidity control adequacy',
        'Evaluate light exposure risks',
        'Assess air quality and pollution',
        'Evaluate water damage risks (leaks, condensation)',
        'Assess pest and biological risks',
        'Review HVAC system reliability',
        'Evaluate microclimates in storage/display'
      ],
      outputFormat: 'JSON with risks, conditions, vulnerabilities, monitoring, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'artifacts'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              source: { type: 'string' },
              likelihood: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        conditions: { type: 'object' },
        vulnerabilities: { type: 'array' },
        monitoring: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'risk-assessment', 'environmental', 'conservation']
}));

// Task 5: Deterioration Risks
export const deteriorationRiskTask = defineTask('deterioration-risks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess deterioration risks',
  agent: {
    name: 'deterioration-specialist',
    prompt: {
      role: 'conservation deterioration specialist',
      task: 'Assess inherent vice and deterioration risks',
      context: args,
      instructions: [
        'Identify inherent vice by material type',
        'Assess acidic materials deterioration',
        'Evaluate photographic materials risks',
        'Assess plastics and modern materials',
        'Evaluate organic materials degradation',
        'Assess metal corrosion risks',
        'Review condition backlog',
        'Identify priority conservation needs'
      ],
      outputFormat: 'JSON with risks, materialRisks, priorities, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'artifacts'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              material: { type: 'string' },
              riskType: { type: 'string' },
              rate: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        materialRisks: { type: 'object' },
        priorities: { type: 'array' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'risk-assessment', 'deterioration', 'inherent-vice']
}));

// Task 6: Human Factor Risks
export const humanFactorRiskTask = defineTask('human-factor-risks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess human factor risks',
  agent: {
    name: 'human-factors-specialist',
    prompt: {
      role: 'museum operations specialist',
      task: 'Assess human factor risks to collection',
      context: args,
      instructions: [
        'Evaluate handling damage risks',
        'Assess installation/deinstallation risks',
        'Review staff training adequacy',
        'Evaluate contractor supervision',
        'Assess visitor interaction risks',
        'Review documentation and tracking gaps',
        'Evaluate emergency preparedness',
        'Assess succession planning for expertise'
      ],
      outputFormat: 'JSON with risks, training, procedures, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'artifacts'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              source: { type: 'string' },
              likelihood: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        training: { type: 'object' },
        procedures: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'risk-assessment', 'human-factors', 'operations']
}));

// Task 7: Risk Prioritization
export const riskPrioritizationTask = defineTask('risk-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize and score risks',
  agent: {
    name: 'risk-prioritization-specialist',
    prompt: {
      role: 'risk prioritization specialist',
      task: 'Prioritize and score all identified risks',
      context: args,
      instructions: [
        'Apply consistent risk scoring methodology',
        'Calculate magnitude of risk (MR) scores',
        'Create risk matrix visualization',
        'Rank risks by priority',
        'Group risks by urgency level',
        'Identify quick wins and low-hanging fruit',
        'Identify critical high-priority risks',
        'Create prioritized risk register'
      ],
      outputFormat: 'JSON with prioritizedRisks, riskMatrix, scores, register, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedRisks', 'riskMatrix', 'artifacts'],
      properties: {
        prioritizedRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              score: { type: 'number' },
              priority: { type: 'string' },
              urgency: { type: 'string' }
            }
          }
        },
        riskMatrix: { type: 'object' },
        scores: { type: 'object' },
        register: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'risk-assessment', 'prioritization', 'scoring']
}));

// Task 8: Mitigation Planning
export const mitigationPlanTask = defineTask('mitigation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop mitigation strategies',
  agent: {
    name: 'mitigation-planner',
    prompt: {
      role: 'risk mitigation planner',
      task: 'Develop risk mitigation strategies and implementation plan',
      context: args,
      instructions: [
        'Develop mitigation strategies by risk type',
        'Apply avoid/reduce/transfer/accept framework',
        'Estimate mitigation costs',
        'Create implementation timeline',
        'Identify resource requirements',
        'Plan monitoring and review',
        'Define success metrics',
        'Create action plans by priority'
      ],
      outputFormat: 'JSON with strategies, timeline, budgetEstimate, actions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              strategy: { type: 'string' },
              approach: { type: 'string' },
              cost: { type: 'number' }
            }
          }
        },
        timeline: { type: 'object' },
        budgetEstimate: { type: 'number' },
        actions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'risk-assessment', 'mitigation', 'planning']
}));

// Task 9: Risk Assessment Report
export const riskReportTask = defineTask('risk-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate risk assessment report',
  agent: {
    name: 'risk-report-writer',
    prompt: {
      role: 'risk assessment report writer',
      task: 'Generate comprehensive risk assessment report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document methodology used',
        'Present risk findings by category',
        'Include risk matrix and visualizations',
        'Present prioritized risk register',
        'Document mitigation recommendations',
        'Include implementation roadmap',
        'Create board-ready presentation'
      ],
      outputFormat: 'JSON with report, summary, recommendations, presentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'artifacts'],
      properties: {
        report: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            methodology: { type: 'string' },
            findings: { type: 'object' },
            recommendations: { type: 'array' }
          }
        },
        summary: { type: 'string' },
        recommendations: { type: 'array' },
        presentation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'risk-assessment', 'report', 'documentation']
}));
