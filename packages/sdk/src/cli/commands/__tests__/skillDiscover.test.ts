/**
 * Tests for the skill:discover enhancements (skill-resolver-to-cli milestone).
 *
 * Covers:
 * - discoverSkillsInternal() exported function
 * - --include-remote flag
 * - --summary-only flag
 * - DiscoverSkillsResult interface contract
 * - Caching behavior
 * - Deduplication and sorting
 * - Integration with handleSkillDiscover CLI wrapper
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import {
  discoverSkillsInternal,
  handleSkillDiscover,
  parseProcessFileMarkers,
  discoverFromProcessFile,
  type DiscoverSkillsResult,
  type SkillMetadata,
} from '../skill';

describe('discoverSkillsInternal', () => {
  let testDir: string;
  let pluginRoot: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = path.join(os.tmpdir(), `skill-discover-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    pluginRoot = path.join(testDir, 'plugin');
    await fs.mkdir(pluginRoot, { recursive: true });
    // Create a library dir in testDir so findRepoLibraryRoot stops here
    // instead of walking up to system directories (e.g. macOS /Library on
    // case-insensitive filesystems).
    await fs.mkdir(path.join(testDir, 'library'), { recursive: true });
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors on Windows
    }
  });

  // ── Basic contract ────────────────────────────────────────────────────

  it('returns DiscoverSkillsResult with correct shape when no skills found', async () => {
    const result = await discoverSkillsInternal({
      pluginRoot,
      cacheTtl: 0,
    });

    expect(result).toHaveProperty('skills');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('cached');
    expect(Array.isArray(result.skills)).toBe(true);
    expect(typeof result.summary).toBe('string');
    expect(typeof result.cached).toBe('boolean');
    expect(result.skills).toEqual([]);
    expect(result.summary).toBe('');
    expect(result.cached).toBe(false);
  });

  it('discovers skills from plugin skills directory', async () => {
    const skillDir = path.join(pluginRoot, 'skills', 'my-skill');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---
name: my-skill
description: A discovered skill
category: testing
---

# My Skill
`,
      'utf8'
    );

    const result = await discoverSkillsInternal({
      pluginRoot,
      cacheTtl: 0,
    });

    expect(result.cached).toBe(false);
    expect(result.skills.length).toBeGreaterThanOrEqual(1);
    const skill = result.skills.find((s) => s.name === 'my-skill');
    expect(skill).toBeDefined();
    expect(skill!.description).toContain('discovered skill');
    expect(skill!.category).toBe('testing');
    expect(skill!.source).toBe('local-plugin');
  });

  it('discovers skills from repo library root when present', async () => {
    const skillDir = path.join(
      testDir,
      'library',
      'specializations',
      'repo-spec',
      'skills',
      'repo-skill'
    );
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---
name: repo-skill
description: A repo library skill
category: testing
---
`,
      'utf8'
    );

    const result = await discoverSkillsInternal({
      pluginRoot,
      cacheTtl: 0,
    });

    const skill = result.skills.find((s) => s.name === 'repo-skill');
    expect(skill).toBeDefined();
    expect(skill!.source).toBe('local');
    expect(skill!.file).toContain(path.join('library', 'specializations', 'repo-spec'));
  });

  it('discovers skills from specializations directory', async () => {
    // Place the skill under testDir/library/specializations/ which is where
    // the discovery function resolves processRoot to (via findRepoLibraryRoot).
    const specDir = path.join(
      testDir,
      'library',
      'specializations',
      'test-spec'
    );
    await fs.mkdir(specDir, { recursive: true });
    await fs.writeFile(
      path.join(specDir, 'SKILL.md'),
      `---
name: test-specialization
description: A specialization skill
category: science
---
`,
      'utf8'
    );

    const result = await discoverSkillsInternal({
      pluginRoot,
      cacheTtl: 0,
    });

    expect(result.skills.length).toBeGreaterThanOrEqual(1);
    const spec = result.skills.find((s) => s.name === 'test-specialization');
    expect(spec).toBeDefined();
    expect(spec!.source).toBe('local');
    expect(spec!.category).toBe('science');
  });

  it('generates summary string from discovered skills', async () => {
    const skillDir = path.join(pluginRoot, 'skills', 'summary-skill');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---
name: summary-skill
description: Skill for summary test
category: test
---
`,
      'utf8'
    );

    const result = await discoverSkillsInternal({
      pluginRoot,
      cacheTtl: 0,
    });

    expect(result.summary).toContain('summary-skill');
    expect(result.summary).toContain('Skill for summary test');
  });

  // ── Deduplication ─────────────────────────────────────────────────────

  it('deduplicates skills by name keeping first occurrence', async () => {
    // Create the same-named skill in both specializations (under library/)
    // and plugin skills. Specializations are scanned first.
    const specDir = path.join(
      testDir,
      'library',
      'specializations',
      'dup-skill'
    );
    await fs.mkdir(specDir, { recursive: true });
    await fs.writeFile(
      path.join(specDir, 'SKILL.md'),
      `---
name: duplicate-skill
description: First occurrence (specialization)
category: first
---
`,
      'utf8'
    );

    const pluginSkillDir = path.join(pluginRoot, 'skills', 'dup-skill');
    await fs.mkdir(pluginSkillDir, { recursive: true });
    await fs.writeFile(
      path.join(pluginSkillDir, 'SKILL.md'),
      `---
name: duplicate-skill
description: Second occurrence (plugin)
category: second
---
`,
      'utf8'
    );

    const result = await discoverSkillsInternal({
      pluginRoot,
      cacheTtl: 0,
    });

    const matches = result.skills.filter((s) => s.name === 'duplicate-skill');
    expect(matches).toHaveLength(1);
    // First occurrence is from specializations (scanned first)
    expect(matches[0].category).toBe('first');
  });

  // ── Caching ────────────────────────────────────────────────────────────

  it('returns cached=true on second call within TTL', async () => {
    const skillDir = path.join(pluginRoot, 'skills', 'cache-skill');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---
name: cache-skill
description: Testing cache
category: test
---
`,
      'utf8'
    );

    const runId = `cache-test-${Date.now()}`;

    // First call should not be cached
    const first = await discoverSkillsInternal({
      pluginRoot,
      runId,
      cacheTtl: 300, // 5 min TTL
    });
    expect(first.cached).toBe(false);
    expect(first.skills.length).toBeGreaterThanOrEqual(1);

    // Second call should hit cache
    const second = await discoverSkillsInternal({
      pluginRoot,
      runId,
      cacheTtl: 300,
    });
    expect(second.cached).toBe(true);
    expect(second.skills).toEqual(first.skills);
    expect(second.summary).toBe(first.summary);
  });

  it('bypasses cache when cacheTtl is 0', async () => {
    const skillDir = path.join(pluginRoot, 'skills', 'nocache-skill');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---
name: nocache-skill
description: No cache
category: test
---
`,
      'utf8'
    );

    const runId = `nocache-test-${Date.now()}`;

    const first = await discoverSkillsInternal({
      pluginRoot,
      runId,
      cacheTtl: 0,
    });
    expect(first.cached).toBe(false);

    const second = await discoverSkillsInternal({
      pluginRoot,
      runId,
      cacheTtl: 0,
    });
    // With TTL=0, cache should always miss
    expect(second.cached).toBe(false);
  });

  // ── includeRemote flag ─────────────────────────────────────────────────

  it('does not fetch remote skills when includeRemote is false (default)', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      text: async () => '',
    } as Response);

    await discoverSkillsInternal({
      pluginRoot,
      cacheTtl: 0,
      includeRemote: false,
    });

    // fetch should NOT have been called since includeRemote is false
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('defaults includeRemote to false', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      text: async () => '',
    } as Response);

    await discoverSkillsInternal({
      pluginRoot,
      cacheTtl: 0,
      // includeRemote not specified
    });

    // fetch should NOT have been called since default is false
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('attempts remote fetch when includeRemote is true', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      text: async () => '',
    } as Response);

    await discoverSkillsInternal({
      pluginRoot,
      cacheTtl: 0,
      includeRemote: true,
    });

    // fetch should have been called at least once for the default remote source
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  // ── Limit to 30 skills ────────────────────────────────────────────────

  it('limits discovered skills to 30', async () => {
    // Create 35 skills
    for (let i = 0; i < 35; i++) {
      const skillDir = path.join(pluginRoot, 'skills', `skill-${i.toString().padStart(2, '0')}`);
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(
        path.join(skillDir, 'SKILL.md'),
        `---
name: skill-${i.toString().padStart(2, '0')}
description: Skill number ${i}
category: test
---
`,
        'utf8'
      );
    }

    const result = await discoverSkillsInternal({
      pluginRoot,
      cacheTtl: 0,
    });

    expect(result.skills.length).toBeLessThanOrEqual(30);
  });

  // ── Multiple skills in summary ─────────────────────────────────────────

  it('summary includes all discovered skill names separated by commas', async () => {
    const skills = ['alpha', 'beta', 'gamma'];
    for (const name of skills) {
      const skillDir = path.join(pluginRoot, 'skills', name);
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(
        path.join(skillDir, 'SKILL.md'),
        `---
name: ${name}
description: ${name} skill
category: test
---
`,
        'utf8'
      );
    }

    const result = await discoverSkillsInternal({
      pluginRoot,
      cacheTtl: 0,
    });

    for (const name of skills) {
      expect(result.summary).toContain(name);
    }
    // Summary uses comma separation
    expect(result.summary).toContain(', ');
  });
});

// ── handleSkillDiscover CLI wrapper tests ──────────────────────────────

describe('handleSkillDiscover --summary-only flag', () => {
  let testDir: string;
  let pluginRoot: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = path.join(os.tmpdir(), `skill-discover-cli-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    pluginRoot = path.join(testDir, 'plugin');
    await fs.mkdir(pluginRoot, { recursive: true });
    process.chdir(testDir);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('outputs only the summary string when --summary-only is set', async () => {
    const skillDir = path.join(pluginRoot, 'skills', 'summary-test');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---
name: summary-test
description: For summary-only flag
category: test
---
`,
      'utf8'
    );

    const logSpy = console.log as ReturnType<typeof vi.fn>;
    const exitCode = await handleSkillDiscover({
      pluginRoot,
      cacheTtl: 0,
      json: false,
      summaryOnly: true,
    });

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledTimes(1);
    // The output should be the summary string, not JSON
    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('summary-test');
    // Should NOT be JSON
    expect(() => { JSON.parse(output); }).toThrow();
  });

  it('outputs empty string when --summary-only is set and no skills found', async () => {
    const emptyPluginRoot = path.join(testDir, 'empty-plugin');
    await fs.mkdir(emptyPluginRoot, { recursive: true });

    const logSpy = console.log as ReturnType<typeof vi.fn>;
    const exitCode = await handleSkillDiscover({
      pluginRoot: emptyPluginRoot,
      cacheTtl: 0,
      json: false,
      summaryOnly: true,
    });

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toBe('');
  });

  it('--summary-only takes precedence over --json', async () => {
    const skillDir = path.join(pluginRoot, 'skills', 'precedence-test');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---
name: precedence-test
description: Testing flag precedence
category: test
---
`,
      'utf8'
    );

    const logSpy = console.log as ReturnType<typeof vi.fn>;
    const exitCode = await handleSkillDiscover({
      pluginRoot,
      cacheTtl: 0,
      json: true,
      summaryOnly: true,
    });

    expect(exitCode).toBe(0);
    // Even with --json, --summary-only should output plain text summary
    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('precedence-test');
    // Should not be wrapped in JSON
    expect(output).not.toContain('"skills"');
  });
});

describe('handleSkillDiscover --include-remote flag', () => {
  let testDir: string;
  let pluginRoot: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = path.join(os.tmpdir(), `skill-discover-remote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    pluginRoot = path.join(testDir, 'plugin');
    await fs.mkdir(pluginRoot, { recursive: true });
    process.chdir(testDir);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('passes includeRemote=true to internal function when flag is set', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      text: async () => '',
    } as Response);

    const exitCode = await handleSkillDiscover({
      pluginRoot,
      cacheTtl: 0,
      json: true,
      includeRemote: true,
    });

    expect(exitCode).toBe(0);
    // fetch should have been called since includeRemote is true
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('does not fetch remote when includeRemote is not set', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      text: async () => '',
    } as Response);

    const exitCode = await handleSkillDiscover({
      pluginRoot,
      cacheTtl: 0,
      json: true,
      // includeRemote not set
    });

    expect(exitCode).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('handleSkillDiscover JSON output', () => {
  let testDir: string;
  let pluginRoot: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = path.join(os.tmpdir(), `skill-discover-json-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    pluginRoot = path.join(testDir, 'plugin');
    await fs.mkdir(pluginRoot, { recursive: true });
    process.chdir(testDir);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('JSON output includes cached field', async () => {
    const logSpy = console.log as ReturnType<typeof vi.fn>;
    const exitCode = await handleSkillDiscover({
      pluginRoot,
      cacheTtl: 0,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output).toHaveProperty('cached');
    expect(typeof output.cached).toBe('boolean');
  });

  it('JSON output includes skills array and summary', async () => {
    const skillDir = path.join(pluginRoot, 'skills', 'json-output-skill');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---
name: json-output-skill
description: Testing JSON output
category: test
---
`,
      'utf8'
    );

    const logSpy = console.log as ReturnType<typeof vi.fn>;
    const exitCode = await handleSkillDiscover({
      pluginRoot,
      cacheTtl: 0,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output).toHaveProperty('skills');
    expect(output).toHaveProperty('summary');
    expect(Array.isArray(output.skills)).toBe(true);
    expect(typeof output.summary).toBe('string');
    expect(output.summary).toContain('json-output-skill');
  });
});

// ── session:iteration-message integration with skill context ────────────

describe('session:iteration-message skill context integration', () => {
  let testDir: string;
  let pluginRoot: string;
  const CACHE_DIR = path.join(os.tmpdir(), 'babysitter-skill-cache');
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = path.join(os.tmpdir(), `skill-session-int-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    pluginRoot = path.join(testDir, 'plugin');
    await fs.mkdir(pluginRoot, { recursive: true });
    process.chdir(testDir);
    // Clear the global skill cache to avoid cross-test contamination
    try {
      await fs.rm(CACHE_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if it doesn't exist
    }
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('injects skill context when pluginRoot is provided', async () => {
    // Create a skill to discover
    const skillDir = path.join(pluginRoot, 'skills', 'session-skill');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---
name: session-skill
description: Skill for session test
category: test
---
`,
      'utf8'
    );

    const { handleSessionIterationMessage } = await import('../session');

    const logSpy = console.log as ReturnType<typeof vi.fn>;
    const exitCode = await handleSessionIterationMessage({
      iteration: 1,
      runsDir: testDir,
      pluginRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(logSpy.mock.calls[logSpy.mock.calls.length - 1][0] as string);
    expect(output).toHaveProperty('skillContext');
    // skillContext should contain the discovered skill summary
    expect(output.skillContext).toContain('session-skill');
  });

  it('returns null skillContext when pluginRoot is not provided', async () => {
    const { handleSessionIterationMessage } = await import('../session');

    const logSpy = console.log as ReturnType<typeof vi.fn>;
    const exitCode = await handleSessionIterationMessage({
      iteration: 1,
      runsDir: testDir,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(logSpy.mock.calls[logSpy.mock.calls.length - 1][0] as string);
    expect(output.skillContext).toBeNull();
  });

  it('returns null skillContext when pluginRoot has no skills', async () => {
    const emptyPluginRoot = path.join(testDir, 'empty-plugin');
    await fs.mkdir(emptyPluginRoot, { recursive: true });

    const { handleSessionIterationMessage } = await import('../session');

    const logSpy = console.log as ReturnType<typeof vi.fn>;
    const exitCode = await handleSessionIterationMessage({
      iteration: 1,
      runsDir: testDir,
      pluginRoot: emptyPluginRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(logSpy.mock.calls[logSpy.mock.calls.length - 1][0] as string);
    // Empty summary should resolve to null
    expect(output.skillContext).toBeNull();
  });
});

// ── Process file marker parsing ──────────────────────────────────────

describe('parseProcessFileMarkers', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `process-markers-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors on Windows
    }
  });

  it('parses @skill and @agent markers from JSDoc header', async () => {
    const processFile = path.join(testDir, 'test-process.js');
    await fs.writeFile(processFile, `/**
 * @process specializations/web-dev/react-app
 * @description React app development
 * @skill frontend-design specializations/web-dev/skills/frontend-design/SKILL.md
 * @skill visual-diff specializations/web-dev/skills/visual-diff/SKILL.md
 * @agent frontend-arch specializations/web-dev/agents/frontend-arch/AGENT.md
 */
