'use client';

import { useState, useEffect } from 'react';
import {
  labelStyle, inputStyle, sectionHeaderStyle, sectionBodyStyle, badgeStyle,
  JITSI_MEETING_ROLES, JITSI_AUDIO_MODES,
  JITSI_VIDEO_TOOLS, JITSI_AUDIO_TOOLS, JITSI_GOVERNED_DEFAULTS,
} from './stack-builder-graph-styles.jsx';

// ---------------------------------------------------------------------------
// Meeting / Video section — drives the `meeting` state that buildStackResource
// translates into spec.jitsiCapability / spec.jitsiConfig (G14). Fetches the
// provider / appearance / voice pickers from their list routes.
// ---------------------------------------------------------------------------

const MODES = [
  { value: 'text', label: 'Text only' },
  { value: 'voice', label: 'Voice' },
  { value: 'video', label: 'Video (avatar)' },
];

export function MeetingVideoSection({ org, meeting, onChange }) {
  const [open, setOpen] = useState(!!meeting?.enabled);
  const [providers, setProviders] = useState([]);
  const [appearances, setAppearances] = useState([]);
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch picker data sources once the section is opened. Proper deps array +
  // error handling (matches component-structure useEffect/error-handling rules).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);

    async function loadList(url) {
      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        if (Array.isArray(data)) return data;
        return data.items || data.resources || [];
      } catch (err) {
        console.warn('[kradle]', err.message || err);
        return [];
      }
    }

    Promise.all([
      loadList(`/api/orgs/${encodeURIComponent(org)}/jitsi/providers`),
      loadList(`/api/orgs/${encodeURIComponent(org)}/agents/appearances`),
      loadList(`/api/orgs/${encodeURIComponent(org)}/agents/voices`),
    ])
      .then(([prov, appr, voc]) => {
        if (cancelled) return;
        setProviders(prov);
        setAppearances(appr);
        setVoices(voc);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open, org]);

  const m = meeting || {};

  function patch(next) {
    onChange({ ...m, ...next });
  }

  function handleMode(mode) {
    const enabled = mode !== 'text';
    // When switching to video, seed video tools; voice → audio tools.
    const tools = mode === 'video' ? JITSI_VIDEO_TOOLS : mode === 'voice' ? JITSI_AUDIO_TOOLS : [];
    patch({
      enabled,
      mode,
      tools,
      governedTools: mode === 'video' ? JITSI_GOVERNED_DEFAULTS : [],
      // Observer cannot speak/publish — keep role valid for the modality.
      ...(m.role === 'observer' && mode !== 'text' ? { role: 'agent' } : {}),
    });
  }

  const isObserver = m.role === 'observer';
  const audioOptions = isObserver ? JITSI_AUDIO_MODES.filter((a) => a === 'none' || a === 'receive') : JITSI_AUDIO_MODES;
  const optName = (r) => r?.metadata?.name || r?.name || r?.id;

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div
        style={sectionHeaderStyle}
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
        aria-label="Toggle meeting and video section"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o); } }}
      >
        <span>
          <strong>Meeting / Video</strong>
          {m.enabled && (
            <span style={{ ...badgeStyle, background: 'var(--surface-raised)', color: 'var(--accent)' }}>
              {m.mode === 'video' ? 'video' : m.mode === 'voice' ? 'voice' : 'on'}
            </span>
          )}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Jitsi meeting capability {open ? '▲' : '▼'}
        </span>
      </div>

      {open && (
        <div style={sectionBodyStyle}>
          {loading && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading meeting resources...</span>}

          <div>
            <label style={labelStyle}>Modality</label>
            <select
              style={{ ...inputStyle, background: 'var(--surface)' }}
              value={m.mode || 'text'}
              onChange={(e) => handleMode(e.target.value)}
              aria-label="Meeting modality"
            >
              {MODES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {m.enabled && (
            <>
              <div>
                <label style={labelStyle}>Meeting Provider</label>
                <select
                  style={{ ...inputStyle, background: 'var(--surface)' }}
                  value={m.providerRef || ''}
                  onChange={(e) => patch({ providerRef: e.target.value })}
                  aria-label="Jitsi meeting provider"
                >
                  <option value="">-- Select provider --</option>
                  {providers.map((p) => { const n = optName(p); return <option key={n} value={n}>{n}</option>; })}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Meeting Role</label>
                <select
                  style={{ ...inputStyle, background: 'var(--surface)' }}
                  value={m.role || 'agent'}
                  onChange={(e) => patch({ role: e.target.value })}
                  aria-label="Meeting role"
                >
                  {JITSI_MEETING_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Audio</label>
                <select
                  style={{ ...inputStyle, background: 'var(--surface)' }}
                  value={m.audioMode || 'speak'}
                  onChange={(e) => patch({ audioMode: e.target.value })}
                  aria-label="Audio capability"
                >
                  {audioOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                {isObserver && (
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Observers cannot speak or publish video.
                  </small>
                )}
              </div>

              {(m.mode === 'voice' || m.mode === 'video') && (
                <div>
                  <label style={labelStyle}>Voice Profile</label>
                  <select
                    style={{ ...inputStyle, background: 'var(--surface)' }}
                    value={m.voiceProfileRef || ''}
                    onChange={(e) => patch({ voiceProfileRef: e.target.value })}
                    aria-label="Voice profile"
                  >
                    <option value="">-- None --</option>
                    {voices.map((v) => { const n = optName(v); return <option key={n} value={n}>{n}</option>; })}
                  </select>
                </div>
              )}

              {m.mode === 'video' && (
                <>
                  <div>
                    <label style={labelStyle}>Avatar Appearance</label>
                    <select
                      style={{ ...inputStyle, background: 'var(--surface)' }}
                      value={m.avatarRef || ''}
                      onChange={(e) => patch({ avatarRef: e.target.value })}
                      aria-label="Avatar appearance"
                    >
                      <option value="">-- Select appearance --</option>
                      {appearances.map((a) => { const n = optName(a); return <option key={n} value={n}>{n}</option>; })}
                    </select>
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Required to publish video (AgentAppearance).
                    </small>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }} aria-label="Publish video toggle">
                    <input
                      type="checkbox"
                      checked={m.videoPublish !== false}
                      onChange={(e) => patch({ videoPublish: e.target.checked })}
                      disabled={isObserver}
                      aria-label="Publish video"
                    />
                    Publish video (drive avatar)
                  </label>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
