import React from 'react';
import { View } from 'react-native';

import { Text } from './primitives/Text.js';

export function CostMeter(props: { totalUsd: number }): JSX.Element {
  return (
    <View>
      <Text>{`Cost $${props.totalUsd.toFixed(4)}`}</Text>
    </View>
  );
}
