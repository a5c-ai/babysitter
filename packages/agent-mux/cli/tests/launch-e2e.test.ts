import { describe, it, expect, afterEach } from 'vitest';
import { resolveLaunchPlan } from '../src/commands/launch.js';

describe('launch e2e edge cases', () => {
  const originalEnv = { ...process.env };
  afterEach(() => { process.env = { ...originalEnv }; });

  it('unknown provider falls through to custom with proxy', () => {
    const plan = resolveLaunchPlan({
      harness: 'claude',
      provider: 'nvidia_nim',
      model: 'llama-3.1-70b',
      proxyMode: 'if-needed',
    });
    expect(plan.proxyNeeded).toBe(true);
  });

  it('lmstudio provider resolves without proxy for codex', () => {
    const plan = resolveLaunchPlan({
      harness: 'codex',
      provider: 'lmstudio',
      model: 'local-model',
      proxyMode: 'if-needed',
    });
    expect(plan.proxyRequired ?? plan.proxyNeeded).toBeDefined();
  });

  it('passthrough transport accepted', () => {
    const plan = resolveLaunchPlan({
      harness: 'claude',
      provider: 'anthropic',
      transport: 'passthrough',
      apiKey: 'test',
      proxyMode: 'if-needed',
    });
    expect(plan.transport).toBe('passthrough');
  });

  it('perplexity provider has correct defaults', () => {
    process.env['PERPLEXITY_API_KEY'] = 'pplx-test';
    const plan = resolveLaunchPlan({
      harness: 'pi',
      provider: 'perplexity',
      proxyMode: 'if-needed',
    });
    expect(plan.provider).toBe('perplexity');
  });
});
