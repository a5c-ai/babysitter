import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildImage,
  dockerExec,
  PLUGIN_DIR,
  startContainer,
  stopContainer,
} from "./helpers";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

beforeAll(() => {
  buildImage(ROOT);
  startContainer();
}, 300_000); // 5 min for Docker build

afterAll(() => {
  stopContainer();
});

describe("Docker structural tests", () => {
  test("babysitter CLI is available and returns a version", () => {
    const version = dockerExec("babysitter --version").trim();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("claude CLI is available", () => {
    const out = dockerExec("claude --version").trim();
    expect(out).toBeTruthy();
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

  test("runs as non-root user claude", () => {
    const user = dockerExec("whoami").trim();
    expect(user).toBe("claude");
  });

  test("HOME is /home/claude", () => {
    const home = dockerExec("echo $HOME").trim();
    expect(home).toBe("/home/claude");
  });

  test("/entrypoint.sh exists and is executable", () => {
    dockerExec("test -x /entrypoint.sh");
  });

  test("/workspace directory exists", () => {
    dockerExec("test -d /workspace");
  });
});

describe("Plugin installation", () => {
  test("plugin directory exists", () => {
    dockerExec(`test -d ${PLUGIN_DIR}`);
  });

  test("plugin.json exists with correct skills", () => {
    const skills = dockerExec(
      `cat ${PLUGIN_DIR}/plugin.json | jq -r '.skills[].name'`,
    ).trim();
    expect(skills).toContain("babysitter");
  });

  test("hooks.json registers Stop hook", () => {
    const cmd = dockerExec(
      `cat ${PLUGIN_DIR}/hooks/hooks.json | jq -r '.hooks.Stop[0].hooks[0].command'`,
    ).trim();
    expect(cmd).toContain("babysitter-stop-hook.sh");
  });

  test("hooks.json registers SessionStart hook", () => {
    const cmd = dockerExec(
      `cat ${PLUGIN_DIR}/hooks/hooks.json | jq -r '.hooks.SessionStart[0].hooks[0].command'`,
    ).trim();
    expect(cmd).toContain("babysitter-session-start-hook.sh");
  });

  test("stop hook script is executable", () => {
    dockerExec(`test -x ${PLUGIN_DIR}/hooks/babysitter-stop-hook.sh`);
  });

  test("session start hook script is executable", () => {
    dockerExec(`test -x ${PLUGIN_DIR}/hooks/babysitter-session-start-hook.sh`);
  });

  test("installed_plugins.json has correct install path", () => {
    const installPath = dockerExec(
      `cat /home/claude/.claude/plugins/installed_plugins.json | jq -r '.plugins["babysitter@a5c.ai"][0].installPath'`,
    ).trim();
    expect(installPath).toBe(PLUGIN_DIR);
  });

  test("settings.json enables babysitter plugin", () => {
    const enabled = dockerExec(
      `cat /home/claude/.claude/settings.json | jq -r '.enabledPlugins["babysitter@a5c.ai"]'`,
    ).trim();
    expect(enabled).toBe("true");
  });

  test("error-codes.sh is sourceable", () => {
    dockerExec(`bash -n ${PLUGIN_DIR}/scripts/error-codes.sh`);
  });
});

describe("Entrypoint validation", () => {
  test("rejects missing API key", () => {
    const result = dockerExec(
      "ANTHROPIC_API_KEY= ANTHROPIC_FOUNDRY_API_KEY= AZURE_OPENAI_API_KEY= bash /entrypoint.sh 2>&1 || true",
    );
    expect(result).toContain(
      "environment variable is required",
    );
  });
});
