import React from 'react';
import { View } from 'react-native';

import { classifyTool, type AgentName } from '@a5c-ai/agent-mux-comm/browser';

import { Card } from '../primitives/Card.js';
import { Text } from '../primitives/Text.js';
import { registerBuiltInToolCallRenderers } from './builtins.js';
import { resolveToolCallRenderer } from './registry.js';

export function ToolCallCard(props: {
  agent: AgentName;
  toolName: string;
  input?: unknown;
  expanded?: boolean;
}): JSX.Element {
  registerBuiltInToolCallRenderers();
  const renderer = resolveToolCallRenderer(props.agent, props.toolName, props.input);
  const classification = classifyTool(props.agent, props.toolName, props.input);
  const body = props.expanded
    ? renderer.expanded({
        agent: props.agent,
        toolName: props.toolName,
        input: props.input,
        classification,
      })
    : renderer.compact({
        agent: props.agent,
        toolName: props.toolName,
        input: props.input,
        classification,
      });
  return (
    <Card>
      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: '700' }}>{props.toolName}</Text>
        {body}
      </View>
    </Card>
  );
}
