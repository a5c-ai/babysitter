import React, { useMemo, useState } from 'react';
import { AgentAppearanceEditor, AgentAppearanceSpec } from './AgentAppearanceEditor.js';
import { AgentPersonaEditor, AgentPersonaValue } from './AgentPersonaEditor.js';
import { AgentSoulEditor } from './AgentSoulEditor.js';
import { AgentVoiceEditor, AgentVoiceSpec } from './AgentVoiceEditor.js';

const STEPS = ['identity', 'soul', 'skills', 'appearance', 'voice', 'infrastructure', 'review'] as const;
type Step = typeof STEPS[number];

function slugify(value: string) {
  return String(value || 'new-agent')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'new-agent';
}

async function writeResource(
  org: string,
  endpoint: string,
  resource: Record<string, unknown>,
  method = 'POST'
): Promise<Record<string, unknown>> {
  const response = await fetch(`/api/orgs/${encodeURIComponent(org)}/agents/${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resource),
  });
  const data = await response.json();
  if (!response.ok || data.error)
    throw new Error(data.message || data.error || `Failed to create ${String(resource.kind)}`);
  return data.resource || data;
}

export interface AgentDefinitionValue {
  name?: string;
  stackRef?: string;
  roleContext?: string;
}

export interface AgentStack {
  metadata?: { name?: string };
  spec?: { displayName?: string; description?: string; jitsiCapability?: boolean };
}

export interface SkillRef {
  metadata?: { name?: string };
}

export interface AgentCreateWizardProps {
  org: string;
  stacks?: AgentStack[];
  skills?: (SkillRef | string)[];
}

function AgentDefinitionForm({
  stacks,
  value,
  onChange,
}: {
  stacks: AgentStack[];
  value: AgentDefinitionValue;
  onChange: (v: AgentDefinitionValue) => void;
}) {
  return (
    <fieldset style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '0.75rem' }}>
      <legend>Infrastructure</legend>
      <label>
        Stack
        <select
          aria-label="Stack"
          value={value.stackRef || ''}
          onChange={(e) => onChange({ ...value, stackRef: e.target.value })}
        >
          <option value="">Select stack...</option>
          {stacks.map((s) => (
            <option key={s.metadata?.name} value={s.metadata?.name}>
              {s.metadata?.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Role context
        <input
          aria-label="Role context"
          value={value.roleContext || ''}
          onChange={(e) => onChange({ ...value, roleContext: e.target.value })}
        />
      </label>
    </fieldset>
  );
}

export function AgentCreateWizard({ org, stacks = [], skills = [] }: AgentCreateWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [createdResources, setCreatedResources] = useState<Record<string, unknown>[]>([]);
  const [persona, setPersona] = useState<AgentPersonaValue>({
    displayName: '',
    tagline: '',
    role: { title: '', domain: '' },
    personality: { traits: [], communicationStyle: 'direct', tone: 'professional' },
    skillRefs: [],
  });
  const [soul, setSoul] = useState('');
  const [appearance, setAppearance] = useState<AgentAppearanceSpec>({
    avatar: { type: 'initials' },
    theme: { primaryColor: '#2563eb' },
  });
  const [voice, setVoice] = useState<AgentVoiceSpec>({
    ttsProvider: 'openai',
    ttsConfig: { voice: 'nova', speed: 1 },
  });
  const [definition, setDefinition] = useState<AgentDefinitionValue>({ stackRef: '', roleContext: '' });
  const name = useMemo(() => slugify(persona.displayName || ''), [persona.displayName]);
  const currentStep: Step = STEPS[stepIndex];

  async function rollback(resources: Record<string, unknown>[]) {
    await Promise.all(
      [...resources].reverse().map((resource) =>
        fetch(
          `/api/orgs/${encodeURIComponent(org)}/resources/${String(resource.kind)}/${encodeURIComponent(String((resource as { metadata?: { name?: string } }).metadata?.name || ''))}`,
          { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
        ).catch(() => null)
      )
    );
  }

  async function createAgent(event: React.FormEvent) {
    event.preventDefault();
    setStatus('creating');
    setMessage('');
    const resources: Record<string, unknown>[] = [
      {
        kind: 'AgentPersona',
        metadata: { name },
        spec: {
          ...persona,
          organizationRef: org,
          soul: { ref: `${name}-soul` },
          appearance: { ref: `${name}-appearance` },
          voiceProfile: { ref: `${name}-voice` },
        },
      },
      {
        kind: 'AgentSoul',
        metadata: { name: `${name}-soul` },
        spec: { organizationRef: org, personaRef: name, format: 'markdown', content: soul || `# ${persona.displayName}` },
      },
      {
        kind: 'AgentAppearance',
        metadata: { name: `${name}-appearance` },
        spec: { organizationRef: org, personaRef: name, ...appearance },
      },
      {
        kind: 'AgentVoiceProfile',
        metadata: { name: `${name}-voice` },
        spec: { organizationRef: org, personaRef: name, ...voice },
      },
      {
        kind: 'AgentDefinition',
        metadata: { name: definition.name || `${name}-default` },
        spec: { organizationRef: org, personaRef: name, stackRef: definition.stackRef, roleContext: definition.roleContext },
      },
    ];
    const endpoints = ['personas', `souls/${name}-soul`, `appearances/${name}-appearance`, `voices/${name}-voice`, 'definitions'];
    const created: Record<string, unknown>[] = [];
    try {
      for (let i = 0; i < resources.length; i += 1) {
        const method = i === 0 || i === resources.length - 1 ? 'POST' : 'PATCH';
        const createdResource = await writeResource(org, endpoints[i], resources[i], method);
        created.push(createdResource);
        setCreatedResources([...created]);
      }
      setStatus('success');
      setMessage(`Created ${persona.displayName || name}`);
    } catch (error: unknown) {
      await rollback(created);
      setStatus('error');
      setMessage(
        `${error instanceof Error ? error.message : 'Unknown error'}. Rolled back ${created.length} created resources.`
      );
    }
  }

  function renderStep() {
    if (currentStep === 'identity') return <AgentPersonaEditor value={persona} onChange={setPersona} />;
    if (currentStep === 'soul') return <AgentSoulEditor value={soul} onChange={setSoul} />;
    if (currentStep === 'skills') {
      return (
        <fieldset style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '0.75rem' }}>
          <legend>Skills</legend>
          {skills.map((skill) => {
            const skillName = typeof skill === 'string' ? skill : skill.metadata?.name || '';
            return (
              <label key={skillName} style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  aria-label={`Select ${skillName}`}
                  checked={(persona.skillRefs || []).includes(skillName)}
                  onChange={(event) =>
                    setPersona((prev: AgentPersonaValue) => ({
                      ...prev,
                      skillRefs: event.target.checked
                        ? [...(prev.skillRefs || []), skillName]
                        : (prev.skillRefs || []).filter((item: string) => item !== skillName),
                    }))
                  }
                />{' '}
                {skillName}
              </label>
            );
          })}
        </fieldset>
      );
    }
    if (currentStep === 'appearance') return <AgentAppearanceEditor value={appearance} onChange={setAppearance} />;
    if (currentStep === 'voice')
      return (
        <AgentVoiceEditor org={org} name={`${name}-voice`} value={voice} onChange={setVoice} />
      );
    if (currentStep === 'infrastructure')
      return <AgentDefinitionForm stacks={stacks} value={definition} onChange={setDefinition} />;
    return (
      <div className="card">
        <h3>Review</h3>
        <dl className="kv">
          <dt>Name</dt>
          <dd>{name}</dd>
          <dt>Display</dt>
          <dd>{persona.displayName}</dd>
          <dt>Stack</dt>
          <dd>{definition.stackRef || 'not selected'}</dd>
          <dt>Resources</dt>
          <dd>AgentPersona, AgentSoul, AgentAppearance, AgentVoiceProfile, AgentDefinition</dd>
        </dl>
      </div>
    );
  }

  return (
    <form onSubmit={createAgent} className="stack" aria-label="Create agent wizard">
      <div className="card">
        <div className="cardTitle">
          <h2>Create Agent</h2>
          <span>{currentStep}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {STEPS.map((step, index) => (
            <button
              key={step}
              type="button"
              aria-label={`Go to ${step}`}
              onClick={() => setStepIndex(index)}
              className={index === stepIndex ? 'pill good' : 'pill neutral'}
            >
              {step}
            </button>
          ))}
        </div>
        {renderStep()}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="button"
            aria-label="Previous wizard step"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((v) => Math.max(0, v - 1))}
          >
            Previous
          </button>
          {stepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              aria-label="Next wizard step"
              onClick={() => setStepIndex((v) => Math.min(STEPS.length - 1, v + 1))}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Create agent resources"
              disabled={status === 'creating' || !persona.displayName || !definition.stackRef}
            >
              {status === 'creating' ? 'Creating...' : 'Create agent'}
            </button>
          )}
        </div>
        {message ? <p className={status === 'error' ? 'errorText' : 'muted'}>{message}</p> : null}
        {createdResources.length ? (
          <p className="muted">{createdResources.length} resources created in this attempt.</p>
        ) : null}
      </div>
    </form>
  );
}
