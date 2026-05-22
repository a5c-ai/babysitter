import React from 'react';

import { Card } from '../../primitives/Card.js';
import { Text } from '../../primitives/Text.js';
import type { ToolCallRenderer } from '../registry.js';

function renderBlock(label: string, body: string, destructive: boolean): JSX.Element {
  return (
    <Card>
      <Text style={{ fontWeight: '700', color: destructive ? '#b91c1c' : undefined }}>{label}</Text>
      <Text>{body}</Text>
    </Card>
  );
}

export const genericToolRenderer: ToolCallRenderer = {
  id: 'generic',
  priority: 0,
  match: () => true,
  compact(props) {
    return renderBlock(props.toolName, stringify(props.input), props.classification.destructive);
  },
  expanded(props) {
    return renderBlock(props.toolName, `${stringify(props.input)}\n${stringify(props.output)}`, props.classification.destructive);
  },
  approvalPreview(props) {
    return renderBlock(`Approve ${props.toolName}?`, stringify(props.input), props.classification.destructive);
  },
};

function stringify(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
