import React from 'react';

import { genericToolRenderer } from './generic.js';
import type { ToolCallRenderer } from '../registry.js';

export const webSearchRenderer: ToolCallRenderer = {
  ...genericToolRenderer,
  id: 'web-search',
  priority: 94,
  match: ({ toolName }) => /search/i.test(toolName) && /web|browser/i.test(toolName),
};
