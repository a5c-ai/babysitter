import React from 'react';

import { Card, Text } from '@a5c-ai/genty-ui';

export function BigCostChip(props: { totalUsd: number }): JSX.Element {
  return (
    <Card>
      <Text>{props.totalUsd.toFixed(2)} USD</Text>
    </Card>
  );
}
