# Migration System Documentation

The babysitter SDK includes a migration resolution system that finds the shortest path between two plugin versions using migration files in the plugin package directory. This guide covers the naming convention, resolution algorithm, and how to write migration instructions.

## Migration File Naming Convention

Migration files are stored in the `migrations/` subdirectory of a plugin package. Each file describes how to move from one version to another.

### Format

```
<fromVersion>_to_<toVersion>.<ext>
```

### Rules

- **fromVersion** and **toVersion** can contain digits, dots, dashes, and alphanumeric pre-release identifiers (e.g., `1.0.0`, `2.0.0-beta.1`, `3.0.0-rc1`).
- **ext** must be either `md` (markdown instructions) or `js` (babysitter process file).
- The `_to_` separator is literal and required.
- Files that do not match the pattern `^([a-zA-Z0-9._-]+)_to_([a-zA-Z0-9._-]+)\.(md|js)$` are ignored.

### Examples

```
1.0.0_to_1.1.0.md          # Markdown instructions from 1.0.0 to 1.1.0
1.1.0_to_1.2.0.md          # Markdown instructions from 1.1.0 to 1.2.0
1.2.0_to_2.0.0.js          # Process file from 1.2.0 to 2.0.0
2.0.0-beta_to_2.0.0.md     # Pre-release to release
```

## Migration Chain Resolution

When `plugin:update` is called, the SDK resolves the shortest migration path from the installed version to the target version.

### Algorithm

1. **List migrations** -- The SDK reads all files in the `migrations/` directory and parses their filenames into `MigrationDescriptor` objects (containing `from`, `to`, `file`, `type`).

2. **Build graph** -- A directed adjacency list is built with version strings as nodes and migrations as edges. Each edge goes from `fromVersion` to `toVersion`.

3. **BFS shortest path** -- Breadth-first search finds the shortest chain of migrations from the installed version to the target version. This ensures the minimum number of migration steps are applied.

4. **Load content** -- For each migration in the resolved path, the file content is loaded and returned alongside the descriptor.

### Example

Given these migration files:

```
1.0.0_to_1.1.0.md
1.1.0_to_1.2.0.md
1.0.0_to_1.2.0.md    # Direct jump
1.2.0_to_2.0.0.md
```

Updating from `1.0.0` to `2.0.0`:

- Path found by BFS: `1.0.0 -> 1.2.0 -> 2.0.0` (2 steps, using the direct jump)
- Alternative path: `1.0.0 -> 1.1.0 -> 1.2.0 -> 2.0.0` (3 steps, not chosen because BFS finds the shorter path first)

If no path exists between the two versions, the SDK returns an error.

### Edge Cases

- **Same version** -- If `fromVersion === toVersion`, the SDK returns an empty migration list with a message `"Already at target version"`.
- **No migrations directory** -- If the `migrations/` directory does not exist, the SDK returns an empty list of descriptors, and BFS will fail to find a path (resulting in an error).
- **No path found** -- The command returns an error: `No migration path found from version "<from>" to "<to>" for plugin "<name>"`.

## Writing Markdown Migration Instructions

Markdown migration files (`.md`) contain agent-readable instructions. Structure them clearly:

```markdown
# Migration from 1.0.0 to 1.1.0

## Summary
Brief description of what changed.

## Breaking Changes
- List any breaking changes the agent must handle.

## Steps

1. Step-by-step instructions the agent follows.
2. Be explicit about file paths and expected values.
3. Include verification steps where possible.

## Rollback
If the migration fails, reverse the steps by:
1. Rollback instructions.
```

## Writing JavaScript Migration Process Files

JavaScript migration files (`.js`) are babysitter process definitions. They export a standard `process` function and use `defineTask` for multi-step automated operations.

When the SDK finds a `.js` migration file in the resolved chain, it sets the `processFile` field to the absolute path of the file. The agent can then execute it as a babysitter process.

```javascript
const { defineTask } = require("@a5c-ai/babysitter-sdk");

const migrateConfig = defineTask("migrate-config", async (args, ctx) => {
  // Read the old config, transform it, write the new config
  return { success: true };
});

async function process(inputs, ctx) {
  const result = await ctx.task(migrateConfig, {
    pluginDir: inputs.pluginDir,
  });
  return result;
}

module.exports = { process };
```

## Example Migration Workflow

### Scenario

Plugin `my-plugin` is installed at version `1.0.0`. A new version `1.2.0` is available.

### Agent Steps

1. Agent runs:
   ```bash
   babysitter plugin:update my-plugin --marketplace-name my-marketplace --global --json
   ```

2. SDK updates the marketplace (git pull), reads the registry to find installed version `1.0.0`, determines target version `1.2.0`, and resolves the migration chain.

3. SDK returns:
   ```json
   {
     "plugin": "my-plugin",
     "fromVersion": "1.0.0",
     "toVersion": "1.2.0",
     "marketplace": "my-marketplace",
     "scope": "global",
     "migrations": [
       {
         "from": "1.0.0",
         "to": "1.1.0",
         "file": "1.0.0_to_1.1.0.md",
         "type": "md",
         "instructions": "# Migration from 1.0.0 to 1.1.0\n\n1. Update config...",
         "processFile": null
       },
       {
         "from": "1.1.0",
         "to": "1.2.0",
         "file": "1.1.0_to_1.2.0.js",
         "type": "js",
         "instructions": "// Process file content...",
         "processFile": "/home/user/.babysitter/marketplaces/my-marketplace/plugins/my-plugin/migrations/1.1.0_to_1.2.0.js"
       }
     ]
   }
   ```

4. Agent executes each migration step in order:
   - For the `.md` step: reads and follows the instructions
   - For the `.js` step: runs the babysitter process file

5. Agent updates the registry:
   ```bash
   babysitter plugin:update-registry my-plugin --plugin-version 1.2.0 --marketplace-name my-marketplace --global
   ```

## MigrationDescriptor Type

Defined in `packages/sdk/src/plugins/types.ts`:

```typescript
interface MigrationDescriptor {
  /** Source version (semver) */
  from: string;
  /** Target version (semver) */
  to: string;
  /** Filename of the migration file */
  file: string;
  /** Type of migration instructions */
  type: "md" | "js";
}
```

## SDK Functions

The migration system is implemented in `packages/sdk/src/plugins/migrations.ts` and exports:

| Function | Description |
|----------|-------------|
| `parseMigrationFilename(filename)` | Parses a filename into a `MigrationDescriptor` or `undefined` |
| `listMigrations(migrationsDir)` | Lists all valid migration descriptors in a directory |
| `buildMigrationGraph(migrations)` | Builds a directed adjacency list from descriptors |
| `findMigrationPath(migrations, from, to)` | BFS shortest path between two versions |
| `resolveMigrationChain(packageDir, from, to)` | Full resolution: list, find path, load content |
