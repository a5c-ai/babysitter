import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  AgentsScreen,
  Card,
  ConnectionBanner,
  SessionDetailScreen,
  SessionListScreen,
  SettingsScreen,
  Text,
  useConnection,
} from '@a5c-ai/agent-mux-ui';

import { useGatewaySelector } from '../hooks/useGatewaySelector.js';
import { HOME_TABS, type HomeTabId } from '../navigation/tabs.js';
import { HookInboxScreen } from './HookInboxScreen.js';

function ActiveSessionRail(props: { selectedSessionId: string | null; onSelect(sessionId: string): void }): JSX.Element {
  const sessions = useGatewaySelector((state) =>
    Object.values(state.sessions.byId)
      .filter((session) => String(session.status ?? '') === 'active')
      .sort((left, right) => Number(right.updatedAt ?? 0) - Number(left.updatedAt ?? 0)),
  );

  return (
    <View style={styles.runRail}>
      {sessions.map((session) => (
        <Pressable key={session.sessionId} onPress={() => props.onSelect(session.sessionId)}>
          <Card>
            <Text style={styles.runTitle}>{String(session.agent ?? 'agent')}</Text>
            <Text>{session.sessionId}</Text>
            <Text>{String(session.status ?? 'active')}</Text>
          </Card>
        </Pressable>
      ))}
      {props.selectedSessionId ? <SessionDetailScreen sessionId={props.selectedSessionId} /> : <Text>No active sessions yet.</Text>}
    </View>
  );
}

export function HomeScreen(): JSX.Element {
  const connection = useConnection();
  const runToSession = useGatewaySelector<Record<string, string>>((state) =>
    Object.fromEntries(
      Object.values(state.runs.byId)
        .filter((run) => typeof run.runId === 'string' && typeof run.sessionId === 'string')
        .map((run) => [run.runId, run.sessionId]),
    ) as Record<string, string>,
  );
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<HomeTabId>('active');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  let content: JSX.Element;
  switch (activeTab) {
    case 'sessions':
      content = <SessionListScreen onSelect={setSelectedSessionId} />;
      break;
    case 'agents':
      content = <AgentsScreen selected={selectedAgent} onSelect={setSelectedAgent} />;
      break;
    case 'inbox':
      content = <HookInboxScreen onOpenRun={(runId) => setSelectedSessionId(runToSession[runId] ?? null)} />;
      break;
    case 'settings':
      content = <SettingsScreen />;
      break;
    case 'active':
    default:
      content = <ActiveSessionRail selectedSessionId={selectedSessionId} onSelect={setSelectedSessionId} />;
      break;
  }

  return (
    <View style={styles.container}>
      <ConnectionBanner status={connection.status} error={connection.error} />
      <ScrollView contentContainerStyle={styles.content}>{content}</ScrollView>
      <View style={styles.tabs}>
        {HOME_TABS.map((tab) => (
          <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={styles.tab}>
            <Text style={activeTab === tab.id ? styles.tabActive : undefined}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
  },
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 96,
  },
  runRail: {
    gap: 12,
  },
  runTitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  tabs: {
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 20,
    paddingTop: 12,
  },
  tab: {
    paddingHorizontal: 8,
  },
  tabActive: {
    fontSize: 16,
    lineHeight: 22,
  },
});
