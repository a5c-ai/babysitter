/**
 * @process gemini-cli-plugin-creation
 * @description Create and distribute a plugin (extension) for the Gemini CLI harness. Guides
 *   through requirements analysis, scaffolding with gemini-extension.json manifest, implementing
 *   skills, hooks (hooks.json), commands, and GEMINI.md context — then validating, preparing for
 *   GitHub-based distribution via `gemini extensions install`, extension gallery submission,
 *   and generating documentation.
 * @inputs { pluginName: string, pluginDescription: string, outputDir?: string, components?: { skills?: string[], hooks?: string[], commands?: string[] }, contextFileName?: string, author?: string }
 * @outputs { success: boolean, pluginDir: string, manifest: object, components: object, distributionReady: boolean }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const analyzeRequirementsTask = defineTask('gemini-analyze-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze extension requirements for Gemini CLI',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gemini CLI extension architect',
      task: `Analyze requirements for a new Gemini CLI extension named "${args.pluginName}".

Description: ${args.pluginDescription}

Determine:
1. **Target audience** — who will use this extension and in what Gemini CLI workflows
2. **Component inventory** — which Gemini CLI extension components are needed:
   - Skills (skill definitions in skills/ directory)
   - Hooks (hooks.json with SessionStart, SessionEnd, BeforeAgent, AfterAgent, BeforeModel, AfterModel, BeforeToolSelection, BeforeTool, AfterTool, PreCompress, Notification)
   - Commands (command definitions in commands/ directory)
   - Context file (GEMINI.md — persistent context injected into every conversation)
3. **Extension configuration** — what settings the extension needs:
   - contextFileName — custom name for the context markdown file (defaults to GEMINI.md)
   - Environment variables for API keys or service endpoints
   - Extension-specific settings
4. **Dependencies** — external tools, APIs, or services required
5. **Gemini CLI compatibility** — which Gemini CLI features the extension leverages:
   - Built-in tools (shell, file operations, web search)
   - Function calling / tool use patterns
   - Streaming vs non-streaming responses

Gemini CLI extension structure reference:
\`\`\`
<extension-root>/
  gemini-extension.json  # Extension manifest (name, version, description, contextFileName)
  GEMINI.md              # Context file injected into conversations
  hooks/
    hooks.json           # Hook definitions
    *.sh                 # Hook implementation scripts
  skills/
    <skill-name>/
      SKILL.md           # Skill definition
  commands/
    <group-name>/
      <command-name>.toml  # Command definition (TOML format)
  package.json           # npm package metadata (for GitHub distribution)
  versions.json          # Version history tracking
\`\`\`

Return a structured requirements document.`,
      context: { pluginName: args.pluginName, description: args.pluginDescription, requestedComponents: args.components },
      instructions: [
        'Identify all required Gemini CLI extension components',
        'Define extension configuration needs',
        'Map Gemini CLI feature dependencies',
        'List external dependencies',
        'Return structured JSON requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'configuration', 'dependencies', 'geminiFeatures'],
      properties: {
        components: { type: 'object' },
        configuration: { type: 'object' },
        dependencies: { type: 'array' },
        geminiFeatures: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const scaffoldExtensionTask = defineTask('gemini-scaffold-extension', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaffold Gemini CLI extension directory structure',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gemini CLI extension scaffolding specialist',
      task: `Create the directory structure and manifest for the Gemini CLI extension "${args.pluginName}" at ${args.outputDir}.

Requirements analysis:
${JSON.stringify(args.requirements, null, 2)}

Steps:
1. Create the extension root directory: ${args.outputDir}/${args.pluginName}/
2. Create subdirectories based on required components:
   - hooks/ (for hook definitions and scripts)
   - skills/ with subdirs for each skill
   - commands/ with subdirs for each command

3. Write gemini-extension.json manifest:
\`\`\`json
{
  "name": "${args.pluginName}",
  "version": "${args.version || '1.0.0'}",
  "description": "${args.pluginDescription}",
  "contextFileName": "${args.contextFileName || 'GEMINI.md'}"
}
\`\`\`

The gemini-extension.json is intentionally minimal — Gemini CLI extensions use a lightweight
manifest format. The contextFileName field tells Gemini CLI which markdown file to inject
as persistent context.

4. Create GEMINI.md (or custom contextFileName) — the context file that Gemini CLI injects
   into every conversation when this extension is active:
   - Extension purpose and capabilities description
   - Available skills and how to invoke them
   - Available commands and their usage
   - Configuration instructions
   - Any constraints or best practices for using the extension

5. Write package.json for GitHub-based distribution:
\`\`\`json
{
  "name": "@${args.author || 'unknown'}/${args.pluginName}",
  "version": "1.0.0",
  "description": "${args.pluginDescription}",
  "files": ["gemini-extension.json", "GEMINI.md", "hooks/", "skills/", "commands/"],
  "keywords": ["gemini", "gemini-cli", "gemini-extension", "babysitter-plugin"]
}
\`\`\`

6. Write versions.json with initial version entry.

Return the list of created files and directories.`,
      context: { pluginName: args.pluginName, outputDir: args.outputDir, requirements: args.requirements, author: args.author, contextFileName: args.contextFileName },
      instructions: [
        'Create extension directory structure',
        'Write gemini-extension.json manifest',
        'Create GEMINI.md context file',
        'Write package.json for distribution',
        'Write versions.json',
        'Return list of created files'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['extensionDir', 'manifestPath', 'createdFiles', 'createdDirs'],
      properties: {
        extensionDir: { type: 'string' },
        manifestPath: { type: 'string' },
        createdFiles: { type: 'array', items: { type: 'string' } },
        createdDirs: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const implementComponentsTask = defineTask('gemini-implement-components', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement all Gemini CLI extension components',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gemini CLI extension developer',
      task: `Implement all components for the Gemini CLI extension "${args.pluginName}" at ${args.pluginDir}.

Requirements:
${JSON.stringify(args.requirements, null, 2)}

Implement each component type as needed:

### Skills (skills/<name>/SKILL.md)
Each SKILL.md must include:
- Skill name and description
- Trigger conditions — when should Gemini invoke this skill
- Detailed step-by-step instructions that Gemini CLI can follow
- Tool usage patterns (shell commands, file operations, web search)
- Expected outputs and success criteria
- Error handling guidance

### Hooks (hooks/hooks.json + hook scripts)
Create hooks.json following the Gemini CLI hook format:
\`\`\`json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          { "name": "my-init", "type": "command", "command": "bash \\"\${extensionPath}/hooks/session-start.sh\\"", "timeout": 30000 }
        ]
      }
    ],
    "AfterAgent": [
      {
        "matcher": "*",
        "hooks": [
          { "name": "my-loop", "type": "command", "command": "bash \\"\${extensionPath}/hooks/after-agent.sh\\"", "timeout": 30000 }
        ]
      }
    ],
    "BeforeTool": [...],
    "AfterTool": [...]
  }
}
\`\`\`
Valid hook types (11 total): SessionStart, SessionEnd, BeforeAgent, AfterAgent, BeforeModel, AfterModel, BeforeToolSelection, BeforeTool, AfterTool, PreCompress, Notification.
Each hook script must be a standalone executable that:
- Receives JSON input via stdin (fields vary by hook type)
- Outputs JSON decision on stdout: \`{}\` (allow), \`{"decision":"block","reason":"...","systemMessage":"..."}\` (continue), \`{"decision":"deny"}\` (retry)
- Exit code 0 = success (stdout parsed as JSON), exit code 2 = system block
- Stderr is for debug/log output only, never parsed by Gemini CLI
- Environment variables available: GEMINI_SESSION_ID, GEMINI_PROJECT_DIR, GEMINI_CWD, GEMINI_EXTENSION_PATH

### Commands (commands/<group>/<name>.toml)
Each command definition includes:
- Command name (used as slash command in Gemini CLI)
- Description and usage instructions
- Implementation steps for Gemini CLI to execute
- Parameter descriptions if applicable
- Example invocations

### Context File (GEMINI.md)
Update the GEMINI.md context file to include:
- Complete documentation of all implemented skills
- Command reference
- Hook behavior summary
- Configuration guide
- Usage examples

Implement ALL components. Each file must be complete, well-structured, and compatible with Gemini CLI's execution model.`,
      context: { pluginName: args.pluginName, pluginDir: args.pluginDir, requirements: args.requirements },
      instructions: [
        'Implement every skill as a complete SKILL.md',
        'Create hooks.json and all hook shell scripts',
        'Write command TOML command files',
        'Update GEMINI.md with full component documentation',
        'Ensure compatibility with Gemini CLI tool use patterns',
        'Return list of all implemented files'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['implementedFiles', 'componentCounts'],
      properties: {
        implementedFiles: { type: 'array', items: { type: 'string' } },
        componentCounts: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const testAndValidateTask = defineTask('gemini-test-validate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test and validate Gemini CLI extension',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer for Gemini CLI extensions',
      task: `Validate the Gemini CLI extension at ${args.pluginDir}.

Run these validation checks:

1. **Manifest validation** — gemini-extension.json:
   - Valid JSON with required fields (name, version, description, contextFileName)
   - contextFileName points to an existing file
   - Version follows semver

2. **Context file validation** — GEMINI.md (or custom contextFileName):
   - File exists and is non-empty
   - Documents all skills, commands, and hooks
   - Is well-structured markdown
   - Does not exceed reasonable size (Gemini CLI context has token limits)

3. **Hook validation** — hooks/hooks.json + scripts:
   - hooks.json is valid JSON
   - Only valid Gemini CLI hook types used
   - Each referenced script exists and is executable
   - Scripts handle expected environment variables

4. **Skill validation** — skills/<name>/SKILL.md:
   - Each has title, description, trigger conditions, and instructions
   - Instructions are compatible with Gemini CLI capabilities
   - No references to tools or features Gemini CLI does not support

5. **Command validation** — commands/<group>/<name>.toml:
   - Each has name, description, and instructions
   - No duplicate command names
   - Parameters are clearly documented

6. **Package validation** — package.json:
   - Valid JSON with correct fields
   - "files" includes all extension artifacts
   - Keywords include "gemini-cli" or "gemini-extension"

7. **Installation compatibility**:
   - Extension can be installed via: gemini extensions install https://github.com/<owner>/<repo>
   - All paths are relative and portable

Return a structured validation report.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName },
      instructions: [
        'Validate gemini-extension.json manifest',
        'Check context file completeness',
        'Verify all hooks, skills, and commands',
        'Check package.json for distribution readiness',
        'Verify installation compatibility',
        'Return structured pass/fail report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'checks', 'issues'],
      properties: {
        valid: { type: 'boolean' },
        checks: { type: 'array' },
        issues: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const fixValidationIssuesTask = defineTask('gemini-fix-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fix validation issues in Gemini CLI extension',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Extension maintainer',
      task: `Fix the following validation issues in the Gemini CLI extension at ${args.pluginDir}:

${JSON.stringify(args.issues, null, 2)}

For each issue: read the affected file, apply the fix, verify the fix resolves the problem.
Return a summary of all fixes applied.`,
      context: { pluginDir: args.pluginDir, issues: args.issues },
      instructions: ['Fix each issue', 'Verify each fix', 'Return summary'],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['fixesApplied'],
      properties: { fixesApplied: { type: 'array', items: { type: 'string' } } }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const setupDistributionTask = defineTask('gemini-setup-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up Gemini CLI extension distribution',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gemini CLI extension distribution specialist',
      task: `Prepare the Gemini CLI extension "${args.pluginName}" at ${args.pluginDir} for distribution.

Gemini CLI extensions are distributed primarily via GitHub and the Gemini extension gallery. Steps:

1. **GitHub distribution setup**:
   - Verify the extension can be installed with:
     \`gemini extensions install https://github.com/<owner>/${args.pluginName}\`
   - Ensure gemini-extension.json is at the repository root
   - Create .gitignore excluding dev artifacts
   - Create GitHub Actions workflow for release automation:
     \`\`\`yaml
     name: Release Extension
     on:
       push:
         tags: ['v*']
     jobs:
       release:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v4
           - name: Create GitHub Release
             uses: softprops/action-gh-release@v2
             with:
               generate_release_notes: true
     \`\`\`

2. **Extension gallery submission preparation**:
   - Create gallery-submission.json with metadata for the Gemini extension gallery:
     \`\`\`json
     {
       "name": "${args.pluginName}",
       "description": "${args.pluginDescription}",
       "version": "1.0.0",
       "author": "${args.author || 'unknown'}",
       "repository": "https://github.com/${args.author || 'unknown'}/${args.pluginName}",
       "categories": [],
       "screenshots": [],
       "installCommand": "gemini extensions install https://github.com/${args.author || 'unknown'}/${args.pluginName}"
     }
     \`\`\`

3. **Create install.md** — installation instructions:
   - Primary: \`gemini extensions install https://github.com/<owner>/${args.pluginName}\`
   - Manual: clone repo, copy to Gemini CLI extensions directory
   - Post-install: verify with \`gemini extensions list\`
   - Configuration steps (environment variables, etc.)
   - Register: babysitter plugin:update-registry --plugin-name ${args.pluginName} --plugin-version 1.0.0 --project --json

4. **Create uninstall.md** — cleanup instructions:
   - \`gemini extensions uninstall ${args.pluginName}\`
   - Manual cleanup if needed
   - Remove from registry

5. **Create configure.md** — post-install configuration

6. **Create CHANGELOG.md** with initial 1.0.0 entry.

Write all distribution files to ${args.pluginDir}/.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName, pluginDescription: args.pluginDescription, author: args.author },
      instructions: [
        'Set up GitHub-based distribution',
        'Prepare extension gallery submission metadata',
        'Write install/uninstall/configure markdown',
        'Create GitHub Actions release workflow',
        'Create CHANGELOG.md',
        'Return list of distribution files'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['distributionFiles', 'installCommand'],
      properties: {
        distributionFiles: { type: 'array', items: { type: 'string' } },
        installCommand: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const generateDocumentationTask = defineTask('gemini-generate-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Gemini CLI extension documentation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer for Gemini CLI extensions',
      task: `Create comprehensive documentation for the Gemini CLI extension "${args.pluginName}" at ${args.pluginDir}.

Create:

1. **README.md** with:
   - Extension name, description, and Gemini CLI version requirements
   - Installation via \`gemini extensions install\` and manual methods
   - Component overview (skills, hooks, commands, context file)
   - Configuration reference (environment variables, extension settings)
   - Usage examples for each major feature
   - How GEMINI.md context injection works
   - Troubleshooting section
   - Contributing and license

2. **USAGE.md** — detailed usage guide:
   - Gemini CLI setup prerequisites
   - How extensions integrate with Gemini CLI conversations
   - Step-by-step skill walkthroughs
   - Hook behavior and lifecycle documentation
   - Command reference with examples
   - Context file customization guide
   - Tips for effective extension usage with Gemini models

3. **examples/** directory:
   - Example GEMINI.md customizations
   - Sample conversation flows showing the extension in action
   - Configuration examples for different use cases

Document thoroughly for Gemini CLI users.`,
      context: { pluginDir: args.pluginDir, pluginName: args.pluginName, requirements: args.requirements, components: args.components },
      instructions: [
        'Write comprehensive README.md',
        'Write detailed USAGE.md',
        'Create example configurations and workflows',
        'Return list of documentation files'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationFiles'],
      properties: {
        documentationFiles: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// ============================================================================
// MAIN PROCESS
// ============================================================================

export async function process(inputs, ctx) {
  const {
    pluginName,
    pluginDescription,
    outputDir = '.',
    components = {},
    contextFileName = 'GEMINI.md',
    author = 'unknown'
  } = inputs;

  const pluginDir = `${outputDir}/${pluginName}`;
  const startTime = ctx.now();

  ctx.log('info', `Creating Gemini CLI extension "${pluginName}" at ${pluginDir}`);

  // ========================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ========================================================================

  ctx.log('info', 'Phase 1: Analyzing extension requirements for Gemini CLI');

  const requirements = await ctx.task(analyzeRequirementsTask, {
    pluginName,
    pluginDescription,
    components
  });

  await ctx.breakpoint({
    question: `Requirements analysis complete for Gemini CLI extension "${pluginName}". Components: ${JSON.stringify(Object.keys(requirements.components))}. Gemini features: ${JSON.stringify(requirements.geminiFeatures)}. Review and approve to proceed.`,
    options: ['Approve — proceed to scaffolding', 'Revise — adjust requirements'],
    expert: 'owner'
  });

  // ========================================================================
  // PHASE 2: SCAFFOLD EXTENSION STRUCTURE
  // ========================================================================

  ctx.log('info', 'Phase 2: Scaffolding Gemini CLI extension structure');

  const scaffold = await ctx.task(scaffoldExtensionTask, {
    pluginName,
    pluginDescription,
    outputDir,
    requirements,
    author,
    contextFileName
  });

  // ========================================================================
  // PHASE 3: IMPLEMENT COMPONENTS
  // ========================================================================

  ctx.log('info', 'Phase 3: Implementing extension components');

  const implemented = await ctx.task(implementComponentsTask, {
    pluginName,
    pluginDir,
    requirements
  });

  // ========================================================================
  // PHASE 4: TESTING & VALIDATION
  // ========================================================================

  ctx.log('info', 'Phase 4: Testing and validating extension');

  const validation = await ctx.task(testAndValidateTask, {
    pluginDir,
    pluginName
  });

  if (!validation.valid && validation.issues && validation.issues.length > 0) {
    ctx.log('warn', `Found ${validation.issues.length} validation issues, fixing...`);
    await ctx.task(fixValidationIssuesTask, {
      pluginDir,
      issues: validation.issues
    });
  }

  await ctx.breakpoint({
    question: `Gemini CLI extension implementation and validation complete. ${validation.valid ? 'All checks passed.' : `Fixed ${validation.issues?.length || 0} issues.`} Review the extension at ${pluginDir}. Approve to proceed with distribution.`,
    options: ['Approve — proceed to distribution', 'Reject — needs more work'],
    expert: 'owner'
  });

  // ========================================================================
  // PHASE 5: DISTRIBUTION SETUP
  // ========================================================================

  ctx.log('info', 'Phase 5: Setting up GitHub/gallery distribution');

  const distribution = await ctx.task(setupDistributionTask, {
    pluginDir,
    pluginName,
    pluginDescription,
    author
  });

  // ========================================================================
  // PHASE 6: DOCUMENTATION
  // ========================================================================

  ctx.log('info', 'Phase 6: Generating documentation');

  const documentation = await ctx.task(generateDocumentationTask, {
    pluginDir,
    pluginName,
    requirements,
    components: implemented
  });

  ctx.log('info', `Gemini CLI extension "${pluginName}" creation complete`);

  return {
    success: true,
    pluginDir,
    manifest: { name: pluginName, version: '1.0.0', author, contextFileName },
    components: implemented.componentCounts,
    distributionReady: true,
    installCommand: distribution.installCommand,
    files: {
      scaffold: scaffold.createdFiles,
      implemented: implemented.implementedFiles,
      distribution: distribution.distributionFiles,
      documentation: documentation.documentationFiles
    },
    duration: ctx.now() - startTime
  };
}
