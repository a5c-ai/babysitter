'use client';

import { useState } from 'react';

/**
 * SecretManager — manage Kubernetes Secrets and ConfigMaps with grants.
 *
 * @param {{ org: string, secrets?: object[], configMaps?: object[], grants?: object[] }} props
 */
export function SecretManager({ org = 'default', secrets = [], configMaps = [], grants = [] }) {
  const [activeTab, setActiveTab] = useState('secrets');
  const [secretList, setSecretList] = useState(secrets);
  const [configMapList, setConfigMapList] = useState(configMaps);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [kvPairs, setKvPairs] = useState([{ key: '', value: '' }]);
  const [grantedTo, setGrantedTo] = useState('');

  function addKvPair() {
    setKvPairs((prev) => [...prev, { key: '', value: '' }]);
  }

  function removeKvPair(index) {
    setKvPairs((prev) => prev.filter((_, i) => i !== index));
  }

  function updateKvPair(index, field, value) {
    setKvPairs((prev) => prev.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair)));
  }

  function resetForm() {
    setNewName('');
    setKvPairs([{ key: '', value: '' }]);
    setGrantedTo('');
    setShowCreateForm(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    if (!newName.trim()) {
      setError('Name is required');
      return;
    }

    const data = {};
    for (const pair of kvPairs) {
      if (pair.key.trim()) data[pair.key.trim()] = pair.value;
    }

    if (Object.keys(data).length === 0) {
      setError('At least one key-value pair is required');
      return;
    }

    setCreateLoading(true);
    try {
      const isSecret = activeTab === 'secrets';

      // Step 1: Create the actual Kubernetes resource (Secret or ConfigMap)
      const resource = {
        apiVersion: 'v1',
        kind: isSecret ? 'Secret' : 'ConfigMap',
        metadata: { name: newName.trim() },
        ...(isSecret
          ? { type: 'Opaque', stringData: data }
          : { data }
        ),
      };

      const res = await fetch(`/api/orgs/${encodeURIComponent(org)}/secrets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(resource),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.message || err.error || 'Create failed');
      }

      // Step 2: If grantedTo is specified, also create an AgentSecretGrant / AgentConfigGrant
      if (grantedTo.trim()) {
        const grantKind = isSecret ? 'AgentSecretGrant' : 'AgentConfigGrant';
        const grantResource = {
          apiVersion: 'krate.a5c.ai/v1alpha1',
          kind: grantKind,
          metadata: { name: `${newName.trim()}-grant-${grantedTo.trim()}` },
          spec: {
            organizationRef: org,
            ...(isSecret
              ? { secretName: newName.trim(), secretRef: newName.trim() }
              : { configMapName: newName.trim(), configMapRef: newName.trim() }
            ),
            grantedTo: grantedTo.trim(),
            subject: grantedTo.trim(),
            permissions: ['read'],
            purpose: `Grant ${grantedTo.trim()} access to ${isSecret ? 'secret' : 'configmap'} ${newName.trim()}`,
          },
        };

        await fetch(`/api/orgs/${encodeURIComponent(org)}/secrets`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(grantResource),
        }).catch(() => { /* grant creation is best-effort */ });
      }

      // Update local state
      const newItem = {
        name: newName.trim(),
        type: isSecret ? 'Opaque' : 'ConfigMap',
        createdAt: new Date().toISOString(),
        keys: Object.keys(data),
        grants: grantedTo.trim() ? [grantedTo.trim()] : [],
      };

      if (isSecret) {
        setSecretList((prev) => [...prev, newItem]);
      } else {
        setConfigMapList((prev) => [...prev, newItem]);
      }
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDelete(itemName) {
    const isSecret = activeTab === 'secrets';
    try {
      const typeParam = isSecret ? 'secret' : 'configmap';
      const res = await fetch(
        `/api/orgs/${encodeURIComponent(org)}/secrets/${encodeURIComponent(itemName)}?type=${typeParam}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.message || err.error || 'Delete failed');
      }
      if (isSecret) {
        setSecretList((prev) => prev.filter((s) => s.name !== itemName));
      } else {
        setConfigMapList((prev) => prev.filter((c) => c.name !== itemName));
      }
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    } finally {
      setPendingDelete(null);
    }
  }

  // Build grant maps
  const grantsBySecret = {};
  for (const grant of grants) {
    const sName = grant.spec?.secretName || grant.spec?.secretRef || grant.spec?.configMapName || grant.spec?.configMapRef;
    if (sName) {
      if (!grantsBySecret[sName]) grantsBySecret[sName] = [];
      grantsBySecret[sName].push(grant.spec?.grantedTo || grant.spec?.subject || 'unknown');
    }
  }

  const isSecrets = activeTab === 'secrets';
  const currentList = isSecrets ? secretList : configMapList;
  const resourceLabel = isSecrets ? 'Secret' : 'ConfigMap';
  const resourceLabelPlural = isSecrets ? 'Secrets' : 'ConfigMaps';

  return (
    <div className="secretManager">
      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', background: '#f3f4f6', borderRadius: '0.5rem', padding: '0.25rem', width: 'fit-content' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('secrets'); setShowCreateForm(false); setError(null); }}
          style={{
            padding: '0.375rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: isSecrets ? 700 : 500,
            background: isSecrets ? '#fff' : 'transparent',
            color: isSecrets ? '#111827' : '#6b7280',
            boxShadow: isSecrets ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
          }}
        >
          Secrets
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('configmaps'); setShowCreateForm(false); setError(null); }}
          style={{
            padding: '0.375rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: !isSecrets ? 700 : 500,
            background: !isSecrets ? '#fff' : 'transparent',
            color: !isSecrets ? '#111827' : '#6b7280',
            boxShadow: !isSecrets ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
          }}
        >
          ConfigMaps
        </button>
      </div>

      <div className="cardTitle">
        <h2>{resourceLabelPlural}</h2>
        <button
          className="button"
          onClick={() => { setShowCreateForm((v) => !v); setError(null); }}
          aria-expanded={showCreateForm}
        >
          {showCreateForm ? 'Cancel' : `Create ${resourceLabel}`}
        </button>
      </div>

      {error && (
        <div className="errorBanner" role="alert">{error}</div>
      )}

      {showCreateForm && (
        <form className="secretCreateForm card" onSubmit={handleCreate} aria-label={`Create new ${resourceLabel.toLowerCase()}`}>
          <h3>New {resourceLabel}</h3>
          <div className="formRow">
            <label htmlFor="resource-name">Name</label>
            <input
              id="resource-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={isSecrets ? 'my-api-key' : 'my-config'}
              required
              autoComplete="off"
            />
          </div>

          <fieldset>
            <legend>Key-value pairs</legend>
            {kvPairs.map((pair, i) => (
              <div className="kvRow" key={i}>
                <input
                  type="text"
                  placeholder="KEY"
                  value={pair.key}
                  onChange={(e) => updateKvPair(i, 'key', e.target.value)}
                  aria-label={`Key ${i + 1}`}
                />
                <input
                  type={isSecrets ? 'password' : 'text'}
                  placeholder="value"
                  value={pair.value}
                  onChange={(e) => updateKvPair(i, 'value', e.target.value)}
                  aria-label={`Value ${i + 1}`}
                />
                {kvPairs.length > 1 && (
                  <button type="button" className="buttonSmall danger" onClick={() => removeKvPair(i)} aria-label={`Remove row ${i + 1}`}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="buttonSmall" onClick={addKvPair}>
              + Add key
            </button>
          </fieldset>

          <div className="formRow">
            <label htmlFor="granted-to">Grant access to agent (optional)</label>
            <input
              id="granted-to"
              type="text"
              value={grantedTo}
              onChange={(e) => setGrantedTo(e.target.value)}
              placeholder="agent-stack-name"
            />
          </div>

          <div className="formActions">
            <button type="submit" className="button" disabled={createLoading}>
              {createLoading ? 'Creating...' : `Create ${resourceLabel}`}
            </button>
          </div>
        </form>
      )}

      {currentList.length === 0 ? (
        <p className="emptyText">
          {isSecrets
            ? 'No secrets yet. Create one above to grant agents access to credentials.'
            : 'No config maps yet. Create one above to store non-sensitive configuration data.'
          }
        </p>
      ) : (
        <ul className="resourceList secretList" aria-label={resourceLabelPlural}>
          {currentList.map((item) => {
            const agentGrants = grantsBySecret[item.name] || item.grants || [];
            const isDeletePending = pendingDelete === item.name;
            return (
              <li key={item.name} className="secretRow">
                <div className="secretInfo">
                  <strong className="secretName">{item.name}</strong>
                  <span className="secretType pill neutral">{item.type || (isSecrets ? 'Opaque' : 'ConfigMap')}</span>
                  {item.keys && item.keys.length > 0 && (
                    <small className="secretDate" style={{ color: '#6b7280' }}>{item.keys.length} key{item.keys.length !== 1 ? 's' : ''}</small>
                  )}
                  {item.createdAt && (
                    <small className="secretDate">Created {new Date(item.createdAt).toLocaleDateString()}</small>
                  )}
                </div>
                {agentGrants.length > 0 && (
                  <div className="secretGrants" aria-label="Agents with access">
                    <span className="grantsLabel">Granted to:</span>
                    {agentGrants.map((agent) => (
                      <span key={agent} className="pill good agentGrant">{agent}</span>
                    ))}
                  </div>
                )}
                <div className="secretActions">
                  {isDeletePending ? (
                    <>
                      <span className="confirmText">Delete &ldquo;{item.name}&rdquo;?</span>
                      <button className="buttonSmall danger" onClick={() => handleDelete(item.name)}>Confirm</button>
                      <button className="buttonSmall" onClick={() => setPendingDelete(null)}>Cancel</button>
                    </>
                  ) : (
                    <button
                      className="buttonSmall danger"
                      onClick={() => setPendingDelete(item.name)}
                      aria-label={`Delete ${resourceLabel.toLowerCase()} ${item.name}`}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
