import { describe, it, expect } from 'vitest';
import { createSessionTree, addMessage, forkFromNode, navigateToNode, getMessages, getBranches, bookmarkNode, getBookmarks, serializeTree, deserializeTree, getPathToNode } from './tree.js';

describe('session/tree', () => {
  it('creates a tree with a root node', () => {
    const tree = createSessionTree();
    expect(tree.rootId).toBeTruthy();
    expect(tree.activeBranchId).toBe('main');
    expect(tree.nodes.size).toBe(1);
  });

  it('adds messages to the active branch', () => {
    const tree = createSessionTree();
    addMessage(tree, 'user', 'Hello');
    addMessage(tree, 'assistant', 'Hi there');
    const messages = getMessages(tree);
    expect(messages).toHaveLength(3); // root + 2
    expect(messages[1].role).toBe('user');
    expect(messages[2].content).toBe('Hi there');
  });

  it('forks from a node creating a new branch', () => {
    const tree = createSessionTree();
    const m1 = addMessage(tree, 'user', 'First question');
    addMessage(tree, 'assistant', 'First answer');

    const newBranch = forkFromNode(tree, m1.id);
    expect(newBranch).toMatch(/^branch-/);
    expect(tree.activeBranchId).toBe(newBranch);
    expect(getBranches(tree)).toHaveLength(2);

    addMessage(tree, 'user', 'Different question');
    const branchMessages = getMessages(tree, newBranch);
    expect(branchMessages[branchMessages.length - 1].content).toBe('Different question');
  });

  it('navigates to a specific node', () => {
    const tree = createSessionTree();
    const m1 = addMessage(tree, 'user', 'Q1');
    addMessage(tree, 'assistant', 'A1');
    navigateToNode(tree, m1.id);
    expect(tree.activeNodeId).toBe(m1.id);
  });

  it('gets path from root to a node', () => {
    const tree = createSessionTree();
    addMessage(tree, 'user', 'Step 1');
    const m2 = addMessage(tree, 'assistant', 'Step 2');
    const path = getPathToNode(tree, m2.id);
    expect(path).toHaveLength(3); // root → user → assistant
    expect(path[0]).toBe(tree.rootId);
    expect(path[path.length - 1]).toBe(m2.id);
  });

  it('bookmarks a node', () => {
    const tree = createSessionTree();
    const m1 = addMessage(tree, 'user', 'Important question');
    bookmarkNode(tree, m1.id, 'key-decision');
    const bookmarks = getBookmarks(tree);
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].bookmark).toBe('key-decision');
  });

  it('serializes and deserializes a tree', () => {
    const tree = createSessionTree();
    addMessage(tree, 'user', 'Hello');
    addMessage(tree, 'assistant', 'World');

    const json = serializeTree(tree);
    const restored = deserializeTree(json);
    expect(restored.nodes.size).toBe(tree.nodes.size);
    expect(restored.activeBranchId).toBe(tree.activeBranchId);
    expect(getMessages(restored)).toHaveLength(3);
  });

  it('throws on navigate to nonexistent node', () => {
    const tree = createSessionTree();
    expect(() => navigateToNode(tree, 'nonexistent')).toThrow('not found');
  });

  it('throws on fork from nonexistent node', () => {
    const tree = createSessionTree();
    expect(() => forkFromNode(tree, 'nonexistent')).toThrow('not found');
  });
});
