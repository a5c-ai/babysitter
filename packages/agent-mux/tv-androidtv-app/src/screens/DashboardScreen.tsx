import React from 'react';
import { View } from 'react-native';

import { Text } from '@a5c-ai/agent-mux-ui';

import { BigCostChip } from '../components/BigCostChip.js';
import { FocusableCard } from '../components/FocusableCard.js';
import { LeanbackRow } from '../components/LeanbackRow.js';
import { RemoteShortcutBar } from '../components/RemoteShortcutBar.js';

export function DashboardScreen(props: { onToggleHookApproval(enabled: boolean): void }): JSX.Element {
  return (
    <View>
      <Text>AgentMux Android TV Dashboard</Text>
      <LeanbackRow title="Active Runs">
        <FocusableCard id="run-1" title="Codex" subtitle="Last 3 events" />
        <FocusableCard id="run-2" title="Claude" subtitle="Pending hooks" />
      </LeanbackRow>
      <LeanbackRow title="Recent Sessions">
        <FocusableCard id="session-1" title="Session A" subtitle="Recent session" />
      </LeanbackRow>
      <BigCostChip totalUsd={9.87} />
      <RemoteShortcutBar />
      <FocusableCard id="hooks-toggle" title="Enable Hook Approval" onPress={() => props.onToggleHookApproval(true)} />
    </View>
  );
}
