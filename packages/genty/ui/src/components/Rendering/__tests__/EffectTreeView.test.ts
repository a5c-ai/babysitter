import { describe, expect, it } from 'vitest';
import {
  buildEffectTree,
  formatEffectTreeText,
  renderEffectTreeHtml,
} from '../EffectTreeView.js';
import type { FlatEffect } from '../EffectTreeView.js';

describe('EffectTreeView', () => {
  const sampleEffects: FlatEffect[] = [
    { id: 'root-1', kind: 'task', title: 'Build project', status: 'completed' },
    { id: 'child-1', parentId: 'root-1', kind: 'shell', title: 'npm install', status: 'completed' },
    { id: 'child-2', parentId: 'root-1', kind: 'shell', title: 'npm run build', status: 'running' },
    { id: 'grandchild-1', parentId: 'child-2', kind: 'file', title: 'Write dist/index.js', status: 'pending' },
    { id: 'root-2', kind: 'test', title: 'Run tests', status: 'pending' },
  ];

  describe('buildEffectTree', () => {
    it('constructs a tree from flat effects with correct parent-child relationships', () => {
      const tree = buildEffectTree(sampleEffects);
      expect(tree).toHaveLength(2);

      const root1 = tree[0];
      expect(root1.id).toBe('root-1');
      expect(root1.children).toHaveLength(2);
      expect(root1.depth).toBe(0);

      const child2 = root1.children[1];
      expect(child2.id).toBe('child-2');
      expect(child2.children).toHaveLength(1);
      expect(child2.depth).toBe(1);

      const grandchild = child2.children[0];
      expect(grandchild.id).toBe('grandchild-1');
      expect(grandchild.depth).toBe(2);

      const root2 = tree[1];
      expect(root2.id).toBe('root-2');
      expect(root2.children).toHaveLength(0);
      expect(root2.depth).toBe(0);
    });

    it('handles an empty effect list', () => {
      const tree = buildEffectTree([]);
      expect(tree).toEqual([]);
    });

    it('orphans with missing parentId become roots', () => {
      const effects: FlatEffect[] = [
        { id: 'a', parentId: 'nonexistent', kind: 'task', title: 'Orphan', status: 'pending' },
      ];
      const tree = buildEffectTree(effects);
      expect(tree).toHaveLength(1);
      expect(tree[0].parentId).toBe('nonexistent');
    });
  });

  describe('formatEffectTreeText', () => {
    it('renders an ASCII tree with connectors', () => {
      const tree = buildEffectTree(sampleEffects);
      const output = formatEffectTreeText(tree);

      expect(output).toContain('✔ [task] Build project (completed)');
      expect(output).toContain('├──');
      expect(output).toContain('└──');
      expect(output).toContain('[shell] npm install');
      expect(output).toContain('[shell] npm run build');
      expect(output).toContain('[file] Write dist/index.js');
      expect(output).toContain('○ [test] Run tests (pending)');
    });

    it('returns "(empty tree)" for empty input', () => {
      expect(formatEffectTreeText([])).toBe('(empty tree)');
    });
  });

  describe('renderEffectTreeHtml', () => {
    it('produces HTML with list structure and data attributes', () => {
      const tree = buildEffectTree(sampleEffects);
      const html = renderEffectTreeHtml(tree);

      expect(html).toContain('<ul class="effect-tree">');
      expect(html).toContain('data-effect-id="root-1"');
      expect(html).toContain('data-depth="0"');
      expect(html).toContain('data-depth="2"');
      expect(html).toContain('<details open>');
      expect(html).toContain('effect-completed');
      expect(html).toContain('effect-running');
      expect(html).toContain('effect-pending');
    });

    it('returns empty tree HTML for empty input', () => {
      const html = renderEffectTreeHtml([]);
      expect(html).toContain('(empty tree)');
    });

    it('escapes HTML characters in titles', () => {
      const effects: FlatEffect[] = [
        { id: 'x', kind: 'test', title: '<script>alert("xss")</script>', status: 'pending' },
      ];
      const tree = buildEffectTree(effects);
      const html = renderEffectTreeHtml(tree);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });
});
