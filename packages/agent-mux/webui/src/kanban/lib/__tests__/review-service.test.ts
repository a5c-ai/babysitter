import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ReviewService } from "../review-service";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("ReviewService", () => {
  it("seeds issue and workspace review artifacts when no file exists", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-review-"));
    tempDirs.push(tempDir);

    const service = new ReviewService({
      reviewFilePath: path.join(tempDir, "review-artifacts.json"),
      cwd: () => "/repo/worktrees/kanban-gap-004",
    });

    const snapshot = await service.listReviews();

    expect(snapshot.summary.total).toBe(2);
    expect(snapshot.summary.issueCount).toBe(1);
    expect(snapshot.summary.workspaceCount).toBe(1);
    expect(snapshot.artifacts.find((artifact) => artifact.targetType === "workspace")?.targetId).toBe(
      "/repo/worktrees/kanban-gap-004",
    );
  });

  it("persists inline review comments and updates queue state", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-review-"));
    tempDirs.push(tempDir);
    const reviewFilePath = path.join(tempDir, "review-artifacts.json");

    const service = new ReviewService({
      reviewFilePath,
      now: () => "2026-04-24T12:30:00.000Z",
      cwd: () => "/repo/worktrees/kanban-gap-004",
    });

    const initial = await service.listReviews({ targetType: "issue" });
    const artifact = initial.artifacts[0];
    expect(artifact).toBeTruthy();

    const updated = await service.applyAction({
      action: "add-comment",
      artifactId: artifact!.id,
      body: "Please tighten the queue state copy in the issue review panel.",
      anchor: {
        fileId: artifact!.diff[0]!.id,
        filePath: artifact!.diff[0]!.path,
        hunkId: artifact!.diff[0]!.hunks[0]!.id,
        side: "head",
        line: artifact!.diff[0]!.hunks[0]!.lines[1]!.newLineNumber ?? 25,
      },
    });

    expect(updated.summary.openCommentCount).toBeGreaterThan(0);
    expect(updated.artifacts.find((candidate) => candidate.id === artifact!.id)?.comments.length).toBe(2);

    const persisted = JSON.parse(await fs.readFile(reviewFilePath, "utf8")) as {
      artifacts: Array<{ id: string; comments: unknown[] }>;
    };
    expect(persisted.artifacts.find((candidate) => candidate.id === artifact!.id)?.comments).toHaveLength(2);
  });

  it("creates and links PR lifecycle state on workspace review artifacts", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "kanban-review-"));
    tempDirs.push(tempDir);
    const reviewFilePath = path.join(tempDir, "review-artifacts.json");

    const service = new ReviewService({
      reviewFilePath,
      now: () => "2026-04-25T10:00:00.000Z",
      cwd: () => "/repo/worktrees/vk-parity-09",
    });

    const seeded = await service.listReviews({ targetType: "workspace" });
    const artifact = seeded.artifacts[0];
    expect(artifact).toBeTruthy();

    const created = await service.applyAction({
      action: "create-pull-request",
      artifactId: artifact!.id,
      title: "Add PR lifecycle parity to the workspace sidebar",
      reviewers: "kanban-maintainers, qa",
      branchName: "vk/parity-09",
      baseBranch: "main",
    });

    const createdArtifact = created.artifacts.find((candidate) => candidate.id === artifact!.id);
    expect(createdArtifact?.linkedPullRequest?.title).toBe("Add PR lifecycle parity to the workspace sidebar");
    expect(createdArtifact?.linkedPullRequest?.reviewStatus).toBe("pending");
    expect(createdArtifact?.linkedPullRequest?.ciGates).toHaveLength(2);

    const linked = await service.applyAction({
      action: "link-pull-request",
      artifactId: artifact!.id,
      number: 712,
      title: "VK-PARITY-09 workspace lifecycle follow-up",
      branchName: "vk/parity-09",
      baseBranch: "main",
    });

    const linkedArtifact = linked.artifacts.find((candidate) => candidate.id === artifact!.id);
    expect(linkedArtifact?.linkedPullRequest?.number).toBe(712);
    expect(linkedArtifact?.linkedPullRequest?.mergeStatus).toBe("blocked");
    expect(linkedArtifact?.linkedPullRequest?.publishStatus).toBe("not-ready");
  });
});
