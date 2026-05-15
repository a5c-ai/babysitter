import { randomUUID } from 'node:crypto';

export const NOTIFICATION_CONTROLLER_BOUNDARY = {
  role: 'notification-controller',
  scope: 'User notification lifecycle: creation from events, querying, read state, and preferences',
  owns: ['notification creation', 'notification listing', 'read state', 'user preferences'],
  delegatesTo: [],
  mustNotOwn: ['event dispatch', 'UI rendering', 'push delivery']
};

const NOTIFICATION_TYPES = {
  'run-complete': { severity: 'info' },
  'approval-needed': { severity: 'warning' },
  'conflict-detected': { severity: 'warning' },
  'workspace-ready': { severity: 'info' },
  'system': { severity: 'info' },
};

const DEFAULT_PREFERENCES = {
  runs: true,
  approvals: true,
  conflicts: true,
  workspaces: true,
  sound: false,
  desktop: false,
};

export function createNotificationController() {
  // Map of org -> notifications[]
  const store = new Map();
  // Map of userId -> preferences
  const prefsStore = new Map();

  function getOrgNotifications(org) {
    if (!store.has(org)) store.set(org, []);
    return store.get(org);
  }

  function mapEventToNotification(event) {
    const { type, status, name, action, resourceRef, org = 'default' } = event || {};

    let notifType = 'system';
    let title = 'System event';
    let message = '';
    let severity = 'info';

    if (type === 'AgentDispatchRun') {
      notifType = 'run-complete';
      const runName = name || event?.metadata?.name || 'Unknown';
      if (status === 'completed') {
        title = `Run ${runName} completed`;
        message = `Agent dispatch run "${runName}" completed successfully.`;
        severity = 'info';
      } else if (status === 'failed') {
        title = `Run ${runName} failed`;
        message = `Agent dispatch run "${runName}" failed.`;
        severity = 'error';
      } else {
        title = `Run ${runName} updated`;
        message = `Agent dispatch run "${runName}" status: ${status || 'unknown'}.`;
        severity = 'info';
      }
    } else if (type === 'AgentApproval' && status === 'pending') {
      notifType = 'approval-needed';
      const actionLabel = action || event?.spec?.action || 'unknown action';
      title = `Approval needed for ${actionLabel}`;
      message = `An agent is requesting approval for: ${actionLabel}.`;
      severity = 'warning';
    } else if (type === 'ExternalSyncConflict') {
      notifType = 'conflict-detected';
      const resource = resourceRef || event?.spec?.resourceRef || name || 'unknown resource';
      title = `Conflict in ${resource}`;
      message = `A sync conflict was detected in resource: ${resource}.`;
      severity = 'warning';
    } else if (type === 'KrateWorkspace' && event?.claimed) {
      notifType = 'workspace-ready';
      const wsName = name || event?.metadata?.name || 'Unknown';
      const runRef = event?.claimedBy || event?.spec?.claimedBy || 'a run';
      title = `Workspace ${wsName} claimed by ${runRef}`;
      message = `Workspace "${wsName}" has been claimed by "${runRef}".`;
      severity = 'info';
    }

    return { notifType, title, message, severity, org };
  }

  return {
    role: 'notification-controller',

    createNotification(event) {
      const { notifType, title, message, severity, org } = mapEventToNotification(event);

      const notification = {
        id: randomUUID(),
        type: notifType,
        title,
        message,
        severity,
        resourceRef: event?.resourceRef || null,
        createdAt: new Date().toISOString(),
        read: false,
        org,
      };

      const notifications = getOrgNotifications(org);
      notifications.push(notification);

      return notification;
    },

    listNotifications(org, opts = {}) {
      const { unreadOnly = false, limit = 20, since = null } = opts;
      let notifications = [...getOrgNotifications(org)];

      // Filter by read state
      if (unreadOnly) {
        notifications = notifications.filter((n) => !n.read);
      }

      // Filter by since timestamp
      if (since) {
        const sinceDate = new Date(since).getTime();
        notifications = notifications.filter((n) => new Date(n.createdAt).getTime() > sinceDate);
      }

      // Newest first
      notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Cap to limit
      if (limit > 0) {
        notifications = notifications.slice(0, limit);
      }

      return notifications;
    },

    markAsRead(notificationId) {
      for (const notifications of store.values()) {
        const notification = notifications.find((n) => n.id === notificationId);
        if (notification) {
          notification.read = true;
          return true;
        }
      }
      return false;
    },

    markAllAsRead(org) {
      const notifications = getOrgNotifications(org);
      let count = 0;
      for (const notification of notifications) {
        if (!notification.read) {
          notification.read = true;
          count++;
        }
      }
      return count;
    },

    getUnreadCount(org) {
      return getOrgNotifications(org).filter((n) => !n.read).length;
    },

    getPreferences(userId) {
      if (!prefsStore.has(userId)) {
        return { ...DEFAULT_PREFERENCES };
      }
      return { ...DEFAULT_PREFERENCES, ...prefsStore.get(userId) };
    },

    updatePreferences(userId, prefs) {
      const existing = prefsStore.get(userId) || {};
      const merged = { ...DEFAULT_PREFERENCES, ...existing, ...prefs };
      prefsStore.set(userId, merged);
      return merged;
    },
  };
}
