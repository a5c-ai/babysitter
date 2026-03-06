import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildImage,
  dockerExec,
  startContainer,
  stopContainer,
} from "./helpers";
import path from "path";

/**
 * Extract the last JSON object from multi-line CLI output.
 */
function parseLastJsonObject(output: string): unknown {
  const trimmed = output.trim();
  const lastBrace = trimmed.lastIndexOf("}");
  if (lastBrace === -1) throw new SyntaxError("No JSON object found in output");
  let depth = 0;
  for (let i = lastBrace; i >= 0; i--) {
    if (trimmed[i] === "}") depth++;
    if (trimmed[i] === "{") depth--;
    if (depth === 0) {
      return JSON.parse(trimmed.slice(i, lastBrace + 1));
    }
  }
  throw new SyntaxError("Unmatched braces in output");
}

/**
 * Extract the last JSON array from multi-line CLI output.
 */
function parseLastJsonArray(output: string): unknown {
  const trimmed = output.trim();
  const lastBracket = trimmed.lastIndexOf("]");
  if (lastBracket === -1) throw new SyntaxError("No JSON array found in output");
  let depth = 0;
  for (let i = lastBracket; i >= 0; i--) {
    if (trimmed[i] === "]") depth++;
    if (trimmed[i] === "[") depth--;
    if (depth === 0) {
      return JSON.parse(trimmed.slice(i, lastBracket + 1));
    }
  }
  throw new SyntaxError("Unmatched brackets in output");
}

const ROOT = path.resolve(__dirname, "../..");

beforeAll(() => {
  buildImage(ROOT);
  startContainer();
}, 300_000);

afterAll(() => {
  stopContainer();
});

// ============================================================================
// Full Plugin Lifecycle — sound-hooks
// ============================================================================

