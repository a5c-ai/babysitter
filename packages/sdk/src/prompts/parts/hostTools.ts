import type { HostToolDescriptor, PromptContext } from '../types';

/**
 * Renders the optional host-native tool inventory for process authors.
 */
export function renderHostTools(ctx: PromptContext): string {
  const hostTools = normalizeHostTools(ctx.hostTools);
  if (hostTools.length === 0) return '';

  const lines = [
    '## Host-Native Tools',
    '',
    `The current host (\`${ctx.harnessLabel}\`) advertises these native tools through \`AGENT_CAPABILITIES_JSON\`. These are available in the host session and are separate from external agent dispatch.`,
    '',
    ...hostTools.map(renderTool),
    '',
    'Use host-native tools for work they directly cover. Use external agents for capabilities missing from the host inventory, specialized model coverage, independent review, or parallel work.',
  ];

  return lines.join('\n');
}

function normalizeHostTools(hostTools: PromptContext['hostTools']): HostToolDescriptor[] {
  if (!Array.isArray(hostTools)) return [];

  return hostTools
    .filter((tool): tool is HostToolDescriptor => {
      return Boolean(tool) && typeof tool.name === 'string' && tool.name.trim() !== '';
    })
    .map((tool) => ({
      ...tool,
      name: tool.name.trim(),
    }));
}

function renderTool(tool: HostToolDescriptor): string {
  const details = [tool.category, tool.availability]
    .filter(Boolean)
    .join(', ');
  const label = details ? `\`${tool.name}\` (${details})` : `\`${tool.name}\``;
  return tool.description ? `- ${label}: ${tool.description}` : `- ${label}`;
}
