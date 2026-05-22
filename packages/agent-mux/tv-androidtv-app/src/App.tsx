import React, { useState } from 'react';

import { ThemeProvider } from '@a5c-ai/agent-mux-ui';

import { PairingScreen } from './screens/PairingScreen.js';
import { DashboardScreen } from './screens/DashboardScreen.js';
import { HookInboxScreen } from './screens/HookInboxScreen.js';
import { FocusManager } from './focus/FocusManager.js';
import { TokenStoreProvider, useAndroidTVTokenStore } from './providers/TokenStoreProvider.js';
import { UserPrefsSync } from './providers/UserPrefsSync.js';
import { tvTheme } from './theme/tv.js';

function AppShell(): JSX.Element {
  const { auth } = useAndroidTVTokenStore();
  const [hookApprovalEnabled, setHookApprovalEnabled] = useState(false);
  if (!auth) {
    return <PairingScreen />;
  }
  return (
    <FocusManager>
      <UserPrefsSync>
        {hookApprovalEnabled ? (
          <HookInboxScreen enabled={hookApprovalEnabled} onToggle={setHookApprovalEnabled} />
        ) : (
          <DashboardScreen onToggleHookApproval={setHookApprovalEnabled} />
        )}
      </UserPrefsSync>
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
