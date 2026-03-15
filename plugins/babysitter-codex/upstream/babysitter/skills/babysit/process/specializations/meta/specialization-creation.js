/**
 * @process meta/specialization-creation
 * @description Create a new specialization with all 7 phases in sequence - from research to integration
 * @inputs { name: string, domain: string|null, description: string, scope: string, outputDir: string }
 * @outputs { success: boolean, specialization: object, phases: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    name,
    domain = null, // null for R&D specializations, string for domain specializations
    description,
    scope,
    outputDir = 'plugins/babysitter/skills/babysit/process/specializations',
    existingReferences = [],
    skipPhases = []
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const phaseResults = {};

  ctx.log('info', `Starting specialization creation for: ${name}`);

  // Determine base path
  const basePath = domain
    ? `${outputDir}/domains/${domain}/${name}`
    : `${outputDir}/${name}`;

  // ============================================================================
  // PHASE 1: RESEARCH, README AND REFERENCES
  // ============================================================================

  if (!skipPhases.includes(1)) {
    ctx.log('info', 'Phase 1: Research, README, and References');

    const phase1 = await ctx.task(phase1ResearchTask, {
      name,
      domain,
      description,
      scope,
      basePath,
      existingReferences
    });

    phaseResults.phase1 = phase1;
    artifacts.push(...phase1.artifacts);

    await ctx.breakpoint({
      question: `Phase 1 complete. README.md and references.md created. Review before proceeding to Phase 2?`,
      title: 'Phase 1 Review - Research & README',
      context: {
        runId: ctx.runId,
        files: phase1.artifacts.map(a => ({
          path: a.path,
          format: 'markdown',
          label: a.label
        })),
        summary: {
          specialization: name,
          domain: domain || 'R&D',
          filesCreated: phase1.artifacts.length
        }
      }
    });
  }

  // ============================================================================
  // PHASE 2: IDENTIFYING PROCESSES
  // ============================================================================

  if (!skipPhases.includes(2)) {
    ctx.log('info', 'Phase 2: Identifying Processes');

    const phase2 = await ctx.task(phase2IdentifyProcessesTask, {
      name,
      domain,
      description,
      scope,
      basePath,
      readmePath: `${basePath}/README.md`,
      referencesPath: `${basePath}/references.md`
    });

    phaseResults.phase2 = phase2;
    artifacts.push(...phase2.artifacts);

    await ctx.breakpoint({
      question: `Phase 2 complete. ${phase2.processCount} processes identified. Review processes-backlog.md before proceeding?`,
      title: 'Phase 2 Review - Process Identification',
      context: {
        runId: ctx.runId,
        files: phase2.artifacts.map(a => ({
          path: a.path,
          format: 'markdown',
          label: a.label
        })),
        summary: {
          processCount: phase2.processCount,
          categories: phase2.categories
        }
      }
    });
  }

  // ============================================================================
  // PHASE 3: CREATE PROCESS JS FILES
  // ============================================================================

  if (!skipPhases.includes(3)) {
    ctx.log('info', 'Phase 3: Creating Process JS Files');

    const phase3 = await ctx.task(phase3CreateProcessesTask, {
      name,
      domain,
      basePath,
      processesBacklogPath: `${basePath}/processes-backlog.md`
    });

    phaseResults.phase3 = phase3;
    artifacts.push(...phase3.artifacts);

    await ctx.breakpoint({
      question: `Phase 3 complete. ${phase3.filesCreated} process files created. Review before proceeding to Phase 4?`,
      title: 'Phase 3 Review - Process Implementation',
      context: {
        runId: ctx.runId,
        files: phase3.artifacts.slice(0, 10).map(a => ({
          path: a.path,
          format: 'javascript',
          label: a.label
        })),
        summary: {
          filesCreated: phase3.filesCreated,
          processNames: phase3.processNames
        }
      }
    });
  }

  // ============================================================================
  // PHASE 4: IDENTIFY SKILLS AND AGENTS
  // ============================================================================

  if (!skipPhases.includes(4)) {
    ctx.log('info', 'Phase 4: Identifying Skills and Agents');

    const phase4 = await ctx.task(phase4IdentifySkillsAgentsTask, {
      name,
      domain,
      basePath,
      processFiles: phaseResults.phase3?.processFiles || []
    });

    phaseResults.phase4 = phase4;
    artifacts.push(...phase4.artifacts);

    await ctx.breakpoint({
      question: `Phase 4 complete. ${phase4.skillCount} skills and ${phase4.agentCount} agents identified. Review skills-agents-backlog.md?`,
      title: 'Phase 4 Review - Skills & Agents Identification',
      context: {
        runId: ctx.runId,
        files: phase4.artifacts.map(a => ({
          path: a.path,
          format: 'markdown',
          label: a.label
        })),
        summary: {
          skillCount: phase4.skillCount,
          agentCount: phase4.agentCount,
          mappingEntries: phase4.mappingEntries
        }
      }
    });
  }

  // ============================================================================
  // PHASE 5: RESEARCH REFERENCES FOR SKILLS/AGENTS
  // ============================================================================

  if (!skipPhases.includes(5)) {
    ctx.log('info', 'Phase 5: Researching References');

    const phase5 = await ctx.task(phase5ResearchReferencesTask, {
      name,
      domain,
      basePath,
      skillsAgentsBacklogPath: `${basePath}/skills-agents-backlog.md`
    });

    phaseResults.phase5 = phase5;
    artifacts.push(...phase5.artifacts);

    await ctx.breakpoint({
      question: `Phase 5 complete. ${phase5.referencesFound} external references found. Review skills-agents-references.md?`,
      title: 'Phase 5 Review - External References',
      context: {
        runId: ctx.runId,
        files: phase5.artifacts.map(a => ({
          path: a.path,
          format: 'markdown',
          label: a.label
        })),
        summary: {
          referencesFound: phase5.referencesFound,
          reusableCandidates: phase5.reusableCandidates
        }
      }
    });
  }

  // ============================================================================
  // PHASE 6: CREATE SKILLS AND AGENTS
  // ============================================================================

  if (!skipPhases.includes(6)) {
    ctx.log('info', 'Phase 6: Creating Skills and Agents');

    const phase6 = await ctx.task(phase6CreateSkillsAgentsTask, {
      name,
      domain,
      basePath,
      skillsAgentsBacklogPath: `${basePath}/skills-agents-backlog.md`,
      referencesPath: `${basePath}/skills-agents-references.md`
    });

    phaseResults.phase6 = phase6;
    artifacts.push(...phase6.artifacts);

    await ctx.breakpoint({
      question: `Phase 6 complete. ${phase6.skillsCreated} skills and ${phase6.agentsCreated} agents created. Review before final integration?`,
      title: 'Phase 6 Review - Skills & Agents Creation',
      context: {
        runId: ctx.runId,
        files: phase6.artifacts.slice(0, 10).map(a => ({
          path: a.path,
          format: 'markdown',
          label: a.label
        })),
        summary: {
          skillsCreated: phase6.skillsCreated,
          agentsCreated: phase6.agentsCreated,
          totalFiles: phase6.artifacts.length
        }
      }
    });
  }

  // ============================================================================
  // PHASE 7: INTEGRATE SKILLS AND AGENTS
  // ============================================================================

  if (!skipPhases.includes(7)) {
    ctx.log('info', 'Phase 7: Integrating Skills and Agents');

    const phase7 = await ctx.task(phase7IntegrateTask, {
      name,
      domain,
      basePath,
      skillsAgentsBacklogPath: `${basePath}/skills-agents-backlog.md`
    });

    phaseResults.phase7 = phase7;
    artifacts.push(...phase7.artifacts);
  }

  // ============================================================================
  // FINAL VALIDATION
  // ============================================================================

  ctx.log('info', 'Running final validation');

  const validation = await ctx.task(validationTask, {
    name,
    domain,
    basePath,
    phaseResults
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validation.valid,
    specialization: {
      name,
      domain: domain || 'R&D',
      basePath,
      description
    },
    phases: {
      phase1: phaseResults.phase1 ? 'complete' : 'skipped',
      phase2: phaseResults.phase2 ? 'complete' : 'skipped',
      phase3: phaseResults.phase3 ? 'complete' : 'skipped',
      phase4: phaseResults.phase4 ? 'complete' : 'skipped',
      phase5: phaseResults.phase5 ? 'complete' : 'skipped',
      phase6: phaseResults.phase6 ? 'complete' : 'skipped',
      phase7: phaseResults.phase7 ? 'complete' : 'skipped'
    },
    stats: {
      processCount: phaseResults.phase3?.filesCreated || 0,
      skillCount: phaseResults.phase6?.skillsCreated || 0,
      agentCount: phaseResults.phase6?.agentsCreated || 0
    },
    validation: validation.results,
    artifacts,
    duration,
    metadata: {
      processId: 'meta/specialization-creation',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Research and README
export const phase1ResearchTask = defineTask('phase1-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Research and create README/references',
  skill: { name: 'specialization-researcher' },
  agent: {
    name: 'specialization-curator',
    prompt: {
      role: 'Specialization researcher and documentation specialist',
      task: 'Research the specialization domain and create comprehensive README.md and references.md',
      context: args,
      instructions: [
        'Research the specialization domain thoroughly',
        'Identify key roles and responsibilities',
        'Define goals, objectives, and use cases',
        'Document common workflows and patterns',
        'Compile reference materials with links',
        'Create README.md following established patterns',
        'Create references.md with categorized links',
        `Create directory structure at: ${args.basePath}`,
        'Save files to the specified basePath'
      ],
      outputFormat: 'JSON with artifacts array containing created files'
    },
    outputSchema: {
      type: 'object',
      required: ['artifacts'],
      properties: {
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              label: { type: 'string' }
            }
          }
        },
        rolesIdentified: { type: 'array', items: { type: 'string' } },
        referencesCompiled: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'phase1', 'research']
}));

// Phase 2: Identify Processes
export const phase2IdentifyProcessesTask = defineTask('phase2-identify-processes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Identify processes for the specialization',
  skill: { name: 'process-analyzer' },
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Process analyst and workflow designer',
      task: 'Analyze the specialization and identify all processes needed',
      context: args,
      instructions: [
        'Read the README.md and references.md files',
        'Identify all methodologies, workflows, and patterns',
        'Define process boundaries and responsibilities',
        'Describe inputs and outputs for each process',
        'Categorize processes (core, support, quality, etc.)',
        'Prioritize processes by importance',
        'Create processes-backlog.md with TODO items',
        'Format: - [ ] process-name.js - Description. Reference: [link]',
        `Save to: ${args.basePath}/processes-backlog.md`
      ],
      outputFormat: 'JSON with processCount, categories, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['processCount', 'artifacts'],
      properties: {
        processCount: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
        processes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              priority: { type: 'string' }
            }
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
  labels: ['agent', 'meta', 'phase2', 'processes']
}));

// Phase 3: Create Process Files
export const phase3CreateProcessesTask = defineTask('phase3-create-processes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Create process JS files',
  skill: { name: 'process-generator' },
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Process implementation specialist',
      task: 'Create process JS files from the processes-backlog.md',
      context: args,
      instructions: [
        'Read processes-backlog.md',
        'For each process, create a JS file following SDK patterns:',
        '  - JSDoc with @process, @description, @inputs, @outputs',
        '  - Import defineTask from SDK',
        '  - Export async process function',
        '  - Define tasks with defineTask',
        '  - Include quality gates and breakpoints',
        '  - Proper error handling',
        'Use existing process files as templates',
        'Mark completed items in backlog',
        `Save files to: ${args.basePath}/`
      ],
      outputFormat: 'JSON with filesCreated, processNames, processFiles, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'artifacts'],
      properties: {
        filesCreated: { type: 'number' },
        processNames: { type: 'array', items: { type: 'string' } },
        processFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'phase3', 'implementation']
}));

// Phase 4: Identify Skills and Agents
export const phase4IdentifySkillsAgentsTask = defineTask('phase4-identify-skills-agents', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Identify skills and agents needed',
  skill: { name: 'skill-agent-analyzer' },
  agent: {
    name: 'skill-designer',
    prompt: {
      role: 'Skill and agent analyst',
      task: 'Analyze processes and identify required skills and agents',
      context: args,
      instructions: [
        'Read all process JS files',
        'Identify skill needs (tools, capabilities)',
        'Identify agent needs (roles, expertise)',
        'Create mapping table: process -> skills/agents',
        'Use naming convention: SK-XX-NNN for skills, AG-XX-NNN for agents',
        'Document skill/agent descriptions',
        'Identify potential reuse across processes',
        'Create skills-agents-backlog.md',
        `Save to: ${args.basePath}/skills-agents-backlog.md`
      ],
      outputFormat: 'JSON with skillCount, agentCount, mappingEntries, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['skillCount', 'agentCount', 'artifacts'],
      properties: {
        skillCount: { type: 'number' },
        agentCount: { type: 'number' },
        mappingEntries: { type: 'number' },
        skills: { type: 'array' },
        agents: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'phase4', 'analysis']
}));

// Phase 5: Research References
export const phase5ResearchReferencesTask = defineTask('phase5-research-references', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Research external references',
  skill: { name: 'reference-researcher' },
  agent: {
    name: 'specialization-curator',
    prompt: {
      role: 'External resource researcher',
      task: 'Search for existing skills/agents that can be reused',
      context: args,
      instructions: [
        'Read skills-agents-backlog.md',
        'Search GitHub for Claude skills matching needs',
        'Search for relevant MCP servers',
        'Check awesome-claude-skills repositories',
        'Evaluate compatibility and licensing',
        'Document reusable candidates',
        'Create skills-agents-references.md',
        `Save to: ${args.basePath}/skills-agents-references.md`
      ],
      outputFormat: 'JSON with referencesFound, reusableCandidates, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['referencesFound', 'artifacts'],
      properties: {
        referencesFound: { type: 'number' },
        reusableCandidates: { type: 'number' },
        references: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'phase5', 'research']
}));

// Phase 6: Create Skills and Agents
export const phase6CreateSkillsAgentsTask = defineTask('phase6-create-skills-agents', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Create skill and agent files',
  skill: { name: 'skill-generator' },
  agent: {
    name: 'skill-designer',
    prompt: {
      role: 'Skill and agent implementation specialist',
      task: 'Create SKILL.md and AGENT.md files from backlog',
      context: args,
      instructions: [
        'Read skills-agents-backlog.md',
        'For each skill:',
        '  - Create directory: skills/<skill-name>/',
        '  - Create SKILL.md with frontmatter (name, description, allowed-tools)',
        '  - Create README.md with usage documentation',
        'For each agent:',
        '  - Create directory: agents/<agent-name>/',
        '  - Create AGENT.md with frontmatter (name, description, role, expertise)',
        '  - Create README.md with prompt templates',
        'Mark completed items in backlog',
        `Save to: ${args.basePath}/skills/ and ${args.basePath}/agents/`
      ],
      outputFormat: 'JSON with skillsCreated, agentsCreated, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['skillsCreated', 'agentsCreated', 'artifacts'],
      properties: {
        skillsCreated: { type: 'number' },
        agentsCreated: { type: 'number' },
        skillNames: { type: 'array', items: { type: 'string' } },
        agentNames: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'phase6', 'creation']
}));

// Phase 7: Integrate Skills and Agents
export const phase7IntegrateTask = defineTask('phase7-integrate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Integrate skills and agents into processes',
  skill: { name: 'process-integrator' },
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Process integration specialist',
      task: 'Update process JS files to reference skills and agents',
      context: args,
      instructions: [
        'Read skills-agents-backlog.md for mapping',
        'For each process file:',
        '  - Identify task definitions',
        '  - Add skill.name field with appropriate skill',
        '  - Update agent.name field with appropriate agent',
        '  - Verify references are valid',
        'Mark all items complete in backlog',
        'Generate integration summary'
      ],
      outputFormat: 'JSON with filesUpdated, integrationsAdded, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['filesUpdated', 'artifacts'],
      properties: {
        filesUpdated: { type: 'number' },
        integrationsAdded: { type: 'number' },
        updatedFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'phase7', 'integration']
}));

// Validation Task
export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate specialization completeness',
  skill: { name: 'specialization-validator' },
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Quality assurance specialist',
      task: 'Validate the specialization is complete and correct',
      context: args,
      instructions: [
        'Verify all 7 phases completed',
        'Check README.md exists and is comprehensive',
        'Check references.md exists with valid links',
        'Check processes-backlog.md is fully marked',
        'Check all process JS files exist',
        'Check skills-agents-backlog.md is fully marked',
        'Check all skill/agent files exist',
        'Verify process integrations are correct',
        'Generate validation report'
      ],
      outputFormat: 'JSON with valid (boolean), results (object), and issues (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'results'],
      properties: {
        valid: { type: 'boolean' },
        results: {
          type: 'object',
          properties: {
            phase1Complete: { type: 'boolean' },
            phase2Complete: { type: 'boolean' },
            phase3Complete: { type: 'boolean' },
            phase4Complete: { type: 'boolean' },
            phase5Complete: { type: 'boolean' },
            phase6Complete: { type: 'boolean' },
            phase7Complete: { type: 'boolean' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        score: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'validation']
}));
