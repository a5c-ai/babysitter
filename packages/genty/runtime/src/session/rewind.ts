/**
 * GAP-STATE-006: Session Rewind and History.
 *
 * Provides a rewind point manager that works with the SessionTree
 * to create, list, and navigate to rewind points in the conversation.
 */

import { randomUUID } from 'node:crypto';
import type { SessionTree } from './tree.js';
import { navigateToNode, forkFromNode } from './tree.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RewindPoint {
  /** Unique rewind point identifier. */
  id: string;
  /** The tree node at this rewind point. */
  nodeId: string;
  /** The branch ID at this rewind point. */
  branchId: string;
  /** ISO timestamp when the rewind point was created. */
  timestamp: string;
  /** Optional label for the rewind point. */
  label?: string;
}

// ---------------------------------------------------------------------------
// SessionRewindManager
// ---------------------------------------------------------------------------

export class SessionRewindManager {
  private rewindPoints: Map<string, RewindPoint> = new Map();

  /**
   * Create a new rewind point at the current position in the tree.
   */
  createRewindPoint(tree: SessionTree, label?: string): RewindPoint {
    const point: RewindPoint = {
      id: randomUUID(),
      nodeId: tree.activeNodeId,
      branchId: tree.activeBranchId,
      timestamp: new Date().toISOString(),
      label,
    };

    this.rewindPoints.set(point.id, point);
    return point;
  }

  /**
   * List all rewind points, sorted by creation time (most recent first).
   */
  listRewindPoints(): RewindPoint[] {
    return [...this.rewindPoints.values()].sort(
      (a, b) => b.timestamp.localeCompare(a.timestamp),
    );
  }

  /**
   * Rewind to a specific point by navigating the tree to that node
   * and forking a new branch from it.
   * Returns the new branch ID.
   */
  rewindTo(tree: SessionTree, pointId: string): string {
    const point = this.rewindPoints.get(pointId);
    if (!point) {
      throw new Error(`Rewind point "${pointId}" not found`);
    }

    // Verify the node still exists
    if (!tree.nodes.has(point.nodeId)) {
      throw new Error(`Node "${point.nodeId}" no longer exists in the tree`);
    }

    // Fork from that node to create a new branch
    const newBranchId = forkFromNode(tree, point.nodeId);
    return newBranchId;
  }

  /**
   * Check whether there are any rewind points available.
   */
  canRewind(): boolean {
    return this.rewindPoints.size > 0;
  }

  /**
   * Get a rewind point by ID.
   */
  getRewindPoint(pointId: string): RewindPoint | undefined {
    return this.rewindPoints.get(pointId);
  }
}
