'use client';
import { useState } from 'react';
import { AssistantChat } from './assistant-chat.jsx';
import { AssistantGenerate } from './assistant-generate.jsx';

const TABS = [
  { key: 'chat', label: 'Chat' },
  { key: 'generate', label: 'Generate' },
];

const tabStyles = {
  bar: {
    display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
    marginBottom: 16,
  },
  tab: (active) => ({
    padding: '10px 20px', fontSize: '0.85rem', fontWeight: active ? 700 : 500, cursor: 'pointer',
    background: 'transparent', border: 'none', borderBottom: active ? '2px solid var(--accent, #2563eb)' : '2px solid transparent',
    marginBottom: -1, color: active ? 'var(--text)' : 'var(--text-muted)',
  }),
  content: {
    minHeight: 500,
  },
};

export function AssistantTabs({ org, stacks = [] }) {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div>
      <div style={tabStyles.bar} role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={tabStyles.tab(activeTab === tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={tabStyles.content} role="tabpanel">
        {activeTab === 'chat' && <AssistantChat org={org} stacks={stacks} />}
        {activeTab === 'generate' && <AssistantGenerate org={org} stacks={stacks} />}
      </div>
    </div>
  );
}
