import React from 'react';
import { Outlet } from 'react-router-dom-v6';
import { ToastProvider } from '@a5c-ai/compendium';

import { NotificationProvider } from '../components/notifications/notification-provider.js';
import { ShortcutsHelp } from '../components/shared/shortcuts-help.js';

export function KanbanLayout(): JSX.Element {
  return (
    <ToastProvider>
      <NotificationProvider>
        <Outlet />
        <ShortcutsHelp />
      </NotificationProvider>
    </ToastProvider>
  );
}
