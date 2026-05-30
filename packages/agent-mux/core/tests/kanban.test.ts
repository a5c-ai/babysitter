import { describe, expect, it } from 'vitest';

import {
  buildKanbanExecutionContextEnvelope,
  buildKanbanBoardSnapshot,
  buildKanbanBacklogSnapshot,
  computeKanbanProjectMetrics,
  evaluateKanbanIssueMove,
  findKanbanExecutionContextEnvelopesForRun,
  findKanbanExecutionContextEnvelopesForSession,
  normalizeKanbanDispatchContextLabel,
  normalizeKanbanDispatchContextLabelKey,
  normalizeKanbanDispatchContextLabels,
  normalizeKanbanIssue,
  normalizeKanbanTaskTag,
  normalizeKanbanTaskTagKey,
  normalizeKanbanTaskTags,
  renderKanbanExecutionContextBlock,
  renderDispatchContextLabels,
  resolveKanbanStatusForWorkflowState,
  resolveKanbanWorkflowState,
  buildDispatchContextExecutionEnvelope,
  type KanbanLabel,
  type KanbanDispatchContextLabelDefinition,
  type KanbanIssue,
  type KanbanBacklogOverview,
  type KanbanIssueStatus,
  type KanbanWorkflowState,
  type KanbanWorkspaceInventory,
  type KanbanTaskTag,
} from '../src/kanban.js';

function makeIssue(overrides: Partial<KanbanIssue> = {}): KanbanIssue {
  return {
    id: overrides.id ?? 'issue-1',
    projectId: overrides.projectId ?? 'project-1',
    key: overrides.key ?? 'KANBAN-1',
    title: overrides.title ?? 'Issue',
    status: overrides.status ?? 'backlog',
    priority: overrides.priority ?? 'medium',
    labels: overrides.labels ?? [],
    assignees: overrides.assignees ?? [],
    dependencies: overrides.dependencies ?? [],
    acceptanceCriteria: overrides.acceptanceCriteria ?? [],
    decomposition: overrides.decomposition ?? [],
    childIssueIds: overrides.childIssueIds ?? [],
    parentIssueId: overrides.parentIssueId,
    createdAt: overrides.createdAt ?? '2026-04-24T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-04-24T00:00:00.000Z',
    dispatch: overrides.dispatch ?? {
      readiness: 'ready',
      blockedReasons: [],
      runIds: [],
      sessionIds: [],
      contextLabels: [],
      contextLabelProjections: [],
    },
    description: overrides.description,
    summary: overrides.summary,
    source: overrides.source,
  };
}

function makeDispatchContextLabel(
  overrides: Partial<KanbanDispatchContextLabelDefinition> = {},
): KanbanDispatchContextLabelDefinition {
  return {
    id: overrides.id ?? 'dispatch-context-label-1',
    key: overrides.key ?? 'tests_first',
    label: overrides.label ?? 'Tests First',
    instruction: overrides.instruction ?? 'Write or update tests before implementation changes.',
    description: overrides.description,
    order: overrides.order ?? 0,
    createdAt: overrides.createdAt ?? '2026-04-24T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-04-24T00:00:00.000Z',
  };
}

function makeTaskTag(overrides: Partial<KanbanTaskTag> = {}): KanbanTaskTag {
  return {
    id: overrides.id ?? 'task-tag-1',
    key: overrides.key ?? 'bug_report',
    label: overrides.label ?? 'Bug Report',
    content: overrides.content ?? 'Describe the bug',
    description: overrides.description,
    order: overrides.order ?? 0,
    createdAt: overrides.createdAt ?? '2026-04-24T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-04-24T00:00:00.000Z',
    scope: overrides.scope,
  };
}

describe('normalizeKanbanTaskTagKey', () => {
  it('converts lookup keys to deterministic snake_case', () => {
    expect(normalizeKanbanTaskTagKey('  Code Review Checklist  ')).toBe('code_review_checklist');
    expect(normalizeKanbanTaskTagKey('deploy---validation')).toBe('deploy_validation');
  });
});

