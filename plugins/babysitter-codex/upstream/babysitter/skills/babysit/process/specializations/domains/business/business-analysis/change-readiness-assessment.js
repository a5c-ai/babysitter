/**
 * @process ba-change-readiness-assessment
 * @description Comprehensive change readiness assessment process using Prosci ADKAR framework
 * and organizational change management best practices to evaluate organizational preparedness.
 * @inputs {
 *   changeContext: { changeDescription: string, scope: string, timeline: string },
 *   organization: { structure: object, culture: object, history: object },
 *   stakeholderGroups: object[],
 *   currentState: { systems: object, processes: object, capabilities: object },
 *   assessmentScope: { areas: string[], depth: string }
 * }
 * @outputs {
 *   readinessAssessment: object,
 *   adkarAnalysis: object,
 *   gapAnalysis: object,
 *   riskAssessment: object,
 *   readinessScorecard: object,
 *   recommendations: object[]
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Task definitions
export const organizationalContextTask = defineTask('organizational-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Organizational Context',
  agent: {
    name: 'organizational-analyst',
    prompt: {
      role: 'Organizational Development Specialist',
      task: 'Analyze organizational context including culture, history, and change capacity',
      context: args,
      instructions: [
        'Assess organizational culture and values',
        'Review change history and past initiatives',
        'Evaluate leadership commitment',
        'Assess organizational structure impacts',
        'Identify cultural enablers and barriers',
        'Review communication patterns',
        'Assess decision-making processes',
        'Evaluate current change saturation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        culturalAssessment: {
          type: 'object',
          properties: {
            coreValues: { type: 'array', items: { type: 'string' } },
            changeOrientation: { type: 'string' },
            riskTolerance: { type: 'string' },
            collaborationStyle: { type: 'string' }
          }
        },
        changeHistory: {
          type: 'object',
          properties: {
            recentChanges: { type: 'array', items: { type: 'object' } },
            successRate: { type: 'string' },
            lessonsLearned: { type: 'array', items: { type: 'string' } },
            changeFatigue: { type: 'string' }
          }
        },
        leadershipReadiness: {
          type: 'object',
          properties: {
            sponsorCommitment: { type: 'string' },
            leaderAlignment: { type: 'string' },
            changeChampions: { type: 'array', items: { type: 'string' } }
          }
        },
        changeSaturation: { type: 'object' }
      },
      required: ['culturalAssessment', 'changeHistory', 'leadershipReadiness']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const adkarAssessmentTask = defineTask('adkar-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct ADKAR Assessment',
  agent: {
    name: 'adkar-assessor',
    prompt: {
      role: 'Prosci Certified Change Practitioner',
      task: 'Assess organizational readiness using ADKAR model across stakeholder groups',
      context: args,
      instructions: [
        'Assess Awareness of need for change',
        'Evaluate Desire to participate and support',
        'Assess Knowledge of how to change',
        'Evaluate Ability to implement change',
        'Assess Reinforcement mechanisms',
        'Identify barrier points by group',
        'Calculate ADKAR scores',
        'Identify priority intervention areas'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        adkarAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholderGroup: { type: 'string' },
              awareness: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  indicators: { type: 'array', items: { type: 'string' } },
                  gaps: { type: 'array', items: { type: 'string' } }
                }
              },
              desire: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  indicators: { type: 'array', items: { type: 'string' } },
                  gaps: { type: 'array', items: { type: 'string' } }
                }
              },
              knowledge: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  indicators: { type: 'array', items: { type: 'string' } },
                  gaps: { type: 'array', items: { type: 'string' } }
                }
              },
              ability: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  indicators: { type: 'array', items: { type: 'string' } },
                  gaps: { type: 'array', items: { type: 'string' } }
                }
              },
              reinforcement: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  indicators: { type: 'array', items: { type: 'string' } },
                  gaps: { type: 'array', items: { type: 'string' } }
                }
              },
              overallScore: { type: 'number' },
              barrierPoint: { type: 'string' }
            }
          }
        },
        organizationADKAR: { type: 'object' },
        priorityInterventions: { type: 'array', items: { type: 'object' } }
      },
      required: ['adkarAnalysis', 'organizationADKAR']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const capabilityAssessmentTask = defineTask('capability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Organizational Capabilities',
  agent: {
    name: 'capability-assessor',
    prompt: {
      role: 'Capability Assessment Specialist',
      task: 'Assess organizational capabilities required for successful change implementation',
      context: args,
      instructions: [
        'Identify required capabilities for change',
        'Assess current capability levels',
        'Evaluate resource availability',
        'Assess technical readiness',
        'Evaluate process readiness',
        'Assess skills and competencies',
        'Identify capability gaps',
        'Estimate capability build time'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        capabilityAssessment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              capability: { type: 'string' },
              category: { type: 'string' },
              requiredLevel: { type: 'string' },
              currentLevel: { type: 'string' },
              gap: { type: 'string' },
              buildTime: { type: 'string' },
              criticality: { type: 'string' }
            }
          }
        },
        resourceAssessment: {
          type: 'object',
          properties: {
            people: { type: 'object' },
            budget: { type: 'object' },
            technology: { type: 'object' },
            time: { type: 'object' }
          }
        },
        overallCapabilityGap: { type: 'string' }
      },
      required: ['capabilityAssessment', 'resourceAssessment']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const stakeholderReadinessTask = defineTask('stakeholder-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Stakeholder Readiness',
  agent: {
    name: 'stakeholder-readiness-assessor',
    prompt: {
      role: 'Stakeholder Engagement Specialist',
      task: 'Assess readiness and sentiment of key stakeholder groups',
      context: args,
      instructions: [
        'Profile each stakeholder group',
        'Assess current awareness levels',
        'Evaluate attitudes toward change',
        'Identify concerns and resistance factors',
        'Assess influence and impact',
        'Evaluate engagement levels',
        'Identify champions and resistors',
        'Calculate readiness scores by group'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        stakeholderReadiness: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              group: { type: 'string' },
              size: { type: 'number' },
              impactLevel: { type: 'string' },
              currentAwareness: { type: 'string' },
              attitude: { type: 'string' },
              concerns: { type: 'array', items: { type: 'string' } },
              resistanceFactors: { type: 'array', items: { type: 'string' } },
              readinessScore: { type: 'number' },
              keyInfluencers: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        championNetwork: { type: 'object' },
        resistanceHotspots: { type: 'array', items: { type: 'object' } }
      },
      required: ['stakeholderReadiness']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const infrastructureReadinessTask = defineTask('infrastructure-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Infrastructure Readiness',
  agent: {
    name: 'infrastructure-assessor',
    prompt: {
      role: 'Technical Infrastructure Specialist',
      task: 'Assess technical and process infrastructure readiness for change',
      context: args,
      instructions: [
        'Assess system readiness',
        'Evaluate process readiness',
        'Assess data readiness',
        'Evaluate integration requirements',
        'Assess training infrastructure',
        'Evaluate communication channels',
        'Assess support infrastructure',
        'Identify infrastructure gaps'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        systemReadiness: {
          type: 'object',
          properties: {
            currentSystems: { type: 'array', items: { type: 'object' } },
            requiredChanges: { type: 'array', items: { type: 'object' } },
            integrations: { type: 'array', items: { type: 'object' } },
            gaps: { type: 'array', items: { type: 'object' } }
          }
        },
        processReadiness: {
          type: 'object',
          properties: {
            currentProcesses: { type: 'array', items: { type: 'object' } },
            requiredChanges: { type: 'array', items: { type: 'object' } },
            gaps: { type: 'array', items: { type: 'object' } }
          }
        },
        supportInfrastructure: { type: 'object' },
        overallInfrastructureReadiness: { type: 'string' }
      },
      required: ['systemReadiness', 'processReadiness']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const riskAssessmentTask = defineTask('readiness-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Change Readiness Risks',
  agent: {
    name: 'readiness-risk-assessor',
    prompt: {
      role: 'Change Risk Assessment Specialist',
      task: 'Identify and assess risks related to change readiness gaps',
      context: args,
      instructions: [
        'Identify readiness-related risks',
        'Categorize risks by type',
        'Assess probability and impact',
        'Prioritize critical risks',
        'Identify risk triggers',
        'Develop mitigation strategies',
        'Create contingency plans',
        'Define monitoring approach'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        riskAssessment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              readinessGap: { type: 'string' },
              probability: { type: 'string' },
              impact: { type: 'string' },
              riskScore: { type: 'number' },
              mitigation: { type: 'string' },
              contingency: { type: 'string' },
              trigger: { type: 'string' }
            }
          }
        },
        riskMatrix: { type: 'object' },
        criticalRisks: { type: 'array', items: { type: 'object' } }
      },
      required: ['riskAssessment', 'criticalRisks']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const readinessScorecardTask = defineTask('readiness-scorecard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Readiness Scorecard',
  agent: {
    name: 'scorecard-creator',
    prompt: {
      role: 'Change Management Metrics Specialist',
      task: 'Create comprehensive readiness scorecard with dimensions and scores',
      context: args,
      instructions: [
        'Define readiness dimensions',
        'Calculate dimension scores',
        'Create weighted overall score',
        'Benchmark against thresholds',
        'Identify strength areas',
        'Highlight critical gaps',
        'Create visual scorecard',
        'Define tracking metrics'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        readinessScorecard: {
          type: 'object',
          properties: {
            dimensions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  dimension: { type: 'string' },
                  weight: { type: 'number' },
                  score: { type: 'number' },
                  threshold: { type: 'number' },
                  status: { type: 'string' },
                  subDimensions: { type: 'array', items: { type: 'object' } }
                }
              }
            },
            overallScore: { type: 'number' },
            readinessLevel: { type: 'string' },
            goNoGoRecommendation: { type: 'string' }
          }
        },
        strengths: { type: 'array', items: { type: 'object' } },
        criticalGaps: { type: 'array', items: { type: 'object' } },
        trackingMetrics: { type: 'array', items: { type: 'object' } }
      },
      required: ['readinessScorecard', 'criticalGaps']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const recommendationsTask = defineTask('readiness-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Readiness Recommendations',
  agent: {
    name: 'readiness-advisor',
    prompt: {
      role: 'Change Management Advisor',
      task: 'Develop actionable recommendations to improve change readiness',
      context: args,
      instructions: [
        'Prioritize readiness gaps',
        'Develop targeted interventions',
        'Create readiness improvement plan',
        'Define quick wins',
        'Plan for critical gaps',
        'Recommend timing adjustments',
        'Define success metrics',
        'Create implementation roadmap'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendationId: { type: 'string' },
              area: { type: 'string' },
              gapAddressed: { type: 'string' },
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string' },
              effort: { type: 'string' },
              timeline: { type: 'string' },
              owner: { type: 'string' },
              successMetrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        quickWins: { type: 'array', items: { type: 'object' } },
        improvementRoadmap: { type: 'object' },
        goLiveReadinessChecklist: { type: 'object' }
      },
      required: ['recommendations', 'improvementRoadmap']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// Main process function
export async function process(inputs, ctx) {
  ctx.log('Starting Change Readiness Assessment process');

  const artifacts = {
    organizationalContext: null,
    adkarAssessment: null,
    capabilityAssessment: null,
    stakeholderReadiness: null,
    infrastructureReadiness: null,
    riskAssessment: null,
    readinessScorecard: null,
    recommendations: null
  };

  // Phase 1: Organizational Context
  ctx.log('Phase 1: Analyzing organizational context');
  const contextResult = await ctx.task(organizationalContextTask, {
    organization: inputs.organization,
    changeContext: inputs.changeContext
  });
  artifacts.organizationalContext = contextResult;

  // Phase 2: ADKAR Assessment
  ctx.log('Phase 2: Conducting ADKAR assessment');
  const adkarResult = await ctx.task(adkarAssessmentTask, {
    changeContext: inputs.changeContext,
    stakeholderGroups: inputs.stakeholderGroups,
    organizationalContext: artifacts.organizationalContext
  });
  artifacts.adkarAssessment = adkarResult;

  // Phase 3: Capability Assessment
  ctx.log('Phase 3: Assessing organizational capabilities');
  const capabilityResult = await ctx.task(capabilityAssessmentTask, {
    changeContext: inputs.changeContext,
    currentState: inputs.currentState,
    organizationalContext: artifacts.organizationalContext
  });
  artifacts.capabilityAssessment = capabilityResult;

  // Phase 4: Stakeholder Readiness
  ctx.log('Phase 4: Assessing stakeholder readiness');
  const stakeholderResult = await ctx.task(stakeholderReadinessTask, {
    stakeholderGroups: inputs.stakeholderGroups,
    changeContext: inputs.changeContext,
    adkarAssessment: artifacts.adkarAssessment
  });
  artifacts.stakeholderReadiness = stakeholderResult;

  // Phase 5: Infrastructure Readiness
  ctx.log('Phase 5: Assessing infrastructure readiness');
  const infraResult = await ctx.task(infrastructureReadinessTask, {
    currentState: inputs.currentState,
    changeContext: inputs.changeContext,
    assessmentScope: inputs.assessmentScope
  });
  artifacts.infrastructureReadiness = infraResult;

  // Phase 6: Risk Assessment
  ctx.log('Phase 6: Assessing change readiness risks');
  const riskResult = await ctx.task(riskAssessmentTask, {
    adkarAssessment: artifacts.adkarAssessment,
    capabilityAssessment: artifacts.capabilityAssessment,
    stakeholderReadiness: artifacts.stakeholderReadiness,
    infrastructureReadiness: artifacts.infrastructureReadiness
  });
  artifacts.riskAssessment = riskResult;

  // Phase 7: Readiness Scorecard
  ctx.log('Phase 7: Creating readiness scorecard');
  const scorecardResult = await ctx.task(readinessScorecardTask, {
    organizationalContext: artifacts.organizationalContext,
    adkarAssessment: artifacts.adkarAssessment,
    capabilityAssessment: artifacts.capabilityAssessment,
    stakeholderReadiness: artifacts.stakeholderReadiness,
    infrastructureReadiness: artifacts.infrastructureReadiness,
    riskAssessment: artifacts.riskAssessment
  });
  artifacts.readinessScorecard = scorecardResult;

  // Breakpoint for assessment review
  await ctx.breakpoint('readiness-assessment-review', {
    question: 'Review the change readiness assessment results. Are the findings accurate and complete?',
    artifacts: artifacts
  });

  // Phase 8: Recommendations
  ctx.log('Phase 8: Developing readiness recommendations');
  const recommendationsResult = await ctx.task(recommendationsTask, {
    readinessScorecard: artifacts.readinessScorecard,
    riskAssessment: artifacts.riskAssessment,
    adkarAssessment: artifacts.adkarAssessment,
    changeContext: inputs.changeContext
  });
  artifacts.recommendations = recommendationsResult;

  ctx.log('Change Readiness Assessment process completed');

  return {
    success: true,
    readinessAssessment: {
      organizationalContext: artifacts.organizationalContext,
      stakeholderReadiness: artifacts.stakeholderReadiness,
      capabilityAssessment: artifacts.capabilityAssessment,
      infrastructureReadiness: artifacts.infrastructureReadiness
    },
    adkarAnalysis: artifacts.adkarAssessment,
    gapAnalysis: {
      capability: artifacts.capabilityAssessment,
      stakeholder: artifacts.stakeholderReadiness,
      infrastructure: artifacts.infrastructureReadiness
    },
    riskAssessment: artifacts.riskAssessment,
    readinessScorecard: artifacts.readinessScorecard.readinessScorecard,
    recommendations: artifacts.recommendations.recommendations,
    artifacts
  };
}
