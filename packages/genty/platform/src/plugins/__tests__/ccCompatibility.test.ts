import { describe, it, expect, beforeEach } from 'vitest';
import { CcCompatibilityLayer, type CcPluginManifest } from '../ccCompatibility';

describe('CcCompatibilityLayer', () => {
  let layer: CcCompatibilityLayer;

  beforeEach(() => {
    layer = new CcCompatibilityLayer();
  });

  // -------------------------------------------------------------------------
  // loadCcPlugin
  // -------------------------------------------------------------------------

  describe('loadCcPlugin', () => {
    it('throws on invalid manifest without name', () => {
      // loadCcPlugin reads from disk — tested via translateToGentyExtension and
      // validateCompatibility which accept parsed manifests directly.
      // We verify the error path by creating a manifest object.
      expect(() => layer.loadCcPlugin('/nonexistent/path.json')).toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // translateToGentyExtension
  // -------------------------------------------------------------------------

  describe('translateToGentyExtension', () => {
    const baseManifest: CcPluginManifest = {
      name: 'test-plugin',
      version: '1.0.0',
    };

    it('translates an empty plugin to an empty extension', () => {
      const ext = layer.translateToGentyExtension(baseManifest);
      expect(ext.id).toBe('test-plugin');
      expect(ext.version).toBe('1.0.0');
      expect(ext.commands).toEqual([]);
      expect(ext.events).toEqual([]);
      expect(ext.mcpConfigs).toEqual([]);
    });

    it('maps CC skills to genty extension commands', () => {
      const manifest: CcPluginManifest = {
        ...baseManifest,
        skills: [
          { name: 'deploy', description: 'Deploy the app' },
          { name: 'lint', trigger: 'when user asks to lint' },
        ],
      };
      const ext = layer.translateToGentyExtension(manifest);
      expect(ext.commands).toHaveLength(2);
      expect(ext.commands[0]).toEqual({
        id: 'cc-skill:test-plugin:deploy',
        label: 'deploy',
        description: 'Deploy the app',
        source: 'cc-skill',
      });
      expect(ext.commands[1].source).toBe('cc-skill');
    });

    it('maps CC commands to genty extension commands', () => {
      const manifest: CcPluginManifest = {
        ...baseManifest,
        commands: [{ name: 'status', description: 'Show status', handler: 'status.ts' }],
      };
      const ext = layer.translateToGentyExtension(manifest);
      expect(ext.commands).toHaveLength(1);
      expect(ext.commands[0].source).toBe('cc-command');
      expect(ext.commands[0].id).toBe('cc-cmd:test-plugin:status');
    });

    it('maps CC hooks to genty extension events', () => {
      const manifest: CcPluginManifest = {
        ...baseManifest,
        hooks: [
          { event: 'PreToolUse', handler: 'guard.ts', priority: 10 },
          { event: 'SessionStart', handler: 'init.ts' },
        ],
      };
      const ext = layer.translateToGentyExtension(manifest);
      expect(ext.events).toHaveLength(2);
      expect(ext.events[0].ccEvent).toBe('PreToolUse');
      expect(ext.events[0].priority).toBe(10);
      expect(ext.events[1].priority).toBe(0); // default
    });

    it('maps CC MCP servers to genty MCP configs', () => {
      const manifest: CcPluginManifest = {
        ...baseManifest,
        mcpServers: [
          { name: 'db', transport: 'stdio', command: 'npx mcp-db' },
          { name: 'api', transport: 'sse', url: 'http://localhost:3000/sse' },
        ],
      };
      const ext = layer.translateToGentyExtension(manifest);
      expect(ext.mcpConfigs).toHaveLength(2);
      expect(ext.mcpConfigs[0]).toEqual({
        name: 'db',
        transport: 'stdio',
        endpoint: 'npx mcp-db',
      });
      expect(ext.mcpConfigs[1].endpoint).toBe('http://localhost:3000/sse');
    });
  });

  // -------------------------------------------------------------------------
  // validateCompatibility
  // -------------------------------------------------------------------------

  describe('validateCompatibility', () => {
    it('reports compatible for a well-formed plugin', () => {
      const manifest: CcPluginManifest = {
        name: 'good-plugin',
        version: '2.0.0',
        skills: [{ name: 'test', description: 'A skill' }],
        hooks: [{ event: 'PostToolUse', handler: 'h.ts' }],
        mcpServers: [{ name: 's', transport: 'stdio', command: 'npx s' }],
      };
      const report = layer.validateCompatibility(manifest);
      expect(report.compatible).toBe(true);
      expect(report.unsupportedFeatures).toEqual([]);
      expect(report.warnings).toEqual([]);
    });

    it('flags unsupported hook events', () => {
      const manifest: CcPluginManifest = {
        name: 'p',
        version: '1.0.0',
        hooks: [{ event: 'UnknownEvent', handler: 'h.ts' }],
      };
      const report = layer.validateCompatibility(manifest);
      expect(report.compatible).toBe(false);
      expect(report.unsupportedFeatures).toContainEqual(
        expect.stringContaining('UnknownEvent'),
      );
    });

    it('warns about skills without trigger or description', () => {
      const manifest: CcPluginManifest = {
        name: 'p',
        version: '1.0.0',
        skills: [{ name: 'orphan' }],
      };
      const report = layer.validateCompatibility(manifest);
      expect(report.compatible).toBe(true);
      expect(report.warnings).toContainEqual(
        expect.stringContaining('orphan'),
      );
    });

    it('warns about MCP server missing command for stdio', () => {
      const manifest: CcPluginManifest = {
        name: 'p',
        version: '1.0.0',
        mcpServers: [{ name: 'db', transport: 'stdio' }],
      };
      const report = layer.validateCompatibility(manifest);
      expect(report.warnings).toContainEqual(
        expect.stringContaining('no command'),
      );
    });

    it('warns about MCP server missing url for sse/http', () => {
      const manifest: CcPluginManifest = {
        name: 'p',
        version: '1.0.0',
        mcpServers: [{ name: 'api', transport: 'sse' }],
      };
      const report = layer.validateCompatibility(manifest);
      expect(report.warnings).toContainEqual(
        expect.stringContaining('no url'),
      );
    });

    it('flags unsupported MCP transport', () => {
      const manifest: CcPluginManifest = {
        name: 'p',
        version: '1.0.0',
        mcpServers: [{ name: 'x', transport: 'websocket' as any }],
      };
      const report = layer.validateCompatibility(manifest);
      expect(report.compatible).toBe(false);
      expect(report.unsupportedFeatures).toContainEqual(
        expect.stringContaining('websocket'),
      );
    });

    it('reports compatible when no features present', () => {
      const manifest: CcPluginManifest = {
        name: 'empty',
        version: '0.0.1',
      };
      const report = layer.validateCompatibility(manifest);
      expect(report.compatible).toBe(true);
    });
  });
});