describe("Plugin Full Lifecycle — sound-hooks", () => {
  const workDir = "/tmp/plugin-lifecycle-test";
  const marketplaceName = "sound-mkt";
  const pluginName = "sound-hooks";

  const installMd = `# Sound Hooks — Install Instructions

## Step 1: Interview the User

Ask the user which sound theme they prefer:

1. **TV Shows** — classic TV sounds (laugh track, dramatic sting, etc.)
2. **Movies** — cinematic effects (inception horn, Wilhelm scream, etc.)
3. **Video Games** — retro game sounds (coin collect, level up, game over, etc.)
4. **Custom** — let the user provide their own sound files

## Step 2: Download Sound Files

Based on the chosen theme, search for and download mp3/wav files from the internet.
Store them in a \`sounds/\` directory within the project:

\`\`\`
.a5c/sounds/
  on-run-start.wav
  on-run-complete.wav
  on-run-fail.wav
  on-task-start.wav
  on-task-complete.wav
\`\`\`

## Step 3: Create Hook Scripts

Create shell scripts that play sounds using \`aplay\` (Linux) or \`afplay\` (macOS):

\`\`\`bash
#!/bin/bash
# .a5c/hooks/on-run-start.sh
aplay .a5c/sounds/on-run-start.wav 2>/dev/null || afplay .a5c/sounds/on-run-start.wav 2>/dev/null
\`\`\`

## Step 4: Register Hooks

Add the hook scripts to the Claude Code settings so they fire on the correct events.
`;

  const uninstallMd = `# Sound Hooks — Uninstall Instructions

## Step 1: Remove Hook Scripts

Delete all sound hook scripts:

\`\`\`bash
rm -rf .a5c/hooks/on-run-start.sh
rm -rf .a5c/hooks/on-run-complete.sh
rm -rf .a5c/hooks/on-run-fail.sh
rm -rf .a5c/hooks/on-task-start.sh
rm -rf .a5c/hooks/on-task-complete.sh
\`\`\`

## Step 2: Remove Sound Files

\`\`\`bash
rm -rf .a5c/sounds/
\`\`\`

## Step 3: Deregister Hooks

Remove the hook entries from Claude Code settings.
`;

  const configureMd = `# Sound Hooks — Configure Instructions

## Options

- **Change theme**: Switch between TV, Movies, Games, or Custom sound themes
- **Adjust volume**: Set playback volume (0-100)
- **Toggle events**: Enable or disable sounds for specific hook events

## Volume Configuration

Edit \`.a5c/sound-hooks.config.json\`:

\`\`\`json
{
  "theme": "video-games",
  "volume": 75,
  "events": {
    "on-run-start": true,
    "on-run-complete": true,
    "on-run-fail": true,
    "on-task-start": false,
    "on-task-complete": false
  }
}
\`\`\`
`;

  const migrationMd = `# Migration: 1.0.0 → 1.1.0

## New Hook Events

Version 1.1.0 adds support for two new hook events:

- \`on-breakpoint\` — plays a notification sound when a breakpoint is hit
- \`on-score\` — plays a success/failure jingle based on the quality score

## Steps

1. Download additional sound files for the new events
2. Create new hook scripts for \`on-breakpoint\` and \`on-score\`
3. Update \`.a5c/sound-hooks.config.json\` to include the new events
4. Register the new hooks in Claude Code settings
`;

  // -- Setup: create fixture marketplace with sound-hooks plugin --

  test("setup: create fixture marketplace with sound-hooks plugin", () => {
    const mktDir = `${workDir}/.a5c/marketplaces/${marketplaceName}`;
    const pluginDir = `${mktDir}/plugins/${pluginName}`;
    const migrationsDir = `${pluginDir}/migrations`;

    const manifest = JSON.stringify({
      name: marketplaceName,
      description: "Sound hooks marketplace for E2E lifecycle tests",
      url: "https://example.com/sound-mkt.git",
      owner: "test-owner",
      plugins: {
        [pluginName]: {
          name: pluginName,
          description: "Play sound effects on Claude Code hook events",
          latestVersion: "1.1.0",
          versions: ["1.0.0", "1.1.0"],
          packagePath: `plugins/${pluginName}`,
          tags: ["hooks", "sound", "notifications"],
          author: "sound-team",
        },
      },
    });

    dockerExec(
      [
        `mkdir -p ${migrationsDir}`,
        // marketplace.json
        `cat > ${mktDir}/marketplace.json << 'MKTEOF'\n${manifest}\nMKTEOF`,
        // install.md
        `cat > ${pluginDir}/install.md << 'INSTALLEOF'\n${installMd}\nINSTALLEOF`,
        // uninstall.md
        `cat > ${pluginDir}/uninstall.md << 'UNINSTALLEOF'\n${uninstallMd}\nUNINSTALLEOF`,
        // configure.md
        `cat > ${pluginDir}/configure.md << 'CONFIGEOF'\n${configureMd}\nCONFIGEOF`,
        // migration file
        `cat > ${migrationsDir}/1.0.0_to_1.1.0.md << 'MIGEOF'\n${migrationMd}\nMIGEOF`,
        // git init
        `cd ${mktDir} && git init && git add -A && git commit -m "init sound-hooks marketplace"`,
      ].join(" && ")
    );

    // Verify the fixture was created
    const ls = dockerExec(`ls ${pluginDir}`).trim();
    expect(ls).toContain("install.md");
    expect(ls).toContain("uninstall.md");
    expect(ls).toContain("configure.md");
    expect(ls).toContain("migrations");
  });

  // -- Lifecycle tests (sequential, each depends on prior state) --

  test("list-plugins shows sound-hooks in marketplace", () => {
    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:list-plugins --marketplace-name ${marketplaceName} --project --json`
    ).trim();

    const result = parseLastJsonObject(out) as Record<string, unknown>;
    expect(result.marketplace).toBe(marketplaceName);
    expect(result.count).toBe(1);
    const plugins = result.plugins as Array<Record<string, unknown>>;
    expect(plugins[0].name).toBe(pluginName);
    expect(plugins[0].latestVersion).toBe("1.1.0");
    expect(plugins[0].description).toBe(
      "Play sound effects on Claude Code hook events"
    );
  });

  test("install returns install instructions with sound theme interview", () => {
    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:install --plugin-name ${pluginName} --marketplace-name ${marketplaceName} --project --json`
    ).trim();

    const result = parseLastJsonObject(out) as Record<string, unknown>;
    expect(result.plugin).toBe(pluginName);
    expect(result.version).toBe("1.1.0");
    expect(result.marketplace).toBe(marketplaceName);
    expect(result.scope).toBe("project");
    expect(typeof result.instructions).toBe("string");

    const instructions = result.instructions as string;
    // Verify the install instructions contain the sound theme interview
    expect(instructions).toContain("Interview the User");
    expect(instructions).toContain("TV Shows");
    expect(instructions).toContain("Movies");
    expect(instructions).toContain("Video Games");
    expect(instructions).toContain("Download Sound Files");
    expect(instructions).toContain("Hook Scripts");
  });

  test("register plugin in registry after install", () => {
    const out = dockerExec(
      [
        `cd ${workDir}`,
        `babysitter plugin:update-registry --plugin-name ${pluginName} --plugin-version 1.0.0 --marketplace-name ${marketplaceName} --project --json`,
      ].join(" && ")
    ).trim();

    const entry = parseLastJsonObject(out) as Record<string, unknown>;
    expect(entry.name).toBe(pluginName);
    expect(entry.version).toBe("1.0.0");
    expect(entry.marketplace).toBe(marketplaceName);
    expect(entry.scope).toBe("project");
  });

  test("list-installed shows sound-hooks", () => {
    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:list-installed --project --json`
    ).trim();

    const entries = parseLastJsonArray(out) as Array<Record<string, unknown>>;
    expect(entries.length).toBe(1);
    expect(entries[0].name).toBe(pluginName);
    expect(entries[0].version).toBe("1.0.0");
    expect(entries[0].marketplace).toBe(marketplaceName);
  });

  test("configure returns hook configuration instructions", () => {
    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:configure --plugin-name ${pluginName} --marketplace-name ${marketplaceName} --project --json`
    ).trim();

    const result = parseLastJsonObject(out) as Record<string, unknown>;
    expect(result.plugin).toBe(pluginName);
    expect(result.marketplace).toBe(marketplaceName);
    expect(result.scope).toBe("project");
    expect(typeof result.instructions).toBe("string");

    const instructions = result.instructions as string;
    expect(instructions).toContain("Change theme");
    expect(instructions).toContain("Adjust volume");
    expect(instructions).toContain("Toggle events");
    expect(instructions).toContain("sound-hooks.config.json");
  });

  test("update finds migration path 1.0.0 → 1.1.0", () => {
    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:update --plugin-name ${pluginName} --marketplace-name ${marketplaceName} --project --json`
    ).trim();

    const result = parseLastJsonObject(out) as Record<string, unknown>;
    expect(result.plugin).toBe(pluginName);
    expect(result.fromVersion).toBe("1.0.0");
    expect(result.toVersion).toBe("1.1.0");
    expect(result.marketplace).toBe(marketplaceName);
    expect(result.scope).toBe("project");

    const migrations = result.migrations as Array<Record<string, unknown>>;
    expect(migrations.length).toBe(1);
    expect(migrations[0].from).toBe("1.0.0");
    expect(migrations[0].to).toBe("1.1.0");
    expect(migrations[0].file).toBe("1.0.0_to_1.1.0.md");
    expect(migrations[0].type).toBe("md");

    const migrationInstructions = migrations[0].instructions as string;
    expect(migrationInstructions).toContain("on-breakpoint");
    expect(migrationInstructions).toContain("on-score");
  });

  test("register updated version in registry", () => {
    const out = dockerExec(
      [
        `cd ${workDir}`,
        `babysitter plugin:update-registry --plugin-name ${pluginName} --plugin-version 1.1.0 --marketplace-name ${marketplaceName} --project --json`,
      ].join(" && ")
    ).trim();

    const entry = parseLastJsonObject(out) as Record<string, unknown>;
    expect(entry.name).toBe(pluginName);
    expect(entry.version).toBe("1.1.0");
    expect(entry.marketplace).toBe(marketplaceName);
  });

  test("uninstall returns uninstall instructions", () => {
    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:uninstall --plugin-name ${pluginName} --project --json`
    ).trim();

    const result = parseLastJsonObject(out) as Record<string, unknown>;
    expect(result.plugin).toBe(pluginName);
    expect(result.version).toBe("1.1.0");
    expect(result.marketplace).toBe(marketplaceName);
    expect(result.scope).toBe("project");
    expect(typeof result.instructions).toBe("string");

    const instructions = result.instructions as string;
    expect(instructions).toContain("Remove Hook Scripts");
    expect(instructions).toContain("Remove Sound Files");
    expect(instructions).toContain("Deregister Hooks");
  });

  test("remove from registry after uninstall", () => {
    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:remove-from-registry --plugin-name ${pluginName} --project --json`
    ).trim();

    const result = parseLastJsonObject(out) as Record<string, unknown>;
    expect(result.removed).toBe(true);
    expect(result.plugin).toBe(pluginName);
  });

  test("list-installed is empty after full cleanup", () => {
    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:list-installed --project --json`
    ).trim();

    const entries = parseLastJsonArray(out) as Array<Record<string, unknown>>;
    expect(entries.length).toBe(0);

    // Clean up
    dockerExec(`rm -rf ${workDir}`);
  });
});
