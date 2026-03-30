# Packaging Processes with Skills

**Date:** 2026-01-20
**Version:** 1.0

---

## Overview

Skills can package reusable process implementations alongside their instructions. This creates self-contained skill packages that include both the skill definition and the processes needed to execute tasks.

**Benefits:**
- **Portability** - Skills become self-contained with their processes
- **Discoverability** - Processes are co-located with the skills that use them
- **Versioning** - Skills and their processes version together
- **Reusability** - Share complete skill packages across projects

---

## Directory Structure

### Standard Pattern

```
.claude/skills/<skill-name>/
├── SKILL.md                    # Skill instructions
├── reference/                  # Skill documentation
│   └── *.md
└── process/                    # Packaged processes
    ├── <process-name>.js       # Process implementation
    ├── <process-name>.md       # Process documentation
    └── examples/               # Example inputs
        └── <process-name>-example.json
```

### Example: Task Management Skill

```
.claude/skills/task-manager/
├── SKILL.md
├── reference/
│   └── task-management-guide.md
└── process/
    ├── create-task-tracker.js
    ├── create-task-tracker.md
    ├── generate-status-report.js
    ├── generate-status-report.md
    └── examples/
        ├── create-task-tracker-example.json
        └── generate-status-report-example.json
```

---

## Process File Format

### Basic Process Template

**File:** `.claude/skills/<skill-name>/process/<process-name>.js`

```javascript
/**
 * @process <skill-name>/<process-name>
 * @description Brief description of what this process does
 * @inputs { param1: string, param2: number }
 * @outputs { result: string }
 */

/**
 * Process implementation
 * @param {Object} inputs - Process inputs
 * @param {Object} ctx - Process context (ctx.task, ctx.breakpoint, etc.)
 * @returns {Promise<Object>} Process result
 */
export async function process(inputs, ctx) {
  // Validate inputs
  if (!inputs.param1) {
    throw new Error('param1 is required');
  }

  // Execute tasks
  const result = await ctx.task(someTask, {
    data: inputs.param1
  });

  // Return structured output
  return {
    result: result.output,
    metadata: {
      processId: '<skill-name>/<process-name>',
      timestamp: ctx.now()
    }
  };
}

// Export task definitions if needed
export const someTask = {
  kind: 'node',
  node: {
    entry: './tasks/some-task.js'
  }
};
```

### Process Documentation Template

**File:** `.claude/skills/<skill-name>/process/<process-name>.md`

```markdown
# <Process Name>

Brief description of the process.

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| param1 | string | Yes | Description of param1 |
| param2 | number | No | Description of param2 (default: 10) |

## Outputs

| Field | Type | Description |
|-------|------|-------------|
| result | string | Description of result |
| metadata | object | Process metadata |

## Example

\`\`\`json
{
  "param1": "example value",
  "param2": 42
}
\`\`\`

## Usage

\`\`\`bash
babysitter run:create \
  --process-id <skill-name>/<process-name> \
  --entry .claude/skills/<skill-name>/process/<process-name>.js#process \
  --inputs inputs.json
\`\`\`

## Notes

- Additional usage notes
- Common patterns
- Troubleshooting tips
```

---

## Using Packaged Processes

### Method 1: Direct CLI Usage

```bash
# Create a run using a skill-packaged process
babysitter run:create \
  --process-id task-manager/create-tracker \
  --entry .claude/skills/task-manager/process/create-task-tracker.js#process \
  --inputs examples/tracker-inputs.json \
  --run-id "run-$(date -u +%Y%m%d-%H%M%S)-task-tracker"
```

### Method 2: From Skill Instructions

**In SKILL.md:**

```markdown
# Task Manager Skill

When the user requests task tracking setup:

1. Use the packaged process:
   \`\`\`bash
   babysitter run:create \
     --process-id task-manager/create-tracker \
     --entry .claude/skills/task-manager/process/create-task-tracker.js#process \
     --inputs inputs.json
   \`\`\`

2. The process is located at: `.claude/skills/task-manager/process/create-task-tracker.js`

3. See documentation: `.claude/skills/task-manager/process/create-task-tracker.md`
```

### Method 3: Reference in Other Processes

**In main.js:**

```javascript
import { process as createTracker } from '.claude/skills/task-manager/process/create-task-tracker.js';

export async function myProcess(inputs, ctx) {
  // Use skill-packaged process
  const tracker = await ctx.task({
    kind: 'node',
    node: {
      entry: '.claude/skills/task-manager/process/create-task-tracker.js',
      exportName: 'process'
    }
  }, inputs.trackerConfig);

  return { trackerId: tracker.result };
}
```

---

## Complete Example: Documentation Generator Skill

### Skill Structure

```
.claude/skills/doc-generator/
├── SKILL.md
├── reference/
│   └── api-reference.md
└── process/
    ├── generate-api-docs.js
    ├── generate-api-docs.md
    ├── generate-readme.js
    ├── generate-readme.md
    └── examples/
        ├── api-docs-inputs.json
        └── readme-inputs.json
```

