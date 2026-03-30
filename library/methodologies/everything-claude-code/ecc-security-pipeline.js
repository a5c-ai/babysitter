/**
 * @process methodologies/everything-claude-code/ecc-security-pipeline
 * @description Everything Claude Code Security Pipeline - AgentShield audit with 5 scanning categories: secrets detection, permission auditing, hook injection analysis, MCP risk profiling, and agent config review
 * @inputs { projectRoot?: string, scanCategories?: array, redTeamEnabled?: boolean, confidenceThreshold?: number }
 * @outputs { success: boolean, secretsScan: object, permissionAudit: object, hookAnalysis: object, mcpProfiling: object, agentConfigReview: object, overallScore: number, findings: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const secretsScanTask = defineTask('ecc-sec-secrets', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Secrets Detection Scan',
  agent: {
    name: 'security-reviewer',
    prompt: {
      role: 'AgentShield - Secrets Detector',
      task: 'Scan the codebase for exposed secrets, API keys, tokens, passwords, and private keys across 14 pattern categories.',
      context: { ...args },
      instructions: [
        'Scan for AWS access keys and secret keys (AKIA pattern)',
        'Scan for GitHub tokens (ghp_, gho_, ghs_, ghr_ patterns)',
        'Scan for generic API keys and bearer tokens',
        'Scan for database connection strings with embedded credentials',
        'Scan for private keys (RSA, EC, SSH)',
        'Scan for JWT secrets and signing keys',
        'Scan for OAuth client secrets',
        'Scan for Slack tokens and webhooks',
        'Scan for cloud provider credentials (GCP, Azure)',
        'Check .env files, config files, and hardcoded strings',
        'Verify .gitignore excludes sensitive files',
        'Check for secrets in git history (last 10 commits)',
        'Rate each finding: critical, high, medium, low',
        'Provide remediation: rotate key, use env vars, add to .gitignore'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'security', 'secrets']
}));

const permissionAuditTask = defineTask('ecc-sec-permissions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Permission Auditing',
  agent: {
    name: 'security-reviewer',
    prompt: {
      role: 'AgentShield - Permission Auditor',
      task: 'Audit file system access patterns, network calls, and process execution permissions across the codebase.',
      context: { ...args },
      instructions: [
        'Map all file system read/write operations and their scope',
        'Identify network calls: URLs, protocols, authentication methods',
        'Audit process execution: child_process.exec, spawn, execFile calls',
        'Check for overly permissive file permissions (777, world-writable)',
        'Verify principle of least privilege in IAM/RBAC configurations',
        'Check CORS and CSP headers in web applications',
        'Audit npm/package scripts for arbitrary code execution',
        'Review Dockerfile for privilege escalation risks',
        'Flag any sudo or root-level operations',
        'Score each permission issue by blast radius'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'security', 'permissions']
}));

const hookInjectionTask = defineTask('ecc-sec-hooks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hook Injection Analysis',
  agent: {
    name: 'security-reviewer',
    prompt: {
      role: 'AgentShield - Hook Injection Analyzer',
      task: 'Analyze lifecycle hooks, git hooks, and event handlers for injection vulnerabilities and unauthorized code execution.',
      context: { ...args },
      instructions: [
        'Audit git hooks (.husky, .git/hooks) for command injection',
        'Check npm lifecycle scripts (preinstall, postinstall) for malicious payloads',
        'Analyze Claude Code hooks (.claude/settings.json) for unsafe patterns',
        'Check for eval(), Function(), or dynamic code execution in hooks',
        'Verify hook inputs are sanitized and validated',
        'Audit event listeners for prototype pollution vectors',
        'Check for unvalidated user input flowing into shell commands',
        'Verify hooks have timeout protection',
        'Flag hooks that modify system-level configuration',
        'Score vulnerability severity and exploitability'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'security', 'hooks']
}));

const mcpProfilingTask = defineTask('ecc-sec-mcp', (args, taskCtx) => ({
  kind: 'agent',
  title: 'MCP Risk Profiling',
  agent: {
    name: 'security-reviewer',
    prompt: {
      role: 'AgentShield - MCP Risk Profiler',
      task: 'Evaluate MCP (Model Context Protocol) server configurations for tool permission risks, data exposure, and unauthorized access vectors.',
      context: { ...args },
      instructions: [
        'Inventory all MCP servers and their registered tools',
        'Map tool permissions: read, write, execute, network access',
        'Identify data exposure risks: what data can tools access',
        'Check for tool permission escalation paths',
        'Verify tool input validation and sanitization',
        'Audit MCP transport security (stdio vs SSE vs HTTP)',
        'Check for prompt injection vectors via tool descriptions',
        'Verify rate limiting on tool invocations',
        'Flag tools with filesystem write access outside project',
        'Score risk per tool and aggregate per server'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'security', 'mcp']
}));

const agentConfigReviewTask = defineTask('ecc-sec-agent-config', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Agent Configuration Review',
  agent: {
    name: 'security-reviewer',
    prompt: {
      role: 'AgentShield - Agent Config Reviewer',
      task: 'Review AI agent configurations for model settings integrity, prompt injection resistance, and safe execution boundaries.',
      context: { ...args },
      instructions: [
        'Audit agent model settings: temperature, max tokens, stop sequences',
        'Check for prompt injection resistance in system prompts',
        'Verify agent tool allowlists are properly scoped',
        'Check for jailbreak vectors in agent instructions',
        'Audit agent-to-agent communication for trust boundaries',
        'Verify output validation and sanitization',
        'Check for information leakage in error messages',
        'Audit logging configuration for sensitive data exposure',
        'Verify agent timeout and resource limits',
        'Score overall agent security posture'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'security', 'agent-config']
}));

const redTeamTask = defineTask('ecc-sec-red-team', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Red Team Attack Simulation',
  agent: {
    name: 'security-reviewer',
    prompt: {
      role: 'AgentShield - Red Team Operator',
      task: 'Simulate adversarial attacks against the identified security surfaces. Attempt to exploit vulnerabilities found in previous scanning phases.',
      context: { ...args },
      instructions: [
        'Attempt to extract secrets through indirect access patterns',
        'Simulate permission escalation using discovered vectors',
        'Test hook injection with crafted payloads',
        'Attempt prompt injection against agent configurations',
        'Test MCP tool abuse scenarios',
        'Document each attack vector with steps to reproduce',
        'Rate exploitability: trivial, moderate, difficult, theoretical',
        'Provide blue-team defense recommendations for each attack'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'security', 'red-team']
}));

const synthesizeReportTask = defineTask('ecc-sec-synthesize', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Security Report',
  agent: {
    name: 'security-reviewer',
    prompt: {
      role: 'AgentShield - Report Synthesizer',
      task: 'Synthesize all scanning results into a unified security report with overall score, prioritized remediation plan, and go/no-go deployment recommendation.',
      context: { ...args },
      instructions: [
        'Aggregate findings from all 5 scanning categories',
        'Deduplicate findings that appear across multiple scans',
        'Calculate overall security score (0-100)',
        'Prioritize remediation by severity and exploitability',
        'Create a remediation plan with specific action items',
        'Determine blocking issues that prevent deployment',
        'Generate executive summary with key metrics',
        'Provide go/no-go deployment recommendation'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'security', 'report']
}));

// ============================================================================
// PROCESS FUNCTION
// ============================================================================

/**
 * Everything Claude Code Security Pipeline (AgentShield)
 *
 * Executes a comprehensive security audit across 5 categories in parallel,
 * with optional red-team simulation and unified reporting.
 *
 * Adapted from AgentShield: 102 static analysis rules, 1282 tests, 98% coverage.
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectRoot - Project root directory (default: '.')
 * @param {Array<string>} inputs.scanCategories - Categories to scan (default: all 5)
 * @param {boolean} inputs.redTeamEnabled - Enable red team simulation (default: false)
 * @param {number} inputs.confidenceThreshold - Minimum confidence for findings (default: 80)
 * @param {Object} ctx - Process context
 */