export async function process(inputs, ctx) {}
`, 'utf8');

    const result = parseProcessFileMarkers(processFile);

    expect(result.hasMarkers).toBe(true);
    expect(result.skills).toHaveLength(2);
    expect(result.agents).toHaveLength(1);
    expect(result.skills[0]).toEqual({
      type: 'skill',
      name: 'frontend-design',
      relativePath: 'specializations/web-dev/skills/frontend-design/SKILL.md',
    });
    expect(result.skills[1]).toEqual({
      type: 'skill',
      name: 'visual-diff',
      relativePath: 'specializations/web-dev/skills/visual-diff/SKILL.md',
    });
    expect(result.agents[0]).toEqual({
      type: 'agent',
      name: 'frontend-arch',
      relativePath: 'specializations/web-dev/agents/frontend-arch/AGENT.md',
    });
  });

  it('returns hasMarkers=false when no JSDoc block exists', async () => {
    const processFile = path.join(testDir, 'no-jsdoc.js');
    await fs.writeFile(processFile, `// no JSDoc here
export async function process(inputs, ctx) {}
`, 'utf8');

    const result = parseProcessFileMarkers(processFile);

    expect(result.hasMarkers).toBe(false);
    expect(result.skills).toEqual([]);
    expect(result.agents).toEqual([]);
  });

  it('returns hasMarkers=false when JSDoc has no @skill/@agent markers', async () => {
    const processFile = path.join(testDir, 'no-markers.js');
    await fs.writeFile(processFile, `/**
 * @process specializations/testing/unit-tests
 * @description Unit testing process
 */
