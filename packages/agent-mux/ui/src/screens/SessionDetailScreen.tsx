import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { CostMeter } from '../components/CostMeter.js';
import { InputBar } from '../components/InputBar.js';
import { RunStatusBadge } from '../components/RunStatusBadge.js';
import { Card } from '../components/primitives/Card.js';
import { Text } from '../components/primitives/Text.js';
import { useTheme } from '../components/primitives/theme.js';
import { useGateway } from '../hooks/useGateway.js';
import { useSendSessionMessage } from '../hooks/useSendSessionMessage.js';
import { useSession } from '../hooks/useSession.js';
import { accumulateEventCost, buildSessionFlowModel } from '../session-flow.js';
import type { GatewayStoreState } from '../store/index.js';

type ViewMode = 'flow' | 'timeline' | 'transcript' | 'files';

export function SessionDetailScreen(props: { sessionId: string }): JSX.Element {
  const theme = useTheme();
  const { store } = useGateway();
  const session = useSession(props.sessionId);
  const runs = useStore(store, useShallow((state: GatewayStoreState) =>
    Object.values(state.runs.byId)
      .filter((run) => run.sessionId === props.sessionId)
      .sort((left, right) => Number(right.startedAt ?? 0) - Number(left.startedAt ?? 0)),
  ));
  const eventBuffers = useStore(store, (state: GatewayStoreState) => state.events.byRunId);
  const [viewMode, setViewMode] = useState<ViewMode>('flow');
  const sendSessionMessage = useSendSessionMessage();

  const flowModel = useMemo(() => buildSessionFlowModel(runs, eventBuffers), [eventBuffers, runs]);
  const cost = useMemo(
    () => accumulateEventCost(runs.map((run: Record<string, unknown>) => String(run.runId ?? '')), eventBuffers),
    [eventBuffers, runs],
  );

  return (
    <View style={styles.screen}>
      <RunStatusBadge status={String(session?.status ?? 'unknown')} />
      <CostMeter totalUsd={cost?.totalUsd ?? 0} />
      <Text style={styles.heading}>{String(session?.agent ?? 'unknown')} · {props.sessionId}</Text>

      <View style={styles.tabRow}>
        {(['flow', 'timeline', 'transcript', 'files'] as ViewMode[]).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setViewMode(mode)}
            style={[
              styles.tab,
              {
                borderColor: theme.colors.border,
                backgroundColor: viewMode === mode ? theme.colors.primary : theme.colors.surface,
              },
            ]}
          >
            <Text style={viewMode === mode ? styles.tabActiveText : undefined}>{mode}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {viewMode === 'flow'
          ? flowModel.lanes.map((lane: typeof flowModel.lanes[number]) => (
              <Card key={lane.runId} style={styles.card}>
                <Text style={styles.cardTitle}>{lane.agent}</Text>
                <Text>{lane.runId}</Text>
                <Text>{lane.segmentCount} phases · {lane.toolCount} tools</Text>
                {lane.segments.map((segment: typeof lane.segments[number]) => (
                  <View key={segment.id} style={[styles.segment, { borderColor: theme.colors.border }]}>
                    <Text style={styles.segmentTitle}>{segment.title}</Text>
                    <Text>{segment.detail}</Text>
                  </View>
                ))}
              </Card>
            ))
          : null}

        {viewMode === 'timeline'
          ? flowModel.timeline.map((item: typeof flowModel.timeline[number]) => (
              <Card key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text>{item.runId}</Text>
                <Text>{item.detail}</Text>
              </Card>
            ))
          : null}

        {viewMode === 'transcript'
          ? flowModel.transcript.map((node: typeof flowModel.transcript[number]) => (
              <Card key={node.id} style={styles.card}>
                <Text style={styles.cardTitle}>{node.label}</Text>
                <Text>{node.text}</Text>
              </Card>
            ))
          : null}

        {viewMode === 'files'
          ? flowModel.files.map((file: typeof flowModel.files[number]) => (
              <Card key={file.path} style={styles.card}>
                <Text style={styles.cardTitle}>{file.path}</Text>
                <Text>{file.touches} touches · {file.reads} reads · {file.writes} writes</Text>
              </Card>
            ))
          : null}

        {viewMode === 'flow' && flowModel.lanes.length === 0 ? <Text>No realtime flow has been indexed yet.</Text> : null}
        {viewMode === 'timeline' && flowModel.timeline.length === 0 ? <Text>No timeline events have been indexed yet.</Text> : null}
        {viewMode === 'transcript' && flowModel.transcript.length === 0 ? <Text>No transcript events have been indexed yet.</Text> : null}
        {viewMode === 'files' && flowModel.files.length === 0 ? <Text>No file attention has been captured yet.</Text> : null}
      </ScrollView>

      <InputBar
        onSubmit={(value) => {
          if (!value.trim()) {
            return;
          }
          void sendSessionMessage({
            sessionId: props.sessionId,
            prompt: value,
            agent: typeof session?.agent === 'string' ? session.agent : undefined,
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 12,
  },
  heading: {
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tab: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabActiveText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 16,
  },
  card: {
    gap: 8,
  },
  cardTitle: {
    fontWeight: '700',
  },
  segment: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  segmentTitle: {
    fontWeight: '600',
  },
});