### Process Implementation

**File:** `.claude/skills/doc-generator/process/generate-api-docs.js`

```javascript
/**
 * @process doc-generator/generate-api-docs
 * @description Generate API documentation from source code
 * @inputs { sourceDir: string, outputDir: string, format: 'markdown' | 'html' }
 * @outputs { docsPath: string, filesGenerated: number }
 */

export async function process(inputs, ctx) {
  const { sourceDir, outputDir, format = 'markdown' } = inputs;

  // Validate inputs
  if (!sourceDir || !outputDir) {
    throw new Error('sourceDir and outputDir are required');
  }

  // Scan source files
  const scanResult = await ctx.task(scanSourceTask, {
    directory: sourceDir
  });

  ctx.log(`Found ${scanResult.files.length} source files`);

  // Generate documentation
  const generateResult = await ctx.task(generateDocsTask, {
    files: scanResult.files,
    outputDir,
    format
  });

  ctx.log(`Generated ${generateResult.filesGenerated} documentation files`);

  return {
    docsPath: outputDir,
    filesGenerated: generateResult.filesGenerated,
    format,
    metadata: {
      processId: 'doc-generator/generate-api-docs',
      timestamp: ctx.now(),
      sourceDir,
      outputDir
    }
  };
}

// Task definitions
export const scanSourceTask = {
  kind: 'node',
  node: {
    entry: './tasks/scan-source.js'
  }
};

export const generateDocsTask = {
  kind: 'node',
  node: {
    entry: './tasks/generate-docs.js'
  }
};
```

### Process Documentation

**File:** `.claude/skills/doc-generator/process/generate-api-docs.md`

```markdown
# Generate API Documentation

Scans source code and generates API documentation in the specified format.

## Inputs

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| sourceDir | string | Yes | - | Source code directory to scan |
| outputDir | string | Yes | - | Output directory for generated docs |
| format | string | No | 'markdown' | Documentation format ('markdown' or 'html') |

## Outputs

| Field | Type | Description |
|-------|------|-------------|
| docsPath | string | Path to generated documentation |
| filesGenerated | number | Number of documentation files created |
| format | string | Format used for documentation |
| metadata | object | Process execution metadata |

## Example Inputs

\`\`\`json
{
  "sourceDir": "src/api",
  "outputDir": "docs/api",
  "format": "markdown"
}
\`\`\`

## Usage

\`\`\`bash
babysitter run:create \
  --process-id doc-generator/generate-api-docs \
  --entry .claude/skills/doc-generator/process/generate-api-docs.js#process \
  --inputs api-docs-inputs.json \
  --run-id "run-$(date -u +%Y%m%d-%H%M%S)-api-docs"
\`\`\`

## Tasks

This process uses the following tasks:

1. **scanSourceTask** - Scans source directory for code files
2. **generateDocsTask** - Generates documentation from source files

## Notes

- Supports TypeScript, JavaScript, and JSDoc comments
- Generates index files automatically
- Respects .gitignore patterns
```

### Skill Instructions

**File:** `.claude/skills/doc-generator/SKILL.md`

```markdown
# Documentation Generator Skill

Use this skill to generate API documentation from source code.

## Packaged Processes

This skill includes the following processes:

### 1. generate-api-docs

**Location:** `.claude/skills/doc-generator/process/generate-api-docs.js`

**Purpose:** Generate API documentation from source code

**Usage:**
\`\`\`bash
babysitter run:create \
  --process-id doc-generator/generate-api-docs \
  --entry .claude/skills/doc-generator/process/generate-api-docs.js#process \
  --inputs inputs.json
\`\`\`

**Example inputs:**
\`\`\`json
{
  "sourceDir": "src/api",
  "outputDir": "docs/api",
  "format": "markdown"
}
\`\`\`

See: `.claude/skills/doc-generator/process/generate-api-docs.md` for full documentation.

### 2. generate-readme

**Location:** `.claude/skills/doc-generator/process/generate-readme.js`

**Purpose:** Generate comprehensive README from project structure

**Usage:**
\`\`\`bash
babysitter run:create \
  --process-id doc-generator/generate-readme \
  --entry .claude/skills/doc-generator/process/generate-readme.js#process \
  --inputs inputs.json
\`\`\`

See: `.claude/skills/doc-generator/process/generate-readme.md` for full documentation.

## Workflow

When user requests documentation generation:

1. Ask about documentation type (API docs, README, full docs)
2. Get required inputs (source directory, output directory, format)
3. Create inputs.json file
4. Run appropriate process via CLI
5. Verify generated documentation
6. Report results to user
```

---

## Best Practices

### 1. Process Naming

**Do:**
- Use kebab-case: `generate-api-docs.js`
- Be descriptive: `create-deployment-pipeline.js`
- Use verbs: `analyze-`, `generate-`, `deploy-`

**Don't:**
- Use spaces: `generate api docs.js`
- Be vague: `process1.js`, `handler.js`
- Use abbreviations: `gen-docs.js`

### 2. Documentation

