/**
 * @process specializations/domains/business/entrepreneurship/customer-discovery-interview
 * @description Customer Discovery Interview Process - Systematic approach to conducting customer discovery interviews following The Mom Test principles, generating validated problem hypotheses and actionable insights.
 * @inputs { projectName: string, targetSegments: array, problemHypotheses: array, interviewGoals?: array, existingInsights?: string }
 * @outputs { success: boolean, interviewGuide: object, insightSynthesis: object, validatedHypotheses: array, invalidatedHypotheses: array, nextSteps: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/customer-discovery-interview', {
 *   projectName: 'SaaS Startup Validation',
 *   targetSegments: ['Small Business Owners', 'Freelancers'],
 *   problemHypotheses: ['Customers struggle with invoicing', 'Time tracking is painful'],
 *   interviewGoals: ['Understand current workflows', 'Identify pain points']
 * });
 *
 * @references
 * - The Mom Test: https://www.momtestbook.com/
 * - Steve Blank Customer Development: https://steveblank.com/
 * - Talking to Humans: https://www.talkingtohumans.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetSegments = [],
    problemHypotheses = [],
    interviewGoals = [],
    existingInsights = ''
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Customer Discovery Interview Process for ${projectName}`);

  // Phase 1: Interview Strategy Development
  const interviewStrategy = await ctx.task(interviewStrategyTask, {
    projectName,
    targetSegments,
    problemHypotheses,
    interviewGoals
  });

  artifacts.push(...(interviewStrategy.artifacts || []));

  // Quality Gate: Strategy must define clear segments and goals
  if (!interviewStrategy.targetedSegments || interviewStrategy.targetedSegments.length === 0) {
    return {
      success: false,
      error: 'No target segments defined for interviews',
      phase: 'interview-strategy'
    };
  }

  // Phase 2: Interview Script Development
  const interviewScript = await ctx.task(interviewScriptTask, {
    projectName,
    interviewStrategy,
    problemHypotheses,
    existingInsights
  });

  artifacts.push(...(interviewScript.artifacts || []));

  // Breakpoint: Review interview script before conducting interviews
  await ctx.breakpoint({
    question: `Review the interview script for ${projectName}. Does it follow Mom Test principles (focus on past behaviors, not future intentions)?`,
    title: 'Interview Script Review',
    context: {
      runId: ctx.runId,
      projectName,
      interviewScript: interviewScript.script,
      keyQuestions: interviewScript.keyQuestions,
      files: artifacts
    }
  });

  // Phase 3: Interview Logistics Planning
  const logisticsPlanning = await ctx.task(logisticsPlanningTask, {
    projectName,
    interviewStrategy,
    targetSegments
  });

  artifacts.push(...(logisticsPlanning.artifacts || []));

  // Phase 4: Interview Execution Framework
  const executionFramework = await ctx.task(executionFrameworkTask, {
    projectName,
    interviewScript,
    logisticsPlanning
  });

  artifacts.push(...(executionFramework.artifacts || []));

  // Phase 5: Insight Synthesis Framework
  const insightFramework = await ctx.task(insightSynthesisFrameworkTask, {
    projectName,
    problemHypotheses,
    interviewScript,
    targetSegments
  });

  artifacts.push(...(insightFramework.artifacts || []));

  // Phase 6: Hypothesis Validation Framework
  const validationFramework = await ctx.task(hypothesisValidationTask, {
    projectName,
    problemHypotheses,
    insightFramework
  });

  artifacts.push(...(validationFramework.artifacts || []));

  // Phase 7: Action Planning
  const actionPlan = await ctx.task(actionPlanningTask, {
    projectName,
    insightFramework,
    validationFramework,
    interviewStrategy
  });

  artifacts.push(...(actionPlan.artifacts || []));

  // Final Breakpoint: Review complete discovery framework
  await ctx.breakpoint({
    question: `Customer Discovery framework complete for ${projectName}. Ready to begin interviews with ${interviewStrategy.targetedSegments.length} segments. Approve to proceed?`,
    title: 'Customer Discovery Framework Approval',
    context: {
      runId: ctx.runId,
      projectName,
      totalSegments: interviewStrategy.targetedSegments.length,
      hypothesesToTest: problemHypotheses.length,
      interviewsPlanned: logisticsPlanning.plannedInterviews,
      files: artifacts
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    interviewGuide: {
      strategy: interviewStrategy,
      script: interviewScript,
      logistics: logisticsPlanning,
      executionFramework: executionFramework
    },
    insightSynthesis: insightFramework,
    hypothesisValidation: validationFramework,
    actionPlan: actionPlan,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/entrepreneurship/customer-discovery-interview',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const interviewStrategyTask = defineTask('interview-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Interview Strategy Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Customer Discovery Expert with expertise in The Mom Test methodology and Steve Blank Customer Development',
      task: 'Develop comprehensive customer discovery interview strategy',
      context: {
        projectName: args.projectName,
        targetSegments: args.targetSegments,
        problemHypotheses: args.problemHypotheses,
        interviewGoals: args.interviewGoals
      },
      instructions: [
        '1. Define and prioritize target customer segments based on expected learning value',
        '2. Specify ideal customer profiles for each segment (demographics, behaviors, context)',
        '3. Define interview objectives aligned with problem hypotheses',
        '4. Determine optimal interview format (in-person, video, phone) for each segment',
        '5. Set target number of interviews per segment (typically 10-15 for pattern recognition)',
        '6. Identify recruiting channels and outreach strategies for each segment',
        '7. Define success metrics for the discovery process',
        '8. Plan interview cadence and timeline',
        '9. Identify potential biases to avoid during interviews',
        '10. Create segment-specific conversation frameworks'
      ],
      outputFormat: 'JSON object with structured interview strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['targetedSegments', 'interviewObjectives', 'recruitingStrategy'],
      properties: {
        targetedSegments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              idealProfile: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              targetCount: { type: 'number' },
              recruitingChannels: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        interviewObjectives: { type: 'array', items: { type: 'string' } },
        recruitingStrategy: {
          type: 'object',
          properties: {
            channels: { type: 'array', items: { type: 'string' } },
            outreachTemplates: { type: 'array', items: { type: 'string' } },
            incentives: { type: 'string' }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            duration: { type: 'string' },
            interviewsPerWeek: { type: 'number' },
            milestones: { type: 'array', items: { type: 'string' } }
          }
        },
        biasesToAvoid: { type: 'array', items: { type: 'string' } },
        successMetrics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'customer-discovery', 'interview-strategy']
}));

export const interviewScriptTask = defineTask('interview-script', (args, taskCtx) => ({
  kind: 'agent',
  title: `Interview Script Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Customer Interview Specialist following The Mom Test methodology',
      task: 'Create interview scripts that focus on past behaviors and avoid leading questions',
      context: {
        projectName: args.projectName,
        interviewStrategy: args.interviewStrategy,
        problemHypotheses: args.problemHypotheses,
        existingInsights: args.existingInsights
      },
      instructions: [
        '1. Design opening questions that build rapport and establish context',
        '2. Create questions focused on PAST behaviors, not future intentions',
        '3. Develop probing questions for each problem hypothesis',
        '4. Avoid leading questions, compliments-seeking, and hypotheticals',
        '5. Include questions about current solutions and workarounds',
        '6. Add questions about the magnitude of problems (time, money, emotion)',
        '7. Design questions to understand decision-making process',
        '8. Include "shut up and listen" reminders at key points',
        '9. Create segment-specific question variations',
        '10. Add wrap-up questions and commitment/referral asks'
      ],
      outputFormat: 'JSON object with interview script and guidance'
    },
    outputSchema: {
      type: 'object',
      required: ['script', 'keyQuestions', 'probePatterns'],
      properties: {
        script: {
          type: 'object',
          properties: {
            opening: { type: 'array', items: { type: 'string' } },
            contextBuilding: { type: 'array', items: { type: 'string' } },
            problemExploration: { type: 'array', items: { type: 'string' } },
            solutionDiscovery: { type: 'array', items: { type: 'string' } },
            magnitudeAssessment: { type: 'array', items: { type: 'string' } },
            closing: { type: 'array', items: { type: 'string' } }
          }
        },
        keyQuestions: { type: 'array', items: { type: 'string' } },
        probePatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              followUp: { type: 'string' }
            }
          }
        },
        avoidPatterns: { type: 'array', items: { type: 'string' } },
        segmentVariations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'customer-discovery', 'interview-script', 'mom-test']
}));

export const logisticsPlanningTask = defineTask('logistics-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Interview Logistics Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Research Operations Specialist',
      task: 'Plan interview logistics, scheduling, and recording setup',
      context: {
        projectName: args.projectName,
        interviewStrategy: args.interviewStrategy,
        targetSegments: args.targetSegments
      },
      instructions: [
        '1. Create scheduling system and calendar management plan',
        '2. Define recording and note-taking protocols',
        '3. Prepare consent and permission templates',
        '4. Set up interview tracking spreadsheet/system',
        '5. Plan backup interviewer and note-taker roles',
        '6. Create pre-interview checklist',
        '7. Define post-interview debrief process',
        '8. Plan data organization and storage',
        '9. Establish communication templates (confirmation, reminder, thank you)',
        '10. Create contingency plans for no-shows and reschedules'
      ],
      outputFormat: 'JSON object with logistics plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plannedInterviews', 'schedulingPlan', 'trackingSystem'],
      properties: {
        plannedInterviews: { type: 'number' },
        schedulingPlan: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            availability: { type: 'string' },
            bufferTime: { type: 'string' }
          }
        },
        recordingProtocol: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            consentProcess: { type: 'string' },
            backupMethod: { type: 'string' }
          }
        },
        trackingSystem: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            fields: { type: 'array', items: { type: 'string' } }
          }
        },
        communicationTemplates: { type: 'array', items: { type: 'string' } },
        preInterviewChecklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'customer-discovery', 'logistics']
}));

export const executionFrameworkTask = defineTask('execution-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Interview Execution Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Customer Interview Coach',
      task: 'Create interview execution framework with real-time guidance',
      context: {
        projectName: args.projectName,
        interviewScript: args.interviewScript,
        logisticsPlanning: args.logisticsPlanning
      },
      instructions: [
        '1. Create interview flow guide with timing recommendations',
        '2. Develop active listening techniques and body language guidance',
        '3. Create "red flag" indicators for biased responses',
        '4. Design note-taking framework (facts vs. interpretations)',
        '5. Develop pivot strategies when interviews go off-track',
        '6. Create techniques for handling different interviewee personalities',
        '7. Design commitment escalation ladder',
        '8. Create post-interview reflection template',
        '9. Develop interviewer self-assessment checklist',
        '10. Plan for immediate insight capture and team debriefs'
      ],
      outputFormat: 'JSON object with execution framework'
    },
    outputSchema: {
      type: 'object',
      required: ['interviewFlow', 'noteTakingFramework', 'reflectionTemplate'],
      properties: {
        interviewFlow: {
          type: 'object',
          properties: {
            phases: { type: 'array', items: { type: 'object' } },
            timingGuidance: { type: 'object' },
            transitionCues: { type: 'array', items: { type: 'string' } }
          }
        },
        activeListeningTechniques: { type: 'array', items: { type: 'string' } },
        redFlags: { type: 'array', items: { type: 'string' } },
        noteTakingFramework: {
          type: 'object',
          properties: {
            categories: { type: 'array', items: { type: 'string' } },
            factVsInterpretation: { type: 'string' },
            template: { type: 'string' }
          }
        },
        pivotStrategies: { type: 'array', items: { type: 'string' } },
        commitmentLadder: { type: 'array', items: { type: 'string' } },
        reflectionTemplate: { type: 'object' },
        selfAssessmentChecklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'customer-discovery', 'interview-execution']
}));

export const insightSynthesisFrameworkTask = defineTask('insight-synthesis-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Insight Synthesis Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Customer Research Analyst',
      task: 'Create framework for synthesizing interview insights into actionable patterns',
      context: {
        projectName: args.projectName,
        problemHypotheses: args.problemHypotheses,
        interviewScript: args.interviewScript,
        targetSegments: args.targetSegments
      },
      instructions: [
        '1. Design pattern recognition methodology across interviews',
        '2. Create insight categorization framework (behaviors, needs, pain points)',
        '3. Develop quote extraction and tagging system',
        '4. Design affinity mapping process for grouping insights',
        '5. Create customer journey mapping template from insights',
        '6. Develop persona refinement process based on data',
        '7. Design insight prioritization framework (frequency, intensity, willingness to pay)',
        '8. Create insight validation rules (minimum data points)',
        '9. Develop insight-to-opportunity mapping',
        '10. Plan insight sharing and stakeholder communication'
      ],
      outputFormat: 'JSON object with insight synthesis framework'
    },
    outputSchema: {
      type: 'object',
      required: ['categorizationFramework', 'patternRecognition', 'prioritizationCriteria'],
      properties: {
        categorizationFramework: {
          type: 'object',
          properties: {
            categories: { type: 'array', items: { type: 'string' } },
            taggingSystem: { type: 'object' },
            hierarchyLevels: { type: 'array', items: { type: 'string' } }
          }
        },
        patternRecognition: {
          type: 'object',
          properties: {
            minimumDataPoints: { type: 'number' },
            patternTypes: { type: 'array', items: { type: 'string' } },
            validationRules: { type: 'array', items: { type: 'string' } }
          }
        },
        affinityMapping: {
          type: 'object',
          properties: {
            process: { type: 'array', items: { type: 'string' } },
            tools: { type: 'array', items: { type: 'string' } }
          }
        },
        prioritizationCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              weight: { type: 'number' },
              measurement: { type: 'string' }
            }
          }
        },
        personaRefinement: { type: 'object' },
        insightToOpportunity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'customer-discovery', 'insight-synthesis']
}));

export const hypothesisValidationTask = defineTask('hypothesis-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hypothesis Validation Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Lean Startup Validation Expert',
      task: 'Create framework for validating or invalidating problem hypotheses based on interview evidence',
      context: {
        projectName: args.projectName,
        problemHypotheses: args.problemHypotheses,
        insightFramework: args.insightFramework
      },
      instructions: [
        '1. Define validation criteria for each problem hypothesis',
        '2. Create evidence scoring system (strong, moderate, weak)',
        '3. Define minimum evidence threshold for validation',
        '4. Create hypothesis status framework (validated, invalidated, needs more data)',
        '5. Design confidence level assessment methodology',
        '6. Develop hypothesis refinement process based on evidence',
        '7. Create pivot indicator identification',
        '8. Design evidence documentation template',
        '9. Develop counter-evidence tracking',
        '10. Plan hypothesis evolution tracking over time'
      ],
      outputFormat: 'JSON object with hypothesis validation framework'
    },
    outputSchema: {
      type: 'object',
      required: ['validationCriteria', 'evidenceScoring', 'decisionFramework'],
      properties: {
        validationCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } },
              minimumEvidence: { type: 'number' }
            }
          }
        },
        evidenceScoring: {
          type: 'object',
          properties: {
            strong: { type: 'string' },
            moderate: { type: 'string' },
            weak: { type: 'string' }
          }
        },
        decisionFramework: {
          type: 'object',
          properties: {
            validatedThreshold: { type: 'number' },
            invalidatedThreshold: { type: 'number' },
            needsMoreDataCriteria: { type: 'string' }
          }
        },
        confidenceLevels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              criteria: { type: 'string' },
              interviewCount: { type: 'number' }
            }
          }
        },
        pivotIndicators: { type: 'array', items: { type: 'string' } },
        evidenceTemplate: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'customer-discovery', 'hypothesis-validation', 'lean-startup']
}));

export const actionPlanningTask = defineTask('action-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Discovery Action Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Startup Strategy Consultant',
      task: 'Create action plan based on discovery process outcomes',
      context: {
        projectName: args.projectName,
        insightFramework: args.insightFramework,
        validationFramework: args.validationFramework,
        interviewStrategy: args.interviewStrategy
      },
      instructions: [
        '1. Define decision matrix for different validation outcomes',
        '2. Create pivot criteria and alternative directions',
        '3. Design next experiment recommendations',
        '4. Plan transition to solution validation phase',
        '5. Create stakeholder communication plan for findings',
        '6. Define resource reallocation based on learnings',
        '7. Design iteration planning for additional discovery',
        '8. Create learning documentation and knowledge transfer',
        '9. Plan team alignment sessions on findings',
        '10. Define success metrics for next phase'
      ],
      outputFormat: 'JSON object with action plan'
    },
    outputSchema: {
      type: 'object',
      required: ['decisionMatrix', 'nextSteps', 'pivotCriteria'],
      properties: {
        decisionMatrix: {
          type: 'object',
          properties: {
            validatedPath: { type: 'array', items: { type: 'string' } },
            invalidatedPath: { type: 'array', items: { type: 'string' } },
            inconclusivePath: { type: 'array', items: { type: 'string' } }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        pivotCriteria: { type: 'array', items: { type: 'string' } },
        nextExperiments: { type: 'array', items: { type: 'string' } },
        communicationPlan: { type: 'object' },
        iterationPlan: { type: 'object' },
        successMetrics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'customer-discovery', 'action-planning']
}));
