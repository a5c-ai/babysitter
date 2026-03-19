import { http, HttpResponse } from 'msw';
import {
  createMockRun,
  createMockTaskDetail,
  createMockJournalEvent,
  createMockProjectSummary,
} from '../fixtures';

// Pre-built mock data so handlers return consistent references
const mockRun = createMockRun({ runId: 'run-abc-123', projectName: 'my-project' });
const mockTaskDetail = createMockTaskDetail({ effectId: 'eff-001', kind: 'node' });
const mockEvents = [
  createMockJournalEvent({ seq: 0, type: 'RUN_CREATED' }),
  createMockJournalEvent({ seq: 1, type: 'EFFECT_REQUESTED' }),
  createMockJournalEvent({ seq: 2, type: 'EFFECT_RESOLVED' }),
  createMockJournalEvent({ seq: 3, type: 'RUN_COMPLETED' }),
];
const mockProjects = [
  createMockProjectSummary({ projectName: 'my-project', totalRuns: 5, activeRuns: 1 }),
  createMockProjectSummary({ projectName: 'other-project', totalRuns: 3, activeRuns: 0 }),
];

export const handlers = [
  // GET /api/runs — returns run list (supports ?mode=projects)
  http.get('/api/runs', ({ request }) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode');

    if (mode === 'projects') {
      return HttpResponse.json({ projects: mockProjects });
    }

    const project = url.searchParams.get('project');
    if (project) {
      const filtered = [mockRun].filter((r) => r.projectName === project);
      return HttpResponse.json({ runs: filtered, totalCount: filtered.length, project });
    }

    return HttpResponse.json({ runs: [mockRun], totalCount: 1 });
  }),

  // GET /api/runs/:runId — returns single run
  http.get('/api/runs/:runId', ({ params }) => {
    const { runId } = params;
    if (runId === mockRun.runId) {
      return HttpResponse.json({ run: mockRun });
    }
    return HttpResponse.json({ error: 'Run not found' }, { status: 404 });
  }),

  // GET /api/runs/:runId/events — returns journal events
  http.get('/api/runs/:runId/events', () => {
    return HttpResponse.json({ events: mockEvents, total: mockEvents.length });
  }),

  // GET /api/runs/:runId/tasks/:effectId — returns task detail
  http.get('/api/runs/:runId/tasks/:effectId', ({ params }) => {
    const { effectId } = params;
    if (effectId === mockTaskDetail.effectId) {
      return HttpResponse.json({ task: mockTaskDetail });
    }
    return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
  }),

  // POST /api/runs/:runId/tasks/:effectId/resolve — resolve a breakpoint
  http.post('/api/runs/:runId/tasks/:effectId/resolve', async ({ request }) => {
    const body = (await request.json()) as { approved: boolean; value?: string };
    return HttpResponse.json({ success: true, approved: body.approved });
  }),

  // GET /api/config — returns observer config
  http.get('/api/config', () => {
    return HttpResponse.json({
      sources: [{ path: '/tmp/test-project', depth: 2, label: 'test' }],
      port: 4800,
      pollInterval: 2000,
      theme: 'dark',
      staleThresholdMs: 3600000,
    });
  }),

  // POST /api/config — update observer config
  http.post('/api/config', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      sources: body.sources ?? [],
      port: 4800,
      pollInterval: (body.pollInterval as number) ?? 2000,
      theme: (body.theme as string) ?? 'dark',
      staleThresholdMs: (body.staleThresholdMs as number) ?? 3600000,
    });
  }),

  // GET /api/digest — lightweight polling digest
  http.get('/api/digest', () => {
    return HttpResponse.json({
      runs: [
        {
          runId: mockRun.runId,
          latestSeq: 3,
          status: mockRun.status,
          taskCount: mockRun.totalTasks,
          completedTasks: mockRun.completedTasks,
          updatedAt: mockRun.updatedAt,
          projectName: mockRun.projectName,
        },
      ],
    });
  }),
];
