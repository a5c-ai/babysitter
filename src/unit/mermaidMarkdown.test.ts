import * as assert from 'assert';

import { extractMermaidCodeBlocks, normalizeMermaidMarkdown } from '../extension/mermaidMarkdown';

suite('normalizeMermaidMarkdown', () => {
  test('returns input unchanged when full ```mermaid fence already exists', () => {
    const input = ['```mermaid', 'flowchart TD', '  A --> B', '```'].join('\n');
    const output = normalizeMermaidMarkdown(input);
    assert.strictEqual(output, input);
  });

  test('wraps bare flowchart text in a canonical mermaid fence', () => {
    const input = ['flowchart TD', '  A --> B'].join('\n');
    const expected = ['```mermaid', 'flowchart TD', '  A --> B', '```'].join('\n');
    const output = normalizeMermaidMarkdown(input);
    assert.strictEqual(output, expected);
  });

  test('strips stray single-backtick wrappers and normalizes', () => {
    const input = ['`mermaid', 'flowchart TD', '  A --> B', '`'].join('\n');
    const expected = ['```mermaid', 'flowchart TD', '  A --> B', '```'].join('\n');
    const output = normalizeMermaidMarkdown(input);
    assert.strictEqual(output, expected);
  });

  test('returns empty mermaid block for whitespace-only content', () => {
    const output = normalizeMermaidMarkdown('   ');
    assert.strictEqual(output, '```mermaid\n```');
  });

  test('extracts mermaid code blocks preserving order', () => {
    const input = ['```mermaid', 'A-->B', '```', '```mermaid', 'C-->D', '```'].join('\n');
    const blocks = extractMermaidCodeBlocks(input);
    assert.deepStrictEqual(blocks, [
      { blockIndex: 0, code: 'A-->B' },
      { blockIndex: 1, code: 'C-->D' },
    ]);
  });

  test('normalizes bare content before extracting blocks when preferMermaid is set', () => {
    const input = ['flowchart TD', 'A --> B'].join('\n');
    const blocks = extractMermaidCodeBlocks(input, { preferMermaid: true });
    assert.deepStrictEqual(blocks, [{ blockIndex: 0, code: 'flowchart TD\nA --> B' }]);
  });

  test('ignores non-mermaid fences', () => {
    const input = ['```js', 'console.log(1);', '```'].join('\n');
    const blocks = extractMermaidCodeBlocks(input);
    assert.strictEqual(blocks.length, 0);
  });

  test('ignores unterminated mermaid fences', () => {
    const input = ['```mermaid', 'A-->B'].join('\n'); // missing closing fence
    const blocks = extractMermaidCodeBlocks(input);
    assert.deepStrictEqual(blocks, []);
  });
});
