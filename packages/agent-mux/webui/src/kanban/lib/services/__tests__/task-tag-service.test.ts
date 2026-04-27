import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { TaskTagService } from "../task-tag-service";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

async function createTempBacklogFile() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-task-tags-"));
  tempDirs.push(tempDir);
  return path.join(tempDir, "kanban-backlog.json");
}

function createService(backlogFilePath: string) {
  let nextId = 1;
  return new TaskTagService({
    backlogFilePath,
    now: () => "2026-04-24T12:00:00.000Z",
    createId: () => `task-tag-${nextId++}`,
  });
}

describe("TaskTagService", () => {
  it("returns task tags in deterministic order", async () => {
    const backlogFilePath = await createTempBacklogFile();
    await fs.writeFile(
      backlogFilePath,
      JSON.stringify(
        {
          taskTags: [
            {
              id: "task-tag-c",
              key: "z_last",
              label: "Z Last",
              content: "Last",
              order: 2,
              createdAt: "2026-04-24T12:00:00.000Z",
              updatedAt: "2026-04-24T12:00:00.000Z",
            },
            {
              id: "task-tag-a",
              key: "beta",
              label: "Beta",
              content: "Beta",
              order: 1,
              createdAt: "2026-04-24T12:00:00.000Z",
              updatedAt: "2026-04-24T12:00:00.000Z",
            },
            {
              id: "task-tag-b",
              key: "alpha",
              label: "Alpha",
              content: "Alpha",
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

    const taskTags = await createService(backlogFilePath).listTaskTags();

    expect(taskTags.map((taskTag) => taskTag.id)).toEqual(["task-tag-b", "task-tag-a", "task-tag-c"]);
  });

  it("rejects duplicate normalized keys on create and update", async () => {
    const backlogFilePath = await createTempBacklogFile();
    const service = createService(backlogFilePath);

    await service.createTaskTag({
      key: "bug_report",
      label: "Bug Report",
      content: "Describe the bug",
      order: 0,
    });

    await expect(
      service.createTaskTag({
        key: "bug_report",
        label: "Another Bug Report",
        content: "Duplicate",
        order: 1,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT", status: 409 });

    const second = await service.createTaskTag({
      key: "feature_request",
      label: "Feature Request",
      content: "Describe the feature",
      order: 1,
    });

    await expect(
      service.updateTaskTag(second.taskTag.id, {
        key: "bug_report",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT", status: 409 });
  });

  it("rejects invalid keys that are not snake_case", async () => {
    const backlogFilePath = await createTempBacklogFile();
    const service = createService(backlogFilePath);

    await expect(
      service.createTaskTag({
        key: "Bug Report",
        label: "Bug Report",
        content: "Describe the bug",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST", status: 400 });
  });

  it("persists round-trip CRUD behavior", async () => {
    const backlogFilePath = await createTempBacklogFile();
    const service = createService(backlogFilePath);

    const created = await service.createTaskTag({
      key: "deployment_validation",
      label: "Deployment Validation",
      content: "Run the deployment checklist",
      description: "Release guardrail",
      order: 2,
    });

    expect(created.taskTag).toMatchObject({
      id: "task-tag-1",
      key: "deployment_validation",
      label: "Deployment Validation",
      content: "Run the deployment checklist",
      description: "Release guardrail",
      order: 2,
    });

    const updated = await service.updateTaskTag(created.taskTag.id, {
      label: "Ship Validation",
      content: "Verify release, smoke test, and rollback plan",
      order: 0,
    });

    expect(updated.taskTag).toMatchObject({
      id: created.taskTag.id,
      key: "deployment_validation",
      label: "Ship Validation",
      content: "Verify release, smoke test, and rollback plan",
      order: 0,
    });

    const listed = await service.listTaskTags();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(created.taskTag.id);

    await service.deleteTaskTag(created.taskTag.id);
    await expect(service.deleteTaskTag(created.taskTag.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });

    expect(await service.listTaskTags()).toEqual([]);

    const persisted = JSON.parse(await fs.readFile(backlogFilePath, "utf8")) as {
      taskTags: unknown[];
    };
    expect(persisted.taskTags).toEqual([]);
  });
});
