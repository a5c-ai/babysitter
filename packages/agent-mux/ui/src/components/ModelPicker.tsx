import React from 'react';
import { View } from 'react-native';

import { Button } from './primitives/Button.js';

export function ModelPicker(props: {
  models: string[];
  selected?: string;
  onSelect: (model: string) => void;
}): JSX.Element {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {props.models.map((model) => (
        <Button key={model} label={model === props.selected ? `${model} *` : model} onPress={() => props.onSelect(model)} />
      ))}
    </View>
  );
}
