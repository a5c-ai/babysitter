/**
 * @process specializations/sdk-platform-development/sdk-versioning-release-management
 * @description SDK Versioning and Release Management - Establish semantic versioning and release processes for SDKs
 * including automated release pipelines and changelog generation.
 * @inputs { projectName: string, versioningScheme?: string, releaseChannels?: array, changelogFormat?: string }
 * @outputs { success: boolean, versioningPolicy: object, releasePipeline: object, changelogConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/sdk-versioning-release-management', {
 *   projectName: 'CloudAPI SDK',
 *   versioningScheme: 'semver',
 *   releaseChannels: ['stable', 'beta', 'alpha'],
 *   changelogFormat: 'keep-a-changelog'
 * });
 *
 * @references
 * - Semantic Versioning: https://semver.org/
 * - Keep a Changelog: https://keepachangelog.com/
 * - Conventional Commits: https://www.conventionalcommits.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    versioningScheme = 'semver',
    releaseChannels = ['stable', 'beta'],
    changelogFormat = 'keep-a-changelog',
    outputDir = 'sdk-versioning-release-management'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SDK Versioning and Release Management: ${projectName}`);
  ctx.log('info', `Versioning Scheme: ${versioningScheme}`);

  // ============================================================================
  // PHASE 1: VERSIONING POLICY
  // ============================================================================

  ctx.log('info', 'Phase 1: Implementing SemVer versioning policy');

  const versioningPolicy = await ctx.task(versioningPolicyTask, {
    projectName,
    versioningScheme,
    releaseChannels,
    outputDir
  });

  artifacts.push(...versioningPolicy.artifacts);

  // ============================================================================
  // PHASE 2: RELEASE PIPELINE
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating automated release pipelines');

  const releasePipeline = await ctx.task(releasePipelineTask, {
    projectName,
    versioningPolicy,
    releaseChannels,
    outputDir
  });

  artifacts.push(...releasePipeline.artifacts);

  // ============================================================================
  // PHASE 3: CHANGELOG AUTOMATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Building changelog generation from commits');

  const changelogAutomation = await ctx.task(changelogAutomationTask, {
    projectName,
    changelogFormat,
    versioningPolicy,
    outputDir
  });

  artifacts.push(...changelogAutomation.artifacts);

  // ============================================================================
  // PHASE 4: RELEASE CANDIDATE TESTING
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing release candidate testing process');

  const rcTesting = await ctx.task(rcTestingTask, {
    projectName,
    releaseChannels,
    releasePipeline,
    outputDir
  });

  artifacts.push(...rcTesting.artifacts);

  // Quality Gate: Release Process Review
  await ctx.breakpoint({
    question: `Release management configured for ${projectName}. Versioning: ${versioningScheme}, Channels: ${releaseChannels.join(', ')}. Approve release process?`,
    title: 'Release Process Review',
    context: {
      runId: ctx.runId,
      projectName,
      versioningScheme,
      releaseChannels,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 5: PACKAGE PUBLISHING
  // ============================================================================

  ctx.log('info', 'Phase 5: Configuring package registry publishing');

  const packagePublishing = await ctx.task(packagePublishingTask, {
    projectName,
    releasePipeline,
    releaseChannels,
    outputDir
  });

  artifacts.push(...packagePublishing.artifacts);

  // ============================================================================
  // PHASE 6: RELEASE NOTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up release notifications');

  const releaseNotification = await ctx.task(releaseNotificationTask, {
    projectName,
    releasePipeline,
    changelogAutomation,
    outputDir
  });

  artifacts.push(...releaseNotification.artifacts);

  // ============================================================================
  // PHASE 7: ROLLBACK PROCEDURES
  // ============================================================================

  ctx.log('info', 'Phase 7: Defining rollback procedures');

  const rollbackProcedures = await ctx.task(rollbackProceduresTask, {
    projectName,
    releasePipeline,
    packagePublishing,
    outputDir
  });

  artifacts.push(...rollbackProcedures.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating release documentation');

  const documentation = await ctx.task(releaseDocumentationTask, {
    projectName,
    versioningPolicy,
    releasePipeline,
    changelogAutomation,
    rcTesting,
    packagePublishing,
    rollbackProcedures,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    versioningPolicy: versioningPolicy.policy,
    releasePipeline: releasePipeline.config,
    changelogConfig: changelogAutomation.config,
    releaseChannels,
    packagePublishing: packagePublishing.config,
    rollbackProcedures: rollbackProcedures.procedures,
    documentation: documentation.paths,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/sdk-versioning-release-management',
      timestamp: startTime,
      versioningScheme
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const versioningPolicyTask = defineTask('versioning-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Versioning Policy - ${args.projectName}`,
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'Release Manager',
      task: 'Implement semantic versioning policy',
      context: {
        projectName: args.projectName,
        versioningScheme: args.versioningScheme,
        releaseChannels: args.releaseChannels,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define version number format',
        '2. Establish major version criteria',
        '3. Define minor version criteria',
        '4. Establish patch version criteria',
        '5. Design pre-release versioning',
        '6. Define build metadata format',
        '7. Plan version comparison rules',
        '8. Design version constraints',
        '9. Plan multi-SDK version alignment',
        '10. Generate versioning policy document'
      ],
      outputFormat: 'JSON with versioning policy'
    },
    outputSchema: {
      type: 'object',
      required: ['policy', 'format', 'artifacts'],
      properties: {
        policy: { type: 'object' },
        format: { type: 'string' },
        criteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'versioning', 'policy']
}));

export const releasePipelineTask = defineTask('release-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Release Pipeline - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Create automated release pipelines',
      context: {
        projectName: args.projectName,
        versioningPolicy: args.versioningPolicy,
        releaseChannels: args.releaseChannels,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design release workflow',
        '2. Configure version bumping automation',
        '3. Set up release branch strategy',
        '4. Configure release tagging',
        '5. Set up artifact building',
        '6. Configure release signing',
        '7. Set up release validation',
        '8. Configure release approval gates',
        '9. Set up release metrics',
        '10. Generate release pipeline configuration'
      ],
      outputFormat: 'JSON with release pipeline configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'stages', 'artifacts'],
      properties: {
        config: { type: 'object' },
        stages: { type: 'array', items: { type: 'object' } },
        workflow: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'versioning', 'release-pipeline']
}));

export const changelogAutomationTask = defineTask('changelog-automation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Changelog Automation - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Release Engineer',
      task: 'Build changelog generation from commits',
      context: {
        projectName: args.projectName,
        changelogFormat: args.changelogFormat,
        versioningPolicy: args.versioningPolicy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure conventional commits',
        '2. Set up changelog generation tool',
        '3. Design changelog categories',
        '4. Configure breaking change highlighting',
        '5. Set up deprecation notices',
        '6. Configure contributor attribution',
        '7. Set up release notes generation',
        '8. Configure changelog validation',
        '9. Set up multi-format output',
        '10. Generate changelog configuration'
      ],
      outputFormat: 'JSON with changelog automation config'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'format', 'artifacts'],
      properties: {
        config: { type: 'object' },
        format: { type: 'string' },
        categories: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'versioning', 'changelog']
}));

export const rcTestingTask = defineTask('rc-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: RC Testing - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'QA Engineer',
      task: 'Design release candidate testing process',
      context: {
        projectName: args.projectName,
        releaseChannels: args.releaseChannels,
        releasePipeline: args.releasePipeline,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define RC testing scope',
        '2. Design smoke test suite',
        '3. Configure regression testing',
        '4. Set up beta user testing',
        '5. Design canary release testing',
        '6. Configure performance validation',
        '7. Set up security scanning',
        '8. Design compatibility validation',
        '9. Configure test result gates',
        '10. Generate RC testing configuration'
      ],
      outputFormat: 'JSON with RC testing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'testSuites', 'artifacts'],
      properties: {
        config: { type: 'object' },
        testSuites: { type: 'array', items: { type: 'object' } },
        gates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'versioning', 'rc-testing']
}));

export const packagePublishingTask = defineTask('package-publishing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Package Publishing - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Release Engineer',
      task: 'Configure package registry publishing',
      context: {
        projectName: args.projectName,
        releasePipeline: args.releasePipeline,
        releaseChannels: args.releaseChannels,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure npm publishing',
        '2. Set up PyPI publishing',
        '3. Configure Maven Central publishing',
        '4. Set up NuGet publishing',
        '5. Configure Go modules publishing',
        '6. Set up package signing',
        '7. Configure CDN distribution',
        '8. Set up installation verification',
        '9. Configure package analytics',
        '10. Generate publishing configuration'
      ],
      outputFormat: 'JSON with package publishing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'registries', 'artifacts'],
      properties: {
        config: { type: 'object' },
        registries: { type: 'array', items: { type: 'object' } },
        signing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'versioning', 'package-publishing']
}));

export const releaseNotificationTask = defineTask('release-notification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Release Notification - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'Communications Engineer',
      task: 'Set up release notifications',
      context: {
        projectName: args.projectName,
        releasePipeline: args.releasePipeline,
        changelogAutomation: args.changelogAutomation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure GitHub release creation',
        '2. Set up email notifications',
        '3. Configure Slack/Discord announcements',
        '4. Set up Twitter/social announcements',
        '5. Configure blog post drafts',
        '6. Set up developer newsletter',
        '7. Configure changelog RSS',
        '8. Set up webhook notifications',
        '9. Configure status page updates',
        '10. Generate notification configuration'
      ],
      outputFormat: 'JSON with release notification configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'channels', 'artifacts'],
      properties: {
        config: { type: 'object' },
        channels: { type: 'array', items: { type: 'string' } },
        templates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'versioning', 'release-notification']
}));

export const rollbackProceduresTask = defineTask('rollback-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Rollback Procedures - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Release Manager',
      task: 'Define rollback procedures',
      context: {
        projectName: args.projectName,
        releasePipeline: args.releasePipeline,
        packagePublishing: args.packagePublishing,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define rollback triggers',
        '2. Design package deprecation process',
        '3. Create rollback automation',
        '4. Design communication plan',
        '5. Create incident response process',
        '6. Design customer notification',
        '7. Create post-mortem process',
        '8. Design prevention measures',
        '9. Create rollback testing',
        '10. Generate rollback procedures document'
      ],
      outputFormat: 'JSON with rollback procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'triggers', 'artifacts'],
      properties: {
        procedures: { type: 'array', items: { type: 'object' } },
        triggers: { type: 'array', items: { type: 'string' } },
        automation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'versioning', 'rollback']
}));

export const releaseDocumentationTask = defineTask('release-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Release Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate release documentation',
      context: {
        projectName: args.projectName,
        versioningPolicy: args.versioningPolicy,
        releasePipeline: args.releasePipeline,
        changelogAutomation: args.changelogAutomation,
        rcTesting: args.rcTesting,
        packagePublishing: args.packagePublishing,
        rollbackProcedures: args.rollbackProcedures,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create versioning policy guide',
        '2. Document release process',
        '3. Write changelog guidelines',
        '4. Document RC testing process',
        '5. Create publishing guide',
        '6. Write rollback procedures',
        '7. Document release checklist',
        '8. Create contributor guide',
        '9. Write troubleshooting guide',
        '10. Generate all documentation'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['paths', 'artifacts'],
      properties: {
        paths: {
          type: 'object',
          properties: {
            versioningGuide: { type: 'string' },
            releaseProcess: { type: 'string' },
            rollbackGuide: { type: 'string' }
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
  labels: ['sdk', 'versioning', 'documentation']
}));
