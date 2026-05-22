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
    display: 'flex', gap: 0, borderBottom: '2px solid var(--line, rgba(91,56,23,.28))',
    marginBottom: 16,
  },
  tab: (active) => ({
    padding: '10px 20px', fontSize: 14, fontWeight: active ? 700 : 500, cursor: 'pointer',
    background: 'transparent', border: 'none', borderBottom: active ? '2px solid var(--brass, #c98a3e)' : '2px solid transparent',
    marginBottom: -2, color: active ? 'var(--text, #1b1611)' : 'var(--muted, #5a4e3c)',
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