export async function process(inputs, ctx) {}
`, 'utf8');

    const result = parseProcessFileMarkers(processFile);

    expect(result.hasMarkers).toBe(false);
    expect(result.skills).toEqual([]);
    expect(result.agents).toEqual([]);
  });

  it('deduplicates markers by name', async () => {
    const processFile = path.join(testDir, 'dup-markers.js');
    await fs.writeFile(processFile, `/**
 * @skill my-skill path/to/SKILL.md
 * @skill my-skill path/to/other/SKILL.md
 * @agent my-agent path/to/AGENT.md
 * @agent my-agent path/to/other/AGENT.md
 */
export async function process(inputs, ctx) {}
`, 'utf8');

    const result = parseProcessFileMarkers(processFile);

    expect(result.hasMarkers).toBe(true);
    expect(result.skills).toHaveLength(1);
    expect(result.agents).toHaveLength(1);
    expect(result.skills[0].name).toBe('my-skill');
    expect(result.skills[0].relativePath).toBe('path/to/SKILL.md');
    expect(result.agents[0].name).toBe('my-agent');
    expect(result.agents[0].relativePath).toBe('path/to/AGENT.md');
  });

  it('handles markers without relative path', async () => {
    const processFile = path.join(testDir, 'no-path.js');
    await fs.writeFile(processFile, `/**
 * @skill standalone-skill
 * @agent standalone-agent
 */