describe('kanban integration contracts', () => {
  it('keeps backlog overview and workspace inventory on shared core types', () => {
    const overview: KanbanBacklogOverview = {
      snapshot: {
        generatedAt: '2026-04-27T00:00:00.000Z',
        projects: [],
        issues: [],
        dispatchContextLabels: [],
      },
      board: {
        generatedAt: '2026-04-27T00:00:00.000Z',
        projects: [],
      },
      summary: {
        projectCount: 0,
        issueCount: 0,
        readyCount: 0,
        blockedCount: 0,
        dispatchedCount: 0,
        completedCount: 0,
        needsDecompositionCount: 0,
        inProgressCount: 0,
      },
    };

    const inventory: KanbanWorkspaceInventory = {
      workspaces: [],
      summary: {
        total: 0,
        active: 0,
        idle: 0,
        archived: 0,
        missing: 0,
      },
    };

    expect(overview.summary.issueCount).toBe(0);
    expect(inventory.summary.total).toBe(0);
  });
});

describe('normalizeKanbanDispatchContextLabelKey', () => {
  it('converts dispatch context label keys to deterministic snake_case', () => {
    expect(normalizeKanbanDispatchContextLabelKey('  Strict API Contract  ')).toBe(
      'strict_api_contract',
    );
    expect(normalizeKanbanDispatchContextLabelKey('no-schema---changes')).toBe(
      'no_schema_changes',
    );
  });
});

describe('normalizeKanbanDispatchContextLabel', () => {
  it('normalizes label definitions and preserves deterministic instruction payloads', () => {
    expect(
      normalizeKanbanDispatchContextLabel({
        id: 'dispatch-context-label-1',
        label: ' Strict API Contract ',
        key: 'Strict API Contract',
        instruction: '\nDo not change exported request or response shapes.\r\n',
        description: '  Preserve published contract  ',
        order: -4.2,
        createdAt: '2026-04-24T00:00:00.000Z',
        updatedAt: '2026-04-24T00:00:00.000Z',
      }),
    ).toEqual({
      id: 'dispatch-context-label-1',
      label: 'Strict API Contract',
      key: 'strict_api_contract',
      instruction: 'Do not change exported request or response shapes.',
      description: 'Preserve published contract',
      order: 0,
      createdAt: '2026-04-24T00:00:00.000Z',
      updatedAt: '2026-04-24T00:00:00.000Z',
    });
  });
});

describe('normalizeKanbanDispatchContextLabels', () => {
  it('sorts definitions deterministically by order with stable tie breakers', () => {
    const normalized = normalizeKanbanDispatchContextLabels([
      makeDispatchContextLabel({ id: 'c', key: 'z_last', label: 'Z Last', order: 2 }),
      makeDispatchContextLabel({ id: 'b', key: 'alpha', label: 'Alpha', order: 1 }),
      makeDispatchContextLabel({ id: 'a', key: 'beta', label: 'Beta', order: 1 }),
      makeDispatchContextLabel({ id: 'd', key: 'alpha', label: 'Alpha', order: 1 }),
    ]);

    expect(normalized.map((label) => label.id)).toEqual(['b', 'd', 'a', 'c']);
  });
});

