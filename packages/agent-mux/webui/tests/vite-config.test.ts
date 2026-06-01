import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import config from '../vite.config';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const expectedCatalogAlias = path.resolve(packageRoot, '..', '..', '..', 'atlas', 'src', 'catalog', 'index.ts');
const expectedCoreAlias = path.resolve(packageRoot, '..', '..', 'core', 'src', 'index.ts');
const expectedCoreBrowserAlias = path.resolve(packageRoot, '..', '..', 'core', 'src', 'browser.ts');

describe('agent-mux webui vite config', () => {
  it('resolves agent catalog imports to workspace source during dev', () => {
    const aliases = config.resolve?.alias;
    expect(aliases).toBeTruthy();
    expect(aliases && typeof aliases === 'object' ? aliases['@a5c-ai/atlas/catalog'] : undefined).toBe(expectedCatalogAlias);
    expect(aliases && typeof aliases === 'object' ? aliases['@a5c-ai/agent-comm-mux'] : undefined).toBe(expectedCoreAlias);
    expect(aliases && typeof aliases === 'object' ? aliases['@a5c-ai/agent-comm-mux/browser'] : undefined).toBe(expectedCoreBrowserAlias);
  });
});
