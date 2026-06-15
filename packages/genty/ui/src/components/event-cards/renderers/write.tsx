import React from 'react';

import { genericToolRenderer } from './generic.js';
import type { ToolCallRenderer } from '../registry.js';

export const writeRenderer: ToolCallRenderer = {
  ...genericToolRenderer,
  id: 'write',
  priority: 92,
  match: ({ toolName }) => /write|create/i.test(toolName),
};
