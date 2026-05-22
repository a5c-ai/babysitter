import React from 'react';

import { Card } from './primitives/Card.js';
import { Text } from './primitives/Text.js';

export function RunStatusBadge(props: { status: string }): JSX.Element {
  return (
    <Card>
      <Text>{props.status}</Text>
    </Card>
  );
}
