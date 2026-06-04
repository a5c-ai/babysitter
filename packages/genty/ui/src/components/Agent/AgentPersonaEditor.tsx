import React from 'react';

const TRAITS = [
  'assertive',
  'detail-oriented',
  'security-conscious',
  'empathetic',
  'concise',
  'creative',
  'methodical',
];

interface AgentPersonalityTraitsProps {
  value?: string[];
  onChange?: (traits: string[]) => void;
}

function AgentPersonalityTraits({ value = [], onChange = () => {} }: AgentPersonalityTraitsProps) {
  const selected = new Set(value);
  function toggle(trait: string) {
    const next = new Set(selected);
    if (next.has(trait)) next.delete(trait);
    else next.add(trait);
    onChange([...next]);
  }
  return (
    <fieldset style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '0.75rem' }}>
      <legend>Traits</legend>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {TRAITS.map((trait) => (
          <label key={trait} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={selected.has(trait)}
              onChange={() => toggle(trait)}
              aria-label={`Toggle ${trait}`}
            />
            {trait}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export interface AgentPersonalitySpec {
  traits?: string[];
  communicationStyle?: string;
  tone?: string;
  explanationDepth?: string;
}

export interface AgentRoleSpec {
  title?: string;
  domain?: string;
  expertise?: string[];
}

export interface AgentPersonaValue {
  displayName?: string;
  tagline?: string;
  role?: AgentRoleSpec;
  personality?: AgentPersonalitySpec;
  skillRefs?: string[];
}

export interface AgentPersonaEditorProps {
  value?: AgentPersonaValue;
  onChange?: (value: AgentPersonaValue) => void;
}

export function AgentPersonaEditor({ value, onChange = () => {} }: AgentPersonaEditorProps) {
  const update = (patch: Partial<AgentPersonaValue>) => onChange({ ...value, ...patch });
  const role = value?.role || {};
  const personality = value?.personality || {};
  return (
    <form onSubmit={(event) => event.preventDefault()} className="stack" aria-label="Agent persona editor">
      <label>
        Display name
        <input
          aria-label="Display name"
          value={value?.displayName || ''}
          onChange={(event) => update({ displayName: event.target.value })}
        />
      </label>
      <label>
        Tagline
        <input
          aria-label="Tagline"
          value={value?.tagline || ''}
          onChange={(event) => update({ tagline: event.target.value })}
        />
      </label>
      <label>
        Role title
        <input
          aria-label="Role title"
          value={role.title || ''}
          onChange={(event) => update({ role: { ...role, title: event.target.value } })}
        />
      </label>
      <label>
        Domain
        <input
          aria-label="Role domain"
          value={role.domain || ''}
          onChange={(event) => update({ role: { ...role, domain: event.target.value } })}
        />
      </label>
      <label>
        Communication style
        <select
          aria-label="Communication style"
          value={personality.communicationStyle || 'direct'}
          onChange={(event) =>
            update({ personality: { ...personality, communicationStyle: event.target.value } })
          }
        >
          <option>direct</option>
          <option>gentle</option>
          <option>formal</option>
          <option>casual</option>
        </select>
      </label>
      <label>
        Tone
        <select
          aria-label="Tone"
          value={personality.tone || 'professional'}
          onChange={(event) => update({ personality: { ...personality, tone: event.target.value } })}
        >
          <option>professional</option>
          <option>friendly</option>
          <option>academic</option>
          <option>playful</option>
        </select>
      </label>
      <AgentPersonalityTraits
        value={personality.traits || []}
        onChange={(traits) => update({ personality: { ...personality, traits } })}
      />
      <button type="submit" aria-label="Keep persona changes">
        Keep persona changes
      </button>
    </form>
  );
}
