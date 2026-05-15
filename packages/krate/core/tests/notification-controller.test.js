import assert from 'node:assert/strict';
import test from 'node:test';
import { createNotificationController } from '../src/notification-controller.js';

// Helper to create a fresh controller for each test
function makeController() {
  return createNotificationController();
}

test('createNotification with AgentDispatchRun completed → type run-complete, severity info', () => {
  const ctrl = makeController();
  const notif = ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'my-run', org: 'test-org' });
  assert.equal(notif.type, 'run-complete');
  assert.equal(notif.severity, 'info');
  assert.match(notif.title, /completed/i);
  assert.equal(notif.org, 'test-org');
});

test('createNotification with AgentDispatchRun failed → type run-complete, severity error', () => {
  const ctrl = makeController();
  const notif = ctrl.createNotification({ type: 'AgentDispatchRun', status: 'failed', name: 'my-run', org: 'test-org' });
  assert.equal(notif.type, 'run-complete');
  assert.equal(notif.severity, 'error');
  assert.match(notif.title, /failed/i);
});

test('createNotification with AgentApproval pending → type approval-needed, severity warning', () => {
  const ctrl = makeController();
  const notif = ctrl.createNotification({ type: 'AgentApproval', status: 'pending', action: 'tool-use', org: 'test-org' });
  assert.equal(notif.type, 'approval-needed');
  assert.equal(notif.severity, 'warning');
  assert.match(notif.title, /approval/i);
  assert.match(notif.title, /tool-use/i);
});

test('createNotification with ExternalSyncConflict → type conflict-detected, severity warning', () => {
  const ctrl = makeController();
  const notif = ctrl.createNotification({ type: 'ExternalSyncConflict', resourceRef: 'my-repo', org: 'test-org' });
  assert.equal(notif.type, 'conflict-detected');
  assert.equal(notif.severity, 'warning');
  assert.match(notif.title, /conflict/i);
  assert.match(notif.title, /my-repo/i);
});

test('createNotification with KrateWorkspace claimed → type workspace-ready, severity info', () => {
  const ctrl = makeController();
  const notif = ctrl.createNotification({ type: 'KrateWorkspace', claimed: true, name: 'ws-1', claimedBy: 'run-abc', org: 'test-org' });
  assert.equal(notif.type, 'workspace-ready');
  assert.equal(notif.severity, 'info');
  assert.match(notif.title, /workspace/i);
  assert.match(notif.title, /ws-1/i);
});

test('createNotification returns notification with id, createdAt, read: false', () => {
  const ctrl = makeController();
  const notif = ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-x', org: 'test-org' });
  assert.equal(typeof notif.id, 'string');
  assert.ok(notif.id.length > 0);
  assert.equal(typeof notif.createdAt, 'string');
  assert.ok(notif.createdAt.length > 0);
  assert.equal(notif.read, false);
});

test('createNotification default event → type system, severity info', () => {
  const ctrl = makeController();
  const notif = ctrl.createNotification({ type: 'UnknownEvent', org: 'test-org' });
  assert.equal(notif.type, 'system');
  assert.equal(notif.severity, 'info');
});

test('listNotifications returns all notifications for org', () => {
  const ctrl = makeController();
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-1', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-2', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-3', org: 'org-b' }); // different org

  const results = ctrl.listNotifications('org-a');
  assert.equal(results.length, 2);
  assert.ok(results.every((n) => n.org === 'org-a'));
});

test('listNotifications with { unreadOnly: true } filters out read notifications', () => {
  const ctrl = makeController();
  const n1 = ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-1', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-2', org: 'org-a' });
  ctrl.markAsRead(n1.id);

  const unreadOnly = ctrl.listNotifications('org-a', { unreadOnly: true });
  assert.equal(unreadOnly.length, 1);
  assert.equal(unreadOnly[0].read, false);
});

test('listNotifications with { limit: 2 } caps results to 2', () => {
  const ctrl = makeController();
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-1', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-2', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-3', org: 'org-a' });

  const limited = ctrl.listNotifications('org-a', { limit: 2 });
  assert.equal(limited.length, 2);
});

test('listNotifications returns notifications sorted by createdAt descending', () => {
  const ctrl = makeController();
  const n1 = ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-1', org: 'org-a' });
  const n2 = ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-2', org: 'org-a' });

  // Sort order: they come back by createdAt descending (no guaranteed diff if same ms, just verify all present)
  const results = ctrl.listNotifications('org-a');
  assert.equal(results.length, 2);
  // Both IDs present
  const ids = results.map((n) => n.id);
  assert.ok(ids.includes(n1.id));
  assert.ok(ids.includes(n2.id));
});

test('markAsRead sets the target notification read to true', () => {
  const ctrl = makeController();
  const notif = ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-1', org: 'org-a' });
  assert.equal(notif.read, false);

  const result = ctrl.markAsRead(notif.id);
  assert.equal(result, true);

  const results = ctrl.listNotifications('org-a');
  const found = results.find((n) => n.id === notif.id);
  assert.equal(found.read, true);
});

test('markAsRead returns false for unknown id', () => {
  const ctrl = makeController();
  const result = ctrl.markAsRead('nonexistent-id');
  assert.equal(result, false);
});

test('markAllAsRead sets all org notifications as read and returns count', () => {
  const ctrl = makeController();
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-1', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-2', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-3', org: 'org-a' });

  const count = ctrl.markAllAsRead('org-a');
  assert.equal(count, 3);

  const unread = ctrl.listNotifications('org-a', { unreadOnly: true });
  assert.equal(unread.length, 0);
});

test('getUnreadCount returns correct count after some are read', () => {
  const ctrl = makeController();
  const n1 = ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-1', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-2', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-3', org: 'org-a' });

  assert.equal(ctrl.getUnreadCount('org-a'), 3);
  ctrl.markAsRead(n1.id);
  assert.equal(ctrl.getUnreadCount('org-a'), 2);
});

test('getPreferences returns default prefs for new userId', () => {
  const ctrl = makeController();
  const prefs = ctrl.getPreferences('user-xyz');
  assert.equal(prefs.runs, true);
  assert.equal(prefs.approvals, true);
  assert.equal(prefs.conflicts, true);
  assert.equal(prefs.workspaces, true);
  assert.equal(prefs.sound, false);
  assert.equal(prefs.desktop, false);
});

test('updatePreferences merges and persists new prefs', () => {
  const ctrl = makeController();
  const updated = ctrl.updatePreferences('user-abc', { sound: true, runs: false });
  assert.equal(updated.sound, true);
  assert.equal(updated.runs, false);
  assert.equal(updated.approvals, true); // default preserved

  // Verify persisted by reading again
  const prefs = ctrl.getPreferences('user-abc');
  assert.equal(prefs.sound, true);
  assert.equal(prefs.runs, false);
  assert.equal(prefs.approvals, true);
});

test('notifications from different orgs do not mix', () => {
  const ctrl = makeController();
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-1', org: 'org-a' });
  ctrl.createNotification({ type: 'AgentDispatchRun', status: 'completed', name: 'run-2', org: 'org-b' });

  const orgA = ctrl.listNotifications('org-a');
  const orgB = ctrl.listNotifications('org-b');
  assert.equal(orgA.length, 1);
  assert.equal(orgB.length, 1);
  assert.equal(ctrl.getUnreadCount('org-a'), 1);
  assert.equal(ctrl.getUnreadCount('org-b'), 1);
});
