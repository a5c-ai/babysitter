import React from 'react';

import { genericToolRenderer } from './generic.js';
import type { ToolCallRenderer } from '../registry.js';

export const bashRenderer: ToolCallRenderer = {
  ...genericToolRenderer,
  id: 'bash',
  priority: 99,
  match: ({ toolName }) => /bash|shell|exec_command|terminal/i.test(toolName),
};
