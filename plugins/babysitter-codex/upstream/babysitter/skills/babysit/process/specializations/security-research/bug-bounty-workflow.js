/**
 * @process specializations/security-research/bug-bounty-workflow
 * @description End-to-end workflow for participating in bug bounty programs from scope review through
 * submission and reward. Covers target reconnaissance, vulnerability hunting, reporting, and program
 * communication best practices.
 * @inputs { projectName: string, program: object, targetScope: object }
 * @outputs { success: boolean, submissions: array, totalRewards?: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/bug-bounty-workflow', {
 *   projectName: 'HackerOne Bug Bounty',
 *   program: { platform: 'hackerone', name: 'acme-corp' },
 *   targetScope: { domains: ['*.acme.com'], apps: ['mobile-app'] }
 * });
 *
 * @references
 * - HackerOne: https://www.hackerone.com/
 * - Bugcrowd: https://www.bugcrowd.com/
 * - Intigriti: https://www.intigriti.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    program,
    targetScope,
    huntingDuration = '1-week',
    outputDir = 'bug-bounty-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const submissions = [];

  ctx.log('info', `Starting Bug Bounty Workflow for ${projectName}`);
  ctx.log('info', `Program: ${program.name} on ${program.platform}`);

  // ============================================================================
  // PHASE 1: PROGRAM REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 1: Reviewing bug bounty program scope and rules');

  const programReview = await ctx.task(programReviewTask, {
    projectName,
    program,
    targetScope,
    outputDir
  });

  artifacts.push(...programReview.artifacts);

  // ============================================================================
  // PHASE 2: TARGET RECONNAISSANCE
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting target reconnaissance');

  const reconnaissance = await ctx.task(reconnaissanceTask, {
    projectName,
    program,
    targetScope,
    programReview,
    outputDir
  });

  artifacts.push(...reconnaissance.artifacts);

  // ============================================================================
  // PHASE 3: VULNERABILITY HUNTING
  // ============================================================================

  ctx.log('info', 'Phase 3: Hunting for vulnerabilities');

  const vulnHunting = await ctx.task(vulnHuntingTask, {
    projectName,
    reconnaissance,
    programReview,
    outputDir
  });

  artifacts.push(...vulnHunting.artifacts);

  // ============================================================================
  // PHASE 4: VULNERABILITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Validating and prioritizing findings');

  const validation = await ctx.task(bountyValidationTask, {
    projectName,
    vulnerabilities: vulnHunting.findings,
    programReview,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  // ============================================================================
  // PHASE 5: REPORT PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Preparing submission reports');

  const reportPrep = await ctx.task(reportPreparationTask, {
    projectName,
    validatedFindings: validation.validatedFindings,
    program,
    outputDir
  });

  artifacts.push(...reportPrep.artifacts);

  // ============================================================================
  // PHASE 6: SUBMISSION
  // ============================================================================

  ctx.log('info', 'Phase 6: Submitting to bug bounty platform');

  const submission = await ctx.task(submissionTask, {
    projectName,
    reports: reportPrep.reports,
    program,
    outputDir
  });

  submissions.push(...submission.submissions);
  artifacts.push(...submission.artifacts);

  // ============================================================================
  // PHASE 7: FOLLOW-UP
  // ============================================================================

  ctx.log('info', 'Phase 7: Managing follow-up and communication');

  const followUp = await ctx.task(followUpTask, {
    projectName,
    submissions: submission.submissions,
    program,
    outputDir
  });

  artifacts.push(...followUp.artifacts);

  await ctx.breakpoint({
    question: `Bug bounty workflow complete. ${submission.submissions.length} reports submitted. Track status and rewards?`,
    title: 'Bug Bounty Workflow Complete',
    context: {
      runId: ctx.runId,
      summary: {
        program: program.name,
        findingsTotal: vulnHunting.findings.length,
        validated: validation.validatedFindings.length,
        submitted: submission.submissions.length
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    submissions,
    summary: {
      findingsTotal: vulnHunting.findings.length,
      validated: validation.validatedFindings.length,
      submitted: submission.submissions.length
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/bug-bounty-workflow',
      timestamp: startTime,
      program,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const programReviewTask = defineTask('program-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review Program - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'Bug Bounty Program Specialist',
      task: 'Review bug bounty program scope and rules',
      context: args,
      instructions: [
        '1. Review program scope',
        '2. Identify in-scope assets',
        '3. Understand out-of-scope items',
        '4. Review reward structure',
        '5. Understand vulnerability priorities',
        '6. Review safe harbor policy',
        '7. Note submission requirements',
        '8. Document program rules'
      ],
      outputFormat: 'JSON with program review'
    },
    outputSchema: {
      type: 'object',
      required: ['inScope', 'outOfScope', 'rewards', 'artifacts'],
      properties: {
        inScope: { type: 'array' },
        outOfScope: { type: 'array' },
        rewards: { type: 'object' },
        priorities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'bug-bounty', 'program']
}));

export const reconnaissanceTask = defineTask('reconnaissance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Conduct Recon - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'Bug Bounty Reconnaissance Specialist',
      task: 'Conduct target reconnaissance',
      context: args,
      instructions: [
        '1. Enumerate subdomains',
        '2. Discover hidden endpoints',
        '3. Identify technologies',
        '4. Find API endpoints',
        '5. Discover legacy assets',
        '6. Map attack surface',
        '7. Identify entry points',
        '8. Document findings'
      ],
      outputFormat: 'JSON with recon results'
    },
    outputSchema: {
      type: 'object',
      required: ['assets', 'endpoints', 'technologies', 'artifacts'],
      properties: {
        assets: { type: 'array' },
        endpoints: { type: 'array' },
        technologies: { type: 'array' },
        attackSurface: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'bug-bounty', 'recon']
}));

export const vulnHuntingTask = defineTask('vuln-hunting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hunt Vulnerabilities - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'Vulnerability Hunter',
      task: 'Hunt for vulnerabilities',
      context: args,
      instructions: [
        '1. Test for OWASP Top 10',
        '2. Check authentication flaws',
        '3. Test for injection',
        '4. Check authorization',
        '5. Test for information disclosure',
        '6. Check business logic',
        '7. Test for SSRF/CSRF',
        '8. Document findings'
      ],
      outputFormat: 'JSON with findings'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'totalFound', 'artifacts'],
      properties: {
        findings: { type: 'array' },
        totalFound: { type: 'number' },
        bySeverity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'bug-bounty', 'hunting']
}));

export const bountyValidationTask = defineTask('bounty-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Findings - ${args.projectName}`,
  agent: {
    name: 'web-security-researcher',
    prompt: {
      role: 'Finding Validation Specialist',
      task: 'Validate and prioritize findings',
      context: args,
      instructions: [
        '1. Verify each finding',
        '2. Confirm reproducibility',
        '3. Check against scope',
        '4. Assess severity',
        '5. Check for duplicates',
        '6. Prioritize by reward',
        '7. Identify strongest findings',
        '8. Document validation'
      ],
      outputFormat: 'JSON with validation'
    },
    outputSchema: {
      type: 'object',
      required: ['validatedFindings', 'artifacts'],
      properties: {
        validatedFindings: { type: 'array' },
        rejected: { type: 'array' },
        prioritized: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'bug-bounty', 'validation']
}));

export const reportPreparationTask = defineTask('report-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare Reports - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Bug Bounty Report Writer',
      task: 'Prepare submission reports',
      context: args,
      instructions: [
        '1. Write clear title',
        '2. Describe vulnerability',
        '3. Include reproduction steps',
        '4. Add proof of concept',
        '5. Describe impact',
        '6. Suggest remediation',
        '7. Add supporting evidence',
        '8. Format per platform'
      ],
      outputFormat: 'JSON with reports'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'artifacts'],
      properties: {
        reports: { type: 'array' },
        reportsCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'bug-bounty', 'reporting']
}));

export const submissionTask = defineTask('submission', (args, taskCtx) => ({
  kind: 'agent',
  title: `Submit Reports - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Bug Bounty Submission Specialist',
      task: 'Submit to bug bounty platform',
      context: args,
      instructions: [
        '1. Review submission guidelines',
        '2. Format reports correctly',
        '3. Submit highest priority first',
        '4. Track submission IDs',
        '5. Document submission time',
        '6. Save confirmation',
        '7. Set follow-up reminders',
        '8. Document submissions'
      ],
      outputFormat: 'JSON with submissions'
    },
    outputSchema: {
      type: 'object',
      required: ['submissions', 'artifacts'],
      properties: {
        submissions: { type: 'array' },
        successCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'bug-bounty', 'submission']
}));

export const followUpTask = defineTask('follow-up', (args, taskCtx) => ({
  kind: 'agent',
  title: `Manage Follow-up - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Bug Bounty Follow-up Specialist',
      task: 'Manage follow-up communication',
      context: args,
      instructions: [
        '1. Track submission status',
        '2. Respond to triager questions',
        '3. Provide additional info',
        '4. Handle duplicate disputes',
        '5. Track resolution timeline',
        '6. Follow up on bounties',
        '7. Request disclosure permission',
        '8. Document communication'
      ],
      outputFormat: 'JSON with follow-up'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'artifacts'],
      properties: {
        status: { type: 'object' },
        pendingActions: { type: 'array' },
        communications: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'bug-bounty', 'follow-up']
}));
