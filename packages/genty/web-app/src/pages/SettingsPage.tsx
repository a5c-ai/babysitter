import { useState } from 'react';

type Theme = 'system' | 'light' | 'dark';

export function SettingsPage() {
  const [gatewayUrl, setGatewayUrl] = useState('ws://localhost:8080');
  const [theme, setTheme] = useState<Theme>('system');
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // Gateway wiring happens later; persist to localStorage for now.
    localStorage.setItem('genty:gatewayUrl', gatewayUrl);
    localStorage.setItem('genty:theme', theme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ margin: '0 0 1.5rem' }}>Settings</h1>
      <form onSubmit={handleSave}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
            Gateway URL
          </label>
          <input
            type="text"
            value={gatewayUrl}
            onChange={(e) => setGatewayUrl(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
            placeholder="ws://localhost:8080"
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
            Theme
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <button
          type="submit"
          style={{ padding: '0.5rem 1.25rem', background: '#7c6ff7', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
