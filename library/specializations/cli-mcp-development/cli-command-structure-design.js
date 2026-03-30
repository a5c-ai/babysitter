/**
 * @process specializations/cli-mcp-development/cli-command-structure-design
 * @description CLI Command Structure Design - Design and implement hierarchical command structure for complex CLI applications
 * with consistent naming conventions, command groups, and intuitive user workflows.
 * @inputs { projectName: string, userWorkflows: array, existingCommands?: array, namingConvention?: string }
 * @outputs { success: boolean, commandHierarchy: object, commandGroups: array, aliases: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/cli-command-structure-design', {
 *   projectName: 'cloud-cli',
 *   userWorkflows: ['deploy application', 'manage secrets', 'view logs', 'scale services'],
 *   namingConvention: 'verb-noun'
 * });
 *
 * @references
 * - CLI Guidelines: https://clig.dev/
 * - Heroku CLI Style Guide: https://devcenter.heroku.com/articles/cli-style-guide
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    userWorkflows = [],
    existingCommands = [],
    namingConvention = 'verb-noun',
    maxDepth = 3,
    outputDir = 'cli-command-structure-design'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CLI Command Structure Design: ${projectName}`);
  ctx.log('info', `User Workflows: ${userWorkflows.length}, Naming Convention: ${namingConvention}`);

  // ============================================================================
  // PHASE 1: WORKFLOW ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing user workflows and use cases');

  const workflowAnalysis = await ctx.task(workflowAnalysisTask, {
    projectName,
    userWorkflows,
    existingCommands,
    outputDir
  });

  artifacts.push(...workflowAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: COMMAND HIERARCHY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing command hierarchy');

  const hierarchyDesign = await ctx.task(hierarchyDesignTask, {
    projectName,
    workflowAnalysis,
    namingConvention,
    maxDepth,
    outputDir
  });

  artifacts.push(...hierarchyDesign.artifacts);

  // ============================================================================
  // PHASE 3: COMMAND GROUPS AND NAMESPACES
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing command groups and namespaces');

  const commandGroups = await ctx.task(commandGroupsTask, {
    projectName,
    hierarchyDesign,
    outputDir
  });

  artifacts.push(...commandGroups.artifacts);

  // Quality Gate: Command Structure Review
  await ctx.breakpoint({
    question: `Command structure designed with ${hierarchyDesign.totalCommands} commands across ${commandGroups.groups.length} groups. Review and approve?`,
    title: 'Command Structure Review',
    context: {
      runId: ctx.runId,
      projectName,
      totalCommands: hierarchyDesign.totalCommands,
      groups: commandGroups.groups,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 4: GLOBAL VS COMMAND OPTIONS
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining global vs command-specific options');

  const optionsDesign = await ctx.task(optionsDesignTask, {
    projectName,
    hierarchyDesign,
    commandGroups,
    outputDir
  });

  artifacts.push(...optionsDesign.artifacts);

  // ============================================================================
  // PHASE 5: ALIASES AND SHORTCUTS
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating command aliases for common operations');

  const aliasesDesign = await ctx.task(aliasesDesignTask, {
    projectName,
    hierarchyDesign,
    workflowAnalysis,
    outputDir
  });

  artifacts.push(...aliasesDesign.artifacts);

  // ============================================================================
  // PHASE 6: DOCUMENTATION AND REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating command structure documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    workflowAnalysis,
    hierarchyDesign,
    commandGroups,
    optionsDesign,
    aliasesDesign,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `CLI Command Structure Design complete for ${projectName}. Review documentation and approve?`,
    title: 'Command Structure Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        totalCommands: hierarchyDesign.totalCommands,
        commandGroups: commandGroups.groups.length,
        aliases: aliasesDesign.aliases.length,
        globalOptions: optionsDesign.globalOptions.length
      },
      files: [
        { path: documentation.structureDocPath, format: 'markdown', label: 'Command Structure' },
        { path: documentation.referenceDocPath, format: 'markdown', label: 'Command Reference' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    commandHierarchy: hierarchyDesign.hierarchy,
    commandGroups: commandGroups.groups,
    globalOptions: optionsDesign.globalOptions,
    aliases: aliasesDesign.aliases,
    namingConventions: hierarchyDesign.namingConventions,
    documentation: {
      structureDoc: documentation.structureDocPath,
      referenceDoc: documentation.referenceDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/cli-command-structure-design',
      timestamp: startTime,
      namingConvention,
      totalCommands: hierarchyDesign.totalCommands
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const workflowAnalysisTask = defineTask('workflow-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Workflow Analysis - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: {
      role: 'CLI User Experience Designer',
      task: 'Analyze user workflows and use cases',
      context: {
        projectName: args.projectName,
        userWorkflows: args.userWorkflows,
        existingCommands: args.existingCommands,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze each user workflow in detail',
        '2. Identify common operations and patterns',
        '3. Group related workflows together',
        '4. Identify primary vs secondary workflows',
        '5. Map workflows to potential commands',
        '6. Identify frequently used command combinations',
        '7. Analyze existing commands for patterns',
        '8. Generate workflow analysis report'
      ],
      outputFormat: 'JSON with workflow analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['workflows', 'patterns', 'artifacts'],
      properties: {
        workflows: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'string' } },
        commandMappings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'command-structure', 'workflow-analysis']
}));

export const hierarchyDesignTask = defineTask('hierarchy-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Hierarchy Design - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: {
      role: 'CLI Command Architect',
      task: 'Design command hierarchy',
      context: {
        projectName: args.projectName,
        workflowAnalysis: args.workflowAnalysis,
        namingConvention: args.namingConvention,
        maxDepth: args.maxDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design root command structure',
        '2. Create logical command groupings',
        '3. Design subcommand hierarchies',
        '4. Apply consistent naming conventions',
        '5. Ensure intuitive command discovery',
        '6. Limit hierarchy depth for usability',
        '7. Document command relationships',
        '8. Generate hierarchy documentation'
      ],
      outputFormat: 'JSON with command hierarchy'
    },
    outputSchema: {
      type: 'object',
      required: ['hierarchy', 'totalCommands', 'namingConventions', 'artifacts'],
      properties: {
        hierarchy: { type: 'object' },
        totalCommands: { type: 'number' },
        namingConventions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'command-structure', 'hierarchy']
}));

export const commandGroupsTask = defineTask('command-groups', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Command Groups - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: {
      role: 'CLI Group Designer',
      task: 'Implement command groups and namespaces',
      context: {
        projectName: args.projectName,
        hierarchyDesign: args.hierarchyDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define command group boundaries',
        '2. Create namespace structure',
        '3. Assign commands to groups',
        '4. Design group help text',
        '5. Configure group-level options',
        '6. Document group relationships',
        '7. Generate group configuration'
      ],
      outputFormat: 'JSON with command groups'
    },
    outputSchema: {
      type: 'object',
      required: ['groups', 'artifacts'],
      properties: {
        groups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              commands: { type: 'array', items: { type: 'string' } }
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
  labels: ['cli', 'command-structure', 'groups']
}));

export const optionsDesignTask = defineTask('options-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Options Design - ${args.projectName}`,
  agent: {
    name: 'argument-schema-designer',
    prompt: {
      role: 'CLI Options Designer',
      task: 'Define global vs command-specific options',
      context: {
        projectName: args.projectName,
        hierarchyDesign: args.hierarchyDesign,
        commandGroups: args.commandGroups,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify global options (verbose, quiet, config)',
        '2. Define command-specific options',
        '3. Create consistent option naming patterns',
        '4. Design short and long flag variants',
        '5. Configure option inheritance',
        '6. Document option precedence',
        '7. Generate options specification'
      ],
      outputFormat: 'JSON with options design'
    },
    outputSchema: {
      type: 'object',
      required: ['globalOptions', 'commandOptions', 'artifacts'],
      properties: {
        globalOptions: { type: 'array', items: { type: 'object' } },
        commandOptions: { type: 'object' },
        optionPatterns: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'command-structure', 'options']
}));

export const aliasesDesignTask = defineTask('aliases-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Aliases Design - ${args.projectName}`,
  agent: {
    name: 'cli-ux-architect',
    prompt: {
      role: 'CLI Alias Designer',
      task: 'Create command aliases for common operations',
      context: {
        projectName: args.projectName,
        hierarchyDesign: args.hierarchyDesign,
        workflowAnalysis: args.workflowAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify frequently used commands',
        '2. Create short aliases for common operations',
        '3. Design intuitive alias naming',
        '4. Avoid alias conflicts',
        '5. Document alias mappings',
        '6. Configure alias registration',
        '7. Generate alias configuration'
      ],
      outputFormat: 'JSON with aliases'
    },
    outputSchema: {
      type: 'object',
      required: ['aliases', 'artifacts'],
      properties: {
        aliases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alias: { type: 'string' },
              command: { type: 'string' },
              description: { type: 'string' }
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
  labels: ['cli', 'command-structure', 'aliases']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'CLI Documentation Specialist',
      task: 'Generate command structure documentation',
      context: {
        projectName: args.projectName,
        workflowAnalysis: args.workflowAnalysis,
        hierarchyDesign: args.hierarchyDesign,
        commandGroups: args.commandGroups,
        optionsDesign: args.optionsDesign,
        aliasesDesign: args.aliasesDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create command structure overview document',
        '2. Generate command reference documentation',
        '3. Document naming conventions',
        '4. Create workflow-to-command mapping guide',
        '5. Document aliases and shortcuts',
        '6. Generate command hierarchy diagram',
        '7. Create stakeholder review document'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['structureDocPath', 'referenceDocPath', 'artifacts'],
      properties: {
        structureDocPath: { type: 'string' },
        referenceDocPath: { type: 'string' },
        diagramPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cli', 'command-structure', 'documentation']
}));
