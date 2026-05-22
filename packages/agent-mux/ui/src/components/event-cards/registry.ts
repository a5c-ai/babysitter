import { classifyTool, type AgentName, type ToolClassification } from '@a5c-ai/agent-mux-core/browser';

import type { ReactNode } from 'react';

export interface ToolCardRendererProps {
  agent: AgentName;
  toolName: string;
  input?: unknown;
  output?: unknown;
  classification: ToolClassification;
}

export interface ToolCallRenderer {
  id: string;
  priority: number;
  match(props: { toolName: string; classification: ToolClassification }): boolean;
  compact(props: ToolCardRendererProps): ReactNode;
  expanded(props: ToolCardRendererProps): ReactNode;
  approvalPreview(props: ToolCardRendererProps): ReactNode;
}

const registry: ToolCallRenderer[] = [];

export function registerToolCallRenderer(renderer: ToolCallRenderer): void {
  const existing = registry.findIndex((entry) => entry.id === renderer.id);
  if (existing >= 0) registry.splice(existing, 1);
  registry.push(renderer);
  registry.sort((left, right) => right.priority - left.priority);
}

export function listToolCallRenderers(): readonly ToolCallRenderer[] {
  return registry;
}

export function resolveToolCallRenderer(agent: AgentName, toolName: string, input?: unknown): ToolCallRenderer {
  const classification = classifyTool(agent, toolName, input);
  const matched = registry.find((renderer) => renderer.match({ toolName, classification }));
  if (!matched) {
    throw new Error('No tool-call renderer registered. Register generic last.');
  }
  return matched;
}

export function resetToolCallRenderers(): void {
  registry.splice(0, registry.length);
}
