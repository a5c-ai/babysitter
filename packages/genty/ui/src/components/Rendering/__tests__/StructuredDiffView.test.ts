import { describe, expect, it } from 'vitest';
import {
  parseDiffOutput,
  formatDiffText,
  formatDiffHtml,
} from '../StructuredDiffView.js';

const SAMPLE_DIFF = `diff --git a/src/index.ts b/src/index.ts
index abc1234..def5678 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,5 +1,6 @@
 import { foo } from './foo';
-import { bar } from './bar';
+import { bar } from './bar2';
+import { baz } from './baz';

 export function main() {
   foo();
@@ -10,3 +11,4 @@
 }

 export const VERSION = '1.0.0';
+export const BUILD = '42';`;

describe('StructuredDiffView', () => {
  describe('parseDiffOutput', () => {
    it('parses unified diff into hunks with typed lines', () => {
      const hunks = parseDiffOutput(SAMPLE_DIFF);
      expect(hunks).toHaveLength(2);

      const hunk1 = hunks[0];
      expect(hunk1.header).toContain('@@ -1,5 +1,6 @@');

      const addLines = hunk1.lines.filter((l) => l.type === 'add');
      const removeLines = hunk1.lines.filter((l) => l.type === 'remove');
      const contextLines = hunk1.lines.filter((l) => l.type === 'context');

      expect(addLines).toHaveLength(2);
      expect(removeLines).toHaveLength(1);
      expect(contextLines.length).toBeGreaterThan(0);

      expect(removeLines[0].content).toBe("import { bar } from './bar';");
      expect(addLines[0].content).toBe("import { bar } from './bar2';");
      expect(addLines[1].content).toBe("import { baz } from './baz';");
    });

    it('assigns line numbers to diff lines', () => {
      const hunks = parseDiffOutput(SAMPLE_DIFF);
      const hunk1 = hunks[0];

      // First context line should be line 1 (new file)
      const firstContext = hunk1.lines.find((l) => l.type === 'context');
      expect(firstContext?.lineNumber).toBe(1);
    });

    it('returns empty array for non-diff input', () => {
      const hunks = parseDiffOutput('just some text\nwithout diff markers');
      expect(hunks).toEqual([]);
    });

    it('returns empty array for empty input', () => {
      expect(parseDiffOutput('')).toEqual([]);
    });
  });

  describe('formatDiffText', () => {
    it('renders with +/- prefixes and line numbers', () => {
      const hunks = parseDiffOutput(SAMPLE_DIFF);
      const text = formatDiffText(hunks);

      expect(text).toContain('@@');
      expect(text).toContain('+');
      expect(text).toContain('-');
      expect(text).toContain("import { bar } from './bar';");
      expect(text).toContain("import { bar } from './bar2';");
    });

    it('returns "(no changes)" for empty hunks', () => {
      expect(formatDiffText([])).toBe('(no changes)');
    });
  });

  describe('formatDiffHtml', () => {
    it('produces HTML with diff classes and table rows', () => {
      const hunks = parseDiffOutput(SAMPLE_DIFF);
      const html = formatDiffHtml(hunks);

      expect(html).toContain('<div class="diff-view">');
      expect(html).toContain('class="diff-add"');
      expect(html).toContain('class="diff-remove"');
      expect(html).toContain('class="diff-context"');
      expect(html).toContain('<table class="diff-table">');
      expect(html).toContain('background:#e6ffec');
      expect(html).toContain('background:#ffebe9');
    });

    it('returns "(no changes)" HTML for empty hunks', () => {
      const html = formatDiffHtml([]);
      expect(html).toContain('(no changes)');
    });

    it('escapes HTML characters in diff content', () => {
      const diff = `--- a/x.ts
+++ b/x.ts
@@ -1,1 +1,1 @@
-const x = a < b && c > d;
+const x = a <= b && c >= d;`;
      const hunks = parseDiffOutput(diff);
      const html = formatDiffHtml(hunks);

      expect(html).not.toContain('< b');
      expect(html).toContain('&lt; b');
      expect(html).toContain('&gt; d');
    });
  });
});
