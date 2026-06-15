import React from 'react';

import { genericToolRenderer } from './generic.js';
import type { ToolCallRenderer } from '../registry.js';

export const grepRenderer: ToolCallRenderer = {
  ...genericToolRenderer,
  id: 'grep',
  priority: 91,
  match: ({ toolName }) => /grep|search/i.test(toolName),
};
