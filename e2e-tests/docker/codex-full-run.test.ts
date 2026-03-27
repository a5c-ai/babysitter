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
    const repoLocalSkillTemplate = dockerExec(`test -f ${CODEX_SKILL_DIR}/.codex/skills/babysit/SKILL.md && echo ok`).trim();
    const stopHook = dockerExec(`test -f ${CODEX_SKILL_DIR}/.codex/hooks/babysitter-stop-hook.sh && echo ok`).trim();
    const callPrompt = dockerExec("test -f /home/codex/.codex/prompts/call.md && echo ok").trim();
    const planPrompt = dockerExec("test -f /home/codex/.codex/prompts/plan.md && echo ok").trim();
    const resumePrompt = dockerExec("test -f /home/codex/.codex/prompts/resume.md && echo ok").trim();

    expect(codexVersion).toBeTruthy();
    expect(babysitterVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(skillManifest).toBe("ok");
    expect(repoLocalSkillTemplate).toBe("ok");
    expect(stopHook).toBe("ok");
    expect(callPrompt).toBe("ok");
    expect(planPrompt).toBe("ok");
    expect(resumePrompt).toBe("ok");
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
