/**
 * @process education/lms-administration
 * @description Systematic setup, configuration, and management of learning management systems including user roles, integrations, and course templates
 * @inputs { lmsPlatform: string, organization: object, requirements: array, integrations: array, constraints: object }
 * @outputs { success: boolean, configuration: object, templates: array, documentation: object, artifacts: array }
 * @recommendedSkills SK-EDU-007 (lms-configuration-administration), SK-EDU-010 (accessibility-compliance-auditing)
 * @recommendedAgents AG-EDU-005 (learning-technology-administrator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    lmsPlatform = 'generic',
    organization = {},
    requirements = [],
    integrations = [],
    constraints = {},
    outputDir = 'lms-administration-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting LMS Administration and Configuration for ${lmsPlatform}`);

  // ============================================================================
  // REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Analyzing LMS requirements');
  const requirementsAnalysis = await ctx.task(lmsRequirementsAnalysisTask, {
    lmsPlatform,
    organization,
    requirements,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // USER ROLE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Configuring user roles and permissions');
  const roleConfiguration = await ctx.task(userRoleConfigurationTask, {
    lmsPlatform,
    organization,
    requirements: requirementsAnalysis.processedRequirements,
    outputDir
  });

  artifacts.push(...roleConfiguration.artifacts);

  // ============================================================================
  // COURSE TEMPLATE DESIGN
  // ============================================================================

  ctx.log('info', 'Designing course templates');
  const templateDesign = await ctx.task(courseTemplateDesignTask, {
    lmsPlatform,
    organization,
    requirements: requirementsAnalysis.processedRequirements,
    outputDir
  });

  artifacts.push(...templateDesign.artifacts);

  // ============================================================================
  // INTEGRATION SETUP
  // ============================================================================

  ctx.log('info', 'Setting up integrations');
  const integrationSetup = await ctx.task(integrationSetupTask, {
    lmsPlatform,
    integrations,
    constraints,
    outputDir
  });

  artifacts.push(...integrationSetup.artifacts);

  // ============================================================================
  // BRANDING AND CUSTOMIZATION
  // ============================================================================

  ctx.log('info', 'Configuring branding and customization');
  const brandingConfiguration = await ctx.task(brandingConfigurationTask, {
    lmsPlatform,
    organization,
    constraints,
    outputDir
  });

  artifacts.push(...brandingConfiguration.artifacts);

  // ============================================================================
  // DOCUMENTATION CREATION
  // ============================================================================

  ctx.log('info', 'Creating administration documentation');
  const documentation = await ctx.task(lmsDocumentationTask, {
    lmsPlatform,
    roleConfiguration,
    templateDesign,
    integrationSetup,
    brandingConfiguration,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring LMS configuration quality');
  const qualityScore = await ctx.task(lmsQualityScoringTask, {
    lmsPlatform,
    requirementsAnalysis,
    roleConfiguration,
    templateDesign,
    integrationSetup,
    documentation,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review LMS configuration
  await ctx.breakpoint({
    question: `LMS configuration complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'LMS Administration Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        lmsPlatform,
        totalRoles: roleConfiguration.roles?.length || 0,
        totalTemplates: templateDesign.templates?.length || 0,
        totalIntegrations: integrationSetup.integrations?.length || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    lmsPlatform,
    qualityScore: overallScore,
    qualityMet,
    configuration: {
      roles: roleConfiguration.roles,
      permissions: roleConfiguration.permissions,
      integrations: integrationSetup.integrations,
      branding: brandingConfiguration.branding
    },
    templates: templateDesign.templates,
    documentation: documentation.docs,
    artifacts,
    duration,
    metadata: {
      processId: 'education/lms-administration',
      timestamp: startTime,
      lmsPlatform,
      outputDir
    }
  };
}

// Task 1: LMS Requirements Analysis
export const lmsRequirementsAnalysisTask = defineTask('lms-requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze LMS requirements',
  agent: {
    name: 'lms-analyst',
    prompt: {
      role: 'LMS implementation specialist',
      task: 'Analyze requirements for LMS setup and configuration',
      context: args,
      instructions: [
        'Identify organizational needs for LMS',
        'Document user populations and their needs',
        'Identify course delivery requirements',
        'Document reporting and analytics needs',
        'Identify compliance requirements',
        'Document integration requirements',
        'Identify scalability needs',
        'Document accessibility requirements',
        'Generate requirements analysis document'
      ],
      outputFormat: 'JSON with processedRequirements, userNeeds, deliveryRequirements, complianceNeeds, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['processedRequirements', 'artifacts'],
      properties: {
        processedRequirements: { type: 'array' },
        userNeeds: { type: 'object' },
        deliveryRequirements: { type: 'array' },
        complianceNeeds: { type: 'array' },
        scalabilityNeeds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lms', 'requirements', 'analysis']
}));

// Task 2: User Role Configuration
export const userRoleConfigurationTask = defineTask('user-role-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure user roles and permissions',
  agent: {
    name: 'role-configurator',
    prompt: {
      role: 'LMS security specialist',
      task: 'Configure user roles and permissions for LMS',
      context: args,
      instructions: [
        'Define user roles (admin, instructor, student, TA, etc.)',
        'Configure permissions for each role',
        'Set up role hierarchies',
        'Define custom roles if needed',
        'Configure enrollment settings',
        'Set up user authentication',
        'Document role definitions',
        'Create role assignment workflows',
        'Generate role configuration document'
      ],
      outputFormat: 'JSON with roles, permissions, hierarchies, enrollment, authentication, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roles', 'permissions', 'artifacts'],
      properties: {
        roles: { type: 'array' },
        permissions: { type: 'object' },
        hierarchies: { type: 'object' },
        enrollment: { type: 'object' },
        authentication: { type: 'object' },
        workflows: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lms', 'roles', 'permissions']
}));

// Task 3: Course Template Design
export const courseTemplateDesignTask = defineTask('course-template-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design course templates',
  agent: {
    name: 'template-designer',
    prompt: {
      role: 'instructional template designer',
      task: 'Design reusable course templates for LMS',
      context: args,
      instructions: [
        'Design standard course structure template',
        'Create module/unit templates',
        'Design assignment templates',
        'Create discussion forum templates',
        'Design quiz/assessment templates',
        'Create announcement templates',
        'Design gradebook configuration',
        'Create course navigation templates',
        'Generate template documentation'
      ],
      outputFormat: 'JSON with templates, structures, navigation, gradebook, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['templates', 'artifacts'],
      properties: {
        templates: { type: 'array' },
        structures: { type: 'object' },
        navigation: { type: 'object' },
        gradebook: { type: 'object' },
        copyableElements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lms', 'templates', 'design']
}));

// Task 4: Integration Setup
export const integrationSetupTask = defineTask('integration-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up LMS integrations',
  agent: {
    name: 'integration-specialist',
    prompt: {
      role: 'LMS integration specialist',
      task: 'Set up and configure LMS integrations',
      context: args,
      instructions: [
        'Configure SIS (Student Information System) integration',
        'Set up authentication integrations (SSO, LDAP)',
        'Configure LTI tool integrations',
        'Set up video conferencing integration',
        'Configure plagiarism detection integration',
        'Set up analytics integrations',
        'Configure content repository integrations',
        'Document API configurations',
        'Generate integration documentation'
      ],
      outputFormat: 'JSON with integrations, configurations, apis, testing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integrations', 'artifacts'],
      properties: {
        integrations: { type: 'array' },
        configurations: { type: 'object' },
        apis: { type: 'array' },
        testing: { type: 'object' },
        troubleshooting: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lms', 'integrations', 'setup']
}));

// Task 5: Branding Configuration
export const brandingConfigurationTask = defineTask('branding-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure branding and customization',
  agent: {
    name: 'branding-configurator',
    prompt: {
      role: 'LMS customization specialist',
      task: 'Configure LMS branding and visual customization',
      context: args,
      instructions: [
        'Configure logo and favicon',
        'Set up color scheme and theme',
        'Customize login page',
        'Configure dashboard layout',
        'Set up custom CSS if supported',
        'Configure email templates',
        'Customize terminology/labels',
        'Set up custom footer/header',
        'Generate branding documentation'
      ],
      outputFormat: 'JSON with branding, theme, customizations, templates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['branding', 'artifacts'],
      properties: {
        branding: { type: 'object' },
        theme: { type: 'object' },
        customizations: { type: 'array' },
        templates: { type: 'array' },
        styleGuide: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lms', 'branding', 'customization']
}));

// Task 6: Documentation Creation
export const lmsDocumentationTask = defineTask('lms-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create LMS administration documentation',
  agent: {
    name: 'documentation-writer',
    prompt: {
      role: 'technical documentation specialist',
      task: 'Create comprehensive LMS administration documentation',
      context: args,
      instructions: [
        'Create administrator guide',
        'Write instructor quick start guide',
        'Create student user guide',
        'Document troubleshooting procedures',
        'Create FAQ documentation',
        'Write backup and recovery procedures',
        'Document security protocols',
        'Create training materials',
        'Generate documentation package'
      ],
      outputFormat: 'JSON with docs, guides, procedures, training, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['docs', 'artifacts'],
      properties: {
        docs: { type: 'object' },
        guides: { type: 'array' },
        procedures: { type: 'array' },
        training: { type: 'array' },
        faqs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lms', 'documentation', 'guides']
}));

// Task 7: Quality Scoring
export const lmsQualityScoringTask = defineTask('lms-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score LMS configuration quality',
  agent: {
    name: 'lms-quality-auditor',
    prompt: {
      role: 'LMS quality auditor',
      task: 'Assess LMS configuration quality',
      context: args,
      instructions: [
        'Evaluate requirements coverage (weight: 20%)',
        'Assess role configuration completeness (weight: 20%)',
        'Review template quality (weight: 20%)',
        'Evaluate integration setup (weight: 20%)',
        'Assess documentation completeness (weight: 20%)',
        'Calculate weighted overall score (0-100)',
        'Identify configuration issues',
        'Provide improvement recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lms', 'quality-scoring', 'validation']
}));
