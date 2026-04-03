import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildImage,
  dockerExec,
  dockerExecSafe,
  PLUGIN_DIR,
  startContainer,
  stopContainer,
} from "./helpers-github";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

beforeAll(() => {
  buildImage(ROOT);
  startContainer();
}, 300_000); // 5 min for Docker build

afterAll(() => {
  stopContainer();
});

describe("Docker structural tests (GitHub)", () => {
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

  test("runs as non-root user github", () => {
    const user = dockerExec("whoami").trim();
    expect(user).toBe("github");
  });

  test("HOME is /home/github", () => {
    const home = dockerExec("echo $HOME").trim();
    expect(home).toBe("/home/github");
  });

  test("/workspace directory exists", () => {
    dockerExec("test -d /workspace");
  });
});

describe("Plugin installation (GitHub)", () => {
  test("plugin directory exists", () => {
    dockerExec(`test -d ${PLUGIN_DIR}`);
  });

  test("plugin.json exists with correct fields", () => {
    const raw = dockerExec(`cat ${PLUGIN_DIR}/plugin.json`).trim();
    const pluginJson = JSON.parse(raw);
    expect(pluginJson.name).toBe("babysitter");
    expect(pluginJson.version).toBeTruthy();
    expect(pluginJson.description).toBeTruthy();
    expect(pluginJson.author).toBeDefined();
    expect(pluginJson.skills).toBeTruthy();
    expect(pluginJson.hooks).toBeTruthy();
    expect(pluginJson.commands).toBeTruthy();
  });

  test("AGENTS.md exists in plugin directory", () => {
    dockerExec(`test -f ${PLUGIN_DIR}/AGENTS.md`);
  });

  test("versions.json has sdkVersion", () => {
    const raw = dockerExec(`cat ${PLUGIN_DIR}/versions.json`).trim();
    const versions = JSON.parse(raw);
    expect(versions.sdkVersion).toBeTruthy();
    expect(typeof versions.sdkVersion).toBe("string");
  });

  test("hooks.json registers sessionStart hook", () => {
    const raw = dockerExec(`cat ${PLUGIN_DIR}/hooks.json`).trim();
    const hooksJson = JSON.parse(raw);
    expect(hooksJson.hooks.sessionStart).toBeDefined();
    expect(hooksJson.hooks.sessionStart.length).toBeGreaterThan(0);
    const entry = hooksJson.hooks.sessionStart[0];
    expect(entry.bash).toContain("session-start.sh");
  });

  test("hooks.json registers sessionEnd hook", () => {
    const raw = dockerExec(`cat ${PLUGIN_DIR}/hooks.json`).trim();
    const hooksJson = JSON.parse(raw);
    expect(hooksJson.hooks.sessionEnd).toBeDefined();
    expect(hooksJson.hooks.sessionEnd.length).toBeGreaterThan(0);
    const entry = hooksJson.hooks.sessionEnd[0];
    expect(entry.bash).toContain("session-end.sh");
  });

  test("hooks.json registers userPromptSubmitted hook", () => {
    const raw = dockerExec(`cat ${PLUGIN_DIR}/hooks.json`).trim();
    const hooksJson = JSON.parse(raw);
    expect(hooksJson.hooks.userPromptSubmitted).toBeDefined();
    expect(hooksJson.hooks.userPromptSubmitted.length).toBeGreaterThan(0);
    const entry = hooksJson.hooks.userPromptSubmitted[0];
    expect(entry.bash).toContain("user-prompt-submitted.sh");
  });
});

describe("Hook scripts (GitHub)", () => {
  const HOOK_SCRIPTS = [
    "session-start.sh",
    "session-end.sh",
    "user-prompt-submitted.sh",
  ];

  for (const script of HOOK_SCRIPTS) {
    test(`${script} exists and is executable`, () => {
      dockerExec(`test -x ${PLUGIN_DIR}/hooks/${script}`);
    });

    test(`${script} has valid bash syntax`, () => {
      dockerExec(`bash -n ${PLUGIN_DIR}/hooks/${script}`);
    });
  }
});

describe("Skills (GitHub)", () => {
  test("skills directory exists", () => {
    dockerExec(`test -d ${PLUGIN_DIR}/skills`);
  });

  test("all skill directories contain SKILL.md", () => {
    const dirs = dockerExec(
      `find ${PLUGIN_DIR}/skills -mindepth 1 -maxdepth 1 -type d`,
    )
      .trim()
      .split("\n")
      .filter(Boolean);
    expect(dirs.length).toBeGreaterThan(0);
    for (const dir of dirs) {
      const { exitCode } = dockerExecSafe(`test -f ${dir}/SKILL.md`);
      expect(exitCode).toBe(0);
    }
  });
});

describe("Copilot config (GitHub)", () => {
  test("copilot config.json registers the plugin", () => {
    const raw = dockerExec(
      `cat /home/github/.copilot/config.json`,
    ).trim();
    const config = JSON.parse(raw);
    expect(config.plugins).toBeDefined();
    const pluginEntry = config.plugins.find(
      (p: { path?: string } | string) =>
        (typeof p === "string" ? p : p.path) === PLUGIN_DIR,
    );
    expect(pluginEntry).toBeDefined();
  });

  test("copilot hooks.json exists in home directory", () => {
    dockerExec(`test -f /home/github/.copilot/hooks.json`);
  });

  test("copilot hooks.json has sessionStart entry", () => {
    const raw = dockerExec(
      `cat /home/github/.copilot/hooks.json`,
    ).trim();
    const hooksJson = JSON.parse(raw);
    expect(hooksJson.hooks.sessionStart).toBeDefined();
    expect(hooksJson.hooks.sessionStart.length).toBeGreaterThan(0);
  });
});