export async function process(inputs, ctx) {
  const {
    projectRoot = '.',
    scanCategories = ['secrets', 'permissions', 'hooks', 'mcp', 'agent-config'],
    redTeamEnabled = false,
    confidenceThreshold = 80
  } = inputs;

  ctx.log('info', `AgentShield Security Pipeline starting: ${scanCategories.join(', ')}`);

  // ── Phase 1: Parallel Security Scans ────────────────────────────────
  ctx.log('info', 'Phase 1: Running parallel security scans across all categories');

  const scanTasks = [];
  const scanNames = [];

  if (scanCategories.includes('secrets')) {
    scanTasks.push(ctx.task(secretsScanTask, { projectRoot, confidenceThreshold }));
    scanNames.push('secrets');
  }
  if (scanCategories.includes('permissions')) {
    scanTasks.push(ctx.task(permissionAuditTask, { projectRoot, confidenceThreshold }));
    scanNames.push('permissions');
  }
  if (scanCategories.includes('hooks')) {
    scanTasks.push(ctx.task(hookInjectionTask, { projectRoot, confidenceThreshold }));
    scanNames.push('hooks');
  }
  if (scanCategories.includes('mcp')) {
    scanTasks.push(ctx.task(mcpProfilingTask, { projectRoot, confidenceThreshold }));
    scanNames.push('mcp');
  }
  if (scanCategories.includes('agent-config')) {
    scanTasks.push(ctx.task(agentConfigReviewTask, { projectRoot, confidenceThreshold }));
    scanNames.push('agent-config');
  }

  const scanResults = await ctx.parallel.all(scanTasks);

  const resultMap = {};
  scanNames.forEach((name, idx) => {
    resultMap[name] = scanResults[idx];
    const findings = scanResults[idx]?.findingCount || 0;
    ctx.log('info', `${name}: ${findings} findings`);
  });

  // ── Breakpoint: Review scan findings before red team ────────────────
  const totalFindings = scanResults.reduce((sum, r) => sum + (r?.findingCount || 0), 0);
  const criticalFindings = scanResults.reduce((sum, r) => sum + (r?.criticalCount || 0), 0);

  if (criticalFindings > 0) {
    ctx.log('warn', `${criticalFindings} critical findings detected`);
    await ctx.breakpoint({
      title: 'Critical Security Findings',
      description: `${criticalFindings} critical security findings detected across ${scanNames.length} scan categories. Review before proceeding.`,
      data: { resultMap, totalFindings, criticalFindings }
    });
  }

  // ── Phase 2: Red Team Simulation (optional) ─────────────────────────
  let redTeamResult = null;
  if (redTeamEnabled && totalFindings > 0) {
    ctx.log('info', 'Phase 2: Red team attack simulation');
    redTeamResult = await ctx.task(redTeamTask, {
      projectRoot,
      vulnerabilities: resultMap,
      totalFindings
    });
    ctx.log('info', `Red team: ${redTeamResult.exploitableCount || 0} exploitable vulnerabilities`);
  }

  // ── Phase 3: Report Synthesis ───────────────────────────────────────
  ctx.log('info', 'Phase 3: Synthesizing security report');
  const report = await ctx.task(synthesizeReportTask, {
    projectRoot,
    secretsScan: resultMap.secrets,
    permissionAudit: resultMap.permissions,
    hookAnalysis: resultMap.hooks,
    mcpProfiling: resultMap.mcp,
    agentConfigReview: resultMap['agent-config'],
    redTeamResult,
    confidenceThreshold
  });

  ctx.log('info', `Security score: ${report.overallScore}/100, recommendation: ${report.recommendation}`);

  return {
    success: report.overallScore >= 70 && criticalFindings === 0,
    secretsScan: resultMap.secrets || null,
    permissionAudit: resultMap.permissions || null,
    hookAnalysis: resultMap.hooks || null,
    mcpProfiling: resultMap.mcp || null,
    agentConfigReview: resultMap['agent-config'] || null,
    redTeamResult,
    overallScore: report.overallScore,
    findings: report.findings || [],
    recommendation: report.recommendation,
    remediationPlan: report.remediationPlan || []
  };
}
