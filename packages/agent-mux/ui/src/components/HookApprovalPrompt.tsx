import React from 'react';
import { View } from 'react-native';

import { classifyTool, type AgentName } from '@a5c-ai/agent-mux-core/browser';

import { Button } from './primitives/Button.js';
import { Card } from './primitives/Card.js';
import { Text } from './primitives/Text.js';
import { registerBuiltInToolCallRenderers } from './event-cards/builtins.js';
import { resolveToolCallRenderer } from './event-cards/registry.js';

export function HookApprovalPrompt(props: {
  agent: AgentName;
  toolName: string;
  input?: unknown;
  secondsRemaining: number;
  onAllow: () => void;
  onDeny: () => void;
  onModify?: () => void;
}): JSX.Element {
  registerBuiltInToolCallRenderers();
  const renderer = resolveToolCallRenderer(props.agent, props.toolName, props.input);
  const classification = classifyTool(props.agent, props.toolName, props.input);
  return (
    <Card>
      <View style={{ gap: 12 }}>
        <Text style={{ fontWeight: '700' }}>Hook Approval</Text>
        <Text>{`Decision in ${props.secondsRemaining}s`}</Text>
        {renderer.approvalPreview({
          agent: props.agent,
          toolName: props.toolName,
          input: props.input,
          classification,
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Button label="Allow" onPress={props.onAllow} />
        <Button label="Deny" onPress={props.onDeny} />
        {props.onModify ? <Button label="Modify" onPress={props.onModify} /> : null}
      </View>
    </Card>
  );
}
