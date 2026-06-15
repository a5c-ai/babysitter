import React from 'react';

import { Card } from '../primitives/Card.js';
import { Text } from '../primitives/Text.js';

export function ThinkingBubble(props: { thinking: string }): JSX.Element {
  return (
    <Card>
      <Text>{props.thinking}</Text>
    </Card>
  );
}
