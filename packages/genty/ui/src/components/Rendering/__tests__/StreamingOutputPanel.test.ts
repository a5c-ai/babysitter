import { describe, expect, it } from 'vitest';
import { StreamPanelManager, formatPanelOutput } from '../StreamingOutputPanel.js';

describe('StreamingOutputPanel', () => {
  describe('StreamPanelManager', () => {
    it('creates and retrieves panels', () => {
      const mgr = new StreamPanelManager();
      const panel = mgr.addPanel('build', 'Build Output');
      expect(panel.id).toBe('build');
      expect(panel.title).toBe('Build Output');
      expect(panel.lines).toEqual([]);
      expect(panel.maxLines).toBe(500);
      expect(panel.autoScroll).toBe(true);

      expect(mgr.getPanel('build')).toBe(panel);
      expect(mgr.getPanel('nonexistent')).toBeUndefined();
    });

    it('appends lines to a panel', () => {
      const mgr = new StreamPanelManager();
      mgr.addPanel('log', 'Logs');
      mgr.appendLine('log', 'line 1');
      mgr.appendLine('log', 'line 2');
      mgr.appendLine('log', 'line 3');

      const panel = mgr.getPanel('log')!;
      expect(panel.lines).toEqual(['line 1', 'line 2', 'line 3']);
    });

    it('trims lines when exceeding maxLines', () => {
      const mgr = new StreamPanelManager();
      mgr.addPanel('trim', 'Trimmed', { maxLines: 3 });
      mgr.appendLine('trim', 'a');
      mgr.appendLine('trim', 'b');
      mgr.appendLine('trim', 'c');
      mgr.appendLine('trim', 'd');
      mgr.appendLine('trim', 'e');

      const panel = mgr.getPanel('trim')!;
      expect(panel.lines).toEqual(['c', 'd', 'e']);
      expect(panel.lines).toHaveLength(3);
    });

    it('silently ignores appends to nonexistent panels', () => {
      const mgr = new StreamPanelManager();
      expect(() => mgr.appendLine('nope', 'line')).not.toThrow();
    });

    it('lists all panels', () => {
      const mgr = new StreamPanelManager();
      mgr.addPanel('a', 'Panel A');
      mgr.addPanel('b', 'Panel B');

      const all = mgr.listPanels();
      expect(all).toHaveLength(2);
      expect(all.map((p) => p.id)).toEqual(['a', 'b']);
    });

    it('removes panels', () => {
      const mgr = new StreamPanelManager();
      mgr.addPanel('x', 'Panel X');
      expect(mgr.removePanel('x')).toBe(true);
      expect(mgr.getPanel('x')).toBeUndefined();
      expect(mgr.removePanel('x')).toBe(false);
    });

    it('clears panel lines', () => {
      const mgr = new StreamPanelManager();
      mgr.addPanel('c', 'Clear Me');
      mgr.appendLine('c', 'data');
      mgr.clear('c');
      expect(mgr.getPanel('c')!.lines).toEqual([]);
    });
  });

  describe('formatPanelOutput', () => {
    it('renders a bordered panel with title', () => {
      const mgr = new StreamPanelManager();
      mgr.addPanel('out', 'Build');
      mgr.appendLine('out', 'Compiling...');
      mgr.appendLine('out', 'Done.');

      const panel = mgr.getPanel('out')!;
      const output = formatPanelOutput(panel, 40);

      expect(output).toContain('Build');
      expect(output).toContain('┌');
      expect(output).toContain('┐');
      expect(output).toContain('└');
      expect(output).toContain('┘');
      expect(output).toContain('Compiling...');
      expect(output).toContain('Done.');
    });

    it('renders an empty panel with a blank line', () => {
      const mgr = new StreamPanelManager();
      mgr.addPanel('empty', 'Empty');
      const panel = mgr.getPanel('empty')!;
      const output = formatPanelOutput(panel, 40);

      expect(output).toContain('┌');
      expect(output).toContain('┘');
      // Should have at least 3 lines (top, empty content, bottom)
      const lines = output.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(3);
    });

    it('truncates long lines with an ellipsis', () => {
      const mgr = new StreamPanelManager();
      mgr.addPanel('long', 'Long');
      mgr.appendLine('long', 'A'.repeat(200));

      const panel = mgr.getPanel('long')!;
      const output = formatPanelOutput(panel, 40);
      expect(output).toContain('…');
    });
  });
});
