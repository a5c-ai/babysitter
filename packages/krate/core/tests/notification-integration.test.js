/**
 * Notification controller integration tests
 *
 * Exercises end-to-end notification workflows: creating from dispatch/approval
 * events, org filtering, read-state transitions, and unread counts.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createNotificationController } from '../src/notification-controller.js';

// ---------------------------------------------------------------------------
// createNotification from dispatch run completed event
// ---------------------------------------------------------------------------

test('createNotification from dispatch run completed event produces run-complete notification', () => {
  const ctrl = createNotificationController();
  const notif = ctrl.createNotification({
    type: 'AgentDispatchRun',
    status: 'completed',
    name: 'deploy-run-001',
    org: 'acme',
  });
  assert.equal(notif.type, 'run-complete');
  assert.equal(notif.severity, 'info');
  assert.equal(notif.org, 'acme');
  assert.match(notif.title, /completed/i);
  assert.equal(notif.read, false);
  assert.ok(notif.id, 'notification must have an id');
  assert.ok(notif.createdAt, 'notification must have a createdAt timestamp');
});

test('createNotification from dispatch run failed event produces run-complete with error severity', () => {
  const ctrl = createNotificationController();
  const notif = ctrl.createNotification({
    type: 'AgentDispatchRun',
    status: 'failed',
    name: 'deploy-run-002',
    org: 'acme',
  });
  assert.equal(notif.type, 'run-complete');
  assert.equal(notif.severity, 'error');
  assert.match(notif.title, /failed/i);
});

// ---------------------------------------------------------------------------
// createNotification from approval pending event
// ---------------------------------------------------------------------------

test('createNotification from approval pending event produces approval-needed notification', () => {
  const ctrl = createNotificationController();
  const notif = ctrl.createNotification({
    type: 'AgentApproval',
    status: 'pending',
    action: 'shell-exec',
    org: 'acme',
  });
  assert.equal(notif.type, 'approval-needed');
  assert.equal(notif.severity, 'warning');
  assert.match(notif.title, /approval/i);
  assert.match(notif.title, /shell-exec/i);
  assert.equal(notif.org, 'acme');
  assert.equal(notif.read, false);
});

test('createNotification from approval event stores notification in the controller registry', () => {
  const ctrl = createNotificationController();
  const notif = ctrl.createNotification({
    type: 'AgentApproval',
    status: 'pending',
    action: 'file-write',
    org: 'beta-org',
  });
  const listed = ctrl.listNotifications('beta-org');
  assert.equal(listed.length, 1);
  assert.equal(listed[0].id, notif.id);
});

// ---------------------------------------------------------------------------
// listNotifications filters by org
// ---------------------------------------------------------------------------

test('listNotifications filters by org and excludes notifications from other orgs', () => {
  const ctrl = createNotificationController();

  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-a1', org: 'org-alpha' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-a2', org: 'org-alpha' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-b1', org: 'org-beta' });
  ctrl.createNotification({ type: 'AgentApproval', status: 'pending', action: 'tool-use', org: 'org-beta' });

  const alpha = ctrl.listNotifications('org-alpha');
  const beta = ctrl.listNotifications('org-beta');

  assert.equal(alpha.length, 2, 'org-alpha should have 2 notifications');
  assert.equal(beta.length, 2, 'org-beta should have 2 notifications');
  assert.ok(alpha.every((n) => n.org === 'org-alpha'), 'all alpha notifications have correct org');
  assert.ok(beta.every((n) => n.org === 'org-beta'), 'all beta notifications have correct org');
});

test('listNotifications returns empty array for org with no notifications', () => {
  const ctrl = createNotificationController();
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-1', org: 'org-a' });
  const result = ctrl.listNotifications('org-with-no-data');
  assert.deepEqual(result, []);
});

// ---------------------------------------------------------------------------
// getUnreadCount after marking as read
// ---------------------------------------------------------------------------

test('getUnreadCount decrements after marking individual notification as read', () => {
  const ctrl = createNotificationController();
  const n1 = ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-1', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-2', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentApproval', status: 'pending', action: 'tool', org: 'org-a' });

  assert.equal(ctrl.getUnreadCount('org-a'), 3);

  ctrl.markAsRead(n1.id);
  assert.equal(ctrl.getUnreadCount('org-a'), 2);
});

test('getUnreadCount reaches zero after markAllAsRead', () => {
  const ctrl = createNotificationController();
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-1', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentApproval', status: 'pending', action: 'tool', org: 'org-a' });
  ctrl.createNotification({ type: 'ExternalSyncConflict', resourceRef: 'my-repo', org: 'org-a' });

  assert.equal(ctrl.getUnreadCount('org-a'), 3);
  ctrl.markAllAsRead('org-a');
  assert.equal(ctrl.getUnreadCount('org-a'), 0);
});

test('getUnreadCount is isolated per org', () => {
  const ctrl = createNotificationController();
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-1', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-2', org: 'org-b' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-3', org: 'org-b' });

  ctrl.markAllAsRead('org-a');

  assert.equal(ctrl.getUnreadCount('org-a'), 0);
  assert.equal(ctrl.getUnreadCount('org-b'), 2, 'org-b unread count should be unaffected by org-a markAllAsRead');
});

test('listNotifications with unreadOnly reflects mark-as-read state', () => {
  const ctrl = createNotificationController();
  const n1 = ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'r1', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentApproval', status: 'pending', action: 'tool', org: 'org-a' });

  ctrl.markAsRead(n1.id);

  const unread = ctrl.listNotifications('org-a', { unreadOnly: true });
  assert.equal(unread.length, 1, 'only one unread notification should remain');
  assert.equal(unread[0].read, false);
  assert.notEqual(unread[0].id, n1.id, 'the read notification should not appear in unread list');
});

// ---------------------------------------------------------------------------
// Multiple notification types across one org
// ---------------------------------------------------------------------------

test('org receives notifications of multiple types in one controller instance', () => {
  const ctrl = createNotificationController();
  const org = 'mixed-org';

  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-x', org });
  ctrl.createNotification({ type: 'AgentApproval', status: 'pending', action: 'file-delete', org });
  ctrl.createNotification({ type: 'ExternalSyncConflict', resourceRef: 'repo-y', org });
  ctrl.createNotification({ type: 'KrateWorkspace', claimed: true, name: 'ws-z', claimedBy: 'run-x', org });

  const all = ctrl.listNotifications(org);
  assert.equal(all.length, 4);

  const types = all.map((n) => n.type);
  assert.ok(types.includes('run-complete'));
  assert.ok(types.includes('approval-needed'));
  assert.ok(types.includes('conflict-detected'));
  assert.ok(types.includes('workspace-ready'));
});
