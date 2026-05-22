import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('triggers action metadata', () => {
  it('builds the local triggers package and runs amux through the sdk binary', async () => {
    const actionPath = join(packageDir, 'action.yml');
    const action = parse(await readFile(actionPath, 'utf8')) as any;
    const serializedSteps = JSON.stringify(action.runs.steps);

    expect(action.name).toBe('Agent Mux');
    expect(action.inputs['trigger-query']).toBeDefined();
    expect(action.inputs['pre-run']).toBeDefined();
    expect(action.inputs['post-run']).toBeDefined();
    expect(action.inputs['args-json'].description).toContain('JSON string array');
    expect(serializedSteps).toContain('npm install -g');
    expect(serializedSteps).toContain('amux');
    expect(serializedSteps).toContain('triggers');
    expect(serializedSteps).toContain('INPUT_ARGS_JSON');
    expect(serializedSteps).toContain('args-json must be a JSON array');
  });
});