export async function process(inputs, ctx) {}
`, 'utf8');

    const result = parseProcessFileMarkers(processFile);

    expect(result.hasMarkers).toBe(true);
    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].relativePath).toBeUndefined();
    expect(result.agents).toHaveLength(1);
    expect(result.agents[0].relativePath).toBeUndefined();
  });

  it('returns empty result for non-existent file', () => {
    const result = parseProcessFileMarkers('/nonexistent/file.js');

    expect(result.hasMarkers).toBe(false);
    expect(result.skills).toEqual([]);
    expect(result.agents).toEqual([]);
  });
});

describe('discoverFromProcessFile', () => {
  let testDir: string;
  let pluginRoot: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = path.join(os.tmpdir(), `process-discover-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    pluginRoot = path.join(testDir, 'plugin');
    await fs.mkdir(path.join(pluginRoot, 'skills', 'babysit', 'process'), { recursive: true });
    // Create a library dir so findRepoLibraryRoot stops here instead of
    // walking up to system directories (e.g. macOS /Library).
    await fs.mkdir(path.join(testDir, 'library'), { recursive: true });
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors on Windows
    }
  });

  it('returns resolved metadata with full file paths', async () => {
    const processFile = path.join(testDir, 'my-process.js');
    await fs.writeFile(processFile, `/**
 * @skill my-skill specializations/web-dev/skills/my-skill/SKILL.md
 * @agent my-agent specializations/web-dev/agents/my-agent/AGENT.md
 */
export async function process(inputs, ctx) {}
`, 'utf8');

    const result = discoverFromProcessFile({
      processFilePath: processFile,
      pluginRoot,
    });

    expect(result).not.toBeNull();
    expect(result!.skills).toHaveLength(1);
    expect(result!.agents).toHaveLength(1);

    // Markers resolve against the repo library root (testDir/library) when it
    // exists, falling back to the legacy plugin process root otherwise.
    const expectedSkillPath = path.resolve(
      testDir, 'library',
      'specializations/web-dev/skills/my-skill/SKILL.md'
    );
    const expectedAgentPath = path.resolve(
      testDir, 'library',
      'specializations/web-dev/agents/my-agent/AGENT.md'
    );

    expect(result!.skills[0]).toEqual({ name: 'my-skill', file: expectedSkillPath });
    expect(result!.agents[0]).toEqual({ name: 'my-agent', file: expectedAgentPath });
  });

  it('returns null when process file has no markers', async () => {
    const processFile = path.join(testDir, 'no-markers.js');
    await fs.writeFile(processFile, `/**
 * @process specializations/testing/unit-tests
 */
export async function process(inputs, ctx) {}
`, 'utf8');

    const result = discoverFromProcessFile({
      processFilePath: processFile,
      pluginRoot,
    });

    expect(result).toBeNull();
  });

  it('returns null for non-existent process file', () => {
    const result = discoverFromProcessFile({
      processFilePath: '/nonexistent/process.js',
      pluginRoot,
    });

    expect(result).toBeNull();
  });

  it('returns markers without file when no relative path given', async () => {
    const processFile = path.join(testDir, 'name-only.js');
    await fs.writeFile(processFile, `/**
 * @skill standalone-skill
 */
export async function process(inputs, ctx) {}
`, 'utf8');

    const result = discoverFromProcessFile({
      processFilePath: processFile,
      pluginRoot,
    });

    expect(result).not.toBeNull();
    expect(result!.skills).toHaveLength(1);
    expect(result!.skills[0]).toEqual({ name: 'standalone-skill' });
  });

  it('resolves marker paths against repo library root when present', async () => {
    const processFile = path.join(testDir, 'repo-process.js');
    await fs.mkdir(path.join(testDir, 'library'), { recursive: true });
    await fs.writeFile(processFile, `/**
 * @skill repo-skill specializations/web-dev/skills/repo-skill/SKILL.md
 */
export async function process(inputs, ctx) {}
`, 'utf8');

    const result = discoverFromProcessFile({
      processFilePath: processFile,
      pluginRoot,
    });

    expect(result).not.toBeNull();
    expect(result!.skills[0]).toEqual({
      name: 'repo-skill',
      file: path.resolve(testDir, 'library', 'specializations/web-dev/skills/repo-skill/SKILL.md'),
    });
  });
});
