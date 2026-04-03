import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildCursorImage,
  CURSOR_PLUGIN_DIR,
  dockerExec,
  startCursorContainer,
  stopCursorContainer,
} from "./helpers-cursor";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

beforeAll(() => {
  buildCursorImage(ROOT);
  startCursorContainer();
}, 300_000); // 5 min for Docker build

afterAll(() => {
  stopCursorContainer();
});

describe("Docker structural tests (cursor)", () => {
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

  test("runs as non-root user cursor", () => {
    const user = dockerExec("whoami").trim();
    expect(user).toBe("cursor");
  });

  test("/workspace directory exists", () => {
    dockerExec("test -d /workspace");
  });
});

describe("Plugin installation (cursor)", () => {
  test("plugin directory exists with plugin.json", () => {
    dockerExec(`test -d ${CURSOR_PLUGIN_DIR}`);
    dockerExec(`test -f ${CURSOR_PLUGIN_DIR}/plugin.json`);
  });

  test("plugin.json has required fields (name, version, description)", () => {
    const raw = dockerExec(`cat ${CURSOR_PLUGIN_DIR}/plugin.json`).trim();
    const pluginJson = JSON.parse(raw);
    expect(pluginJson.name).toBe("babysitter");
    expect(pluginJson.version).toBeTruthy();
    expect(pluginJson.description).toBeTruthy();
  });

  test("hooks-cursor.json has stop and sessionStart hooks", () => {
    const raw = dockerExec(
      `cat ${CURSOR_PLUGIN_DIR}/hooks/hooks-cursor.json`,
    ).trim();
    const hooks = JSON.parse(raw);
    expect(hooks.hooks.stop).toBeDefined();
    expect(hooks.hooks.stop.length).toBeGreaterThan(0);
    expect(hooks.hooks.sessionStart).toBeDefined();
    expect(hooks.hooks.sessionStart.length).toBeGreaterThan(0);
  });

  test("stop hook script exists and is executable", () => {
    dockerExec(`test -f ${CURSOR_PLUGIN_DIR}/hooks/stop-hook.sh`);
    dockerExec(`test -x ${CURSOR_PLUGIN_DIR}/hooks/stop-hook.sh`);
  });

  test("session-start hook script exists and is executable", () => {
    dockerExec(`test -f ${CURSOR_PLUGIN_DIR}/hooks/session-start.sh`);
    dockerExec(`test -x ${CURSOR_PLUGIN_DIR}/hooks/session-start.sh`);
  });

  test("hook scripts have valid bash syntax", () => {
    dockerExec(`bash -n ${CURSOR_PLUGIN_DIR}/hooks/stop-hook.sh`);
    dockerExec(`bash -n ${CURSOR_PLUGIN_DIR}/hooks/session-start.sh`);
  });

  test("versions.json has sdkVersion", () => {
    const raw = dockerExec(
      `cat ${CURSOR_PLUGIN_DIR}/versions.json`,
    ).trim();
    const versions = JSON.parse(raw);
    expect(versions.sdkVersion).toBeTruthy();
  });

  test("all SKILL.md files exist for skills referenced in plugin.json", () => {
    const pluginRaw = dockerExec(
      `cat ${CURSOR_PLUGIN_DIR}/plugin.json`,
    ).trim();
    const pluginJson = JSON.parse(pluginRaw);

    // plugin.json declares skills as a directory path; list subdirs
    const skillsDir = pluginJson.skills
      ? `${CURSOR_PLUGIN_DIR}/${pluginJson.skills}`
      : `${CURSOR_PLUGIN_DIR}/skills/`;

    const skillDirs = dockerExec(
      `ls -d ${skillsDir}*/ 2>/dev/null || true`,
    ).trim();

    if (skillDirs) {
      for (const dir of skillDirs.split("\n").filter(Boolean)) {
        const skillName = dir.replace(/\/$/, "").split("/").pop();
        dockerExec(`test -f ${dir}SKILL.md`);
      }
    }
  });
});
