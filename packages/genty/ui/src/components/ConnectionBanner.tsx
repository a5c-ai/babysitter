import React from 'react';

import { Card } from './primitives/Card.js';
import { Text } from './primitives/Text.js';

export function ConnectionBanner(props: { status: string; error?: string | null }): JSX.Element | null {
  if (props.status === 'connected' && !props.error) return null;
  return (
    <Card>
      <Text>{props.error ?? props.status}</Text>
    </Card>
  );
}
