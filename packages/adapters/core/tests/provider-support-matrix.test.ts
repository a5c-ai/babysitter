import { describe, it, expect } from 'vitest';
import {
  isNativelySupported,
  getRequiredProxyTransport,
  isTransportCompatible,
} from '../src/provider-support-matrix.js';

describe('provider support matrix', () => {
  it('claude supports anthropic natively', () => {
    expect(isNativelySupported('claude', 'anthropic')).toBe(true);
  });
  it('claude supports bedrock natively', () => {
    expect(isNativelySupported('claude', 'bedrock')).toBe(true);
  });
  it('claude supports vertex natively', () => {
    expect(isNativelySupported('claude', 'vertex')).toBe(true);
  });
  it('claude does NOT support openai natively', () => {
    expect(isNativelySupported('claude', 'openai')).toBe(false);
  });
  it('codex supports openai natively', () => {
    expect(isNativelySupported('codex', 'openai')).toBe(true);
  });
  it('codex supports ollama natively', () => {
    expect(isNativelySupported('codex', 'ollama')).toBe(true);
  });
  it('codex does NOT support bedrock natively', () => {
    expect(isNativelySupported('codex', 'bedrock')).toBe(false);
  });
  it('gemini supports google natively', () => {
    expect(isNativelySupported('gemini', 'google')).toBe(true);
  });
  it('gemini supports vertex natively', () => {
    expect(isNativelySupported('gemini', 'vertex')).toBe(true);
  });
  it('proxy transport for codex targeting bedrock is openai-responses', () => {
    expect(getRequiredProxyTransport('codex', 'bedrock')).toBe('openai-responses');
  });
  it('proxy transport for claude targeting openai is anthropic', () => {
    expect(getRequiredProxyTransport('claude', 'openai')).toBe('anthropic');
  });
  it('proxy transport for gemini targeting anthropic is google', () => {
    expect(getRequiredProxyTransport('gemini', 'anthropic')).toBe('google');
  });
  it('returns null proxy transport when natively supported', () => {
    expect(getRequiredProxyTransport('claude', 'anthropic')).toBeNull();
  });
  it('opencode is transport-compatible with deepseek', () => {
    expect(isTransportCompatible('opencode', 'deepseek')).toBe(true);
  });
  it('claude is not transport-compatible with openai', () => {
    expect(isTransportCompatible('claude', 'openai')).toBe(false);
  });
});
