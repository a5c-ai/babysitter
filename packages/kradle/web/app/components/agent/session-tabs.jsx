'use client';
import { useState } from 'react';

export function SessionDetailTabs({ transcriptContent, flowContent }) {
  const [tab, setTab] = useState('transcript');
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }} role="tablist" aria-label="Session detail views">
        <button onClick={() => setTab('transcript')} role="tab" aria-selected={tab === 'transcript'} style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: tab === 'transcript' ? 'var(--text)' : 'transparent', color: tab === 'transcript' ? 'var(--surface)' : 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Transcript</button>
        <button onClick={() => setTab('flow')} role="tab" aria-selected={tab === 'flow'} style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: tab === 'flow' ? 'var(--text)' : 'transparent', color: tab === 'flow' ? 'var(--surface)' : 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Flow</button>
      </div>
      {tab === 'transcript' ? transcriptContent : flowContent}
    </div>
  );
}
