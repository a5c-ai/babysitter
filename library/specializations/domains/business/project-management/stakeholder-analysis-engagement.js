/**
 * @process specializations/domains/business/project-management/stakeholder-analysis-engagement
 * @description Stakeholder Analysis and Engagement Planning - Identify all project stakeholders, assess
 * interests, influence, expectations, and develop tailored engagement and communication strategies.
 * @inputs { projectName: string, knownStakeholders?: array, projectContext?: object, organizationalContext?: object }
 * @outputs { success: boolean, stakeholderRegister: array, engagementPlan: object, communicationMatrix: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/stakeholder-analysis-engagement', {
 *   projectName: 'ERP System Upgrade',
 *   knownStakeholders: [{ name: 'CFO', role: 'sponsor' }, { name: 'Operations Director', role: 'key-user' }],
 *   projectContext: { scope: 'Finance and Operations modules', timeline: '18 months' },
 *   organizationalContext: { industry: 'manufacturing', size: 'enterprise' }
 * });
 *
 * @references
 * - PMI Stakeholder Management: https://www.pmi.org/learning/library/stakeholder-analysis-pivotal-practice-projects-8905
 * - Stakeholder Engagement Assessment Matrix: https://www.pmi.org/pmbok-guide-standards/foundational/pmbok
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    knownStakeholders = [],
    projectContext = {},
    organizationalContext = {},
    existingRelationships = [],
    communicationPreferences = {}
  } = inputs;

  // Phase 1: Stakeholder Identification
  const stakeholderIdentification = await ctx.task(comprehensiveStakeholderIdentificationTask, {
    projectName,
    knownStakeholders,
    projectContext,
    organizationalContext
  });

  // Quality Gate: Must identify minimum stakeholders
  if (!stakeholderIdentification.stakeholders || stakeholderIdentification.stakeholders.length < 3) {
    return {
      success: false,
      error: 'Insufficient stakeholder identification - minimum 3 stakeholders required',
      phase: 'identification',
      stakeholderRegister: null
    };
  }

  // Breakpoint: Review identified stakeholders
  await ctx.breakpoint({
    question: `Identified ${stakeholderIdentification.stakeholders.length} stakeholders for ${projectName}. Review and proceed with analysis?`,
    title: 'Stakeholder Identification Review',
    context: {
      runId: ctx.runId,
      projectName,
      stakeholderCount: stakeholderIdentification.stakeholders.length,
      categories: stakeholderIdentification.categoryBreakdown,
      files: [{
        path: `artifacts/phase1-stakeholder-identification.json`,
        format: 'json',
        content: stakeholderIdentification
      }]
    }
  });

  // Phase 2: Stakeholder Analysis
  const stakeholderAnalysis = await ctx.task(stakeholderAnalysisTask, {
    projectName,
    stakeholders: stakeholderIdentification.stakeholders,
    projectContext,
    existingRelationships
  });

  // Phase 3: Power-Interest Grid Mapping
  const powerInterestMapping = await ctx.task(powerInterestMappingTask, {
    projectName,
    stakeholderAnalysis,
    projectContext
  });

  // Phase 4: Stakeholder Needs Assessment
  const needsAssessment = await ctx.task(stakeholderNeedsAssessmentTask, {
    projectName,
    stakeholderAnalysis,
    powerInterestMapping,
    projectContext
  });

  // Phase 5: Current vs Desired Engagement Assessment
  const engagementAssessment = await ctx.task(engagementAssessmentTask, {
    projectName,
    stakeholderAnalysis,
    needsAssessment,
    existingRelationships
  });

  // Quality Gate: High-influence stakeholders must have engagement strategy
  const highInfluenceWithoutStrategy = engagementAssessment.gaps?.filter(g => g.severity === 'high') || [];
  if (highInfluenceWithoutStrategy.length > 0) {
    await ctx.breakpoint({
      question: `${highInfluenceWithoutStrategy.length} high-influence stakeholders lack engagement strategy. Address gaps before proceeding?`,
      title: 'Engagement Gap Warning',
      context: {
        runId: ctx.runId,
        gaps: highInfluenceWithoutStrategy,
        recommendation: 'Develop strategies for all high-influence stakeholders'
      }
    });
  }

  // Phase 6: Engagement Strategy Development
  const engagementStrategy = await ctx.task(engagementStrategyDevelopmentTask, {
    projectName,
    stakeholderAnalysis,
    powerInterestMapping,
    needsAssessment,
    engagementAssessment
  });

  // Phase 7: Communication Planning
  const communicationPlan = await ctx.task(communicationPlanningTask, {
    projectName,
    stakeholderAnalysis,
    engagementStrategy,
    communicationPreferences,
    projectContext
  });

  // Phase 8: Stakeholder Risk Analysis
  const stakeholderRiskAnalysis = await ctx.task(stakeholderRiskAnalysisTask, {
    projectName,
    stakeholderAnalysis,
    engagementAssessment,
    powerInterestMapping
  });

  // Phase 9: Engagement Action Planning
  const actionPlan = await ctx.task(engagementActionPlanningTask, {
    projectName,
    engagementStrategy,
    communicationPlan,
    stakeholderRiskAnalysis
  });

  // Phase 10: Stakeholder Register and Plan Generation
  const finalDocuments = await ctx.task(stakeholderDocumentGenerationTask, {
    projectName,
    stakeholderIdentification,
    stakeholderAnalysis,
    powerInterestMapping,
    needsAssessment,
    engagementAssessment,
    engagementStrategy,
    communicationPlan,
    stakeholderRiskAnalysis,
    actionPlan
  });

  // Final Quality Gate
  const completenessScore = finalDocuments.completenessScore || 0;
  const ready = completenessScore >= 80;

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Stakeholder analysis complete for ${projectName}. Completeness: ${completenessScore}/100. Approve and distribute?`,
    title: 'Stakeholder Analysis Approval',
    context: {
      runId: ctx.runId,
      projectName,
      stakeholderCount: stakeholderAnalysis.stakeholders.length,
      completeness: completenessScore,
      files: [
        { path: `artifacts/stakeholder-register.json`, format: 'json', content: finalDocuments.register },
        { path: `artifacts/engagement-plan.md`, format: 'markdown', content: finalDocuments.engagementPlanMarkdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    completenessScore,
    ready,
    stakeholderRegister: finalDocuments.register,
    engagementPlan: {
      strategies: engagementStrategy.strategies,
      actionPlan: actionPlan.actions,
      timeline: actionPlan.timeline,
      markdown: finalDocuments.engagementPlanMarkdown
    },
    communicationMatrix: {
      matrix: communicationPlan.communicationMatrix,
      channels: communicationPlan.channels,
      frequency: communicationPlan.frequencySchedule
    },
    powerInterestGrid: powerInterestMapping.grid,
    stakeholderRisks: stakeholderRiskAnalysis.risks,
    keyStakeholders: stakeholderAnalysis.keyStakeholders,
    recommendations: finalDocuments.recommendations,
    metadata: {
      processId: 'specializations/domains/business/project-management/stakeholder-analysis-engagement',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const comprehensiveStakeholderIdentificationTask = defineTask('comprehensive-stakeholder-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Comprehensive Stakeholder Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Stakeholder Management Specialist',
      task: 'Identify all stakeholders who may affect or be affected by the project',
      context: {
        projectName: args.projectName,
        knownStakeholders: args.knownStakeholders,
        projectContext: args.projectContext,
        organizationalContext: args.organizationalContext
      },
      instructions: [
        '1. Start with known stakeholders and expand identification',
        '2. Identify internal stakeholders (executives, managers, team members)',
        '3. Identify external stakeholders (customers, suppliers, regulators)',
        '4. Consider indirect stakeholders (affected parties, interest groups)',
        '5. Categorize stakeholders by type and relationship',
        '6. Identify stakeholder representatives for groups',
        '7. Document organizational affiliations',
        '8. Note any stakeholder dependencies or relationships',
        '9. Identify missing stakeholder categories',
        '10. Create initial stakeholder inventory'
      ],
      outputFormat: 'JSON object with comprehensive stakeholder list'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholders', 'categoryBreakdown'],
      properties: {
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              title: { type: 'string' },
              organization: { type: 'string' },
              category: { type: 'string', enum: ['sponsor', 'customer', 'team', 'management', 'supplier', 'regulator', 'community', 'other'] },
              type: { type: 'string', enum: ['internal', 'external'] },
              contactInfo: { type: 'string' }
            }
          }
        },
        categoryBreakdown: {
          type: 'object',
          properties: {
            internal: { type: 'number' },
            external: { type: 'number' },
            byCategory: { type: 'object' }
          }
        },
        stakeholderGroups: { type: 'array', items: { type: 'string' } },
        identificationMethod: { type: 'array', items: { type: 'string' } },
        potentialMissing: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['stakeholder', 'identification', 'planning']
}));

export const stakeholderAnalysisTask = defineTask('stakeholder-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Stakeholder Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Project Manager with stakeholder management expertise',
      task: 'Analyze stakeholder influence, interest, expectations, and attitudes',
      context: {
        projectName: args.projectName,
        stakeholders: args.stakeholders,
        projectContext: args.projectContext,
        existingRelationships: args.existingRelationships
      },
      instructions: [
        '1. Assess each stakeholder influence level (high/medium/low)',
        '2. Assess each stakeholder interest level in the project',
        '3. Determine stakeholder attitude (supportive/neutral/resistant)',
        '4. Identify stakeholder expectations and requirements',
        '5. Assess potential impact on project success',
        '6. Evaluate current engagement level',
        '7. Identify stakeholder concerns and interests',
        '8. Note any historical context or relationships',
        '9. Identify key stakeholders requiring focused attention',
        '10. Document stakeholder interrelationships'
      ],
      outputFormat: 'JSON object with stakeholder analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholders', 'keyStakeholders'],
      properties: {
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              influence: { type: 'string', enum: ['high', 'medium', 'low'] },
              interest: { type: 'string', enum: ['high', 'medium', 'low'] },
              attitude: { type: 'string', enum: ['champion', 'supportive', 'neutral', 'hesitant', 'resistant'] },
              expectations: { type: 'array', items: { type: 'string' } },
              concerns: { type: 'array', items: { type: 'string' } },
              potentialImpact: { type: 'string' },
              currentEngagement: { type: 'string', enum: ['unaware', 'resistant', 'neutral', 'supportive', 'leading'] }
            }
          }
        },
        keyStakeholders: { type: 'array', items: { type: 'string' } },
        interrelationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder1: { type: 'string' },
              stakeholder2: { type: 'string' },
              relationship: { type: 'string' }
            }
          }
        },
        analysisNotes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['stakeholder', 'analysis', 'assessment']
}));

export const powerInterestMappingTask = defineTask('power-interest-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Power-Interest Grid Mapping - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Stakeholder Strategy Consultant',
      task: 'Map stakeholders to power-interest grid and determine engagement approach',
      context: {
        projectName: args.projectName,
        stakeholderAnalysis: args.stakeholderAnalysis,
        projectContext: args.projectContext
      },
      instructions: [
        '1. Plot stakeholders on power-interest grid (high/low axes)',
        '2. Identify "Manage Closely" quadrant (high power, high interest)',
        '3. Identify "Keep Satisfied" quadrant (high power, low interest)',
        '4. Identify "Keep Informed" quadrant (low power, high interest)',
        '5. Identify "Monitor" quadrant (low power, low interest)',
        '6. Determine appropriate strategy for each quadrant',
        '7. Identify stakeholders likely to move between quadrants',
        '8. Prioritize stakeholder engagement efforts',
        '9. Document rationale for placement',
        '10. Create visual grid representation'
      ],
      outputFormat: 'JSON object with power-interest mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['grid', 'quadrantStrategies'],
      properties: {
        grid: {
          type: 'object',
          properties: {
            manageClosely: { type: 'array', items: { type: 'string' } },
            keepSatisfied: { type: 'array', items: { type: 'string' } },
            keepInformed: { type: 'array', items: { type: 'string' } },
            monitor: { type: 'array', items: { type: 'string' } }
          }
        },
        stakeholderPositions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              power: { type: 'number', minimum: 1, maximum: 10 },
              interest: { type: 'number', minimum: 1, maximum: 10 },
              quadrant: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        quadrantStrategies: {
          type: 'object',
          properties: {
            manageClosely: { type: 'string' },
            keepSatisfied: { type: 'string' },
            keepInformed: { type: 'string' },
            monitor: { type: 'string' }
          }
        },
        movementRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              currentQuadrant: { type: 'string' },
              potentialQuadrant: { type: 'string' },
              trigger: { type: 'string' }
            }
          }
        },
        prioritization: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['stakeholder', 'power-interest', 'strategy']
}));

export const stakeholderNeedsAssessmentTask = defineTask('stakeholder-needs-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Stakeholder Needs Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Analyst with stakeholder focus',
      task: 'Assess detailed needs, requirements, and success criteria for each stakeholder',
      context: {
        projectName: args.projectName,
        stakeholderAnalysis: args.stakeholderAnalysis,
        powerInterestMapping: args.powerInterestMapping,
        projectContext: args.projectContext
      },
      instructions: [
        '1. Document information needs for each stakeholder',
        '2. Identify decision-making requirements',
        '3. Determine reporting and visibility needs',
        '4. Assess training and support needs',
        '5. Identify success criteria from stakeholder perspective',
        '6. Document communication preferences',
        '7. Identify resource or time constraints',
        '8. Assess change management needs',
        '9. Document any special accommodations needed',
        '10. Prioritize needs by stakeholder importance'
      ],
      outputFormat: 'JSON object with stakeholder needs assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholderNeeds'],
      properties: {
        stakeholderNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              informationNeeds: { type: 'array', items: { type: 'string' } },
              decisionNeeds: { type: 'array', items: { type: 'string' } },
              reportingNeeds: { type: 'array', items: { type: 'string' } },
              trainingNeeds: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } },
              communicationPreference: { type: 'string' },
              frequency: { type: 'string' },
              constraints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        commonNeeds: { type: 'array', items: { type: 'string' } },
        conflictingNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              need: { type: 'string' },
              stakeholders: { type: 'array', items: { type: 'string' } },
              conflict: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        needsPrioritization: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['stakeholder', 'needs-assessment', 'requirements']
}));

export const engagementAssessmentTask = defineTask('engagement-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Current vs Desired Engagement Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Change Management Consultant',
      task: 'Assess current engagement levels and determine desired engagement states',
      context: {
        projectName: args.projectName,
        stakeholderAnalysis: args.stakeholderAnalysis,
        needsAssessment: args.needsAssessment,
        existingRelationships: args.existingRelationships
      },
      instructions: [
        '1. Document current engagement level for each stakeholder (C)',
        '2. Determine desired engagement level for project success (D)',
        '3. Identify engagement gaps (difference between C and D)',
        '4. Prioritize gaps by stakeholder importance',
        '5. Assess difficulty of achieving desired engagement',
        '6. Identify enablers and barriers to engagement',
        '7. Note stakeholders requiring engagement level decrease',
        '8. Document engagement level definitions used',
        '9. Create engagement assessment matrix',
        '10. Identify quick wins and challenging cases'
      ],
      outputFormat: 'JSON object with engagement assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['engagementMatrix', 'gaps'],
      properties: {
        engagementMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              currentLevel: { type: 'string', enum: ['unaware', 'resistant', 'neutral', 'supportive', 'leading'] },
              desiredLevel: { type: 'string', enum: ['unaware', 'resistant', 'neutral', 'supportive', 'leading'] },
              gap: { type: 'number' },
              difficulty: { type: 'string', enum: ['easy', 'moderate', 'difficult'] }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              currentLevel: { type: 'string' },
              desiredLevel: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              enablers: { type: 'array', items: { type: 'string' } },
              barriers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        challengingCases: { type: 'array', items: { type: 'string' } },
        levelDefinitions: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['stakeholder', 'engagement-assessment', 'gap-analysis']
}));

export const engagementStrategyDevelopmentTask = defineTask('engagement-strategy-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Engagement Strategy Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Stakeholder Engagement Strategist',
      task: 'Develop tailored engagement strategies for stakeholders',
      context: {
        projectName: args.projectName,
        stakeholderAnalysis: args.stakeholderAnalysis,
        powerInterestMapping: args.powerInterestMapping,
        needsAssessment: args.needsAssessment,
        engagementAssessment: args.engagementAssessment
      },
      instructions: [
        '1. Develop specific engagement strategy for each key stakeholder',
        '2. Define engagement objectives and outcomes',
        '3. Identify engagement tactics and activities',
        '4. Determine engagement frequency and timing',
        '5. Assign responsibility for stakeholder relationships',
        '6. Define success measures for engagement',
        '7. Plan for resistance management where needed',
        '8. Identify engagement dependencies and sequences',
        '9. Plan stakeholder coalition building',
        '10. Document escalation paths for engagement issues'
      ],
      outputFormat: 'JSON object with engagement strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              objective: { type: 'string' },
              approach: { type: 'string' },
              tactics: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' },
              owner: { type: 'string' },
              successMeasures: { type: 'array', items: { type: 'string' } },
              resistanceStrategy: { type: 'string' }
            }
          }
        },
        coalitionStrategy: {
          type: 'object',
          properties: {
            champions: { type: 'array', items: { type: 'string' } },
            influencers: { type: 'array', items: { type: 'string' } },
            buildingTactics: { type: 'array', items: { type: 'string' } }
          }
        },
        engagementSequence: { type: 'array', items: { type: 'string' } },
        escalationPaths: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['stakeholder', 'engagement-strategy', 'planning']
}));

export const communicationPlanningTask = defineTask('communication-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Communication Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Communications Manager',
      task: 'Develop comprehensive stakeholder communication plan',
      context: {
        projectName: args.projectName,
        stakeholderAnalysis: args.stakeholderAnalysis,
        engagementStrategy: args.engagementStrategy,
        communicationPreferences: args.communicationPreferences,
        projectContext: args.projectContext
      },
      instructions: [
        '1. Define communication objectives for each stakeholder group',
        '2. Determine appropriate communication channels',
        '3. Define message content and framing',
        '4. Establish communication frequency and timing',
        '5. Identify responsible communicators',
        '6. Plan for two-way communication and feedback',
        '7. Create communication templates where applicable',
        '8. Define communication protocols and approvals',
        '9. Plan for crisis communications',
        '10. Create communication matrix and calendar'
      ],
      outputFormat: 'JSON object with communication plan'
    },
    outputSchema: {
      type: 'object',
      required: ['communicationMatrix', 'channels', 'frequencySchedule'],
      properties: {
        communicationMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              information: { type: 'string' },
              channel: { type: 'string' },
              frequency: { type: 'string' },
              sender: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              purpose: { type: 'string' },
              audience: { type: 'array', items: { type: 'string' } },
              guidelines: { type: 'string' }
            }
          }
        },
        frequencySchedule: {
          type: 'object',
          properties: {
            weekly: { type: 'array', items: { type: 'string' } },
            biweekly: { type: 'array', items: { type: 'string' } },
            monthly: { type: 'array', items: { type: 'string' } },
            asNeeded: { type: 'array', items: { type: 'string' } }
          }
        },
        feedbackMechanisms: { type: 'array', items: { type: 'string' } },
        communicationProtocols: { type: 'array', items: { type: 'string' } },
        crisisCommunicationPlan: { type: 'string' },
        templates: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['stakeholder', 'communication', 'planning']
}));

export const stakeholderRiskAnalysisTask = defineTask('stakeholder-risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Stakeholder Risk Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Manager with stakeholder focus',
      task: 'Identify and analyze stakeholder-related risks',
      context: {
        projectName: args.projectName,
        stakeholderAnalysis: args.stakeholderAnalysis,
        engagementAssessment: args.engagementAssessment,
        powerInterestMapping: args.powerInterestMapping
      },
      instructions: [
        '1. Identify risks from stakeholder resistance or opposition',
        '2. Assess risks from stakeholder disengagement',
        '3. Identify risks from stakeholder conflicts',
        '4. Evaluate risks from changing stakeholder circumstances',
        '5. Assess risks from communication failures',
        '6. Identify risks from unrealistic stakeholder expectations',
        '7. Evaluate political and organizational risks',
        '8. Develop risk response strategies',
        '9. Identify risk triggers and early warning signs',
        '10. Document risk monitoring approach'
      ],
      outputFormat: 'JSON object with stakeholder risk analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['risks'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              description: { type: 'string' },
              relatedStakeholder: { type: 'string' },
              category: { type: 'string', enum: ['resistance', 'disengagement', 'conflict', 'change', 'communication', 'expectations', 'political'] },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              response: { type: 'string' },
              trigger: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        riskHeatmap: { type: 'object' },
        monitoringApproach: { type: 'string' },
        earlyWarnings: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['stakeholder', 'risk-analysis', 'mitigation']
}));

export const engagementActionPlanningTask = defineTask('engagement-action-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Engagement Action Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Manager with stakeholder expertise',
      task: 'Develop detailed action plan for stakeholder engagement',
      context: {
        projectName: args.projectName,
        engagementStrategy: args.engagementStrategy,
        communicationPlan: args.communicationPlan,
        stakeholderRiskAnalysis: args.stakeholderRiskAnalysis
      },
      instructions: [
        '1. Create detailed engagement actions for each stakeholder',
        '2. Define action timelines and milestones',
        '3. Assign action owners and responsibilities',
        '4. Identify required resources for engagement',
        '5. Define dependencies between actions',
        '6. Create engagement calendar',
        '7. Define checkpoints for engagement review',
        '8. Plan for engagement measurement and reporting',
        '9. Document contingency actions',
        '10. Create action tracking mechanism'
      ],
      outputFormat: 'JSON object with engagement action plan'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'timeline'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              actionId: { type: 'string' },
              stakeholder: { type: 'string' },
              action: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              status: { type: 'string', enum: ['planned', 'in-progress', 'complete'] },
              dependencies: { type: 'array', items: { type: 'string' } },
              resources: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              milestones: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        reviewCheckpoints: { type: 'array', items: { type: 'string' } },
        measurementPlan: { type: 'string' },
        contingencyActions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['stakeholder', 'action-planning', 'execution']
}));

export const stakeholderDocumentGenerationTask = defineTask('stakeholder-document-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Stakeholder Document Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Management Professional and Technical Writer',
      task: 'Generate comprehensive stakeholder register and engagement plan',
      context: {
        projectName: args.projectName,
        stakeholderIdentification: args.stakeholderIdentification,
        stakeholderAnalysis: args.stakeholderAnalysis,
        powerInterestMapping: args.powerInterestMapping,
        needsAssessment: args.needsAssessment,
        engagementAssessment: args.engagementAssessment,
        engagementStrategy: args.engagementStrategy,
        communicationPlan: args.communicationPlan,
        stakeholderRiskAnalysis: args.stakeholderRiskAnalysis,
        actionPlan: args.actionPlan
      },
      instructions: [
        '1. Compile comprehensive stakeholder register',
        '2. Create engagement plan document',
        '3. Include power-interest grid visualization',
        '4. Document communication matrix',
        '5. Include risk register extract',
        '6. Create action plan summary',
        '7. Generate both JSON and markdown versions',
        '8. Calculate completeness score',
        '9. Identify gaps and recommendations',
        '10. Add document control information'
      ],
      outputFormat: 'JSON object with complete stakeholder documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['register', 'engagementPlanMarkdown', 'completenessScore'],
      properties: {
        register: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              organization: { type: 'string' },
              influence: { type: 'string' },
              interest: { type: 'string' },
              attitude: { type: 'string' },
              engagementLevel: { type: 'string' },
              strategy: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        engagementPlanMarkdown: { type: 'string' },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        documentControl: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            date: { type: 'string' },
            author: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['stakeholder', 'documentation', 'deliverable']
}));