describe('renderDispatchContextLabels', () => {
  it('renders attached labels in definition order and ignores missing refs', () => {
    const definitions = normalizeKanbanDispatchContextLabels([
      makeDispatchContextLabel({
        id: 'dispatch-context-label-2',
        key: 'preserve_migrations',
        label: 'Preserve Migrations',
        instruction: 'Do not rewrite historical migration files.',
        order: 2,
      }),
      makeDispatchContextLabel({
        id: 'dispatch-context-label-1',
        key: 'tests_first',
        label: 'Tests First',
        instruction: 'Write or update tests before implementation changes.',
        order: 1,
      }),
    ]);

    expect(
      renderDispatchContextLabels(definitions, [
        { labelId: 'missing' },
        { labelId: 'dispatch-context-label-2' },
        { labelId: 'dispatch-context-label-1' },
        { labelId: 'dispatch-context-label-2' },
      ]),
    ).toBe(
      [
        '- [tests_first] Write or update tests before implementation changes.',
        '- [preserve_migrations] Do not rewrite historical migration files.',
      ].join('\n'),
    );
  });
});

describe('renderKanbanExecutionContextBlock', () => {
  it('renders an explicit execution-context block with stable label ordering', () => {
    expect(
      renderKanbanExecutionContextBlock({
        projectId: 'project-1',
        projectKey: 'KANBAN',
        projectName: 'Kanban',
        issueId: 'issue-1',
        issueKey: 'KANBAN-1',
        issueTitle: 'Issue title',
        runIds: ['run-1'],
        sessionIds: ['session-1'],
        labelIds: ['dispatch-context-label-1', 'dispatch-context-label-2'],
        labels: [
          {
            labelId: 'dispatch-context-label-1',
            key: 'tests_first',
            label: 'Tests First',
            instruction: 'Write tests first.',
          },
          {
            labelId: 'dispatch-context-label-2',
            key: 'preserve_contract',
            label: 'Preserve Contract',
            instruction: 'Do not break the published API.',
          },
        ],
        renderedContext: '- [tests_first] Write tests first.\n- [preserve_contract] Do not break the published API.',
        lastDispatchedAt: '2026-04-24T00:00:00.000Z',
      }),
    ).toBe(
      [
        'Execution Context',
        'Project: KANBAN (Kanban)',
        'Issue: KANBAN-1 (issue-1)',
        'Title: Issue title',
        'Applied Dispatch Context Labels (2):',
        '- tests_first (dispatch-context-label-1): Tests First',
        '- preserve_contract (dispatch-context-label-2): Preserve Contract',
        'Run IDs: run-1',
        'Session IDs: session-1',
        'Last Dispatched At: 2026-04-24T00:00:00.000Z',
        'Rendered Dispatch Context:',
        '- [tests_first] Write tests first.\n- [preserve_contract] Do not break the published API.',
      ].join('\n'),
    );
  });
});

describe('buildDispatchContextExecutionEnvelope', () => {
  it('returns an explicit metadata envelope for attached labels', () => {
    const definitions = normalizeKanbanDispatchContextLabels([
      makeDispatchContextLabel({
        id: 'dispatch-context-label-2',
        key: 'preserve_migrations',
        label: 'Preserve Migrations',
        instruction: 'Do not rewrite historical migration files.',
        order: 2,
      }),
      makeDispatchContextLabel({
        id: 'dispatch-context-label-1',
        key: 'tests_first',
        label: 'Tests First',
        instruction: 'Write or update tests before implementation changes.',
        order: 1,
      }),
    ]);

    expect(
      buildDispatchContextExecutionEnvelope(definitions, [
        { labelId: 'dispatch-context-label-2' },
        { labelId: 'dispatch-context-label-1' },
      ]),
    ).toEqual({
      source: 'dispatch-context-labels',
      appliedLabels: [
        {
          labelId: 'dispatch-context-label-1',
          key: 'tests_first',
          label: 'Tests First',
          instruction: 'Write or update tests before implementation changes.',
        },
        {
          labelId: 'dispatch-context-label-2',
          key: 'preserve_migrations',
          label: 'Preserve Migrations',
          instruction: 'Do not rewrite historical migration files.',
        },
      ],
      renderedBlock: [
        '- [tests_first] Write or update tests before implementation changes.',
        '- [preserve_migrations] Do not rewrite historical migration files.',
      ].join('\n'),
      metadata: {
        labelIds: ['dispatch-context-label-1', 'dispatch-context-label-2'],
        labelKeys: ['tests_first', 'preserve_migrations'],
        labelCount: 2,
      },
    });
  });
});

