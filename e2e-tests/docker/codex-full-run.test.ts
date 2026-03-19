import { afterAll, beforeAll, describe, expect, test } from "vitest";
import path from "path";
import {
  buildCodexImage,
  CODEX_SKILL_DIR,
  dockerExec,
  startCodexContainer,
  stopCodexContainer,
} from "./helpers-codex";

const ROOT = path.resolve(__dirname, "../..");
const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
const describeCodex = hasOpenAiKey ? describe : describe.skip;

beforeAll(() => {
  if (!hasOpenAiKey) return;
  buildCodexImage(ROOT);
  startCodexContainer();
}, 900_000);

afterAll(() => {
  if (!hasOpenAiKey) return;
  stopCodexContainer();
});

describeCodex("Codex Docker E2E", () => {
  test("installs latest Codex and the repo babysitter-codex skill", () => {
    const codexVersion = dockerExec("codex --version").trim();
    const babysitterVersion = dockerExec("babysitter --version").trim();
    const skillManifest = dockerExec(`test -f ${CODEX_SKILL_DIR}/SKILL.md && echo ok`).trim();
    const orchestratePath = dockerExec(`test -f ${CODEX_SKILL_DIR}/.codex/orchestrate.js && echo ok`).trim();

    expect(codexVersion).toBeTruthy();
    expect(babysitterVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(skillManifest).toBe("ok");
    expect(orchestratePath).toBe("ok");
  });

  test("runs a full babysitter orchestration with real Codex, breakpoint yield, and hook logging", () => {
    const result = dockerExec("node /app/e2e-tests/docker/codex-babysitter-full-runner.js", {
      timeout: 900_000,
    });
    const payload = JSON.parse(result);

    expect(payload.ok).toBe(true);
    expect(payload.finalStatus).toBe("completed");
    expect(payload.alphaContents).toBe("alpha-run-ok");
    expect(payload.report.alpha).toBe("alpha-run-ok");
    expect(payload.report.gateApproved).toBe(true);
    expect(payload.report.releaseToken).toBe("ci-release-token");
    expect(payload.output.completed).toBe(true);
    expect(payload.output.gateApproved).toBe(true);
    expect(payload.output.releaseToken).toBe("ci-release-token");
    expect(payload.breakpointTask.output.approved).toBe(true);
    expect(payload.breakpointTask.output.answers.releaseToken).toBe("ci-release-token");
    expect(payload.hookLogEntries).toBeGreaterThan(0);
    expect(payload.taskCount).toBeGreaterThanOrEqual(3);
  }, 900_000);
});
