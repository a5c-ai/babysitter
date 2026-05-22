export type HomeTabId = 'active' | 'sessions' | 'agents' | 'inbox' | 'settings';

export const HOME_TABS: ReadonlyArray<{ id: HomeTabId; label: string }> = [
  { id: 'active', label: 'Active' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'agents', label: 'Agents' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'settings', label: 'Settings' },
];
