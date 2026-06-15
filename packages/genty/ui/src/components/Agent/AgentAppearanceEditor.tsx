import React from 'react';

export interface AgentAvatarSpec {
  type?: string;
  url?: string;
  fallbackInitials?: string;
  fallbackColor?: string;
}

export interface AgentBadgeSpec {
  text?: string;
}

export interface AgentThemeSpec {
  primaryColor?: string;
}

export interface AgentAppearanceSpec {
  avatar?: AgentAvatarSpec;
  emoji?: string;
  badge?: AgentBadgeSpec;
  theme?: AgentThemeSpec;
}

export interface AgentAppearanceEditorProps {
  value?: AgentAppearanceSpec;
  onChange?: (value: AgentAppearanceSpec) => void;
}

export function AgentAppearanceEditor({ value = {}, onChange = () => {} }: AgentAppearanceEditorProps) {
  const avatar = value.avatar || {};
  const theme = value.theme || {};
  const update = (patch: Partial<AgentAppearanceSpec>) => onChange({ ...value, ...patch });
  const updateAvatar = (patch: Partial<AgentAvatarSpec>) => update({ avatar: { ...avatar, ...patch } });
  const updateTheme = (patch: Partial<AgentThemeSpec>) => update({ theme: { ...theme, ...patch } });
  return (
    <form onSubmit={(event) => event.preventDefault()} className="stack" aria-label="Agent appearance editor">
      <label>
        Avatar URL
        <input
          aria-label="Avatar URL"
          value={avatar.url || ''}
          onChange={(event) => updateAvatar({ type: 'url', url: event.target.value })}
        />
      </label>
      <label>
        Emoji
        <input
          aria-label="Emoji"
          value={value.emoji || ''}
          onChange={(event) => update({ emoji: event.target.value })}
        />
      </label>
      <label>
        Primary color
        <input
          type="color"
          aria-label="Primary color"
          value={theme.primaryColor || '#2563eb'}
          onChange={(event) => updateTheme({ primaryColor: event.target.value })}
        />
      </label>
      <label>
        Badge
        <input
          aria-label="Badge text"
          value={value.badge?.text || ''}
          onChange={(event) => update({ badge: { ...(value.badge || {}), text: event.target.value } })}
        />
      </label>
      <button
        type="button"
        aria-label="Generate avatar placeholder"
        onClick={() => updateAvatar({ type: 'generated', fallbackInitials: avatar.fallbackInitials || 'AI' })}
      >
        Generate placeholder
      </button>
      <button type="submit" aria-label="Keep appearance">
        Keep appearance
      </button>
    </form>
  );
}