**Always include:**
- Process purpose and description
- Input parameters with types and defaults
- Output structure
- Usage examples
- Common patterns and troubleshooting

**Consider adding:**
- Diagrams for complex processes
- Links to related processes
- Version history
- Migration guides

### 3. Input Validation

```javascript
export async function process(inputs, ctx) {
  // Validate required inputs
  const required = ['sourceDir', 'outputDir'];
  for (const field of required) {
    if (!inputs[field]) {
      throw new Error(`Required input missing: ${field}`);
    }
  }

  // Validate types
  if (typeof inputs.sourceDir !== 'string') {
    throw new Error('sourceDir must be a string');
  }

  // Validate values
  if (!['markdown', 'html'].includes(inputs.format)) {
    throw new Error('format must be "markdown" or "html"');
  }

  // Continue with process...
}
```

### 4. Error Handling

```javascript
export async function process(inputs, ctx) {
  try {
    const result = await ctx.task(riskyTask, inputs);
    return { success: true, result };
  } catch (error) {
    ctx.log(`Task failed: ${error.message}`);

    // Request approval to retry
    await ctx.breakpoint({
      question: `Task failed: ${error.message}. Retry?`,
      context: {
        files: [
          { path: 'artifacts/error-log.txt', format: 'code' }
        ]
      }
    });

    // Retry after approval
    return await ctx.task(riskyTask, inputs);
  }
}
```

### 5. Output Structure

```javascript
export async function process(inputs, ctx) {
  // ... process implementation

  // Return consistent structure
  return {
    // Primary results
    result: mainResult,

    // Metadata
    metadata: {
      processId: 'skill-name/process-name',
      version: '1.0.0',
      timestamp: ctx.now(),
      duration: Date.now() - startTime
    },

    // Optional: Artifacts
    artifacts: {
      logs: 'artifacts/process.log',
      report: 'artifacts/report.md'
    },

    // Optional: Next steps
    nextSteps: [
      'Review generated files',
      'Run tests',
      'Deploy to staging'
    ]
  };
}
```

---

## Integration with Babysitter Skill

The babysitter skill should reference packaged processes when orchestrating runs:

1. **Discovery** - Check for processes in skill directories
2. **Validation** - Ensure process files exist and are valid
3. **Execution** - Use CLI to create and run packaged processes
4. **Documentation** - Generate documentation from packaged processes

See `plugins/babysitter/skills/babysit/SKILL.md` for integration details.

---

## Migration Guide

### Moving Processes to Skills

**Before** (global process):
```
.a5c/processes/roles/development/recipes/build-api.js
```

**After** (skill-packaged process):
```
.claude/skills/api-builder/process/build-api.js
```

**Steps:**

1. Create skill directory structure:
   ```bash
   mkdir -p .claude/skills/api-builder/process
   ```

2. Move process file:
   ```bash
   mv .a5c/processes/roles/development/recipes/build-api.js \
      .claude/skills/api-builder/process/build-api.js
   ```

3. Create process documentation:
   ```bash
   touch .claude/skills/api-builder/process/build-api.md
   ```

4. Update skill instructions:
   ```bash
   # Add process reference to SKILL.md
   echo "## Packaged Processes" >> .claude/skills/api-builder/SKILL.md
   ```

5. Update references:
   ```bash
   # Update any main.js files that import this process
   # Change: import { process } from '.a5c/processes/...'
   # To:     import { process } from '.claude/skills/api-builder/process/build-api.js'
   ```

---

## Troubleshooting

### Process not found

**Error:** `Cannot find module '.claude/skills/my-skill/process/my-process.js'`

**Solutions:**
- Verify file exists at the specified path
- Check file permissions (must be readable)
- Ensure correct export name in CLI command

### Import errors

**Error:** `SyntaxError: Cannot use import statement outside a module`

**Solutions:**
- Use `.js` extension (not `.mjs`) for Node.js compatibility
- Ensure file has `export` statements
- Check `package.json` has `"type": "module"` if using ES modules

### Process validation fails

**Error:** `Process validation failed: missing required field 'processId'`

**Solutions:**
- Include `@process` JSDoc comment with processId
- Follow naming convention: `<skill-name>/<process-name>`
- Ensure process function is exported

---

## Reference

### Related Documentation

- `plugins/babysitter/BABYSITTER_PLUGIN_SPECIFICATION.md` - Plugin architecture
- `plugins/babysitter/skills/babysit/SKILL.md` - Babysitter skill instructions
- `packages/sdk/sdk.md` - SDK API reference

### CLI Commands

```bash
# List all processes (including skill-packaged)
find .claude/skills -name "*.js" -path "*/process/*"

# Validate process file
babysitter run:create --process-id test/validate \
  --entry .claude/skills/my-skill/process/my-process.js#process \
  --inputs examples/test-inputs.json \
  --dry-run

# Run skill-packaged process
babysitter run:create \
  --process-id my-skill/my-process \
  --entry .claude/skills/my-skill/process/my-process.js#process \
  --inputs inputs.json
```

---

**END OF DOCUMENTATION**
