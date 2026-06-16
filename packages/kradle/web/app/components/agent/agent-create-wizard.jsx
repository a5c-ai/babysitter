'use client';

import { useMemo, useState } from 'react';
import { AgentAppearanceEditor } from './agent-appearance-editor.jsx';
import { AgentDefinitionForm } from './agent-definition-form.jsx';
import { AgentPersonaEditor } from './agent-persona-editor.jsx';
import { AgentSoulEditor } from './agent-soul-editor.jsx';
import { AgentVoiceEditor } from './agent-voice-editor.jsx';

const STEPS = ['identity', 'soul', 'skills', 'appearance', 'voice', 'infrastructure', 'review'];

function slugify(value) {
  return String(value || 'new-agent').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'new-agent';
}

async function writeResource(org, endpoint, resource, method = 'POST') {
  const response = await fetch(`/api/orgs/${encodeURIComponent(org)}/agents/${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resource),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.message || data.error || `Failed to create ${resource.kind}`);
  return data.resource || data;
}

export function AgentCreateWizard({ org, stacks = [], skills = [] }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [createdResources, setCreatedResources] = useState([]);
  const [persona, setPersona] = useState({ displayName: '', tagline: '', role: { title: '', domain: '' }, personality: { traits: [], communicationStyle: 'direct', tone: 'professional' }, skillRefs: [] });
  const [soul, setSoul] = useState('');
  const [appearance, setAppearance] = useState({ avatar: { type: 'initials' }, theme: { primaryColor: 'var(--accent)' } });
  const [voice, setVoice] = useState({ ttsProvider: 'openai', ttsConfig: { voice: 'nova', speed: 1 } });
  const [definition, setDefinition] = useState({ stackRef: '', roleContext: '' });
  const name = useMemo(() => slugify(persona.displayName), [persona.displayName]);
  const currentStep = STEPS[stepIndex];

  async function rollback(resources) {
    await Promise.all([...resources].reverse().map((resource) => fetch(`/api/orgs/${encodeURIComponent(org)}/resources/${resource.kind}/${encodeURIComponent(resource.metadata?.name)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => null)));
  }

  async function createAgent(event) {
    event.preventDefault();
    setStatus('creating');
    setMessage('');
    const resources = [
      { kind: 'AgentPersona', metadata: { name }, spec: { ...persona, organizationRef: org, soul: { ref: `${name}-soul` }, appearance: { ref: `${name}-appearance` }, voiceProfile: { ref: `${name}-voice` } } },
      { kind: 'AgentSoul', metadata: { name: `${name}-soul` }, spec: { organizationRef: org, personaRef: name, format: 'markdown', content: soul || `# ${persona.displayName}` } },
      { kind: 'AgentAppearance', metadata: { name: `${name}-appearance` }, spec: { organizationRef: org, personaRef: name, ...appearance } },
      { kind: 'AgentVoiceProfile', metadata: { name: `${name}-voice` }, spec: { organizationRef: org, personaRef: name, ...voice } },
      { kind: 'AgentDefinition', metadata: { name: definition.name || `${name}-default` }, spec: { organizationRef: org, personaRef: name, stackRef: definition.stackRef, roleContext: definition.roleContext } },
    ];
    const endpoints = ['personas', `souls/${name}-soul`, `appearances/${name}-appearance`, `voices/${name}-voice`, 'definitions'];
    const created = [];
    try {
      for (let i = 0; i < resources.length; i += 1) {
        const method = i === 0 || i === resources.length - 1 ? 'POST' : 'PATCH';
        const createdResource = await writeResource(org, endpoints[i], resources[i], method);
        created.push(createdResource);
        setCreatedResources([...created]);
      }
      setStatus('success');
      setMessage(`Created ${persona.displayName || name}`);
    } catch (error) {
      await rollback(created); // compensation rollback uses DELETE for partial failures.
      setStatus('error');
      setMessage(`${error.message}. Rolled back ${created.length} created resources.`);
    }
  }

  function renderStep() {
    if (currentStep === 'identity') return <AgentPersonaEditor value={persona} onChange={setPersona} />;
    if (currentStep === 'soul') return <AgentSoulEditor value={soul} onChange={setSoul} />;
    if (currentStep === 'skills') return <fieldset style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '0.75rem' }}><legend>Skills</legend>{skills.map((skill) => <label key={skill.metadata?.name || skill} style={{ display: 'block' }}><input type="checkbox" aria-label={`Select ${skill.metadata?.name || skill}`} checked={persona.skillRefs.includes(skill.metadata?.name || skill)} onChange={(event) => setPersona((prev) => ({ ...prev, skillRefs: event.target.checked ? [...prev.skillRefs, skill.metadata?.name || skill] : prev.skillRefs.filter((item) => item !== (skill.metadata?.name || skill)) }))} /> {skill.metadata?.name || skill}</label>)}</fieldset>;
    if (currentStep === 'appearance') return <AgentAppearanceEditor value={appearance} onChange={setAppearance} />;
    if (currentStep === 'voice') return <AgentVoiceEditor org={org} name={`${name}-voice`} value={voice} onChange={setVoice} />;
    if (currentStep === 'infrastructure') return <AgentDefinitionForm stacks={stacks} value={definition} onChange={setDefinition} />;
    return <div className="card"><h3>Review</h3><dl className="kv"><dt>Name</dt><dd>{name}</dd><dt>Display</dt><dd>{persona.displayName}</dd><dt>Stack</dt><dd>{definition.stackRef || 'not selected'}</dd><dt>Resources</dt><dd>AgentPersona, AgentSoul, AgentAppearance, AgentVoiceProfile, AgentDefinition</dd></dl></div>;
  }

  return (
    <form onSubmit={createAgent} className="stack" aria-label="Create agent wizard">
      <div className="card">
        <div className="cardTitle"><h2>Create Agent</h2><span>{currentStep}</span></div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {STEPS.map((step, index) => <button key={step} type="button" aria-label={`Go to ${step}`} onClick={() => setStepIndex(index)} className={index === stepIndex ? 'pill good' : 'pill neutral'}>{step}</button>)}
        </div>
        {renderStep()}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" aria-label="Previous wizard step" disabled={stepIndex === 0} onClick={() => setStepIndex((value) => Math.max(0, value - 1))}>Previous</button>
          {stepIndex < STEPS.length - 1 ? <button type="button" aria-label="Next wizard step" onClick={() => setStepIndex((value) => Math.min(STEPS.length - 1, value + 1))}>Next</button> : <button type="submit" aria-label="Create agent resources" disabled={status === 'creating' || !persona.displayName || !definition.stackRef}>{status === 'creating' ? 'Creating...' : 'Create agent'}</button>}
        </div>
        {message ? <p className={status === 'error' ? 'errorText' : 'muted'}>{message}</p> : null}
        {createdResources.length ? <p className="muted">{createdResources.length} resources created in this attempt.</p> : null}
      </div>
    </form>
  );
}
