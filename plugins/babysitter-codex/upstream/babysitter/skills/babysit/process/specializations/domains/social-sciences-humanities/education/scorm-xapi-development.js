/**
 * @process education/scorm-xapi-development
 * @description Creating standards-compliant learning packages for interoperability across LMS platforms with proper tracking and reporting
 * @inputs { courseName: string, contentStructure: object, trackingRequirements: array, targetStandard: string, lmsTarget: string }
 * @outputs { success: boolean, packageSpec: object, trackingConfig: object, testResults: object, artifacts: array }
 * @recommendedSkills SK-EDU-005 (elearning-storyboarding), SK-EDU-007 (lms-configuration-administration)
 * @recommendedAgents AG-EDU-004 (elearning-developer), AG-EDU-005 (learning-technology-administrator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    courseName = 'Course',
    contentStructure = {},
    trackingRequirements = [],
    targetStandard = 'SCORM 2004',
    lmsTarget = 'generic',
    outputDir = 'scorm-xapi-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ${targetStandard} Package Development for ${courseName}`);

  // ============================================================================
  // STANDARD REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Analyzing standard requirements');
  const standardsAnalysis = await ctx.task(standardsRequirementsTask, {
    courseName,
    targetStandard,
    trackingRequirements,
    lmsTarget,
    outputDir
  });

  artifacts.push(...standardsAnalysis.artifacts);

  // ============================================================================
  // CONTENT STRUCTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Designing content structure for standard');
  const structureDesign = await ctx.task(contentStructureDesignTask, {
    courseName,
    contentStructure,
    targetStandard,
    standardsAnalysis: standardsAnalysis.requirements,
    outputDir
  });

  artifacts.push(...structureDesign.artifacts);

  // ============================================================================
  // TRACKING CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Configuring tracking and reporting');
  const trackingConfiguration = await ctx.task(trackingConfigurationTask, {
    courseName,
    targetStandard,
    trackingRequirements,
    structureDesign: structureDesign.design,
    outputDir
  });

  artifacts.push(...trackingConfiguration.artifacts);

  // ============================================================================
  // MANIFEST DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing package manifest');
  const manifestDevelopment = await ctx.task(manifestDevelopmentTask, {
    courseName,
    targetStandard,
    structureDesign: structureDesign.design,
    trackingConfiguration: trackingConfiguration.config,
    outputDir
  });

  artifacts.push(...manifestDevelopment.artifacts);

  // ============================================================================
  // API IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Implementing standard API calls');
  const apiImplementation = await ctx.task(apiImplementationTask, {
    courseName,
    targetStandard,
    trackingConfiguration: trackingConfiguration.config,
    outputDir
  });

  artifacts.push(...apiImplementation.artifacts);

  // ============================================================================
  // PACKAGE TESTING
  // ============================================================================

  ctx.log('info', 'Testing package compliance');
  const packageTesting = await ctx.task(packageTestingTask, {
    courseName,
    targetStandard,
    manifest: manifestDevelopment.manifest,
    apiImplementation: apiImplementation.implementation,
    lmsTarget,
    outputDir
  });

  artifacts.push(...packageTesting.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring package quality');
  const qualityScore = await ctx.task(packageQualityScoringTask, {
    courseName,
    targetStandard,
    standardsAnalysis,
    structureDesign,
    trackingConfiguration,
    manifestDevelopment,
    packageTesting,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review package
  await ctx.breakpoint({
    question: `${targetStandard} package development complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'SCORM/xAPI Package Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        courseName,
        targetStandard,
        testsPassed: packageTesting.results?.passed || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    courseName,
    targetStandard,
    qualityScore: overallScore,
    qualityMet,
    packageSpec: {
      structure: structureDesign.design,
      manifest: manifestDevelopment.manifest
    },
    trackingConfig: trackingConfiguration.config,
    testResults: packageTesting.results,
    artifacts,
    duration,
    metadata: {
      processId: 'education/scorm-xapi-development',
      timestamp: startTime,
      courseName,
      targetStandard,
      outputDir
    }
  };
}

// Task 1: Standards Requirements
export const standardsRequirementsTask = defineTask('standards-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze standard requirements',
  agent: {
    name: 'standards-analyst',
    prompt: {
      role: 'e-learning standards specialist',
      task: 'Analyze requirements for target standard compliance',
      context: args,
      instructions: [
        'Identify target standard version requirements',
        'Document mandatory vs optional elements',
        'Identify LMS-specific requirements',
        'Document data model requirements',
        'Identify sequencing requirements',
        'Document communication requirements',
        'Identify packaging requirements',
        'Note compatibility considerations',
        'Generate standards requirements document'
      ],
      outputFormat: 'JSON with requirements, mandatory, optional, compatibility, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'artifacts'],
      properties: {
        requirements: { type: 'array' },
        mandatory: { type: 'array' },
        optional: { type: 'array' },
        compatibility: { type: 'object' },
        dataModel: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scorm-xapi', 'standards', 'requirements']
}));

// Task 2: Content Structure Design
export const contentStructureDesignTask = defineTask('content-structure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design content structure for standard',
  agent: {
    name: 'structure-designer',
    prompt: {
      role: 'content packaging specialist',
      task: 'Design content structure compliant with target standard',
      context: args,
      instructions: [
        'Design SCO/AU structure',
        'Define content organization',
        'Plan sequencing and navigation',
        'Define completion criteria per item',
        'Plan objective mapping',
        'Design aggregation structure',
        'Document prerequisites',
        'Create content hierarchy',
        'Generate structure design document'
      ],
      outputFormat: 'JSON with design, hierarchy, sequencing, objectives, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        hierarchy: { type: 'object' },
        sequencing: { type: 'object' },
        objectives: { type: 'array' },
        completionCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scorm-xapi', 'structure', 'design']
}));

// Task 3: Tracking Configuration
export const trackingConfigurationTask = defineTask('tracking-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure tracking and reporting',
  agent: {
    name: 'tracking-configurator',
    prompt: {
      role: 'learning analytics specialist',
      task: 'Configure tracking and reporting for standard compliance',
      context: args,
      instructions: [
        'Define completion tracking',
        'Configure score tracking',
        'Set up time tracking',
        'Define interaction tracking',
        'Configure objective tracking',
        'Set up bookmark/suspend data',
        'For xAPI: define statement structure',
        'For xAPI: configure LRS endpoint',
        'Generate tracking configuration document'
      ],
      outputFormat: 'JSON with config, completion, scoring, interactions, statements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        completion: { type: 'object' },
        scoring: { type: 'object' },
        interactions: { type: 'array' },
        statements: { type: 'array' },
        suspendData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scorm-xapi', 'tracking', 'configuration']
}));

// Task 4: Manifest Development
export const manifestDevelopmentTask = defineTask('manifest-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop package manifest',
  agent: {
    name: 'manifest-developer',
    prompt: {
      role: 'package manifest specialist',
      task: 'Develop standards-compliant package manifest',
      context: args,
      instructions: [
        'Create imsmanifest.xml (SCORM) or cmi5.xml',
        'Define metadata elements',
        'Configure organizations element',
        'Define resources and dependencies',
        'Configure sequencing rules (SCORM 2004)',
        'Set up mastery score and completion',
        'Validate manifest against schema',
        'Document manifest structure',
        'Generate manifest document'
      ],
      outputFormat: 'JSON with manifest, metadata, organizations, resources, validation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['manifest', 'artifacts'],
      properties: {
        manifest: { type: 'object' },
        metadata: { type: 'object' },
        organizations: { type: 'object' },
        resources: { type: 'array' },
        sequencing: { type: 'object' },
        validation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scorm-xapi', 'manifest', 'development']
}));

// Task 5: API Implementation
export const apiImplementationTask = defineTask('api-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement standard API calls',
  agent: {
    name: 'api-developer',
    prompt: {
      role: 'e-learning API developer',
      task: 'Implement standard API calls in content',
      context: args,
      instructions: [
        'Implement API initialization',
        'Implement data model get/set calls',
        'Implement commit functionality',
        'Implement termination handling',
        'For xAPI: implement statement sending',
        'For xAPI: implement state API',
        'Handle error conditions',
        'Create API wrapper library',
        'Generate API implementation documentation'
      ],
      outputFormat: 'JSON with implementation, apiCalls, errorHandling, wrapper, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: {
        implementation: { type: 'object' },
        apiCalls: { type: 'array' },
        errorHandling: { type: 'object' },
        wrapper: { type: 'object' },
        codeSnippets: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scorm-xapi', 'api', 'implementation']
}));

// Task 6: Package Testing
export const packageTestingTask = defineTask('package-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test package compliance',
  agent: {
    name: 'package-tester',
    prompt: {
      role: 'e-learning QA specialist',
      task: 'Test package for standards compliance',
      context: args,
      instructions: [
        'Validate package against ADL test suite',
        'Test manifest compliance',
        'Test API communication',
        'Test tracking functionality',
        'Test sequencing behavior',
        'Test on target LMS',
        'Document test results',
        'Identify and document issues',
        'Generate test report'
      ],
      outputFormat: 'JSON with results, passed, failed, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            passed: { type: 'number' },
            failed: { type: 'number' },
            warnings: { type: 'number' }
          }
        },
        testCases: { type: 'array' },
        issues: { type: 'array' },
        recommendations: { type: 'array' },
        lmsResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scorm-xapi', 'testing', 'compliance']
}));

// Task 7: Quality Scoring
export const packageQualityScoringTask = defineTask('package-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score package quality',
  agent: {
    name: 'package-quality-auditor',
    prompt: {
      role: 'e-learning package quality auditor',
      task: 'Assess SCORM/xAPI package quality',
      context: args,
      instructions: [
        'Evaluate standards compliance (weight: 30%)',
        'Assess structure design (weight: 20%)',
        'Review tracking implementation (weight: 20%)',
        'Evaluate manifest quality (weight: 15%)',
        'Assess test results (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Identify quality issues',
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
  labels: ['agent', 'scorm-xapi', 'quality-scoring', 'validation']
}));
