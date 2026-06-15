import React from 'react';
import { Platform, ScrollView, View } from 'react-native';

import { TextDeltaBubble } from './event-cards/TextDeltaBubble.js';
import { ToolResultCard } from './event-cards/ToolResultCard.js';
import { Text } from './primitives/Text.js';

export interface EventListProps {
  items: Array<{ type: string; [key: string]: unknown }>;
  agent?: string;
  onScrollPositionChange?: (position: number) => void;
}

export function EventList(props: EventListProps): JSX.Element {
  const content = props.items.map((item, index) => {
    if (item.type === 'text') {
      return <TextDeltaBubble key={`text-${index}`} text={String(item.text ?? '')} />;
    }
    if (item.type === 'tool-card') {
      return (
        <ToolResultCard
          key={`tool-${index}`}
          agent={(props.agent ?? 'claude') as never}
          toolName={String((item.toolCall as Record<string, unknown> | undefined)?.toolName ?? 'tool')}
          input={(item.toolCall as Record<string, unknown> | undefined)?.input}
          output={item.toolResult}
        />
      );
    }
    return <Text key={`generic-${index}`}>{JSON.stringify(item)}</Text>;
  });

  if (Platform.OS === 'web') {
    return (
      <ScrollView onScroll={(event: { nativeEvent: { contentOffset: { y: number } } }) => props.onScrollPositionChange?.(event.nativeEvent.contentOffset.y)}>
        <View>{content}</View>
      </ScrollView>
    );
  }

  return (
    <ScrollView onScroll={(event: { nativeEvent: { contentOffset: { y: number } } }) => props.onScrollPositionChange?.(event.nativeEvent.contentOffset.y)}>
      <View>{content}</View>
    </ScrollView>
  );
}
