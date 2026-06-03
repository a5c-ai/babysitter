/**
 * Component Exports Tests — Verify that shared component modules export the expected symbols.
 *
 * Uses pathToFileURL for Windows compatibility when dynamically importing JSX/JS modules.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── inference-helpers.jsx exports ───────────────────────────────────────────

const inferenceHelpersUrl = pathToFileURL(path.join(webRoot, 'app', 'components', 'inference', 'inference-helpers.jsx')).href;

// We cannot import JSX in plain Node, but we can read and verify exported identifiers via source.
import fs from 'node:fs';

const inferenceHelpersSrc = fs.readFileSync(path.join(webRoot, 'app', 'components', 'inference', 'inference-helpers.jsx'), 'utf8');

test('inference-helpers.jsx exports relativeTime', () => {
  assert.ok(inferenceHelpersSrc.includes('export function relativeTime'), 'relativeTime should be exported');
});

test('inference-helpers.jsx exports badgeStyle', () => {
  assert.ok(inferenceHelpersSrc.includes('export const badgeStyle'), 'badgeStyle should be exported');
});

test('inference-helpers.jsx exports btnStyle', () => {
  assert.ok(inferenceHelpersSrc.includes('export const btnStyle'), 'btnStyle should be exported');
});

test('inference-helpers.jsx exports cardStyle', () => {
  assert.ok(inferenceHelpersSrc.includes('export const cardStyle'), 'cardStyle should be exported');
});

test('inference-helpers.jsx exports inputStyle', () => {
  assert.ok(inferenceHelpersSrc.includes('export const inputStyle'), 'inputStyle should be exported');
});

test('inference-helpers.jsx exports labelStyle', () => {
  assert.ok(inferenceHelpersSrc.includes('export const labelStyle'), 'labelStyle should be exported');
});

test('inference-helpers.jsx exports CopyButton', () => {
  assert.ok(inferenceHelpersSrc.includes('export function CopyButton'), 'CopyButton should be exported');
});

test('inference-helpers.jsx exports FrameworkBadge', () => {
  assert.ok(inferenceHelpersSrc.includes('export const FrameworkBadge'), 'FrameworkBadge should be exported');
});

test('inference-helpers.jsx exports StatusBadge', () => {
  assert.ok(inferenceHelpersSrc.includes('export const StatusBadge'), 'StatusBadge should be exported');
});

// ── pagination.jsx exports ──────────────────────────────────────────────────

const paginationSrc = fs.readFileSync(path.join(webRoot, 'app', 'components', 'shell', 'pagination.jsx'), 'utf8');

test('pagination.jsx exports Pagination', () => {
  assert.ok(paginationSrc.includes('export const Pagination'), 'Pagination should be exported');
});

// ── agent-pages.jsx barrel exports ──────────────────────────────────────────

const agentPagesSrc = fs.readFileSync(path.join(webRoot, 'app', 'pages', 'agent-pages.jsx'), 'utf8');

test('agent-pages.jsx re-exports AgentsDashboardPage', () => {
  assert.ok(agentPagesSrc.includes('AgentsDashboardPage'), 'AgentsDashboardPage should be re-exported');
});

test('agent-pages.jsx re-exports AgentStacksPage', () => {
  assert.ok(agentPagesSrc.includes('AgentStacksPage'), 'AgentStacksPage should be re-exported');
});

test('agent-pages.jsx re-exports AgentRunsPage', () => {
  assert.ok(agentPagesSrc.includes('AgentRunsPage'), 'AgentRunsPage should be re-exported');
});

test('agent-pages.jsx re-exports AgentSessionsPage', () => {
  assert.ok(agentPagesSrc.includes('AgentSessionsPage'), 'AgentSessionsPage should be re-exported');
});

test('agent-pages.jsx re-exports AgentRulesPage', () => {
  assert.ok(agentPagesSrc.includes('AgentRulesPage'), 'AgentRulesPage should be re-exported');
});

test('agent-pages.jsx re-exports AgentWorkspacesPage', () => {
  assert.ok(agentPagesSrc.includes('AgentWorkspacesPage'), 'AgentWorkspacesPage should be re-exported');
});

test('agent-pages.jsx re-exports AgentProjectsPage', () => {
  assert.ok(agentPagesSrc.includes('AgentProjectsPage'), 'AgentProjectsPage should be re-exported');
});

test('agent-pages.jsx re-exports AgentMemoryPage', () => {
  assert.ok(agentPagesSrc.includes('AgentMemoryPage'), 'AgentMemoryPage should be re-exported');
});

test('agent-pages.jsx re-exports AgentApprovalsPage', () => {
  assert.ok(agentPagesSrc.includes('AgentApprovalsPage'), 'AgentApprovalsPage should be re-exported');
});

test('agent-pages.jsx re-exports AgentSettingsPage', () => {
  assert.ok(agentPagesSrc.includes('AgentSettingsPage'), 'AgentSettingsPage should be re-exported');
});

test('agent-pages.jsx re-exports agent identity directory pages', () => {
  assert.ok(agentPagesSrc.includes('AgentDirectoryPage'), 'AgentDirectoryPage should be re-exported');
  assert.ok(agentPagesSrc.includes('AgentProfileRoutePage'), 'AgentProfileRoutePage should be re-exported');
  assert.ok(agentPagesSrc.includes('AgentCreateRoutePage'), 'AgentCreateRoutePage should be re-exported');
  assert.ok(agentPagesSrc.includes('agent-identity-pages.jsx'), 'agent identity pages module should be referenced');
});

test('agent-pages.jsx re-exports shared helpers from agent-helpers', () => {
  assert.ok(agentPagesSrc.includes('phaseTone'), 'phaseTone should be re-exported');
  assert.ok(agentPagesSrc.includes('relativeTime'), 'relativeTime should be re-exported');
  assert.ok(agentPagesSrc.includes('ToolCallCard'), 'ToolCallCard should be re-exported');
  assert.ok(agentPagesSrc.includes('TranscriptMessage'), 'TranscriptMessage should be re-exported');
});
