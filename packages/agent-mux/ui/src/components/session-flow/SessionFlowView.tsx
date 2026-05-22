import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type {
  AgentFlowLane,
  AgentFlowSegment,
  SessionFlowFileRecord,
  SessionFlowModel,
  SessionTranscriptNode,
} from '../../session-flow.js';
import { Card } from '../primitives/Card.js';
import { Text } from '../primitives/Text.js';
import { useTheme } from '../primitives/theme.js';

export type SessionFlowViewMode = 'flow' | 'transcript' | 'files';

type SessionFlowViewProps = {
  model: SessionFlowModel;
  viewMode: SessionFlowViewMode;
  onViewModeChange: (mode: SessionFlowViewMode) => void;
};

const VIEW_ITEMS: Array<{ value: SessionFlowViewMode; label: string }> = [
  { value: 'flow', label: 'Trace' },
  { value: 'transcript', label: 'Transcript' },
  { value: 'files', label: 'Files' },
];

const EMPTY_MESSAGES: Record<SessionFlowViewMode, string> = {
  flow: 'No structured execution flow is available for this session yet.',
  transcript: 'No transcript turns are available for this session yet.',
  files: 'File attention will appear here once the session touches the workspace.',
};

function formatFlowTime(value: number | null): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(start: number | null, end: number | null): string | null {
  if (start == null || end == null || end <= start) {
    return null;
  }
  const delta = end - start;
  if (delta < 1000) {
    return `${delta}ms`;
  }
  if (delta < 60_000) {
    return `${(delta / 1000).toFixed(1)}s`;
  }
  return `${Math.round(delta / 1000)}s`;
}

function formatUsd(totalUsd: number | null): string | null {
  if (totalUsd == null || !Number.isFinite(totalUsd)) {
    return null;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: totalUsd >= 1 ? 2 : 4,
    maximumFractionDigits: 4,
  }).format(totalUsd);
}

function MetadataChip(props: { label: string; subtle?: boolean }): JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.chip,
        {
          borderColor: theme.colors.border,
          backgroundColor: props.subtle ? theme.colors.background : theme.colors.surface,
        },
      ]}
    >
      <Text style={styles.chipText}>{props.label}</Text>
    </View>
  );
}

