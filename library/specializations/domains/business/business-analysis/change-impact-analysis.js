/**
 * @process ba-change-impact-analysis
 * @description Comprehensive change impact analysis process identifying people, process,
 * technology, and organizational impacts with detailed impact assessments and mitigation planning.
 * @inputs {
 *   changeDescription: { summary: string, scope: string, objectives: object[] },
 *   currentState: { processes: object[], systems: object[], roles: object[] },
 *   futureState: { processes: object[], systems: object[], roles: object[] },
 *   stakeholderGroups: object[],
 *   assessmentScope: { areas: string[], depth: string }
 * }
 * @outputs {
 *   impactAssessment: object,
 *   peopleImpacts: object[],
 *   processImpacts: object[],
 *   technologyImpacts: object[],
 *   organizationalImpacts: object[],
 *   mitigationPlan: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Task definitions
export const changeAnalysisTask = defineTask('change-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Change Characteristics',
  agent: {
    name: 'change-analyst',
    prompt: {
      role: 'Change Impact Analysis Specialist',
      task: 'Analyze the change to understand its nature, scope, and key characteristics',
      context: args,
      instructions: [
        'Analyze change description and objectives',
        'Identify change type and magnitude',
        'Map current to future state differences',
        'Identify affected business areas',
        'Determine change complexity',
        'Identify dependencies and constraints',
        'Assess change urgency',
        'Create change profile summary'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        changeProfile: {
          type: 'object',
          properties: {
            changeType: { type: 'string' },
            magnitude: { type: 'string' },
            complexity: { type: 'string' },
            urgency: { type: 'string' },
            scope: { type: 'object' }
          }
        },
        stateComparison: {
          type: 'object',
          properties: {
            processDifferences: { type: 'array', items: { type: 'object' } },
            systemDifferences: { type: 'array', items: { type: 'object' } },
            roleDifferences: { type: 'array', items: { type: 'object' } }
          }
        },
        affectedAreas: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'array', items: { type: 'object' } }
      },
      required: ['changeProfile', 'stateComparison', 'affectedAreas']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const peopleImpactTask = defineTask('people-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze People Impacts',
  agent: {
    name: 'people-impact-analyst',
    prompt: {
      role: 'Organizational Change Specialist',
      task: 'Analyze impacts on people including roles, skills, behaviors, and job design',
      context: args,
      instructions: [
        'Identify affected roles and positions',
        'Analyze job/role changes',
        'Identify new skill requirements',
        'Assess behavioral changes needed',
        'Identify reporting structure changes',
        'Assess workload impacts',
        'Identify career path impacts',
        'Rate impact severity by group'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        peopleImpacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholderGroup: { type: 'string' },
              headcount: { type: 'number' },
              roleChanges: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    currentRole: { type: 'string' },
                    futureRole: { type: 'string' },
                    changeType: { type: 'string' },
                    impactLevel: { type: 'string' }
                  }
                }
              },
              skillChanges: { type: 'array', items: { type: 'object' } },
              behaviorChanges: { type: 'array', items: { type: 'string' } },
              workloadImpact: { type: 'string' },
              overallImpactSeverity: { type: 'string' },
              concerns: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        highImpactGroups: { type: 'array', items: { type: 'object' } },
        skillGapSummary: { type: 'object' }
      },
      required: ['peopleImpacts', 'highImpactGroups']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const processImpactTask = defineTask('process-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Process Impacts',
  agent: {
    name: 'process-impact-analyst',
    prompt: {
      role: 'Business Process Analyst',
      task: 'Analyze impacts on business processes, workflows, and procedures',
      context: args,
      instructions: [
        'Identify affected processes',
        'Map process changes from current to future',
        'Identify new processes required',
        'Identify processes being retired',
        'Assess process complexity changes',
        'Identify control point changes',
        'Assess compliance impacts',
        'Rate process impact severity'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        processImpacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              processId: { type: 'string' },
              processName: { type: 'string' },
              changeType: { type: 'string', enum: ['modified', 'new', 'retired', 'unchanged'] },
              currentState: { type: 'object' },
              futureState: { type: 'object' },
              keyChanges: { type: 'array', items: { type: 'string' } },
              impactedRoles: { type: 'array', items: { type: 'string' } },
              complexityChange: { type: 'string' },
              complianceImpact: { type: 'string' },
              impactSeverity: { type: 'string' }
            }
          }
        },
        processChangesSummary: {
          type: 'object',
          properties: {
            totalAffected: { type: 'number' },
            modified: { type: 'number' },
            new: { type: 'number' },
            retired: { type: 'number' }
          }
        },
        criticalProcesses: { type: 'array', items: { type: 'object' } }
      },
      required: ['processImpacts', 'processChangesSummary']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const technologyImpactTask = defineTask('technology-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Technology Impacts',
  agent: {
    name: 'technology-impact-analyst',
    prompt: {
      role: 'Technology Change Analyst',
      task: 'Analyze impacts on systems, tools, applications, and technical infrastructure',
      context: args,
      instructions: [
        'Identify affected systems and applications',
        'Analyze system changes required',
        'Identify new systems being introduced',
        'Identify systems being retired',
        'Assess integration impacts',
        'Analyze data migration requirements',
        'Assess technical skill requirements',
        'Rate technology impact severity'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        technologyImpacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              systemId: { type: 'string' },
              systemName: { type: 'string' },
              changeType: { type: 'string', enum: ['modified', 'new', 'retired', 'replaced', 'unchanged'] },
              changeDetails: { type: 'array', items: { type: 'string' } },
              integrationImpacts: { type: 'array', items: { type: 'object' } },
              dataMigration: { type: 'object' },
              affectedUsers: { type: 'array', items: { type: 'string' } },
              impactSeverity: { type: 'string' }
            }
          }
        },
        technologyChangesSummary: {
          type: 'object',
          properties: {
            totalAffected: { type: 'number' },
            modified: { type: 'number' },
            new: { type: 'number' },
            retired: { type: 'number' },
            replaced: { type: 'number' }
          }
        },
        criticalSystems: { type: 'array', items: { type: 'object' } },
        migrationRequirements: { type: 'object' }
      },
      required: ['technologyImpacts', 'technologyChangesSummary']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const organizationalImpactTask = defineTask('organizational-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Organizational Impacts',
  agent: {
    name: 'organizational-impact-analyst',
    prompt: {
      role: 'Organizational Design Specialist',
      task: 'Analyze impacts on organizational structure, culture, governance, and operating model',
      context: args,
      instructions: [
        'Analyze organizational structure impacts',
        'Assess governance model changes',
        'Identify policy and procedure changes',
        'Assess cultural impacts',
        'Analyze decision rights changes',
        'Identify KPI/metric changes',
        'Assess vendor/partner impacts',
        'Rate organizational impact severity'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        organizationalImpacts: {
          type: 'object',
          properties: {
            structureChanges: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  area: { type: 'string' },
                  currentState: { type: 'string' },
                  futureState: { type: 'string' },
                  impact: { type: 'string' }
                }
              }
            },
            governanceChanges: { type: 'array', items: { type: 'object' } },
            policyChanges: { type: 'array', items: { type: 'object' } },
            culturalImpacts: { type: 'array', items: { type: 'object' } },
            decisionRightsChanges: { type: 'array', items: { type: 'object' } },
            kpiChanges: { type: 'array', items: { type: 'object' } },
            externalPartnerImpacts: { type: 'array', items: { type: 'object' } }
          }
        },
        overallOrganizationalImpact: { type: 'string' },
        criticalOrgChanges: { type: 'array', items: { type: 'object' } }
      },
      required: ['organizationalImpacts', 'overallOrganizationalImpact']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const impactConsolidationTask = defineTask('impact-consolidation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Consolidate Impact Assessment',
  agent: {
    name: 'impact-consolidator',
    prompt: {
      role: 'Change Impact Lead',
      task: 'Consolidate all impact analyses into comprehensive impact assessment',
      context: args,
      instructions: [
        'Synthesize all impact assessments',
        'Create impact heat map',
        'Prioritize impacts by severity',
        'Identify cross-cutting impacts',
        'Create impact timeline',
        'Identify cascading effects',
        'Rate overall change impact',
        'Create executive summary'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        consolidatedAssessment: {
          type: 'object',
          properties: {
            overallImpactRating: { type: 'string' },
            impactByDimension: { type: 'object' },
            heatMap: { type: 'object' },
            criticalImpacts: { type: 'array', items: { type: 'object' } },
            cascadingEffects: { type: 'array', items: { type: 'object' } },
            impactTimeline: { type: 'object' }
          }
        },
        executiveSummary: { type: 'object' },
        prioritizedImpacts: { type: 'array', items: { type: 'object' } }
      },
      required: ['consolidatedAssessment', 'prioritizedImpacts']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const mitigationPlanningTask = defineTask('mitigation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Mitigation Plan',
  agent: {
    name: 'mitigation-planner',
    prompt: {
      role: 'Change Risk Mitigation Specialist',
      task: 'Develop comprehensive mitigation plan for identified impacts',
      context: args,
      instructions: [
        'Prioritize impacts requiring mitigation',
        'Develop mitigation strategies by impact type',
        'Create people impact mitigation plan',
        'Create process impact mitigation plan',
        'Create technology impact mitigation plan',
        'Create organizational impact mitigation plan',
        'Define mitigation timeline',
        'Assign mitigation ownership'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        mitigationPlan: {
          type: 'object',
          properties: {
            peopleMitigation: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  impact: { type: 'string' },
                  strategy: { type: 'string' },
                  actions: { type: 'array', items: { type: 'string' } },
                  timeline: { type: 'string' },
                  owner: { type: 'string' },
                  resources: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            processMitigation: { type: 'array', items: { type: 'object' } },
            technologyMitigation: { type: 'array', items: { type: 'object' } },
            organizationalMitigation: { type: 'array', items: { type: 'object' } }
          }
        },
        mitigationTimeline: { type: 'object' },
        resourceRequirements: { type: 'object' },
        successMetrics: { type: 'array', items: { type: 'object' } }
      },
      required: ['mitigationPlan', 'mitigationTimeline']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// Main process function
export async function process(inputs, ctx) {
  ctx.log('Starting Change Impact Analysis process');

  const artifacts = {
    changeAnalysis: null,
    peopleImpacts: null,
    processImpacts: null,
    technologyImpacts: null,
    organizationalImpacts: null,
    consolidatedAssessment: null,
    mitigationPlan: null
  };

  // Phase 1: Change Analysis
  ctx.log('Phase 1: Analyzing change characteristics');
  const changeResult = await ctx.task(changeAnalysisTask, {
    changeDescription: inputs.changeDescription,
    currentState: inputs.currentState,
    futureState: inputs.futureState
  });
  artifacts.changeAnalysis = changeResult;

  // Phase 2: People Impact Analysis
  ctx.log('Phase 2: Analyzing people impacts');
  const peopleResult = await ctx.task(peopleImpactTask, {
    changeAnalysis: artifacts.changeAnalysis,
    currentState: inputs.currentState,
    futureState: inputs.futureState,
    stakeholderGroups: inputs.stakeholderGroups
  });
  artifacts.peopleImpacts = peopleResult;

  // Phase 3: Process Impact Analysis
  ctx.log('Phase 3: Analyzing process impacts');
  const processResult = await ctx.task(processImpactTask, {
    changeAnalysis: artifacts.changeAnalysis,
    currentState: inputs.currentState,
    futureState: inputs.futureState
  });
  artifacts.processImpacts = processResult;

  // Phase 4: Technology Impact Analysis
  ctx.log('Phase 4: Analyzing technology impacts');
  const technologyResult = await ctx.task(technologyImpactTask, {
    changeAnalysis: artifacts.changeAnalysis,
    currentState: inputs.currentState,
    futureState: inputs.futureState
  });
  artifacts.technologyImpacts = technologyResult;

  // Phase 5: Organizational Impact Analysis
  ctx.log('Phase 5: Analyzing organizational impacts');
  const orgResult = await ctx.task(organizationalImpactTask, {
    changeAnalysis: artifacts.changeAnalysis,
    currentState: inputs.currentState,
    futureState: inputs.futureState,
    stakeholderGroups: inputs.stakeholderGroups
  });
  artifacts.organizationalImpacts = orgResult;

  // Phase 6: Impact Consolidation
  ctx.log('Phase 6: Consolidating impact assessment');
  const consolidationResult = await ctx.task(impactConsolidationTask, {
    changeAnalysis: artifacts.changeAnalysis,
    peopleImpacts: artifacts.peopleImpacts,
    processImpacts: artifacts.processImpacts,
    technologyImpacts: artifacts.technologyImpacts,
    organizationalImpacts: artifacts.organizationalImpacts
  });
  artifacts.consolidatedAssessment = consolidationResult;

  // Breakpoint for impact review
  await ctx.breakpoint('impact-assessment-review', {
    question: 'Review the change impact analysis results. Are all significant impacts identified?',
    artifacts: artifacts
  });

  // Phase 7: Mitigation Planning
  ctx.log('Phase 7: Developing mitigation plan');
  const mitigationResult = await ctx.task(mitigationPlanningTask, {
    consolidatedAssessment: artifacts.consolidatedAssessment,
    peopleImpacts: artifacts.peopleImpacts,
    processImpacts: artifacts.processImpacts,
    technologyImpacts: artifacts.technologyImpacts,
    organizationalImpacts: artifacts.organizationalImpacts
  });
  artifacts.mitigationPlan = mitigationResult;

  ctx.log('Change Impact Analysis process completed');

  return {
    success: true,
    impactAssessment: artifacts.consolidatedAssessment.consolidatedAssessment,
    peopleImpacts: artifacts.peopleImpacts.peopleImpacts,
    processImpacts: artifacts.processImpacts.processImpacts,
    technologyImpacts: artifacts.technologyImpacts.technologyImpacts,
    organizationalImpacts: artifacts.organizationalImpacts.organizationalImpacts,
    mitigationPlan: artifacts.mitigationPlan.mitigationPlan,
    artifacts
  };
}
