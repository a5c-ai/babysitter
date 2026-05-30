'use client';

export function AgentDefinitionForm({ stacks = [], value = {}, onChange = () => {} }) {
  const update = (patch) => onChange({ ...value, ...patch });
  return (
    <form onSubmit={(event) => event.preventDefault()} className="stack" aria-label="Agent definition form">
      <label>Deployment name<input aria-label="Definition name" value={value.name || ''} onChange={(event) => update({ name: event.target.value })} /></label>
      <label>Stack<select aria-label="Stack reference" value={value.stackRef || ''} onChange={(event) => update({ stackRef: event.target.value })}><option value="">Select stack</option>{stacks.map((stack) => <option key={stack.metadata?.name || stack} value={stack.metadata?.name || stack}>{stack.metadata?.name || stack}</option>)}</select></label>
      <label>Role context<textarea aria-label="Role context" rows={4} value={value.roleContext || ''} onChange={(event) => update({ roleContext: event.target.value })} /></label>
      <button type="submit" aria-label="Keep definition">Keep definition</button>
    </form>
  );
}
