/**
 * @process specializations/security-research/red-team-operations
 * @description Full-scope adversarial simulation mimicking real threat actors to test organizational
 * defenses. Covers initial access, persistence, lateral movement, and objective completion using
 * MITRE ATT&CK framework methodology.
 * @inputs { projectName: string, targetOrg: object, objectives: array, rules: object }
 * @outputs { success: boolean, objectivesAchieved: array, ttps: array, redTeamReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/red-team-operations', {
 *   projectName: 'Annual Red Team Assessment',
 *   targetOrg: { name: 'Acme Corp', scope: ['*.acme.com', '10.0.0.0/8'] },
 *   objectives: ['domain-admin', 'data-exfil'],
 *   rules: { noProduction: true, safeDays: ['Mon-Fri'] }
 * });
 *
 * @references
 * - MITRE ATT&CK: https://attack.mitre.org/
 * - Red Team Development: https://redteam.guide/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetOrg,
    objectives,
    rules,
    duration = '2-weeks',
    outputDir = 'red-team-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const ttps = [];
  const objectivesAchieved = [];

  ctx.log('info', `Starting Red Team Operation for ${projectName}`);
  ctx.log('info', `Target: ${targetOrg.name}, Objectives: ${objectives.join(', ')}`);

  // Rules of engagement verification
  await ctx.breakpoint({
    question: `Red team operation for ${targetOrg.name}. Confirm rules of engagement are documented and authorization is obtained. Proceed?`,
    title: 'Red Team Authorization',
    context: {
      runId: ctx.runId,
      targetOrg,
      objectives,
      rules
    }
  });

  // ============================================================================
  // PHASE 1: RECONNAISSANCE
  // ============================================================================

  ctx.log('info', 'Phase 1: External reconnaissance');

  const reconnaissance = await ctx.task(redTeamReconTask, {
    projectName,
    targetOrg,
    outputDir
  });

  ttps.push(...reconnaissance.ttps);
  artifacts.push(...reconnaissance.artifacts);

  // ============================================================================
  // PHASE 2: INITIAL ACCESS
  // ============================================================================

  ctx.log('info', 'Phase 2: Attempting initial access');

  const initialAccess = await ctx.task(initialAccessTask, {
    projectName,
    targetOrg,
    reconnaissance,
    rules,
    outputDir
  });

  ttps.push(...initialAccess.ttps);
  artifacts.push(...initialAccess.artifacts);

  // ============================================================================
  // PHASE 3: EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Establishing execution capabilities');

  const execution = await ctx.task(executionTask, {
    projectName,
    initialAccess,
    rules,
    outputDir
  });

  ttps.push(...execution.ttps);
  artifacts.push(...execution.artifacts);

  // ============================================================================
  // PHASE 4: PERSISTENCE
  // ============================================================================

  ctx.log('info', 'Phase 4: Establishing persistence');

  const persistence = await ctx.task(persistenceTask, {
    projectName,
    execution,
    rules,
    outputDir
  });

  ttps.push(...persistence.ttps);
  artifacts.push(...persistence.artifacts);

  // ============================================================================
  // PHASE 5: PRIVILEGE ESCALATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Privilege escalation');

  const privEsc = await ctx.task(privEscTask, {
    projectName,
    execution,
    persistence,
    outputDir
  });

  ttps.push(...privEsc.ttps);
  artifacts.push(...privEsc.artifacts);

  // ============================================================================
  // PHASE 6: LATERAL MOVEMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Lateral movement');

  const lateralMovement = await ctx.task(lateralMovementTask, {
    projectName,
    privEsc,
    targetOrg,
    rules,
    outputDir
  });

  ttps.push(...lateralMovement.ttps);
  artifacts.push(...lateralMovement.artifacts);

  // ============================================================================
  // PHASE 7: OBJECTIVE COMPLETION
  // ============================================================================

  ctx.log('info', 'Phase 7: Completing objectives');

  const objectiveCompletion = await ctx.task(objectiveCompletionTask, {
    projectName,
    objectives,
    lateralMovement,
    privEsc,
    rules,
    outputDir
  });

  objectivesAchieved.push(...objectiveCompletion.achieved);
  ttps.push(...objectiveCompletion.ttps);
  artifacts.push(...objectiveCompletion.artifacts);

  // ============================================================================
  // PHASE 8: REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating red team report');

  const report = await ctx.task(redTeamReportTask, {
    projectName,
    targetOrg,
    objectives,
    objectivesAchieved,
    ttps,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Red team operation complete. ${objectivesAchieved.length}/${objectives.length} objectives achieved. Review findings and debrief?`,
    title: 'Red Team Operation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        objectives: objectives.length,
        achieved: objectivesAchieved.length,
        ttpsUsed: ttps.length
      },
      files: report.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    objectivesAchieved,
    ttps,
    redTeamReport: {
      reportPath: report.reportPath,
      objectivesAchieved: objectivesAchieved.length,
      totalObjectives: objectives.length
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/red-team-operations',
      timestamp: startTime,
      targetOrg,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const redTeamReconTask = defineTask('red-team-recon', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reconnaissance - ${args.projectName}`,
  agent: {
    name: 'red-team-operator',
    prompt: {
      role: 'Red Team Operator',
      task: 'Conduct external reconnaissance',
      context: args,
      instructions: [
        '1. OSINT on target organization',
        '2. Map external attack surface',
        '3. Identify employees for social engineering',
        '4. Enumerate domains and subdomains',
        '5. Identify exposed services',
        '6. Collect credential leaks',
        '7. Map technology stack',
        '8. Document TTPs used'
      ],
      outputFormat: 'JSON with recon results'
    },
    outputSchema: {
      type: 'object',
      required: ['attackSurface', 'ttps', 'artifacts'],
      properties: {
        attackSurface: { type: 'object' },
        targets: { type: 'array' },
        ttps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'red-team', 'recon']
}));

export const initialAccessTask = defineTask('initial-access', (args, taskCtx) => ({
  kind: 'agent',
  title: `Initial Access - ${args.projectName}`,
  agent: {
    name: 'red-team-operator',
    prompt: {
      role: 'Red Team Operator',
      task: 'Achieve initial access',
      context: args,
      instructions: [
        '1. Attempt phishing attacks',
        '2. Exploit external vulnerabilities',
        '3. Attempt credential attacks',
        '4. Test physical access',
        '5. Attempt supply chain vectors',
        '6. Test trusted relationships',
        '7. Document successful access',
        '8. Document TTPs used'
      ],
      outputFormat: 'JSON with initial access results'
    },
    outputSchema: {
      type: 'object',
      required: ['accessAchieved', 'ttps', 'artifacts'],
      properties: {
        accessAchieved: { type: 'boolean' },
        accessMethod: { type: 'string' },
        foothold: { type: 'object' },
        ttps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'red-team', 'initial-access']
}));

export const executionTask = defineTask('execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execution - ${args.projectName}`,
  agent: {
    name: 'red-team-operator',
    prompt: {
      role: 'Red Team Operator',
      task: 'Establish execution capabilities',
      context: args,
      instructions: [
        '1. Execute code on target',
        '2. Bypass security controls',
        '3. Establish C2 channel',
        '4. Test detection capabilities',
        '5. Document evasion techniques',
        '6. Assess response time',
        '7. Document detection gaps',
        '8. Document TTPs used'
      ],
      outputFormat: 'JSON with execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['executionAchieved', 'ttps', 'artifacts'],
      properties: {
        executionAchieved: { type: 'boolean' },
        c2Established: { type: 'boolean' },
        detectionEvaded: { type: 'boolean' },
        ttps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'red-team', 'execution']
}));

export const persistenceTask = defineTask('persistence', (args, taskCtx) => ({
  kind: 'agent',
  title: `Persistence - ${args.projectName}`,
  agent: {
    name: 'red-team-operator',
    prompt: {
      role: 'Red Team Operator',
      task: 'Establish persistence',
      context: args,
      instructions: [
        '1. Deploy persistence mechanisms',
        '2. Test reboot survival',
        '3. Establish backup access',
        '4. Document persistence methods',
        '5. Test cleanup procedures',
        '6. Assess detection risk',
        '7. Document stealth techniques',
        '8. Document TTPs used'
      ],
      outputFormat: 'JSON with persistence results'
    },
    outputSchema: {
      type: 'object',
      required: ['persistenceAchieved', 'ttps', 'artifacts'],
      properties: {
        persistenceAchieved: { type: 'boolean' },
        mechanisms: { type: 'array' },
        ttps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'red-team', 'persistence']
}));

export const privEscTask = defineTask('priv-esc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Privilege Escalation - ${args.projectName}`,
  agent: {
    name: 'red-team-operator',
    prompt: {
      role: 'Red Team Operator',
      task: 'Escalate privileges',
      context: args,
      instructions: [
        '1. Enumerate local privileges',
        '2. Attempt local escalation',
        '3. Harvest credentials',
        '4. Target service accounts',
        '5. Exploit misconfigurations',
        '6. Document escalation paths',
        '7. Test detection capabilities',
        '8. Document TTPs used'
      ],
      outputFormat: 'JSON with priv esc results'
    },
    outputSchema: {
      type: 'object',
      required: ['elevated', 'ttps', 'artifacts'],
      properties: {
        elevated: { type: 'boolean' },
        privilegeLevel: { type: 'string' },
        credentials: { type: 'array' },
        ttps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'red-team', 'priv-esc']
}));

export const lateralMovementTask = defineTask('lateral-movement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Lateral Movement - ${args.projectName}`,
  agent: {
    name: 'red-team-operator',
    prompt: {
      role: 'Red Team Operator',
      task: 'Perform lateral movement',
      context: args,
      instructions: [
        '1. Enumerate internal network',
        '2. Identify target systems',
        '3. Use harvested credentials',
        '4. Move to sensitive systems',
        '5. Avoid detection',
        '6. Document network access',
        '7. Map internal architecture',
        '8. Document TTPs used'
      ],
      outputFormat: 'JSON with lateral movement results'
    },
    outputSchema: {
      type: 'object',
      required: ['systemsCompromised', 'ttps', 'artifacts'],
      properties: {
        systemsCompromised: { type: 'array' },
        networkAccess: { type: 'object' },
        ttps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'red-team', 'lateral-movement']
}));

export const objectiveCompletionTask = defineTask('objective-completion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Complete Objectives - ${args.projectName}`,
  agent: {
    name: 'red-team-operator',
    prompt: {
      role: 'Red Team Operator',
      task: 'Complete red team objectives',
      context: args,
      instructions: [
        '1. Attempt each objective',
        '2. Document objective completion',
        '3. Collect evidence',
        '4. Demonstrate impact',
        '5. Document blocked objectives',
        '6. Note detection events',
        '7. Assess overall success',
        '8. Document TTPs used'
      ],
      outputFormat: 'JSON with objective results'
    },
    outputSchema: {
      type: 'object',
      required: ['achieved', 'ttps', 'artifacts'],
      properties: {
        achieved: { type: 'array' },
        failed: { type: 'array' },
        evidence: { type: 'array' },
        ttps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'red-team', 'objectives']
}));

export const redTeamReportTask = defineTask('red-team-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Red Team Report Specialist',
      task: 'Generate red team report',
      context: args,
      instructions: [
        '1. Create attack narrative',
        '2. Map TTPs to ATT&CK',
        '3. Document objectives achieved',
        '4. Include timeline',
        '5. Create executive summary',
        '6. Add recommendations',
        '7. Include detection gaps',
        '8. Format professionally'
      ],
      outputFormat: 'JSON with report'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'attackNarrative', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        attackNarrative: { type: 'string' },
        ttpsUsed: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'red-team', 'reporting']
}));
