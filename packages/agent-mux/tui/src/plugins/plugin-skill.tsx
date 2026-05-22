import React from 'react';
import { Text } from 'ink';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import { definePlugin } from '../plugin.js';

export function PluginLoadedRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'plugin_loaded') return null;
  return (
    <Text>
      <Text color="blue">⚙ plugin_loaded </Text>
      <Text>{event.pluginName}</Text>
      <Text dimColor> v{event.version} [{event.pluginId}]</Text>
    </Text>
  );
}

export function PluginInvokedRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'plugin_invoked') return null;
  return (
    <Text>
      <Text color="blue">⚙ plugin_invoked </Text>
      <Text>{event.pluginName}</Text>
      <Text dimColor> [{event.pluginId}]</Text>
    </Text>
  );
}

export function PluginErrorRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'plugin_error') return null;
  return (
    <Text color="red">
      ⚙ plugin_error {event.pluginName}: {event.error}
    </Text>
  );
}

export function SkillLoadedRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'skill_loaded') return null;
  return (
    <Text>
      <Text color="cyan">✦ skill_loaded </Text>
      <Text>{event.skillName}</Text>
      <Text dimColor> ({event.source})</Text>
    </Text>
  );
}

export function SkillInvokedRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'skill_invoked') return null;
  return (
    <Text>
      <Text color="cyan">✦ skill_invoked </Text>
      <Text>{event.skillName}</Text>
    </Text>
  );
}

export function AgentdocReadRenderer({ event }: { event: AgentEvent }) {
  if (event.type !== 'agentdoc_read') return null;
  return (
    <Text dimColor>
      📄 agentdoc_read {event.path}
    </Text>
  );
}

export default definePlugin({
  name: 'builtin:plugin-skill',
  register(ctx) {
    ctx.registerEventRenderer({ id: 'plugin-loaded', match: (ev) => ev.type === 'plugin_loaded', component: PluginLoadedRenderer });
    ctx.registerEventRenderer({ id: 'plugin-invoked', match: (ev) => ev.type === 'plugin_invoked', component: PluginInvokedRenderer });
    ctx.registerEventRenderer({ id: 'plugin-error', match: (ev) => ev.type === 'plugin_error', component: PluginErrorRenderer });
    ctx.registerEventRenderer({ id: 'skill-loaded', match: (ev) => ev.type === 'skill_loaded', component: SkillLoadedRenderer });
    ctx.registerEventRenderer({ id: 'skill-invoked', match: (ev) => ev.type === 'skill_invoked', component: SkillInvokedRenderer });
    ctx.registerEventRenderer({ id: 'agentdoc-read', match: (ev) => ev.type === 'agentdoc_read', component: AgentdocReadRenderer });
  },
});
