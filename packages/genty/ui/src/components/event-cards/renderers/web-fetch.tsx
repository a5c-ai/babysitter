import React from 'react';

import { genericToolRenderer } from './generic.js';
import type { ToolCallRenderer } from '../registry.js';

export const webFetchRenderer: ToolCallRenderer = {
  ...genericToolRenderer,
  id: 'web-fetch',
  priority: 94,
  match: ({ toolName }) => /fetch/i.test(toolName),
};
