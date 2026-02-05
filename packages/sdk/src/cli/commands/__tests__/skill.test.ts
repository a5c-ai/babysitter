/**
 * Tests for skill CLI commands.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// We'll test the exported functions
import { handleSkillDiscover, handleSkillFetchRemote } from '../skill';

describe('skill commands', () => {
  let testDir: string;
  let pluginRoot: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `skill-test-${Date.now()}`);
    pluginRoot = path.join(testDir, 'plugin');
    await fs.mkdir(pluginRoot, { recursive: true });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('skill:discover', () => {
    it('returns error when plugin-root is missing', async () => {
      const result = await handleSkillDiscover({
        json: true,
      });

      expect(result).toBe(1);
    });

    it('returns empty results when no skills found', async () => {
      // Use a separate empty directory for this test
      const emptyPluginRoot = path.join(testDir, 'empty-plugin');
      await fs.mkdir(emptyPluginRoot, { recursive: true });

      const logSpy = vi.spyOn(console, 'log');

      const result = await handleSkillDiscover({
        pluginRoot: emptyPluginRoot,
        cacheTtl: 0, // Disable cache
        json: true,
      });

      expect(result).toBe(0);

      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.skills).toEqual([]);
    });

    it('discovers SKILL.md files in plugin skills directory', async () => {
      // Create test skill structure in plugin skills directory
      const skillsDir = path.join(pluginRoot, 'skills', 'test-skill');
      await fs.mkdir(skillsDir, { recursive: true });
      await fs.writeFile(
        path.join(skillsDir, 'SKILL.md'),
        `---
name: test-skill
description: A test skill for unit testing
category: testing
---

# Test Skill

This is a test skill.
`,
        'utf8'
      );

      const result = await handleSkillDiscover({
        pluginRoot,
        cacheTtl: 0, // Disable cache for testing
        json: true,
      });

      expect(result).toBe(0);

      // Verify console.log was called with JSON output
      const logSpy = console.log as ReturnType<typeof vi.fn>;
      expect(logSpy).toHaveBeenCalled();

      // Find the JSON output call
      const jsonCall = logSpy.mock.calls.find((call: unknown[]) => {
        try {
          const parsed = JSON.parse(call[0] as string);
          return parsed.skills !== undefined;
        } catch {
          return false;
        }
      });

      expect(jsonCall).toBeDefined();
      const output = JSON.parse(jsonCall[0] as string);
      expect(output.skills.length).toBeGreaterThan(0);
      const testSkill = output.skills.find((s: { name: string }) => s.name === 'test-skill');
      expect(testSkill).toBeDefined();
      expect(testSkill.description).toContain('test skill');
      expect(testSkill.category).toBe('testing');
    });

    it('parses frontmatter correctly with quoted values', async () => {
      const skillDir = path.join(pluginRoot, 'skills', 'my-complex-skill');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(
        path.join(skillDir, 'SKILL.md'),
        `---
name: my-complex-skill
description: "A skill with quoted description"
category: complex
domain: testing
---

Content here.
`,
        'utf8'
      );

      const result = await handleSkillDiscover({
        pluginRoot,
        cacheTtl: 0, // Disable cache for testing
        json: true,
      });

      expect(result).toBe(0);

      // Find the JSON output call
      const logSpy = console.log as ReturnType<typeof vi.fn>;
      const jsonCall = logSpy.mock.calls.find((call: unknown[]) => {
        try {
          const parsed = JSON.parse(call[0] as string);
          return parsed.skills !== undefined;
        } catch {
          return false;
        }
      });

      expect(jsonCall).toBeDefined();
      const output = JSON.parse(jsonCall[0] as string);
      const skill = output.skills.find((s: { name: string }) => s.name === 'my-complex-skill');
      expect(skill).toBeDefined();
      expect(skill.description).toBe('A skill with quoted description');
    });
  });

  describe('skill:fetch-remote', () => {
    it('returns error when source-type is missing', async () => {
      const result = await handleSkillFetchRemote({
        url: 'https://github.com/example/repo',
        json: true,
      });

      expect(result).toBe(1);
    });

    it('returns error when url is missing', async () => {
      const result = await handleSkillFetchRemote({
        sourceType: 'github',
        json: true,
      });

      expect(result).toBe(1);
    });

    it('returns error for invalid source type', async () => {
      const result = await handleSkillFetchRemote({
        sourceType: 'invalid' as 'github',
        url: 'https://example.com',
        json: true,
      });

      expect(result).toBe(1);
    });

    // Note: Testing actual GitHub/well-known fetching would require mocking fetch
    // These tests verify the argument validation
  });

  describe('GitHub URL conversion', () => {
    // Test the URL conversion logic indirectly through the command
    it('handles github.com tree URLs', async () => {
      // This would fail because we can't actually fetch, but it validates URL parsing
      const logSpy = vi.spyOn(console, 'log');

      // Mock fetch to return empty
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        text: async () => '',
      } as Response);

      const result = await handleSkillFetchRemote({
        sourceType: 'github',
        url: 'https://github.com/owner/repo/tree/main/skills',
        json: true,
      });

      expect(result).toBe(0);
      expect(logSpy).toHaveBeenCalled();

      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.skills).toEqual([]);
    });
  });
});
