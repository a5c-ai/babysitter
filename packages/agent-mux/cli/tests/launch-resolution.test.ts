import { describe, it, expect, afterEach } from 'vitest';
import { resolveLaunchPlan } from '../src/commands/launch.js';

describe('resolveLaunchPlan', () => {
  const originalEnv = { ...process.env };
  afterEach(() => { process.env = { ...originalEnv }; });

  it('claude + anthropic: no proxy needed', () => {
    const plan = resolveLaunchPlan({
      harness: 'claude',
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      apiKey: 'sk-ant-test',
      proxyMode: 'if-needed',
    });
    expect(plan.proxyNeeded).toBe(false);
    expect(plan.env['ANTHROPIC_API_KEY']).toBe('sk-ant-test');
  });

  it('codex + bedrock: proxy needed', () => {
    const plan = resolveLaunchPlan({
      harness: 'codex',
      provider: 'bedrock',
      model: 'anthropic.claude-sonnet-4-20250514-v1:0',
      region: 'us-east-1',
      proxyMode: 'if-needed',
    });
    expect(plan.proxyNeeded).toBe(true);
    expect(plan.proxy!.exposedTransport).toBe('openai-responses');
    expect(plan.proxy!.targetProvider).toBe('bedrock');
  });

  it('codex + bedrock + no-proxy: throws', () => {
    expect(() => resolveLaunchPlan({
      harness: 'codex',
      provider: 'bedrock',
      model: 'x',
      proxyMode: 'never',
    })).toThrow(/proxy/i);
  });

  it('claude + bedrock: no proxy (native)', () => {
    const plan = resolveLaunchPlan({
      harness: 'claude',
      provider: 'bedrock',
      region: 'us-east-1',
      proxyMode: 'if-needed',
    });
    expect(plan.proxyNeeded).toBe(false);
    expect(plan.env['CLAUDE_CODE_USE_BEDROCK']).toBe('1');
  });

  it('force proxy even when native', () => {
    const plan = resolveLaunchPlan({
      harness: 'claude',
      provider: 'anthropic',
      apiKey: 'test',
      proxyMode: 'always',
    });
    expect(plan.proxyNeeded).toBe(true);
  });

  it('gemini + vertex: no proxy needed', () => {
    const plan = resolveLaunchPlan({
      harness: 'gemini',
      provider: 'vertex',
      project: 'my-project',
      region: 'us-central1',
      proxyMode: 'if-needed',
    });
    expect(plan.proxyNeeded).toBe(false);
    expect(plan.env['GOOGLE_GENAI_USE_VERTEXAI']).toBe('True');
  });

  it('claude + vertex Gemini uses transport-mux with Google proxy settings', () => {
    const plan = resolveLaunchPlan({
      harness: 'claude',
      provider: 'vertex',
      model: 'gemini-3.1-pro-preview',
      apiKey: 'google-test-key',
      project: 'google-project',
      region: 'global',
      proxyMode: 'if-needed',
    });

    expect(plan.proxyNeeded).toBe(true);
    expect(plan.proxy?.targetProvider).toBe('vertex');
    expect(plan.proxy?.targetModel).toBe('gemini-3.1-pro-preview');
    expect(plan.proxy?.exposedTransport).toBe('anthropic');
    expect(plan.proxy?.apiKey).toBe('google-test-key');
    expect(plan.proxy?.project).toBe('google-project');
    expect(plan.proxy?.location).toBe('global');
    expect(plan.proxy?.useVertexAi).toBe(true);
  });

  it('claude + foundry: proxies through anthropic transport', () => {
    const plan = resolveLaunchPlan({
      harness: 'claude',
      provider: 'foundry',
      model: 'gpt-5.5',
      apiKey: 'az-test',
      apiBase: 'https://foundry.example.test',
      proxyMode: 'if-needed',
    });
    expect(plan.proxyNeeded).toBe(true);
    expect(plan.proxy?.targetProvider).toBe('foundry');
    expect(plan.proxy?.targetModel).toBe('gpt-5.5');
    expect(plan.proxy?.exposedTransport).toBe('anthropic');
    expect(plan.env['AZURE_API_KEY']).toBeUndefined();
  });

  it('claude + openai: proxy needed with anthropic transport', () => {
    const plan = resolveLaunchPlan({
      harness: 'claude',
      provider: 'openai',
      apiKey: 'sk-openai',
      proxyMode: 'if-needed',
    });
    expect(plan.proxyNeeded).toBe(true);
    expect(plan.proxy?.exposedTransport).toBe('anthropic');
  });

  it('opencode + anthropic: no proxy (native SDK)', () => {
    process.env['ANTHROPIC_API_KEY'] = 'sk-ant';
    const plan = resolveLaunchPlan({
      harness: 'opencode',
      provider: 'anthropic',
      proxyMode: 'if-needed',
    });
    expect(plan.proxyNeeded).toBe(false);
    expect(plan.env['OPENCODE_CONFIG_CONTENT']).toBeTruthy();
  });
});
