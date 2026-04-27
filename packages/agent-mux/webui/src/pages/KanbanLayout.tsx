import React from 'react';
import { Outlet } from 'react-router-dom-v6';

import { NotificationProvider } from '../kanban/components/notifications/notification-provider.js';
import { ShortcutsHelp } from '../kanban/components/shared/shortcuts-help.js';

export function KanbanLayout(): JSX.Element {
  return (
    <NotificationProvider>
      <Outlet />
      <ShortcutsHelp />
    </NotificationProvider>
  );
}
