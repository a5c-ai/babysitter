import React from 'react';
import { View } from 'react-native';

import { Text } from '@a5c-ai/agent-mux-ui';

import { FocusableCard } from '../components/FocusableCard.js';
import { BigCostChip } from '../components/BigCostChip.js';
import { RemoteShortcutBar } from '../components/RemoteShortcutBar.js';

export function DashboardScreen(props: { onToggleHookApproval(enabled: boolean): void }): JSX.Element {
  return (
    <View>
      <Text>AgentMux TV Dashboard</Text>
      <FocusableCard id="run-1" title="Codex" subtitle="3 latest events visible" />
      <FocusableCard id="run-2" title="Claude" subtitle="Pending hook pulse" />
      <BigCostChip totalUsd={12.34} />
      <RemoteShortcutBar />
      <FocusableCard id="hooks-toggle" title="Enable Hook Approval" onPress={() => props.onToggleHookApproval(true)} />
    </View>
  );
}
