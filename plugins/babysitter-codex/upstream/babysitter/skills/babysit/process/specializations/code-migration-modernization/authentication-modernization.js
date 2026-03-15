/**
 * @process specializations/code-migration-modernization/authentication-modernization
 * @description Authentication Modernization - Process for upgrading authentication systems from legacy
 * mechanisms to modern standards (OAuth 2.0, OIDC, SAML 2.0) with proper security hardening and
 * session management.
 * @inputs { projectName: string, currentAuth?: object, targetAuth?: object, userBase?: object, securityRequirements?: array }
 * @outputs { success: boolean, authAnalysis: object, migrationPlan: object, implementedAuth: object, securityAudit: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/authentication-modernization', {
 *   projectName: 'Auth System Upgrade',
 *   currentAuth: { type: 'session-cookie', mechanism: 'form-based' },
 *   targetAuth: { type: 'OAuth2', provider: 'Auth0' },
 *   userBase: { count: 100000, sources: ['database', 'ldap'] },
 *   securityRequirements: ['MFA', 'SSO', 'audit-logging']
 * });
 *
 * @references
 * - OAuth 2.0: https://oauth.net/2/
 * - OpenID Connect: https://openid.net/connect/
 * - OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    currentAuth = {},
    targetAuth = {},
    userBase = {},
    securityRequirements = [],
    outputDir = 'auth-modernization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Authentication Modernization for ${projectName}`);

  // ============================================================================
  // PHASE 1: AUTHENTICATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing current authentication');
  const authAnalysis = await ctx.task(authAnalysisTask, {
    projectName,
    currentAuth,
    userBase,
    outputDir
  });

  artifacts.push(...authAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: TARGET AUTH DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing target authentication');
  const targetDesign = await ctx.task(targetAuthDesignTask, {
    projectName,
    authAnalysis,
    targetAuth,
    securityRequirements,
    outputDir
  });

  artifacts.push(...targetDesign.artifacts);

  // Breakpoint: Auth design review
  await ctx.breakpoint({
    question: `Authentication design complete for ${projectName}. Protocol: ${targetDesign.protocol}. MFA: ${targetDesign.mfaEnabled}. SSO: ${targetDesign.ssoEnabled}. Approve design?`,
    title: 'Authentication Design Review',
    context: {
      runId: ctx.runId,
      projectName,
      targetDesign,
      recommendation: 'Review security requirements alignment'
    }
  });

  // ============================================================================
  // PHASE 3: IDENTITY PROVIDER SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up identity provider');
  const idpSetup = await ctx.task(identityProviderSetupTask, {
    projectName,
    targetDesign,
    targetAuth,
    outputDir
  });

  artifacts.push(...idpSetup.artifacts);

  // ============================================================================
  // PHASE 4: USER MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Migrating users');
  const userMigration = await ctx.task(userMigrationTask, {
    projectName,
    authAnalysis,
    idpSetup,
    userBase,
    outputDir
  });

  artifacts.push(...userMigration.artifacts);

  // ============================================================================
  // PHASE 5: APPLICATION INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Integrating applications');
  const appIntegration = await ctx.task(applicationIntegrationTask, {
    projectName,
    targetDesign,
    idpSetup,
    outputDir
  });

  artifacts.push(...appIntegration.artifacts);

  // ============================================================================
  // PHASE 6: SECURITY HARDENING
  // ============================================================================

  ctx.log('info', 'Phase 6: Hardening security');
  const securityHardening = await ctx.task(securityHardeningTask, {
    projectName,
    targetDesign,
    appIntegration,
    securityRequirements,
    outputDir
  });

  artifacts.push(...securityHardening.artifacts);

  // ============================================================================
  // PHASE 7: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Testing authentication');
  const authTesting = await ctx.task(authenticationTestingTask, {
    projectName,
    appIntegration,
    securityHardening,
    outputDir
  });

  artifacts.push(...authTesting.artifacts);

  // ============================================================================
  // PHASE 8: SECURITY AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 8: Performing security audit');
  const securityAudit = await ctx.task(securityAuditTask, {
    projectName,
    appIntegration,
    securityHardening,
    authTesting,
    outputDir
  });

  artifacts.push(...securityAudit.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Authentication modernization complete for ${projectName}. Users migrated: ${userMigration.migratedCount}. Security score: ${securityAudit.securityScore}. All tests passed: ${authTesting.allPassed}. Approve?`,
    title: 'Authentication Modernization Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        protocol: targetDesign.protocol,
        usersMigrated: userMigration.migratedCount,
        securityScore: securityAudit.securityScore,
        testsPass: authTesting.allPassed
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    authAnalysis,
    migrationPlan: targetDesign,
    implementedAuth: {
      protocol: targetDesign.protocol,
      provider: idpSetup.provider,
      features: targetDesign.features
    },
    userMigration: {
      migratedCount: userMigration.migratedCount,
      success: userMigration.success
    },
    securityAudit: {
      score: securityAudit.securityScore,
      findings: securityAudit.findings,
      recommendations: securityAudit.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/authentication-modernization',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const authAnalysisTask = defineTask('auth-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Auth Analysis - ${args.projectName}`,
  agent: {
    name: 'security-vulnerability-assessor',
    prompt: {
      role: 'Security Analyst',
      task: 'Analyze current authentication system',
      context: args,
      instructions: [
        '1. Document current auth mechanism',
        '2. Identify authentication flows',
        '3. Map user repositories',
        '4. Assess security posture',
        '5. Identify vulnerabilities',
        '6. Document session management',
        '7. Analyze password policies',
        '8. Review audit logging',
        '9. Assess integration points',
        '10. Generate analysis report'
      ],
      outputFormat: 'JSON with currentMechanism, flows, userRepositories, securityPosture, vulnerabilities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentMechanism', 'flows', 'securityPosture', 'artifacts'],
      properties: {
        currentMechanism: { type: 'string' },
        flows: { type: 'array', items: { type: 'object' } },
        userRepositories: { type: 'array', items: { type: 'object' } },
        securityPosture: { type: 'object' },
        vulnerabilities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auth-modernization', 'analysis', 'security']
}));

export const targetAuthDesignTask = defineTask('target-auth-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Target Auth Design - ${args.projectName}`,
  agent: {
    name: 'security-vulnerability-assessor',
    prompt: {
      role: 'Security Architect',
      task: 'Design target authentication system',
      context: args,
      instructions: [
        '1. Select authentication protocol',
        '2. Design authentication flows',
        '3. Plan MFA implementation',
        '4. Design SSO integration',
        '5. Plan session management',
        '6. Design token management',
        '7. Plan password policies',
        '8. Design audit logging',
        '9. Plan user migration',
        '10. Generate design document'
      ],
      outputFormat: 'JSON with protocol, flows, mfaEnabled, ssoEnabled, features, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'flows', 'mfaEnabled', 'ssoEnabled', 'artifacts'],
      properties: {
        protocol: { type: 'string' },
        flows: { type: 'array', items: { type: 'object' } },
        mfaEnabled: { type: 'boolean' },
        ssoEnabled: { type: 'boolean' },
        features: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auth-modernization', 'design', 'architecture']
}));

export const identityProviderSetupTask = defineTask('identity-provider-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Identity Provider Setup - ${args.projectName}`,
  agent: {
    name: 'security-vulnerability-assessor',
    prompt: {
      role: 'Identity Engineer',
      task: 'Set up identity provider',
      context: args,
      instructions: [
        '1. Configure identity provider',
        '2. Set up authentication flows',
        '3. Configure MFA',
        '4. Set up SSO',
        '5. Configure user federation',
        '6. Set up branding',
        '7. Configure security policies',
        '8. Set up audit logging',
        '9. Test configuration',
        '10. Document setup'
      ],
      outputFormat: 'JSON with provider, configured, mfaSetup, ssoSetup, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['provider', 'configured', 'artifacts'],
      properties: {
        provider: { type: 'string' },
        configured: { type: 'boolean' },
        mfaSetup: { type: 'boolean' },
        ssoSetup: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auth-modernization', 'idp', 'setup']
}));

export const userMigrationTask = defineTask('user-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: User Migration - ${args.projectName}`,
  agent: {
    name: 'code-transformation-executor',
    prompt: {
      role: 'Identity Migration Specialist',
      task: 'Migrate users to new auth system',
      context: args,
      instructions: [
        '1. Extract user data',
        '2. Transform user attributes',
        '3. Migrate to new system',
        '4. Handle password migration',
        '5. Migrate MFA settings',
        '6. Validate migration',
        '7. Handle edge cases',
        '8. Track progress',
        '9. Document results',
        '10. Generate migration report'
      ],
      outputFormat: 'JSON with success, migratedCount, failedCount, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'migratedCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        migratedCount: { type: 'number' },
        failedCount: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auth-modernization', 'user', 'migration']
}));

export const applicationIntegrationTask = defineTask('application-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Application Integration - ${args.projectName}`,
  agent: {
    name: 'code-transformation-executor',
    prompt: {
      role: 'Integration Developer',
      task: 'Integrate applications with new auth',
      context: args,
      instructions: [
        '1. Integrate authentication SDK',
        '2. Update login flows',
        '3. Implement token handling',
        '4. Update session management',
        '5. Integrate logout',
        '6. Handle refresh tokens',
        '7. Update authorization',
        '8. Test integrations',
        '9. Document changes',
        '10. Generate integration report'
      ],
      outputFormat: 'JSON with integratedApps, sdkVersion, loginFlows, tokenHandling, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integratedApps', 'loginFlows', 'artifacts'],
      properties: {
        integratedApps: { type: 'number' },
        sdkVersion: { type: 'string' },
        loginFlows: { type: 'array', items: { type: 'object' } },
        tokenHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auth-modernization', 'integration', 'application']
}));

export const securityHardeningTask = defineTask('security-hardening', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Security Hardening - ${args.projectName}`,
  agent: {
    name: 'security-vulnerability-assessor',
    prompt: {
      role: 'Security Engineer',
      task: 'Harden authentication security',
      context: args,
      instructions: [
        '1. Configure token security',
        '2. Set up rate limiting',
        '3. Configure account lockout',
        '4. Enable brute force protection',
        '5. Set up anomaly detection',
        '6. Configure CORS',
        '7. Enable HSTS',
        '8. Configure CSP',
        '9. Set up monitoring',
        '10. Document hardening'
      ],
      outputFormat: 'JSON with hardeningApplied, securityFeatures, monitoring, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hardeningApplied', 'securityFeatures', 'artifacts'],
      properties: {
        hardeningApplied: { type: 'array', items: { type: 'string' } },
        securityFeatures: { type: 'object' },
        monitoring: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auth-modernization', 'security', 'hardening']
}));

export const authenticationTestingTask = defineTask('authentication-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Authentication Testing - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'Security Tester',
      task: 'Test authentication implementation',
      context: args,
      instructions: [
        '1. Test login flows',
        '2. Test MFA',
        '3. Test SSO',
        '4. Test token handling',
        '5. Test logout',
        '6. Test session management',
        '7. Test edge cases',
        '8. Test error handling',
        '9. Perform security testing',
        '10. Generate test report'
      ],
      outputFormat: 'JSON with allPassed, passedCount, failedCount, failures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'passedCount', 'failedCount', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        failures: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auth-modernization', 'testing', 'security']
}));

export const securityAuditTask = defineTask('security-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Security Audit - ${args.projectName}`,
  agent: {
    name: 'security-vulnerability-assessor',
    prompt: {
      role: 'Security Auditor',
      task: 'Audit authentication security',
      context: args,
      instructions: [
        '1. Review authentication flows',
        '2. Audit token security',
        '3. Review session management',
        '4. Audit password policies',
        '5. Review MFA implementation',
        '6. Audit logging',
        '7. Check compliance',
        '8. Calculate security score',
        '9. Document findings',
        '10. Generate audit report'
      ],
      outputFormat: 'JSON with securityScore, findings, recommendations, complianceStatus, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['securityScore', 'findings', 'recommendations', 'artifacts'],
      properties: {
        securityScore: { type: 'number' },
        findings: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        complianceStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['auth-modernization', 'audit', 'security']
}));
