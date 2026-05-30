'use client';

export function AgentSoulEditor({ value = '', onChange = () => {} }) {
  return (
    <form onSubmit={(event) => event.preventDefault()} className="stack" aria-label="Agent soul editor">
      <label>Soul document<textarea aria-label="Soul markdown" rows={10} value={value} onChange={(event) => onChange(event.target.value)} placeholder="# Identity&#10;Describe values, boundaries, and communication principles." /></label>
      <button type="submit" aria-label="Keep soul document">Keep soul document</button>
    </form>
  );
}
