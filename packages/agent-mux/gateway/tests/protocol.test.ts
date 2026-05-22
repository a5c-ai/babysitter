import { describe, expect, it } from 'vitest';

import {
  GATEWAY_CLOSE_CODES,
  GatewayProtocolError,
  decodeFrame,
  encodeFrame,
} from '../src/index.js';

describe('gateway protocol frames', () => {
  it('roundtrips valid frames', () => {
    const encoded = encodeFrame({
      type: 'hello',
      protocolVersions: ['1'],
      serverVersion: '0.0.0',
      serverTime: '2026-01-01T00:00:00.000Z',
    });
    expect(decodeFrame(encoded)).toEqual({
      type: 'hello',
      protocolVersions: ['1'],
      serverVersion: '0.0.0',
      serverTime: '2026-01-01T00:00:00.000Z',
    });
  });

  it('throws typed invalid-frame errors for malformed input', () => {
    expect(() => decodeFrame('{')).toThrowError(GatewayProtocolError);
    try {
      decodeFrame('{');
    } catch (error) {
      expect((error as GatewayProtocolError).closeCode).toBe(GATEWAY_CLOSE_CODES.invalidFrame);
    }
  });
});
