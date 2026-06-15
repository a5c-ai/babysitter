import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  prepareSessionForSharing,
  generateShareableHtml,
  type ShareOptions,
  type ShareableSessionTree,
  type ShareableTreeNode,
} from '../sessionSharing';

/** Build a minimal session tree for testing. */
function buildTree(): ShareableSessionTree {
  const rootId = randomUUID();
  const branchId = 'main';

  const root: ShareableTreeNode = {
    id: rootId,
    parentId: null,
    branchId,
    role: 'system',
    content: 'Session started',
    timestamp: new Date().toISOString(),
  };

  const userNode: ShareableTreeNode = {
    id: randomUUID(),
    parentId: rootId,
    branchId,
    role: 'user',
    content: 'What is the secret key sk-abc123456789?',
    timestamp: new Date().toISOString(),
  };

  const assistantNode: ShareableTreeNode = {
    id: randomUUID(),
    parentId: userNode.id,
    branchId,
    role: 'assistant',
    content: 'I should not share that.',
    timestamp: new Date().toISOString(),
  };

  const nodes = new Map<string, ShareableTreeNode>([
    [rootId, root],
    [userNode.id, userNode],
    [assistantNode.id, assistantNode],
  ]);

  const branches = new Map<string, string[]>([
    [branchId, [rootId, userNode.id, assistantNode.id]],
  ]);

  return {
    rootId,
    activeBranchId: branchId,
    activeNodeId: assistantNode.id,
    nodes,
    branches,
  };
}

describe('sessionSharing', () => {
  // -------------------------------------------------------------------------
  // prepareSessionForSharing
  // -------------------------------------------------------------------------

  describe('prepareSessionForSharing', () => {
    it('serializes session tree with history', () => {
      const tree = buildTree();
      const opts: ShareOptions = {
        format: 'file',
        includeHistory: true,
        redactSecrets: false,
      };
      const result = prepareSessionForSharing(tree, opts);
      expect(result.format).toBe('file');
      expect(result.sharedAt).toBeTruthy();
      expect(result.content).toContain('What is the secret key');
    });

    it('redacts secrets when enabled', () => {
      const tree = buildTree();
      const opts: ShareOptions = {
        format: 'file',
        includeHistory: true,
        redactSecrets: true,
      };
      const result = prepareSessionForSharing(tree, opts);
      expect(result.content).not.toContain('sk-abc123456789');
      expect(result.content).toContain('[REDACTED]');
    });

    it('limits to active branch when includeHistory is false', () => {
      const tree = buildTree();
      const opts: ShareOptions = {
        format: 'link',
        includeHistory: false,
        redactSecrets: false,
      };
      const result = prepareSessionForSharing(tree, opts);
      // Should still have messages from the active branch
      expect(result.content).toContain('user');
      expect(result.format).toBe('link');
    });
  });

  // -------------------------------------------------------------------------
  // generateShareableHtml
  // -------------------------------------------------------------------------

  describe('generateShareableHtml', () => {
    it('generates valid HTML', () => {
      const tree = buildTree();
      const html = generateShareableHtml(tree);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Shared Session');
      expect(html).toContain('class="message user"');
      expect(html).toContain('class="message assistant"');
    });

    it('escapes HTML in content', () => {
      const rootId = randomUUID();
      const nodeId = randomUUID();
      const tree: ShareableSessionTree = {
        rootId,
        activeBranchId: 'main',
        activeNodeId: nodeId,
        nodes: new Map([
          [rootId, { id: rootId, parentId: null, branchId: 'main', role: 'system' as const, content: 'start', timestamp: new Date().toISOString() }],
          [nodeId, { id: nodeId, parentId: rootId, branchId: 'main', role: 'user' as const, content: '<script>alert("xss")</script>', timestamp: new Date().toISOString() }],
        ]),
        branches: new Map([['main', [rootId, nodeId]]]),
      };
      const html = generateShareableHtml(tree);
      expect(html).not.toContain('<script>alert');
      expect(html).toContain('&lt;script&gt;');
    });
  });
});
