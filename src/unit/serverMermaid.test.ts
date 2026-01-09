import * as assert from 'assert';

import { renderMermaidBlocksFromMarkdown } from '../extension/serverMermaid';

suite('serverMermaid renderer', () => {
  test('renders simple diagrams into data URLs', async () => {
    const input = ['```mermaid', 'flowchart TD', '  A --> B', '```'].join('\n');
    const blocks = await renderMermaidBlocksFromMarkdown({ markdown: input });
    assert.strictEqual(blocks.length, 1);
    const block = blocks[0];
    assert.ok(block, 'expected first block');
    assert.strictEqual(block.blockIndex, 0);
    assert.ok(
      block.lightSvgDataUrl?.startsWith('data:image/svg+xml;base64,'),
      'expected light SVG data URL',
    );
    assert.ok(
      block.darkSvgDataUrl?.startsWith('data:image/svg+xml;base64,'),
      'expected dark SVG data URL',
    );
    assert.ifError(block.error);
  });

  test('reports an error for empty diagrams', async () => {
    const blocks = await renderMermaidBlocksFromMarkdown({ markdown: '```mermaid\n```' });
    assert.strictEqual(blocks.length, 1);
    const onlyBlock = blocks[0];
    assert.ok(onlyBlock, 'expected block for empty diagram');
    assert.match(onlyBlock.error || '', /empty/i);
  });

  test('enforces the max block limit with readable errors', async () => {
    const input = [
      '```mermaid',
      'flowchart TD',
      '  A --> B',
      '```',
      '```mermaid',
      'flowchart TD',
      '  B --> C',
      '```',
    ].join('\n');
    const blocks = await renderMermaidBlocksFromMarkdown({ markdown: input, maxBlocks: 1 });
    assert.strictEqual(blocks.length, 2);
    const first = blocks[0];
    const second = blocks[1];
    assert.ok(first && second, 'expected two blocks');
    assert.ifError(first.error);
    assert.match(second.error || '', /limit/i);
  });
});
