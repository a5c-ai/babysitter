import React, { useState } from 'react';

export interface AgentTtsConfig {
  voice?: string;
  speed?: number;
}

export interface AgentVoiceSpec {
  ttsProvider?: string;
  ttsConfig?: AgentTtsConfig;
}

export interface AgentVoiceEditorProps {
  org: string;
  name: string;
  value?: AgentVoiceSpec;
  onChange?: (value: AgentVoiceSpec) => void;
  /** Override for preview API URL, defaults to /api/orgs/:org/agents/voices/:name/preview */
  onPreview?: (text: string, voice: string | undefined) => Promise<string>;
}

export function AgentVoiceEditor({ org, name, value = {}, onChange = () => {}, onPreview }: AgentVoiceEditorProps) {
  const [preview, setPreview] = useState('');
  const ttsConfig = value.ttsConfig || {};
  const update = (patch: Partial<AgentVoiceSpec>) => onChange({ ...value, ...patch });
  const updateConfig = (patch: Partial<AgentTtsConfig>) => update({ ttsConfig: { ...ttsConfig, ...patch } });

  async function previewVoice() {
    try {
      if (onPreview) {
        const result = await onPreview(preview || 'This is an agent voice preview.', ttsConfig.voice);
        setPreview(result);
        return;
      }
      const response = await fetch(
        `/api/orgs/${encodeURIComponent(org)}/agents/voices/${encodeURIComponent(name || 'new-agent-voice')}/preview`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: preview || 'This is an agent voice preview.', voice: ttsConfig.voice }),
        }
      );
      const data = await response.json();
      setPreview(data.preview?.text || data.message || 'Preview requested');
    } catch (error: unknown) {
      setPreview((error instanceof Error ? error.message : null) || 'Preview failed');
    }
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} className="stack" aria-label="Agent voice editor">
      <label>
        TTS provider
        <input
          aria-label="TTS provider"
          value={value.ttsProvider || 'openai'}
          onChange={(event) => update({ ttsProvider: event.target.value })}
        />
      </label>
      <label>
        Voice
        <input
          aria-label="Voice"
          value={ttsConfig.voice || ''}
          onChange={(event) => updateConfig({ voice: event.target.value })}
        />
      </label>
      <label>
        Speed
        <input
          type="number"
          min="0.5"
          max="2"
          step="0.1"
          aria-label="Voice speed"
          value={ttsConfig.speed || 1}
          onChange={(event) => updateConfig({ speed: Number(event.target.value) })}
        />
      </label>
      <button type="button" aria-label="Preview voice" onClick={previewVoice}>
        Preview voice
      </button>
      <button type="submit" aria-label="Keep voice">
        Keep voice
      </button>
      {preview ? <p className="muted">{preview}</p> : null}
    </form>
  );
}
