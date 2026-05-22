import { describe, expect, it } from 'vitest';
import {
  getHostDetectionRules,
  getHostMetadataFields,
  getHostSignalMap,
} from '@a5c-ai/agent-catalog';
import { detectHostHarness } from '../src/host-detection.js';

function envForSignals(signals: readonly string[]): NodeJS.ProcessEnv {
  return Object.fromEntries(signals.map((signal) => [signal, `${signal.toLowerCase()}-value`]));
}

describe('agent-mux host detection contract', () => {
  it('detects every graph-backed host signal mapping through the consumer boundary', () => {
    for (const [agent, signals] of Object.entries(getHostSignalMap())) {
      const signal = signals[0];
      expect(signal, `Expected at least one host signal for ${agent}`).toBeTruthy();

      const result = detectHostHarness({ env: envForSignals([signal!]), argv: [] });

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        agent,
        source: 'env',
        confidence: 'medium',
        matchedSignals: [signal],
      });
    }
  });

  it('extracts metadata fields exactly from the graph-declared env bindings', () => {
    for (const [agent, fields] of Object.entries(getHostMetadataFields())) {
      const signal = getHostSignalMap()[agent]?.[0];
      if (!signal || fields.length === 0) {
        continue;
      }

      const env: NodeJS.ProcessEnv = { [signal]: `${signal.toLowerCase()}-value` };
      const expected: Record<string, string> = {};

      for (const field of fields) {
        const envVar = field.envVars[0];
        expect(envVar, `Expected at least one env var for ${agent}.${field.key}`).toBeTruthy();
        const value = `${agent}-${field.key}`;
        env[envVar!] = value;
        expected[field.key] = value;
      }

      const result = detectHostHarness({ env, argv: [] });

      expect(result?.agent).toBe(agent);
      expect(result?.metadata).toEqual(expected);
    }
  });

  it('falls back to graph-backed argv needles when env signals are absent', () => {
    const rulesWithArgvFallback = getHostDetectionRules().filter(
      (rule) => rule.argvMatches.length > 0,
    );
    expect(rulesWithArgvFallback.length).toBeGreaterThan(0);

    for (const rule of rulesWithArgvFallback) {
      const needle = rule.argvMatches[0];

      const result = detectHostHarness({
        env: {},
        argv: ['/usr/bin/node', `/tmp/${needle}`],
      });

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        agent: rule.agent,
        source: 'argv',
        confidence: 'low',
        matchedSignals: [needle],
      });
    }
  });
});
