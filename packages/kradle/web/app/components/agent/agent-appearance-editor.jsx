'use client';

export function AgentAppearanceEditor({ value = {}, onChange = () => {} }) {
  const avatar = value.avatar || {};
  const theme = value.theme || {};
  const update = (patch) => onChange({ ...value, ...patch });
  const updateAvatar = (patch) => update({ avatar: { ...avatar, ...patch } });
  const updateTheme = (patch) => update({ theme: { ...theme, ...patch } });
  return (
    <form onSubmit={(event) => event.preventDefault()} className="stack" aria-label="Agent appearance editor">
      <label>Avatar URL<input aria-label="Avatar URL" value={avatar.url || ''} onChange={(event) => updateAvatar({ type: 'url', url: event.target.value })} /></label>
      <label>Emoji<input aria-label="Emoji" value={value.emoji || ''} onChange={(event) => update({ emoji: event.target.value })} /></label>
      <label>Primary color<input type="color" aria-label="Primary color" value={theme.primaryColor || 'var(--accent)'} onChange={(event) => updateTheme({ primaryColor: event.target.value })} /></label>
      <label>Badge<input aria-label="Badge text" value={value.badge?.text || ''} onChange={(event) => update({ badge: { ...(value.badge || {}), text: event.target.value } })} /></label>
      <button type="button" aria-label="Generate avatar placeholder" onClick={() => updateAvatar({ type: 'generated', fallbackInitials: avatar.fallbackInitials || 'AI' })}>Generate placeholder</button>
      <button type="submit" aria-label="Keep appearance">Keep appearance</button>
    </form>
  );
}
