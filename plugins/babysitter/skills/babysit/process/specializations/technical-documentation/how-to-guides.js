/**
 * @process technical-documentation/how-to-guides
 * @description Task-oriented how-to guide development process with task analysis, goal-oriented content structure, step-by-step instructions, validation, and usability testing
 * @inputs { guideTopic: string, targetAudience: object, userTasks: array, prerequisites: array, tools: array, constraints: object }
 * @outputs { success: boolean, guideDocument: string, qualityScore: number, usabilityTestResults: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    guideTopic = '',
    targetAudience = {},
    userTasks = [],
    prerequisites = [],
    tools = [],
    constraints = {},
    outputDir = 'how-to-guides-output',
    platform = '',
    includeScreenshots = true,
    includeTroubleshooting = true,
    targetCompletionTime = '15-20 minutes'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting How-To Guide Development: ${guideTopic}`);

  // ============================================================================
  // PHASE 1: TASK ANALYSIS AND GOAL DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing user tasks and defining guide goals');
  const taskAnalysis = await ctx.task(taskAnalysisTask, {
    guideTopic,
    targetAudience,
    userTasks,
    prerequisites,
    platform,
    outputDir
  });

  artifacts.push(...taskAnalysis.artifacts);

  if (!taskAnalysis.taskIsActionable) {
    ctx.log('warn', 'Task is not suitable for how-to guide format - recommend alternative documentation type');
    return {
      success: false,
      reason: 'Task is not suitable for how-to guide',
      recommendation: taskAnalysis.recommendation,
      alternativeDocType: taskAnalysis.alternativeDocType,
      metadata: {
        processId: 'technical-documentation/how-to-guides',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: PREREQUISITES AND CONTEXT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying prerequisites and required context');
  const prerequisitesAnalysis = await ctx.task(prerequisitesAnalysisTask, {
    guideTopic,
    targetAudience,
    taskAnalysis,
    prerequisites,
    tools,
    platform,
    outputDir
  });

  artifacts.push(...prerequisitesAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: STEP-BY-STEP PROCEDURE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing step-by-step procedure');
  const procedureDevelopment = await ctx.task(procedureDevelopmentTask, {
    guideTopic,
    taskAnalysis,
    prerequisitesAnalysis,
    tools,
    platform,
    includeScreenshots,
    targetCompletionTime,
    outputDir
  });

  artifacts.push(...procedureDevelopment.artifacts);

  // ============================================================================
  // PHASE 4: EXPECTED OUTCOMES AND SUCCESS CRITERIA
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining expected outcomes and success criteria');
  const outcomesDefinition = await ctx.task(outcomesDefinitionTask, {
    guideTopic,
    taskAnalysis,
    procedureDevelopment,
    outputDir
  });

  artifacts.push(...outcomesDefinition.artifacts);

  // ============================================================================
  // PHASE 5: TROUBLESHOOTING SECTION DEVELOPMENT
  // ============================================================================

  let troubleshootingSection = null;
  if (includeTroubleshooting) {
    ctx.log('info', 'Phase 5: Developing troubleshooting section');
    troubleshootingSection = await ctx.task(troubleshootingSectionTask, {
      guideTopic,
      procedureDevelopment,
      taskAnalysis,
      platform,
      outputDir
    });

    artifacts.push(...troubleshootingSection.artifacts);
  }

  // ============================================================================
  // PHASE 6: VISUAL ASSET CREATION (SCREENSHOTS/DIAGRAMS)
  // ============================================================================

  let visualAssets = null;
  if (includeScreenshots) {
    ctx.log('info', 'Phase 6: Planning visual assets and screenshots');
    visualAssets = await ctx.task(visualAssetsTask, {
      guideTopic,
      procedureDevelopment,
      platform,
      outputDir
    });

    artifacts.push(...visualAssets.artifacts);
  }

  // ============================================================================
  // PHASE 7: GUIDE DOCUMENT COMPOSITION
  // ============================================================================

  ctx.log('info', 'Phase 7: Composing comprehensive how-to guide document');
  const guideDocument = await ctx.task(guideDocumentCompositionTask, {
    guideTopic,
    targetAudience,
    taskAnalysis,
    prerequisitesAnalysis,
    procedureDevelopment,
    outcomesDefinition,
    troubleshootingSection,
    visualAssets,
    constraints,
    outputDir
  });

  artifacts.push(...guideDocument.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY SCORING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating guide quality and completeness');
  const qualityScore = await ctx.task(guideQualityScoringTask, {
    guideTopic,
    taskAnalysis,
    prerequisitesAnalysis,
    procedureDevelopment,
    outcomesDefinition,
    guideDocument,
    targetCompletionTime,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= 85;

  // Breakpoint: Review how-to guide draft
  await ctx.breakpoint({
    question: `How-to guide "${guideTopic}" draft complete. Quality score: ${overallScore}/100. ${qualityMet ? 'Guide meets quality standards!' : 'Guide may need refinement.'} Review draft?`,
    title: 'How-To Guide Draft Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        guideTopic,
        qualityScore: overallScore,
        qualityMet,
        totalSteps: procedureDevelopment.steps.length,
        estimatedTime: procedureDevelopment.estimatedCompletionTime,
        prerequisitesCount: prerequisitesAnalysis.prerequisites.length,
        screenshotsPlanned: visualAssets ? visualAssets.screenshots.length : 0,
        troubleshootingItemsCount: troubleshootingSection ? troubleshootingSection.commonIssues.length : 0
      }
    }
  });

  // ============================================================================
  // PHASE 9: USABILITY TESTING SIMULATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Simulating usability testing');
  const usabilityTest = await ctx.task(usabilityTestingTask, {
    guideTopic,
    guideDocument,
    targetAudience,
    procedureDevelopment,
    outputDir
  });

  artifacts.push(...usabilityTest.artifacts);

  // ============================================================================
  // PHASE 10: REVISION AND REFINEMENT (if needed)
  // ============================================================================

  let finalGuide = guideDocument;
  if (!qualityMet || !usabilityTest.testPassed) {
    ctx.log('info', 'Phase 10: Revising guide based on feedback');
    const revision = await ctx.task(guideRevisionTask, {
      guideTopic,
      guideDocument,
      qualityScore,
      usabilityTest,
      outputDir
    });

    finalGuide = revision;
    artifacts.push(...revision.artifacts);
  }

  // ============================================================================
  // PHASE 11: METADATA AND TAGGING
  // ============================================================================

  ctx.log('info', 'Phase 11: Adding metadata and search tags');
  const metadataEnrichment = await ctx.task(metadataEnrichmentTask, {
    guideTopic,
    taskAnalysis,
    targetAudience,
    prerequisitesAnalysis,
    tools,
    platform,
    outputDir
  });

  artifacts.push(...metadataEnrichment.artifacts);

  // Final breakpoint: Approve and publish
  await ctx.breakpoint({
    question: `How-to guide "${guideTopic}" complete and validated. Usability score: ${usabilityTest.usabilityScore}/100. Ready to publish?`,
    title: 'How-To Guide Publication Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        guideTopic,
        qualityScore: overallScore,
        usabilityScore: usabilityTest.usabilityScore,
        testPassed: usabilityTest.testPassed,
        totalSteps: procedureDevelopment.steps.length,
        estimatedTime: procedureDevelopment.estimatedCompletionTime,
        tags: metadataEnrichment.tags
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    guideTopic,
    guideDocument: finalGuide.documentPath,
    qualityScore: overallScore,
    qualityMet,
    usabilityTestResults: {
      usabilityScore: usabilityTest.usabilityScore,
      testPassed: usabilityTest.testPassed,
      completionRate: usabilityTest.completionRate,
      averageCompletionTime: usabilityTest.averageCompletionTime,
      issuesIdentified: usabilityTest.issuesIdentified.length
    },
    taskAnalysis: {
      primaryGoal: taskAnalysis.primaryGoal,
      userIntent: taskAnalysis.userIntent,
      complexity: taskAnalysis.complexity,
      estimatedTime: procedureDevelopment.estimatedCompletionTime
    },
    prerequisites: {
      total: prerequisitesAnalysis.prerequisites.length,
      knowledgePrereqs: prerequisitesAnalysis.knowledgePrerequisites.length,
      systemPrereqs: prerequisitesAnalysis.systemPrerequisites.length
    },
    procedure: {
      totalSteps: procedureDevelopment.steps.length,
      criticalSteps: procedureDevelopment.criticalSteps,
      optionalSteps: procedureDevelopment.optionalSteps.length
    },
    visualAssets: visualAssets ? {
      screenshotsPlanned: visualAssets.screenshots.length,
      diagramsPlanned: visualAssets.diagrams.length
    } : null,
    troubleshooting: troubleshootingSection ? {
      commonIssuesCount: troubleshootingSection.commonIssues.length,
      faqCount: troubleshootingSection.faqs.length
    } : null,
    metadata: metadataEnrichment.metadata,
    tags: metadataEnrichment.tags,
    artifacts,
    duration,
    metadata: {
      processId: 'technical-documentation/how-to-guides',
      timestamp: startTime,
      guideTopic,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Task Analysis and Goal Definition
export const taskAnalysisTask = defineTask('task-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze user task and define guide goals',
  agent: {
    name: 'ux-researcher',
    prompt: {
      role: 'UX researcher and technical writing specialist',
      task: 'Analyze user task to determine if it is suitable for a how-to guide and define clear, actionable goals',
      context: args,
      instructions: [
        'Evaluate if task is suitable for how-to guide format:',
        '  - How-to guides are TASK-ORIENTED: focused on achieving a specific user goal',
        '  - User has a clear problem to solve or task to accomplish',
        '  - Steps are sequential and actionable',
        '  - Has a clear completion point and measurable outcome',
        'NOT suitable for how-to: concepts/explanations (use explanation guide), exploration (use tutorial)',
        'Define the primary user goal: "As a [user], I want to [accomplish task] so that [benefit]"',
        'Identify user intent and context: why is user trying to accomplish this?',
        'Assess task complexity: simple (< 5 steps), moderate (5-15 steps), complex (> 15 steps)',
        'Identify task dependencies and prerequisites',
        'Determine target audience skill level required',
        'Define success criteria: how will user know they succeeded?',
        'Estimate realistic task completion time',
        'If not suitable, recommend alternative documentation type',
        'Save task analysis to output directory'
      ],
      outputFormat: 'JSON with taskIsActionable (boolean), primaryGoal (string), userIntent (string), complexity (string), targetSkillLevel (string), successCriteria (array), estimatedTime (string), recommendation (string), alternativeDocType (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['taskIsActionable', 'primaryGoal', 'complexity', 'successCriteria', 'artifacts'],
      properties: {
        taskIsActionable: { type: 'boolean' },
        primaryGoal: { type: 'string' },
        userIntent: { type: 'string' },
        complexity: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
        targetSkillLevel: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
        successCriteria: { type: 'array', items: { type: 'string' } },
        estimatedTime: { type: 'string' },
        taskDependencies: { type: 'array', items: { type: 'string' } },
        userStoryFormat: { type: 'string' },
        recommendation: { type: 'string' },
        alternativeDocType: { type: 'string', enum: ['tutorial', 'explanation', 'reference', 'concept'] },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'how-to-guide', 'task-analysis']
}));

// Task 2: Prerequisites Analysis
export const prerequisitesAnalysisTask = defineTask('prerequisites-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify prerequisites and required context',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'senior technical writer',
      task: 'Identify all prerequisites, required knowledge, tools, and system requirements needed before user can start the task',
      context: args,
      instructions: [
        'Identify knowledge prerequisites:',
        '  - Concepts user must understand before starting',
        '  - Skills or experience required',
        '  - Related guides user should read first',
        'Identify system prerequisites:',
        '  - Software/tools required with version requirements',
        '  - Hardware requirements if applicable',
        '  - Account/subscription requirements',
        '  - Access permissions needed',
        'Identify environmental prerequisites:',
        '  - Operating system or platform constraints',
        '  - Network/connectivity requirements',
        '  - Configuration settings needed',
        'Organize prerequisites by criticality: required vs. recommended',
        'Provide installation/setup instructions or links for each prerequisite',
        'Estimate setup time for prerequisites',
        'Identify potential blockers and alternatives',
        'Save prerequisites analysis to output directory'
      ],
      outputFormat: 'JSON with prerequisites (array), knowledgePrerequisites (array), systemPrerequisites (array), environmentPrerequisites (array), setupTime (string), blockers (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prerequisites', 'knowledgePrerequisites', 'systemPrerequisites', 'artifacts'],
      properties: {
        prerequisites: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              type: { type: 'string', enum: ['knowledge', 'system', 'environment', 'access'] },
              criticality: { type: 'string', enum: ['required', 'recommended', 'optional'] },
              installationLink: { type: 'string' },
              estimatedSetupTime: { type: 'string' }
            }
          }
        },
        knowledgePrerequisites: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concept: { type: 'string' },
              relatedGuideLink: { type: 'string' }
            }
          }
        },
        systemPrerequisites: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              version: { type: 'string' },
              installationInstructions: { type: 'string' }
            }
          }
        },
        environmentPrerequisites: { type: 'array', items: { type: 'string' } },
        totalSetupTime: { type: 'string' },
        blockers: { type: 'array', items: { type: 'string' } },
        alternatives: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'how-to-guide', 'prerequisites']
}));

// Task 3: Procedure Development
export const procedureDevelopmentTask = defineTask('procedure-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop step-by-step procedure',
  agent: {
    name: 'instructional-designer',
    prompt: {
      role: 'instructional designer and technical writer',
      task: 'Develop clear, sequential, actionable steps to accomplish the task goal',
      context: args,
      instructions: [
        'Break down task into clear, sequential steps (aim for 5-15 steps for moderate tasks)',
        'Each step must be:',
        '  - ACTIONABLE: starts with imperative verb (Click, Enter, Select, Navigate, etc.)',
        '  - SPECIFIC: no ambiguity about what to do',
        '  - SEQUENTIAL: follows logical order',
        '  - ACHIEVABLE: user can complete with provided information',
        'Step structure: Action + Object + (Optional: Location/Context)',
        '  Good: "Click the Save button in the top-right corner"',
        '  Bad: "You should save your changes" (not imperative, vague)',
        'Number steps sequentially (1, 2, 3...)',
        'Use substeps (1a, 1b) for related actions within a step',
        'Add notes for context/explanation (not instructions)',
        'Add warnings/cautions before potentially risky steps',
        'Identify critical steps (cannot skip) vs. optional steps',
        'Include expected results after key steps: "You should see..."',
        'Add decision points and conditional paths if needed',
        'Include code snippets or commands in formatted blocks',
        'Estimate realistic completion time',
        'Save procedure to output directory'
      ],
      outputFormat: 'JSON with steps (array), criticalSteps (array), optionalSteps (array), decisionPoints (array), estimatedCompletionTime (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['steps', 'criticalSteps', 'estimatedCompletionTime', 'artifacts'],
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepNumber: { type: 'number' },
              action: { type: 'string' },
              substeps: { type: 'array', items: { type: 'string' } },
              expectedResult: { type: 'string' },
              notes: { type: 'array', items: { type: 'string' } },
              warnings: { type: 'array', items: { type: 'string' } },
              codeSnippet: { type: 'string' },
              screenshotNeeded: { type: 'boolean' },
              isCritical: { type: 'boolean' },
              isOptional: { type: 'boolean' }
            }
          }
        },
        criticalSteps: { type: 'array', items: { type: 'number' } },
        optionalSteps: { type: 'array', items: { type: 'number' } },
        decisionPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              atStep: { type: 'number' },
              condition: { type: 'string' },
              paths: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        estimatedCompletionTime: { type: 'string' },
        totalSteps: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'how-to-guide', 'procedure-development']
}));

// Task 4: Outcomes Definition
export const outcomesDefinitionTask = defineTask('outcomes-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define expected outcomes and success criteria',
  agent: {
    name: 'outcomes-specialist',
    prompt: {
      role: 'technical writer and UX specialist',
      task: 'Define clear expected outcomes and measurable success criteria so user knows when task is complete',
      context: args,
      instructions: [
        'Define primary outcome: what user achieved by completing the task',
        'List observable success indicators:',
        '  - What user should see on screen',
        '  - What files/artifacts were created',
        '  - What system state changed',
        '  - What functionality is now available',
        'Provide verification steps: how to confirm success',
        'Define failure indicators: how to know if something went wrong',
        'Include next steps: what user can do after completing this task',
        'Link to related guides for further actions',
        'Save outcomes definition to output directory'
      ],
      outputFormat: 'JSON with primaryOutcome (string), successIndicators (array), verificationSteps (array), failureIndicators (array), nextSteps (array), relatedGuides (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryOutcome', 'successIndicators', 'verificationSteps', 'artifacts'],
      properties: {
        primaryOutcome: { type: 'string' },
        successIndicators: { type: 'array', items: { type: 'string' } },
        verificationSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              expectedResult: { type: 'string' }
            }
          }
        },
        failureIndicators: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        relatedGuides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              link: { type: 'string' },
              description: { type: 'string' }
            }
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
  labels: ['agent', 'how-to-guide', 'outcomes']
}));

// Task 5: Troubleshooting Section
export const troubleshootingSectionTask = defineTask('troubleshooting-section', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop troubleshooting section',
  agent: {
    name: 'support-specialist',
    prompt: {
      role: 'technical support specialist and documentation expert',
      task: 'Develop troubleshooting section covering common issues, error messages, and solutions',
      context: args,
      instructions: [
        'Anticipate common problems user might encounter:',
        '  - Permission/access errors',
        '  - Configuration issues',
        '  - Version compatibility problems',
        '  - Network/connectivity issues',
        '  - Missing dependencies',
        'For each issue, provide:',
        '  - Problem description (what user sees/experiences)',
        '  - Root cause (why it happens)',
        '  - Solution steps (how to fix)',
        '  - Prevention tips (how to avoid)',
        'Document common error messages with explanations',
        'Include diagnostic steps to identify root cause',
        'Provide workarounds if no direct solution',
        'Add FAQ section for common questions',
        'Link to related troubleshooting resources',
        'Save troubleshooting section to output directory'
      ],
      outputFormat: 'JSON with commonIssues (array), errorMessages (array), diagnosticSteps (array), faqs (array), workarounds (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['commonIssues', 'errorMessages', 'faqs', 'artifacts'],
      properties: {
        commonIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              symptoms: { type: 'array', items: { type: 'string' } },
              cause: { type: 'string' },
              solution: { type: 'array', items: { type: 'string' } },
              prevention: { type: 'string' }
            }
          }
        },
        errorMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              errorCode: { type: 'string' },
              errorMessage: { type: 'string' },
              explanation: { type: 'string' },
              solution: { type: 'string' }
            }
          }
        },
        diagnosticSteps: { type: 'array', items: { type: 'string' } },
        faqs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' }
            }
          }
        },
        workarounds: { type: 'array', items: { type: 'string' } },
        supportLinks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'how-to-guide', 'troubleshooting']
}));

// Task 6: Visual Assets Planning
export const visualAssetsTask = defineTask('visual-assets', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan visual assets and screenshots',
  agent: {
    name: 'visual-designer',
    prompt: {
      role: 'technical illustrator and visual designer',
      task: 'Plan screenshots, diagrams, and visual assets to accompany step-by-step instructions',
      context: args,
      instructions: [
        'Identify steps requiring screenshots for clarity',
        'Plan screenshot specifications:',
        '  - What to capture (specific UI elements, full screen, cropped)',
        '  - Annotations needed (arrows, highlights, callouts)',
        '  - Alt text for accessibility',
        'Plan diagrams if needed:',
        '  - Architecture diagrams',
        '  - Flow diagrams',
        '  - Sequence diagrams',
        'Follow screenshot best practices:',
        '  - Use consistent window sizes',
        '  - Clean up UI (close unnecessary tabs/windows)',
        '  - Use consistent theme/appearance',
        '  - Anonymize sensitive data',
        '  - Use clear, readable fonts',
        'Provide image naming conventions',
        'Specify image format and resolution',
        'Create mock-up placeholders with descriptions',
        'Save visual assets plan to output directory'
      ],
      outputFormat: 'JSON with screenshots (array), diagrams (array), namingConvention (string), imageSpecs (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['screenshots', 'diagrams', 'imageSpecs', 'artifacts'],
      properties: {
        screenshots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepNumber: { type: 'number' },
              description: { type: 'string' },
              captureArea: { type: 'string', enum: ['full-screen', 'window', 'cropped', 'element'] },
              annotations: { type: 'array', items: { type: 'string' } },
              altText: { type: 'string' },
              filename: { type: 'string' }
            }
          }
        },
        diagrams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['architecture', 'flow', 'sequence', 'er-diagram'] },
              description: { type: 'string' },
              diagramTool: { type: 'string' },
              altText: { type: 'string' },
              filename: { type: 'string' }
            }
          }
        },
        namingConvention: { type: 'string' },
        imageSpecs: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: ['png', 'jpg', 'svg', 'webp'] },
            maxWidth: { type: 'number' },
            maxHeight: { type: 'number' },
            dpi: { type: 'number' }
          }
        },
        accessibilityGuidelines: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'how-to-guide', 'visual-assets']
}));

// Task 7: Guide Document Composition
export const guideDocumentCompositionTask = defineTask('guide-document-composition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compose comprehensive how-to guide document',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'senior technical writer',
      task: 'Compose complete how-to guide document combining all elements into cohesive, user-friendly format',
      context: args,
      instructions: [
        'Structure guide following how-to guide template:',
        '  # [Task Title] (imperative: "Configure X", "Set up Y")',
        '  ',
        '  ## Overview',
        '  Brief description of what user will accomplish and why',
        '  Estimated completion time',
        '  ',
        '  ## Prerequisites',
        '  Bulleted list of requirements (knowledge, tools, access)',
        '  Links to installation/setup instructions',
        '  ',
        '  ## Steps',
        '  Numbered step-by-step instructions',
        '  Each step: imperative action + context',
        '  Include expected results',
        '  Add screenshots/code snippets inline',
        '  ',
        '  ## Verify Your Setup',
        '  How to confirm task completed successfully',
        '  ',
        '  ## Troubleshooting',
        '  Common issues and solutions',
        '  FAQs',
        '  ',
        '  ## Next Steps',
        '  Related guides and further actions',
        'Use active voice and imperative mood for steps',
        'Keep sentences short and direct',
        'Use consistent terminology',
        'Format code/commands in code blocks',
        'Add notes/warnings using appropriate formatting',
        'Ensure accessibility (alt text, semantic headings)',
        'Save guide document to output directory as Markdown'
      ],
      outputFormat: 'JSON with documentPath (string), guideMarkdown (string), wordCount (number), readingLevel (string), readabilityScore (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'guideMarkdown', 'wordCount', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        guideMarkdown: { type: 'string' },
        wordCount: { type: 'number' },
        readingLevel: { type: 'string' },
        readabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              wordCount: { type: 'number' }
            }
          }
        },
        codeBlocksCount: { type: 'number' },
        screenshotsIncluded: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'how-to-guide', 'document-composition']
}));

// Task 8: Guide Quality Scoring
export const guideQualityScoringTask = defineTask('guide-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score guide quality and completeness',
  agent: {
    name: 'quality-auditor',
    prompt: {
      role: 'documentation quality auditor',
      task: 'Assess how-to guide quality, completeness, and adherence to best practices',
      context: args,
      instructions: [
        'Evaluate task orientation and goal clarity (weight: 20%)',
        '  - Is task goal clearly stated?',
        '  - Is guide focused on accomplishing specific task?',
        '  - Are success criteria defined?',
        'Evaluate prerequisites completeness (weight: 15%)',
        '  - Are all prerequisites identified?',
        '  - Are prerequisites actionable?',
        'Evaluate procedure quality (weight: 30%)',
        '  - Are steps sequential and logical?',
        '  - Are steps actionable (imperative verbs)?',
        '  - Are expected results provided?',
        '  - Is step count appropriate (not too many/few)?',
        'Evaluate clarity and usability (weight: 20%)',
        '  - Is language clear and concise?',
        '  - Are technical terms explained?',
        '  - Are screenshots/diagrams helpful?',
        'Evaluate troubleshooting coverage (weight: 10%)',
        '  - Are common issues addressed?',
        '  - Are solutions actionable?',
        'Evaluate completeness (weight: 5%)',
        '  - All required sections present?',
        '  - Next steps provided?',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and missing elements',
        'Provide specific improvement recommendations'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), completeness (object), gaps (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            taskOrientation: { type: 'number' },
            prerequisitesCompleteness: { type: 'number' },
            procedureQuality: { type: 'number' },
            clarityUsability: { type: 'number' },
            troubleshootingCoverage: { type: 'number' },
            completeness: { type: 'number' }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            hasOverview: { type: 'boolean' },
            hasPrerequisites: { type: 'boolean' },
            hasSteps: { type: 'boolean' },
            hasVerification: { type: 'boolean' },
            hasTroubleshooting: { type: 'boolean' },
            hasNextSteps: { type: 'boolean' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        readinessLevel: { type: 'string', enum: ['ready', 'minor-revisions', 'major-revisions'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'how-to-guide', 'quality-scoring']
}));

// Task 9: Usability Testing
export const usabilityTestingTask = defineTask('usability-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulate usability testing',
  agent: {
    name: 'usability-tester',
    prompt: {
      role: 'UX researcher and usability testing specialist',
      task: 'Simulate usability testing by walking through guide as target user and identifying usability issues',
      context: args,
      instructions: [
        'Simulate multiple user personas attempting to follow guide',
        'For each persona, evaluate:',
        '  - Can user understand what to do at each step?',
        '  - Are there ambiguities or confusing instructions?',
        '  - Are prerequisites sufficient?',
        '  - Can user recognize when task is complete?',
        '  - Are there points where user might get stuck?',
        'Measure usability metrics:',
        '  - Task completion rate (% who can complete)',
        '  - Average completion time',
        '  - Number of errors encountered',
        '  - Points where users needed clarification',
        'Identify usability issues:',
        '  - Missing information',
        '  - Unclear instructions',
        '  - Missing screenshots/visuals',
        '  - Technical jargon not explained',
        '  - Steps out of order',
        'Calculate usability score (0-100)',
        'Provide prioritized recommendations for improvement',
        'Determine if guide passes usability threshold (>= 80)'
      ],
      outputFormat: 'JSON with usabilityScore (number 0-100), testPassed (boolean), completionRate (number), averageCompletionTime (string), issuesIdentified (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['usabilityScore', 'testPassed', 'completionRate', 'issuesIdentified', 'artifacts'],
      properties: {
        usabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        testPassed: { type: 'boolean' },
        completionRate: { type: 'number', minimum: 0, maximum: 100 },
        averageCompletionTime: { type: 'string' },
        errorsEncountered: { type: 'number' },
        issuesIdentified: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              location: { type: 'string' },
              severity: { type: 'string', enum: ['minor', 'moderate', 'critical'] },
              impact: { type: 'string' }
            }
          }
        },
        confusionPoints: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        userFeedback: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'how-to-guide', 'usability-testing']
}));

// Task 10: Guide Revision
export const guideRevisionTask = defineTask('guide-revision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Revise guide based on feedback',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'senior technical writer',
      task: 'Revise how-to guide based on quality assessment and usability testing feedback',
      context: args,
      instructions: [
        'Address all critical usability issues',
        'Fix confusing or ambiguous instructions',
        'Add missing information or context',
        'Improve clarity of complex steps',
        'Add screenshots where needed',
        'Simplify technical jargon or add explanations',
        'Reorder steps if needed for better flow',
        'Enhance troubleshooting section based on issues found',
        'Update prerequisites if gaps identified',
        'Improve success criteria and verification steps',
        'Document changes made and rationale',
        'Save revised guide to output directory'
      ],
      outputFormat: 'JSON with documentPath (string), guideMarkdown (string), changesApplied (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'guideMarkdown', 'changesApplied', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        guideMarkdown: { type: 'string' },
        changesApplied: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              change: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        improvementsSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'how-to-guide', 'revision']
}));

// Task 11: Metadata Enrichment
export const metadataEnrichmentTask = defineTask('metadata-enrichment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Add metadata and search tags',
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'information architect and SEO specialist',
      task: 'Add comprehensive metadata, tags, and search optimization to improve guide discoverability',
      context: args,
      instructions: [
        'Generate SEO-friendly title and description',
        'Create tags/keywords for search:',
        '  - Task-based tags (e.g., "deploy", "configure", "troubleshoot")',
        '  - Product/technology tags (e.g., "Docker", "Kubernetes", "AWS")',
        '  - Audience tags (e.g., "beginner", "developer", "admin")',
        '  - Platform tags (e.g., "Windows", "Linux", "macOS")',
        'Define metadata fields:',
        '  - Title, description, keywords',
        '  - Author, date created/updated',
        '  - Estimated completion time',
        '  - Difficulty level',
        '  - Prerequisites',
        '  - Related guides',
        'Generate structured data (Schema.org HowTo markup) for SEO',
        'Create social media sharing metadata (Open Graph, Twitter Cards)',
        'Define content categorization and taxonomy',
        'Suggest related articles and cross-links',
        'Save metadata to output directory'
      ],
      outputFormat: 'JSON with metadata (object), tags (array), structuredData (object), relatedContent (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metadata', 'tags', 'artifacts'],
      properties: {
        metadata: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
            author: { type: 'string' },
            dateCreated: { type: 'string' },
            dateUpdated: { type: 'string' },
            estimatedTime: { type: 'string' },
            difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
            audience: { type: 'array', items: { type: 'string' } },
            platform: { type: 'array', items: { type: 'string' } }
          }
        },
        tags: { type: 'array', items: { type: 'string' } },
        structuredData: { type: 'object' },
        socialMetadata: {
          type: 'object',
          properties: {
            openGraph: { type: 'object' },
            twitterCard: { type: 'object' }
          }
        },
        relatedContent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              url: { type: 'string' },
              relationship: { type: 'string', enum: ['prerequisite', 'related', 'next-step', 'alternative'] }
            }
          }
        },
        categoryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'how-to-guide', 'metadata', 'seo']
}));
