import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildGeminiCliImage,
  dockerExec,
  dockerExecSafe,
  GEMINI_CLI_EXTENSION_DIR,
  startGeminiCliContainer,
  stopGeminiCliContainer,
} from "./helpers-gemini-cli";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

beforeAll(() => {
  buildGeminiCliImage(ROOT);
  startGeminiCliContainer();
}, 300_000); // 5 min for Docker build

afterAll(() => {
  stopGeminiCliContainer();
});

describe("Docker structural tests (gemini-cli)", () => {
  test("babysitter CLI is available and returns a semver version", () => {
    const version = dockerExec("babysitter --version").trim();
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  test("Node.js v20+ is installed", () => {
    const version = dockerExec("node --version").trim();
    const major = parseInt(version.replace("v", "").split(".")[0], 10);
    expect(major).toBeGreaterThanOrEqual(20);
  });

  test("jq is installed", () => {
    const out = dockerExec("jq --version").trim();
    expect(out).toMatch(/^jq-/);
  });

  test("git is installed", () => {
    const out = dockerExec("git --version").trim();
    expect(out).toMatch(/^git version/);
  });

  test("runs as non-root user gemini", () => {
    const user = dockerExec("whoami").trim();
    expect(user).toBe("gemini");
  });

  test("HOME is /home/gemini", () => {
    const home = dockerExec("echo $HOME").trim();
    expect(home).toBe("/home/gemini");
  });

  test("/workspace directory exists", () => {
    dockerExec("test -d /workspace");
  });
});

describe("Extension installation (gemini-cli)", () => {
  test("extension directory exists", () => {
    dockerExec(`test -d ${GEMINI_CLI_EXTENSION_DIR}`);
  });

  test("gemini-extension.json exists with contextFileName", () => {
    const raw = dockerExec(
      `cat ${GEMINI_CLI_EXTENSION_DIR}/gemini-extension.json`,
    ).trim();
    const ext = JSON.parse(raw);
    expect(ext.name).toBeTruthy();
    expect(ext.contextFileName).toBe("GEMINI.md");
  });

  test("plugin.json exists with correct fields", () => {
    const raw = dockerExec(
      `cat ${GEMINI_CLI_EXTENSION_DIR}/plugin.json`,
    ).trim();
    const pluginJson = JSON.parse(raw);
    expect(pluginJson.name).toBe("babysitter");
    expect(pluginJson.version).toBeTruthy();
    expect(pluginJson.description).toBeTruthy();
    expect(pluginJson.harness).toBe("gemini-cli");
    expect(pluginJson.hooks).toBeDefined();
    expect(pluginJson.hooks.SessionStart).toBeTruthy();
    expect(pluginJson.hooks.AfterAgent).toBeTruthy();
    expect(pluginJson.commands).toBeDefined();
    expect(pluginJson.commands.length).toBeGreaterThan(0);
  });

  test("GEMINI.md context file exists and is non-trivial", () => {
    dockerExec(`test -f ${GEMINI_CLI_EXTENSION_DIR}/GEMINI.md`);
    const size = dockerExec(
      `wc -c < ${GEMINI_CLI_EXTENSION_DIR}/GEMINI.md`,
    ).trim();
    expect(parseInt(size, 10)).toBeGreaterThan(100);
  });

  test("versions.json has sdkVersion and extensionVersion", () => {
    const raw = dockerExec(
      `cat ${GEMINI_CLI_EXTENSION_DIR}/versions.json`,
    ).trim();
    const versions = JSON.parse(raw);
    expect(versions.sdkVersion).toBeTruthy();
    expect(typeof versions.sdkVersion).toBe("string");
    expect(versions.extensionVersion).toBeTruthy();
    expect(typeof versions.extensionVersion).toBe("string");
  });

  test("package.json exists in extension directory", () => {
    const raw = dockerExec(
      `cat ${GEMINI_CLI_EXTENSION_DIR}/package.json`,
    ).trim();
    const pkg = JSON.parse(raw);
    expect(pkg.name).toBe("@a5c-ai/babysitter-gemini");
  });
});

describe("Hook scripts (gemini-cli)", () => {
  test("hooks directory exists", () => {
    dockerExec(`test -d ${GEMINI_CLI_EXTENSION_DIR}/hooks`);
  });

  test("hooks.json is valid and declares SessionStart and AfterAgent", () => {
    const raw = dockerExec(
      `cat ${GEMINI_CLI_EXTENSION_DIR}/hooks/hooks.json`,
    ).trim();
    const hooksJson = JSON.parse(raw);
    expect(hooksJson.hooks).toBeDefined();
    expect(hooksJson.hooks.SessionStart).toBeDefined();
    expect(hooksJson.hooks.SessionStart.length).toBeGreaterThan(0);
    expect(hooksJson.hooks.AfterAgent).toBeDefined();
    expect(hooksJson.hooks.AfterAgent.length).toBeGreaterThan(0);
  });

  test("SessionStart hook command references session-start.sh", () => {
    const raw = dockerExec(
      `cat ${GEMINI_CLI_EXTENSION_DIR}/hooks/hooks.json`,
    ).trim();
    const hooksJson = JSON.parse(raw);
    const cmd = hooksJson.hooks.SessionStart[0].hooks[0].command;
    expect(cmd).toContain("session-start.sh");
  });

  test("AfterAgent hook command references after-agent.sh", () => {
    const raw = dockerExec(
      `cat ${GEMINI_CLI_EXTENSION_DIR}/hooks/hooks.json`,
    ).trim();
    const hooksJson = JSON.parse(raw);
    const cmd = hooksJson.hooks.AfterAgent[0].hooks[0].command;
    expect(cmd).toContain("after-agent.sh");
  });

  const HOOK_SCRIPTS = ["session-start.sh", "after-agent.sh"];

  for (const script of HOOK_SCRIPTS) {
    test(`${script} exists and is executable`, () => {
      dockerExec(
        `test -x ${GEMINI_CLI_EXTENSION_DIR}/hooks/${script}`,
      );
    });

    test(`${script} has valid bash syntax`, () => {
      dockerExec(
        `bash -n ${GEMINI_CLI_EXTENSION_DIR}/hooks/${script}`,
      );
    });
  }
});

describe("Commands (gemini-cli)", () => {
  test("commands directory exists with markdown files", () => {
    dockerExec(`test -d ${GEMINI_CLI_EXTENSION_DIR}/commands`);
    const count = dockerExec(
      `ls ${GEMINI_CLI_EXTENSION_DIR}/commands/*.md 2>/dev/null | wc -l`,
    ).trim();
    expect(parseInt(count, 10)).toBeGreaterThan(0);
  });

  test("all command files referenced in plugin.json exist", () => {
    const raw = dockerExec(
      `cat ${GEMINI_CLI_EXTENSION_DIR}/plugin.json`,
    ).trim();
    const pluginJson = JSON.parse(raw);
    for (const cmdPath of pluginJson.commands) {
      const { exitCode } = dockerExecSafe(
        `test -f ${GEMINI_CLI_EXTENSION_DIR}/${cmdPath}`,
      );
      expect(exitCode).toBe(0);
    }
  });

  test("command files have YAML frontmatter with description", () => {
    const files = dockerExec(
      `ls ${GEMINI_CLI_EXTENSION_DIR}/commands/*.md`,
    )
      .trim()
      .split("\n")
      .filter(Boolean);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const head = dockerExec(`head -1 ${file}`).trim();
      expect(head).toBe("---");
      const content = dockerExec(`cat ${file}`);
      expect(content).toContain("description:");
    }
  });
});

describe("CLI entry point (gemini-cli)", () => {
  test("babysitter-gemini CLI is available", () => {
    const { exitCode } = dockerExecSafe("which babysitter-gemini");
    // May or may not be on PATH depending on global install; check in extension bin
    if (exitCode !== 0) {
      dockerExec(
        `test -f ${GEMINI_CLI_EXTENSION_DIR}/bin/cli.js`,
      );
    }
  });

  test("bin/cli.js has valid node syntax", () => {
    dockerExec(
      `node --check ${GEMINI_CLI_EXTENSION_DIR}/bin/cli.js`,
    );
  });

  test("bin/postinstall.js has valid node syntax", () => {
    dockerExec(
      `node --check ${GEMINI_CLI_EXTENSION_DIR}/bin/postinstall.js`,
    );
  });

  test("bin/preuninstall.js has valid node syntax", () => {
    dockerExec(
      `node --check ${GEMINI_CLI_EXTENSION_DIR}/bin/preuninstall.js`,
    );
  });
});

describe("Babysitter SDK integration (gemini-cli)", () => {
  test("babysitter CLI responds to health check", () => {
    const out = dockerExec("babysitter health --json").trim();
    const health = JSON.parse(out);
    expect(health).toBeDefined();
  });

  test("babysitter harness:discover finds gemini-cli adapter", () => {
    // The adapter should be known even if gemini CLI is not installed
    const out = dockerExec("babysitter harness:discover --json").trim();
    const result = JSON.parse(out);
    // The discover output lists known harnesses; gemini-cli should appear
    expect(out).toContain("gemini");
  });

  test("GEMINI_EXTENSION_PATH env var is set correctly", () => {
    const envVal = dockerExec("echo $GEMINI_EXTENSION_PATH").trim();
    expect(envVal).toBe(GEMINI_CLI_EXTENSION_DIR);
  });
});
