import React, { useState } from 'react';

export interface SessionTabsProps {
  transcriptContent: React.ReactNode;
  flowContent: React.ReactNode;
}

export function SessionTabs({ transcriptContent, flowContent }: SessionTabsProps): JSX.Element {
  const [tab, setTab] = useState<'transcript' | 'flow'>('transcript');
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }} role="tablist" aria-label="Session detail views">
        <button
          onClick={() => setTab('transcript')}
          role="tab"
          aria-selected={tab === 'transcript'}
          style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #d1d5db', backgroundColor: tab === 'transcript' ? '#1e293b' : 'transparent', color: tab === 'transcript' ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}
        >
          Transcript
        </button>
        <button
          onClick={() => setTab('flow')}
          role="tab"
          aria-selected={tab === 'flow'}
          style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #d1d5db', backgroundColor: tab === 'flow' ? '#1e293b' : 'transparent', color: tab === 'flow' ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}
        >
          Flow
        </button>
      </div>
      {tab === 'transcript' ? transcriptContent : flowContent}
    </div>
  );
}
