/**
 * Web status-tones utility tests — statusTone, phaseBadgeColor
 *
 * These tests run in Node.js without Next.js or React.
 * They exercise the pure-logic helpers in app/lib/status-tones.js.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { statusTone, phaseBadgeColor } from '../app/lib/status-tones.js';

// ---------------------------------------------------------------------------
// statusTone — 'good' phases
// ---------------------------------------------------------------------------

test("statusTone('Active') returns 'good'", () => {
  assert.equal(statusTone('Active'), 'good');
});

test("statusTone('Ready') returns 'good'", () => {
  assert.equal(statusTone('Ready'), 'good');
});

test("statusTone('Running') returns 'good'", () => {
  assert.equal(statusTone('Running'), 'good');
});

test("statusTone('Open') returns 'good'", () => {
  assert.equal(statusTone('Open'), 'good');
});

test("statusTone('Merged') returns 'good'", () => {
  assert.equal(statusTone('Merged'), 'good');
});

test("statusTone('Succeeded') returns 'good'", () => {
  assert.equal(statusTone('Succeeded'), 'good');
});

test("statusTone('Completed') returns 'good'", () => {
  assert.equal(statusTone('Completed'), 'good');
});

test("statusTone('Healthy') returns 'good'", () => {
  assert.equal(statusTone('Healthy'), 'good');
});

test("statusTone('Bound') returns 'good'", () => {
  assert.equal(statusTone('Bound'), 'good');
});

// ---------------------------------------------------------------------------
// statusTone — 'warn' phases
// ---------------------------------------------------------------------------

test("statusTone('Pending') returns 'warn'", () => {
  assert.equal(statusTone('Pending'), 'warn');
});

test("statusTone('Queued') returns 'warn'", () => {
  assert.equal(statusTone('Queued'), 'warn');
});

test("statusTone('Starting') returns 'warn'", () => {
  assert.equal(statusTone('Starting'), 'warn');
});

test("statusTone('In-Progress') returns 'warn'", () => {
  assert.equal(statusTone('In-Progress'), 'warn');
});

test("statusTone('Review') returns 'warn'", () => {
  assert.equal(statusTone('Review'), 'warn');
});

test("statusTone('Warning') returns 'warn'", () => {
  assert.equal(statusTone('Warning'), 'warn');
});

test("statusTone('Degraded') returns 'warn'", () => {
  assert.equal(statusTone('Degraded'), 'warn');
});

// ---------------------------------------------------------------------------
// statusTone — 'danger' phases
// ---------------------------------------------------------------------------

test("statusTone('Failed') returns 'danger'", () => {
  assert.equal(statusTone('Failed'), 'danger');
});

test("statusTone('Error') returns 'danger'", () => {
  assert.equal(statusTone('Error'), 'danger');
});

test("statusTone('Closed') returns 'danger'", () => {
  assert.equal(statusTone('Closed'), 'danger');
});

test("statusTone('Denied') returns 'danger'", () => {
  assert.equal(statusTone('Denied'), 'danger');
});

test("statusTone('Rejected') returns 'danger'", () => {
  assert.equal(statusTone('Rejected'), 'danger');
});

test("statusTone('Unhealthy') returns 'danger'", () => {
  assert.equal(statusTone('Unhealthy'), 'danger');
});

test("statusTone('Dead') returns 'danger'", () => {
  assert.equal(statusTone('Dead'), 'danger');
});

// ---------------------------------------------------------------------------
// statusTone — 'neutral' cases
// ---------------------------------------------------------------------------

test('statusTone(null) returns neutral', () => {
  assert.equal(statusTone(null), 'neutral');
});

test('statusTone(undefined) returns neutral', () => {
  assert.equal(statusTone(undefined), 'neutral');
});

test("statusTone('') returns neutral", () => {
  assert.equal(statusTone(''), 'neutral');
});

test("statusTone('Unknown') returns neutral", () => {
  assert.equal(statusTone('Unknown'), 'neutral');
});

test("statusTone('SomeArbitraryPhase') returns neutral", () => {
  assert.equal(statusTone('SomeArbitraryPhase'), 'neutral');
});

// ---------------------------------------------------------------------------
// statusTone — case-insensitive matching
// ---------------------------------------------------------------------------

test('statusTone is case-insensitive (ACTIVE → good)', () => {
  assert.equal(statusTone('ACTIVE'), 'good');
});

test('statusTone is case-insensitive (failed → danger)', () => {
  assert.equal(statusTone('failed'), 'danger');
});

test('statusTone is case-insensitive (PENDING → warn)', () => {
  assert.equal(statusTone('PENDING'), 'warn');
});

// ---------------------------------------------------------------------------
// phaseBadgeColor
// ---------------------------------------------------------------------------

test("phaseBadgeColor('Active') returns green hex", () => {
  assert.equal(phaseBadgeColor('Active'), '#22c55e');
});

test("phaseBadgeColor('Failed') returns red hex", () => {
  assert.equal(phaseBadgeColor('Failed'), '#ef4444');
});

test("phaseBadgeColor('Pending') returns yellow hex", () => {
  assert.equal(phaseBadgeColor('Pending'), '#eab308');
});

test("phaseBadgeColor(null) returns grey hex", () => {
  assert.equal(phaseBadgeColor(null), '#9ca3af');
});

test("phaseBadgeColor('Unknown') returns grey hex", () => {
  assert.equal(phaseBadgeColor('Unknown'), '#9ca3af');
});

test('phaseBadgeColor maps all four tone values to distinct colors', () => {
  const good = phaseBadgeColor('Active');
  const warn = phaseBadgeColor('Pending');
  const danger = phaseBadgeColor('Failed');
  const neutral = phaseBadgeColor(null);

  // All four colors must be distinct
  const colors = new Set([good, warn, danger, neutral]);
  assert.equal(colors.size, 4, 'all four tones must map to distinct badge colors');

  // All must look like hex colors
  for (const color of colors) {
    assert.match(color, /^#[0-9a-f]{6}$/i, `${color} must be a 6-digit hex color`);
  }
});
