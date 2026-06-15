import { describe, it, expect } from 'vitest';
import {
  consolidateMemories,
  detectDuplicates,
  mergeEntries,
  type ConsolidationResult,
} from '../memoryConsolidation';
import type { MemoryEntry } from '../memoryExtraction';

function makeEntry(overrides: Partial<MemoryEntry> & { id: string; content: string }): MemoryEntry {
  return {
    category: 'fact',
    confidence: 'medium',
    tags: [],
    extractedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('memoryConsolidation', () => {
  // -------------------------------------------------------------------------
  // detectDuplicates
  // -------------------------------------------------------------------------

  describe('detectDuplicates', () => {
    it('detects similar entries', () => {
      const entries: MemoryEntry[] = [
        makeEntry({ id: '1', content: 'the database uses postgresql for storage' }),
        makeEntry({ id: '2', content: 'the database uses postgresql for data storage' }),
      ];
      const pairs = detectDuplicates(entries);
      expect(pairs).toHaveLength(1);
    });

    it('does not pair dissimilar entries', () => {
      const entries: MemoryEntry[] = [
        makeEntry({ id: '1', content: 'the project uses typescript' }),
        makeEntry({ id: '2', content: 'cloud deployment on kubernetes pods' }),
      ];
      const pairs = detectDuplicates(entries);
      expect(pairs).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // mergeEntries
  // -------------------------------------------------------------------------

  describe('mergeEntries', () => {
    it('keeps longer content', () => {
      const a = makeEntry({ id: '1', content: 'short entry' });
      const b = makeEntry({ id: '2', content: 'much longer entry with more details' });
      const merged = mergeEntries(a, b);
      expect(merged.content).toBe(b.content);
    });

    it('keeps higher confidence', () => {
      const a = makeEntry({ id: '1', content: 'fact', confidence: 'low' });
      const b = makeEntry({ id: '2', content: 'fact about x', confidence: 'high' });
      const merged = mergeEntries(a, b);
      expect(merged.confidence).toBe('high');
    });

    it('merges tags without duplicates', () => {
      const a = makeEntry({ id: '1', content: 'entry a', tags: ['arch', 'db'] });
      const b = makeEntry({ id: '2', content: 'entry b is longer', tags: ['db', 'infra'] });
      const merged = mergeEntries(a, b);
      expect(merged.tags).toEqual(expect.arrayContaining(['arch', 'db', 'infra']));
      expect(new Set(merged.tags).size).toBe(merged.tags.length);
    });

    it('keeps the later extractedAt', () => {
      const a = makeEntry({ id: '1', content: 'earlier', extractedAt: '2026-01-01T00:00:00Z' });
      const b = makeEntry({ id: '2', content: 'later entry is longer', extractedAt: '2026-06-01T00:00:00Z' });
      const merged = mergeEntries(a, b);
      expect(merged.extractedAt).toBe('2026-06-01T00:00:00Z');
    });
  });

  // -------------------------------------------------------------------------
  // consolidateMemories
  // -------------------------------------------------------------------------

  describe('consolidateMemories', () => {
    it('returns empty result for empty input', () => {
      const result = consolidateMemories([]);
      expect(result.merged).toHaveLength(0);
      expect(result.dropped).toHaveLength(0);
      expect(result.conflictsResolved).toBe(0);
    });

    it('merges duplicate entries', () => {
      const entries: MemoryEntry[] = [
        makeEntry({ id: '1', content: 'the system uses postgresql database for storage' }),
        makeEntry({ id: '2', content: 'the system uses postgresql database for data storage' }),
        makeEntry({ id: '3', content: 'unrelated fact about kubernetes' }),
      ];
      const result = consolidateMemories(entries);
      expect(result.merged.length).toBeLessThan(entries.length);
      expect(result.conflictsResolved).toBeGreaterThan(0);
    });

    it('prunes to maxEntries', () => {
      // Each entry has completely different words to avoid Jaccard similarity matches
      const topics = [
        'postgresql database migration requires careful planning',
        'kubernetes orchestration handles container scheduling',
        'typescript compiler validates static types thoroughly',
        'nginx reverse proxy balances incoming traffic loads',
        'redis caching improves application response latency',
        'graphql schema stitching combines multiple endpoints',
        'terraform infrastructure provisions cloud resources',
        'elasticsearch indexing enables fulltext search queries',
        'prometheus monitoring collects runtime metrics data',
        'webpack bundling optimizes frontend asset delivery',
      ];
      const entries: MemoryEntry[] = topics.map((content, i) =>
        makeEntry({ id: `e-${i}`, content }),
      );
      const result = consolidateMemories(entries, 5);
      expect(result.merged).toHaveLength(5);
      expect(result.dropped).toHaveLength(5);
    });

    it('keeps high-confidence entries over low-confidence', () => {
      const entries: MemoryEntry[] = [
        makeEntry({ id: '1', content: 'low confidence entry alpha', confidence: 'low' }),
        makeEntry({ id: '2', content: 'high confidence entry beta', confidence: 'high' }),
      ];
      const result = consolidateMemories(entries, 1);
      expect(result.merged[0].confidence).toBe('high');
    });
  });
});
