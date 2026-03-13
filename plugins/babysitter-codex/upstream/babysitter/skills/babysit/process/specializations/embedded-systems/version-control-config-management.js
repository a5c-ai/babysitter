/**
 * @process specializations/embedded-systems/version-control-config-management
 * @description Version Control and Configuration Management - Establishing version control workflows, release tagging,
 * build reproducibility, hardware-software version tracking, and configuration management for embedded projects.
 * @inputs { projectName: string, vcsType?: string, releaseStrategy?: string, hwVersions?: array, outputDir?: string }
 * @outputs { success: boolean, versioningScheme: object, releaseProcess: object, configManagement: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/version-control-config-management', {
 *   projectName: 'ProductController',
 *   vcsType: 'git',
 *   releaseStrategy: 'gitflow',
 *   hwVersions: ['RevA', 'RevB', 'RevC']
 * });
 *
 * @references
 * - Embedded Version Control: https://interrupt.memfault.com/blog/firmware-versioning
 * - Git Workflows: https://www.atlassian.com/git/tutorials/comparing-workflows
 * - Configuration Management: https://www.embedded.com/configuration-management-for-embedded-systems/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    vcsType = 'git',
    releaseStrategy = 'gitflow',
    hwVersions = [],
    semanticVersioning = true,
    buildReproducibility = true,
    outputDir = 'version-config-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Version Control and Config Management: ${projectName}`);
  ctx.log('info', `VCS: ${vcsType}, Release Strategy: ${releaseStrategy}`);

  // ============================================================================
  // PHASE 1: VERSION CONTROL STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining Version Control Strategy');

  const vcsStrategy = await ctx.task(vcsStrategyTask, {
    projectName,
    vcsType,
    releaseStrategy,
    outputDir
  });

  artifacts.push(...vcsStrategy.artifacts);

  // ============================================================================
  // PHASE 2: VERSIONING SCHEME
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing Versioning Scheme');

  const versioningScheme = await ctx.task(versioningSchemeTask, {
    projectName,
    semanticVersioning,
    hwVersions,
    outputDir
  });

  artifacts.push(...versioningScheme.artifacts);

  // ============================================================================
  // PHASE 3: BRANCHING MODEL
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining Branching Model');

  const branchingModel = await ctx.task(branchingModelTask, {
    projectName,
    releaseStrategy,
    hwVersions,
    vcsStrategy,
    outputDir
  });

  artifacts.push(...branchingModel.artifacts);

  // ============================================================================
  // PHASE 4: RELEASE PROCESS
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing Release Process');

  const releaseProcess = await ctx.task(releaseProcessTask, {
    projectName,
    versioningScheme,
    branchingModel,
    outputDir
  });

  artifacts.push(...releaseProcess.artifacts);

  // ============================================================================
  // PHASE 5: BUILD REPRODUCIBILITY
  // ============================================================================

  let buildRepro = null;
  if (buildReproducibility) {
    ctx.log('info', 'Phase 5: Ensuring Build Reproducibility');

    buildRepro = await ctx.task(buildReproducibilityTask, {
      projectName,
      versioningScheme,
      outputDir
    });

    artifacts.push(...buildRepro.artifacts);
  }

  // ============================================================================
  // PHASE 6: HW-SW VERSION TRACKING
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing HW-SW Version Tracking');

  const hwSwTracking = await ctx.task(hwSwVersionTrackingTask, {
    projectName,
    hwVersions,
    versioningScheme,
    outputDir
  });

  artifacts.push(...hwSwTracking.artifacts);

  // ============================================================================
  // PHASE 7: CONFIGURATION MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing Configuration Management');

  const configManagement = await ctx.task(configurationManagementTask, {
    projectName,
    hwVersions,
    hwSwTracking,
    outputDir
  });

  artifacts.push(...configManagement.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Documentation');

  const documentation = await ctx.task(vcsConfigDocumentationTask, {
    projectName,
    vcsStrategy,
    versioningScheme,
    branchingModel,
    releaseProcess,
    buildRepro,
    hwSwTracking,
    configManagement,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Version Control and Config Management Complete for ${projectName}. Release strategy: ${releaseStrategy}, HW versions: ${hwVersions.length}. Review?`,
    title: 'Version Management Complete',
    context: {
      runId: ctx.runId,
      summary: {
        vcsType,
        releaseStrategy,
        hwVersionsSupported: hwVersions.length,
        buildReproducibility
      },
      files: [
        { path: documentation.docPath, format: 'markdown', label: 'Version Management Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    versioningScheme: {
      format: versioningScheme.format,
      components: versioningScheme.components,
      examples: versioningScheme.examples
    },
    releaseProcess: {
      strategy: releaseStrategy,
      steps: releaseProcess.steps,
      checklist: releaseProcess.checklist
    },
    configManagement: {
      hwVersions: hwSwTracking.mappings,
      configVariants: configManagement.variants,
      buildMatrix: configManagement.buildMatrix
    },
    branchingModel: branchingModel.model,
    docPath: documentation.docPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/version-control-config-management',
      timestamp: startTime,
      projectName,
      vcsType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const vcsStrategyTask = defineTask('vcs-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: VCS Strategy - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Define version control strategy',
      context: args,
      instructions: [
        '1. Select VCS tool',
        '2. Define repository structure',
        '3. Plan monorepo vs multi-repo',
        '4. Define commit conventions',
        '5. Plan code review process',
        '6. Define merge strategy',
        '7. Plan CI/CD integration',
        '8. Define access controls',
        '9. Plan backup strategy',
        '10. Document strategy'
      ],
      outputFormat: 'JSON with VCS strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'repoStructure', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        repoStructure: { type: 'object' },
        commitConventions: { type: 'object' },
        mergeStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'version-control', 'strategy']
}));

export const versioningSchemeTask = defineTask('versioning-scheme', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Versioning Scheme - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Design versioning scheme',
      context: args,
      instructions: [
        '1. Define version format',
        '2. Plan major/minor/patch',
        '3. Include build number',
        '4. Plan HW version encoding',
        '5. Design version string',
        '6. Plan pre-release tags',
        '7. Design version API',
        '8. Plan version comparison',
        '9. Define increment rules',
        '10. Document scheme'
      ],
      outputFormat: 'JSON with versioning scheme'
    },
    outputSchema: {
      type: 'object',
      required: ['format', 'components', 'examples', 'artifacts'],
      properties: {
        format: { type: 'string' },
        components: { type: 'array', items: { type: 'object' } },
        examples: { type: 'array', items: { type: 'string' } },
        incrementRules: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'version-control', 'versioning']
}));

export const branchingModelTask = defineTask('branching-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Branching Model - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Define branching model',
      context: args,
      instructions: [
        '1. Select branching strategy',
        '2. Define main branches',
        '3. Define feature branches',
        '4. Plan release branches',
        '5. Plan hotfix branches',
        '6. Handle HW variants',
        '7. Define naming conventions',
        '8. Plan branch lifecycle',
        '9. Define protection rules',
        '10. Document model'
      ],
      outputFormat: 'JSON with branching model'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'branches', 'artifacts'],
      properties: {
        model: { type: 'object' },
        branches: { type: 'array', items: { type: 'object' } },
        namingConventions: { type: 'object' },
        protectionRules: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'version-control', 'branching']
}));

export const releaseProcessTask = defineTask('release-process', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Release Process - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Design release process',
      context: args,
      instructions: [
        '1. Define release stages',
        '2. Plan version bumping',
        '3. Define tagging strategy',
        '4. Plan changelog generation',
        '5. Define release checklist',
        '6. Plan artifact generation',
        '7. Define approval gates',
        '8. Plan deployment steps',
        '9. Define rollback process',
        '10. Document process'
      ],
      outputFormat: 'JSON with release process'
    },
    outputSchema: {
      type: 'object',
      required: ['steps', 'checklist', 'artifacts'],
      properties: {
        steps: { type: 'array', items: { type: 'object' } },
        checklist: { type: 'array', items: { type: 'string' } },
        taggingStrategy: { type: 'object' },
        approvalGates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'version-control', 'release']
}));

export const buildReproducibilityTask = defineTask('build-reproducibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Build Reproducibility - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Ensure build reproducibility',
      context: args,
      instructions: [
        '1. Lock toolchain versions',
        '2. Pin dependencies',
        '3. Define build environment',
        '4. Use deterministic builds',
        '5. Track build inputs',
        '6. Generate build manifest',
        '7. Plan containerization',
        '8. Verify reproducibility',
        '9. Document environment',
        '10. Create verification script'
      ],
      outputFormat: 'JSON with build reproducibility'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'toolchainVersions', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        toolchainVersions: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'object' } },
        verificationScript: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'version-control', 'reproducibility']
}));

export const hwSwVersionTrackingTask = defineTask('hw-sw-version-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: HW-SW Tracking - ${args.projectName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design HW-SW version tracking',
      context: args,
      instructions: [
        '1. Define HW version detection',
        '2. Create compatibility matrix',
        '3. Plan version mapping',
        '4. Design runtime checks',
        '5. Plan feature flags',
        '6. Handle deprecation',
        '7. Design upgrade paths',
        '8. Plan backward compatibility',
        '9. Create tracking database',
        '10. Document mappings'
      ],
      outputFormat: 'JSON with HW-SW tracking'
    },
    outputSchema: {
      type: 'object',
      required: ['mappings', 'compatibilityMatrix', 'artifacts'],
      properties: {
        mappings: { type: 'array', items: { type: 'object' } },
        compatibilityMatrix: { type: 'object' },
        detectionMethod: { type: 'object' },
        featureFlags: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'version-control', 'hw-sw-tracking']
}));

export const configurationManagementTask = defineTask('configuration-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Config Management - ${args.projectName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Design configuration management',
      context: args,
      instructions: [
        '1. Define config variants',
        '2. Plan build matrix',
        '3. Design config files',
        '4. Plan defaults handling',
        '5. Design override mechanism',
        '6. Plan validation',
        '7. Design config versioning',
        '8. Plan migration',
        '9. Document configurations',
        '10. Create config tool'
      ],
      outputFormat: 'JSON with configuration management'
    },
    outputSchema: {
      type: 'object',
      required: ['variants', 'buildMatrix', 'artifacts'],
      properties: {
        variants: { type: 'array', items: { type: 'object' } },
        buildMatrix: { type: 'object' },
        configFiles: { type: 'array', items: { type: 'object' } },
        validationRules: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'version-control', 'configuration']
}));

export const vcsConfigDocumentationTask = defineTask('vcs-config-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate version control documentation',
      context: args,
      instructions: [
        '1. Create overview',
        '2. Document VCS strategy',
        '3. Document versioning',
        '4. Document branching',
        '5. Document release process',
        '6. Document HW-SW tracking',
        '7. Document config management',
        '8. Add workflow guides',
        '9. Include examples',
        '10. Format documentation'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['docPath', 'sections', 'artifacts'],
      properties: {
        docPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        workflowGuides: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'version-control', 'documentation']
}));
