/**
 * @process meta/harnesses/oh-my-pi/plugin-creation
 * @description Create and distribute an Oh My Pi (OMP) plugin with OMP-specific env vars
 *   (OMP_SESSION_ID, OMP_PLUGIN_ROOT), .omp/plugins/ installation, enhanced loop-driver/guards/TUI
 *   widgets, package.json omp field, activate() entry point, and npm distribution
 * @inputs { pluginName: string, description: string, scope?: string, author?: string, components?: object, npmScope?: string, outputDir?: string }
 * @outputs { success: boolean, pluginDir: string, packageJson: object, components: array, npmPackage: string }
 * @agent process-architect specializations/meta/agents/process-architect/AGENT.md
 * @agent quality-assessor specializations/meta/agents/quality-assessor/AGENT.md
 * @agent technical-writer specializations/meta/agents/technical-writer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const requirementsAnalysisTask = defineTask('omp-plugin-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Oh My Pi plugin requirements and OMP-specific features',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Oh My Pi plugin architect specializing in OMP extensions and enhanced orchestration',
      task: `Analyze requirements for a new Oh My Pi plugin called "${args.pluginName}".

Oh My Pi (OMP) is an enhanced wrapper around the Pi coding agent. OMP plugins share the same
ExtensionAPI as Pi plugins but have additional capabilities and conventions:

### OMP-Specific Environment Variables
- OMP_SESSION_ID: Current session identifier
- OMP_PLUGIN_ROOT: Root directory of installed plugins (.omp/plugins/)
- OMP_STATE_DIR: OMP state directory (defaults to .omp/)
- OMP_LOOP_DRIVER: Whether the loop-driver is active
- OMP_GUARD_CONFIG: Path to guard configuration

### OMP Plugin Installation
- Plugins install to .omp/plugins/<plugin-name>/
- OMP auto-discovers plugins from the .omp/plugins/ directory
- package.json has the same "omp" field as Pi: { extensions, skills }
- activate(pi: ExtensionAPI) entry point is identical to Pi

### OMP Enhanced Features (available via ExtensionAPI)
- **Loop Driver**: onAgentEnd() handler with guard checking, iteration control,
  continuation prompt injection via buildContinuationPrompt()
- **Guards**: checkGuards(), isDoomLoop(), recordIterationOutcome(), max iterations (256),
  max duration (2h), consecutive error detection (3), doom-loop detection
- **TUI Widgets**: setWidget(key, content), setStatus(text), appendEntry(text),
  renderRunWidget(), renderEffectsWidget(), renderQualityWidget() with box-drawing
- **Tool Interception**: interceptToolCall(), shouldIntercept() for blocking tools during runs
- **Custom Tools**: registerCustomTools() for babysitter_run_status, babysitter_post_result
- **Status Line**: updateStatusLine(), clearStatusLine() for compact state display
- **Message Renderers**: registerBabysitterRenderers() with formatRunStatus(), formatEffectResult()

Analyze the following for an OMP plugin:
1. What OMP-specific features should this plugin leverage?
2. Should it interact with the loop-driver or guards?
3. What TUI widgets should it render?
4. What tools and commands should it register?
5. Which lifecycle events should it hook?
6. Should it use tool interception?
7. What OMP env vars does it need?

Plugin description: ${args.description}
Additional requirements: ${args.additionalRequirements || 'None specified'}`,
      context: {
        pluginName: args.pluginName,
        description: args.description,
        components: args.components,
        npmScope: args.npmScope,
        referencePlugin: 'plugins/babysitter-pi/ (Pi reference), OMP overlay conventions'
      },
      instructions: [
        'Analyze plugin purpose against OMP-enhanced capabilities',
        'Determine which OMP-specific features (loop-driver, guards, TUI) to use',
        'Identify env var dependencies (OMP_SESSION_ID, OMP_PLUGIN_ROOT, etc.)',
        'Plan tool registrations, commands, events, and widgets',
        'Consider .omp/plugins/ installation path',
        'Produce structured requirements with OMP-specific sections'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'ompFeatures'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            purpose: { type: 'string' },
            targetAudience: { type: 'string' },
            tools: { type: 'array', items: { type: 'object' } },
            commands: { type: 'array', items: { type: 'object' } },
            events: { type: 'array', items: { type: 'string' } },
            widgets: { type: 'array', items: { type: 'object' } },
            skills: { type: 'array', items: { type: 'object' } },
            peerDependencies: { type: 'object' }
          }
        },
        ompFeatures: {
          type: 'object',
          properties: {
            usesLoopDriver: { type: 'boolean' },
            usesGuards: { type: 'boolean' },
            usesToolInterception: { type: 'boolean' },
            envVars: { type: 'array', items: { type: 'string' } },
            tuiWidgets: { type: 'array', items: { type: 'object' } }
          }
        },
        components: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const scaffoldPluginTask = defineTask('omp-plugin-scaffold', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaffold Oh My Pi plugin with .omp/plugins/ layout',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OMP plugin scaffolding engineer',
      task: `Create the complete directory structure and package.json for OMP plugin "${args.pluginName}" at ${args.pluginDir}.

Required directory layout (installed to .omp/plugins/${args.pluginName}/):
${args.pluginDir}/
  package.json          # With "omp" field: { extensions, skills }
  extensions/
    ${args.pluginName}/
      index.ts          # activate(pi: ExtensionAPI) entry point
      types.ts          # TypeScript type definitions
      constants.ts      # Config constants, OMP env var names
      loop-hooks.ts     # Loop-driver integration (if applicable)
      guards.ts         # Custom guard definitions (if applicable)
      widgets.ts        # TUI widget renderers (if applicable)
  skills/
    <skill-name>/
      SKILL.md          # Per-skill definition
  commands/
    <command-name>.md   # Slash commands with YAML frontmatter
  state/                # Plugin state directory (runtime, gitignored)
  test/
    index.test.ts       # Extension tests
  README.md
  .gitignore

The package.json must include:
{
  "name": "${args.npmScope}/${args.pluginName}",
  "version": "1.0.0",
  "description": "${args.description}",
  "omp": {
    "extensions": "extensions",
    "skills": "skills"
  },
  "peerDependencies": {
    "@mariozechner/pi-coding-agent": ">=0.1.0"
  },
  "main": "extensions/${args.pluginName}/index.ts",
  "files": ["extensions/", "skills/", "commands/", "README.md"],
  "omp-env": {
    "OMP_PLUGIN_ROOT": ".omp/plugins",
    "OMP_SESSION_ID": "auto"
  }
}

Create all directories and the package.json. Do NOT create implementation files yet.`,
      context: {
        pluginName: args.pluginName,
        pluginDir: args.pluginDir,
        npmScope: args.npmScope,
        requirements: args.requirements,
        ompFeatures: args.ompFeatures
      },
      instructions: [
        'Create the full directory tree following OMP plugin conventions',
        'Write package.json with omp field and omp-env metadata',
        'Include state/ directory for runtime state',
        'Add loop-hooks.ts and guards.ts stubs if OMP features are needed',
        'Add widgets.ts stub if TUI widgets are planned',
        'Do NOT write implementation code yet'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['pluginDir', 'packageJson', 'directories'],
      properties: {
        pluginDir: { type: 'string' },
        packageJson: { type: 'object' },
        directories: { type: 'array', items: { type: 'string' } },
        fileCount: { type: 'number' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const implementComponentsTask = defineTask('omp-plugin-implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement OMP plugin components with enhanced loop-driver/guards/TUI',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OMP extension developer implementing plugin components with enhanced orchestration',
      task: `Implement all components for OMP plugin "${args.pluginName}" at ${args.pluginDir}.

### 1. Extension Entry Point (extensions/${args.pluginName}/index.ts)
Write the activate(pi: ExtensionAPI) function:
- Read OMP env vars: process.env.OMP_SESSION_ID, process.env.OMP_PLUGIN_ROOT
- Register tools via pi.registerTool({ name, description, parameters, execute })
- Register commands via pi.registerCommand({ name, description, execute })
- Hook lifecycle events (onAgentStart, onAgentEnd, onToolCall, etc.)
- Set up TUI widgets via pi.setWidget(key, content) with box-drawing formatting
- If using loop-driver hooks, integrate with onAgentEnd for continuation control
- If using guards, register custom guard checks
- Return deactivate() cleanup function

### 2. OMP-Specific Modules
- loop-hooks.ts: Integration with the OMP loop-driver if the plugin needs to
  influence iteration control (e.g., custom continuation conditions, modified prompts)
- guards.ts: Custom guard definitions if the plugin adds safety constraints
  (max iterations, duration limits, pattern detection)
- widgets.ts: TUI widget renderers using box-drawing characters for dashboard-style output

### 3. Type Definitions (extensions/${args.pluginName}/types.ts)
- Tool parameters and return types
- OMP-specific config types (guard config, widget state, loop state)
- Event payload types
- Environment variable type declarations

### 4. Constants (extensions/${args.pluginName}/constants.ts)
- OMP env var names: OMP_SESSION_ID, OMP_PLUGIN_ROOT, OMP_STATE_DIR
- Plugin-specific env vars: OMP_PLUGIN_<NAME>_*
- Default timeouts and limits
- Widget keys

### 5. Skills (skills/<name>/SKILL.md) and Commands (commands/<name>.md)
- Same format as Pi: SKILL.md for skills, .md with YAML frontmatter for commands

Requirements: ${JSON.stringify(args.requirements)}
OMP Features: ${JSON.stringify(args.ompFeatures)}`,
      context: {
        pluginName: args.pluginName,
        pluginDir: args.pluginDir,
        requirements: args.requirements,
        ompFeatures: args.ompFeatures,
        structure: args.structure
      },
      instructions: [
        'Implement activate() with OMP env var reading and all registrations',
        'Create loop-hooks.ts if loop-driver integration is needed',
        'Create guards.ts if custom guards are needed',
        'Create widgets.ts with box-drawing TUI renderers',
        'Write SKILL.md and command .md files',
        'Ensure all OMP env vars are properly read and validated',
        'Include error handling for missing OMP environment'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['files', 'tools', 'commands', 'events'],
      properties: {
        files: { type: 'array', items: { type: 'string' } },
        tools: { type: 'array', items: { type: 'object' } },
        commands: { type: 'array', items: { type: 'object' } },
        events: { type: 'array', items: { type: 'string' } },
        skills: { type: 'array', items: { type: 'object' } },
        ompModules: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const testAndValidateTask = defineTask('omp-plugin-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test and validate OMP plugin with OMP-specific checks',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'OMP plugin QA engineer with knowledge of OMP-specific validation',
      task: `Validate the OMP plugin "${args.pluginName}" at ${args.pluginDir}.

### Standard Pi Plugin Checks
1. Verify package.json has valid "omp" field with extensions and skills paths
2. Verify peer dependency on @mariozechner/pi-coding-agent
3. Verify activate() function in extensions/<name>/index.ts
4. Verify SKILL.md and command .md formats

### OMP-Specific Checks
5. Verify OMP env var usage: OMP_SESSION_ID, OMP_PLUGIN_ROOT read correctly
6. Verify plugin works when installed to .omp/plugins/<name>/
7. Verify loop-hooks.ts integrates properly with onAgentEnd if present
8. Verify guards.ts defines valid guard functions if present
9. Verify widgets.ts produces valid box-drawing output if present
10. Verify state/ directory is gitignored
11. Verify plugin gracefully handles missing OMP env vars (fallback behavior)
12. Verify tool interception patterns if applicable

### Integration Checks
13. Verify no conflicts with standard babysitter-pi plugin
14. Verify deactivate() properly cleans up all registrations
15. Verify widget keys don't collide with babysitter core widgets
16. Run TypeScript type checking if tsconfig exists

Report all findings with severity and fix suggestions.`,
      context: {
        pluginName: args.pluginName,
        pluginDir: args.pluginDir,
        requirements: args.requirements,
        ompFeatures: args.ompFeatures
      },
      instructions: [
        'Run all standard Pi plugin validation checks',
        'Add OMP-specific env var and feature checks',
        'Verify .omp/plugins/ installation compatibility',
        'Check loop-driver and guard integration if applicable',
        'Validate TUI widget output format',
        'Report with severity levels and fix suggestions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'checks'],
      properties: {
        valid: { type: 'boolean' },
        checks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              passed: { type: 'boolean' },
              severity: { type: 'string', enum: ['error', 'warning', 'info'] },
              message: { type: 'string' },
              fix: { type: 'string' }
            }
          }
        },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const distributionSetupTask = defineTask('omp-plugin-distribute', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up npm distribution for OMP plugin',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'npm package distribution engineer for Oh My Pi plugins',
      task: `Set up npm distribution for OMP plugin "${args.pluginName}" at ${args.pluginDir}.

OMP plugins are distributed as npm packages, identical to Pi plugins, and installed
into the .omp/plugins/ directory.

### npm Package Configuration
1. Update package.json:
   - "name": "${args.npmScope}/${args.pluginName}"
   - "keywords": ["oh-my-pi", "omp-plugin", "pi-extension", "pi-coding-agent", ...]
   - "files": whitelist of published files (extensions/, skills/, commands/, README.md)
   - "engines": { "node": ">=18" }
   - Repository, homepage, bugs fields

2. Create .npmignore (test/, state/, .git/, etc.)

3. Installation documentation:
   - npm install ${args.npmScope}/${args.pluginName}
   - Manual: copy to .omp/plugins/${args.pluginName}/
   - OMP auto-discovers via the .omp/plugins/ directory

4. Publish workflow:
   - npm publish --access public
   - Pre-publish: npm pack --dry-run
   - Version bump and git tag

5. Versioning:
   - versions.json with sdkVersion compatibility
   - CHANGELOG.md with initial release
   - Semantic versioning

6. Optional babysitter marketplace entry:
   - Generate marketplace JSON entry
   - babysitter plugin:update-registry`,
      context: {
        pluginName: args.pluginName,
        pluginDir: args.pluginDir,
        npmScope: args.npmScope,
        requirements: args.requirements
      },
      instructions: [
        'Configure package.json for npm publishing with OMP keywords',
        'Create .npmignore excluding state/ and test/',
        'Write installation instructions for .omp/plugins/ path',
        'Set up versioning with versions.json',
        'Create CHANGELOG.md',
        'Document publish workflow'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['npmPackage', 'publishReady'],
      properties: {
        npmPackage: { type: 'string' },
        publishReady: { type: 'boolean' },
        installCommand: { type: 'string' },
        installDir: { type: 'string' },
        files: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const documentationTask = defineTask('omp-plugin-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create comprehensive OMP plugin documentation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer specializing in Oh My Pi plugin documentation',
      task: `Create comprehensive documentation for OMP plugin "${args.pluginName}" at ${args.pluginDir}.

### README.md
1. Plugin name, description, badges (npm, license, OMP compatibility)
2. Features list emphasizing OMP-specific capabilities
3. Requirements: Oh My Pi version, Pi coding agent version, Node.js
4. Installation:
   - npm install ${args.npmScope}/${args.pluginName}
   - Manual: copy to .omp/plugins/
5. Configuration: OMP env vars, plugin-specific settings
6. Usage examples for tools, commands, skills, widgets
7. OMP Integration section:
   - Loop-driver hooks (if applicable)
   - Guard configuration (if applicable)
   - TUI widget screenshots/ASCII art (if applicable)
8. Differences from Pi: what OMP-specific features are used
9. Troubleshooting: missing OMP env vars, plugin conflicts
10. Contributing, License

### CHANGELOG.md
## [1.0.0] - ${new Date().toISOString().split('T')[0]}
### Added
- Initial release with OMP integration
- <all features>

Components: ${JSON.stringify(args.components)}
OMP Features: ${JSON.stringify(args.ompFeatures)}`,
      context: {
        pluginName: args.pluginName,
        pluginDir: args.pluginDir,
        npmScope: args.npmScope,
        requirements: args.requirements,
        components: args.components,
        ompFeatures: args.ompFeatures
      },
      instructions: [
        'Write README.md emphasizing OMP-specific features',
        'Include OMP env var documentation section',
        'Document loop-driver and guard integration if applicable',
        'Show TUI widget examples with ASCII renderings',
        'Create CHANGELOG.md with initial release',
        'Note differences from standard Pi plugins'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: { type: 'array', items: { type: 'string' } },
        wordCount: { type: 'number' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// ============================================================================
// PROCESS FUNCTION
// ============================================================================

/**
 * Oh My Pi Plugin Creation Process
 *
 * Creates a complete OMP plugin package with extensions, skills, commands,
 * loop-driver hooks, guards, TUI widgets, and npm distribution. OMP plugins
 * extend Pi's ExtensionAPI with OMP-specific env vars and enhanced features.
 *
 * Phases:
 * 1. Requirements Analysis - understand plugin purpose and OMP-specific features
 * 2. Scaffold Plugin Structure - create directory layout with .omp/plugins/ conventions
 * 3. Implement Components - create activate() entry, tools, OMP hooks, widgets
 * 4. Testing & Validation - validate manifest, OMP integration, component registration
 * 5. Distribution Setup - prepare npm package for publishing
 * 6. Documentation - create README, OMP integration docs, changelog
 */
