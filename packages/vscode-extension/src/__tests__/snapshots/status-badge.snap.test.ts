import { describe, it, expect } from 'vitest';
import { getStatusIcon, getKindIcon } from '../../lib/utils';
import { RunStatus, TaskKind } from '../../types';

// ---------------------------------------------------------------------------
// Snapshot Tests for Status Icons
// ---------------------------------------------------------------------------

describe('getStatusIcon - snapshots', () => {
  it('snapshots all RunStatus icons', () => {
    const statuses: Array<{ status: RunStatus; waitingKind?: 'breakpoint' | 'task'; label: string }> = [
      { status: 'pending', label: 'pending' },
      { status: 'waiting', waitingKind: 'breakpoint', label: 'waiting-breakpoint' },
      { status: 'waiting', waitingKind: 'task', label: 'waiting-task' },
      { status: 'waiting', label: 'waiting-no-kind' },
      { status: 'completed', label: 'completed' },
      { status: 'failed', label: 'failed' },
    ];

    const icons = statuses.map(({ status, waitingKind, label }) => ({
      label,
      status,
      waitingKind,
      icon: getStatusIcon(status, waitingKind),
    }));

    expect(icons).toMatchSnapshot();
  });

  it('snapshots pending status icon', () => {
    const icon = getStatusIcon('pending');
    expect(icon).toMatchSnapshot();
    expect(icon).toBe('sync~spin');
  });

  it('snapshots waiting status icon with breakpoint', () => {
    const icon = getStatusIcon('waiting', 'breakpoint');
    expect(icon).toMatchSnapshot();
    expect(icon).toBe('hand');
  });

  it('snapshots waiting status icon with task', () => {
    const icon = getStatusIcon('waiting', 'task');
    expect(icon).toMatchSnapshot();
    expect(icon).toBe('loading~spin');
  });

  it('snapshots waiting status icon without kind', () => {
    const icon = getStatusIcon('waiting');
    expect(icon).toMatchSnapshot();
    expect(icon).toBe('loading~spin');
  });

  it('snapshots completed status icon', () => {
    const icon = getStatusIcon('completed');
    expect(icon).toMatchSnapshot();
    expect(icon).toBe('check');
  });

  it('snapshots failed status icon', () => {
    const icon = getStatusIcon('failed');
    expect(icon).toMatchSnapshot();
    expect(icon).toBe('error');
  });

  it('snapshots unknown status fallback', () => {
    // @ts-expect-error - testing invalid status
    const icon = getStatusIcon('invalid-status');
    expect(icon).toMatchSnapshot();
    expect(icon).toBe('circle-outline');
  });
});

describe('getKindIcon - snapshots', () => {
  it('snapshots all TaskKind icons', () => {
    const kinds: TaskKind[] = ['node', 'agent', 'skill', 'breakpoint', 'shell', 'sleep'];

    const icons = kinds.map((kind) => ({
      kind,
      icon: getKindIcon(kind),
    }));

    expect(icons).toMatchSnapshot();
  });

  it('snapshots node task icon', () => {
    const icon = getKindIcon('node');
    expect(icon).toMatchSnapshot();
    expect(icon).toBe('code');
  });

  it('snapshots agent task icon', () => {
    const icon = getKindIcon('agent');
    expect(icon).toMatchSnapshot();
    expect(icon).toBe('hubot');
  });

  it('snapshots skill task icon', () => {
    const icon = getKindIcon('skill');
    expect(icon).toMatchSnapshot();
    expect(icon).toBe('wand');
  });

  it('snapshots breakpoint task icon', () => {
    const icon = getKindIcon('breakpoint');
    expect(icon).toMatchSnapshot();
    expect(icon).toBe('hand');
  });

  it('snapshots shell task icon', () => {
    const icon = getKindIcon('shell');
    expect(icon).toMatchSnapshot();
    expect(icon).toBe('terminal');
  });

  it('snapshots sleep task icon', () => {
    const icon = getKindIcon('sleep');
    expect(icon).toMatchSnapshot();
    expect(icon).toBe('clock');
  });

  it('snapshots unknown task kind fallback', () => {
    // @ts-expect-error - testing invalid kind
    const icon = getKindIcon('unknown-kind');
    expect(icon).toMatchSnapshot();
    expect(icon).toBe('circle-outline');
  });
});

describe('Status badge combinations - snapshots', () => {
  it('snapshots complete status/kind matrix', () => {
    const statuses: RunStatus[] = ['pending', 'waiting', 'completed', 'failed'];
    const kinds: TaskKind[] = ['node', 'agent', 'skill', 'breakpoint', 'shell', 'sleep'];

    const matrix = {
      statuses: statuses.map((status) => ({
        status,
        icon: getStatusIcon(status),
        withBreakpoint: status === 'waiting' ? getStatusIcon(status, 'breakpoint') : null,
        withTask: status === 'waiting' ? getStatusIcon(status, 'task') : null,
      })),
      kinds: kinds.map((kind) => ({
        kind,
        icon: getKindIcon(kind),
      })),
    };

    expect(matrix).toMatchSnapshot();
  });

  it('snapshots all unique codicon names used', () => {
    const statuses: RunStatus[] = ['pending', 'waiting', 'completed', 'failed'];
    const kinds: TaskKind[] = ['node', 'agent', 'skill', 'breakpoint', 'shell', 'sleep'];

    const statusIcons = new Set<string>();
    statuses.forEach((status) => {
      statusIcons.add(getStatusIcon(status));
      statusIcons.add(getStatusIcon(status, 'breakpoint'));
      statusIcons.add(getStatusIcon(status, 'task'));
    });

    const kindIcons = new Set<string>();
    kinds.forEach((kind) => {
      kindIcons.add(getKindIcon(kind));
    });

    const allIcons = {
      statusIcons: Array.from(statusIcons).sort(),
      kindIcons: Array.from(kindIcons).sort(),
      combined: Array.from(new Set([...statusIcons, ...kindIcons])).sort(),
    };

    expect(allIcons).toMatchSnapshot();
  });
});
