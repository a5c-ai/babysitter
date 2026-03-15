/**
 * @process specializations/security-research/smart-contract-auditing
 * @description Security audit of blockchain smart contracts on Ethereum, Solana, and other platforms.
 * Covers common vulnerability patterns, static analysis, symbolic execution, and formal verification
 * using Slither, Mythril, and manual review techniques.
 * @inputs { projectName: string, contractPath: string, blockchain?: string }
 * @outputs { success: boolean, vulnerabilities: array, auditReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/smart-contract-auditing', {
 *   projectName: 'DeFi Protocol Audit',
 *   contractPath: '/path/to/contracts',
 *   blockchain: 'ethereum'
 * });
 *
 * @references
 * - Slither: https://github.com/crytic/slither
 * - Mythril: https://github.com/ConsenSys/mythril
 * - SWC Registry: https://swcregistry.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    contractPath,
    blockchain = 'ethereum',
    auditScope = 'comprehensive',
    outputDir = 'smart-contract-audit-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];

  ctx.log('info', `Starting Smart Contract Audit for ${projectName}`);
  ctx.log('info', `Blockchain: ${blockchain}`);

  // ============================================================================
  // PHASE 1: CONTRACT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing contract structure');

  const contractAnalysis = await ctx.task(contractAnalysisTask, {
    projectName,
    contractPath,
    blockchain,
    outputDir
  });

  artifacts.push(...contractAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: STATIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Running static analysis tools');

  const staticAnalysis = await ctx.task(contractStaticAnalysisTask, {
    projectName,
    contractPath,
    contractAnalysis,
    outputDir
  });

  vulnerabilities.push(...staticAnalysis.vulnerabilities);
  artifacts.push(...staticAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: COMMON VULNERABILITIES
  // ============================================================================

  ctx.log('info', 'Phase 3: Checking for common vulnerability patterns');

  const commonVulns = await ctx.task(commonVulnsTask, {
    projectName,
    contractPath,
    blockchain,
    outputDir
  });

  vulnerabilities.push(...commonVulns.vulnerabilities);
  artifacts.push(...commonVulns.artifacts);

  // ============================================================================
  // PHASE 4: BUSINESS LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing business logic security');

  const businessLogic = await ctx.task(contractBusinessLogicTask, {
    projectName,
    contractPath,
    contractAnalysis,
    outputDir
  });

  vulnerabilities.push(...businessLogic.vulnerabilities);
  artifacts.push(...businessLogic.artifacts);

  // ============================================================================
  // PHASE 5: ACCESS CONTROL
  // ============================================================================

  ctx.log('info', 'Phase 5: Reviewing access control');

  const accessControl = await ctx.task(contractAccessControlTask, {
    projectName,
    contractPath,
    contractAnalysis,
    outputDir
  });

  vulnerabilities.push(...accessControl.vulnerabilities);
  artifacts.push(...accessControl.artifacts);

  // ============================================================================
  // PHASE 6: GAS OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing gas usage and optimization');

  const gasAnalysis = await ctx.task(gasAnalysisTask, {
    projectName,
    contractPath,
    outputDir
  });

  artifacts.push(...gasAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: AUDIT REPORT
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating audit report');

  const report = await ctx.task(contractAuditReportTask, {
    projectName,
    contractPath,
    blockchain,
    vulnerabilities,
    contractAnalysis,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Smart contract audit complete for ${projectName}. Found ${vulnerabilities.length} issues. Review audit report?`,
    title: 'Smart Contract Audit Complete',
    context: {
      runId: ctx.runId,
      summary: {
        blockchain,
        contractsAudited: contractAnalysis.contractCount,
        vulnerabilities: vulnerabilities.length,
        critical: report.bySeverity.critical || 0
      },
      files: report.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    vulnerabilities,
    auditReport: {
      reportPath: report.reportPath,
      totalVulnerabilities: vulnerabilities.length,
      bySeverity: report.bySeverity
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/smart-contract-auditing',
      timestamp: startTime,
      blockchain,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const contractAnalysisTask = defineTask('contract-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Contracts - ${args.projectName}`,
  agent: {
    name: 'smart-contract-auditor',
    prompt: {
      role: 'Smart Contract Analyst',
      task: 'Analyze contract structure',
      context: args,
      instructions: [
        '1. Parse contract source code',
        '2. Identify contract dependencies',
        '3. Map function visibility',
        '4. Identify state variables',
        '5. Map external calls',
        '6. Identify upgrade patterns',
        '7. Document contract architecture',
        '8. Create call graph'
      ],
      outputFormat: 'JSON with contract analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['contractCount', 'contracts', 'artifacts'],
      properties: {
        contractCount: { type: 'number' },
        contracts: { type: 'array' },
        dependencies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'smart-contract', 'analysis']
}));

export const contractStaticAnalysisTask = defineTask('contract-static-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Static Analysis - ${args.projectName}`,
  agent: {
    name: 'smart-contract-auditor',
    prompt: {
      role: 'Smart Contract Static Analyst',
      task: 'Run static analysis tools',
      context: args,
      instructions: [
        '1. Run Slither analysis',
        '2. Run Mythril symbolic execution',
        '3. Run Solhint linting',
        '4. Analyze for known patterns',
        '5. Check compiler warnings',
        '6. Analyze inheritance',
        '7. Check for deprecated features',
        '8. Document findings'
      ],
      outputFormat: 'JSON with static analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        toolResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'smart-contract', 'static']
}));

export const commonVulnsTask = defineTask('common-vulns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Check Common Vulns - ${args.projectName}`,
  agent: {
    name: 'smart-contract-auditor',
    prompt: {
      role: 'Smart Contract Vulnerability Specialist',
      task: 'Check for common vulnerability patterns',
      context: args,
      instructions: [
        '1. Check for reentrancy',
        '2. Check for integer overflow',
        '3. Check for front-running',
        '4. Check for oracle manipulation',
        '5. Check for flash loan attacks',
        '6. Check for timestamp dependence',
        '7. Check for DoS vectors',
        '8. Document findings'
      ],
      outputFormat: 'JSON with vulnerability findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        swcMatches: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'smart-contract', 'common-vulns']
}));

export const contractBusinessLogicTask = defineTask('contract-business-logic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Business Logic Analysis - ${args.projectName}`,
  agent: {
    name: 'smart-contract-auditor',
    prompt: {
      role: 'Smart Contract Logic Analyst',
      task: 'Analyze business logic security',
      context: args,
      instructions: [
        '1. Analyze token economics',
        '2. Check for logic flaws',
        '3. Verify mathematical operations',
        '4. Check for edge cases',
        '5. Analyze state transitions',
        '6. Check for privilege escalation',
        '7. Verify invariants',
        '8. Document findings'
      ],
      outputFormat: 'JSON with logic findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        logicIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'smart-contract', 'business-logic']
}));

export const contractAccessControlTask = defineTask('contract-access-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Access Control Review - ${args.projectName}`,
  agent: {
    name: 'smart-contract-auditor',
    prompt: {
      role: 'Smart Contract Access Control Analyst',
      task: 'Review access control',
      context: args,
      instructions: [
        '1. Analyze owner privileges',
        '2. Check modifier implementation',
        '3. Review role-based access',
        '4. Check for backdoors',
        '5. Analyze upgrade permissions',
        '6. Check for centralization risks',
        '7. Review emergency functions',
        '8. Document findings'
      ],
      outputFormat: 'JSON with access control findings'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        accessIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'smart-contract', 'access-control']
}));

export const gasAnalysisTask = defineTask('gas-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Gas Analysis - ${args.projectName}`,
  agent: {
    name: 'smart-contract-auditor',
    prompt: {
      role: 'Smart Contract Gas Analyst',
      task: 'Analyze gas usage',
      context: args,
      instructions: [
        '1. Analyze gas consumption',
        '2. Identify gas-heavy operations',
        '3. Check for DoS via gas',
        '4. Suggest optimizations',
        '5. Check storage patterns',
        '6. Analyze loop bounds',
        '7. Check for griefing vectors',
        '8. Document findings'
      ],
      outputFormat: 'JSON with gas analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['gasIssues', 'optimizations', 'artifacts'],
      properties: {
        gasIssues: { type: 'array' },
        optimizations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'smart-contract', 'gas']
}));

export const contractAuditReportTask = defineTask('contract-audit-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Audit Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Smart Contract Audit Report Specialist',
      task: 'Generate audit report',
      context: args,
      instructions: [
        '1. Summarize all findings',
        '2. Map to SWC registry',
        '3. Include code snippets',
        '4. Provide remediation',
        '5. Create executive summary',
        '6. Add risk ratings',
        '7. Include recommendations',
        '8. Format professionally'
      ],
      outputFormat: 'JSON with report'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'bySeverity', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        bySeverity: { type: 'object' },
        bySwc: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'smart-contract', 'reporting']
}));
