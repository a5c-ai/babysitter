import { describe, it, expect, beforeEach } from 'vitest';
import { StreamAssembler } from '../src/index.js';

describe('StreamAssembler', () => {
  let assembler: StreamAssembler;

  beforeEach(() => {
    assembler = new StreamAssembler();
  });

  describe('line mode (default)', () => {
    it('returns each line as-is from feed()', () => {
      expect(assembler.feed('hello')).toBe('hello');
      expect(assembler.feed('world')).toBe('world');
    });

    it('is not in block mode', () => {
      expect(assembler.inBlock).toBe(false);
    });

    it('has zero buffered lines', () => {
      expect(assembler.bufferedLineCount).toBe(0);
    });

    it('peek returns empty string', () => {
      expect(assembler.peek()).toBe('');
    });

    it('endBlock returns null when not in block mode', () => {
      expect(assembler.endBlock()).toBeNull();
    });
  });

  describe('block mode', () => {
    it('accumulates lines until terminator returns true', () => {
      assembler.startBlock((line) => line === '}');

      expect(assembler.feed('{')).toBeNull();
      expect(assembler.feed('  "key": "value"')).toBeNull();
      expect(assembler.inBlock).toBe(true);
      expect(assembler.bufferedLineCount).toBe(2);

      const result = assembler.feed('}');
      expect(result).toBe('{\n  "key": "value"\n}');
      expect(assembler.inBlock).toBe(false);
      expect(assembler.bufferedLineCount).toBe(0);
    });

    it('terminator receives accumulated content', () => {
      const accumulated: string[] = [];
      assembler.startBlock((_line, acc) => {
        accumulated.push(acc);
        return acc.includes('END');
      });

      assembler.feed('line1');
      assembler.feed('line2');
      const result = assembler.feed('END');

      expect(result).toBe('line1\nline2\nEND');
      expect(accumulated).toHaveLength(3);
      expect(accumulated[0]).toBe('line1');
      expect(accumulated[1]).toBe('line1\nline2');
    });

    it('endBlock forces completion and returns accumulated', () => {
      assembler.startBlock(() => false);

      assembler.feed('line1');
      assembler.feed('line2');

      const result = assembler.endBlock();
      expect(result).toBe('line1\nline2');
      expect(assembler.inBlock).toBe(false);
      expect(assembler.bufferedLineCount).toBe(0);
    });

    it('endBlock returns null if buffer is empty', () => {
      assembler.startBlock(() => false);
      // No feeds — force end immediately
      expect(assembler.endBlock()).toBeNull();
    });

    it('peek returns accumulated without ending block', () => {
      assembler.startBlock(() => false);
      assembler.feed('a');
      assembler.feed('b');

      expect(assembler.peek()).toBe('a\nb');
      expect(assembler.inBlock).toBe(true);
      expect(assembler.bufferedLineCount).toBe(2);
    });

    it('returns to line mode after block completes', () => {
      assembler.startBlock((line) => line === 'END');
      assembler.feed('block content');
      assembler.feed('END');

      // Now back in line mode
      expect(assembler.inBlock).toBe(false);
      expect(assembler.feed('normal line')).toBe('normal line');
    });
  });

  describe('reset', () => {
    it('clears block mode and buffer', () => {
      assembler.startBlock(() => false);
      assembler.feed('line1');
      assembler.feed('line2');

      assembler.reset();

      expect(assembler.inBlock).toBe(false);
      expect(assembler.bufferedLineCount).toBe(0);
      expect(assembler.peek()).toBe('');
      expect(assembler.feed('fresh')).toBe('fresh');
    });

    it('is safe to call when not in block mode', () => {
      assembler.reset();
      expect(assembler.inBlock).toBe(false);
    });
  });

  describe('JSON block accumulation pattern', () => {
    it('accumulates a multi-line JSON object', () => {
      let braceCount = 0;
      assembler.startBlock((line) => {
        for (const ch of line) {
          if (ch === '{') braceCount++;
          else if (ch === '}') braceCount--;
        }
        return braceCount === 0;
      });

      expect(assembler.feed('{')).toBeNull();
      expect(assembler.feed('  "nested": {')).toBeNull();
      expect(assembler.feed('    "value": 1')).toBeNull();
      expect(assembler.feed('  }')).toBeNull();

      const result = assembler.feed('}');
      expect(result).toContain('"nested"');
      const parsed = JSON.parse(result!);
      expect(parsed.nested.value).toBe(1);
    });
  });
});
