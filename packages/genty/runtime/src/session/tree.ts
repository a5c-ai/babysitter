import { randomUUID } from 'node:crypto';

export interface TreeNode {
  id: string;
  parentId: string | null;
  branchId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  bookmark?: string;
}

export interface SessionTree {
  rootId: string;
  activeBranchId: string;
  activeNodeId: string;
  nodes: Map<string, TreeNode>;
  branches: Map<string, string[]>; // branchId → ordered node IDs
}

export function createSessionTree(): SessionTree {
  const rootId = randomUUID();
  const branchId = 'main';
  const root: TreeNode = {
    id: rootId,
    parentId: null,
    branchId,
    role: 'system',
    content: 'Session started',
    timestamp: new Date().toISOString(),
  };

  const nodes = new Map<string, TreeNode>();
  nodes.set(rootId, root);

  const branches = new Map<string, string[]>();
  branches.set(branchId, [rootId]);

  return { rootId, activeBranchId: branchId, activeNodeId: rootId, nodes, branches };
}

export function addMessage(tree: SessionTree, role: TreeNode['role'], content: string, metadata?: Record<string, unknown>): TreeNode {
  const node: TreeNode = {
    id: randomUUID(),
    parentId: tree.activeNodeId,
    branchId: tree.activeBranchId,
    role,
    content,
    metadata,
    timestamp: new Date().toISOString(),
  };

  tree.nodes.set(node.id, node);
  const branch = tree.branches.get(tree.activeBranchId) ?? [];
  branch.push(node.id);
  tree.branches.set(tree.activeBranchId, branch);
  tree.activeNodeId = node.id;

  return node;
}

export function forkFromNode(tree: SessionTree, nodeId: string): string {
  const node = tree.nodes.get(nodeId);
  if (!node) throw new Error(`Node ${nodeId} not found`);

  const newBranchId = `branch-${randomUUID().slice(0, 8)}`;

  // Copy path from root to this node
  const path = getPathToNode(tree, nodeId);
  tree.branches.set(newBranchId, [...path]);
  tree.activeBranchId = newBranchId;
  tree.activeNodeId = nodeId;

  return newBranchId;
}

export function navigateToNode(tree: SessionTree, nodeId: string): void {
  const node = tree.nodes.get(nodeId);
  if (!node) throw new Error(`Node ${nodeId} not found`);
  tree.activeNodeId = nodeId;
  tree.activeBranchId = node.branchId;
}

export function getPathToNode(tree: SessionTree, nodeId: string): string[] {
  const path: string[] = [];
  let current = nodeId;
  while (current) {
    path.unshift(current);
    const node = tree.nodes.get(current);
    if (!node?.parentId) break;
    current = node.parentId;
  }
  return path;
}

export function getMessages(tree: SessionTree, branchId?: string): TreeNode[] {
  const bid = branchId ?? tree.activeBranchId;
  const nodeIds = tree.branches.get(bid) ?? [];
  return nodeIds.map(id => tree.nodes.get(id)!).filter(Boolean);
}

export function getBranches(tree: SessionTree): string[] {
  return [...tree.branches.keys()];
}

export function bookmarkNode(tree: SessionTree, nodeId: string, label: string): void {
  const node = tree.nodes.get(nodeId);
  if (!node) throw new Error(`Node ${nodeId} not found`);
  node.bookmark = label;
}

export function getBookmarks(tree: SessionTree): TreeNode[] {
  return [...tree.nodes.values()].filter(n => n.bookmark);
}

export function serializeTree(tree: SessionTree): string {
  return JSON.stringify({
    rootId: tree.rootId,
    activeBranchId: tree.activeBranchId,
    activeNodeId: tree.activeNodeId,
    nodes: Object.fromEntries(tree.nodes),
    branches: Object.fromEntries(tree.branches),
  });
}

export function deserializeTree(json: string): SessionTree {
  const data = JSON.parse(json);
  return {
    rootId: data.rootId,
    activeBranchId: data.activeBranchId,
    activeNodeId: data.activeNodeId,
    nodes: new Map(Object.entries(data.nodes)),
    branches: new Map(Object.entries(data.branches)),
  };
}
