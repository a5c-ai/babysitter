import React, { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button } from './primitives/Button.js';

export function InputBar(props: {
  onSubmit: (value: string) => void;
  voiceSlot?: React.ReactNode;
}): JSX.Element {
  const [value, setValue] = useState('');
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
      <TextInput value={value} onChangeText={setValue} style={{ flex: 1, minHeight: 42, borderWidth: 1, paddingHorizontal: 12 }} />
      <Button label="Send" onPress={() => props.onSubmit(value)} />
      {props.voiceSlot ?? null}
    </View>
  );
}
