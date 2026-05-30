import { describe, expect, it } from "vitest";
import {
  autoTask,
  breakpointTask,
  externalAgentTask,
  humanTask,
  nodeTask,
  orchestratorTask,
  sleepTask,
} from "../kinds";
import { TaskBuildContext } from "../types";
import {
  breakpointKindFixtures,
  autoKindFixtures,
  externalAgentKindFixtures,
  nodeKindFixtures,
  orchestratorKindFixtures,
  sleepKindFixtures,
} from "../../test-fixtures/kinds";

describe("task kind helpers", () => {
  describe("nodeTask", () => {
    it("applies defaults, merges labels, and redacts sensitive env values", async () => {
      const helper = nodeTask(nodeKindFixtures.id, {
        entry: "scripts/run-node.js",
        args: (args) => ["--target", (args as typeof nodeKindFixtures.args).target],
        labels: () => nodeKindFixtures.helperLabels,
        metadata: () => nodeKindFixtures.metadata,
        env: () => nodeKindFixtures.env.sample,
        cwd: () => "/repo",
      });
      const ctx = createTestBuildContext({ label: "ctx-node" });
      const def = await helper.build(nodeKindFixtures.args, ctx);

      expect(def.kind).toBe("node");
      expect(def.labels).toEqual(["ctx-node", ...nodeKindFixtures.helperLabels]);
      expect(def.io).toEqual({
        inputJsonPath: `tasks/${ctx.effectId}/inputs.json`,
        outputJsonPath: `tasks/${ctx.effectId}/result.json`,
        stdoutPath: `tasks/${ctx.effectId}/stdout.log`,
        stderrPath: `tasks/${ctx.effectId}/stderr.log`,
      });
      expect(def.node?.timeoutMs).toBe(15 * 60 * 1000);
      expect(def.node?.env).toEqual(nodeKindFixtures.env.expectedSafe);
      expect(def.metadata?.redactedEnvKeys).toEqual(nodeKindFixtures.env.expectedRedacted);
      expect(def.metadata).toMatchObject({ subsystem: "build" });
      expect(def.node?.args).toEqual(["--target", nodeKindFixtures.args.target]);
      expect(def.node?.cwd).toBe("/repo");
    });

    it("allows overrides for timeout and IO hints", async () => {
      const helper = nodeTask("fixtures.node.override", {
        entry: "scripts/custom.js",
        timeoutMs: () => 120000,
        io: (_, ctx) => ({
          stdoutPath: ctx.toTaskRelativePath("custom-stdout.log"),
        }),
      });
      const ctx = createTestBuildContext({ labels: ["ctx-default"] });
      const def = await helper.build({} as Record<string, never>, ctx);

      expect(def.node?.timeoutMs).toBe(120000);
      expect(def.io).toEqual({
        inputJsonPath: `tasks/${ctx.effectId}/inputs.json`,
        outputJsonPath: `tasks/${ctx.effectId}/result.json`,
        stdoutPath: `tasks/${ctx.effectId}/custom-stdout.log`,
        stderrPath: `tasks/${ctx.effectId}/stderr.log`,
      });
      expect(def.labels).toEqual(["ctx-default"]);
    });
  });

  describe("breakpointTask", () => {
    it("defaults labels, forwards payloads, and wires confirmationRequired", async () => {
      const helper = breakpointTask(breakpointKindFixtures.id, {
        metadata: () => breakpointKindFixtures.metadata,
        confirmationRequired: () => true,
      });
      const ctx = createTestBuildContext();
      const def = await helper.build(breakpointKindFixtures.payload, ctx);

      expect(def.kind).toBe("breakpoint");
      expect(def.labels).toEqual(["breakpoint"]);
      expect(def.breakpoint?.payload).toEqual(breakpointKindFixtures.payload);
      expect(def.breakpoint?.confirmationRequired).toBe(true);
      expect(def.metadata).toMatchObject(breakpointKindFixtures.metadata);
    });
  });

  describe("responder routing helpers", () => {
    it("externalAgentTask emits external agent responder metadata", async () => {
      const helper = externalAgentTask(externalAgentKindFixtures.id, {
        adapter: externalAgentKindFixtures.adapter,
        prompt: () => externalAgentKindFixtures.prompt,
        fallbackToInternal: () => externalAgentKindFixtures.fallbackToInternal,
        metadata: () => externalAgentKindFixtures.metadata,
      });
      const ctx = createTestBuildContext({ labels: ["ctx-agent"] });
      const def = await helper.build({}, ctx);

      expect(def.kind).toBe("agent");
      expect(def.labels).toEqual(["ctx-agent"]);
      expect(def.metadata).toMatchObject(externalAgentKindFixtures.metadata);
      expect(def.agent).toMatchObject({
        external: true,
        responderType: "agent",
        adapter: externalAgentKindFixtures.adapter,
        prompt: externalAgentKindFixtures.prompt,
        fallbackType: externalAgentKindFixtures.fallbackType,
        fallbackToInternal: true,
      });
    });

    it("humanTask emits breakpoint responder metadata", async () => {
      const helper = humanTask("fixtures.human.example", {
        payload: () => breakpointKindFixtures.payload,
        targetResponders: () => breakpointKindFixtures.routing.targetResponders,
      });
      const ctx = createTestBuildContext();
      const def = await helper.build({}, ctx);

      expect(def.kind).toBe("breakpoint");
      expect(def.breakpoint).toMatchObject({
        responderType: "human",
        payload: breakpointKindFixtures.payload,
        targetResponders: breakpointKindFixtures.routing.targetResponders,
      });
    });

    it("autoTask emits auto responder metadata for agent tasks", async () => {
      const helper = autoTask(autoKindFixtures.id, {
        prompt: () => autoKindFixtures.prompt,
        fallbackType: () => "internal",
      });
      const ctx = createTestBuildContext();
      const def = await helper.build({}, ctx);

      expect(def.kind).toBe("agent");
      expect(def.agent).toMatchObject({
        responderType: "auto",
        prompt: autoKindFixtures.prompt,
        fallbackType: autoKindFixtures.fallbackType,
      });
    });
  });

  describe("orchestratorTask", () => {
    it("marks orchestrator metadata, applies resume command, and defaults labels", async () => {
      const helper = orchestratorTask(orchestratorKindFixtures.id, {
        metadata: () => orchestratorKindFixtures.metadata,
        payload: () => orchestratorKindFixtures.payload,
        resumeCommand: () => orchestratorKindFixtures.resumeCommand,
      });
      const ctx = createTestBuildContext();
      const def = await helper.build(orchestratorKindFixtures.payload, ctx);

      expect(def.kind).toBe("orchestrator_task");
      expect(def.labels).toEqual(["orchestrator-task"]);
      expect(def.orchestratorTask?.payload).toEqual(orchestratorKindFixtures.payload);
      expect(def.orchestratorTask?.resumeCommand).toBe(orchestratorKindFixtures.resumeCommand);
      expect(def.metadata).toMatchObject({
        ...orchestratorKindFixtures.metadata,
        orchestratorTask: true,
      });
    });
  });

  describe("sleepTask", () => {
    it("emits deterministic metadata, labels, and sleep payloads", async () => {
      const helper = sleepTask();
      const ctx = createTestBuildContext();
      const def = await helper.build(sleepKindFixtures.args, ctx);
      const expectedLabel = `sleep:${sleepKindFixtures.args.iso}`;

      expect(def.kind).toBe("sleep");
      expect(def.sleep).toEqual(sleepKindFixtures.args);
      expect(def.title).toBe(expectedLabel);
      expect(def.labels).toEqual([expectedLabel]);
      expect(def.metadata).toMatchObject({
        iso: sleepKindFixtures.args.iso,
        targetEpochMs: sleepKindFixtures.args.targetEpochMs,
      });
    });
  });
});

function createTestBuildContext(options: Partial<TestContextOptions> = {}): TaskBuildContext {
  const effectId = options.effectId ?? "01TESTEFFECT";
  const runDir = options.runDir ?? "/tmp/run";
  const label = options.label;
  const labels = options.labels ?? (label ? [label] : []);
  return {
    effectId,
    invocationKey: options.invocationKey ?? "proc:step-001",
    taskId: options.taskId ?? "task-fixture",
    runId: options.runId ?? "run-fixture",
    runDir,
    taskDir: `${runDir}/tasks/${effectId}`,
    tasksDir: `${runDir}/tasks`,
    label,
    labels: labels.slice(),
    async createBlobRef(name: string) {
      return `tasks/${effectId}/blobs/${name}`;
    },
    toTaskRelativePath(relativePath: string) {
      return `tasks/${effectId}/${relativePath}`;
    },
  };
}

interface TestContextOptions {
  effectId: string;
  invocationKey: string;
  taskId: string;
  runId: string;
  runDir: string;
  label?: string;
  labels?: string[];
}
