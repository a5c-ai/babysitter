import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { DispatchContextLabelService } from "../dispatch-context-label-service";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

async function createTempBacklogFile() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-dispatch-context-labels-"));
  tempDirs.push(tempDir);
  return path.join(tempDir, "kanban-backlog.json");
}

function createService(backlogFilePath: string) {
  let nextId = 1;
  return new DispatchContextLabelService({
    backlogFilePath,
    now: () => "2026-04-24T12:00:00.000Z",
    createId: () => `dispatch-context-label-${nextId++}`,
  });
}

describe("DispatchContextLabelService", () => {
  it("returns definitions in deterministic order", async () => {
    const backlogFilePath = await createTempBacklogFile();
    await fs.writeFile(
      backlogFilePath,
      JSON.stringify(
        {
          dispatchContextLabels: [
            {
              id: "dispatch-context-label-c",
              key: "z_last",
              label: "Z Last",
              instruction: "Last",
              order: 2,
              createdAt: "2026-04-24T12:00:00.000Z",
              updatedAt: "2026-04-24T12:00:00.000Z",
            },
            {
              id: "dispatch-context-label-a",
              key: "beta",
              label: "Beta",
              instruction: "Beta",
              order: 1,
              createdAt: "2026-04-24T12:00:00.000Z",
              updatedAt: "2026-04-24T12:00:00.000Z",
            },
            {
              id: "dispatch-context-label-b",
              key: "alpha",
              label: "Alpha",
              instruction: "Alpha",
              order: 1,
              createdAt: "2026-04-24T12:00:00.000Z",
              updatedAt: "2026-04-24T12:00:00.000Z",
            },
          ],
        },
        null,
        2,
      ),
      "utf8",
    );

    const labels = await createService(backlogFilePath).listDispatchContextLabels();

    expect(labels.map((label) => label.id)).toEqual([
      "dispatch-context-label-b",
      "dispatch-context-label-a",
      "dispatch-context-label-c",
    ]);
  });

  it("rejects duplicate normalized keys on create and update", async () => {
    const backlogFilePath = await createTempBacklogFile();
    const service = createService(backlogFilePath);

    await service.createDispatchContextLabel({
      key: "tests_first",
      label: "Tests First",
      instruction: "Write tests first.",
      order: 0,
    });

    await expect(
      service.createDispatchContextLabel({
        key: "tests_first",
        label: "Another Tests First",
        instruction: "Duplicate",
        order: 1,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT", status: 409 });

    const second = await service.createDispatchContextLabel({
      key: "preserve_release_contract",
      label: "Preserve Release Contract",
      instruction: "Keep release checks green.",
      order: 1,
    });

    await expect(
      service.updateDispatchContextLabel(second.dispatchContextLabel.id, {
        key: "tests_first",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT", status: 409 });
  });

  it("rejects invalid keys that are not snake_case", async () => {
    const backlogFilePath = await createTempBacklogFile();
    const service = createService(backlogFilePath);

    await expect(
      service.createDispatchContextLabel({
        key: "Tests First",
        label: "Tests First",
        instruction: "Write tests first.",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
  });

  it("persists round-trip CRUD behavior", async () => {
    const backlogFilePath = await createTempBacklogFile();
    const service = createService(backlogFilePath);

    const created = await service.createDispatchContextLabel({
      key: "preserve_release_contract",
      label: "Preserve Release Contract",
      instruction: "Keep files, verify:release, and publish surfaces compatible.",
      description: "Release guardrail",
      order: 2,
    });

    expect(created.dispatchContextLabel).toMatchObject({
      id: "dispatch-context-label-1",
      key: "preserve_release_contract",
      label: "Preserve Release Contract",
      instruction: "Keep files, verify:release, and publish surfaces compatible.",
      description: "Release guardrail",
      order: 2,
    });

    const updated = await service.updateDispatchContextLabel(
      created.dispatchContextLabel.id,
      {
        label: "Ship Contract",
        instruction: "Keep publish surfaces and release checks green.",
        order: 0,
      },
    );

    expect(updated.dispatchContextLabel).toMatchObject({
      id: created.dispatchContextLabel.id,
      key: "preserve_release_contract",
      label: "Ship Contract",
      instruction: "Keep publish surfaces and release checks green.",
      order: 0,
    });

    const listed = await service.listDispatchContextLabels();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(created.dispatchContextLabel.id);

    await service.deleteDispatchContextLabel(created.dispatchContextLabel.id);
    await expect(
      service.deleteDispatchContextLabel(created.dispatchContextLabel.id),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });

    expect(await service.listDispatchContextLabels()).toEqual([]);

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      dispatchContextLabels: unknown[];
    };
    expect(persisted.dispatchContextLabels).toEqual([]);
  });

  it("removes deleted definition refs from stored issues", async () => {
    const backlogFilePath = await createTempBacklogFile();
    await fs.writeFile(
      backlogFilePath,
      JSON.stringify(
        {
          dispatchContextLabels: [
            {
              id: "dispatch-context-label-1",
              key: "tests_first",
              label: "Tests First",
              instruction: "Write tests first.",
              order: 0,
              createdAt: "2026-04-24T12:00:00.000Z",
              updatedAt: "2026-04-24T12:00:00.000Z",
            },
            {
              id: "dispatch-context-label-2",
              key: "ui_copy_review",
              label: "UI Copy Review",
              instruction: "Review visible copy.",
              instruction: "Review visible copy.",
              order: 1,
              createdAt: "2026-04-24T12:00:00.000Z",
              updatedAt: "2026-04-24T12:00:00.000Z",
            },
          ],
          issues: [
            {
              id: "issue-1",
              key: "KANBAN-AUTO-001",
              projectId: "kanban-app",
              title: "Keep refs in sync",
              title: "Keep refs in sync",
              status: "ready",
              priority: "medium",
              labels: [],
              assignees: [],
              dependencies: [],
              acceptanceCriteria: [],
              decomposition: [],
              childIssueIds: [],
              createdAt: "2026-04-24T12:00:00.000Z",
              updatedAt: "2026-04-24T12:00:00.000Z",
              dispatch: {
                readiness: "ready",
                blockedReasons: [],
                runIds: [],
                sessionIds: [],
                contextLabels: [
                  { labelId: "dispatch-context-label-1" },
                  { labelId: "dispatch-context-label-2" },
                ],
              },
            },
          ],
        },
        null,
        2,
      ),
      "utf8",
    );

    const service = createService(backlogFilePath);
    await service.deleteDispatchContextLabel("dispatch-context-label-1");

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      issues: Array<{ dispatch?: { contextLabels?: Array<{ labelId: string }> } }>;
    };
    expect(persisted.issues[0]?.dispatch?.contextLabels).toEqual([
      { labelId: "dispatch-context-label-2" },
    ]);
  });
});
