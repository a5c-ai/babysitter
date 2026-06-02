import * as fs from 'node:fs';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { KNOWN_ADAPTERS } from '../cli/adapter-loader';

describe('hooks-mux CLI packaging', () => {
  it('declares built-in adapter packages as runtime dependencies', () => {
    const packageJsonPath = path.resolve(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    const dependencies = packageJson.dependencies ?? {};

    for (const adapterName of KNOWN_ADAPTERS) {
      expect(dependencies[`@a5c-ai/agent-mux-hooks-adapter-${adapterName}`]).toBeTruthy();
    }
  });
});
