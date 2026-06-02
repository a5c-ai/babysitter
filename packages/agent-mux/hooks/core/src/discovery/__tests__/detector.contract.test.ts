import { describe, expect, it } from 'vitest';
import { getHooksMuxDetectionRules } from '@a5c-ai/atlas/catalog';
import { detectHarness } from '../detector';

function envForSignals(signals: readonly string[]): Record<string, string> {
  return Object.fromEntries(signals.map((signal) => [signal, `${signal.toLowerCase()}-value`]));
}

describe('hooks-mux catalog detection contract', () => {
  it('honors every graph-backed discovery rule exported by agent-catalog', () => {
    for (const rule of getHooksMuxDetectionRules()) {
      const signal = rule.signals[0];
      expect(signal, `Expected at least one signal for ${rule.adapter}`).toBeTruthy();

      const result = detectHarness(envForSignals([signal!]));

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        adapter: rule.adapter,
        confidence: rule.confidence,
      });
      expect(result?.evidence).toEqual([signal]);
    }
  });

  it('returns every present graph signal as evidence for the selected rule', () => {
    for (const rule of getHooksMuxDetectionRules()) {
      const result = detectHarness(envForSignals(rule.signals));

      expect(result).not.toBeNull();
      expect(result?.adapter).toBe(rule.adapter);
      expect(result?.evidence).toEqual(rule.signals);
    }
  });

  it('respects absentSignals guards declared in the catalog', () => {
    for (const rule of getHooksMuxDetectionRules().filter((entry) => entry.absentSignals?.length)) {
      const env = envForSignals([rule.signals[0]!, rule.absentSignals![0]!]);
      const result = detectHarness(env);

      expect(result?.adapter).not.toBe(rule.adapter);
    }
  });
});
