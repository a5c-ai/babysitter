import React from 'react';

import { Button } from '@a5c-ai/agent-mux-ui';

export function VoiceInputButton(props: { onVoice(text: string): void }): JSX.Element {
  return <Button label="Voice Input" onPress={() => props.onVoice('Android TV voice placeholder')} />;
}
