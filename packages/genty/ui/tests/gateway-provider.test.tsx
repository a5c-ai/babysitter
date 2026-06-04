/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GatewayClientDisconnectedError } from '../src/client/errors.js';
import { GatewayProvider } from '../src/hooks/GatewayProvider.js';
import { useConnection } from '../src/hooks/useConnection.js';

function ConnectionProbe(): JSX.Element {
  const connection = useConnection();
  return (
    <div>
      <div data-testid="status">{connection.status}</div>
      <div data-testid="error">{connection.error ?? ''}</div>
    </div>
  );
}

describe('GatewayProvider', () => {
  it('captures connect failures without leaving an unhandled rejected promise', async () => {
    const client = {
      connect: vi.fn().mockRejectedValue(
        new GatewayClientDisconnectedError('Gateway socket closed before authentication completed'),
      ),
      close: vi.fn().mockResolvedValue(undefined),
      on: vi.fn().mockReturnValue(() => {}),
    } as never;

    render(
      <GatewayProvider client={client}>
        <ConnectionProbe />
      </GatewayProvider>,
    );

    expect(screen.getByTestId('status').textContent).toBe('connecting');

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('disconnected');
    });
    expect(screen.getByTestId('error').textContent).toBe(
      'Gateway socket closed before authentication completed',
    );
    expect(client.connect).toHaveBeenCalledTimes(1);
  });
});
