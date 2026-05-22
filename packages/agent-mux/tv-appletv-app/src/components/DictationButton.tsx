import React from 'react';

import { Button } from '@a5c-ai/agent-mux-ui';

export function DictationButton(props: { onDictation(text: string): void }): JSX.Element {
  return <Button label="Start Dictation" onPress={() => props.onDictation('TV dictation placeholder')} />;
}
