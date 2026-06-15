/**
 * Tests for GAP-STATE-001: Long-Term Memory Extraction.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

import * as fs from "node:fs/promises";
import {
  extractMemoriesFromSession,
  readLongTermMemory,
  persistMemories,
  queryMemories,
  pruneMemories,
  LONG_TERM_MEMORY_SCHEMA_VERSION,
  type MemoryEntry,
  type LongTermMemoryStore,
} from "../memoryExtraction";

const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockRename = vi.mocked(fs.rename);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("memoryExtraction (GAP-STATE-001)", () => {
  const globalStateDir = "/tmp/global";

  describe("extractMemoriesFromSession", () => {
    it("returns empty array for empty input", () => {
      const result = extractMemoriesFromSession({ decisions: [], findings: [] });
      expect(result).toEqual([]);
    });

    it("maps decisions to category=decision", () => {
      const result = extractMemoriesFromSession({
        decisions: [{ summary: "Use PostgreSQL", rationale: "scalability", timestamp: "2026-01-01T00:00:00Z" }],
        findings: [],
      });
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("decision");
      expect(result[0].content).toContain("PostgreSQL");
    });

    it("maps findings through with their category", () => {
      const result = extractMemoriesFromSession({
        decisions: [],
        findings: [{ content: "API uses REST", category: "architecture", timestamp: "2026-01-01T00:00:00Z" }],
      });
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("architecture");
    });

    it("deduplicates identical content", () => {
      const result = extractMemoriesFromSession({
        decisions: [
          { summary: "Same decision", rationale: "", timestamp: "2026-01-01T00:00:00Z" },
          { summary: "Same decision", rationale: "", timestamp: "2026-01-02T00:00:00Z" },
        ],
        findings: [],
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("readLongTermMemory", () => {
    it("returns empty store on ENOENT", async () => {
      const err = new Error("ENOENT") as NodeJS.ErrnoException;
      err.code = "ENOENT";
      mockReadFile.mockRejectedValueOnce(err);

      const store = await readLongTermMemory(globalStateDir);
      expect(store.schemaVersion).toBe(LONG_TERM_MEMORY_SCHEMA_VERSION);
      expect(store.entries).toEqual([]);
    });

    it("returns empty store on corrupt JSON", async () => {
      mockReadFile.mockResolvedValueOnce("{{invalid" as never);

      const store = await readLongTermMemory(globalStateDir);
      expect(store.entries).toEqual([]);
    });
  });

  describe("persistMemories", () => {
    it("merges new entries into existing store without duplicates", async () => {
      const existing: LongTermMemoryStore = {
        schemaVersion: LONG_TERM_MEMORY_SCHEMA_VERSION,
        entries: [{ id: "mem-1", content: "Existing", category: "fact", confidence: "high", tags: [], extractedAt: "2026-01-01T00:00:00Z" }],
        updatedAt: "2026-01-01T00:00:00Z",
      };
      mockReadFile.mockResolvedValueOnce(JSON.stringify(existing) as never);

      const newEntries: MemoryEntry[] = [
        { id: "mem-2", content: "New entry", category: "decision", confidence: "high", tags: [], extractedAt: "2026-01-02T00:00:00Z" },
      ];

      await persistMemories(globalStateDir, newEntries);

      const written = JSON.parse(mockWriteFile.mock.calls[0][1] as string) as LongTermMemoryStore;
      expect(written.entries).toHaveLength(2);
    });

    it("trims to maxEntries limit", async () => {
      const existing: LongTermMemoryStore = {
        schemaVersion: LONG_TERM_MEMORY_SCHEMA_VERSION,
        entries: Array.from({ length: 5 }, (_, i) => ({
          id: `mem-${i}`, content: `Entry ${i}`, category: "fact" as const, confidence: "low" as const, tags: [], extractedAt: `2026-01-0${i + 1}T00:00:00Z`,
        })),
        updatedAt: "2026-01-05T00:00:00Z",
      };
      mockReadFile.mockResolvedValueOnce(JSON.stringify(existing) as never);

      await persistMemories(globalStateDir, [
        { id: "mem-new", content: "New", category: "fact", confidence: "high", tags: [], extractedAt: "2026-01-06T00:00:00Z" },
      ], 4);

      const written = JSON.parse(mockWriteFile.mock.calls[0][1] as string) as LongTermMemoryStore;
      expect(written.entries.length).toBeLessThanOrEqual(4);
    });
  });

  describe("queryMemories", () => {
    it("filters by category", async () => {
      const store: LongTermMemoryStore = {
        schemaVersion: LONG_TERM_MEMORY_SCHEMA_VERSION,
        entries: [
          { id: "1", content: "A", category: "fact", confidence: "high", tags: [], extractedAt: "2026-01-01T00:00:00Z" },
          { id: "2", content: "B", category: "decision", confidence: "high", tags: [], extractedAt: "2026-01-02T00:00:00Z" },
        ],
        updatedAt: "2026-01-02T00:00:00Z",
      };
      mockReadFile.mockResolvedValueOnce(JSON.stringify(store) as never);

      const results = await queryMemories(globalStateDir, { category: "decision" });
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe("decision");
    });

    it("filters by tags", async () => {
      const store: LongTermMemoryStore = {
        schemaVersion: LONG_TERM_MEMORY_SCHEMA_VERSION,
        entries: [
          { id: "1", content: "A", category: "fact", confidence: "high", tags: ["db"], extractedAt: "2026-01-01T00:00:00Z" },
          { id: "2", content: "B", category: "fact", confidence: "high", tags: ["api"], extractedAt: "2026-01-02T00:00:00Z" },
        ],
        updatedAt: "2026-01-02T00:00:00Z",
      };
      mockReadFile.mockResolvedValueOnce(JSON.stringify(store) as never);

      const results = await queryMemories(globalStateDir, { tags: ["db"] });
      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain("db");
    });
  });

  describe("pruneMemories", () => {
    it("removes entries beyond keepCount and returns count", async () => {
      const store: LongTermMemoryStore = {
        schemaVersion: LONG_TERM_MEMORY_SCHEMA_VERSION,
        entries: Array.from({ length: 10 }, (_, i) => ({
          id: `mem-${i}`, content: `Entry ${i}`, category: "fact" as const, confidence: "low" as const, tags: [], extractedAt: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
        })),
        updatedAt: "2026-01-10T00:00:00Z",
      };
      mockReadFile.mockResolvedValueOnce(JSON.stringify(store) as never);

      const pruned = await pruneMemories(globalStateDir, 5);
      expect(pruned).toBe(5);

      const written = JSON.parse(mockWriteFile.mock.calls[0][1] as string) as LongTermMemoryStore;
      expect(written.entries).toHaveLength(5);
    });
  });
});