export async function process(inputs, ctx) {
  const {
    pluginName,
    description,
    scope = 'project',
    author = 'unknown',
    components = {},
    npmScope = '@omp-plugins',
    outputDir = '.',
    additionalRequirements = ''
  } = inputs;

  const pluginDir = `${outputDir}/${pluginName}`;
  const artifacts = [];

  ctx.log('info', `Creating Oh My Pi plugin: ${pluginName}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing OMP plugin requirements');

  const requirements = await ctx.task(requirementsAnalysisTask, {
    pluginName,
    description,
    components,
    npmScope,
    additionalRequirements
  });

  artifacts.push(...(requirements.artifacts || []));

  // ============================================================================
  // PHASE 2: SCAFFOLD PLUGIN STRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 2: Scaffolding OMP plugin structure');

  let scaffold = await ctx.task(scaffoldPluginTask, {
    pluginName,
    pluginDir,
    description,
    npmScope,
    requirements: requirements.analysis,
    ompFeatures: requirements.ompFeatures
  });

  artifacts.push(...(scaffold.artifacts || []));

  let lastFeedback_structureReview = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_structureReview) {
      scaffold = await ctx.task(scaffoldPluginTask, {
        pluginName, pluginDir, description, npmScope,
        requirements: requirements.analysis,
        ompFeatures: requirements.ompFeatures,
        feedback: lastFeedback_structureReview,
        attempt: attempt + 1
      });
    }
    const structureReview = await ctx.breakpoint({
      question: `OMP plugin "${pluginName}" scaffolded with ${scaffold.fileCount || 'multiple'} files. Review the .omp/plugins/ layout and OMP-specific modules?`,
      title: 'OMP Plugin Structure Review',
      context: {
        runId: ctx.runId,
        files: (scaffold.artifacts || []).map(a => ({ path: a.path, label: a.label })),
        summary: {
          pluginName,
          npmPackage: `${npmScope}/${pluginName}`,
          directories: scaffold.directories,
          ompFeatures: requirements.ompFeatures
        }
      },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_structureReview || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (structureReview.approved) break;
    lastFeedback_structureReview = structureReview.response || structureReview.feedback || 'Changes requested';
  }

  // ============================================================================
  // PHASE 3: IMPLEMENT COMPONENTS
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing OMP plugin components');

  const implementation = await ctx.task(implementComponentsTask, {
    pluginName,
    pluginDir,
    requirements: requirements.analysis,
    ompFeatures: requirements.ompFeatures,
    structure: scaffold
  });

  artifacts.push(...(implementation.artifacts || []));

  // ============================================================================
  // PHASE 4: TESTING & VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Testing and validating OMP plugin');

  let validation = await ctx.task(testAndValidateTask, {
    pluginName,
    pluginDir,
    requirements: requirements.analysis,
    ompFeatures: requirements.ompFeatures
  });

  artifacts.push(...(validation.artifacts || []));

  if (!validation.valid) {
    let lastFeedback_validationReview = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_validationReview) {
        validation = await ctx.task(testAndValidateTask, {
          pluginName, pluginDir,
          requirements: requirements.analysis,
          ompFeatures: requirements.ompFeatures,
          feedback: lastFeedback_validationReview, attempt: attempt + 1
        });
      }
      const validationReview = await ctx.breakpoint({
        question: `OMP plugin validation found ${(validation.issues || []).length} issues (including OMP-specific checks). Fix or proceed?`,
        title: 'OMP Plugin Validation Results',
        context: {
          runId: ctx.runId,
          checks: validation.checks,
          issues: validation.issues
        },
        expert: 'owner',
        tags: ['approval-gate'],
        previousFeedback: lastFeedback_validationReview || undefined,
        attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (validationReview.approved) break;
      lastFeedback_validationReview = validationReview.response || validationReview.feedback || 'Changes requested';
    }
  }

  // ============================================================================
  // PHASE 5: DISTRIBUTION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up npm distribution');

  const distribution = await ctx.task(distributionSetupTask, {
    pluginName,
    pluginDir,
    npmScope,
    requirements: requirements.analysis
  });

  artifacts.push(...(distribution.artifacts || []));

  // ============================================================================
  // PHASE 6: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating documentation');

  const docs = await ctx.task(documentationTask, {
    pluginName,
    pluginDir,
    npmScope,
    requirements: requirements.analysis,
    components: implementation,
    ompFeatures: requirements.ompFeatures
  });

  artifacts.push(...(docs.artifacts || []));

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  ctx.log('info', `OMP plugin "${pluginName}" creation complete`);

  return {
    success: true,
    pluginDir,
    packageJson: scaffold.packageJson,
    npmPackage: `${npmScope}/${pluginName}`,
    installDir: `.omp/plugins/${pluginName}`,
    components: {
      tools: implementation.tools || [],
      commands: implementation.commands || [],
      events: implementation.events || [],
      skills: implementation.skills || [],
      ompModules: implementation.ompModules || []
    },
    ompFeatures: requirements.ompFeatures,
    distribution: {
      npmPackage: distribution.npmPackage,
      installCommand: distribution.installCommand,
      publishReady: distribution.publishReady
    },
    artifacts
  };
}
