import * as assert from 'assert';

import { normalizeMermaidMarkdown } from '../extension/mermaidMarkdown';

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
});
