/**
 * @process meta/specialization-validator
 * @description Validate a specialization for completeness across all 7 phases
 * @inputs { specializationPath: string, detailed: boolean }
 * @outputs { success: boolean, valid: boolean, score: number, phases: object, gaps: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    specializationPath,
    detailed = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const gaps = [];

  ctx.log('info', `Validating specialization at: ${specializationPath}`);

  // ============================================================================
  // PHASE 1 VALIDATION: README and References
  // ============================================================================

  ctx.log('info', 'Validating Phase 1: README and References');

  const phase1 = await ctx.task(phase1ValidationTask, {
    specializationPath,
    detailed
  });

  artifacts.push(...phase1.artifacts);
  if (phase1.gaps) gaps.push(...phase1.gaps);

  // ============================================================================
  // PHASE 2 VALIDATION: Processes Backlog
  // ============================================================================

  ctx.log('info', 'Validating Phase 2: Processes Backlog');

  const phase2 = await ctx.task(phase2ValidationTask, {
    specializationPath,
    detailed
  });

  artifacts.push(...phase2.artifacts);
  if (phase2.gaps) gaps.push(...phase2.gaps);

  // ============================================================================
  // PHASE 3 VALIDATION: Process JS Files
  // ============================================================================

  ctx.log('info', 'Validating Phase 3: Process JS Files');

  const phase3 = await ctx.task(phase3ValidationTask, {
    specializationPath,
    detailed
  });

  artifacts.push(...phase3.artifacts);
  if (phase3.gaps) gaps.push(...phase3.gaps);

  // ============================================================================
  // PHASE 4 VALIDATION: Skills/Agents Backlog
  // ============================================================================

  ctx.log('info', 'Validating Phase 4: Skills/Agents Backlog');

  const phase4 = await ctx.task(phase4ValidationTask, {
    specializationPath,
    detailed
  });

  artifacts.push(...phase4.artifacts);
  if (phase4.gaps) gaps.push(...phase4.gaps);

  // ============================================================================
  // PHASE 5 VALIDATION: Skills/Agents References
  // ============================================================================

  ctx.log('info', 'Validating Phase 5: Skills/Agents References');

  const phase5 = await ctx.task(phase5ValidationTask, {
    specializationPath,
    detailed
  });

  artifacts.push(...phase5.artifacts);
  if (phase5.gaps) gaps.push(...phase5.gaps);

  // ============================================================================
  // PHASE 6 VALIDATION: Skills and Agents Created
  // ============================================================================

  ctx.log('info', 'Validating Phase 6: Skills and Agents');

  const phase6 = await ctx.task(phase6ValidationTask, {
    specializationPath,
    detailed
  });

  artifacts.push(...phase6.artifacts);
  if (phase6.gaps) gaps.push(...phase6.gaps);

  // ============================================================================
  // PHASE 7 VALIDATION: Integration
  // ============================================================================

  ctx.log('info', 'Validating Phase 7: Integration');

  const phase7 = await ctx.task(phase7ValidationTask, {
    specializationPath,
    detailed
  });

  artifacts.push(...phase7.artifacts);
  if (phase7.gaps) gaps.push(...phase7.gaps);

  // ============================================================================
  // CALCULATE OVERALL SCORE
  // ============================================================================

  const phaseScores = {
    phase1: phase1.score || 0,
    phase2: phase2.score || 0,
    phase3: phase3.score || 0,
    phase4: phase4.score || 0,
    phase5: phase5.score || 0,
    phase6: phase6.score || 0,
    phase7: phase7.score || 0
  };

  // Weighted average (phases 1-3 more important)
  const weights = {
    phase1: 15,
    phase2: 10,
    phase3: 25,
    phase4: 10,
    phase5: 5,
    phase6: 20,
    phase7: 15
  };

  let totalWeight = 0;
  let weightedScore = 0;

  for (const phase of Object.keys(phaseScores)) {
    weightedScore += phaseScores[phase] * weights[phase];
    totalWeight += weights[phase];
  }

  const overallScore = Math.round(weightedScore / totalWeight);
  const valid = overallScore >= 80 && gaps.length === 0;

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    valid,
    score: overallScore,
    phases: {
      phase1: { score: phase1.score, complete: phase1.complete, issues: phase1.issues },
      phase2: { score: phase2.score, complete: phase2.complete, issues: phase2.issues },
      phase3: { score: phase3.score, complete: phase3.complete, issues: phase3.issues },
      phase4: { score: phase4.score, complete: phase4.complete, issues: phase4.issues },
      phase5: { score: phase5.score, complete: phase5.complete, issues: phase5.issues },
      phase6: { score: phase6.score, complete: phase6.complete, issues: phase6.issues },
      phase7: { score: phase7.score, complete: phase7.complete, issues: phase7.issues }
    },
    summary: {
      totalProcesses: phase3.processCount || 0,
      totalSkills: phase6.skillCount || 0,
      totalAgents: phase6.agentCount || 0,
      integratedProcesses: phase7.integratedCount || 0
    },
    gaps,
    recommendations: gaps.map(g => `Fix: ${g}`),
    artifacts,
    duration,
    metadata: {
      processId: 'meta/specialization-validator',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1 Validation
export const phase1ValidationTask = defineTask('phase1-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Phase 1: README and References',
  skill: { name: 'specialization-validator' },
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Specialization quality auditor',
      task: 'Validate Phase 1 completion',
      context: args,
      instructions: [
        `Check if ${args.specializationPath}/README.md exists`,
        'Validate README.md has:',
        '  - Overview section',
        '  - Roles and responsibilities',
        '  - Directory structure',
        '  - Best practices',
        `Check if ${args.specializationPath}/references.md exists`,
        'Validate references.md has:',
        '  - Categorized references',
        '  - Working links (if detailed)',
        'Score 0-100 based on completeness',
        'List any gaps or issues'
      ],
      outputFormat: 'JSON with score, complete, issues, gaps, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'complete', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        complete: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'validation', 'phase1']
}));

// Phase 2 Validation
export const phase2ValidationTask = defineTask('phase2-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Phase 2: Processes Backlog',
  skill: { name: 'specialization-validator' },
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Specialization quality auditor',
      task: 'Validate Phase 2 completion',
      context: args,
      instructions: [
        `Check if ${args.specializationPath}/processes-backlog.md exists`,
        'Validate processes-backlog.md has:',
        '  - List of processes with TODO format',
        '  - Process descriptions',
        '  - References where applicable',
        'Count total processes identified',
        'Score 0-100 based on completeness'
      ],
      outputFormat: 'JSON with score, complete, processCount, issues, gaps, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'complete', 'artifacts'],
      properties: {
        score: { type: 'number' },
        complete: { type: 'boolean' },
        processCount: { type: 'number' },
        issues: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'validation', 'phase2']
}));

// Phase 3 Validation
export const phase3ValidationTask = defineTask('phase3-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Phase 3: Process JS Files',
  skill: { name: 'process-validator' },
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Process validation specialist',
      task: 'Validate Phase 3 completion',
      context: args,
      instructions: [
        `List all *.js files in ${args.specializationPath}`,
        'For each process file validate:',
        '  - Has JSDoc metadata',
        '  - Imports defineTask',
        '  - Exports process function',
        '  - Has task definitions',
        'Compare against processes-backlog.md',
        'Count implemented vs planned',
        'Score 0-100 based on completion'
      ],
      outputFormat: 'JSON with score, complete, processCount, implementedCount, issues, gaps, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'complete', 'artifacts'],
      properties: {
        score: { type: 'number' },
        complete: { type: 'boolean' },
        processCount: { type: 'number' },
        implementedCount: { type: 'number' },
        issues: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'validation', 'phase3']
}));

// Phase 4 Validation
export const phase4ValidationTask = defineTask('phase4-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Phase 4: Skills/Agents Backlog',
  skill: { name: 'specialization-validator' },
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Specialization quality auditor',
      task: 'Validate Phase 4 completion',
      context: args,
      instructions: [
        `Check if ${args.specializationPath}/skills-agents-backlog.md exists`,
        'Validate backlog has:',
        '  - Skills section with SK-XX-NNN format',
        '  - Agents section with AG-XX-NNN format',
        '  - Process-to-Skill/Agent mapping table',
        'Count skills and agents identified',
        'Score 0-100 based on completeness'
      ],
      outputFormat: 'JSON with score, complete, skillCount, agentCount, issues, gaps, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'complete', 'artifacts'],
      properties: {
        score: { type: 'number' },
        complete: { type: 'boolean' },
        skillCount: { type: 'number' },
        agentCount: { type: 'number' },
        issues: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'validation', 'phase4']
}));

// Phase 5 Validation
export const phase5ValidationTask = defineTask('phase5-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Phase 5: Skills/Agents References',
  skill: { name: 'specialization-validator' },
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Specialization quality auditor',
      task: 'Validate Phase 5 completion',
      context: args,
      instructions: [
        `Check if ${args.specializationPath}/skills-agents-references.md exists`,
        'Validate references file has:',
        '  - External skill/agent references',
        '  - GitHub links',
        '  - MCP server references',
        'Score 0-100 based on completeness'
      ],
      outputFormat: 'JSON with score, complete, referenceCount, issues, gaps, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'complete', 'artifacts'],
      properties: {
        score: { type: 'number' },
        complete: { type: 'boolean' },
        referenceCount: { type: 'number' },
        issues: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'validation', 'phase5']
}));

// Phase 6 Validation
export const phase6ValidationTask = defineTask('phase6-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Phase 6: Skills and Agents',
  skill: { name: 'skill-validator' },
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Skill and agent validation specialist',
      task: 'Validate Phase 6 completion',
      context: args,
      instructions: [
        `List all directories in ${args.specializationPath}/skills/`,
        `List all directories in ${args.specializationPath}/agents/`,
        'For each skill, validate SKILL.md exists with proper frontmatter',
        'For each agent, validate AGENT.md exists with proper frontmatter',
        'Compare against skills-agents-backlog.md',
        'Count created vs planned',
        'Score 0-100 based on completion'
      ],
      outputFormat: 'JSON with score, complete, skillCount, agentCount, issues, gaps, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'complete', 'artifacts'],
      properties: {
        score: { type: 'number' },
        complete: { type: 'boolean' },
        skillCount: { type: 'number' },
        agentCount: { type: 'number' },
        issues: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'validation', 'phase6']
}));

// Phase 7 Validation
export const phase7ValidationTask = defineTask('phase7-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Phase 7: Integration',
  skill: { name: 'process-validator' },
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Integration validation specialist',
      task: 'Validate Phase 7 completion',
      context: args,
      instructions: [
        'Read all process JS files',
        'For each task definition, check:',
        '  - skill.name field is set',
        '  - agent.name field is set',
        '  - References match skills-agents-backlog.md mapping',
        'Count integrated vs total tasks',
        'Score 0-100 based on integration completeness'
      ],
      outputFormat: 'JSON with score, complete, integratedCount, totalTasks, issues, gaps, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'complete', 'artifacts'],
      properties: {
        score: { type: 'number' },
        complete: { type: 'boolean' },
        integratedCount: { type: 'number' },
        totalTasks: { type: 'number' },
        issues: { type: 'array' },
        gaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'validation', 'phase7']
}));
