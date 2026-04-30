import React from 'react';
import { SettingsScreen } from '@a5c-ai/agent-mux-ui';
import { Button } from '@a5c-ai/compendium';

import { useGatewayAuth } from '../providers/GatewayProvider.js';
import { useThemeMode } from '../providers/ThemeProvider.js';

export function SettingsPage(): JSX.Element {
  const { auth, logout } = useGatewayAuth();
  const { mode, toggle } = useThemeMode();
  return (
    <section className="panel">
      <header><h2>Settings</h2></header>
      <SettingsScreen />
      <div className="settings-grid">
        <div>
          <strong>Gateway</strong>
          <p>{auth?.gatewayUrl ?? 'not connected'}</p>
        </div>
        <div>
          <strong>Theme</strong>
          <Button type="button" onClick={toggle}>
            Toggle to {mode === 'light' ? 'dark' : 'light'}
          </Button>
        </div>
        <div>
          <strong>Token</strong>
          <Button type="button" variant="ghost" onClick={() => logout()}>
            Forget saved token
          </Button>
        </div>
      </div>
    </section>
  );
}
