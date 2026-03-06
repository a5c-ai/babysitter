import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildImage,
  dockerExec,
  dockerExecSafe,
  startContainer,
  stopContainer,
} from "./helpers";
import path from "path";

/**
 * Extract the last JSON object from multi-line CLI output.
 * Handles pretty-printed JSON (with `null, 2` formatting) by
 * finding the last `{...}` block across multiple lines.
 */
function parseLastJsonObject(output: string): unknown {
  const trimmed = output.trim();
  const lastBrace = trimmed.lastIndexOf("}");
  if (lastBrace === -1) throw new SyntaxError("No JSON object found in output");
  // Walk backward to find matching opening brace
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
 * Handles pretty-printed JSON arrays by finding the last `[...]` block.
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

/**
 * Helper to set up a fixture marketplace directory inside the container.
 * Creates a git-initialized marketplace with a marketplace.json manifest
 * and optional plugin package files (install.md, uninstall.md, configure.md).
 *
 * The marketplace is created as a bare git repo so that `git pull` (used by
 * plugin:install's updateMarketplace) does not fail.
 */
function setupFixtureMarketplace(
  baseDir: string,
  marketplaceName: string,
  options?: {
    installMd?: string;
    uninstallMd?: string;
    configureMd?: string;
    pluginName?: string;
  }
): string {
  const pluginName = options?.pluginName ?? "test-plugin";
  const mktDir = `${baseDir}/.a5c/marketplaces/${marketplaceName}`;
  const pluginDir = `${mktDir}/plugins/${pluginName}`;

  const manifest = JSON.stringify({
    name: marketplaceName,
    description: "Fixture marketplace for E2E tests",
    url: "https://example.com/fixture-mkt.git",
    owner: "test-owner",
    plugins: {
      [pluginName]: {
        name: pluginName,
        description: "A test plugin for E2E",
        latestVersion: "1.0.0",
        versions: ["1.0.0"],
        packagePath: `plugins/${pluginName}`,
        tags: ["test"],
        author: "test-author",
      },
    },
  });

  const commands = [
    `mkdir -p ${pluginDir}`,
    // Write marketplace.json
    `cat > ${mktDir}/marketplace.json << 'MKTEOF'
${manifest}
MKTEOF`,
  ];

  if (options?.installMd) {
    commands.push(
      `cat > ${pluginDir}/install.md << 'INSTALLEOF'
${options.installMd}
INSTALLEOF`
    );
  }

  if (options?.uninstallMd) {
    commands.push(
      `cat > ${pluginDir}/uninstall.md << 'UNINSTALLEOF'
${options.uninstallMd}
UNINSTALLEOF`
    );
  }

  if (options?.configureMd) {
    commands.push(
      `cat > ${pluginDir}/configure.md << 'CONFIGEOF'
${options.configureMd}
CONFIGEOF`
    );
  }

  // Initialize as a git repo so updateMarketplace (git pull) does not fail
  commands.push(
    `cd ${mktDir} && git init && git add -A && git commit -m "init" --allow-empty`
  );

  dockerExec(commands.join(" && "));
  return mktDir;
}

// ============================================================================
// Flow 1: Plugin registry CRUD via CLI
// ============================================================================

describe("Plugin Registry CRUD", () => {
  const workDir = "/tmp/plugin-reg-test";

  test("plugin:update-registry creates a registry entry", () => {
    // Set up a fixture marketplace so resolvePluginPackagePath can resolve
    setupFixtureMarketplace(workDir, "test-mkt");

    const out = dockerExec(
      [
        `cd ${workDir}`,
        `babysitter plugin:update-registry --plugin-name test-plugin --plugin-version 1.0.0 --marketplace-name test-mkt --project --json`,
      ].join(" && ")
    ).trim();

    const entry = parseLastJsonObject(out) as Record<string, unknown>;
    expect(entry.name).toBe("test-plugin");
    expect(entry.version).toBe("1.0.0");
    expect(entry.marketplace).toBe("test-mkt");
    expect(entry.scope).toBe("project");
  });

  test("plugin:list-installed shows the registered plugin", () => {
    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:list-installed --project --json`
    ).trim();

    const entries = parseLastJsonArray(out) as Array<Record<string, unknown>>;
    expect(entries.length).toBe(1);
    expect(entries[0].name).toBe("test-plugin");
    expect(entries[0].version).toBe("1.0.0");
    expect(entries[0].marketplace).toBe("test-mkt");
  });

  test("plugin:remove-from-registry removes the plugin entry", () => {
    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:remove-from-registry --plugin-name test-plugin --project --json`
    ).trim();

    const result = parseLastJsonObject(out) as Record<string, unknown>;
    expect(result.removed).toBe(true);
    expect(result.plugin).toBe("test-plugin");
  });

  test("plugin:list-installed shows empty list after removal", () => {
    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:list-installed --project --json`
    ).trim();

    const entries = parseLastJsonArray(out) as Array<Record<string, unknown>>;
    expect(entries.length).toBe(0);

    // Clean up
    dockerExec(`rm -rf ${workDir}`);
  });
});

// ============================================================================
// Flow 2: Plugin install with marketplace fixture
// ============================================================================

describe("Plugin Install from Marketplace", () => {
  const workDir = "/tmp/plugin-install-test";

  test("plugin:list-plugins lists plugins from marketplace manifest", () => {
    setupFixtureMarketplace(workDir, "fixture-mkt", {
      installMd: "# Install\nRun `npm install test-plugin` to install.",
    });

    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:list-plugins --marketplace-name fixture-mkt --project --json`
    ).trim();

    const result = parseLastJsonObject(out) as Record<string, unknown>;
    expect(result.marketplace).toBe("fixture-mkt");
    expect(result.count).toBe(1);
    const plugins = result.plugins as Array<Record<string, unknown>>;
    expect(plugins[0].name).toBe("test-plugin");
    expect(plugins[0].latestVersion).toBe("1.0.0");
  });

  test("plugin:install returns install instructions from marketplace", () => {
    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:install --plugin-name test-plugin --marketplace-name fixture-mkt --project --json`
    ).trim();

    const result = parseLastJsonObject(out) as Record<string, unknown>;
    expect(result.plugin).toBe("test-plugin");
    expect(result.version).toBe("1.0.0");
    expect(result.marketplace).toBe("fixture-mkt");
    expect(result.scope).toBe("project");
    expect(typeof result.instructions).toBe("string");
    expect(result.instructions as string).toContain("npm install test-plugin");

    // Clean up
    dockerExec(`rm -rf ${workDir}`);
  });
});

// ============================================================================
// Flow 3: Plugin uninstall flow
// ============================================================================

describe("Plugin Uninstall Flow", () => {
  const workDir = "/tmp/plugin-uninstall-test";

  test("plugin:uninstall returns uninstall instructions for a registered plugin", () => {
    // Set up marketplace with uninstall.md
    setupFixtureMarketplace(workDir, "unsub-mkt", {
      uninstallMd:
        "# Uninstall\nRun `npm uninstall test-plugin` to remove the plugin.",
    });

    // Register the plugin in the registry first
    dockerExec(
      [
        `cd ${workDir}`,
        `babysitter plugin:update-registry --plugin-name test-plugin --plugin-version 1.0.0 --marketplace-name unsub-mkt --project --json`,
      ].join(" && ")
    );

    // Now uninstall
    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:uninstall --plugin-name test-plugin --project --json`
    ).trim();

    const result = parseLastJsonObject(out) as Record<string, unknown>;
    expect(result.plugin).toBe("test-plugin");
    expect(result.version).toBe("1.0.0");
    expect(result.marketplace).toBe("unsub-mkt");
    expect(result.scope).toBe("project");
    expect(typeof result.instructions).toBe("string");
    expect(result.instructions as string).toContain("npm uninstall test-plugin");

    // Clean up
    dockerExec(`rm -rf ${workDir}`);
  });
});

