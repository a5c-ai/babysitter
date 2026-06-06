import { randomUUID } from "crypto";

export enum EffectGroupStatus {
  Created = "created",
  Active = "active",
  Completed = "completed",
  Failed = "failed",
}

export interface GroupMember {
  effectId: string;
  role: "coordinator" | "worker";
}

export interface GroupCheckpoint {
  timestamp: string;
  reason: string;
  resolvedCount: number;
  totalCount: number;
}

export interface EffectGroupEntry {
  groupId: string;
  label: string;
  persistent: boolean;
  status: EffectGroupStatus;
  createdAt: string;
  coordinatorEffectId?: string;
  failureReason?: string;
}

export interface CreateGroupOptions {
  label: string;
  persistent: boolean;
  createdAt: string;
  coordinatorEffectId?: string;
}

export interface MarkFailedOptions {
  reason: string;
  timestamp: string;
  failGroup?: boolean;
}

interface InternalGroupState {
  entry: EffectGroupEntry;
  members: GroupMember[];
  resolved: Set<string>;
  checkpoints: GroupCheckpoint[];
}

/**
 * In-memory registry that tracks effect group lifecycle: creation, membership,
 * resolution progress, checkpoints, and failure.
 */
export class EffectGroupRegistry {
  private readonly groups = new Map<string, InternalGroupState>();

  createGroup(options: CreateGroupOptions): string {
    const groupId = randomUUID();
    const entry: EffectGroupEntry = {
      groupId,
      label: options.label,
      persistent: options.persistent,
      status: EffectGroupStatus.Active,
      createdAt: options.createdAt,
      coordinatorEffectId: options.coordinatorEffectId,
    };

    this.groups.set(groupId, {
      entry,
      members: [],
      resolved: new Set(),
      checkpoints: [],
    });

    return groupId;
  }

  getGroup(groupId: string): EffectGroupEntry | undefined {
    return this.groups.get(groupId)?.entry;
  }

  listGroups(): EffectGroupEntry[] {
    return Array.from(this.groups.values()).map((state) => state.entry);
  }

  addMember(groupId: string, member: GroupMember): void {
    const state = this.groups.get(groupId);
    if (!state) {
      throw new Error(`Effect group ${groupId} not found`);
    }
    if (state.entry.status === EffectGroupStatus.Failed) {
      throw new Error(`Cannot add member to failed group ${groupId}`);
    }

    // Deduplicate by effectId
    if (state.members.some((m) => m.effectId === member.effectId)) {
      return;
    }

    state.members.push({ ...member });
  }

  getMembers(groupId: string): GroupMember[] {
    const state = this.groups.get(groupId);
    if (!state) return [];
    return [...state.members];
  }

  markResolved(groupId: string, effectId: string): void {
    const state = this.groups.get(groupId);
    if (!state) return;

    state.resolved.add(effectId);

    // Check if all members are resolved
    if (state.members.length > 0 && state.resolved.size >= state.members.length) {
      state.entry.status = EffectGroupStatus.Completed;
    }
  }

  getResolvedCount(groupId: string): number {
    const state = this.groups.get(groupId);
    if (!state) return 0;
    return state.resolved.size;
  }

  recordCheckpoint(groupId: string, options: { timestamp: string; reason: string }): void {
    const state = this.groups.get(groupId);
    if (!state) return;

    state.checkpoints.push({
      timestamp: options.timestamp,
      reason: options.reason,
      resolvedCount: state.resolved.size,
      totalCount: state.members.length,
    });
  }

  getCheckpoints(groupId: string): GroupCheckpoint[] {
    const state = this.groups.get(groupId);
    if (!state) return [];
    return [...state.checkpoints];
  }

  markFailed(groupId: string, effectId: string, options: MarkFailedOptions): void {
    const state = this.groups.get(groupId);
    if (!state) return;

    const isCoordinator = state.entry.coordinatorEffectId === effectId;
    const shouldFailGroup = isCoordinator || options.failGroup === true || options.failGroup === undefined;

    if (shouldFailGroup) {
      state.entry.status = EffectGroupStatus.Failed;
      state.entry.failureReason = options.reason;
    }
  }
}
