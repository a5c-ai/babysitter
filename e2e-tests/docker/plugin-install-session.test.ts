import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { exec, IMAGE, PLUGIN_DIR } from "./helpers";
import path from "path";
import fs from "fs";

const ROOT = path.resolve(__dirname, "../..");
const ARTIFACTS_DIR = path.resolve(ROOT, "e2e-artifacts");
const WORKSPACE_HOST = path.resolve(ARTIFACTS_DIR, "plugin-workspace");

const HAS_API_KEY =
  !!process.env.ANTHROPIC_API_KEY || !!process.env.ANTHROPIC_FOUNDRY_API_KEY;

const MARKETPLACE_NAME = "echo-mkt";
const PLUGIN_NAME = "echo-hooks";

// ---------------------------------------------------------------------------
// Plugin fixture content — deterministic instructions Claude can follow
// in non-interactive -p mode (no user interviews, no internet downloads)
// ---------------------------------------------------------------------------

const MARKETPLACE_JSON = JSON.stringify(
  {
    name: MARKETPLACE_NAME,
    description: "Echo hooks marketplace for E2E plugin install test",
    url: "https://example.com/echo-mkt.git",
    owner: "test-owner",
    plugins: {
      [PLUGIN_NAME]: {
        name: PLUGIN_NAME,
        description: "Hook scripts that log events to a file",
        latestVersion: "1.0.0",
        versions: ["1.0.0"],
        packagePath: `plugins/${PLUGIN_NAME}`,
        tags: ["hooks", "logging"],
        author: "test-author",
      },
    },
  },
  null,
  2,
);

const INSTALL_MD = `# Echo Hooks — Install Instructions

Create hook scripts that log hook events to a file. Follow these steps exactly:

## Step 1: Create directories

\`\`\`bash
mkdir -p /workspace/.a5c/echo-hooks/hooks
\`\`\`

## Step 2: Create the log file

\`\`\`bash
touch /workspace/.a5c/echo-hooks/hook-events.log
\`\`\`

## Step 3: Create hook scripts

Create these 5 hook scripts. Each script appends the event name to the log file.

\`\`\`bash
cat > /workspace/.a5c/echo-hooks/hooks/on-run-start.sh << 'HOOKEOF'
#!/bin/bash
echo "on-run-start $(date -Iseconds)" >> /workspace/.a5c/echo-hooks/hook-events.log
HOOKEOF

cat > /workspace/.a5c/echo-hooks/hooks/on-run-complete.sh << 'HOOKEOF'
#!/bin/bash
echo "on-run-complete $(date -Iseconds)" >> /workspace/.a5c/echo-hooks/hook-events.log
HOOKEOF

cat > /workspace/.a5c/echo-hooks/hooks/on-task-start.sh << 'HOOKEOF'
#!/bin/bash
echo "on-task-start $(date -Iseconds)" >> /workspace/.a5c/echo-hooks/hook-events.log
HOOKEOF

cat > /workspace/.a5c/echo-hooks/hooks/on-task-complete.sh << 'HOOKEOF'
#!/bin/bash
echo "on-task-complete $(date -Iseconds)" >> /workspace/.a5c/echo-hooks/hook-events.log
HOOKEOF

cat > /workspace/.a5c/echo-hooks/hooks/on-run-fail.sh << 'HOOKEOF'
#!/bin/bash
echo "on-run-fail $(date -Iseconds)" >> /workspace/.a5c/echo-hooks/hook-events.log
HOOKEOF
\`\`\`

## Step 4: Make scripts executable

\`\`\`bash
chmod +x /workspace/.a5c/echo-hooks/hooks/*.sh
\`\`\`

## Step 5: Create config file

\`\`\`bash
cat > /workspace/.a5c/echo-hooks/config.json << 'CFGEOF'
{
  "version": "1.0.0",
  "activeHooks": ["on-run-start", "on-run-complete", "on-task-start", "on-task-complete", "on-run-fail"],
  "logFile": "/workspace/.a5c/echo-hooks/hook-events.log"
}
CFGEOF
\`\`\`

## Step 6: Register in plugin registry

\`\`\`bash
babysitter plugin:update-registry --plugin-name echo-hooks --plugin-version 1.0.0 --marketplace-name echo-mkt --project --json
\`\`\`

All steps must be completed. Verify each command succeeds before proceeding.
`;

