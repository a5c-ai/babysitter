import React from 'react';

import { genericToolRenderer } from './generic.js';
import type { ToolCallRenderer } from '../registry.js';

export const editRenderer: ToolCallRenderer = {
  ...genericToolRenderer,
  id: 'edit',
  priority: 93,
  match: ({ toolName }) => /edit|patch|replace/i.test(toolName),
};
