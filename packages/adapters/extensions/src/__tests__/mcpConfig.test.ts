// RED tests for the not-yet-implemented MCP-emission feature of the
// @a5c-ai/extensions-adapter compiler.
//
// These pin down §4 of .a5c/atlas-unified-build/SPEC.md and the
// testContract.compiler entries in spec.json. They MUST fail until the
// implementation (src/mcpConfig.ts builders + each adapter's
// generateMcpConfig + the transform() emit step) exists.
//
// Implementation does NOT exist yet — this file references symbols that are
// expected to be added (resolveMcpUrl, DEFAULT_ATLAS_MCP_URL,
// buildRemoteCommandArgs, and adapter.generateMcpConfig). The import / type
// errors and assertion failures here constitute the expected RED state.

import { describe, expect, it } from 'vitest';
import { getAdapter } from '../targets/adapters/index.js';
import { getTargetProfile } from '../targets/index.js';
import { transform } from '../transform.js';
import type { A5cPluginManifest, McpServerSpec, TransformedFile } from '../types.js';
// Not-yet-implemented shared builders (src/mcpConfig.ts). Referencing them now
// is intentional: the build/import fails until the module is authored.
import {
  DEFAULT_ATLAS_MCP_URL,
  resolveMcpUrl,
  buildRemoteCommandArgs,
} from '../mcpConfig.js';

// --- Constants from the frozen spec ---------------------------------------

const DEFAULT_URL = 'https://atlas-staging.a5c.ai/api/mcp';
const ENV_VAR = 'ATLAS_MCP_URL';
const ENV_TOKEN = `\${${ENV_VAR}:-${DEFAULT_URL}}`; // ${ATLAS_MCP_URL:-https://atlas-staging.a5c.ai/api/mcp}

// The atlas remote server block (SPEC §4.1 / spec.json mcp.serverSpec).
const ATLAS_SERVER_SPEC: McpServerSpec = {
  type: 'remote',
  url: DEFAULT_URL,
  urlEnvVar: ENV_VAR,
};

// --- Fixture manifest (declares mcpServers like atlas-unified plugin.json) -

function makeManifest(withMcp: boolean): A5cPluginManifest {
  const manifest: A5cPluginManifest = {
    name: 'atlas',
    version: '0.1.0',
    description: 'Turn a stated need into a full system design by mining the Atlas knowledge graph.',
    author: 'a5c.ai',
    license: 'MIT',
  };
  if (withMcp) {
    manifest.mcpServers = { atlas: { ...ATLAS_SERVER_SPEC } };
  }
  return manifest;
}

// Per-target expectations from SPEC §4.3 / spec.json mcp.perTargetPaths.
// Keyed by the logical target name used in the spec (resolved through
// getTargetProfile, which aliases e.g. gemini -> gemini-cli).
interface JsonShapeExpectation {
  shape: 'json-mcpServers';
  path: string;
}
interface OpencodeShapeExpectation {
  shape: 'opencode-mcp';
  path: string;
}
interface CodexShapeExpectation {
  shape: 'codex-toml';
  path: string;
}
interface GeminiShapeExpectation {
  shape: 'gemini-mcpServers';
  path: string;
}
type ShapeExpectation =
  | JsonShapeExpectation
  | OpencodeShapeExpectation
  | CodexShapeExpectation
  | GeminiShapeExpectation;

// (A) JSON `mcpServers` map targets.
const JSON_MCPSERVERS_TARGETS: Record<string, JsonShapeExpectation> = {
  'claude-code': { shape: 'json-mcpServers', path: '.mcp.json' },
  cursor: { shape: 'json-mcpServers', path: '.cursor/mcp.json' },
  'github-copilot': { shape: 'json-mcpServers', path: '.mcp.json' },
  'antigravity-cli': { shape: 'json-mcpServers', path: 'mcp.json' },
  pi: { shape: 'json-mcpServers', path: '.mcp.json' },
  'oh-my-pi': { shape: 'json-mcpServers', path: '.mcp.json' },
  openclaw: { shape: 'json-mcpServers', path: '.mcp.json' },
  genty: { shape: 'json-mcpServers', path: '.mcp.json' },
};

