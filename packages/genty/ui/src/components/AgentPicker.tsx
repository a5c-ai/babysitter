import React from 'react';
import { View } from 'react-native';

import { Button } from './primitives/Button.js';

export function AgentPicker(props: {
  agents: string[];
  selected?: string;
  onSelect: (agent: string) => void;
}): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {props.agents.map((agent) => (
        <Button key={agent} label={agent === props.selected ? `${agent} *` : agent} onPress={() => props.onSelect(agent)} />
      ))}
    </View>
  );
}
