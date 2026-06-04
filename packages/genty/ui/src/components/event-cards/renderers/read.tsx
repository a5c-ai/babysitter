import React from 'react';

import { genericToolRenderer } from './generic.js';
import type { ToolCallRenderer } from '../registry.js';

export const readRenderer: ToolCallRenderer = {
  ...genericToolRenderer,
  id: 'read',
  priority: 90,
  match: ({ toolName }) => /read|cat|view/i.test(toolName),
};
