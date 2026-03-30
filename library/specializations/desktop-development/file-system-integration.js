/**
 * @process specializations/desktop-development/file-system-integration
 * @description File System Integration Process - Implement file operations including file dialogs, file watching,
 * large file handling, path management; ensure cross-platform compatibility and security.
 * @inputs { projectName: string, framework: string, fileOperations: array, targetPlatforms: array, outputDir?: string }
 * @outputs { success: boolean, fileModules: array, dialogConfigs: object, watcherSetup: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/file-system-integration', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   fileOperations: ['open', 'save', 'watch', 'drag-drop'],
 *   targetPlatforms: ['windows', 'macos', 'linux']
 * });
 *
 * @references
 * - Node.js fs module: https://nodejs.org/api/fs.html
 * - Electron dialog: https://www.electronjs.org/docs/latest/api/dialog
 * - chokidar: https://github.com/paulmillr/chokidar
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    fileOperations = ['open', 'save', 'watch', 'drag-drop'],
    targetPlatforms = ['windows', 'macos', 'linux'],
    maxFileSize = '1GB',
    outputDir = 'file-system-integration'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting File System Integration: ${projectName}`);
  ctx.log('info', `Framework: ${framework}, Operations: ${fileOperations.join(', ')}`);

  // ============================================================================
  // PHASE 1: FILE SYSTEM REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing file system requirements');

  const requirementsAnalysis = await ctx.task(fileSystemRequirementsTask, {
    projectName,
    framework,
    fileOperations,
    targetPlatforms,
    maxFileSize,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: FILE DIALOG IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing file dialogs');

  const dialogImplementation = await ctx.task(implementFileDialogsTask, {
    projectName,
    framework,
    fileOperations,
    targetPlatforms,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...dialogImplementation.artifacts);

  // ============================================================================
  // PHASE 3: FILE OPERATIONS IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing file operations');

  const fileOperationsImpl = await ctx.task(implementFileOperationsTask, {
    projectName,
    framework,
    fileOperations,
    maxFileSize,
    targetPlatforms,
    outputDir
  });

  artifacts.push(...fileOperationsImpl.artifacts);

  // ============================================================================
  // PHASE 4: FILE WATCHER SETUP
  // ============================================================================

  let watcherSetup = null;
  if (fileOperations.includes('watch')) {
    ctx.log('info', 'Phase 4: Setting up file watching');

    watcherSetup = await ctx.task(setupFileWatcherTask, {
      projectName,
      framework,
      targetPlatforms,
      outputDir
    });

    artifacts.push(...watcherSetup.artifacts);
  }

  // ============================================================================
  // PHASE 5: DRAG AND DROP IMPLEMENTATION
  // ============================================================================

  let dragDropImpl = null;
  if (fileOperations.includes('drag-drop')) {
    ctx.log('info', 'Phase 5: Implementing drag and drop');

    dragDropImpl = await ctx.task(implementDragDropTask, {
      projectName,
      framework,
      targetPlatforms,
      outputDir
    });

    artifacts.push(...dragDropImpl.artifacts);
  }

  // ============================================================================
  // PHASE 6: PATH MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing path management');

  const pathManagement = await ctx.task(implementPathManagementTask, {
    projectName,
    framework,
    targetPlatforms,
    outputDir
  });

  artifacts.push(...pathManagement.artifacts);

  // ============================================================================
  // PHASE 7: SECURITY IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing file system security');

  const securityImpl = await ctx.task(implementFileSecurityTask, {
    projectName,
    framework,
    targetPlatforms,
    fileOperationsImpl,
    outputDir
  });

  artifacts.push(...securityImpl.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating documentation and validating');

  const documentation = await ctx.task(generateFileSystemDocumentationTask, {
    projectName,
    framework,
    dialogImplementation,
    fileOperationsImpl,
    watcherSetup,
    pathManagement,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const validation = await ctx.task(validateFileSystemIntegrationTask, {
    projectName,
    framework,
    fileOperations,
    dialogImplementation,
    fileOperationsImpl,
    watcherSetup,
    securityImpl,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  await ctx.breakpoint({
    question: `File System Integration Complete for ${projectName}! Validation score: ${validation.validationScore}/100. ${fileOperationsImpl.modules.length} modules created. Approve implementation?`,
    title: 'File System Integration Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        framework,
        validationScore: validation.validationScore,
        modulesCreated: fileOperationsImpl.modules.length,
        dialogsConfigured: dialogImplementation.dialogs.length,
        watcherEnabled: !!watcherSetup
      },
      files: documentation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validationPassed,
    projectName,
    framework,
    fileModules: fileOperationsImpl.modules,
    dialogConfigs: dialogImplementation.dialogs,
    watcherSetup: watcherSetup ? {
      enabled: true,
      events: watcherSetup.events
    } : null,
    dragDrop: dragDropImpl ? {
      enabled: true,
      zones: dragDropImpl.dropZones
    } : null,
    pathManagement: pathManagement.utilities,
    security: {
      sandboxed: securityImpl.sandboxed,
      validationEnabled: securityImpl.pathValidation
    },
    validation: {
      score: validation.validationScore,
      passed: validationPassed
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/desktop-development/file-system-integration',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const fileSystemRequirementsTask = defineTask('file-system-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: File System Requirements - ${args.projectName}`,
  agent: {
    name: 'filesystem-analyst',
    prompt: {
      role: 'File System Integration Analyst',
      task: 'Analyze file system integration requirements',
      context: args,
      instructions: [
        '1. Analyze required file operations',
        '2. Identify platform-specific requirements',
        '3. Assess large file handling needs',
        '4. Identify security requirements',
        '5. Document file type filters needed',
        '6. Identify async/streaming needs',
        '7. Assess permission requirements',
        '8. Document path handling needs',
        '9. Identify error handling requirements',
        '10. Generate requirements document'
      ],
      outputFormat: 'JSON with file system requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        platformConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'file-system', 'requirements']
}));

export const implementFileDialogsTask = defineTask('implement-file-dialogs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: File Dialogs - ${args.projectName}`,
  skill: {
    name: 'file-dialog-abstraction',
  },
  agent: {
    name: 'file-system-path-handler',
    prompt: {
      role: 'File Dialog Developer',
      task: 'Implement native file dialogs',
      context: args,
      instructions: [
        '1. Implement open file dialog',
        '2. Implement save file dialog',
        '3. Implement folder selection dialog',
        '4. Configure file type filters',
        '5. Set default paths',
        '6. Handle multi-file selection',
        '7. Configure dialog properties per platform',
        '8. Handle dialog cancellation',
        '9. Implement recent files',
        '10. Generate dialog module'
      ],
      outputFormat: 'JSON with dialog implementations'
    },
    outputSchema: {
      type: 'object',
      required: ['dialogs', 'artifacts'],
      properties: {
        dialogs: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'file-dialogs']
}));

export const implementFileOperationsTask = defineTask('implement-file-operations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: File Operations - ${args.projectName}`,
  agent: {
    name: 'file-operations-developer',
    prompt: {
      role: 'File Operations Developer',
      task: 'Implement file read/write operations',
      context: args,
      instructions: [
        '1. Implement file reading (sync and async)',
        '2. Implement file writing (sync and async)',
        '3. Implement streaming for large files',
        '4. Implement file copying',
        '5. Implement file moving',
        '6. Implement file deletion',
        '7. Implement directory operations',
        '8. Handle file locking',
        '9. Implement progress tracking',
        '10. Generate file operations module'
      ],
      outputFormat: 'JSON with file operations implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['modules', 'artifacts'],
      properties: {
        modules: { type: 'array', items: { type: 'object' } },
        streamingSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'file-operations']
}));

export const setupFileWatcherTask = defineTask('setup-file-watcher', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: File Watcher - ${args.projectName}`,
  skill: {
    name: 'file-watcher-setup',
  },
  agent: {
    name: 'cross-platform-abstraction-architect',
    prompt: {
      role: 'File Watcher Developer',
      task: 'Set up file watching system',
      context: args,
      instructions: [
        '1. Configure chokidar or native watcher',
        '2. Set up file change events',
        '3. Configure directory watching',
        '4. Handle recursive watching',
        '5. Implement debouncing',
        '6. Handle platform differences',
        '7. Configure ignored patterns',
        '8. Implement atomic write detection',
        '9. Set up watcher cleanup',
        '10. Generate watcher module'
      ],
      outputFormat: 'JSON with watcher setup'
    },
    outputSchema: {
      type: 'object',
      required: ['events', 'artifacts'],
      properties: {
        events: { type: 'array', items: { type: 'string' } },
        debounceMs: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'file-watcher']
}));

export const implementDragDropTask = defineTask('implement-drag-drop', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Drag and Drop - ${args.projectName}`,
  agent: {
    name: 'dragdrop-developer',
    prompt: {
      role: 'Drag and Drop Developer',
      task: 'Implement file drag and drop',
      context: args,
      instructions: [
        '1. Set up drop zone components',
        '2. Handle drag enter/leave events',
        '3. Implement file drop handling',
        '4. Support multiple file drops',
        '5. Configure drag visual feedback',
        '6. Handle folder drops',
        '7. Implement drag out (export)',
        '8. Configure drop validation',
        '9. Handle platform differences',
        '10. Generate drag-drop module'
      ],
      outputFormat: 'JSON with drag-drop implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['dropZones', 'artifacts'],
      properties: {
        dropZones: { type: 'array', items: { type: 'object' } },
        dragOutSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'drag-drop']
}));

export const implementPathManagementTask = defineTask('implement-path-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Path Management - ${args.projectName}`,
  agent: {
    name: 'file-system-path-handler',
    prompt: {
      role: 'Path Management Developer',
      task: 'Implement cross-platform path management',
      context: args,
      instructions: [
        '1. Implement path normalization',
        '2. Handle path separators cross-platform',
        '3. Implement app data path resolution',
        '4. Handle user home directory',
        '5. Implement temp file paths',
        '6. Handle relative to absolute paths',
        '7. Implement path validation',
        '8. Handle special characters',
        '9. Implement path utilities',
        '10. Generate path module'
      ],
      outputFormat: 'JSON with path management implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['utilities', 'artifacts'],
      properties: {
        utilities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'path-management']
}));

export const implementFileSecurityTask = defineTask('implement-file-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: File Security - ${args.projectName}`,
  agent: {
    name: 'security-developer',
    prompt: {
      role: 'File Security Developer',
      task: 'Implement file system security',
      context: args,
      instructions: [
        '1. Implement path traversal prevention',
        '2. Configure sandbox restrictions',
        '3. Implement permission checking',
        '4. Configure allowed paths',
        '5. Implement file type validation',
        '6. Handle sensitive file access',
        '7. Implement audit logging',
        '8. Configure content validation',
        '9. Handle symlink security',
        '10. Generate security module'
      ],
      outputFormat: 'JSON with security implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['sandboxed', 'pathValidation', 'artifacts'],
      properties: {
        sandboxed: { type: 'boolean' },
        pathValidation: { type: 'boolean' },
        allowedPaths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'security']
}));

export const generateFileSystemDocumentationTask = defineTask('generate-file-system-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8a: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate file system documentation',
      context: args,
      instructions: [
        '1. Document file dialogs API',
        '2. Document file operations API',
        '3. Document watcher configuration',
        '4. Document drag-drop usage',
        '5. Document path utilities',
        '6. Document security considerations',
        '7. Create usage examples',
        '8. Document platform differences',
        '9. Create troubleshooting guide',
        '10. Generate API reference'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['artifacts'],
      properties: {
        apiReferencePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'documentation']
}));

export const validateFileSystemIntegrationTask = defineTask('validate-file-system-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8b: Validation - ${args.projectName}`,
  agent: {
    name: 'integration-validator',
    prompt: {
      role: 'Integration Validator',
      task: 'Validate file system integration',
      context: args,
      instructions: [
        '1. Verify dialog implementations',
        '2. Test file operations',
        '3. Verify watcher functionality',
        '4. Test drag-drop handling',
        '5. Verify path management',
        '6. Check security implementation',
        '7. Test cross-platform compatibility',
        '8. Calculate validation score',
        '9. Identify issues',
        '10. Generate recommendations'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        checks: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'validation']
}));