const UNINSTALL_MD = `# Echo Hooks — Uninstall Instructions

Remove all echo-hooks files and registry entry. Follow these steps exactly:

## Step 1: Remove hook scripts and data

\`\`\`bash
rm -rf /workspace/.a5c/echo-hooks
\`\`\`

## Step 2: Remove from plugin registry

\`\`\`bash
babysitter plugin:remove-from-registry --plugin-name echo-hooks --project --json
\`\`\`

Verify that both commands succeed.
`;

const CONFIGURE_MD = `# Echo Hooks — Configure Instructions

## Options

- **Toggle hooks**: Enable or disable specific hook events in config.json
- **Change log file**: Update the logFile path in config.json

## Example: disable on-task-start

Edit \`/workspace/.a5c/echo-hooks/config.json\` and remove "on-task-start" from activeHooks.
`;

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeAll(() => {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  // Clean and recreate workspace
  if (fs.existsSync(WORKSPACE_HOST)) {
    fs.rmSync(WORKSPACE_HOST, { recursive: true, force: true });
  }
  fs.mkdirSync(WORKSPACE_HOST, { recursive: true });

  // Create marketplace fixture on host filesystem
  const mktDir = path.join(
    WORKSPACE_HOST,
    ".a5c",
    "marketplaces",
    MARKETPLACE_NAME,
  );
  const pluginDir = path.join(mktDir, "plugins", PLUGIN_NAME);
  fs.mkdirSync(pluginDir, { recursive: true });

  fs.writeFileSync(path.join(mktDir, "marketplace.json"), MARKETPLACE_JSON);
  fs.writeFileSync(path.join(pluginDir, "install.md"), INSTALL_MD);
  fs.writeFileSync(path.join(pluginDir, "uninstall.md"), UNINSTALL_MD);
  fs.writeFileSync(path.join(pluginDir, "configure.md"), CONFIGURE_MD);

  // Make workspace world-writable so container's claude user can write to it
  exec(`chmod -R 777 ${WORKSPACE_HOST}`);
}, 60_000);

