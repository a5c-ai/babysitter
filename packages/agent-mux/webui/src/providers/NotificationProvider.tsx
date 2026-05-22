import React, { useEffect, useRef } from 'react';
import { useHookRequests } from '@a5c-ai/agent-mux-ui';
import { useToasts } from '@a5c-ai/compendium';
import { useNavigate } from 'react-router-dom-v6';

import { requestDesktopNotificationPermission, showDesktopHookNotification } from '../web-only/desktop-notifications.js';
import { useGatewayAuth } from './GatewayProvider.js';

function NotificationBridge(): null {
  const navigate = useNavigate();
  const hooks = useHookRequests();
  const { push } = useToasts();
  const seenRef = useRef(new Set<string>());

  useEffect(() => {
    void requestDesktopNotificationPermission();
  }, []);

  useEffect(() => {
    for (const hook of hooks) {
      if (seenRef.current.has(hook.hookRequestId)) {
        continue;
      }
      seenRef.current.add(hook.hookRequestId);

      // In-app toast via compendium
      push({ title: 'Hook request', message: hook.hookKind || 'Pending approval', kind: 'info' });

      // Desktop notification when tab is not visible
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        showDesktopHookNotification({
          title: 'agent-mux hook approval',
          body: `${hook.hookKind} requires attention`,
          onClick: () => navigate('/inbox'),
        });
      }
    }
  }, [hooks, navigate, push]);

  return null;
}

export function NotificationProvider(props: { children: React.ReactNode }): JSX.Element {
  const { isAuthenticated } = useGatewayAuth();
  return (
    <>
      {isAuthenticated ? <NotificationBridge /> : null}
      {props.children}
    </>
  );
}
