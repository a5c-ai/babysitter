/**
 * @process social-sciences/survey-administration
 * @description Implement multi-mode survey data collection using online, phone, mail, or in-person methods with quality control, response rate monitoring, and data validation
 * @inputs { surveyInstrument: object, samplingPlan: object, mode: string, constraints: object, outputDir: string }
 * @outputs { success: boolean, administrationPlan: object, qualityControlProtocol: object, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-003 (survey-design-administration), SK-SS-014 (research-ethics-irb)
 * @recommendedAgents AG-SS-003 (survey-research-director), AG-SS-010 (research-ethics-coordinator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    surveyInstrument = {},
    samplingPlan = {},
    mode = 'online',
    constraints = {},
    outputDir = 'survey-administration-output',
    targetResponseRate = 60
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Survey Administration process');

  // ============================================================================
  // PHASE 1: ADMINISTRATION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up survey administration');
  const administrationSetup = await ctx.task(administrationSetupTask, {
    surveyInstrument,
    mode,
    constraints,
    outputDir
  });

  artifacts.push(...administrationSetup.artifacts);

  // ============================================================================
  // PHASE 2: CONTACT PROTOCOL DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing contact protocols');
  const contactProtocol = await ctx.task(contactProtocolTask, {
    samplingPlan,
    mode,
    targetResponseRate,
    outputDir
  });

  artifacts.push(...contactProtocol.artifacts);

  // ============================================================================
  // PHASE 3: QUALITY CONTROL SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up quality control procedures');
  const qualityControl = await ctx.task(qualityControlSetupTask, {
    surveyInstrument,
    mode,
    outputDir
  });

  artifacts.push(...qualityControl.artifacts);

  // ============================================================================
  // PHASE 4: RESPONSE RATE MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing response rate monitoring plan');
  const responseMonitoring = await ctx.task(responseMonitoringTask, {
    samplingPlan,
    targetResponseRate,
    contactProtocol,
    outputDir
  });

  artifacts.push(...responseMonitoring.artifacts);

  // ============================================================================
  // PHASE 5: DATA VALIDATION PROTOCOL
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing data validation protocol');
  const dataValidation = await ctx.task(dataValidationProtocolTask, {
    surveyInstrument,
    qualityControl,
    outputDir
  });

  artifacts.push(...dataValidation.artifacts);

  // ============================================================================
  // PHASE 6: FIELD MANAGEMENT PLAN
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing field management plan');
  const fieldManagement = await ctx.task(fieldManagementTask, {
    mode,
    samplingPlan,
    contactProtocol,
    constraints,
    outputDir
  });

  artifacts.push(...fieldManagement.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring survey administration plan quality');
  const qualityScore = await ctx.task(administrationQualityScoringTask, {
    administrationSetup,
    contactProtocol,
    qualityControl,
    responseMonitoring,
    dataValidation,
    fieldManagement,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const adminScore = qualityScore.overallScore;
  const qualityMet = adminScore >= 80;

  // Breakpoint: Review survey administration plan
  await ctx.breakpoint({
    question: `Survey administration plan complete. Quality score: ${adminScore}/100. ${qualityMet ? 'Plan meets quality standards!' : 'Plan may need refinement.'} Review and approve?`,
    title: 'Survey Administration Plan Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        adminScore,
        qualityMet,
        mode,
        contactAttempts: contactProtocol.contactAttempts,
        qualityChecks: qualityControl.checks
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: adminScore,
    qualityMet,
    administrationPlan: {
      mode,
      platform: administrationSetup.platform,
      timeline: administrationSetup.timeline,
      contactProtocol: contactProtocol.protocol
    },
    qualityControlProtocol: {
      checks: qualityControl.checks,
      dataValidation: dataValidation.rules,
      responseMonitoring: responseMonitoring.metrics
    },
    fieldManagement: fieldManagement.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/survey-administration',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Administration Setup
export const administrationSetupTask = defineTask('administration-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up survey administration',
  agent: {
    name: 'survey-administrator',
    prompt: {
      role: 'survey operations specialist',
      task: 'Set up survey administration infrastructure and timeline',
      context: args,
      instructions: [
        'Select appropriate survey platform/tool for mode',
        'Configure survey instrument in platform',
        'Set up response collection and storage',
        'Configure skip logic and branching',
        'Set up respondent tracking system',
        'Develop administration timeline',
        'Configure data security measures',
        'Test survey functionality thoroughly',
        'Generate setup documentation'
      ],
      outputFormat: 'JSON with platform, configuration, timeline, security, testResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['platform', 'timeline', 'artifacts'],
      properties: {
        platform: { type: 'string' },
        configuration: { type: 'object' },
        timeline: { type: 'object' },
        security: { type: 'object' },
        testResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'survey-administration', 'setup']
}));

// Task 2: Contact Protocol
export const contactProtocolTask = defineTask('contact-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop contact protocols',
  agent: {
    name: 'contact-protocol-specialist',
    prompt: {
      role: 'survey methodology expert',
      task: 'Develop comprehensive contact protocols using tailored design',
      context: args,
      instructions: [
        'Design pre-notification strategy',
        'Develop initial invitation/contact materials',
        'Plan reminder schedule and content',
        'Design follow-up contact sequence',
        'Develop refusal conversion strategies',
        'Plan for hard-to-reach respondents',
        'Design mode-specific contact materials',
        'Plan incentive delivery if applicable',
        'Generate contact protocol document'
      ],
      outputFormat: 'JSON with protocol, contactAttempts, materials, reminderSchedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'contactAttempts', 'artifacts'],
      properties: {
        protocol: { type: 'object' },
        contactAttempts: { type: 'number' },
        materials: { type: 'array', items: { type: 'string' } },
        reminderSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              contact: { type: 'string' },
              timing: { type: 'string' },
              method: { type: 'string' }
            }
          }
        },
        refusalConversion: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'survey-administration', 'contact']
}));

// Task 3: Quality Control Setup
export const qualityControlSetupTask = defineTask('quality-control-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up quality control procedures',
  agent: {
    name: 'quality-control-specialist',
    prompt: {
      role: 'data quality specialist',
      task: 'Develop comprehensive quality control procedures',
      context: args,
      instructions: [
        'Design attention check questions',
        'Set up speeding detection (completion time thresholds)',
        'Design straightlining detection',
        'Set up duplicate response detection',
        'Design bot/fraud detection measures',
        'Plan interviewer monitoring (if applicable)',
        'Set up real-time data quality monitoring',
        'Design quality thresholds and alerts',
        'Generate quality control protocol'
      ],
      outputFormat: 'JSON with checks, attentionChecks, speedingThresholds, fraudDetection, monitoringPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['checks', 'artifacts'],
      properties: {
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              method: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
        attentionChecks: { type: 'number' },
        speedingThresholds: { type: 'object' },
        fraudDetection: { type: 'object' },
        monitoringPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'survey-administration', 'quality-control']
}));

// Task 4: Response Monitoring
export const responseMonitoringTask = defineTask('response-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop response rate monitoring plan',
  agent: {
    name: 'response-monitoring-specialist',
    prompt: {
      role: 'survey operations manager',
      task: 'Develop response rate monitoring and tracking plan',
      context: args,
      instructions: [
        'Define response rate calculation methodology (AAPOR standards)',
        'Design response rate tracking dashboard',
        'Set response rate targets by subgroup',
        'Plan for nonresponse bias assessment',
        'Design adaptive protocols for low response',
        'Plan paradata collection and analysis',
        'Set up automated monitoring alerts',
        'Design response rate reporting schedule',
        'Generate monitoring protocol'
      ],
      outputFormat: 'JSON with metrics, calculationMethod, targets, adaptiveProtocols, reportingSchedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'targets', 'artifacts'],
      properties: {
        metrics: { type: 'array', items: { type: 'string' } },
        calculationMethod: { type: 'string' },
        targets: {
          type: 'object',
          properties: {
            overall: { type: 'number' },
            bySubgroup: { type: 'object' }
          }
        },
        adaptiveProtocols: { type: 'array', items: { type: 'string' } },
        paradataCollection: { type: 'array', items: { type: 'string' } },
        reportingSchedule: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'survey-administration', 'response-monitoring']
}));

// Task 5: Data Validation Protocol
export const dataValidationProtocolTask = defineTask('data-validation-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop data validation protocol',
  agent: {
    name: 'data-validation-specialist',
    prompt: {
      role: 'data quality engineer',
      task: 'Develop comprehensive data validation and cleaning protocol',
      context: args,
      instructions: [
        'Design range checks for numerical variables',
        'Design consistency checks across variables',
        'Plan for handling missing data',
        'Design skip pattern validation',
        'Plan for open-ended response coding',
        'Design data cleaning procedures',
        'Plan for handling invalid responses',
        'Design validation reporting',
        'Generate data validation protocol'
      ],
      outputFormat: 'JSON with rules, rangeChecks, consistencyChecks, missingDataHandling, cleaningProcedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'artifacts'],
      properties: {
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              variables: { type: 'array', items: { type: 'string' } },
              action: { type: 'string' }
            }
          }
        },
        rangeChecks: { type: 'object' },
        consistencyChecks: { type: 'array' },
        missingDataHandling: { type: 'object' },
        cleaningProcedures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'survey-administration', 'data-validation']
}));

// Task 6: Field Management
export const fieldManagementTask = defineTask('field-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop field management plan',
  agent: {
    name: 'field-management-specialist',
    prompt: {
      role: 'survey field manager',
      task: 'Develop comprehensive field management plan',
      context: args,
      instructions: [
        'Develop interviewer training protocol (if applicable)',
        'Design sample management procedures',
        'Plan for field staff supervision',
        'Design problem resolution procedures',
        'Plan for mid-course adjustments',
        'Design field reporting procedures',
        'Plan closeout procedures',
        'Design post-field quality assessment',
        'Generate field management protocol'
      ],
      outputFormat: 'JSON with plan, training, supervision, problemResolution, closeout, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        training: { type: 'object' },
        supervision: { type: 'object' },
        problemResolution: { type: 'object' },
        midCourseAdjustments: { type: 'array', items: { type: 'string' } },
        closeout: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'survey-administration', 'field-management']
}));

// Task 7: Quality Scoring
export const administrationQualityScoringTask = defineTask('administration-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score survey administration plan quality',
  agent: {
    name: 'administration-reviewer',
    prompt: {
      role: 'senior survey operations expert',
      task: 'Assess survey administration plan quality',
      context: args,
      instructions: [
        'Evaluate administration setup completeness (weight: 15%)',
        'Assess contact protocol rigor (weight: 20%)',
        'Evaluate quality control comprehensiveness (weight: 20%)',
        'Assess response monitoring plan (weight: 15%)',
        'Evaluate data validation protocol (weight: 15%)',
        'Assess field management plan (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            administrationSetup: { type: 'number' },
            contactProtocol: { type: 'number' },
            qualityControl: { type: 'number' },
            responseMonitoring: { type: 'number' },
            dataValidation: { type: 'number' },
            fieldManagement: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'survey-administration', 'quality-scoring']
}));