afterAll(() => {
  // Leave artifacts for CI upload
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildEnvFlags(): string[] {
  const envFlags: string[] = ["-e CLI=babysitter"];
  const passthroughVars = [
    "ANTHROPIC_API_KEY",
    "CLAUDE_CODE_USE_FOUNDRY",
    "ANTHROPIC_FOUNDRY_RESOURCE",
    "ANTHROPIC_FOUNDRY_API_KEY",
    "ANTHROPIC_DEFAULT_SONNET_MODEL",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL",
    "ANTHROPIC_DEFAULT_OPUS_MODEL",
  ];
  for (const v of passthroughVars) {
    if (process.env[v]) envFlags.push(`-e ${v}=${process.env[v]}`);
  }
  return envFlags;
}

/**
 * Run Claude Code in Docker with a prompt. Returns stdout.
 * The workspace is bind-mounted so files Claude creates persist on host.
 */
function runClaude(prompt: string, timeoutMs = 600_000): string {
  const envFlags = buildEnvFlags();

  // Setup: git init the marketplace (required for updateMarketplace)
  // Then run Claude with the prompt
  const setupCmd = [
    "cd /workspace/.a5c/marketplaces/echo-mkt && git init && git add -A && git commit -m init --allow-empty 2>/dev/null",
  ].join(" && ");

  const claudeCmd = [
    "cd /workspace",
    `claude --plugin-dir '${PLUGIN_DIR}' --dangerously-skip-permissions --output-format text -p '${prompt.replace(/'/g, "'\\''")}'`,
  ].join(" && ");

  // Post-run: copy session transcript for debugging
  const postRun = [
    "mkdir -p /workspace/.claude-session",
    "cp -r /home/claude/.claude/projects/* /workspace/.claude-session/ 2>/dev/null || true",
    "chmod -R 777 /workspace/.claude-session 2>/dev/null || true",
  ].join(" ; ");

  return exec(
    [
      "docker run --rm",
      ...envFlags,
      `-v ${WORKSPACE_HOST}:/workspace`,
      "--entrypoint bash",
      IMAGE,
      `-c "${setupCmd} ; ${claudeCmd} ; ${postRun}"`,
    ].join(" "),
    { timeout: timeoutMs },
  );
}

// ---------------------------------------------------------------------------
// Phase 1: Fixture validation
// ---------------------------------------------------------------------------

describe("Plugin install fixture", () => {
  test("marketplace fixture was created on host", () => {
    const mktJson = path.join(
      WORKSPACE_HOST,
      ".a5c",
      "marketplaces",
      MARKETPLACE_NAME,
      "marketplace.json",
    );
    expect(fs.existsSync(mktJson)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(mktJson, "utf-8"));
    expect(manifest.plugins[PLUGIN_NAME]).toBeDefined();
    expect(manifest.plugins[PLUGIN_NAME].latestVersion).toBe("1.0.0");
  });

  test("install.md exists with deterministic instructions", () => {
    const installMd = path.join(
      WORKSPACE_HOST,
      ".a5c",
      "marketplaces",
      MARKETPLACE_NAME,
      "plugins",
      PLUGIN_NAME,
      "install.md",
    );
    expect(fs.existsSync(installMd)).toBe(true);
    const content = fs.readFileSync(installMd, "utf-8");
    expect(content).toContain("mkdir -p /workspace/.a5c/echo-hooks/hooks");
    expect(content).toContain("on-run-start.sh");
    expect(content).toContain("plugin:update-registry");
  });
});

// ---------------------------------------------------------------------------
// Phase 2: Install plugin via Claude Code session
// ---------------------------------------------------------------------------

describe.skipIf(!HAS_API_KEY)("Plugin install via Claude Code session", () => {
  test(
    "Claude installs echo-hooks plugin by following install instructions",
    () => {
      const stdout = runClaude(
        "Install the echo-hooks plugin from the echo-mkt marketplace. " +
          "First run: babysitter plugin:install --plugin-name echo-hooks --marketplace-name echo-mkt --project --json " +
          "Then read the install instructions from the JSON output and follow every step exactly. " +
          "Run each bash command shown in the instructions. Do not skip any steps.",
      );

      // Save stdout for debugging
      fs.writeFileSync(
        path.join(ARTIFACTS_DIR, "plugin-install-stdout.log"),
        stdout,
      );
    },
    600_000, // 10 min timeout
  );
});

// ---------------------------------------------------------------------------
// Phase 3: Verify install — disk state
// ---------------------------------------------------------------------------

describe.skipIf(!HAS_API_KEY)("Plugin install verification", () => {
  const hooksDir = path.join(WORKSPACE_HOST, ".a5c", "echo-hooks", "hooks");
  const configPath = path.join(
    WORKSPACE_HOST,
    ".a5c",
    "echo-hooks",
    "config.json",
  );

  test("hooks directory was created", () => {
    expect(fs.existsSync(hooksDir)).toBe(true);
  });

  test("on-run-start.sh hook script exists", () => {
    const script = path.join(hooksDir, "on-run-start.sh");
    expect(fs.existsSync(script)).toBe(true);
    const content = fs.readFileSync(script, "utf-8");
    expect(content).toContain("#!/bin/bash");
    expect(content).toContain("on-run-start");
    expect(content).toContain("hook-events.log");
  });

  test("on-run-complete.sh hook script exists", () => {
    const script = path.join(hooksDir, "on-run-complete.sh");
    expect(fs.existsSync(script)).toBe(true);
    const content = fs.readFileSync(script, "utf-8");
    expect(content).toContain("on-run-complete");
  });

  test("on-task-start.sh hook script exists", () => {
    expect(fs.existsSync(path.join(hooksDir, "on-task-start.sh"))).toBe(true);
  });

  test("on-task-complete.sh hook script exists", () => {
    expect(fs.existsSync(path.join(hooksDir, "on-task-complete.sh"))).toBe(
      true,
    );
  });

  test("on-run-fail.sh hook script exists", () => {
    expect(fs.existsSync(path.join(hooksDir, "on-run-fail.sh"))).toBe(true);
  });

  test("all 5 hook scripts were created", () => {
    if (!fs.existsSync(hooksDir)) return;
    const scripts = fs
      .readdirSync(hooksDir)
      .filter((f) => f.endsWith(".sh"));
    expect(scripts.length).toBe(5);
  });

  test("config.json exists with correct structure", () => {
    expect(fs.existsSync(configPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(config.version).toBe("1.0.0");
    expect(config.activeHooks).toContain("on-run-start");
    expect(config.activeHooks).toContain("on-run-complete");
    expect(config.activeHooks.length).toBe(5);
  });

  test("plugin is registered in babysitter registry", () => {
    // Use a docker run to check registry state from the workspace
    const stdout = exec(
      [
        "docker run --rm",
        `-v ${WORKSPACE_HOST}:/workspace`,
        "--entrypoint bash",
        IMAGE,
        `-c "cd /workspace && babysitter plugin:list-installed --project --json"`,
      ].join(" "),
    ).trim();

    // Parse the JSON array from output
    const trimmed = stdout.trim();
    const lastBracket = trimmed.lastIndexOf("]");
    let depth = 0;
    let startIdx = -1;
    for (let i = lastBracket; i >= 0; i--) {
      if (trimmed[i] === "]") depth++;
      if (trimmed[i] === "[") depth--;
      if (depth === 0) {
        startIdx = i;
        break;
      }
    }

    const entries = JSON.parse(
      trimmed.slice(startIdx, lastBracket + 1),
    ) as Array<Record<string, unknown>>;
    const echoEntry = entries.find(
      (e: Record<string, unknown>) => e.name === PLUGIN_NAME,
    );
    expect(echoEntry).toBeDefined();
    expect(echoEntry!.version).toBe("1.0.0");
    expect(echoEntry!.marketplace).toBe(MARKETPLACE_NAME);
  });
});

// ---------------------------------------------------------------------------
// Phase 4: Verify hooks work — execute a hook script directly
// ---------------------------------------------------------------------------

describe.skipIf(!HAS_API_KEY)("Hook scripts are functional", () => {
  test("running on-run-start.sh writes to log file", () => {
    const hookScript = path.join(
      WORKSPACE_HOST,
      ".a5c",
      "echo-hooks",
      "hooks",
      "on-run-start.sh",
    );
    if (!fs.existsSync(hookScript)) return;

    // Run the hook inside docker (needs bash)
    exec(
      [
        "docker run --rm",
        `-v ${WORKSPACE_HOST}:/workspace`,
        "--entrypoint bash",
        IMAGE,
        `-c "bash /workspace/.a5c/echo-hooks/hooks/on-run-start.sh"`,
      ].join(" "),
    );

    const logPath = path.join(
      WORKSPACE_HOST,
      ".a5c",
      "echo-hooks",
      "hook-events.log",
    );
    expect(fs.existsSync(logPath)).toBe(true);
    const logContent = fs.readFileSync(logPath, "utf-8");
    expect(logContent).toContain("on-run-start");
  });
});

// ---------------------------------------------------------------------------
// Phase 5: Uninstall plugin via Claude Code session
// ---------------------------------------------------------------------------

describe.skipIf(!HAS_API_KEY)(
  "Plugin uninstall via Claude Code session",
  () => {
    test(
      "Claude uninstalls echo-hooks plugin by following uninstall instructions",
      () => {
        const stdout = runClaude(
          "Uninstall the echo-hooks plugin. " +
            "First run: babysitter plugin:uninstall --plugin-name echo-hooks --project --json " +
            "Then read the uninstall instructions from the JSON output and follow every step exactly. " +
            "Run each bash command shown in the instructions. Do not skip any steps.",
        );

        fs.writeFileSync(
          path.join(ARTIFACTS_DIR, "plugin-uninstall-stdout.log"),
          stdout,
        );
      },
      600_000,
    );
  },
);

// ---------------------------------------------------------------------------
// Phase 6: Verify uninstall — disk state
// ---------------------------------------------------------------------------

describe.skipIf(!HAS_API_KEY)("Plugin uninstall verification", () => {
  test("echo-hooks directory was removed", () => {
    const echoDir = path.join(WORKSPACE_HOST, ".a5c", "echo-hooks");
    expect(fs.existsSync(echoDir)).toBe(false);
  });

  test("plugin is no longer in registry", () => {
    const stdout = exec(
      [
        "docker run --rm",
        `-v ${WORKSPACE_HOST}:/workspace`,
        "--entrypoint bash",
        IMAGE,
        `-c "cd /workspace && babysitter plugin:list-installed --project --json"`,
      ].join(" "),
    ).trim();

    // Parse the JSON array
    const trimmed = stdout.trim();
    const lastBracket = trimmed.lastIndexOf("]");
    let depth = 0;
    let startIdx = -1;
    for (let i = lastBracket; i >= 0; i--) {
      if (trimmed[i] === "]") depth++;
      if (trimmed[i] === "[") depth--;
      if (depth === 0) {
        startIdx = i;
        break;
      }
    }

    const entries = JSON.parse(
      trimmed.slice(startIdx, lastBracket + 1),
    ) as Array<Record<string, unknown>>;
    const echoEntry = entries.find(
      (e: Record<string, unknown>) => e.name === PLUGIN_NAME,
    );
    expect(echoEntry).toBeUndefined();
  });
});