function EmptyState(props: { message: string }): JSX.Element {
  const theme = useTheme();
  return (
    <View style={[styles.emptyState, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
      <Text style={styles.mutedText}>{props.message}</Text>
    </View>
  );
}

function FlowLaneCard(props: { lane: AgentFlowLane }): JSX.Element {
  const theme = useTheme();
  const laneTime = formatFlowTime(props.lane.startedAt);
  const laneCost = formatUsd(props.lane.totalUsd);

  return (
    <Card style={styles.sectionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{props.lane.agent}</Text>
          <Text style={styles.mutedText}>
            {laneTime ? `${laneTime} · ` : ''}
            {props.lane.runId}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MetadataChip label={props.lane.status} />
          <MetadataChip label={`${props.lane.segmentCount} phases`} />
          <MetadataChip label={`${props.lane.toolCount} tools`} />
          {laneCost ? <MetadataChip label={laneCost} /> : null}
        </View>
      </View>

      <View style={styles.segmentRow}>
        {props.lane.segments.map((segment) => (
          <View
            key={segment.id}
            style={[
              styles.segmentCard,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.background,
                flexGrow: segment.weight,
              },
            ]}
          >
            <View style={styles.segmentHeader}>
              <Text style={styles.segmentTitle}>{segment.title}</Text>
              {segment.secondaryLabel ? <MetadataChip label={segment.secondaryLabel} subtle /> : null}
            </View>
            <Text>{segment.detail}</Text>
            <View style={styles.metaRow}>
              <MetadataChip label={segment.kind} subtle />
              <MetadataChip label={segment.status} subtle />
              {renderSegmentTiming(segment)}
              {segment.filePaths.length > 0 ? <MetadataChip label={`${segment.filePaths.length} files`} subtle /> : null}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function renderSegmentTiming(segment: AgentFlowSegment): JSX.Element | null {
  const time = formatFlowTime(segment.startedAt);
  const duration = formatDuration(segment.startedAt, segment.endedAt);
  if (time == null && duration == null) {
    return null;
  }
  return <MetadataChip label={[time, duration].filter(Boolean).join(' · ')} subtle />;
}

function TranscriptCard(props: { node: SessionTranscriptNode }): JSX.Element {
  const time = formatFlowTime(props.node.timestamp);
  return (
    <Card style={styles.sectionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <View style={styles.segmentHeader}>
            <MetadataChip label={props.node.kind} subtle />
            <Text style={styles.cardTitle}>{props.node.label}</Text>
            {props.node.status ? <MetadataChip label={props.node.status} subtle /> : null}
          </View>
          <Text style={styles.mutedText}>
            {time ? `${time} · ` : ''}
            {props.node.runId}
          </Text>
        </View>
      </View>
      <Text>{props.node.text}</Text>
      {props.node.filePaths.length > 0 ? (
        <View style={styles.metaRow}>
          <MetadataChip label={`${props.node.filePaths.length} files`} subtle />
        </View>
      ) : null}
    </Card>
  );
}

function FileCard(props: { file: SessionFlowFileRecord }): JSX.Element {
  const lastEvent = formatFlowTime(props.file.lastEventAt);
  return (
    <Card style={styles.sectionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{props.file.path}</Text>
          {lastEvent ? <Text style={styles.mutedText}>{lastEvent}</Text> : null}
        </View>
        <MetadataChip label={`${props.file.touches} touches`} />
      </View>
      <View style={styles.metaRow}>
        <MetadataChip label={`${props.file.reads} reads`} subtle />
        <MetadataChip label={`${props.file.writes} writes`} subtle />
        <MetadataChip label={`${props.file.runIds.length} dispatches`} subtle />
        {props.file.tools.length > 0 ? <MetadataChip label={`${props.file.tools.length} tools`} subtle /> : null}
      </View>
    </Card>
  );
}

export function SessionFlowView(props: SessionFlowViewProps): JSX.Element {
  const theme = useTheme();
  const activeItems =
    props.viewMode === 'flow'
      ? props.model.lanes
      : props.viewMode === 'transcript'
          ? props.model.transcript
          : props.model.files;
  const totalCost = formatUsd(props.model.summary.totalUsd);

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <MetadataChip label={`${props.model.summary.totalRuns} dispatches`} />
        <MetadataChip label={`${props.model.summary.totalSegments} segments`} />
        <MetadataChip label={`${props.model.summary.totalTools} tools`} />
        <MetadataChip label={`${props.model.summary.fileCount} files`} />
        {props.model.summary.pendingTools > 0 ? (
          <MetadataChip label={`${props.model.summary.pendingTools} pending tools`} />
        ) : null}
        {totalCost ? <MetadataChip label={totalCost} /> : null}
      </View>

      <View style={styles.tabRow}>
        {VIEW_ITEMS.map((item) => {
          const active = props.viewMode === item.value;
          const count =
            item.value === 'flow'
              ? props.model.lanes.length
              : item.value === 'transcript'
                  ? props.model.transcript.length
                  : props.model.files.length;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityLabel={item.label.toLowerCase()}
              onPress={() => props.onViewModeChange(item.value)}
              style={[
                styles.tab,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                },
              ]}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{item.label.toLowerCase()}</Text>
              <Text style={[styles.tabBadge, active ? styles.tabTextActive : styles.mutedText]}>{count}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {props.viewMode === 'flow' ? props.model.lanes.map((lane) => <FlowLaneCard key={lane.runId} lane={lane} />) : null}
        {props.viewMode === 'transcript'
          ? props.model.transcript.map((node) => <TranscriptCard key={node.id} node={node} />)
          : null}
        {props.viewMode === 'files' ? props.model.files.map((file) => <FileCard key={file.path} file={file} />) : null}
        {activeItems.length === 0 ? <EmptyState message={EMPTY_MESSAGES[props.viewMode]} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabText: {
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabBadge: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 16,
  },
  sectionCard: {
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardHeaderText: {
    flexShrink: 1,
    gap: 4,
  },
  cardTitle: {
    fontWeight: '700',
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  segmentCard: {
    minWidth: 180,
    flexBasis: 180,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  segmentHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  segmentTitle: {
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mutedText: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
  },
});
