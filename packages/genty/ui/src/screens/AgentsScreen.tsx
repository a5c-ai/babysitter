import React from 'react';
import { View } from 'react-native';

import { useAgents } from '../hooks/useAgents.js';
import { AgentPicker } from '../components/AgentPicker.js';

export function AgentsScreen(props: { selected?: string; onSelect: (agent: string) => void }): JSX.Element {
  const agents = useAgents();
  return (
    <View>
      <AgentPicker agents={agents} selected={props.selected} onSelect={props.onSelect} />
    </View>
  );
}
