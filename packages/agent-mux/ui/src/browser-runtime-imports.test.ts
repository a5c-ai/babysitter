import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcRoot = path.dirname(fileURLToPath(import.meta.url));
const runtimeImportFiles = [
  'components/event-cards/ToolCallCard.tsx',
  'components/event-cards/ToolResultCard.tsx',
  'components/event-cards/registry.ts',
  'components/HookApprovalPrompt.tsx',
];

describe('agent-mux-ui browser runtime imports', () => {
  it('loads classifyTool from the browser-safe core entry', () => {
    for (const relativePath of runtimeImportFiles) {
      const source = fs.readFileSync(path.join(srcRoot, relativePath), 'utf8');
      expect(source).toContain("@a5c-ai/agent-mux-core/browser");
      expect(source).not.toContain("@a5c-ai/agent-mux-core';");
    }
  });
});
