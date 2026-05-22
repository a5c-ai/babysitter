/**
 * Tests that plugins register the expected views, event renderers, and commands.
 *
 * Uses a mock TuiContext to capture registrations without needing a real
 * agent-mux client.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  babysitterStatusPlugin,
  babysitterCostPlugin,
  babysitterGovernancePlugin,
} from '../index.js';

function createMockContext() {
  const views: Array<{ id: string; title: string; hotkey?: string }> = [];
  const renderers: Array<{ id: string }> = [];
  const commands: Array<{ id: string }> = [];
  const promptHandlers: Array<unknown> = [];

  const ctx = {
    client: {} as unknown,
    eventStream: {
      subscribe: vi.fn(() => vi.fn()),
      snapshot: vi.fn(() => []),
      push: vi.fn(),
      onReset: vi.fn(() => vi.fn()),
    },
    registerView: vi.fn((v: { id: string; title: string; hotkey?: string }) => views.push(v)),
    registerEventRenderer: vi.fn((r: { id: string }) => renderers.push(r)),
    registerCommand: vi.fn((c: { id: string }) => commands.push(c)),
    registerPromptHandler: vi.fn((h: unknown) => promptHandlers.push(h)),
    emit: vi.fn(),
  };

  return { ctx, views, renderers, commands, promptHandlers };
}

describe('babysitterStatusPlugin registration', () => {
  it('registers a babysitter view', async () => {
    const { ctx, views } = createMockContext();
    await babysitterStatusPlugin.register(ctx as any);

    expect(views).toHaveLength(1);
    expect(views[0]!.id).toBe('babysitter');
    expect(views[0]!.title).toBe('Babysitter');
    expect(views[0]!.hotkey).toBe('b');
  });

  it('does not register event renderers', async () => {
    const { ctx, renderers } = createMockContext();
    await babysitterStatusPlugin.register(ctx as any);
    expect(renderers).toHaveLength(0);
  });
});

describe('babysitterCostPlugin registration', () => {
  it('registers a cost view', async () => {
    const { ctx, views } = createMockContext();
    await babysitterCostPlugin.register(ctx as any);

    expect(views).toHaveLength(1);
    expect(views[0]!.id).toBe('babysitter-cost');
    expect(views[0]!.title).toBe('BS Cost');
  });

  it('does not register event renderers', async () => {
    const { ctx, renderers } = createMockContext();
    await babysitterCostPlugin.register(ctx as any);
    expect(renderers).toHaveLength(0);
  });
});

describe('babysitterGovernancePlugin registration', () => {
  it('registers a governance view', async () => {
    const { ctx, views } = createMockContext();
    await babysitterGovernancePlugin.register(ctx as any);

    expect(views).toHaveLength(1);
    expect(views[0]!.id).toBe('babysitter-governance');
    expect(views[0]!.title).toBe('BS Gov');
  });

  it('registers a breakpoint event renderer', async () => {
    const { ctx, renderers } = createMockContext();
    await babysitterGovernancePlugin.register(ctx as any);

    expect(renderers).toHaveLength(1);
    expect(renderers[0]!.id).toBe('babysitter-breakpoint');
  });
});
