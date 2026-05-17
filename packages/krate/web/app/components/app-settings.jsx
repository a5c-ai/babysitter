'use client';

import { useState, useEffect } from 'react';
import { applyTheme, readStoredTheme, storeTheme } from './theme-runtime.jsx';

const THEMES = ['light', 'dark', 'system'];
const DENSITIES = ['compact', 'default', 'spacious'];
const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Espanol (coming soon)' },
  { value: 'fr', label: 'Francais (coming soon)' },
  { value: 'de', label: 'Deutsch (coming soon)' },
  { value: 'ja', label: 'Japanese (coming soon)' },
];

const labelStyle = { display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', color: 'var(--ink-pigment)' };
const descStyle = { fontSize: '0.75rem', color: 'var(--ink-ghost)', marginTop: '0.25rem' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--line)', fontSize: '0.875rem', boxSizing: 'border-box' };
const selectStyle = { ...inputStyle };
const radioGroupStyle = { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' };
const radioLabelStyle = { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--ink-pigment)' };
const sectionStyle = { display: 'flex', flexDirection: 'column', gap: '1.25rem' };
const cardStyle = { display: 'flex', flexDirection: 'column', gap: '1rem' };

function getStoredValue(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

export function AppSettingsForm() {
  const [theme, setTheme] = useState('light');
  const [locale, setLocale] = useState('en');
  const [sseEnabled, setSseEnabled] = useState(true);
  const [cacheTtl, setCacheTtl] = useState('300');
  const [density, setDensity] = useState('default');
  const [saved, setSaved] = useState(false);

  // Notification preferences
  const [notifyRuns, setNotifyRuns] = useState(true);
  const [notifyApprovals, setNotifyApprovals] = useState(true);
  const [notifyConflicts, setNotifyConflicts] = useState(true);
  const [notifyWorkspaces, setNotifyWorkspaces] = useState(true);
  const [notifySound, setNotifySound] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState('default');

  useEffect(() => {
    setTheme(readStoredTheme('light'));
    setLocale(getStoredValue('krate-locale', 'en'));
    setSseEnabled(getStoredValue('krate-sse-enabled', 'true') === 'true');
    setCacheTtl(getStoredValue('krate-cache-ttl', '300'));
    setDensity(getStoredValue('krate-density', 'default'));
    setNotifyRuns(getStoredValue('krate-notify-runs', 'true') === 'true');
    setNotifyApprovals(getStoredValue('krate-notify-approvals', 'true') === 'true');
    setNotifyConflicts(getStoredValue('krate-notify-conflicts', 'true') === 'true');
    setNotifyWorkspaces(getStoredValue('krate-notify-workspaces', 'true') === 'true');
    setNotifySound(getStoredValue('krate-notify-sound', 'false') === 'true');
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setDesktopPermission(Notification.permission);
    }

    applyTheme(readStoredTheme('light'));
  }, []);

  function handleThemeChange(newTheme) {
    setTheme(newTheme);
    storeTheme(newTheme);
    flashSaved();
  }

  function handleLocaleChange(newLocale) {
    setLocale(newLocale);
    localStorage.setItem('krate-locale', newLocale);
    flashSaved();
  }

  function handleSseToggle() {
    const next = !sseEnabled;
    setSseEnabled(next);
    localStorage.setItem('krate-sse-enabled', String(next));
    flashSaved();
  }

  function handleCacheTtlChange(value) {
    setCacheTtl(value);
    localStorage.setItem('krate-cache-ttl', value);
    flashSaved();
  }

  function handleDensityChange(newDensity) {
    setDensity(newDensity);
    localStorage.setItem('krate-density', newDensity);
    flashSaved();
  }

  function handleNotifyToggle(key, setter, current) {
    const next = !current;
    setter(next);
    localStorage.setItem(key, String(next));
    flashSaved();
  }

  function handleRequestDesktopPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        setDesktopPermission(permission);
      });
    }
  }

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    function handleChange() {
      if (theme === 'system') applyTheme('system');
    }
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <div style={sectionStyle}>
      <div className="card" style={cardStyle}>
        <div className="cardTitle"><h2>Appearance</h2></div>
        <div>
          <label style={labelStyle}>Theme</label>
          <div style={radioGroupStyle}>
            {THEMES.map(t => (
              <label key={t} style={radioLabelStyle}>
                <input type="radio" name="theme" value={t} checked={theme === t} onChange={() => handleThemeChange(t)} />
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </label>
            ))}
          </div>
          <p style={descStyle}>Choose a color scheme. System follows your OS preference.</p>
        </div>
        <div>
          <label style={labelStyle}>Display density</label>
          <div style={radioGroupStyle}>
            {DENSITIES.map(d => (
              <label key={d} style={radioLabelStyle}>
                <input type="radio" name="density" value={d} checked={density === d} onChange={() => handleDensityChange(d)} />
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </label>
            ))}
          </div>
          <p style={descStyle}>Controls the spacing and padding throughout the interface.</p>
        </div>
      </div>

      <div className="card" style={cardStyle}>
        <div className="cardTitle"><h2>Language and region</h2></div>
        <div>
          <label style={labelStyle}>Language / Locale</label>
          <select value={locale} onChange={e => handleLocaleChange(e.target.value)} style={{ ...selectStyle, maxWidth: '320px' }}>
            {LOCALES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <p style={descStyle}>Only English is fully supported at this time.</p>
        </div>
      </div>

      <div className="card" style={cardStyle}>
        <div className="cardTitle"><h2>Live updates</h2></div>
        <div>
          <label style={{ ...radioLabelStyle, fontWeight: 600 }}>
            <input type="checkbox" checked={sseEnabled} onChange={handleSseToggle} />
            Enable SSE live updates
          </label>
          <p style={descStyle}>When enabled, dashboards receive real-time resource change notifications via Server-Sent Events.</p>
        </div>
      </div>

      <div className="card" style={cardStyle}>
        <div className="cardTitle"><h2>Cache</h2></div>
        <div>
          <label style={labelStyle}>Snapshot cache TTL (seconds)</label>
          <input
            type="number"
            min="0"
            max="86400"
            value={cacheTtl}
            onChange={e => handleCacheTtlChange(e.target.value)}
            style={{ ...inputStyle, maxWidth: '200px' }}
          />
          <p style={descStyle}>Duration in seconds that snapshot data is cached before a refresh is required. Set to 0 to disable caching.</p>
        </div>
      </div>

      <div className="card" style={cardStyle}>
        <div className="cardTitle"><h2>Notifications</h2></div>
        <div>
          <label style={{ ...radioLabelStyle, fontWeight: 600 }}>
            <input type="checkbox" checked={notifyRuns} onChange={() => handleNotifyToggle('krate-notify-runs', setNotifyRuns, notifyRuns)} />
            Run completions
          </label>
          <p style={descStyle}>Notify when agent dispatch runs complete or fail.</p>
        </div>
        <div>
          <label style={{ ...radioLabelStyle, fontWeight: 600 }}>
            <input type="checkbox" checked={notifyApprovals} onChange={() => handleNotifyToggle('krate-notify-approvals', setNotifyApprovals, notifyApprovals)} />
            Approval requests
          </label>
          <p style={descStyle}>Notify when an agent requests approval for an action.</p>
        </div>
        <div>
          <label style={{ ...radioLabelStyle, fontWeight: 600 }}>
            <input type="checkbox" checked={notifyConflicts} onChange={() => handleNotifyToggle('krate-notify-conflicts', setNotifyConflicts, notifyConflicts)} />
            Sync conflicts
          </label>
          <p style={descStyle}>Notify when external sync conflicts are detected.</p>
        </div>
        <div>
          <label style={{ ...radioLabelStyle, fontWeight: 600 }}>
            <input type="checkbox" checked={notifyWorkspaces} onChange={() => handleNotifyToggle('krate-notify-workspaces', setNotifyWorkspaces, notifyWorkspaces)} />
            Workspace updates
          </label>
          <p style={descStyle}>Notify when workspaces are claimed or released.</p>
        </div>
        <div>
          <label style={{ ...radioLabelStyle, fontWeight: 600 }}>
            <input type="checkbox" checked={notifySound} onChange={() => handleNotifyToggle('krate-notify-sound', setNotifySound, notifySound)} />
            Sound
          </label>
          <p style={descStyle}>Play a sound when notifications arrive.</p>
        </div>
        <div>
          <p style={{ ...descStyle, marginTop: 0 }}>Desktop notifications: <strong>{desktopPermission}</strong></p>
          {typeof window !== 'undefined' && 'Notification' in window && desktopPermission === 'default' && (
            <button
              type="button"
              onClick={handleRequestDesktopPermission}
              style={{ marginTop: '0.5rem', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--ink-pigment)' }}
            >
              Request desktop notifications permission
            </button>
          )}
        </div>
      </div>

      {saved && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', background: 'var(--accent-viridian)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 50 }}>
          Settings saved
        </div>
      )}
    </div>
  );
}