describe('normalizeKanbanTaskTag', () => {
  it('normalizes task tags without using label semantics', () => {
    const normalized = normalizeKanbanTaskTag({
      id: 'task-tag-1',
      label: ' Code Review Checklist ',
      key: 'Code Review Checklist',
      content: '\nLine one\r\nLine two\r\n',
      description: '  Reusable review snippet  ',
      order: -4.8,
      createdAt: '2026-04-24T00:00:00.000Z',
      updatedAt: '2026-04-24T00:00:00.000Z',
      scope: { kind: 'project', refId: ' project-1 ' },
    });

    expect(normalized).toEqual({
      id: 'task-tag-1',
      label: 'Code Review Checklist',
      key: 'code_review_checklist',
      content: 'Line one\nLine two',
      description: 'Reusable review snippet',
      order: 0,
      createdAt: '2026-04-24T00:00:00.000Z',
      updatedAt: '2026-04-24T00:00:00.000Z',
      scope: { kind: 'project', refId: 'project-1' },
    });
    expect('name' in normalized).toBe(false);
    expect('color' in normalized).toBe(false);
  });

  it('falls back to the label when the key is omitted', () => {
    expect(
      normalizeKanbanTaskTag({
        id: 'task-tag-2',
        label: 'Deployment Validation',
        content: 'Ship checklist',
        createdAt: '2026-04-24T00:00:00.000Z',
        updatedAt: '2026-04-24T00:00:00.000Z',
      }).key,
    ).toBe('deployment_validation');
  });
});

