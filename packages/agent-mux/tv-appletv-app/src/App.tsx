import React, { useState } from 'react';

import { ThemeProvider } from '@a5c-ai/agent-mux-ui';

import { FocusManager } from './focus/FocusManager.js';
import { HookInboxScreen } from './screens/HookInboxScreen.js';
import { PairingScreen } from './screens/PairingScreen.js';
import { TokenStoreProvider, useTVTokenStore } from './providers/TokenStoreProvider.js';
import { DashboardScreen } from './screens/DashboardScreen.js';
import { tvTheme } from './theme/tv.js';

function AppShell(): JSX.Element {
  const { auth } = useTVTokenStore();
  const [hookApprovalEnabled, setHookApprovalEnabled] = useState(false);
  if (!auth) {
    return <PairingScreen />;
  }
  return (
    <FocusManager>
      {hookApprovalEnabled ? (
        <HookInboxScreen enabled={hookApprovalEnabled} onToggle={setHookApprovalEnabled} />
      ) : (
        <DashboardScreen onToggleHookApproval={setHookApprovalEnabled} />
      )}
    </FocusManager>
  );
}

export function App(): JSX.Element {
  return (
    <ThemeProvider value={tvTheme}>
      <TokenStoreProvider>
        <AppShell />
      </TokenStoreProvider>
    </ThemeProvider>
  );
}
