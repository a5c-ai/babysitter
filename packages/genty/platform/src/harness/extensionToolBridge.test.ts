import { describe, it, expect } from 'vitest';
import { ExtensionRegistry } from '@a5c-ai/genty-core/extensions';
import { bridgeExtensionTools } from './extensionToolBridge.js';

describe('extensionToolBridge', () => {
  it('bridges extension tools to genty-core CustomToolDefinition format', async () => {
    const registry = new ExtensionRegistry();
    await registry.activate({
      name: 'test-ext',
      activate(ctx) {
        ctx.registerTool({
          name: 'greet',
          description: 'Greets a user',
          inputSchema: { type: 'object', properties: { name: { type: 'string' } } },
          handler: async (input: Record<string, unknown>) => `Hello ${input.name}!`,
        });
      },
    });

    const tools = bridgeExtensionTools(registry);
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('ext:test-ext:greet');
    expect(tools[0].label).toBe('ext:test-ext:greet');
    expect(tools[0].description).toBe('Greets a user');
    // Bridged tools now carry a concrete TypeBox parameter schema so they can
    // flow through the unified agent-core tool-calling loop.
    expect(tools[0].parameters).toMatchObject({ type: 'object' });

    // CustomToolDefinition.execute takes (toolCallId, params, ...) and resolves
    // to a ToolResult.
    const result = await tools[0].execute('call-1', { name: 'World' });
    expect((result as { content: Array<{ text: string }> }).content[0].text).toBe('Hello World!');
  });

  it('wraps handler errors gracefully', async () => {
    const registry = new ExtensionRegistry();
    await registry.activate({
      name: 'err-ext',
      activate(ctx) {
        ctx.registerTool({
          name: 'fail',
          description: 'Always fails',
          inputSchema: {},
          handler: async () => { throw new Error('boom'); },
        });
      },
    });

    const tools = bridgeExtensionTools(registry);
    const result = await tools[0].execute('call-1', {});
    expect((result as { content: Array<{ text: string }> }).content[0].text).toContain('Extension tool error: boom');
  });

  it('returns empty array for registry with no tools', () => {
    const registry = new ExtensionRegistry();
    expect(bridgeExtensionTools(registry)).toEqual([]);
  });
});
