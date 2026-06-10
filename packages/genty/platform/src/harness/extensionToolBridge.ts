import type { CustomToolDefinition, ToolResult } from "@a5c-ai/genty-core";
import type { ExtensionRegistry } from '@a5c-ai/genty-core/extensions';
import { Type, type TObject } from '@sinclair/typebox';

/**
 * Bridges extension-registered tools into genty-core {@link CustomToolDefinition}s
 * so they flow through the agent-core tool-calling loop alongside built-in
 * custom tools. Extension tools expose a loose `inputSchema`
 * (`Record<string, unknown>`); we coerce it into a permissive TypeBox object so
 * the unified tool surface has a concrete parameter schema.
 */
export function bridgeExtensionTools(registry: ExtensionRegistry): CustomToolDefinition[] {
  return registry.getAllTools().map((extTool) => ({
    name: extTool.name,
    label: extTool.name,
    description: extTool.description,
    parameters: toToolParameters(extTool.inputSchema),
    execute: async (
      _toolCallId: string,
      params: Record<string, unknown>,
    ): Promise<ToolResult> => {
      try {
        const result = await extTool.handler(params);
        return {
          content: [{ type: 'text' as const, text: typeof result === 'string' ? result : JSON.stringify(result) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text' as const, text: `Extension tool error: ${message}` }],
        };
      }
    },
  }));
}

/**
 * Coerce an extension tool's loose JSON-schema-ish `inputSchema` into a TypeBox
 * `TObject`. Extension schemas are already JSON Schema fragments, so we wrap
 * them in a permissive object that carries the original schema's `properties`
 * when present and otherwise accepts arbitrary properties.
 */
function toToolParameters(inputSchema: Record<string, unknown>): TObject {
  const properties =
    inputSchema && typeof inputSchema === 'object' && inputSchema.type === 'object'
      ? (inputSchema.properties as Record<string, never> | undefined)
      : undefined;
  if (properties) {
    return Type.Object(properties, { additionalProperties: true });
  }
  return Type.Object({}, { additionalProperties: true });
}
