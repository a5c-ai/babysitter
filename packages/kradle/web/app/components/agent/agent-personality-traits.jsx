'use client';

const TRAITS = ['assertive', 'detail-oriented', 'security-conscious', 'empathetic', 'concise', 'creative', 'methodical'];

export function AgentPersonalityTraits({ value = [], onChange = () => {} }) {
  const selected = new Set(value);
  function toggle(trait) {
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
            <input type="checkbox" checked={selected.has(trait)} onChange={() => toggle(trait)} aria-label={`Toggle ${trait}`} />
            {trait}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