// (B) harness-merge fragment targets.
const OPENCODE_EXPECTATION: OpencodeShapeExpectation = { shape: 'opencode-mcp', path: 'opencode.json' };
const CODEX_EXPECTATION: CodexShapeExpectation = { shape: 'codex-toml', path: 'mcp-servers.toml' };
const GEMINI_EXPECTATION: GeminiShapeExpectation = { shape: 'gemini-mcpServers', path: 'gemini-extension.json' };

// All logical target names the spec lists in perTargetPaths.
const ALL_SPEC_TARGETS: Record<string, ShapeExpectation> = {
  ...JSON_MCPSERVERS_TARGETS,
  opencode: OPENCODE_EXPECTATION,
  codex: CODEX_EXPECTATION,
  gemini: GEMINI_EXPECTATION,
};

// --- Helpers --------------------------------------------------------------

function generateFor(targetName: string, manifest: A5cPluginManifest): TransformedFile | null {
  const profile = getTargetProfile(targetName);
  expect(profile, `expected a resolvable target profile for "${targetName}"`).not.toBeNull();
  const adapter = getAdapter(profile!.name);
  expect(adapter, `expected a registered adapter for "${targetName}" (profile ${profile!.name})`).toBeTruthy();
  // generateMcpConfig(manifest, profile) — added by the implementation.
  return (adapter as unknown as {
    generateMcpConfig(m: A5cPluginManifest, p: typeof profile): TransformedFile | null;
  }).generateMcpConfig(manifest, profile);
}

// =========================================================================
// 1. Shared builders: default URL + env-override token
// =========================================================================

describe('mcpConfig shared builders', () => {
  it('resolveMcpUrl returns the default Atlas URL when url is unset', () => {
    expect(DEFAULT_ATLAS_MCP_URL).toBe(DEFAULT_URL);
    expect(resolveMcpUrl({ type: 'remote', urlEnvVar: ENV_VAR })).toBe(DEFAULT_URL);
  });

  it('buildRemoteCommandArgs yields the mcp-remote args with the env-override token', () => {
    expect(buildRemoteCommandArgs(ATLAS_SERVER_SPEC)).toEqual(['-y', 'mcp-remote', ENV_TOKEN]);
  });
});

// =========================================================================
// 2. Per-target native MCP config emission (SPEC §4.3)
// =========================================================================

describe('per-target generateMcpConfig — JSON mcpServers shape', () => {
  for (const [targetName, exp] of Object.entries(JSON_MCPSERVERS_TARGETS)) {
    it(`${targetName} emits ${exp.path} with mcpServers.atlas (command npx + env-override token in args)`, () => {
      const file = generateFor(targetName, makeManifest(true));
      expect(file, `expected a non-null MCP TransformedFile for ${targetName}`).not.toBeNull();
      expect(file!.path).toBe(exp.path);

      const parsed = JSON.parse(file!.content) as {
        mcpServers: Record<string, { command?: string; args?: string[] }>;
      };
      expect(parsed.mcpServers).toBeTruthy();
      const atlas = parsed.mcpServers.atlas;
      expect(atlas, `${targetName}: mcpServers.atlas missing`).toBeTruthy();
      expect(atlas.command).toBe('npx');
      expect(atlas.args).toEqual(['-y', 'mcp-remote', ENV_TOKEN]);
      expect(file!.content).toContain(ENV_TOKEN);
    });
  }
});

describe('per-target generateMcpConfig — opencode merge fragment', () => {
  it('opencode emits opencode.json with mcp.atlas (command array w/ mcp-remote + token, enabled:true)', () => {
    const file = generateFor('opencode', makeManifest(true));
    expect(file, 'expected a non-null MCP TransformedFile for opencode').not.toBeNull();
    expect(file!.path).toBe(OPENCODE_EXPECTATION.path);

    const parsed = JSON.parse(file!.content) as {
      mcp: Record<string, { type?: string; command?: string[]; enabled?: boolean }>;
    };
    expect(parsed.mcp).toBeTruthy();
    const atlas = parsed.mcp.atlas;
    expect(atlas, 'opencode: mcp.atlas missing').toBeTruthy();
    expect(Array.isArray(atlas.command)).toBe(true);
    expect(atlas.command).toContain('mcp-remote');
    expect(atlas.command).toContain(ENV_TOKEN);
    expect(atlas.enabled).toBe(true);
  });
});

