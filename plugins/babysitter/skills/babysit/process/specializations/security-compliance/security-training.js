/**
 * @process security-compliance/security-training
 * @description Security Awareness Training Program - Comprehensive security training framework covering training content development,
 * delivery methods, phishing simulations, knowledge assessments, certification tracking, compliance requirements, and continuous
 * education to build a security-conscious culture and reduce human-related security risks.
 * @inputs { trainingType?: string, targetAudience?: array, complianceStandards?: array, includePhishing?: boolean, certificationRequired?: boolean, deliveryMode?: string, duration?: string }
 * @outputs { success: boolean, trainingProgram: object, trainingMaterials: array, phishingCampaign?: object, assessments: array, certifications: array, effectiveness: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/security-training', {
 *   trainingType: 'comprehensive',
 *   targetAudience: ['all-employees', 'developers', 'executives', 'it-staff'],
 *   complianceStandards: ['ISO27001', 'NIST', 'PCI-DSS', 'SOC2'],
 *   includePhishing: true,
 *   certificationRequired: true,
 *   deliveryMode: 'hybrid',
 *   duration: '12-months',
 *   phishingFrequency: 'monthly',
 *   assessmentTypes: ['quiz', 'hands-on', 'scenario-based'],
 *   gamification: true,
 *   reportingMetrics: true
 * });
 *
 * @references
 * - NIST SP 800-50 - Building IT Security Awareness and Training Program: https://csrc.nist.gov/publications/detail/sp/800-50/final
 * - SANS Security Awareness: https://www.sans.org/security-awareness-training/
 * - ISO/IEC 27001:2022 - Information Security Training: https://www.iso.org/standard/27001
 * - CISA Security Awareness: https://www.cisa.gov/topics/cybersecurity-best-practices/organizational-security/security-awareness
 * - NIST Cybersecurity Framework Training: https://www.nist.gov/cyberframework
 * - OWASP Security Education: https://owasp.org/www-project-security-culture/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    trainingType = 'comprehensive',
    targetAudience = ['all-employees'],
    complianceStandards = ['ISO27001', 'NIST'],
    includePhishing = true,
    certificationRequired = true,
    deliveryMode = 'hybrid',
    duration = '12-months',
    phishingFrequency = 'monthly',
    assessmentTypes = ['quiz', 'scenario-based'],
    gamification = true,
    reportingMetrics = true,
    customContent = [],
    languageSupport = ['en'],
    accessibilityCompliant = true,
    outputDir = 'security-training-output'
  } = inputs;

  if (!targetAudience || targetAudience.length === 0) {
    return {
      success: false,
      error: 'No target audience specified for training program',
      metadata: { processId: 'security-compliance/security-training', timestamp: ctx.now() }
    };
  }

  const startTime = ctx.now();
  const artifacts = [];
  const trainingMaterials = [];
  const assessments = [];
  const certifications = [];

  ctx.log('info', `Starting Security Awareness Training Program Development`);
  ctx.log('info', `Target Audience: ${targetAudience.join(', ')}, Delivery Mode: ${deliveryMode}, Duration: ${duration}`);

  // ============================================================================
  // PHASE 1: TRAINING NEEDS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting training needs assessment');

  const needsAssessment = await ctx.task(trainingNeedsAssessmentTask, {
    targetAudience,
    complianceStandards,
    trainingType,
    customContent,
    outputDir
  });

  artifacts.push(...needsAssessment.artifacts);

  ctx.log('info', `Needs Assessment Complete - Risk Areas Identified: ${needsAssessment.riskAreas.length}, Training Gaps: ${needsAssessment.trainingGaps.length}`);

  // ============================================================================
  // PHASE 2: TRAINING PROGRAM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing comprehensive training program structure');

  const programDesign = await ctx.task(programDesignTask, {
    needsAssessment,
    targetAudience,
    complianceStandards,
    trainingType,
    deliveryMode,
    duration,
    gamification,
    accessibilityCompliant,
    languageSupport,
    outputDir
  });

  artifacts.push(...programDesign.artifacts);

  ctx.log('info', `Program Design Complete - ${programDesign.trainingModules.length} modules, ${programDesign.totalDuration} estimated duration`);

  // Quality Gate: Program design review
  await ctx.breakpoint({
    question: `Security training program designed with ${programDesign.trainingModules.length} modules covering ${programDesign.topicsCovered.length} topics. Compliance requirements: ${complianceStandards.join(', ')}. Approve program design?`,
    title: 'Training Program Design Review',
    context: {
      runId: ctx.runId,
      modules: programDesign.trainingModules.length,
      topicsCovered: programDesign.topicsCovered,
      targetAudience,
      deliveryMode,
      estimatedDuration: programDesign.totalDuration,
      complianceAlignment: programDesign.complianceAlignment,
      recommendation: 'Review program structure and topics before content development',
      files: programDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 3: TRAINING CONTENT DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing training content and materials');

  const contentDevelopment = await ctx.task(contentDevelopmentTask, {
    programDesign,
    targetAudience,
    complianceStandards,
    gamification,
    accessibilityCompliant,
    languageSupport,
    customContent,
    outputDir
  });

  artifacts.push(...contentDevelopment.artifacts);
  trainingMaterials.push(...contentDevelopment.materials);

  ctx.log('info', `Content Development Complete - ${contentDevelopment.materials.length} materials created, ${contentDevelopment.interactiveElements} interactive elements`);

  // ============================================================================
  // PHASE 4: ROLE-BASED TRAINING CUSTOMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating role-based training tracks');

  const roleBasedContent = await ctx.task(roleBasedCustomizationTask, {
    targetAudience,
    programDesign,
    contentDevelopment,
    complianceStandards,
    outputDir
  });

  artifacts.push(...roleBasedContent.artifacts);
  trainingMaterials.push(...roleBasedContent.roleMaterials);

  ctx.log('info', `Role-Based Customization Complete - ${roleBasedContent.trainingTracks.length} tracks, ${roleBasedContent.roleMaterials.length} custom materials`);

  // ============================================================================
  // PHASE 5: PHISHING SIMULATION CAMPAIGN (if enabled)
  // ============================================================================

  let phishingCampaign = null;

  if (includePhishing) {
    ctx.log('info', 'Phase 5: Developing phishing simulation campaign');

    phishingCampaign = await ctx.task(phishingSimulationTask, {
      targetAudience,
      phishingFrequency,
      duration,
      trainingLevel: needsAssessment.baselineLevel,
      complianceStandards,
      outputDir
    });

    artifacts.push(...phishingCampaign.artifacts);

    ctx.log('info', `Phishing Campaign Developed - ${phishingCampaign.simulationTemplates.length} templates, ${phishingCampaign.campaigns.length} campaigns planned`);
  } else {
    ctx.log('info', 'Phase 5: Phishing simulation not requested, skipping');
  }

  // ============================================================================
  // PHASE 6: ASSESSMENT AND QUIZ DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing knowledge assessments and quizzes');

  const assessmentDevelopment = await ctx.task(assessmentDevelopmentTask, {
    programDesign,
    contentDevelopment,
    roleBasedContent,
    assessmentTypes,
    targetAudience,
    complianceStandards,
    outputDir
  });

  artifacts.push(...assessmentDevelopment.artifacts);
  assessments.push(...assessmentDevelopment.assessments);

  ctx.log('info', `Assessment Development Complete - ${assessmentDevelopment.assessments.length} assessments, ${assessmentDevelopment.totalQuestions} total questions`);

  // ============================================================================
  // PHASE 7: CERTIFICATION PROGRAM SETUP (if required)
  // ============================================================================

  let certificationProgram = null;

  if (certificationRequired) {
    ctx.log('info', 'Phase 7: Setting up certification program and tracking');

    certificationProgram = await ctx.task(certificationSetupTask, {
      programDesign,
      assessmentDevelopment,
      targetAudience,
      complianceStandards,
      duration,
      outputDir
    });

    artifacts.push(...certificationProgram.artifacts);
    certifications.push(...certificationProgram.certifications);

    ctx.log('info', `Certification Program Setup Complete - ${certificationProgram.certifications.length} certification types, renewal period: ${certificationProgram.renewalPeriod}`);
  } else {
    ctx.log('info', 'Phase 7: Certification not required, skipping');
  }

  // ============================================================================
  // PHASE 8: LEARNING MANAGEMENT SYSTEM (LMS) INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Preparing LMS integration and deployment materials');

  const lmsIntegration = await ctx.task(lmsIntegrationTask, {
    programDesign,
    contentDevelopment,
    roleBasedContent,
    assessmentDevelopment,
    certificationProgram,
    phishingCampaign,
    deliveryMode,
    outputDir
  });

  artifacts.push(...lmsIntegration.artifacts);

  ctx.log('info', `LMS Integration Complete - SCORM packages: ${lmsIntegration.scormPackages}, xAPI support: ${lmsIntegration.xapiSupport}`);

  // ============================================================================
  // PHASE 9: DELIVERY STRATEGY AND ROLLOUT PLAN
  // ============================================================================

  ctx.log('info', 'Phase 9: Developing delivery strategy and rollout plan');

  const deliveryStrategy = await ctx.task(deliveryStrategyTask, {
    programDesign,
    targetAudience,
    deliveryMode,
    duration,
    phishingCampaign,
    certificationProgram,
    outputDir
  });

  artifacts.push(...deliveryStrategy.artifacts);

  ctx.log('info', `Delivery Strategy Complete - Rollout phases: ${deliveryStrategy.rolloutPhases.length}, pilot group size: ${deliveryStrategy.pilotGroupSize}`);

  // Quality Gate: Pre-launch review
  await ctx.breakpoint({
    question: `Training program ready for deployment. Total materials: ${trainingMaterials.length}, Assessments: ${assessments.length}, ${includePhishing ? 'Phishing campaigns: ' + phishingCampaign.campaigns.length : 'No phishing'}. Approve for launch?`,
    title: 'Training Program Pre-Launch Review',
    context: {
      runId: ctx.runId,
      trainingModules: programDesign.trainingModules.length,
      trainingMaterials: trainingMaterials.length,
      assessments: assessments.length,
      phishingEnabled: includePhishing,
      certificationEnabled: certificationRequired,
      rolloutPhases: deliveryStrategy.rolloutPhases.length,
      estimatedParticipants: deliveryStrategy.estimatedParticipants,
      recommendation: 'Review all materials and plan before program launch',
      files: artifacts.filter(a => a.type === 'summary').map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 10: COMMUNICATION AND CHANGE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Developing communication and change management plan');

  const communicationPlan = await ctx.task(communicationPlanTask, {
    programDesign,
    deliveryStrategy,
    targetAudience,
    certificationRequired,
    complianceStandards,
    outputDir
  });

  artifacts.push(...communicationPlan.artifacts);

  ctx.log('info', `Communication Plan Complete - ${communicationPlan.communicationTemplates.length} templates, ${communicationPlan.stakeholderGroups.length} stakeholder groups`);

  // ============================================================================
  // PHASE 11: METRICS AND REPORTING FRAMEWORK
  // ============================================================================

  if (reportingMetrics) {
    ctx.log('info', 'Phase 11: Setting up metrics and reporting framework');

    const metricsFramework = await ctx.task(metricsFrameworkTask, {
      programDesign,
      assessmentDevelopment,
      phishingCampaign,
      certificationProgram,
      targetAudience,
      complianceStandards,
      outputDir
    });

    artifacts.push(...metricsFramework.artifacts);

    ctx.log('info', `Metrics Framework Complete - ${metricsFramework.kpis.length} KPIs, ${metricsFramework.dashboards.length} dashboards, ${metricsFramework.reportingCadence}`);
  } else {
    ctx.log('info', 'Phase 11: Metrics reporting not requested, skipping');
  }

  // ============================================================================
  // PHASE 12: TRAINING EFFECTIVENESS MEASUREMENT PLAN
  // ============================================================================

  ctx.log('info', 'Phase 12: Developing training effectiveness measurement plan');

  const effectivenessPlan = await ctx.task(effectivenessMeasurementTask, {
    programDesign,
    assessmentDevelopment,
    phishingCampaign,
    needsAssessment,
    targetAudience,
    outputDir
  });

  artifacts.push(...effectivenessPlan.artifacts);

  ctx.log('info', `Effectiveness Plan Complete - Measurement methods: ${effectivenessPlan.measurementMethods.length}, evaluation intervals: ${effectivenessPlan.evaluationIntervals}`);

  // ============================================================================
  // PHASE 13: CONTINUOUS IMPROVEMENT FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 13: Establishing continuous improvement framework');

  const continuousImprovement = await ctx.task(continuousImprovementTask, {
    programDesign,
    effectivenessPlan,
    needsAssessment,
    complianceStandards,
    duration,
    outputDir
  });

  artifacts.push(...continuousImprovement.artifacts);

  ctx.log('info', `Continuous Improvement Framework Complete - Review cycles: ${continuousImprovement.reviewCycles}, feedback mechanisms: ${continuousImprovement.feedbackMechanisms.length}`);

  // ============================================================================
  // PHASE 14: PROGRAM DOCUMENTATION AND PLAYBOOKS
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating comprehensive program documentation');

  const programDocumentation = await ctx.task(programDocumentationTask, {
    programDesign,
    contentDevelopment,
    roleBasedContent,
    assessmentDevelopment,
    phishingCampaign,
    certificationProgram,
    lmsIntegration,
    deliveryStrategy,
    communicationPlan,
    effectivenessPlan,
    continuousImprovement,
    outputDir
  });

  artifacts.push(...programDocumentation.artifacts);

  // Final Breakpoint: Program review
  await ctx.breakpoint({
    question: `Security Awareness Training Program complete. ${programDesign.trainingModules.length} modules, ${trainingMaterials.length} materials, ${assessments.length} assessments. ${includePhishing ? phishingCampaign.campaigns.length + ' phishing campaigns' : 'No phishing'}. Ready for deployment?`,
    title: 'Security Training Program Final Review',
    context: {
      runId: ctx.runId,
      summary: {
        trainingType,
        targetAudience,
        deliveryMode,
        duration,
        modulesCreated: programDesign.trainingModules.length,
        materialsCreated: trainingMaterials.length,
        assessmentsCreated: assessments.length,
        phishingEnabled: includePhishing,
        phishingCampaigns: phishingCampaign?.campaigns.length || 0,
        certificationEnabled: certificationRequired,
        certificationTypes: certifications.length,
        complianceStandards,
        estimatedParticipants: deliveryStrategy.estimatedParticipants,
        rolloutPhases: deliveryStrategy.rolloutPhases.length
      },
      effectiveness: {
        baselineAssessment: needsAssessment.baselineLevel,
        targetImprovement: effectivenessPlan.targetImprovement,
        measurementMethods: effectivenessPlan.measurementMethods,
        evaluationIntervals: effectivenessPlan.evaluationIntervals
      },
      files: [
        { path: programDocumentation.programGuidePath, format: 'markdown', label: 'Program Guide' },
        { path: programDocumentation.administratorPlaybookPath, format: 'markdown', label: 'Administrator Playbook' },
        { path: deliveryStrategy.rolloutPlanPath, format: 'markdown', label: 'Rollout Plan' },
        ...(phishingCampaign ? [{ path: phishingCampaign.campaignGuidePath, format: 'markdown', label: 'Phishing Campaign Guide' }] : []),
        ...(certificationProgram ? [{ path: certificationProgram.certificationGuidePath, format: 'markdown', label: 'Certification Guide' }] : [])
      ]
    }
  });

  const endTime = ctx.now();
  const duration_seconds = endTime - startTime;

  return {
    success: true,
    trainingProgram: {
      programId: `SEC-TRAINING-${Date.now()}`,
      type: trainingType,
      targetAudience,
      deliveryMode,
      duration,
      modulesCount: programDesign.trainingModules.length,
      topicsCovered: programDesign.topicsCovered,
      complianceAlignment: programDesign.complianceAlignment,
      totalDuration: programDesign.totalDuration,
      rolloutPhases: deliveryStrategy.rolloutPhases,
      estimatedParticipants: deliveryStrategy.estimatedParticipants
    },
    trainingMaterials: trainingMaterials.map(m => ({
      id: m.id,
      type: m.type,
      title: m.title,
      targetAudience: m.targetAudience,
      duration: m.duration,
      format: m.format,
      path: m.path
    })),
    assessments: assessments.map(a => ({
      id: a.id,
      type: a.type,
      module: a.module,
      questionsCount: a.questionsCount,
      passingScore: a.passingScore,
      targetAudience: a.targetAudience
    })),
    phishingCampaign: phishingCampaign ? {
      enabled: true,
      frequency: phishingFrequency,
      campaignsPlanned: phishingCampaign.campaigns.length,
      templatesCreated: phishingCampaign.simulationTemplates.length,
      difficultyLevels: phishingCampaign.difficultyLevels,
      reportingEnabled: phishingCampaign.reportingEnabled
    } : { enabled: false },
    certifications: certificationRequired ? certifications.map(c => ({
      id: c.id,
      name: c.name,
      requirements: c.requirements,
      renewalPeriod: c.renewalPeriod,
      targetAudience: c.targetAudience
    })) : [],
    lmsIntegration: {
      scormCompliant: lmsIntegration.scormPackages > 0,
      scormPackages: lmsIntegration.scormPackages,
      xapiSupport: lmsIntegration.xapiSupport,
      integrationGuide: lmsIntegration.integrationGuidePath
    },
    deliveryStrategy: {
      rolloutPhases: deliveryStrategy.rolloutPhases.length,
      pilotPhase: deliveryStrategy.pilotPhase,
      fullDeploymentDate: deliveryStrategy.fullDeploymentDate,
      supportModel: deliveryStrategy.supportModel
    },
    effectiveness: {
      baselineLevel: needsAssessment.baselineLevel,
      targetImprovement: effectivenessPlan.targetImprovement,
      measurementMethods: effectivenessPlan.measurementMethods,
      evaluationIntervals: effectivenessPlan.evaluationIntervals,
      successCriteria: effectivenessPlan.successCriteria
    },
    continuousImprovement: {
      reviewCycles: continuousImprovement.reviewCycles,
      feedbackMechanisms: continuousImprovement.feedbackMechanisms,
      updateProcedure: continuousImprovement.updateProcedure,
      contentRefreshSchedule: continuousImprovement.contentRefreshSchedule
    },
    artifacts,
    duration: duration_seconds,
    metadata: {
      processId: 'security-compliance/security-training',
      timestamp: startTime,
      trainingType,
      targetAudienceCount: targetAudience.length,
      complianceStandards,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Training Needs Assessment
export const trainingNeedsAssessmentTask = defineTask('training-needs-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct training needs assessment',
  agent: {
    name: 'training-analyst',
    prompt: {
      role: 'security training specialist',
      task: 'Assess security awareness training needs and identify risk areas',
      context: args,
      instructions: [
        'Analyze target audience security knowledge baseline',
        'Identify security risk areas and threat landscape',
        'Assess current security culture maturity',
        'Review historical security incidents and patterns',
        'Identify compliance training requirements',
        'Assess specific role-based training needs',
        'Identify knowledge gaps across audience segments',
        'Determine priority training topics based on risk',
        'Establish baseline security awareness metrics',
        'Assess technical skill levels for different roles',
        'Review previous training effectiveness data',
        'Identify organizational security challenges',
        'Document training needs assessment findings',
        'Save assessment report to output directory'
      ],
      outputFormat: 'JSON with riskAreas, trainingGaps, baselineLevel, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskAreas', 'trainingGaps', 'baselineLevel', 'priorities', 'artifacts'],
      properties: {
        riskAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              riskLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' },
              affectedAudience: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        trainingGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              currentLevel: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
              targetLevel: { type: 'string', enum: ['low', 'medium', 'high', 'expert'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        baselineLevel: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
        securityCultureMaturity: { type: 'string', enum: ['initial', 'developing', 'defined', 'managed', 'optimized'] },
        historicalIncidents: { type: 'array', items: { type: 'object' } },
        priorities: { type: 'array', items: { type: 'string' } },
        complianceRequirements: { type: 'array', items: { type: 'string' } },
        audienceSegmentation: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-training', 'needs-assessment']
}));

// Phase 2: Program Design
export const programDesignTask = defineTask('program-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design comprehensive training program',
  agent: {
    name: 'curriculum-designer',
    prompt: {
      role: 'security training curriculum designer',
      task: 'Design comprehensive security awareness training program structure',
      context: args,
      instructions: [
        'Design modular training program structure',
        'Core modules: password security, phishing awareness, social engineering, data protection, mobile security, remote work security',
        'Advanced modules: incident response, threat intelligence, secure development, cloud security, insider threats',
        'Create learning objectives for each module',
        'Define module prerequisites and dependencies',
        'Design progressive difficulty levels',
        'Align content with compliance standards (ISO27001, NIST, PCI-DSS, SOC2)',
        'Incorporate adult learning principles',
        'Design microlearning components (5-10 min segments)',
        'Plan interactive elements and hands-on exercises',
        'Include gamification elements if requested',
        'Ensure accessibility compliance (WCAG 2.1 AA)',
        'Plan for multi-language support if needed',
        'Define total program duration and time commitment',
        'Create program roadmap and timeline',
        'Document program design specifications',
        'Save program design to output directory'
      ],
      outputFormat: 'JSON with trainingModules, learningObjectives, complianceAlignment, totalDuration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trainingModules', 'topicsCovered', 'complianceAlignment', 'totalDuration', 'artifacts'],
      properties: {
        trainingModules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              duration: { type: 'string' },
              difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
              learningObjectives: { type: 'array', items: { type: 'string' } },
              topics: { type: 'array', items: { type: 'string' } },
              targetAudience: { type: 'array', items: { type: 'string' } },
              prerequisites: { type: 'array', items: { type: 'string' } },
              assessmentRequired: { type: 'boolean' }
            }
          }
        },
        topicsCovered: { type: 'array', items: { type: 'string' } },
        complianceAlignment: {
          type: 'object',
          properties: {
            ISO27001: { type: 'array', items: { type: 'string' } },
            NIST: { type: 'array', items: { type: 'string' } },
            PCIDSS: { type: 'array', items: { type: 'string' } },
            SOC2: { type: 'array', items: { type: 'string' } }
          }
        },
        totalDuration: { type: 'string', description: 'Total estimated duration for complete program' },
        programRoadmap: { type: 'string' },
        gamificationElements: { type: 'array', items: { type: 'string' } },
        accessibilityFeatures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-training', 'program-design']
}));

// Phase 3: Content Development
export const contentDevelopmentTask = defineTask('content-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop training content and materials',
  agent: {
    name: 'content-developer',
    prompt: {
      role: 'security training content developer',
      task: 'Develop comprehensive training content and learning materials',
      context: args,
      instructions: [
        'Create engaging training content for each module',
        'Develop presentation slides with clear visuals',
        'Create video scripts for video-based learning',
        'Write comprehensive training guides and handouts',
        'Develop interactive scenarios and case studies',
        'Create realistic examples and security incidents',
        'Design infographics and visual aids',
        'Develop hands-on exercises and simulations',
        'Create quick reference guides and cheat sheets',
        'Develop security policy templates and documentation',
        'Include real-world examples and news stories',
        'Create downloadable resources and job aids',
        'Ensure content is engaging and non-technical where appropriate',
        'Include gamification elements (badges, points, leaderboards)',
        'Ensure accessibility compliance (alt text, captions, transcripts)',
        'Localize content for different languages if needed',
        'Create content in multiple formats (video, text, interactive)',
        'Ensure consistent branding and visual identity',
        'Save all training materials to output directory'
      ],
      outputFormat: 'JSON with materials, interactiveElements, formats, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'interactiveElements', 'formats', 'artifacts'],
      properties: {
        materials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['presentation', 'video', 'document', 'interactive', 'infographic', 'guide', 'scenario', 'exercise'] },
              title: { type: 'string' },
              module: { type: 'string' },
              duration: { type: 'string' },
              format: { type: 'string' },
              targetAudience: { type: 'array', items: { type: 'string' } },
              path: { type: 'string' }
            }
          }
        },
        interactiveElements: { type: 'number', description: 'Count of interactive elements created' },
        scenarios: { type: 'array', items: { type: 'object' } },
        visualAids: { type: 'array', items: { type: 'string' } },
        formats: { type: 'array', items: { type: 'string' } },
        downloadableResources: { type: 'array', items: { type: 'string' } },
        gamificationAssets: { type: 'array', items: { type: 'object' } },
        accessibilityCompliance: { type: 'boolean' },
        languagesSupported: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-training', 'content-development']
}));

// Phase 4: Role-Based Customization
export const roleBasedCustomizationTask = defineTask('role-based-customization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create role-based training tracks',
  agent: {
    name: 'role-specialist',
    prompt: {
      role: 'security training customization specialist',
      task: 'Create customized training tracks for different roles and audiences',
      context: args,
      instructions: [
        'Create role-specific training tracks',
        'All Employees: general security awareness, password security, phishing, social engineering, data handling',
        'Developers: secure coding, OWASP Top 10, code review, dependency management, secrets management',
        'IT/System Admins: access control, patch management, system hardening, incident response, log monitoring',
        'Executives/Management: security governance, risk management, compliance, budget, business impact',
        'HR/Finance: PII protection, financial fraud, vendor security, background checks, insider threats',
        'Customer Support: social engineering, data privacy, customer verification, incident reporting',
        'Customize content depth and technical level per role',
        'Include role-specific scenarios and case studies',
        'Add relevant compliance requirements per role',
        'Create role-specific assessments and certifications',
        'Develop role-specific reference materials',
        'Ensure appropriate time commitment per role',
        'Document role-based training requirements',
        'Save role-specific materials to output directory'
      ],
      outputFormat: 'JSON with trainingTracks, roleMaterials, customizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trainingTracks', 'roleMaterials', 'artifacts'],
      properties: {
        trainingTracks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              modules: { type: 'array', items: { type: 'string' } },
              totalDuration: { type: 'string' },
              difficulty: { type: 'string' },
              mandatoryModules: { type: 'array', items: { type: 'string' } },
              optionalModules: { type: 'array', items: { type: 'string' } },
              customContent: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        roleMaterials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              title: { type: 'string' },
              targetRole: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        scenariosByRole: { type: 'array', items: { type: 'object' } },
        complianceByRole: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-training', 'role-based']
}));

// Phase 5: Phishing Simulation
export const phishingSimulationTask = defineTask('phishing-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop phishing simulation campaign',
  agent: {
    name: 'phishing-specialist',
    prompt: {
      role: 'phishing simulation specialist',
      task: 'Develop comprehensive phishing simulation campaign',
      context: args,
      instructions: [
        'Design realistic phishing email templates',
        'Create multiple difficulty levels (easy, medium, hard, sophisticated)',
        'Easy: obvious spelling errors, generic greetings, suspicious links',
        'Medium: branded templates, urgency tactics, legitimate-looking domains',
        'Hard: targeted spear-phishing, context-aware content, advanced techniques',
        'Include various phishing types: credential harvesting, malware delivery, business email compromise, CEO fraud',
        'Design realistic landing pages for phishing tests',
        'Create educational moments for failed tests',
        'Develop progressive campaign schedule',
        'Plan frequency based on input (weekly, monthly, quarterly)',
        'Design metrics tracking (click rate, credential entry, reporting rate)',
        'Create automated remedial training triggers',
        'Design reporting and analytics dashboard',
        'Include positive reinforcement for correct actions',
        'Plan A/B testing for template effectiveness',
        'Ensure ethical guidelines and employee consent',
        'Create phishing campaign administration guide',
        'Save phishing templates and campaign plan to output directory'
      ],
      outputFormat: 'JSON with simulationTemplates, campaigns, difficultyLevels, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['simulationTemplates', 'campaigns', 'difficultyLevels', 'artifacts'],
      properties: {
        simulationTemplates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['credential-harvest', 'malware-delivery', 'bec', 'ceo-fraud', 'survey', 'invoice'] },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard', 'sophisticated'] },
              subject: { type: 'string' },
              description: { type: 'string' },
              redFlags: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        campaigns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              campaignId: { type: 'string' },
              month: { type: 'number' },
              template: { type: 'string' },
              targetAudience: { type: 'array', items: { type: 'string' } },
              difficulty: { type: 'string' },
              learningObjective: { type: 'string' }
            }
          }
        },
        difficultyLevels: { type: 'array', items: { type: 'string' } },
        metricsTracked: { type: 'array', items: { type: 'string' } },
        reportingEnabled: { type: 'boolean' },
        remedialTraining: { type: 'object' },
        campaignGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-training', 'phishing-simulation']
}));

// Phase 6: Assessment Development
export const assessmentDevelopmentTask = defineTask('assessment-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop knowledge assessments',
  agent: {
    name: 'assessment-designer',
    prompt: {
      role: 'security assessment designer',
      task: 'Develop comprehensive knowledge assessments and quizzes',
      context: args,
      instructions: [
        'Create assessments for each training module',
        'Design multiple assessment types: multiple choice, true/false, scenario-based, hands-on',
        'Include knowledge checks (formative) and final exams (summative)',
        'Create realistic scenario-based questions',
        'Design hands-on practical exercises for technical roles',
        'Develop questions at various difficulty levels',
        'Ensure questions test application, not just memorization',
        'Include explanation for correct and incorrect answers',
        'Design adaptive assessments that adjust difficulty',
        'Create question banks with randomization',
        'Set appropriate passing scores (typically 80% for compliance)',
        'Include time limits for formal assessments',
        'Design pre-assessments to gauge baseline knowledge',
        'Create post-assessments to measure improvement',
        'Ensure questions are unambiguous and clear',
        'Align questions with learning objectives',
        'Include practical security decision-making questions',
        'Save all assessments to output directory'
      ],
      outputFormat: 'JSON with assessments, totalQuestions, questionBank, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessments', 'totalQuestions', 'artifacts'],
      properties: {
        assessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['quiz', 'exam', 'scenario', 'hands-on', 'pre-assessment', 'post-assessment'] },
              module: { type: 'string' },
              questionsCount: { type: 'number' },
              passingScore: { type: 'number' },
              timeLimit: { type: 'string' },
              difficulty: { type: 'string' },
              targetAudience: { type: 'array', items: { type: 'string' } },
              randomized: { type: 'boolean' }
            }
          }
        },
        totalQuestions: { type: 'number' },
        questionBank: {
          type: 'object',
          properties: {
            multipleChoice: { type: 'number' },
            trueFalse: { type: 'number' },
            scenarioBased: { type: 'number' },
            handsOn: { type: 'number' }
          }
        },
        adaptiveAssessments: { type: 'boolean' },
        explanationsIncluded: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-training', 'assessments']
}));

// Phase 7: Certification Setup
export const certificationSetupTask = defineTask('certification-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up certification program',
  agent: {
    name: 'certification-manager',
    prompt: {
      role: 'certification program manager',
      task: 'Set up security awareness certification program and tracking',
      context: args,
      instructions: [
        'Design certification program structure',
        'Create certification levels: Basic Security Awareness, Advanced Security Awareness, Role-Specific Certifications',
        'Define certification requirements (modules completed, assessments passed, minimum scores)',
        'Set certification validity period (typically 12 months)',
        'Design certification renewal process',
        'Create certification badges and digital credentials',
        'Design certification tracking system',
        'Create certification verification mechanism',
        'Develop automated certification issuance process',
        'Design certification expiration reminders',
        'Create certification reporting for compliance',
        'Design certification revocation process if needed',
        'Create certification display options (email signature, profile)',
        'Develop certification transcript system',
        'Ensure compliance with organizational requirements',
        'Create certification program guide',
        'Save certification materials to output directory'
      ],
      outputFormat: 'JSON with certifications, requirements, renewalPeriod, trackingSystem, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['certifications', 'renewalPeriod', 'trackingSystem', 'artifacts'],
      properties: {
        certifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              level: { type: 'string', enum: ['basic', 'advanced', 'role-specific', 'expert'] },
              requirements: {
                type: 'object',
                properties: {
                  modulesRequired: { type: 'array', items: { type: 'string' } },
                  assessmentsRequired: { type: 'array', items: { type: 'string' } },
                  minimumScore: { type: 'number' },
                  practicalExercises: { type: 'number' }
                }
              },
              targetAudience: { type: 'array', items: { type: 'string' } },
              renewalPeriod: { type: 'string' },
              badge: { type: 'string' }
            }
          }
        },
        renewalPeriod: { type: 'string', description: 'Certification validity period' },
        renewalProcess: { type: 'string' },
        trackingSystem: {
          type: 'object',
          properties: {
            automatedIssuance: { type: 'boolean' },
            expirationReminders: { type: 'boolean' },
            verificationMechanism: { type: 'boolean' },
            reportingCapability: { type: 'boolean' }
          }
        },
        digitalBadges: { type: 'array', items: { type: 'string' } },
        certificationGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-training', 'certification']
}));

// Phase 8: LMS Integration
export const lmsIntegrationTask = defineTask('lms-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare LMS integration',
  agent: {
    name: 'lms-specialist',
    prompt: {
      role: 'learning management system specialist',
      task: 'Prepare training content for LMS deployment and integration',
      context: args,
      instructions: [
        'Package content in SCORM 1.2 and SCORM 2004 formats',
        'Create xAPI (Tin Can) packages for advanced tracking',
        'Ensure LTI (Learning Tools Interoperability) compliance',
        'Create course manifests and metadata',
        'Configure progress tracking and completion criteria',
        'Set up grade book integration',
        'Configure automated enrollment rules',
        'Design reporting and analytics integration',
        'Create SSO integration guidelines',
        'Develop API integration documentation',
        'Create user role mapping',
        'Configure notification templates',
        'Design mobile learning compatibility',
        'Create LMS administrator guide',
        'Develop troubleshooting documentation',
        'Test content in common LMS platforms',
        'Save LMS packages and integration guide to output directory'
      ],
      outputFormat: 'JSON with scormPackages, xapiSupport, integrationGuide, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scormPackages', 'xapiSupport', 'integrationGuidePath', 'artifacts'],
      properties: {
        scormPackages: { type: 'number', description: 'Number of SCORM packages created' },
        scormVersions: { type: 'array', items: { type: 'string' } },
        xapiSupport: { type: 'boolean' },
        ltiCompliant: { type: 'boolean' },
        enrollmentRules: { type: 'array', items: { type: 'object' } },
        reportingIntegration: { type: 'boolean' },
        ssoSupport: { type: 'boolean' },
        mobileCompatible: { type: 'boolean' },
        testedPlatforms: { type: 'array', items: { type: 'string' } },
        integrationGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-training', 'lms-integration']
}));

// Phase 9: Delivery Strategy
export const deliveryStrategyTask = defineTask('delivery-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop delivery strategy and rollout plan',
  agent: {
    name: 'delivery-planner',
    prompt: {
      role: 'training delivery strategist',
      task: 'Develop comprehensive delivery strategy and rollout plan',
      context: args,
      instructions: [
        'Design phased rollout approach',
        'Phase 1: Pilot program with small group (50-100 users)',
        'Phase 2: Department-by-department rollout',
        'Phase 3: Full organizational deployment',
        'Define pilot group selection criteria',
        'Create rollout timeline with milestones',
        'Design delivery methods: online self-paced, instructor-led, hybrid, microlearning',
        'Plan in-person sessions for executives and high-risk roles',
        'Schedule periodic refresher training',
        'Design new hire onboarding training',
        'Plan seasonal campaigns (cybersecurity awareness month, tax season, holidays)',
        'Create support model (help desk, FAQ, office hours)',
        'Design escalation procedures for training issues',
        'Plan capacity and resource allocation',
        'Estimate participant numbers per phase',
        'Define success criteria for each phase',
        'Create rollout communication plan',
        'Save rollout plan to output directory'
      ],
      outputFormat: 'JSON with rolloutPhases, timeline, supportModel, estimatedParticipants, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rolloutPhases', 'pilotPhase', 'estimatedParticipants', 'supportModel', 'artifacts'],
      properties: {
        rolloutPhases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'number' },
              name: { type: 'string' },
              targetGroups: { type: 'array', items: { type: 'string' } },
              startDate: { type: 'string' },
              duration: { type: 'string' },
              participants: { type: 'number' },
              deliveryMethod: { type: 'string' },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        pilotPhase: {
          type: 'object',
          properties: {
            groupSize: { type: 'number' },
            selectionCriteria: { type: 'array', items: { type: 'string' } },
            duration: { type: 'string' },
            feedbackMechanisms: { type: 'array', items: { type: 'string' } }
          }
        },
        pilotGroupSize: { type: 'number' },
        estimatedParticipants: { type: 'number' },
        fullDeploymentDate: { type: 'string' },
        deliveryMethods: { type: 'array', items: { type: 'string' } },
        supportModel: {
          type: 'object',
          properties: {
            helpDesk: { type: 'boolean' },
            faq: { type: 'boolean' },
            officeHours: { type: 'string' },
            escalationProcess: { type: 'boolean' }
          }
        },
        rolloutPlanPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-training', 'delivery-strategy']
}));

// Phase 10: Communication Plan
export const communicationPlanTask = defineTask('communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop communication and change management plan',
  agent: {
    name: 'communications-specialist',
    prompt: {
      role: 'training communications specialist',
      task: 'Develop comprehensive communication and change management plan',
      context: args,
      instructions: [
        'Create multi-channel communication strategy',
        'Design program launch announcement',
        'Create executive sponsor messaging',
        'Develop manager talking points and FAQs',
        'Design employee communication campaign',
        'Create email templates for program phases',
        'Design poster and digital signage campaigns',
        'Create intranet content and landing page',
        'Develop reminder and nudge campaigns',
        'Design completion celebration communications',
        'Create ongoing awareness campaigns',
        'Develop change management approach',
        'Address resistance and concerns proactively',
        'Create incentive and recognition programs',
        'Design stakeholder engagement plan',
        'Identify champions and advocates in each department',
        'Create feedback collection mechanisms',
        'Save communication templates to output directory'
      ],
      outputFormat: 'JSON with communicationTemplates, stakeholderGroups, changeManagement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['communicationTemplates', 'stakeholderGroups', 'campaigns', 'artifacts'],
      properties: {
        communicationTemplates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['email', 'poster', 'intranet', 'video', 'executive-memo', 'manager-guide'] },
              title: { type: 'string' },
              audience: { type: 'string' },
              timing: { type: 'string' },
              channel: { type: 'string' }
            }
          }
        },
        stakeholderGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              group: { type: 'string' },
              role: { type: 'string' },
              engagementStrategy: { type: 'string' },
              communicationFrequency: { type: 'string' }
            }
          }
        },
        campaigns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              objective: { type: 'string' },
              timeline: { type: 'string' },
              channels: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        changeManagement: {
          type: 'object',
          properties: {
            resistanceStrategies: { type: 'array', items: { type: 'string' } },
            incentivePrograms: { type: 'array', items: { type: 'string' } },
            championNetwork: { type: 'boolean' }
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
  labels: ['agent', 'security-training', 'communications']
}));

// Phase 11: Metrics Framework
export const metricsFrameworkTask = defineTask('metrics-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up metrics and reporting framework',
  agent: {
    name: 'metrics-analyst',
    prompt: {
      role: 'training metrics analyst',
      task: 'Set up comprehensive metrics and reporting framework',
      context: args,
      instructions: [
        'Define key performance indicators (KPIs)',
        'Participation metrics: enrollment rate, completion rate, time to complete, dropout rate',
        'Knowledge metrics: pre/post assessment scores, improvement rate, passing rate, average scores',
        'Phishing metrics: click rate, credential entry rate, reporting rate, improvement over time',
        'Behavior metrics: policy violations, security incidents, help desk tickets',
        'Certification metrics: certification rate, renewal rate, expiration tracking',
        'Engagement metrics: module ratings, feedback scores, login frequency',
        'Compliance metrics: mandatory training completion, audit readiness',
        'Design executive dashboard (high-level KPIs)',
        'Design manager dashboard (team performance)',
        'Design administrator dashboard (operational metrics)',
        'Create automated reporting schedule (weekly, monthly, quarterly)',
        'Design data visualization and charts',
        'Create benchmark comparisons (industry, historical)',
        'Design alerts and notifications for key metrics',
        'Create compliance audit reports',
        'Save metrics framework documentation to output directory'
      ],
      outputFormat: 'JSON with kpis, dashboards, reportingCadence, benchmarks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'dashboards', 'reportingCadence', 'artifacts'],
      properties: {
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: ['participation', 'knowledge', 'phishing', 'behavior', 'certification', 'engagement', 'compliance'] },
              metric: { type: 'string' },
              target: { type: 'string' },
              measurementFrequency: { type: 'string' },
              dataSource: { type: 'string' }
            }
          }
        },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              audience: { type: 'string', enum: ['executive', 'manager', 'administrator', 'compliance'] },
              metrics: { type: 'array', items: { type: 'string' } },
              visualizations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        reportingCadence: { type: 'string' },
        automatedReports: { type: 'array', items: { type: 'object' } },
        benchmarks: {
          type: 'object',
          properties: {
            industryBenchmarks: { type: 'boolean' },
            historicalComparisons: { type: 'boolean' },
            peerComparisons: { type: 'boolean' }
          }
        },
        alertsConfigured: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-training', 'metrics']
}));

// Phase 12: Effectiveness Measurement
export const effectivenessMeasurementTask = defineTask('effectiveness-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop training effectiveness measurement plan',
  agent: {
    name: 'effectiveness-evaluator',
    prompt: {
      role: 'training effectiveness evaluator',
      task: 'Develop comprehensive training effectiveness measurement plan',
      context: args,
      instructions: [
        'Apply Kirkpatrick\'s Four Levels of Training Evaluation',
        'Level 1 - Reaction: participant satisfaction surveys, feedback forms, module ratings',
        'Level 2 - Learning: pre/post assessments, knowledge improvement, skills demonstration',
        'Level 3 - Behavior: security behavior change, policy adherence, incident reduction, phishing click rates',
        'Level 4 - Results: security incident reduction, cost savings, compliance achievement, risk reduction',
        'Design participant feedback surveys',
        'Create knowledge retention assessments (30/60/90 day)',
        'Plan behavior observation methods',
        'Define business impact metrics',
        'Design longitudinal studies to track long-term effectiveness',
        'Create control groups for comparison where feasible',
        'Plan correlation analysis (training completion vs. incidents)',
        'Design focus groups and interviews',
        'Set effectiveness targets and success criteria',
        'Define evaluation intervals and schedule',
        'Create effectiveness reporting templates',
        'Save effectiveness measurement plan to output directory'
      ],
      outputFormat: 'JSON with measurementMethods, evaluationIntervals, successCriteria, targetImprovement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['measurementMethods', 'evaluationIntervals', 'successCriteria', 'targetImprovement', 'artifacts'],
      properties: {
        measurementMethods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string', enum: ['reaction', 'learning', 'behavior', 'results'] },
              method: { type: 'string' },
              dataSource: { type: 'string' },
              frequency: { type: 'string' },
              responsible: { type: 'string' }
            }
          }
        },
        evaluationIntervals: { type: 'string' },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              target: { type: 'string' },
              measurementMethod: { type: 'string' }
            }
          }
        },
        targetImprovement: {
          type: 'object',
          properties: {
            knowledgeImprovement: { type: 'string' },
            behaviorChange: { type: 'string' },
            incidentReduction: { type: 'string' },
            phishingClickReduction: { type: 'string' }
          }
        },
        feedbackMechanisms: { type: 'array', items: { type: 'string' } },
        longitudinalStudies: { type: 'boolean' },
        controlGroups: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-training', 'effectiveness']
}));

// Phase 13: Continuous Improvement
export const continuousImprovementTask = defineTask('continuous-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish continuous improvement framework',
  agent: {
    name: 'improvement-manager',
    prompt: {
      role: 'training continuous improvement manager',
      task: 'Establish framework for continuous program improvement',
      context: args,
      instructions: [
        'Design regular program review cycles (quarterly)',
        'Create feedback collection and analysis process',
        'Design content update and refresh procedure',
        'Plan threat landscape monitoring and content updates',
        'Create incident-driven content updates (lessons from real incidents)',
        'Design A/B testing methodology for content effectiveness',
        'Plan regular compliance requirement reviews',
        'Create process for incorporating new security topics',
        'Design module retirement and replacement process',
        'Plan technology and tool updates',
        'Create stakeholder feedback loops',
        'Design champion and user advisory board',
        'Plan regular phishing template updates',
        'Create assessment question refresh process',
        'Design program maturity assessment',
        'Define continuous improvement roles and responsibilities',
        'Create improvement tracking and prioritization system',
        'Save continuous improvement plan to output directory'
      ],
      outputFormat: 'JSON with reviewCycles, feedbackMechanisms, updateProcedure, contentRefreshSchedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewCycles', 'feedbackMechanisms', 'updateProcedure', 'contentRefreshSchedule', 'artifacts'],
      properties: {
        reviewCycles: { type: 'string', description: 'Frequency of program reviews' },
        feedbackMechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanism: { type: 'string' },
              frequency: { type: 'string' },
              audience: { type: 'string' },
              analysisProcess: { type: 'string' }
            }
          }
        },
        updateProcedure: {
          type: 'object',
          properties: {
            threatMonitoring: { type: 'boolean' },
            incidentDriven: { type: 'boolean' },
            complianceReviews: { type: 'boolean' },
            abTesting: { type: 'boolean' },
            approvalProcess: { type: 'string' }
          }
        },
        contentRefreshSchedule: {
          type: 'object',
          properties: {
            coreContent: { type: 'string', description: 'Frequency for core content updates' },
            threatContent: { type: 'string', description: 'Frequency for threat-based content updates' },
            phishingTemplates: { type: 'string' },
            assessments: { type: 'string' }
          }
        },
        improvementTracking: { type: 'boolean' },
        advisoryBoard: { type: 'boolean' },
        maturityAssessment: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-training', 'continuous-improvement']
}));

// Phase 14: Program Documentation
export const programDocumentationTask = defineTask('program-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive program documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'training documentation specialist',
      task: 'Generate comprehensive program documentation and playbooks',
      context: args,
      instructions: [
        'Create comprehensive program guide',
        'Document program objectives, structure, and curriculum',
        'Create participant user guide',
        'Develop administrator playbook',
        'Administrator tasks: enrollment, tracking, reporting, troubleshooting',
        'Create manager guide for supporting their teams',
        'Develop instructor guide for facilitated sessions',
        'Create phishing campaign administration guide',
        'Document certification management procedures',
        'Create compliance audit documentation',
        'Develop troubleshooting and FAQ documentation',
        'Create technical integration documentation',
        'Document metrics and reporting procedures',
        'Create program governance documentation',
        'Document roles and responsibilities',
        'Create program maintenance schedule',
        'Generate visual program overview and infographics',
        'Format as professional Markdown documentation',
        'Save all documentation to output directory'
      ],
      outputFormat: 'JSON with programGuidePath, administratorPlaybookPath, documentationArtifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['programGuidePath', 'administratorPlaybookPath', 'artifacts'],
      properties: {
        programGuidePath: { type: 'string' },
        participantGuidePath: { type: 'string' },
        administratorPlaybookPath: { type: 'string' },
        managerGuidePath: { type: 'string' },
        instructorGuidePath: { type: 'string' },
        technicalDocumentationPath: { type: 'string' },
        complianceDocumentationPath: { type: 'string' },
        troubleshootingGuidePath: { type: 'string' },
        governanceDocumentPath: { type: 'string' },
        quickReferenceGuides: { type: 'array', items: { type: 'string' } },
        infographics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-training', 'documentation']
}));
