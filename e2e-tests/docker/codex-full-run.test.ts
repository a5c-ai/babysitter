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
const hasCodexProviderCreds = Boolean(
  process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_PROJECT_NAME,
);
const describeCodex = hasCodexProviderCreds ? describe : describe.skip;

beforeAll(() => {
  if (!hasCodexProviderCreds) return;
  buildCodexImage(ROOT);
  startCodexContainer();
}, 900_000);

afterAll(() => {
  if (!hasCodexProviderCreds) return;
  stopCodexContainer();
});

describeCodex("Codex Docker E2E", () => {
  test("installs latest Codex and the repo babysitter-codex skill", () => {
    const codexVersion = dockerExec("codex --version").trim();
    const babysitterVersion = dockerExec("babysitter --version").trim();
    const skillManifest = dockerExec(`test -f ${CODEX_SKILL_DIR}/SKILL.md && echo ok`).trim();
    const globalStopHook = dockerExec("test -f /home/codex/.codex/hooks/babysitter-stop-hook.sh && echo ok").trim();
    const globalHooksConfig = dockerExec("test -f /home/codex/.codex/hooks.json && echo ok").trim();
    const callSkill = dockerExec("test -f /home/codex/.codex/skills/call/SKILL.md && echo ok").trim();
    const planSkill = dockerExec("test -f /home/codex/.codex/skills/plan/SKILL.md && echo ok").trim();
    const resumeSkill = dockerExec("test -f /home/codex/.codex/skills/resume/SKILL.md && echo ok").trim();
    const callPromptRemoved = dockerExec("if [ ! -f /home/codex/.codex/prompts/call.md ]; then echo ok; fi").trim();
    const planPromptRemoved = dockerExec("if [ ! -f /home/codex/.codex/prompts/plan.md ]; then echo ok; fi").trim();
    const resumePromptRemoved = dockerExec("if [ ! -f /home/codex/.codex/prompts/resume.md ]; then echo ok; fi").trim();

    expect(codexVersion).toBeTruthy();
    expect(babysitterVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(skillManifest).toBe("ok");
    expect(globalStopHook).toBe("ok");
    expect(globalHooksConfig).toBe("ok");
    expect(callSkill).toBe("ok");
    expect(planSkill).toBe("ok");
    expect(resumeSkill).toBe("ok");
    expect(callPromptRemoved).toBe("ok");
    expect(planPromptRemoved).toBe("ok");
    expect(resumePromptRemoved).toBe("ok");
  });

  test("runs a full babysitter orchestration with real Codex through the hook model", () => {
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
    expect(payload.hookModel).toBe("codex-hooks");
    expect(payload.lastHookDecision).toBe("approve");
    expect(payload.taskCount).toBeGreaterThanOrEqual(3);
  }, 900_000);
});