describe('normalizeKanbanTaskTags', () => {
  it('sorts task tags deterministically by order with stable tie breakers', () => {
    const normalized = normalizeKanbanTaskTags([
      makeTaskTag({ id: 'c', key: 'z_last', label: 'Z Last', order: 2 }),
      makeTaskTag({ id: 'b', key: 'alpha', label: 'Alpha', order: 1 }),
      makeTaskTag({ id: 'a', key: 'beta', label: 'Beta', order: 1 }),
      makeTaskTag({ id: 'd', key: 'alpha', label: 'Alpha', order: 1 }),
    ]);

    expect(normalized.map((taskTag) => taskTag.id)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('keeps task tags separate from kanban labels', () => {
    const labels: KanbanLabel[] = [
      { id: 'label-1', name: 'Bug', color: '#ff0000' },
      { id: 'label-2', name: 'Docs', color: '#0000ff' },
    ];
    const normalizedTaskTags = normalizeKanbanTaskTags([
      makeTaskTag({ id: 'task-tag-1', key: 'bug_report', label: 'Bug Report', content: 'Template' }),
    ]);

    expect(labels).toEqual([
      { id: 'label-1', name: 'Bug', color: '#ff0000' },
      { id: 'label-2', name: 'Docs', color: '#0000ff' },
    ]);
    expect(normalizedTaskTags[0]).not.toHaveProperty('name');
    expect(normalizedTaskTags[0]).not.toHaveProperty('color');
    expect(normalizedTaskTags[0]?.key).toBe('bug_report');
  });
});

describe('normalizeKanbanIssue', () => {
  it('marks issues with incomplete decomposition as needing decomposition', () => {
    const issue = normalizeKanbanIssue(
      {
        ...makeIssue(),
        decomposition: [
          {
            id: 'decomp-1',
            title: 'Define child issues',
            kind: 'coordination',
            status: 'todo',
          },
        ],
      },
      new Map(),
    );

    expect(issue.dispatch.readiness).toBe('needs-decomposition');
    expect(issue.dispatch.blockedReasons).toContain('decomposition incomplete');
  });

  it('projects attached dispatch context labels into inspectable issue dispatch state', () => {
    const issue = normalizeKanbanIssue(
      {
        ...makeIssue(),
        dispatch: {
          readiness: 'ready',
          blockedReasons: [],
          runIds: [],
          sessionIds: [],
          contextLabels: [
            { labelId: 'dispatch-context-label-2' },
            { labelId: 'dispatch-context-label-1' },
            { labelId: 'dispatch-context-label-2' },
          ],
        },
      },
      new Map(),
      new Map(),
      normalizeKanbanDispatchContextLabels([
        makeDispatchContextLabel({
          id: 'dispatch-context-label-2',
          key: 'preserve_migrations',
          label: 'Preserve Migrations',
          instruction: 'Do not rewrite historical migration files.',
          order: 2,
        }),
        makeDispatchContextLabel({
          id: 'dispatch-context-label-1',
          key: 'tests_first',
          label: 'Tests First',
          instruction: 'Write or update tests before implementation changes.',
          order: 1,
        }),
      ]),
    );

    expect(issue.dispatch.contextLabels).toEqual([
      { labelId: 'dispatch-context-label-2' },
      { labelId: 'dispatch-context-label-1' },
    ]);
    expect(issue.dispatch.contextLabelProjections).toEqual([
      {
        labelId: 'dispatch-context-label-1',
        key: 'tests_first',
        label: 'Tests First',
        instruction: 'Write or update tests before implementation changes.',
      },
      {
        labelId: 'dispatch-context-label-2',
        key: 'preserve_migrations',
        label: 'Preserve Migrations',
        instruction: 'Do not rewrite historical migration files.',
      },
    ]);
    expect(issue.dispatch.executionContext).toEqual({
      source: 'dispatch-context-labels',
      appliedLabels: [
        {
          labelId: 'dispatch-context-label-1',
          key: 'tests_first',
          label: 'Tests First',
          instruction: 'Write or update tests before implementation changes.',
        },
        {
          labelId: 'dispatch-context-label-2',
          key: 'preserve_migrations',
          label: 'Preserve Migrations',
          instruction: 'Do not rewrite historical migration files.',
        },
      ],
      renderedBlock: [
        '- [tests_first] Write or update tests before implementation changes.',
        '- [preserve_migrations] Do not rewrite historical migration files.',
      ].join('\n'),
      metadata: {
        labelIds: ['dispatch-context-label-1', 'dispatch-context-label-2'],
        labelKeys: ['tests_first', 'preserve_migrations'],
        labelCount: 2,
      },
    });
    expect(issue.dispatch.renderedContext).toBe(
      [
        '- [tests_first] Write or update tests before implementation changes.',
        '- [preserve_migrations] Do not rewrite historical migration files.',
      ].join('\n'),
    );
  });

  it('marks blocked-by dependencies as blocked until the dependency is done', () => {
    const dependency = makeIssue({ id: 'dep-1', key: 'KANBAN-0', status: 'in-progress' });
    const issue = normalizeKanbanIssue(
      {
        ...makeIssue(),
        dependencies: [{ issueId: dependency.id, type: 'blocked-by' }],
      },
      new Map([[dependency.id, dependency]]),
    );

    expect(issue.dispatch.readiness).toBe('blocked');
    expect(issue.dispatch.blockedReasons).toContain('waiting on dep-1');
  });
});

describe('execution context envelopes', () => {
  it('builds an inspectable execution-context envelope from issue dispatch state', () => {
    const envelope = buildKanbanExecutionContextEnvelope({
      project: {
        id: 'project-1',
        key: 'KANBAN',
        name: 'Kanban',
      },
      issue: makeIssue({
        dispatch: {
          readiness: 'ready',
          blockedReasons: [],
          runIds: ['run-1'],
          sessionIds: ['session-1'],
          contextLabels: [{ labelId: 'dispatch-context-label-1' }],
          contextLabelProjections: [
            {
              labelId: 'dispatch-context-label-1',
              key: 'tests_first',
              label: 'Tests First',
              instruction: 'Write or update tests before implementation changes.',
            },
          ],
          renderedContext: '- [tests_first] Write or update tests before implementation changes.',
          lastDispatchedAt: '2026-04-24T00:00:00.000Z',
        },
      }),
    });

    expect(envelope).toMatchObject({
      project: { id: 'project-1', key: 'KANBAN', name: 'Kanban' },
      issue: { id: 'issue-1', key: 'KANBAN-1', title: 'Issue' },
      dispatch: {
        runIds: ['run-1'],
        sessionIds: ['session-1'],
        labelIds: ['dispatch-context-label-1'],
      },
    });
    expect(envelope?.block).toContain('Applied Dispatch Context Labels (1):');
    expect(envelope?.block).toContain('Rendered Dispatch Context:');
  });

  it('finds linked execution-context envelopes by run id and session id', () => {
    const snapshot = buildKanbanBacklogSnapshot({
      generatedAt: '2026-04-24T00:00:00.000Z',
      projects: [
        {
          id: 'project-1',
          key: 'KANBAN',
          name: 'Kanban',
          issueIds: [],
          labels: [],
          assignees: [],
          statuses: [],
        },
      ],
      dispatchContextLabels: [
        makeDispatchContextLabel({
          id: 'dispatch-context-label-1',
          key: 'tests_first',
          label: 'Tests First',
          instruction: 'Write or update tests before implementation changes.',
          order: 1,
        }),
      ],
      issues: [
        makeIssue({
          id: 'issue-1',
          key: 'KANBAN-1',
          dispatch: {
            readiness: 'ready',
            blockedReasons: [],
            runIds: ['run-1'],
            sessionIds: ['session-1'],
            contextLabels: [{ labelId: 'dispatch-context-label-1' }],
            contextLabelProjections: [],
          },
        }),
        makeIssue({
          id: 'issue-2',
          key: 'KANBAN-2',
        }),
      ],
    });

    expect(findKanbanExecutionContextEnvelopesForRun(snapshot, 'run-1').map((item) => item.issue.id)).toEqual(['issue-1']);
    expect(findKanbanExecutionContextEnvelopesForSession(snapshot, 'session-1').map((item) => item.issue.id)).toEqual(['issue-1']);
  });
});

describe('computeKanbanProjectMetrics', () => {
  it('counts issues by readiness and in-progress state', () => {
    const issues = [
      makeIssue({ id: 'ready', dispatch: { readiness: 'ready', blockedReasons: [], runIds: [], sessionIds: [] } }),
      makeIssue({ id: 'blocked', dispatch: { readiness: 'blocked', blockedReasons: ['x'], runIds: [], sessionIds: [] } }),
      makeIssue({ id: 'dispatched', dispatch: { readiness: 'dispatched', blockedReasons: [], runIds: ['run-1'], sessionIds: [] }, status: 'in-progress' }),
      makeIssue({ id: 'done', status: 'done', dispatch: { readiness: 'completed', blockedReasons: [], runIds: [], sessionIds: [] } }),
      makeIssue({ id: 'decomp', dispatch: { readiness: 'needs-decomposition', blockedReasons: [], runIds: [], sessionIds: [] } }),
    ];

    expect(computeKanbanProjectMetrics(issues)).toEqual({
      totalIssues: 5,
      readyIssues: 1,
      blockedIssues: 1,
      dispatchedIssues: 1,
      completedIssues: 1,
      needsDecompositionIssues: 1,
      inProgressIssues: 1,
    });
  });
});

describe('buildKanbanBacklogSnapshot', () => {
  it('hydrates project issue ids and metrics from the issue list', () => {
    const snapshot = buildKanbanBacklogSnapshot({
      generatedAt: '2026-04-24T00:00:00.000Z',
      projects: [
        {
          id: 'project-1',
          key: 'KANBAN',
          name: 'Kanban',
          issueIds: [],
          labels: [],
          assignees: [],
          statuses: [],
        },
      ],
      dispatchContextLabels: [
        makeDispatchContextLabel({
          id: 'dispatch-context-label-1',
          key: 'tests_first',
          label: 'Tests First',
          instruction: 'Write or update tests before implementation changes.',
          order: 1,
        }),
      ],
      issues: [
        {
          ...makeIssue({
            id: 'parent',
            key: 'KANBAN-1',
            childIssueIds: ['child'],
            dispatch: {
              readiness: 'ready',
              blockedReasons: [],
              runIds: [],
              sessionIds: [],
              contextLabels: [{ labelId: 'dispatch-context-label-1' }],
              contextLabelProjections: [],
            },
          }),
        },
        {
          ...makeIssue({
            id: 'child',
            key: 'KANBAN-1A',
            parentIssueId: 'parent',
            status: 'done',
          }),
        },
      ],
    });

    expect(snapshot.projects[0]?.issueIds).toEqual(['parent', 'child']);
    expect(snapshot.projects[0]?.metrics.totalIssues).toBe(2);
    expect(snapshot.dispatchContextLabels.map((label) => label.key)).toEqual(['tests_first']);
    expect(snapshot.issues.find((issue) => issue.id === 'parent')?.dispatch.readiness).toBe(
      'ready',
    );
    expect(snapshot.issues.find((issue) => issue.id === 'parent')?.dispatch.renderedContext).toBe(
      '- [tests_first] Write or update tests before implementation changes.',
    );
  });
});

describe('evaluateKanbanIssueMove', () => {
  it('maps every issue status to its workflow state', () => {
    const expectedStates = [
      ['backlog', 'todo'],
      ['ready', 'todo'],
      ['in-progress', 'in-progress'],
      ['blocked', 'in-progress'],
      ['review', 'review'],
      ['done', 'done'],
    ] satisfies readonly (readonly [KanbanIssueStatus, KanbanWorkflowState])[];

    expect(expectedStates.map(([status]) => status)).toEqual([
      'backlog',
      'ready',
      'in-progress',
      'blocked',
      'review',
      'done',
    ] satisfies readonly KanbanIssueStatus[]);
    expect(
      expectedStates.map(([status, workflowState]) => [
        status,
        resolveKanbanWorkflowState(makeIssue({ status })),
      ]),
    ).toEqual(expectedStates);
  });

  it('maps every workflow state back to the persisted status', () => {
    const readyIssue = makeIssue({ status: 'ready' });
    const backlogIssue = makeIssue({ status: 'backlog' });
    const decompositionIssue = makeIssue({
      status: 'ready',
      dispatch: {
        readiness: 'needs-decomposition',
        blockedReasons: [],
        runIds: [],
        sessionIds: [],
      },
    });
    const expectedStatuses = [
      ['todo', 'ready'],
      ['in-progress', 'in-progress'],
      ['review', 'review'],
      ['done', 'done'],
    ] satisfies readonly (readonly [KanbanWorkflowState, KanbanIssueStatus])[];

    expect(expectedStatuses.map(([state]) => state)).toEqual([
      'todo',
      'in-progress',
      'review',
      'done',
    ] satisfies readonly KanbanWorkflowState[]);
    expect(
      expectedStatuses.map(([state]) => [
        state,
        resolveKanbanStatusForWorkflowState(readyIssue, state),
      ]),
    ).toEqual(expectedStatuses);
    expect(resolveKanbanStatusForWorkflowState(backlogIssue, 'todo')).toBe('backlog');
    expect(resolveKanbanStatusForWorkflowState(decompositionIssue, 'todo')).toBe('backlog');
  });

  it('blocks moves into in-progress when the target column would exceed WIP', () => {
    const issueA = makeIssue({ id: 'a', key: 'KANBAN-1', status: 'in-progress' });
    const issueB = makeIssue({ id: 'b', key: 'KANBAN-2', status: 'in-progress' });
    const candidate = makeIssue({ id: 'c', key: 'KANBAN-3', status: 'ready' });
    const snapshot = buildKanbanBacklogSnapshot({
      projects: [
        {
          id: 'project-1',
          key: 'KANBAN',
          name: 'Kanban',
          issueIds: [],
          labels: [],
          assignees: [],
          statuses: [
            { id: 'backlog', name: 'Backlog', kind: 'backlog' },
            { id: 'ready', name: 'Ready', kind: 'backlog' },
            { id: 'in-progress', name: 'In Progress', kind: 'active', wipLimit: 2 },
            { id: 'review', name: 'Review', kind: 'active', wipLimit: 2 },
            { id: 'done', name: 'Done', kind: 'done' },
          ],
        },
      ],
      issues: [issueA, issueB, candidate],
    });

    const evaluation = evaluateKanbanIssueMove({
      project: snapshot.projects[0]!,
      issues: snapshot.issues,
      issueId: candidate.id,
      toState: 'in-progress',
    });

    expect(evaluation.allowed).toBe(false);
    expect(evaluation.signals.some((signal) => signal.hookId === 'wip-limit')).toBe(true);
  });

  it('blocks moves to done when acceptance criteria remain open', () => {
    const snapshot = buildKanbanBacklogSnapshot({
      projects: [
        {
          id: 'project-1',
          key: 'KANBAN',
          name: 'Kanban',
          issueIds: [],
          labels: [],
          assignees: [],
          statuses: [],
        },
      ],
      issues: [
        makeIssue({
          id: 'review-1',
          key: 'KANBAN-9',
          status: 'review',
          acceptanceCriteria: [
            {
              id: 'ac-1',
              title: 'Ship it',
              satisfied: false,
            },
          ],
        }),
      ],
    });

    const evaluation = evaluateKanbanIssueMove({
      project: snapshot.projects[0]!,
      issues: snapshot.issues,
      issueId: 'review-1',
      toState: 'done',
    });

    expect(evaluation.allowed).toBe(false);
    expect(evaluation.signals.some((signal) => signal.hookId === 'acceptance-complete')).toBe(
      true,
    );
  });
});

describe('buildKanbanBoardSnapshot', () => {
  it('groups issues into workflow columns and swimlanes', () => {
    const snapshot = buildKanbanBacklogSnapshot({
      generatedAt: '2026-04-24T00:00:00.000Z',
      projects: [
        {
          id: 'project-1',
          key: 'KANBAN',
          name: 'Kanban',
          issueIds: [],
          labels: [],
          assignees: [],
          statuses: [],
        },
      ],
      issues: [
        makeIssue({ id: 'todo-1', key: 'KANBAN-1', status: 'ready', priority: 'medium' }),
        makeIssue({ id: 'doing-1', key: 'KANBAN-2', status: 'in-progress', priority: 'high' }),
        makeIssue({
          id: 'blocked-1',
          key: 'KANBAN-3',
          status: 'blocked',
          dispatch: { readiness: 'blocked', blockedReasons: ['waiting'], runIds: [], sessionIds: [] },
        }),
      ],
    });

    const board = buildKanbanBoardSnapshot(snapshot);
    const projectBoard = board.projects[0]!;

    expect(projectBoard.columns.find((column) => column.id === 'todo')?.issueCount).toBe(1);
    expect(projectBoard.columns.find((column) => column.id === 'in-progress')?.issueCount).toBe(2);
    expect(projectBoard.swimlanes.find((lane) => lane.id === 'expedite')?.issueIds).toContain(
      'doing-1',
    );
    expect(projectBoard.swimlanes.find((lane) => lane.id === 'blocked')?.issueIds).toContain(
      'blocked-1',
    );
  });
});
