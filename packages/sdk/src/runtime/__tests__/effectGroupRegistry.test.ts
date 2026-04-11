import { describe, expect, it, beforeEach } from "vitest";
import {
  EffectGroupRegistry,
  EffectGroupStatus,
  type EffectGroupEntry,
} from "../effectGroupRegistry";

describe("EffectGroupRegistry", () => {
  let registry: EffectGroupRegistry;

  beforeEach(() => {
    registry = new EffectGroupRegistry();
  });

  describe("group creation tracking", () => {
    it("creates a group with initial metadata", () => {
      const groupId = registry.createGroup({
        label: "build-tasks",
        persistent: false,
        createdAt: "2026-04-09T10:00:00Z",
      });

      expect(groupId).toBeDefined();
      expect(typeof groupId).toBe("string");

      const entry = registry.getGroup(groupId);
      expect(entry).toBeDefined();
      expect(entry!.label).toBe("build-tasks");
      expect(entry!.persistent).toBe(false);
      expect(entry!.status).toBe(EffectGroupStatus.Active);
      expect(entry!.createdAt).toBe("2026-04-09T10:00:00Z");
    });

    it("creates persistent groups with coordinator tracking", () => {
      const groupId = registry.createGroup({
        label: "persistent-group",
        persistent: true,
        coordinatorEffectId: "eff-001",
        createdAt: "2026-04-09T10:00:00Z",
      });

      const entry = registry.getGroup(groupId);
      expect(entry!.persistent).toBe(true);
      expect(entry!.coordinatorEffectId).toBe("eff-001");
    });

    it("returns undefined for non-existent group", () => {
      const entry = registry.getGroup("nonexistent-group-id");
      expect(entry).toBeUndefined();
    });

    it("lists all created groups", () => {
      registry.createGroup({ label: "g1", persistent: false, createdAt: "2026-04-09T10:00:00Z" });
      registry.createGroup({ label: "g2", persistent: true, createdAt: "2026-04-09T10:01:00Z" });
      registry.createGroup({ label: "g3", persistent: false, createdAt: "2026-04-09T10:02:00Z" });

      const groups = registry.listGroups();
      expect(groups).toHaveLength(3);
      expect(groups.map((g) => g.label)).toEqual(expect.arrayContaining(["g1", "g2", "g3"]));
    });
  });

  describe("group member effect tracking", () => {
    it("tracks member effects added to a group", () => {
      const groupId = registry.createGroup({
        label: "member-test",
        persistent: false,
        createdAt: "2026-04-09T10:00:00Z",
      });

      registry.addMember(groupId, { effectId: "eff-A", role: "worker" });
      registry.addMember(groupId, { effectId: "eff-B", role: "worker" });
      registry.addMember(groupId, { effectId: "eff-C", role: "coordinator" });

      const members = registry.getMembers(groupId);
      expect(members).toHaveLength(3);
      expect(members.map((m) => m.effectId)).toEqual(["eff-A", "eff-B", "eff-C"]);
    });

    it("tracks resolved member count", () => {
      const groupId = registry.createGroup({
        label: "resolve-test",
        persistent: false,
        createdAt: "2026-04-09T10:00:00Z",
      });

      registry.addMember(groupId, { effectId: "eff-1", role: "worker" });
      registry.addMember(groupId, { effectId: "eff-2", role: "worker" });
      registry.addMember(groupId, { effectId: "eff-3", role: "worker" });

      expect(registry.getResolvedCount(groupId)).toBe(0);

      registry.markResolved(groupId, "eff-1");
      expect(registry.getResolvedCount(groupId)).toBe(1);

      registry.markResolved(groupId, "eff-2");
      expect(registry.getResolvedCount(groupId)).toBe(2);
    });

    it("marks group as completed when all members resolve", () => {
      const groupId = registry.createGroup({
        label: "complete-test",
        persistent: false,
        createdAt: "2026-04-09T10:00:00Z",
      });

      registry.addMember(groupId, { effectId: "eff-X", role: "worker" });
      registry.addMember(groupId, { effectId: "eff-Y", role: "worker" });

      registry.markResolved(groupId, "eff-X");
      expect(registry.getGroup(groupId)!.status).toBe(EffectGroupStatus.Active);

      registry.markResolved(groupId, "eff-Y");
      expect(registry.getGroup(groupId)!.status).toBe(EffectGroupStatus.Completed);
    });

    it("throws when adding member to non-existent group", () => {
      expect(() =>
        registry.addMember("ghost-group", { effectId: "eff-1", role: "worker" })
      ).toThrow();
    });

    it("deduplicates member additions by effectId", () => {
      const groupId = registry.createGroup({
        label: "dedup-members",
        persistent: false,
        createdAt: "2026-04-09T10:00:00Z",
      });

      registry.addMember(groupId, { effectId: "eff-dup", role: "worker" });
      registry.addMember(groupId, { effectId: "eff-dup", role: "worker" });

      const members = registry.getMembers(groupId);
      expect(members).toHaveLength(1);
    });
  });

  describe("checkpoint history", () => {
    it("records checkpoint with timestamp and resolved snapshot", () => {
      const groupId = registry.createGroup({
        label: "checkpoint-test",
        persistent: true,
        createdAt: "2026-04-09T10:00:00Z",
      });

      registry.addMember(groupId, { effectId: "eff-1", role: "worker" });
      registry.addMember(groupId, { effectId: "eff-2", role: "worker" });
      registry.markResolved(groupId, "eff-1");

      registry.recordCheckpoint(groupId, {
        timestamp: "2026-04-09T10:05:00Z",
        reason: "iteration-boundary",
      });

      const checkpoints = registry.getCheckpoints(groupId);
      expect(checkpoints).toHaveLength(1);
      expect(checkpoints[0].timestamp).toBe("2026-04-09T10:05:00Z");
      expect(checkpoints[0].reason).toBe("iteration-boundary");
      expect(checkpoints[0].resolvedCount).toBe(1);
      expect(checkpoints[0].totalCount).toBe(2);
    });

    it("accumulates multiple checkpoints over time", () => {
      const groupId = registry.createGroup({
        label: "multi-checkpoint",
        persistent: true,
        createdAt: "2026-04-09T10:00:00Z",
      });

      registry.addMember(groupId, { effectId: "eff-a", role: "worker" });

      registry.recordCheckpoint(groupId, {
        timestamp: "2026-04-09T10:01:00Z",
        reason: "first",
      });
      registry.recordCheckpoint(groupId, {
        timestamp: "2026-04-09T10:02:00Z",
        reason: "second",
      });
      registry.recordCheckpoint(groupId, {
        timestamp: "2026-04-09T10:03:00Z",
        reason: "third",
      });

      const checkpoints = registry.getCheckpoints(groupId);
      expect(checkpoints).toHaveLength(3);
      expect(checkpoints.map((c) => c.reason)).toEqual(["first", "second", "third"]);
    });

    it("returns empty array for group with no checkpoints", () => {
      const groupId = registry.createGroup({
        label: "no-checkpoints",
        persistent: false,
        createdAt: "2026-04-09T10:00:00Z",
      });

      const checkpoints = registry.getCheckpoints(groupId);
      expect(checkpoints).toEqual([]);
    });
  });

  describe("coordinator failure", () => {
    it("marks group as failed when coordinator fails", () => {
      const groupId = registry.createGroup({
        label: "coord-fail-test",
        persistent: true,
        coordinatorEffectId: "coord-1",
        createdAt: "2026-04-09T10:00:00Z",
      });

      registry.addMember(groupId, { effectId: "coord-1", role: "coordinator" });
      registry.addMember(groupId, { effectId: "worker-1", role: "worker" });
      registry.addMember(groupId, { effectId: "worker-2", role: "worker" });

      registry.markFailed(groupId, "coord-1", {
        reason: "harness crash",
        timestamp: "2026-04-09T10:10:00Z",
      });

      const entry = registry.getGroup(groupId);
      expect(entry!.status).toBe(EffectGroupStatus.Failed);
      expect(entry!.failureReason).toBe("harness crash");
    });

    it("marks group as failed when any member fails with failGroup option", () => {
      const groupId = registry.createGroup({
        label: "worker-fail-test",
        persistent: false,
        createdAt: "2026-04-09T10:00:00Z",
      });

      registry.addMember(groupId, { effectId: "w1", role: "worker" });
      registry.addMember(groupId, { effectId: "w2", role: "worker" });

      registry.markFailed(groupId, "w2", {
        reason: "task error",
        timestamp: "2026-04-09T10:10:00Z",
        failGroup: true,
      });

      const entry = registry.getGroup(groupId);
      expect(entry!.status).toBe(EffectGroupStatus.Failed);
    });

    it("does not mark group as failed when non-coordinator worker fails without failGroup", () => {
      const groupId = registry.createGroup({
        label: "worker-nofail-test",
        persistent: true,
        coordinatorEffectId: "coord-1",
        createdAt: "2026-04-09T10:00:00Z",
      });

      registry.addMember(groupId, { effectId: "coord-1", role: "coordinator" });
      registry.addMember(groupId, { effectId: "w1", role: "worker" });

      registry.markFailed(groupId, "w1", {
        reason: "worker error",
        timestamp: "2026-04-09T10:10:00Z",
        failGroup: false,
      });

      const entry = registry.getGroup(groupId);
      // Worker failure without failGroup should not mark group as failed
      expect(entry!.status).not.toBe(EffectGroupStatus.Failed);
    });

    it("prevents further operations on a failed group", () => {
      const groupId = registry.createGroup({
        label: "post-fail-test",
        persistent: true,
        coordinatorEffectId: "coord-1",
        createdAt: "2026-04-09T10:00:00Z",
      });

      registry.addMember(groupId, { effectId: "coord-1", role: "coordinator" });

      registry.markFailed(groupId, "coord-1", {
        reason: "fatal",
        timestamp: "2026-04-09T10:10:00Z",
      });

      // Adding members to a failed group should throw
      expect(() =>
        registry.addMember(groupId, { effectId: "late-worker", role: "worker" })
      ).toThrow();
    });
  });
});
