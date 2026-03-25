/**
 * @process specializations/sdk-platform-development/developer-experience-optimization
 * @description Developer Experience Optimization - Optimize time-to-first-success and overall developer satisfaction
 * through intuitive APIs, minimal configuration, and progressive disclosure of advanced features.
 * @inputs { projectName: string, targetAudience?: string, currentMetrics?: object, focusAreas?: array }
 * @outputs { success: boolean, dxAudit: object, improvements: array, metrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/developer-experience-optimization', {
 *   projectName: 'CloudAPI SDK',
 *   targetAudience: 'full-stack-developers',
 *   currentMetrics: { timeToFirstSuccess: '30 minutes', nps: 45 },
 *   focusAreas: ['onboarding', 'error-messages', 'documentation']
 * });
 *
 * @references
 * - Developer Experience: https://www.postman.com/api-platform/developer-experience/
 * - API Design Patterns: https://www.oreilly.com/library/view/api-design-patterns/9781617295850/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetAudience = 'developers',
    currentMetrics = {},
    focusAreas = ['onboarding', 'documentation', 'error-handling'],
    outputDir = 'developer-experience-optimization'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Developer Experience Optimization: ${projectName}`);
  ctx.log('info', `Target Audience: ${targetAudience}`);

  // ============================================================================
  // PHASE 1: DX AUDIT AND ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting DX audit and assessment');

  const dxAudit = await ctx.task(dxAuditTask, {
    projectName,
    targetAudience,
    currentMetrics,
    outputDir
  });

  artifacts.push(...dxAudit.artifacts);

  // ============================================================================
  // PHASE 2: TIME-TO-FIRST-SUCCESS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing time-to-first-success');

  const ttfsAnalysis = await ctx.task(ttfsAnalysisTask, {
    projectName,
    dxAudit,
    outputDir
  });

  artifacts.push(...ttfsAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: CONFIGURATION MINIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Minimizing configuration requirements');

  const configMinimization = await ctx.task(configMinimizationTask, {
    projectName,
    dxAudit,
    outputDir
  });

  artifacts.push(...configMinimization.artifacts);

  // ============================================================================
  // PHASE 4: PROGRESSIVE DISCLOSURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing progressive disclosure of features');

  const progressiveDisclosure = await ctx.task(progressiveDisclosureTask, {
    projectName,
    dxAudit,
    configMinimization,
    outputDir
  });

  artifacts.push(...progressiveDisclosure.artifacts);

  // Quality Gate: DX Strategy Review
  await ctx.breakpoint({
    question: `DX analysis complete for ${projectName}. Current TTFS: ${ttfsAnalysis.currentTTFS}, Target: ${ttfsAnalysis.targetTTFS}. Approve improvement plan?`,
    title: 'DX Strategy Review',
    context: {
      runId: ctx.runId,
      projectName,
      currentTTFS: ttfsAnalysis.currentTTFS,
      targetTTFS: ttfsAnalysis.targetTTFS,
      improvementCount: dxAudit.improvements.length,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 5: API USABILITY IMPROVEMENTS
  // ============================================================================

  ctx.log('info', 'Phase 5: Improving API usability and intuitiveness');

  const apiUsability = await ctx.task(apiUsabilityTask, {
    projectName,
    dxAudit,
    outputDir
  });

  artifacts.push(...apiUsability.artifacts);

  // ============================================================================
  // PHASE 6: ERROR MESSAGE ENHANCEMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Enhancing error messages and debugging');

  const errorEnhancement = await ctx.task(errorEnhancementTask, {
    projectName,
    dxAudit,
    outputDir
  });

  artifacts.push(...errorEnhancement.artifacts);

  // ============================================================================
  // PHASE 7: ONBOARDING OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Optimizing onboarding experience');

  const onboardingOptimization = await ctx.task(onboardingOptimizationTask, {
    projectName,
    ttfsAnalysis,
    configMinimization,
    outputDir
  });

  artifacts.push(...onboardingOptimization.artifacts);

  // ============================================================================
  // PHASE 8: DX METRICS FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 8: Establishing DX metrics framework');

  const metricsFramework = await ctx.task(dxMetricsTask, {
    projectName,
    currentMetrics,
    dxAudit,
    outputDir
  });

  artifacts.push(...metricsFramework.artifacts);

  // ============================================================================
  // PHASE 9: IMPROVEMENT BACKLOG
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating prioritized improvement backlog');

  const improvementBacklog = await ctx.task(improvementBacklogTask, {
    projectName,
    dxAudit,
    ttfsAnalysis,
    apiUsability,
    errorEnhancement,
    onboardingOptimization,
    outputDir
  });

  artifacts.push(...improvementBacklog.artifacts);

  // ============================================================================
  // PHASE 10: DX DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating DX optimization documentation');

  const documentation = await ctx.task(dxDocumentationTask, {
    projectName,
    dxAudit,
    ttfsAnalysis,
    configMinimization,
    progressiveDisclosure,
    metricsFramework,
    improvementBacklog,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    dxAudit: {
      score: dxAudit.overallScore,
      strengths: dxAudit.strengths,
      weaknesses: dxAudit.weaknesses,
      improvements: dxAudit.improvements
    },
    improvements: improvementBacklog.backlog,
    metrics: {
      current: currentMetrics,
      targets: metricsFramework.targets,
      framework: metricsFramework.framework
    },
    onboarding: onboardingOptimization.improvements,
    documentation: {
      auditReport: documentation.auditReportPath,
      improvementPlan: documentation.improvementPlanPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/developer-experience-optimization',
      timestamp: startTime,
      targetAudience
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dxAuditTask = defineTask('dx-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: DX Audit - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'Developer Experience Specialist',
      task: 'Conduct comprehensive DX audit',
      context: {
        projectName: args.projectName,
        targetAudience: args.targetAudience,
        currentMetrics: args.currentMetrics,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate current SDK/API usability',
        '2. Assess documentation quality and completeness',
        '3. Analyze error message clarity',
        '4. Evaluate onboarding experience',
        '5. Assess configuration complexity',
        '6. Evaluate code examples quality',
        '7. Analyze community feedback and issues',
        '8. Identify strengths and weaknesses',
        '9. Benchmark against industry leaders',
        '10. Generate DX audit report'
      ],
      outputFormat: 'JSON with DX audit results'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'strengths', 'weaknesses', 'improvements', 'artifacts'],
      properties: {
        overallScore: { type: 'number' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              improvement: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' }
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
  labels: ['sdk', 'developer-experience', 'audit']
}));

export const ttfsAnalysisTask = defineTask('ttfs-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Time-to-First-Success Analysis - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'DX Analyst',
      task: 'Analyze and optimize time-to-first-success',
      context: {
        projectName: args.projectName,
        dxAudit: args.dxAudit,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Map current onboarding journey',
        '2. Identify friction points',
        '3. Measure current TTFS',
        '4. Analyze drop-off points',
        '5. Identify quick wins',
        '6. Design optimized journey',
        '7. Set TTFS targets (5-minute goal)',
        '8. Plan measurement approach',
        '9. Design A/B testing strategy',
        '10. Generate TTFS analysis report'
      ],
      outputFormat: 'JSON with TTFS analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['currentTTFS', 'targetTTFS', 'frictionPoints', 'artifacts'],
      properties: {
        currentTTFS: { type: 'string' },
        targetTTFS: { type: 'string' },
        frictionPoints: { type: 'array', items: { type: 'object' } },
        optimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-experience', 'ttfs']
}));

export const configMinimizationTask = defineTask('config-minimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Configuration Minimization - ${args.projectName}`,
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'SDK Designer',
      task: 'Minimize required configuration',
      context: {
        projectName: args.projectName,
        dxAudit: args.dxAudit,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Audit current required configuration',
        '2. Identify sensible defaults',
        '3. Design zero-config initialization',
        '4. Plan auto-detection capabilities',
        '5. Design configuration validation',
        '6. Plan configuration migration',
        '7. Design environment-based defaults',
        '8. Plan configuration documentation',
        '9. Design configuration helpers',
        '10. Generate configuration optimization plan'
      ],
      outputFormat: 'JSON with configuration minimization plan'
    },
    outputSchema: {
      type: 'object',
      required: ['currentConfig', 'minimizedConfig', 'defaults', 'artifacts'],
      properties: {
        currentConfig: { type: 'array', items: { type: 'string' } },
        minimizedConfig: { type: 'array', items: { type: 'string' } },
        defaults: { type: 'object' },
        autoDetection: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-experience', 'configuration']
}));

export const progressiveDisclosureTask = defineTask('progressive-disclosure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Progressive Disclosure - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'API UX Designer',
      task: 'Design progressive disclosure of features',
      context: {
        projectName: args.projectName,
        dxAudit: args.dxAudit,
        configMinimization: args.configMinimization,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Categorize features by usage frequency',
        '2. Design basic vs advanced API tiers',
        '3. Plan feature discovery mechanism',
        '4. Design documentation layering',
        '5. Plan optional vs required parameters',
        '6. Design builder pattern for complex operations',
        '7. Plan method overloading strategy',
        '8. Design IDE integration for discovery',
        '9. Plan feature flags for advanced features',
        '10. Generate progressive disclosure design'
      ],
      outputFormat: 'JSON with progressive disclosure design'
    },
    outputSchema: {
      type: 'object',
      required: ['tiers', 'discoveryMechanism', 'artifacts'],
      properties: {
        tiers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              features: { type: 'array', items: { type: 'string' } },
              audience: { type: 'string' }
            }
          }
        },
        discoveryMechanism: { type: 'string' },
        documentationLayers: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-experience', 'progressive-disclosure']
}));

export const apiUsabilityTask = defineTask('api-usability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: API Usability - ${args.projectName}`,
  agent: {
    name: 'api-design-reviewer',
    prompt: {
      role: 'API Designer',
      task: 'Improve API usability and intuitiveness',
      context: {
        projectName: args.projectName,
        dxAudit: args.dxAudit,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Audit method naming consistency',
        '2. Evaluate parameter ordering',
        '3. Assess return type clarity',
        '4. Review async/await patterns',
        '5. Evaluate fluent interface opportunities',
        '6. Assess type safety',
        '7. Review null handling',
        '8. Evaluate IDE autocomplete experience',
        '9. Review method chaining',
        '10. Generate usability improvement plan'
      ],
      outputFormat: 'JSON with usability improvements'
    },
    outputSchema: {
      type: 'object',
      required: ['improvements', 'namingGuide', 'artifacts'],
      properties: {
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              current: { type: 'string' },
              proposed: { type: 'string' }
            }
          }
        },
        namingGuide: { type: 'object' },
        patterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-experience', 'usability']
}));

export const errorEnhancementTask = defineTask('error-enhancement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Error Enhancement - ${args.projectName}`,
  agent: {
    name: 'error-message-reviewer',
    prompt: {
      role: 'DX Engineer',
      task: 'Enhance error messages and debugging experience',
      context: {
        projectName: args.projectName,
        dxAudit: args.dxAudit,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Audit current error messages',
        '2. Design actionable error format',
        '3. Add fix suggestions to errors',
        '4. Include relevant documentation links',
        '5. Design debugging mode',
        '6. Add request/response logging',
        '7. Design error correlation IDs',
        '8. Plan error reporting integration',
        '9. Design verbose error mode',
        '10. Generate error enhancement plan'
      ],
      outputFormat: 'JSON with error enhancement plan'
    },
    outputSchema: {
      type: 'object',
      required: ['errorFormat', 'improvements', 'artifacts'],
      properties: {
        errorFormat: { type: 'object' },
        improvements: { type: 'array', items: { type: 'object' } },
        debuggingFeatures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-experience', 'error-handling']
}));

export const onboardingOptimizationTask = defineTask('onboarding-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Onboarding Optimization - ${args.projectName}`,
  agent: {
    name: 'tutorial-builder-agent',
    prompt: {
      role: 'DX Specialist',
      task: 'Optimize onboarding experience',
      context: {
        projectName: args.projectName,
        ttfsAnalysis: args.ttfsAnalysis,
        configMinimization: args.configMinimization,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design streamlined setup flow',
        '2. Create interactive tutorials',
        '3. Design sandbox environment',
        '4. Plan credential setup simplification',
        '5. Create copy-paste code snippets',
        '6. Design progress indicators',
        '7. Plan success celebration moments',
        '8. Design help discovery',
        '9. Plan onboarding analytics',
        '10. Generate onboarding optimization plan'
      ],
      outputFormat: 'JSON with onboarding optimizations'
    },
    outputSchema: {
      type: 'object',
      required: ['improvements', 'newTTFS', 'artifacts'],
      properties: {
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              improvement: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        newTTFS: { type: 'string' },
        sandboxDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-experience', 'onboarding']
}));

export const dxMetricsTask = defineTask('dx-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: DX Metrics Framework - ${args.projectName}`,
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'DX Analyst',
      task: 'Establish DX metrics framework',
      context: {
        projectName: args.projectName,
        currentMetrics: args.currentMetrics,
        dxAudit: args.dxAudit,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define key DX metrics (TTFS, NPS, etc.)',
        '2. Design metric collection approach',
        '3. Set target benchmarks',
        '4. Plan telemetry implementation',
        '5. Design developer satisfaction surveys',
        '6. Plan A/B testing framework',
        '7. Design DX dashboard',
        '8. Plan regular DX reviews',
        '9. Design improvement tracking',
        '10. Generate metrics framework document'
      ],
      outputFormat: 'JSON with metrics framework'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'targets', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            metrics: { type: 'array', items: { type: 'object' } },
            collection: { type: 'string' },
            reporting: { type: 'string' }
          }
        },
        targets: { type: 'object' },
        dashboard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-experience', 'metrics']
}));

export const improvementBacklogTask = defineTask('improvement-backlog', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Improvement Backlog - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'DX Product Manager',
      task: 'Create prioritized improvement backlog',
      context: {
        projectName: args.projectName,
        dxAudit: args.dxAudit,
        ttfsAnalysis: args.ttfsAnalysis,
        apiUsability: args.apiUsability,
        errorEnhancement: args.errorEnhancement,
        onboardingOptimization: args.onboardingOptimization,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Consolidate all improvements',
        '2. Prioritize by impact and effort',
        '3. Group into themes',
        '4. Create implementation roadmap',
        '5. Define success criteria per item',
        '6. Estimate implementation effort',
        '7. Identify dependencies',
        '8. Plan quick wins',
        '9. Assign ownership',
        '10. Generate prioritized backlog'
      ],
      outputFormat: 'JSON with prioritized backlog'
    },
    outputSchema: {
      type: 'object',
      required: ['backlog', 'roadmap', 'artifacts'],
      properties: {
        backlog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              priority: { type: 'string' },
              effort: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        roadmap: { type: 'object' },
        quickWins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-experience', 'backlog']
}));

export const dxDocumentationTask = defineTask('dx-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: DX Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate DX optimization documentation',
      context: {
        projectName: args.projectName,
        dxAudit: args.dxAudit,
        ttfsAnalysis: args.ttfsAnalysis,
        configMinimization: args.configMinimization,
        progressiveDisclosure: args.progressiveDisclosure,
        metricsFramework: args.metricsFramework,
        improvementBacklog: args.improvementBacklog,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create DX audit summary report',
        '2. Document improvement plan',
        '3. Create metrics framework guide',
        '4. Document configuration guidelines',
        '5. Create progressive disclosure guide',
        '6. Document onboarding best practices',
        '7. Create error message guidelines',
        '8. Document DX review process',
        '9. Create DX testing guide',
        '10. Generate all documentation'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['auditReportPath', 'improvementPlanPath', 'artifacts'],
      properties: {
        auditReportPath: { type: 'string' },
        improvementPlanPath: { type: 'string' },
        metricsGuidePath: { type: 'string' },
        guidelinesPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'developer-experience', 'documentation']
}));
