import { describe, it, expect, beforeEach } from 'vitest';
import { SessionRewindManager } from './rewind.js';
import { createSessionTree, addMessage } from './tree.js';
import type { SessionTree } from './tree.js';

describe('session/rewind', () => {
  let tree: SessionTree;
  let manager: SessionRewindManager;

  beforeEach(() => {
    tree = createSessionTree();
    manager = new SessionRewindManager();
  });

  // -------------------------------------------------------------------------
  // createRewindPoint
  // -------------------------------------------------------------------------

  describe('createRewindPoint', () => {
    it('creates a rewind point at current position', () => {
      addMessage(tree, 'user', 'Hello');
      const point = manager.createRewindPoint(tree, 'before-experiment');
      expect(point.nodeId).toBe(tree.activeNodeId);
      expect(point.branchId).toBe(tree.activeBranchId);
      expect(point.label).toBe('before-experiment');
      expect(point.timestamp).toBeTruthy();
      expect(point.id).toBeTruthy();
    });

    it('creates a point without label', () => {
      const point = manager.createRewindPoint(tree);
      expect(point.label).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // listRewindPoints
  // -------------------------------------------------------------------------

  describe('listRewindPoints', () => {
    it('returns empty array initially', () => {
      expect(manager.listRewindPoints()).toHaveLength(0);
    });

    it('returns points sorted by most recent first', () => {
      addMessage(tree, 'user', 'Step 1');
      const p1 = manager.createRewindPoint(tree, 'first');
      // Manually adjust timestamp so ordering is deterministic
      (p1 as { timestamp: string }).timestamp = '2026-01-01T00:00:00.000Z';

      addMessage(tree, 'assistant', 'Step 2');
      const p2 = manager.createRewindPoint(tree, 'second');
      (p2 as { timestamp: string }).timestamp = '2026-01-01T00:01:00.000Z';

      const points = manager.listRewindPoints();
      expect(points).toHaveLength(2);
      expect(points[0].label).toBe('second');
      expect(points[1].label).toBe('first');
    });
  });

  // -------------------------------------------------------------------------
  // canRewind
  // -------------------------------------------------------------------------

  describe('canRewind', () => {
    it('returns false when no rewind points exist', () => {
      expect(manager.canRewind()).toBe(false);
    });

    it('returns true when rewind points exist', () => {
      manager.createRewindPoint(tree);
      expect(manager.canRewind()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // rewindTo
  // -------------------------------------------------------------------------

  describe('rewindTo', () => {
    it('forks a new branch from the rewind point', () => {
      addMessage(tree, 'user', 'Question 1');
      const point = manager.createRewindPoint(tree, 'checkpoint');
      addMessage(tree, 'assistant', 'Answer 1');
      addMessage(tree, 'user', 'Question 2');

      const newBranch = manager.rewindTo(tree, point.id);
      expect(newBranch).toMatch(/^branch-/);
      expect(tree.activeNodeId).toBe(point.nodeId);
      expect(tree.activeBranchId).toBe(newBranch);
    });

    it('throws for unknown rewind point', () => {
      expect(() => manager.rewindTo(tree, 'nonexistent')).toThrow('not found');
    });
  });

  // -------------------------------------------------------------------------
  // getRewindPoint
  // -------------------------------------------------------------------------

  describe('getRewindPoint', () => {
    it('returns the point by ID', () => {
      const created = manager.createRewindPoint(tree, 'my-point');
      const fetched = manager.getRewindPoint(created.id);
      expect(fetched).toBeDefined();
      expect(fetched!.label).toBe('my-point');
    });

    it('returns undefined for unknown ID', () => {
      expect(manager.getRewindPoint('nope')).toBeUndefined();
    });
  });
});
