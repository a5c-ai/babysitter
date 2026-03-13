/**
 * @process specializations/desktop-development/code-signing-setup
 * @description Code Signing and Notarization Setup - Configure code signing for Windows (Authenticode), macOS
 * (Developer ID + notarization), and Linux (GPG); set up certificate management and automated signing in build pipeline.
 * @inputs { projectName: string, targetPlatforms: array, signingProviders?: object, cicdPlatform?: string, outputDir?: string }
 * @outputs { success: boolean, signingConfigs: object, certificateSetup: object, notarizationSetup?: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/code-signing-setup', {
 *   projectName: 'MyDesktopApp',
 *   targetPlatforms: ['windows', 'macos', 'linux'],
 *   signingProviders: {
 *     windows: 'DigiCert',
 *     macos: 'Apple Developer',
 *     linux: 'GPG'
 *   },
 *   cicdPlatform: 'GitHub Actions'
 * });
 *
 * @references
 * - Windows Authenticode: https://docs.microsoft.com/en-us/windows/win32/seccrypto/authenticode
 * - Apple Code Signing: https://developer.apple.com/documentation/security/code_signing_services
 * - electron-builder code signing: https://www.electron.build/code-signing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetPlatforms = ['windows', 'macos', 'linux'],
    signingProviders = {
      windows: 'DigiCert',
      macos: 'Apple Developer',
      linux: 'GPG'
    },
    cicdPlatform = 'GitHub Actions',
    framework = 'Electron',
    outputDir = 'code-signing-setup'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Code Signing and Notarization Setup: ${projectName}`);
  ctx.log('info', `Target Platforms: ${targetPlatforms.join(', ')}`);

  // ============================================================================
  // PHASE 1: SIGNING REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing code signing requirements');

  const requirementsAnalysis = await ctx.task(signingRequirementsTask, {
    projectName,
    targetPlatforms,
    signingProviders,
    framework,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Signing requirements analyzed. ${requirementsAnalysis.certificatesNeeded.length} certificates needed. Estimated cost: ${requirementsAnalysis.estimatedCost}. Proceed with certificate setup?`,
    title: 'Signing Requirements Review',
    context: {
      runId: ctx.runId,
      certificatesNeeded: requirementsAnalysis.certificatesNeeded,
      estimatedCost: requirementsAnalysis.estimatedCost,
      files: requirementsAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: WINDOWS CODE SIGNING SETUP
  // ============================================================================

  let windowsSigningConfig = null;
  if (targetPlatforms.includes('windows')) {
    ctx.log('info', 'Phase 2: Setting up Windows code signing (Authenticode)');

    windowsSigningConfig = await ctx.task(setupWindowsSigningTask, {
      projectName,
      signingProvider: signingProviders.windows,
      framework,
      cicdPlatform,
      outputDir
    });

    artifacts.push(...windowsSigningConfig.artifacts);
  }

  // ============================================================================
  // PHASE 3: MACOS CODE SIGNING AND NOTARIZATION
  // ============================================================================

  let macosSigningConfig = null;
  if (targetPlatforms.includes('macos')) {
    ctx.log('info', 'Phase 3: Setting up macOS code signing and notarization');

    macosSigningConfig = await ctx.task(setupMacosSigningTask, {
      projectName,
      framework,
      cicdPlatform,
      outputDir
    });

    artifacts.push(...macosSigningConfig.artifacts);

    const notarizationConfig = await ctx.task(setupMacosNotarizationTask, {
      projectName,
      framework,
      cicdPlatform,
      macosSigningConfig,
      outputDir
    });

    artifacts.push(...notarizationConfig.artifacts);
    macosSigningConfig.notarization = notarizationConfig;
  }

  // ============================================================================
  // PHASE 4: LINUX SIGNING SETUP
  // ============================================================================

  let linuxSigningConfig = null;
  if (targetPlatforms.includes('linux')) {
    ctx.log('info', 'Phase 4: Setting up Linux package signing (GPG)');

    linuxSigningConfig = await ctx.task(setupLinuxSigningTask, {
      projectName,
      framework,
      cicdPlatform,
      outputDir
    });

    artifacts.push(...linuxSigningConfig.artifacts);
  }

  // ============================================================================
  // PHASE 5: CERTIFICATE MANAGEMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up certificate management and storage');

  const certificateManagement = await ctx.task(setupCertificateManagementTask, {
    projectName,
    targetPlatforms,
    cicdPlatform,
    windowsSigningConfig,
    macosSigningConfig,
    linuxSigningConfig,
    outputDir
  });

  artifacts.push(...certificateManagement.artifacts);

  await ctx.breakpoint({
    question: `Phase 5 Complete: Certificate management configured. Secrets to configure: ${certificateManagement.secretsRequired.length}. Review security setup?`,
    title: 'Certificate Management Review',
    context: {
      runId: ctx.runId,
      secretsRequired: certificateManagement.secretsRequired,
      storageMethod: certificateManagement.storageMethod,
      files: certificateManagement.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 6: CI/CD INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Integrating code signing into CI/CD pipeline');

  const cicdIntegration = await ctx.task(integrateCicdSigningTask, {
    projectName,
    cicdPlatform,
    targetPlatforms,
    framework,
    windowsSigningConfig,
    macosSigningConfig,
    linuxSigningConfig,
    certificateManagement,
    outputDir
  });

  artifacts.push(...cicdIntegration.artifacts);

  // ============================================================================
  // PHASE 7: DOCUMENTATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating documentation and validating setup');

  const documentation = await ctx.task(generateSigningDocumentationTask, {
    projectName,
    targetPlatforms,
    windowsSigningConfig,
    macosSigningConfig,
    linuxSigningConfig,
    certificateManagement,
    cicdIntegration,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const validation = await ctx.task(validateSigningSetupTask, {
    projectName,
    targetPlatforms,
    windowsSigningConfig,
    macosSigningConfig,
    linuxSigningConfig,
    certificateManagement,
    cicdIntegration,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 75;

  await ctx.breakpoint({
    question: `Code Signing Setup Complete for ${projectName}! Validation score: ${validation.validationScore}/100. ${validationPassed ? 'Setup is ready!' : 'Some issues need attention.'} Approve signing configuration?`,
    title: 'Code Signing Setup Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        targetPlatforms,
        validationScore: validation.validationScore,
        windowsConfigured: !!windowsSigningConfig,
        macosConfigured: !!macosSigningConfig,
        linuxConfigured: !!linuxSigningConfig,
        notarizationConfigured: macosSigningConfig?.notarization?.configured || false
      },
      nextSteps: validation.nextSteps,
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'Signing Documentation' },
        { path: documentation.securityGuidePath, format: 'markdown', label: 'Security Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validationPassed,
    projectName,
    targetPlatforms,
    signingConfigs: {
      windows: windowsSigningConfig ? {
        configured: true,
        provider: signingProviders.windows,
        signTool: windowsSigningConfig.signTool,
        timestampServer: windowsSigningConfig.timestampServer
      } : null,
      macos: macosSigningConfig ? {
        configured: true,
        identity: macosSigningConfig.identity,
        notarization: macosSigningConfig.notarization?.configured || false,
        hardened: macosSigningConfig.hardenedRuntime
      } : null,
      linux: linuxSigningConfig ? {
        configured: true,
        gpgKeyId: linuxSigningConfig.gpgKeyId,
        packageTypes: linuxSigningConfig.packageTypes
      } : null
    },
    certificateSetup: {
      storageMethod: certificateManagement.storageMethod,
      secretsRequired: certificateManagement.secretsRequired,
      rotationPolicy: certificateManagement.rotationPolicy
    },
    cicdIntegration: {
      platform: cicdPlatform,
      workflowFile: cicdIntegration.workflowFile,
      signingSteps: cicdIntegration.signingSteps
    },
    validation: {
      score: validation.validationScore,
      passed: validationPassed,
      checks: validation.checks
    },
    documentation: {
      readme: documentation.readmePath,
      securityGuide: documentation.securityGuidePath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/desktop-development/code-signing-setup',
      timestamp: startTime,
      cicdPlatform
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const signingRequirementsTask = defineTask('signing-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Signing Requirements - ${args.projectName}`,
  agent: {
    name: 'desktop-security-auditor',
    prompt: {
      role: 'Desktop Security Architect',
      task: 'Analyze code signing requirements for desktop application',
      context: args,
      instructions: [
        '1. Identify signing requirements per platform',
        '2. List certificates needed (EV, OV, Developer ID)',
        '3. Estimate costs for certificates',
        '4. Identify hardware requirements (HSM, USB tokens)',
        '5. Document notarization requirements for macOS',
        '6. Identify timestamp server requirements',
        '7. Document compliance requirements',
        '8. Assess existing signing infrastructure',
        '9. Identify automation opportunities',
        '10. Generate requirements document'
      ],
      outputFormat: 'JSON with signing requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['certificatesNeeded', 'estimatedCost', 'artifacts'],
      properties: {
        certificatesNeeded: { type: 'array', items: { type: 'object' } },
        estimatedCost: { type: 'string' },
        hardwareRequired: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'code-signing', 'requirements']
}));

export const setupWindowsSigningTask = defineTask('setup-windows-signing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Windows Code Signing - ${args.projectName}`,
  skill: {
    name: 'windows-authenticode-signer',
  },
  agent: {
    name: 'windows-platform-expert',
    prompt: {
      role: 'Windows Security Engineer',
      task: 'Configure Windows Authenticode code signing',
      context: args,
      instructions: [
        '1. Document certificate acquisition process',
        '2. Configure signtool.exe usage',
        '3. Set up Azure SignTool for cloud signing',
        '4. Configure timestamp server (RFC 3161)',
        '5. Set up dual signing (SHA-1 and SHA-256)',
        '6. Configure EV certificate handling if needed',
        '7. Document SmartScreen reputation building',
        '8. Set up certificate storage in CI/CD',
        '9. Create signing scripts',
        '10. Document signing verification'
      ],
      outputFormat: 'JSON with Windows signing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['signTool', 'timestampServer', 'artifacts'],
      properties: {
        signTool: { type: 'string' },
        timestampServer: { type: 'string' },
        dualSigning: { type: 'boolean' },
        evCertificate: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'code-signing', 'windows']
}));

export const setupMacosSigningTask = defineTask('setup-macos-signing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3a: macOS Code Signing - ${args.projectName}`,
  skill: {
    name: 'macos-codesign-workflow',
  },
  agent: {
    name: 'macos-platform-expert',
    prompt: {
      role: 'macOS Security Engineer',
      task: 'Configure macOS code signing with Developer ID',
      context: args,
      instructions: [
        '1. Document Apple Developer account setup',
        '2. Configure Developer ID Application certificate',
        '3. Set up entitlements file',
        '4. Configure hardened runtime',
        '5. Set up keychain for CI/CD',
        '6. Configure codesign command usage',
        '7. Set up certificate export (p12)',
        '8. Configure provisioning profiles if needed',
        '9. Document deep signing for bundles',
        '10. Create signing scripts'
      ],
      outputFormat: 'JSON with macOS signing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['identity', 'hardenedRuntime', 'artifacts'],
      properties: {
        identity: { type: 'string' },
        hardenedRuntime: { type: 'boolean' },
        entitlements: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'code-signing', 'macos']
}));

export const setupMacosNotarizationTask = defineTask('setup-macos-notarization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3b: macOS Notarization - ${args.projectName}`,
  skill: {
    name: 'macos-notarization-workflow',
  },
  agent: {
    name: 'code-signing-specialist',
    prompt: {
      role: 'macOS Notarization Engineer',
      task: 'Configure macOS notarization for Gatekeeper',
      context: args,
      instructions: [
        '1. Document app-specific password setup',
        '2. Configure notarytool usage',
        '3. Set up API key authentication',
        '4. Configure stapling process',
        '5. Set up notarization in build pipeline',
        '6. Configure timeout and retry handling',
        '7. Document notarization status checking',
        '8. Set up logging for debugging',
        '9. Create notarization scripts',
        '10. Document common issues and fixes'
      ],
      outputFormat: 'JSON with notarization configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'authMethod', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        authMethod: { type: 'string' },
        staplingEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'notarization', 'macos']
}));

export const setupLinuxSigningTask = defineTask('setup-linux-signing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Linux Package Signing - ${args.projectName}`,
  skill: {
    name: 'linux-gpg-signing',
  },
  agent: {
    name: 'linux-packaging-expert',
    prompt: {
      role: 'Linux Security Engineer',
      task: 'Configure Linux package signing with GPG',
      context: args,
      instructions: [
        '1. Document GPG key generation',
        '2. Configure GPG key storage in CI/CD',
        '3. Set up DEB package signing',
        '4. Set up RPM package signing',
        '5. Configure AppImage signing',
        '6. Set up public key distribution',
        '7. Configure repository signing',
        '8. Document key rotation process',
        '9. Create signing scripts',
        '10. Document signature verification'
      ],
      outputFormat: 'JSON with Linux signing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['gpgKeyId', 'packageTypes', 'artifacts'],
      properties: {
        gpgKeyId: { type: 'string' },
        packageTypes: { type: 'array', items: { type: 'string' } },
        publicKeyPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'code-signing', 'linux']
}));

export const setupCertificateManagementTask = defineTask('setup-certificate-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Certificate Management - ${args.projectName}`,
  agent: {
    name: 'certificate-manager',
    prompt: {
      role: 'Certificate Management Specialist',
      task: 'Configure secure certificate storage and management',
      context: args,
      instructions: [
        '1. Define secrets storage strategy',
        '2. Configure CI/CD secrets (GitHub, Azure, etc.)',
        '3. Document certificate import process',
        '4. Set up certificate expiration monitoring',
        '5. Configure rotation procedures',
        '6. Document backup and recovery',
        '7. Set up access controls',
        '8. Configure audit logging',
        '9. Document emergency procedures',
        '10. Create certificate inventory'
      ],
      outputFormat: 'JSON with certificate management configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['storageMethod', 'secretsRequired', 'artifacts'],
      properties: {
        storageMethod: { type: 'string' },
        secretsRequired: { type: 'array', items: { type: 'string' } },
        rotationPolicy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'certificate-management']
}));

export const integrateCicdSigningTask = defineTask('integrate-cicd-signing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: CI/CD Signing Integration - ${args.projectName}`,
  agent: {
    name: 'devops-engineer',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Integrate code signing into CI/CD pipeline',
      context: args,
      instructions: [
        '1. Create signing workflow steps',
        '2. Configure secret retrieval',
        '3. Set up platform-specific signing jobs',
        '4. Configure signing conditions (release only)',
        '5. Set up signing verification steps',
        '6. Configure error handling',
        '7. Set up signing logs',
        '8. Create signing status checks',
        '9. Document workflow triggers',
        '10. Create workflow file'
      ],
      outputFormat: 'JSON with CI/CD integration configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['workflowFile', 'signingSteps', 'artifacts'],
      properties: {
        workflowFile: { type: 'string' },
        signingSteps: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'cicd', 'code-signing']
}));

export const generateSigningDocumentationTask = defineTask('generate-signing-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7a: Generate Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Security Documentation Writer',
      task: 'Generate code signing documentation',
      context: args,
      instructions: [
        '1. Create signing overview document',
        '2. Document certificate setup for each platform',
        '3. Create security best practices guide',
        '4. Document CI/CD workflow',
        '5. Create troubleshooting guide',
        '6. Document verification procedures',
        '7. Create certificate renewal guide',
        '8. Document emergency procedures',
        '9. Create quick reference',
        '10. Generate compliance documentation'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'securityGuidePath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        securityGuidePath: { type: 'string' },
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

export const validateSigningSetupTask = defineTask('validate-signing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7b: Validate Signing Setup - ${args.projectName}`,
  skill: {
    name: 'ev-certificate-validator',
  },
  agent: {
    name: 'code-signing-specialist',
    prompt: {
      role: 'Security Setup Validator',
      task: 'Validate code signing configuration',
      context: args,
      instructions: [
        '1. Validate platform configurations',
        '2. Check certificate requirements',
        '3. Verify CI/CD integration',
        '4. Check secret configuration',
        '5. Validate notarization setup (macOS)',
        '6. Check documentation completeness',
        '7. Verify security best practices',
        '8. Calculate validation score',
        '9. Identify issues and gaps',
        '10. Generate recommendations'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'checks', 'nextSteps', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        checks: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'validation', 'security']
}));
