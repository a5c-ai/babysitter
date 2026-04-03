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
const TEST_WORKSPACE = "/tmp/test-cloud-agent-repo";
const PACKAGE_ROOT = "/app/plugins/babysitter-github";

beforeAll(() => {
  buildImage(ROOT);
  startContainer();
  // Create a test workspace with a git repo
  dockerExec(`mkdir -p ${TEST_WORKSPACE} && cd ${TEST_WORKSPACE} && git init -q && git config user.name "Test" && git config user.email "test@test.com"`);
}, 300_000);

afterAll(() => {
  stopContainer();
});

describe("Cloud agent install (GitHub)", () => {
  test("--cloud-agent creates .github/babysitter bundle directory", () => {
    dockerExec(
      `node ${PACKAGE_ROOT}/bin/install.js --cloud-agent --workspace ${TEST_WORKSPACE}`,
    );

    // Bundle directory should exist
    dockerExec(`test -d ${TEST_WORKSPACE}/.github/babysitter/github-plugin`);
  });

  test("--cloud-agent creates cloud skill SKILL.md files", () => {
    // Skills should be installed under .github/skills/
    const { exitCode } = dockerExecSafe(
      `test -d ${TEST_WORKSPACE}/.github/skills`,
    );
    expect(exitCode).toBe(0);

    // At least one babysitter-prefixed skill directory should exist
    const skillDirs = dockerExec(
      `find ${TEST_WORKSPACE}/.github/skills -mindepth 1 -maxdepth 1 -type d -name 'babysitter-*'`,
    )
      .trim()
      .split("\n")
      .filter(Boolean);
    expect(skillDirs.length).toBeGreaterThan(0);

    // Each skill directory should have a SKILL.md
    for (const dir of skillDirs) {
      const { exitCode: skillExists } = dockerExecSafe(
        `test -f ${dir}/SKILL.md`,
      );
      expect(skillExists).toBe(0);
    }
  });

  test("--cloud-agent creates AGENTS.md with managed block", () => {
    const content = dockerExec(
      `cat ${TEST_WORKSPACE}/AGENTS.md`,
    ).trim();
    expect(content).toContain("<!-- BEGIN BABYSITTER GITHUB CLOUD AGENT -->");
    expect(content).toContain("<!-- END BABYSITTER GITHUB CLOUD AGENT -->");
    expect(content).toContain("Babysitter");
  });

  test("--cloud-agent creates .github/copilot-instructions.md", () => {
    const { exitCode } = dockerExecSafe(
      `test -f ${TEST_WORKSPACE}/.github/copilot-instructions.md`,
    );
    expect(exitCode).toBe(0);

    const content = dockerExec(
      `cat ${TEST_WORKSPACE}/.github/copilot-instructions.md`,
    ).trim();
    expect(content).toContain("<!-- BEGIN BABYSITTER GITHUB CLOUD AGENT -->");
    expect(content).toContain("Babysitter");
  });

  test("--cloud-agent creates copilot-setup-steps workflow", () => {
    const { exitCode } = dockerExecSafe(
      `test -f ${TEST_WORKSPACE}/.github/workflows/copilot-setup-steps.yml`,
    );
    expect(exitCode).toBe(0);

    const content = dockerExec(
      `cat ${TEST_WORKSPACE}/.github/workflows/copilot-setup-steps.yml`,
    ).trim();
    expect(content).toContain("copilot-setup-steps");
    expect(content).toContain("@a5c-ai/babysitter-sdk");
  });

  test("bundle contains required plugin files", () => {
    const bundleRoot = `${TEST_WORKSPACE}/.github/babysitter/github-plugin`;
    const requiredFiles = [
      "plugin.json",
      "hooks.json",
      "AGENTS.md",
      "versions.json",
    ];

    for (const file of requiredFiles) {
      const { exitCode } = dockerExecSafe(
        `test -f ${bundleRoot}/${file}`,
      );
      expect(exitCode).toBe(0);
    }
  });
});

describe("Cloud agent idempotency (GitHub)", () => {
  test("running --cloud-agent twice does not duplicate managed blocks", () => {
    // Run install a second time
    dockerExec(
      `node ${PACKAGE_ROOT}/bin/install.js --cloud-agent --workspace ${TEST_WORKSPACE}`,
    );

    // AGENTS.md should have exactly one managed block
    const agentsContent = dockerExec(
      `cat ${TEST_WORKSPACE}/AGENTS.md`,
    );
    const startMarkers = (
      agentsContent.match(
        /<!-- BEGIN BABYSITTER GITHUB CLOUD AGENT -->/g,
      ) || []
    ).length;
    const endMarkers = (
      agentsContent.match(
        /<!-- END BABYSITTER GITHUB CLOUD AGENT -->/g,
      ) || []
    ).length;
    expect(startMarkers).toBe(1);
    expect(endMarkers).toBe(1);

    // copilot-instructions.md should also have exactly one managed block
    const instructionsContent = dockerExec(
      `cat ${TEST_WORKSPACE}/.github/copilot-instructions.md`,
    );
    const instrStartMarkers = (
      instructionsContent.match(
        /<!-- BEGIN BABYSITTER GITHUB CLOUD AGENT -->/g,
      ) || []
    ).length;
    const instrEndMarkers = (
      instructionsContent.match(
        /<!-- END BABYSITTER GITHUB CLOUD AGENT -->/g,
      ) || []
    ).length;
    expect(instrStartMarkers).toBe(1);
    expect(instrEndMarkers).toBe(1);
  });

  test("running --cloud-agent twice preserves existing workflow", () => {
    // Workflow should still exist and be valid
    const content = dockerExec(
      `cat ${TEST_WORKSPACE}/.github/workflows/copilot-setup-steps.yml`,
    ).trim();
    expect(content).toContain("copilot-setup-steps");
    expect(content).toContain("@a5c-ai/babysitter-sdk");
  });
});