describe('per-target generateMcpConfig — codex TOML merge fragment', () => {
  it('codex emits the TOML fragment containing [mcp_servers.atlas] and the env-override token', () => {
    const file = generateFor('codex', makeManifest(true));
    expect(file, 'expected a non-null MCP TransformedFile for codex').not.toBeNull();
    expect(file!.path).toBe(CODEX_EXPECTATION.path);
    expect(file!.content).toContain('[mcp_servers.atlas]');
    expect(file!.content).toContain('command = "npx"');
    expect(file!.content).toContain(ENV_TOKEN);
  });
});

describe('per-target generateMcpConfig — gemini extension manifest', () => {
  it('gemini emits gemini-extension.json with mcpServers.atlas carrying default URL (httpUrl) and/or args token', () => {
    const file = generateFor('gemini', makeManifest(true));
    expect(file, 'expected a non-null MCP TransformedFile for gemini').not.toBeNull();
    expect(file!.path).toBe(GEMINI_EXPECTATION.path);

    const parsed = JSON.parse(file!.content) as {
      mcpServers: Record<string, { httpUrl?: string; args?: string[] }>;
    };
    expect(parsed.mcpServers).toBeTruthy();
    const atlas = parsed.mcpServers.atlas;
    expect(atlas, 'gemini: mcpServers.atlas missing').toBeTruthy();
    // The default URL must be present (as httpUrl) and/or the env-override token in args.
    const hasDefaultUrl = atlas.httpUrl === DEFAULT_URL || file!.content.includes(DEFAULT_URL);
    const hasToken = (atlas.args ?? []).includes(ENV_TOKEN) || file!.content.includes(ENV_TOKEN);
    expect(hasDefaultUrl || hasToken).toBe(true);
    expect(atlas.httpUrl).toBe(DEFAULT_URL);
  });
});

// =========================================================================
// 3. Every adapter returns non-null when mcpServers present (contract)
// =========================================================================

describe('generateMcpConfig contract across all spec targets', () => {
  for (const targetName of Object.keys(ALL_SPEC_TARGETS)) {
    it(`${targetName}: generateMcpConfig returns a non-null TransformedFile when manifest.mcpServers present`, () => {
      const file = generateFor(targetName, makeManifest(true));
      expect(file).not.toBeNull();
      expect(typeof file!.path).toBe('string');
      expect(file!.path.length).toBeGreaterThan(0);
      expect(typeof file!.content).toBe('string');
      expect(file!.content.length).toBeGreaterThan(0);
    });
  }

  it('every adapter returns null when manifest.mcpServers is absent', () => {
    for (const targetName of Object.keys(ALL_SPEC_TARGETS)) {
      const file = generateFor(targetName, makeManifest(false));
      expect(file, `${targetName}: expected null MCP config when mcpServers absent`).toBeNull();
    }
  });
});

// =========================================================================
// 4. transform()-level wiring (emit step)
// =========================================================================

describe('transform() MCP emit step', () => {
  it('emits exactly one MCP config file per target at the spec path when mcpServers present', () => {
    for (const [targetName, exp] of Object.entries(ALL_SPEC_TARGETS)) {
      const profile = getTargetProfile(targetName);
      expect(profile, `expected a resolvable target profile for "${targetName}"`).not.toBeNull();
      const result = transform('/nonexistent-source', makeManifest(true), profile!);
      const mcpFiles = result.files.filter((f) => f.path === exp.path);
      expect(
        mcpFiles.length,
        `${targetName}: expected exactly one MCP file at ${exp.path}`,
      ).toBe(1);
    }
  });

  it('emits no MCP config file when mcpServers is absent', () => {
    const mcpPaths = new Set(Object.values(ALL_SPEC_TARGETS).map((e) => e.path));
    for (const targetName of Object.keys(ALL_SPEC_TARGETS)) {
      const profile = getTargetProfile(targetName);
      const result = transform('/nonexistent-source', makeManifest(false), profile!);
      const mcpFiles = result.files.filter((f) => mcpPaths.has(f.path));
      expect(
        mcpFiles.length,
        `${targetName}: expected no MCP file when mcpServers absent`,
      ).toBe(0);
    }
  });
});