// ============================================================================
// Flow 4: Plugin configure flow
// ============================================================================

describe("Plugin Configure Flow", () => {
  const workDir = "/tmp/plugin-configure-test";

  test("plugin:configure returns configure instructions", () => {
    setupFixtureMarketplace(workDir, "cfg-mkt", {
      configureMd:
        "# Configure\nSet `PLUGIN_API_KEY` environment variable to enable the plugin.",
    });

    const out = dockerExec(
      `cd ${workDir} && babysitter plugin:configure --plugin-name test-plugin --marketplace-name cfg-mkt --project --json`
    ).trim();

    const result = parseLastJsonObject(out) as Record<string, unknown>;
    expect(result.plugin).toBe("test-plugin");
    expect(result.marketplace).toBe("cfg-mkt");
    expect(result.scope).toBe("project");
    expect(typeof result.instructions).toBe("string");
    expect(result.instructions as string).toContain("PLUGIN_API_KEY");

    // Clean up
    dockerExec(`rm -rf ${workDir}`);
  });
});

// ============================================================================
// Flow 5: Validation errors
// ============================================================================

describe("Plugin CLI Validation Errors", () => {
  test("plugin:install without --plugin-name returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter plugin:install --marketplace-name x --project --json"
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("missing_argument");
  });

  test("plugin:install without --marketplace-name returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter plugin:install --plugin-name x --project --json"
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("missing_argument");
  });

  test("plugin:install without --project/--global returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter plugin:install --plugin-name x --marketplace-name y --json"
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("missing_argument");
  });

  test("plugin:uninstall without --plugin-name returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter plugin:uninstall --project --json"
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("missing_argument");
  });

  test("plugin:uninstall without --project/--global returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter plugin:uninstall --plugin-name x --json"
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("missing_argument");
  });

  test("plugin:configure without --plugin-name returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter plugin:configure --marketplace-name x --project --json"
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("missing_argument");
  });

  test("plugin:configure without --marketplace-name returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter plugin:configure --plugin-name x --project --json"
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("missing_argument");
  });

  test("plugin:list-installed without --project/--global returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter plugin:list-installed --json"
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("missing_argument");
  });

  test("plugin:list-plugins without --marketplace-name returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter plugin:list-plugins --project --json"
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("missing_argument");
  });

  test("plugin:update-registry without --plugin-name returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter plugin:update-registry --plugin-version 1.0.0 --marketplace-name x --project --json"
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("missing_argument");
  });

  test("plugin:update-registry without --plugin-version returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter plugin:update-registry --plugin-name x --marketplace-name y --project --json"
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("missing_argument");
  });

  test("plugin:update-registry without --marketplace-name returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter plugin:update-registry --plugin-name x --plugin-version 1.0.0 --project --json"
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("missing_argument");
  });

  test("plugin:remove-from-registry without --plugin-name returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter plugin:remove-from-registry --project --json"
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("missing_argument");
  });

  test("plugin:uninstall for non-installed plugin returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "cd /tmp && babysitter plugin:uninstall --plugin-name nonexistent --project --json"
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("uninstall_failed");
  });
});
