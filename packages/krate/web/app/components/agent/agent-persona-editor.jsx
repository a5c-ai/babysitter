'use client';

import { AgentPersonalityTraits } from './agent-personality-traits.jsx';

export function AgentPersonaEditor({ value, onChange = () => {} }) {
  const update = (patch) => onChange({ ...value, ...patch });
  const role = value?.role || {};
  const personality = value?.personality || {};
  return (
    <form onSubmit={(event) => event.preventDefault()} className="stack" aria-label="Agent persona editor">
      <label>Display name<input aria-label="Display name" value={value?.displayName || ''} onChange={(event) => update({ displayName: event.target.value })} /></label>
      <label>Tagline<input aria-label="Tagline" value={value?.tagline || ''} onChange={(event) => update({ tagline: event.target.value })} /></label>
      <label>Role title<input aria-label="Role title" value={role.title || ''} onChange={(event) => update({ role: { ...role, title: event.target.value } })} /></label>
      <label>Domain<input aria-label="Role domain" value={role.domain || ''} onChange={(event) => update({ role: { ...role, domain: event.target.value } })} /></label>
      <label>Communication style<select aria-label="Communication style" value={personality.communicationStyle || 'direct'} onChange={(event) => update({ personality: { ...personality, communicationStyle: event.target.value } })}><option>direct</option><option>gentle</option><option>formal</option><option>casual</option></select></label>
      <label>Tone<select aria-label="Tone" value={personality.tone || 'professional'} onChange={(event) => update({ personality: { ...personality, tone: event.target.value } })}><option>professional</option><option>friendly</option><option>academic</option><option>playful</option></select></label>
      <AgentPersonalityTraits value={personality.traits || []} onChange={(traits) => update({ personality: { ...personality, traits } })} />
      <button type="submit" aria-label="Keep persona changes">Keep persona changes</button>
    </form>
  );
}
