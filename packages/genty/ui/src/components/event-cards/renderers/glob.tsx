import React from 'react';

import { genericToolRenderer } from './generic.js';
import type { ToolCallRenderer } from '../registry.js';

export const globRenderer: ToolCallRenderer = {
  ...genericToolRenderer,
  id: 'glob',
  priority: 91,
  match: ({ toolName }) => /glob|ls|find/i.test(toolName),
};
