/**
 * @process education/elearning-authoring
 * @description Development of interactive digital learning content using authoring tools following multimedia learning principles
 * @inputs { courseName: string, learningObjectives: array, contentOutline: object, targetPlatform: string, constraints: object }
 * @outputs { success: boolean, coursePackage: object, mediaAssets: array, interactiveElements: array, artifacts: array }
 * @recommendedSkills SK-EDU-005 (elearning-storyboarding), SK-EDU-006 (multimedia-learning-design), SK-EDU-011 (instructional-video-production), SK-EDU-010 (accessibility-compliance-auditing)
 * @recommendedAgents AG-EDU-004 (elearning-developer), AG-EDU-008 (accessibility-udl-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    courseName = 'E-Learning Course',
    learningObjectives = [],
    contentOutline = {},
    targetPlatform = 'web',
    constraints = {},
    outputDir = 'elearning-authoring-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting E-Learning Course Authoring for ${courseName}`);

  // ============================================================================
  // STORYBOARD DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing course storyboard');
  const storyboard = await ctx.task(storyboardDevelopmentTask, {
    courseName,
    learningObjectives,
    contentOutline,
    targetPlatform,
    outputDir
  });

  artifacts.push(...storyboard.artifacts);

  // ============================================================================
  // MULTIMEDIA DESIGN
  // ============================================================================

  ctx.log('info', 'Designing multimedia elements');
  const multimediaDesign = await ctx.task(multimediaDesignTask, {
    courseName,
    storyboard: storyboard.storyboard,
    constraints,
    outputDir
  });

  artifacts.push(...multimediaDesign.artifacts);

  // ============================================================================
  // INTERACTION DESIGN
  // ============================================================================

  ctx.log('info', 'Designing interactive elements');
  const interactionDesign = await ctx.task(interactionDesignTask, {
    courseName,
    storyboard: storyboard.storyboard,
    learningObjectives,
    targetPlatform,
    outputDir
  });

  artifacts.push(...interactionDesign.artifacts);

  // ============================================================================
  // CONTENT DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing course content');
  const contentDevelopment = await ctx.task(contentDevelopmentTask, {
    courseName,
    storyboard: storyboard.storyboard,
    multimediaDesign: multimediaDesign.design,
    interactionDesign: interactionDesign.design,
    outputDir
  });

  artifacts.push(...contentDevelopment.artifacts);

  // ============================================================================
  // ACCESSIBILITY COMPLIANCE
  // ============================================================================

  ctx.log('info', 'Ensuring accessibility compliance');
  const accessibilityCompliance = await ctx.task(accessibilityComplianceTask, {
    courseName,
    content: contentDevelopment.content,
    targetPlatform,
    outputDir
  });

  artifacts.push(...accessibilityCompliance.artifacts);

  // ============================================================================
  // COURSE PACKAGING
  // ============================================================================

  ctx.log('info', 'Packaging course for delivery');
  const coursePackaging = await ctx.task(coursePackagingTask, {
    courseName,
    content: contentDevelopment.content,
    targetPlatform,
    constraints,
    outputDir
  });

  artifacts.push(...coursePackaging.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring e-learning course quality');
  const qualityScore = await ctx.task(elearningQualityScoringTask, {
    courseName,
    storyboard,
    multimediaDesign,
    interactionDesign,
    contentDevelopment,
    accessibilityCompliance,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review e-learning course
  await ctx.breakpoint({
    question: `E-learning course authoring complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'E-Learning Course Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        courseName,
        targetPlatform,
        totalModules: storyboard.storyboard?.modules?.length || 0,
        totalInteractions: interactionDesign.design?.interactions?.length || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    courseName,
    targetPlatform,
    qualityScore: overallScore,
    qualityMet,
    coursePackage: coursePackaging.package,
    mediaAssets: multimediaDesign.assets,
    interactiveElements: interactionDesign.design.interactions,
    accessibilityReport: accessibilityCompliance.report,
    artifacts,
    duration,
    metadata: {
      processId: 'education/elearning-authoring',
      timestamp: startTime,
      courseName,
      targetPlatform,
      outputDir
    }
  };
}

// Task 1: Storyboard Development
export const storyboardDevelopmentTask = defineTask('storyboard-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop course storyboard',
  agent: {
    name: 'storyboard-developer',
    prompt: {
      role: 'e-learning storyboard specialist',
      task: 'Develop detailed storyboard for e-learning course',
      context: args,
      instructions: [
        'Create screen-by-screen storyboard',
        'Define navigation flow',
        'Specify on-screen text and narration',
        'Plan visual elements for each screen',
        'Define interaction points',
        'Plan assessment integration points',
        'Apply multimedia learning principles',
        'Document timing and pacing',
        'Generate storyboard document'
      ],
      outputFormat: 'JSON with storyboard, navigation, timing, mediaSpecs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['storyboard', 'artifacts'],
      properties: {
        storyboard: {
          type: 'object',
          properties: {
            modules: { type: 'array' },
            screens: { type: 'array' },
            navigation: { type: 'object' }
          }
        },
        navigation: { type: 'object' },
        timing: { type: 'object' },
        mediaSpecs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'elearning', 'storyboard', 'development']
}));

// Task 2: Multimedia Design
export const multimediaDesignTask = defineTask('multimedia-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design multimedia elements',
  agent: {
    name: 'multimedia-designer',
    prompt: {
      role: 'multimedia learning designer',
      task: 'Design multimedia elements following Mayer\'s principles',
      context: args,
      instructions: [
        'Apply coherence principle (remove extraneous content)',
        'Apply signaling principle (highlight key information)',
        'Apply redundancy principle (avoid redundant text)',
        'Apply spatial contiguity (place related items together)',
        'Apply temporal contiguity (synchronize narration and graphics)',
        'Design graphics and animations',
        'Plan audio/narration scripts',
        'Create visual style guide',
        'Generate multimedia specification document'
      ],
      outputFormat: 'JSON with design, assets, principles, styleGuide, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'assets', 'artifacts'],
      properties: {
        design: { type: 'object' },
        assets: { type: 'array' },
        principles: { type: 'array' },
        styleGuide: { type: 'object' },
        scripts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'elearning', 'multimedia', 'design']
}));

// Task 3: Interaction Design
export const interactionDesignTask = defineTask('interaction-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design interactive elements',
  agent: {
    name: 'interaction-designer',
    prompt: {
      role: 'e-learning interaction designer',
      task: 'Design engaging interactive learning elements',
      context: args,
      instructions: [
        'Design click-to-reveal interactions',
        'Create drag-and-drop activities',
        'Design knowledge check interactions',
        'Create scenario-based interactions',
        'Design branching scenarios',
        'Plan gamification elements',
        'Create feedback mechanisms',
        'Design progress tracking interactions',
        'Generate interaction specification document'
      ],
      outputFormat: 'JSON with design, interactions, feedback, gamification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: {
          type: 'object',
          properties: {
            interactions: { type: 'array' },
            patterns: { type: 'array' }
          }
        },
        interactions: { type: 'array' },
        feedback: { type: 'object' },
        gamification: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'elearning', 'interaction', 'design']
}));

// Task 4: Content Development
export const contentDevelopmentTask = defineTask('content-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop course content',
  agent: {
    name: 'content-developer',
    prompt: {
      role: 'e-learning content developer',
      task: 'Develop course content following storyboard',
      context: args,
      instructions: [
        'Write on-screen text content',
        'Develop narration scripts',
        'Create quiz questions and feedback',
        'Write scenario content',
        'Develop job aids and resources',
        'Create glossary entries',
        'Write help documentation',
        'Develop print materials',
        'Generate content package'
      ],
      outputFormat: 'JSON with content, scripts, quizzes, resources, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['content', 'artifacts'],
      properties: {
        content: { type: 'object' },
        scripts: { type: 'array' },
        quizzes: { type: 'array' },
        resources: { type: 'array' },
        glossary: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'elearning', 'content', 'development']
}));

// Task 5: Accessibility Compliance
export const accessibilityComplianceTask = defineTask('accessibility-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Ensure accessibility compliance',
  agent: {
    name: 'accessibility-specialist',
    prompt: {
      role: 'digital accessibility specialist',
      task: 'Ensure course meets accessibility standards',
      context: args,
      instructions: [
        'Review WCAG 2.1 compliance',
        'Check Section 508 compliance',
        'Verify keyboard navigation',
        'Review screen reader compatibility',
        'Check color contrast ratios',
        'Verify alternative text for images',
        'Review caption/transcript availability',
        'Check focus indicators',
        'Generate accessibility report'
      ],
      outputFormat: 'JSON with report, compliance, issues, remediation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'artifacts'],
      properties: {
        report: { type: 'object' },
        compliance: { type: 'object' },
        issues: { type: 'array' },
        remediation: { type: 'array' },
        checklist: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'elearning', 'accessibility', 'compliance']
}));

// Task 6: Course Packaging
export const coursePackagingTask = defineTask('course-packaging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Package course for delivery',
  agent: {
    name: 'course-packager',
    prompt: {
      role: 'e-learning packaging specialist',
      task: 'Package course for deployment to target platform',
      context: args,
      instructions: [
        'Compile all course assets',
        'Configure SCORM/xAPI packaging',
        'Set up tracking and reporting',
        'Create course manifest',
        'Test package functionality',
        'Optimize file sizes',
        'Create deployment documentation',
        'Generate test reports',
        'Create final delivery package'
      ],
      outputFormat: 'JSON with package, manifest, tracking, testing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['package', 'artifacts'],
      properties: {
        package: { type: 'object' },
        manifest: { type: 'object' },
        tracking: { type: 'object' },
        testing: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'elearning', 'packaging', 'deployment']
}));

// Task 7: Quality Scoring
export const elearningQualityScoringTask = defineTask('elearning-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score e-learning course quality',
  agent: {
    name: 'elearning-quality-auditor',
    prompt: {
      role: 'e-learning quality auditor',
      task: 'Assess e-learning course quality',
      context: args,
      instructions: [
        'Evaluate storyboard completeness (weight: 20%)',
        'Assess multimedia design quality (weight: 20%)',
        'Review interaction effectiveness (weight: 20%)',
        'Evaluate content quality (weight: 20%)',
        'Assess accessibility compliance (weight: 20%)',
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
  labels: ['agent', 'elearning', 'quality-scoring', 'validation']
}));
