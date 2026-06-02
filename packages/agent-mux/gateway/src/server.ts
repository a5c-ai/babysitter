import * as http from 'node:http';

import { Hono, type Context } from 'hono';
import { WebSocketServer } from 'ws';
import type { Attachment } from '@a5c-ai/agent-mux-comm';
import { resolveWorkspaceDefaultCwd, WorkspaceService } from '@a5c-ai/agent-mux-comm';

import {
  BootstrapAuthService,
  MemoryBootstrapAuthStore,
  SqliteBootstrapAuthStore,
} from './auth/bootstrap.js';
import { authenticateBearerToken } from './auth/middleware.js';
import { MemoryTokenStore, SqliteTokenStore, type TokenStore, type TokenRecord } from './auth/tokens.js';
import { createGatewayRunClient, listRunnableGatewayAgents, listRunnableGatewayAgentNames } from './builtin-adapters.js';
import type { GatewayConfig } from './config.js';
import { ClientConn } from './fanout/client-conn.js';
import { createGatewayLogger, type GatewayLogger } from './logging.js';
import { ShortCodeStore } from './pairing/short-code.js';
import { decodeFrame } from './protocol/frames.js';
import { GATEWAY_CLOSE_CODES } from './protocol/errors.js';
import type { AuthFrame, GatewayFrame } from './protocol/v1.js';
import { RunManager } from './runs/manager.js';
import { registerKanbanRoutes } from './kanban/routes.js';
import { resolveWebuiRoot, serveWebuiRequest } from './static/webui-server.js';

export interface GatewayServer {
  readonly tokenStore: TokenStore;
  readonly runManager: RunManager;
  readonly address: { host: string; port: number };
  start(): Promise<void>;
  stop(): Promise<void>;
}

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function generateRunId(): string {
  let out = '';
  for (let index = 0; index < 26; index += 1) {
    out += CROCKFORD[Math.floor(Math.random() * CROCKFORD.length)];
  }
  return out;
}

function nodeRequestToFetchRequest(req: http.IncomingMessage): Request {
  const protocol = 'http';
  const url = `${protocol}://${req.headers.host ?? '127.0.0.1'}${req.url ?? '/'}`;
  return new Request(url, {
    method: req.method,
    headers: new Headers(req.headers as Record<string, string>),
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : (req as unknown as BodyInit),
    duplex: req.method === 'GET' || req.method === 'HEAD' ? undefined : ('half' as never),
  } as RequestInit);
}

function writeFetchResponse(res: http.ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  return response.arrayBuffer().then((buffer) => {
    res.end(Buffer.from(buffer));
  });
}

function createHelloFrame(serverVersion: string): GatewayFrame {
  return {
    type: 'hello',
    protocolVersions: ['1'],
    serverVersion,
    serverTime: new Date().toISOString(),
  };
}

function resolveTokenStore(config: GatewayConfig): TokenStore {
  if (config.tokenStore) return config.tokenStore;
  if (config.tokenStoreKind === 'memory') return new MemoryTokenStore();
  return new SqliteTokenStore(config.tokenDbPath);
}

function resolveBootstrapAuthStore(config: GatewayConfig) {
  if (config.tokenStoreKind === 'memory') {
    return new MemoryBootstrapAuthStore();
  }
  return new SqliteBootstrapAuthStore(config.tokenDbPath);
}

function sanitizeAttachments(value: unknown): Attachment[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const attachments = value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }
    const record = entry as Record<string, unknown>;
    return [{
      filePath: typeof record['filePath'] === 'string' ? record['filePath'] : undefined,
      url: typeof record['url'] === 'string' ? record['url'] : undefined,
      base64: typeof record['base64'] === 'string' ? record['base64'] : undefined,
      mimeType: typeof record['mimeType'] === 'string' ? record['mimeType'] : undefined,
      name: typeof record['name'] === 'string' ? record['name'] : undefined,
    }];
  }).filter((attachment) => attachment.filePath || attachment.url || attachment.base64);

  return attachments.length > 0 ? attachments : undefined;
}

function readApprovalMode(value: unknown): 'yolo' | 'prompt' | 'deny' | undefined {
  return value === 'yolo' || value === 'prompt' || value === 'deny' ? value : undefined;
}

type PaginationOptions = {
  offset: number;
  limit: number | null;
};

function readPaginationOptions(requestUrl: string): PaginationOptions {
  const url = new URL(requestUrl);
  const offsetRaw = Number.parseInt(url.searchParams.get('offset') ?? '0', 10);
  const limitRaw = url.searchParams.get('limit');
  const limitParsed = limitRaw == null || limitRaw.length === 0 ? null : Number.parseInt(limitRaw, 10);
  return {
    offset: Number.isFinite(offsetRaw) && offsetRaw > 0 ? offsetRaw : 0,
    limit: Number.isFinite(limitParsed) && limitParsed != null && limitParsed >= 0 ? limitParsed : null,
  };
}

function paginateItems<T>(items: T[], options: PaginationOptions): {
  items: T[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
} {
  const total = items.length;
  const offset = Math.min(options.offset, total);
  const limit = options.limit == null ? total : options.limit;
  const paged = options.limit == null ? items : items.slice(offset, offset + limit);
  return {
    items: paged,
    pagination: {
      total,
      offset,
      limit,
      hasMore: options.limit == null ? false : offset + paged.length < total,
    },
  };
}

function readTailFlag(requestUrl: string): boolean {
  const url = new URL(requestUrl);
  const raw = url.searchParams.get('tail');
  return raw === '1' || raw === 'true';
}

export function createGatewayServer(
  config: GatewayConfig,
  logger: GatewayLogger = createGatewayLogger(),
): GatewayServer {
  const gatewayClient = config.client ?? createGatewayRunClient();
  const tokenStore = resolveTokenStore(config);
  const bootstrapAuthStore = resolveBootstrapAuthStore(config);
  const bootstrapAuth = new BootstrapAuthService(
    config.bootstrapAuth,
    bootstrapAuthStore,
    tokenStore,
  );
  const runManager = new RunManager(config, logger);
  const workspaceService = new WorkspaceService();
  const webuiRoot = config.enableWebui ? resolveWebuiRoot(config.webuiRoot) : null;
  const shortCodeStore = new ShortCodeStore();
  const app = new Hono();
  const server = http.createServer(async (req, res) => {
    const response = await app.fetch(nodeRequestToFetchRequest(req));
    await writeFetchResponse(res, response);
  });
  const wss = new WebSocketServer({ noServer: true });
  const connections = new Set<ClientConn>();
  let started = false;

  app.get('/healthz', (context) =>
    context.json({
      ok: true,
      serverTime: new Date().toISOString(),
      serverVersion: config.serverVersion,
      runs: {
        active: runManager.list().filter((entry) => entry.status === 'running').length,
      },
    }),
  );

  registerKanbanRoutes(app);

  async function requireAuth(authorization: string | undefined): Promise<TokenRecord | null> {
    return await authenticateBearerToken(tokenStore, authorization);
  }

  async function resolveAvailableAgents(): Promise<string[]> {
    return await listRunnableGatewayAgentNames(gatewayClient);
  }

  async function resolveAvailableAgentDescriptors() {
    return await listRunnableGatewayAgents(gatewayClient);
  }

  async function ensureAgentAvailable(agent: string): Promise<boolean> {
    const availableAgents = await resolveAvailableAgents();
    return availableAgents.includes(agent);
  }

  app.get('/api/v1/tokens', async (context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    return context.json({
      authenticatedAs: tokenRecord.name,
      tokens: await tokenStore.list(),
    });
  });

  app.post('/api/v1/tokens', async (context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }

    const body = await context.req.json<Record<string, unknown>>();
    const created = await tokenStore.create({
      name: typeof body['name'] === 'string' && body['name'].trim().length > 0 ? body['name'] : 'gateway-client',
      ttlMs: typeof body['ttlMs'] === 'number' ? body['ttlMs'] : null,
    });
    return context.json(created, 201);
  });

  app.post('/api/v1/tokens/:id/revoke', async (context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const revoked = await tokenStore.revoke(context.req.param('id'));
    return context.json({ revoked });
  });

  app.post('/api/v1/bootstrap/login', async (context) => {
    const bootstrapState = await bootstrapAuth.describe();
    if (!bootstrapState.enabled) {
      return context.json({ error: 'bootstrap_auth_disabled' }, 404);
    }

    const body = await context.req.json<Record<string, unknown>>();
    const issuedToken = await bootstrapAuth.login({
      username: typeof body['username'] === 'string' ? body['username'] : '',
      password: typeof body['password'] === 'string' ? body['password'] : '',
      clientName: typeof body['clientName'] === 'string' ? body['clientName'] : null,
      ttlMs: typeof body['ttlMs'] === 'number' ? body['ttlMs'] : null,
    });
    if (!issuedToken) {
      return context.json({ error: 'invalid_bootstrap_credentials' }, 401);
    }
    return context.json({ issuedToken }, 201);
  });

  const listDispatches = async (context: Context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const paged = paginateItems(runManager.list(), readPaginationOptions(context.req.url));
    return context.json({
      dispatches: paged.items,
      runs: paged.items,
      pagination: paged.pagination,
    });
  };

  app.get('/api/v1/dispatches', listDispatches);
  app.get('/api/v1/runs', listDispatches);

  app.get('/api/v1/sessions', async (context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const paged = paginateItems(await runManager.listSessions(), readPaginationOptions(context.req.url));
    return context.json({ sessions: paged.items, pagination: paged.pagination });
  });

  app.get('/api/v1/workspaces', async (context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const inventory = await runManager.listWorkspaces();
    const paged = paginateItems([...(inventory.workspaces ?? [])], readPaginationOptions(context.req.url));
    return context.json({
      ...inventory,
      workspaces: paged.items,
      pagination: paged.pagination,
    });
  });

  app.post('/api/v1/workspaces', async (context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const body = await context.req.json<Record<string, unknown>>();
    const action = typeof body['action'] === 'string' ? body['action'] : 'create';

    if (action === 'create') {
      const name = typeof body['name'] === 'string' ? body['name'] : '';
      const repos = Array.isArray(body['repos']) ? body['repos'] : [];
      const workspace = await workspaceService.createWorkspace({
        name,
        repos: repos.flatMap((entry) => {
          if (!entry || typeof entry !== 'object' || typeof (entry as { path?: unknown }).path !== 'string') {
            return [];
          }
          return [{
            path: String((entry as { path: unknown }).path),
            alias: typeof (entry as { alias?: unknown }).alias === 'string'
              ? String((entry as { alias?: unknown }).alias)
              : undefined,
          }];
        }),
        mode: body['mode'] === 'symlink' ? 'symlink' : 'worktree',
      });
      return context.json({ workspace: { ...workspace, defaultCwd: resolveWorkspaceDefaultCwd(workspace) } }, 201);
    }

    const workspaceId = typeof body['workspaceId'] === 'string' ? body['workspaceId'] : '';
    if (!workspaceId) {
      return context.json({ error: 'workspaceId_required' }, 400);
    }

    if (action === 'archive') {
      return context.json({ workspace: await workspaceService.archiveWorkspace(workspaceId) });
    }
    if (action === 'cleanup') {
      return context.json({ workspace: await workspaceService.cleanupWorkspace(workspaceId) });
    }
    if (action === 'recover') {
      return context.json({ workspace: await workspaceService.recoverWorkspace(workspaceId) });
    }
    if (action === 'delete') {
      await workspaceService.deleteWorkspace(workspaceId, { forceCleanup: body['force'] === true });
      return context.json({ deleted: workspaceId });
    }
    return context.json({ error: 'unsupported_action' }, 400);
  });

  app.get('/api/v1/sessions/:sessionId', async (context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const session = await runManager.getSession(context.req.param('sessionId'));
    if (!session) {
      return context.json({ error: 'not_found' }, 404);
    }
    return context.json(session);
  });

  app.get('/api/v1/sessions/:sessionId/full', async (context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const session = await runManager.getSessionContent(context.req.param('sessionId'));
    if (!session) {
      return context.json({ error: 'not_found' }, 404);
    }
    return context.json(session);
  });

  app.post('/api/v1/sessions', async (context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const body = await context.req.json<Record<string, unknown>>();
    const agent = String(body['agent'] ?? '');
    if (!(await ensureAgentAvailable(agent))) {
      return context.json({ error: 'agent_unavailable', agent }, 400);
    }
    const forkSessionId = typeof body['forkSessionId'] === 'string' ? body['forkSessionId'] : undefined;
    const forkSourceSession = forkSessionId ? await runManager.getSession(forkSessionId) : null;
    const run = await runManager.start(
      {
        agent,
        model: typeof body['model'] === 'string' ? body['model'] : undefined,
        prompt: typeof body['prompt'] === 'string' ? body['prompt'] : '',
        cwd:
          typeof body['cwd'] === 'string'
            ? body['cwd']
            : forkSourceSession?.cwd ?? forkSourceSession?.workspace?.currentPath ?? forkSourceSession?.workspace?.workspaceDefaultCwd,
        workspaceId:
          typeof body['workspaceId'] === 'string'
            ? body['workspaceId']
            : forkSourceSession?.workspaceId ?? forkSourceSession?.workspace?.workspaceId,
        forkSessionId,
      },
      {
        tokenId: tokenRecord.id,
        name: tokenRecord.name,
        remoteAddress: context.req.header('x-forwarded-for') ?? null,
      },
    );
    return context.json({ run, sourceSessionId: forkSessionId ?? null }, 201);
  });

  app.get('/api/v1/sessions/:sessionId/messages', async (context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const session = await runManager.getSessionContent(context.req.param('sessionId'));
    if (!session) {
      return context.json({ error: 'not_found' }, 404);
    }
    const paginationOptions = readPaginationOptions(context.req.url);
    const messages = Array.isArray(session.messages) ? [...session.messages] : [];
    const tail = readTailFlag(context.req.url);
    const effectiveOptions =
      tail && paginationOptions.limit != null
        ? {
            offset: Math.max(0, messages.length - paginationOptions.limit),
            limit: paginationOptions.limit,
          }
        : paginationOptions;
    const paged = paginateItems(messages, effectiveOptions);
    return context.json({
      sessionId: session.sessionId,
      messages: paged.items,
      pagination: paged.pagination,
    });
  });

  app.post('/api/v1/sessions/:sessionId/messages', async (context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const body = await context.req.json<Record<string, unknown>>();
    const sessionId = context.req.param('sessionId');
    const prompt = typeof body['prompt'] === 'string' ? body['prompt'] : '';
    const run = await runManager.sendSessionInput(
      sessionId,
      prompt,
      {
        tokenId: tokenRecord.id,
        name: tokenRecord.name,
        remoteAddress: context.req.header('x-forwarded-for') ?? null,
      },
      {
        agent: typeof body['agent'] === 'string' ? body['agent'] : undefined,
        model: typeof body['model'] === 'string' ? body['model'] : undefined,
        attachments: sanitizeAttachments(body['attachments']),
        approvalMode: readApprovalMode(body['approvalMode']),
      },
    );
    if (!run) {
      return context.json({ error: 'not_found' }, 404);
    }
    const session = await runManager.getSession(sessionId);
    return context.json({ run, session }, 200);
  });

  app.get('/api/v1/agents', async (context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const agentDescriptors = await resolveAvailableAgentDescriptors();
    const agents = agentDescriptors.map((entry) => entry.agent);
    return context.json({ agents, agentDescriptors });
  });

  const createDispatch = async (context: Context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const body = await context.req.json<Record<string, unknown>>();
    const agent = String(body['agent'] ?? '');
    if (!(await ensureAgentAvailable(agent))) {
      return context.json({ error: 'agent_unavailable', agent }, 400);
    }
    const run = await runManager.start(
      body as unknown as Parameters<RunManager['start']>[0],
      {
        tokenId: tokenRecord.id,
        name: tokenRecord.name,
        remoteAddress: context.req.header('x-forwarded-for') ?? null,
      },
    );
    return context.json(run, 201);
  };

  app.post('/api/v1/dispatches', createDispatch);
  app.post('/api/v1/runs', createDispatch);

  const getDispatch = async (context: Context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const runId = context.req.param('runId') ?? '';
    const run = runManager.get(runId);
    if (!run) {
      return context.json({ error: 'not_found' }, 404);
    }
    return context.json(run);
  };

  app.get('/api/v1/dispatches/:runId', getDispatch);
  app.get('/api/v1/runs/:runId', getDispatch);

  const stopDispatch = async (context: Context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const runId = context.req.param('runId') ?? '';
    const stopped = await runManager.stop(runId);
    return context.json({ stopped }, stopped ? 200 : 404);
  };

  app.post('/api/v1/dispatches/:runId/stop', stopDispatch);
  app.post('/api/v1/runs/:runId/stop', stopDispatch);

  app.post('/api/v1/pairing/register', async (context) => {
    const tokenRecord = await requireAuth(context.req.header('authorization'));
    if (!tokenRecord) {
      return context.json({ error: 'unauthorized' }, 401);
    }
    const body = await context.req.json<Record<string, unknown>>();
    const record = shortCodeStore.register({
      code: typeof body['code'] === 'string' ? body['code'] : undefined,
      url: typeof body['url'] === 'string' ? body['url'] : new URL(context.req.url).origin,
      token: typeof body['token'] === 'string' ? body['token'] : '',
      ttlMs: typeof body['ttlMs'] === 'number' ? body['ttlMs'] : undefined,
    });
    return context.json({ code: record.code, url: record.url, expiresAt: record.expiresAt }, 201);
  });

  app.post('/api/v1/pairing/consume', async (context) => {
    const body = await context.req.json<Record<string, unknown>>();
    const code = typeof body['code'] === 'string' ? body['code'] : '';
    const record = shortCodeStore.consume(code);
    if (!record) {
      return context.json({ error: 'not_found' }, 404);
    }
    return context.json(record);
  });

  app.get('*', async (context) => {
    if (!config.enableWebui) {
      return context.text('Not Found', 404);
    }
    const response = await serveWebuiRequest(context.req.path, webuiRoot);
    return response ?? context.text('Not Found', 404);
  });

  server.on('upgrade', async (req, socket, head) => {
    const initialRecord = await authenticateBearerToken(tokenStore, req.headers.authorization);
    wss.handleUpgrade(req, socket, head, (ws: import('ws').WebSocket) => {
    const conn = new ClientConn(ws, config.maxPendingFrames, initialRecord);
      let activeTokenRecord = initialRecord ?? null;
      connections.add(conn);
      const authTimeout = setTimeout(() => {
        if (!conn.authenticated) {
          conn.close(GATEWAY_CLOSE_CODES.unauthorized, 'auth timeout');
        }
      }, config.unauthenticatedTimeoutMs);

      if (initialRecord) {
        conn.send(createHelloFrame(config.serverVersion));
      }

      ws.on('message', async (rawData: import('ws').RawData) => {
        let rawFrame: Record<string, unknown>;
        try {
          rawFrame = JSON.parse(rawData.toString()) as Record<string, unknown>;
        } catch (error) {
          conn.close(GATEWAY_CLOSE_CODES.invalidFrame, error instanceof Error ? error.message : 'invalid frame');
          return;
        }
        const requestId = typeof rawFrame['id'] === 'string' ? rawFrame['id'] : null;
        let frame: GatewayFrame;
        try {
          frame = decodeFrame(rawData.toString());
        } catch (error) {
          if (activeTokenRecord && requestId && typeof rawFrame['type'] === 'string') {
            const response = await handleRequestFrame(rawFrame, requestId, activeTokenRecord, conn);
            if (response) {
              conn.sendJson(response);
              return;
            }
          }
          logger.warn('Rejected websocket frame', {
            requestId,
            type: typeof rawFrame['type'] === 'string' ? rawFrame['type'] : null,
            error: error instanceof Error ? error.message : 'invalid frame',
          });
          conn.close(GATEWAY_CLOSE_CODES.invalidFrame, error instanceof Error ? error.message : 'invalid frame');
          return;
        }

        if (!conn.authenticated) {
          if (frame.type !== 'auth') {
            conn.close(GATEWAY_CLOSE_CODES.unauthorized, 'auth required');
            return;
          }
          const authRecord = await tokenStore.verify((frame as AuthFrame).token);
          if (!authRecord) {
            conn.close(GATEWAY_CLOSE_CODES.unauthorized, 'invalid token');
            return;
          }
          await tokenStore.touch(authRecord.id);
          conn.authenticate(authRecord);
          activeTokenRecord = authRecord;
          conn.send(createHelloFrame(config.serverVersion));
          return;
        }

        if (frame.type === 'ping') {
          conn.send({ type: 'pong' });
          return;
        }

        if (frame.type === 'subscribe') {
          void runManager.subscribe(conn, frame.runId, frame.sinceSeq ?? 0);
          return;
        }

        if (frame.type === 'unsubscribe') {
          runManager.unsubscribe(conn, frame.runId);
          return;
        }

        if (frame.type === 'session.subscribe') {
          void runManager.subscribeSession(conn, frame.sessionId);
          return;
        }

        if (frame.type === 'session.unsubscribe') {
          runManager.unsubscribeSession(conn, frame.sessionId);
          return;
        }

        if (frame.type === 'hook.decision') {
          const accepted = runManager.submitHookDecision(conn, frame);
          if (requestId) {
            conn.sendJson({ id: requestId, ok: accepted });
          }
          return;
        }

        if (activeTokenRecord && requestId) {
          const response = await handleRequestFrame(rawFrame, requestId, activeTokenRecord, conn);
          if (response) {
            conn.sendJson(response);
            return;
          }
        }
      });

      ws.on('close', () => {
        clearTimeout(authTimeout);
        runManager.removeConnection(conn);
        connections.delete(conn);
      });
    });
  });

  return {
    tokenStore,
    runManager,
    get address() {
      const bound = server.address();
      return {
        host: config.host,
        port: typeof bound === 'object' && bound ? bound.port : config.port,
      };
    },
    async start() {
      if (started) return;
      await bootstrapAuth.initialize();
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(config.port, config.host, () => {
          server.off('error', reject);
          resolve();
        });
      });
      started = true;
      logger.info('Gateway server listening', {
        host: config.host,
        port: config.port,
      });
    },
    async stop() {
      if (!started) return;
      await runManager.shutdown();
      for (const conn of connections) {
        conn.close(1001, 'server shutdown');
      }
      await new Promise<void>((resolve) => {
        wss.close(() => resolve());
      });
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      const closeableStore = tokenStore as TokenStore & { close?: () => void };
      closeableStore.close?.();
      bootstrapAuthStore.close?.();
      started = false;
    },
  };

  async function handleRequestFrame(
    rawFrame: Record<string, unknown>,
    id: string,
    tokenRecord: TokenRecord,
    conn?: ClientConn,
  ): Promise<Record<string, unknown> | null> {
    switch (rawFrame['type']) {
      case 'agents.list':
        return { id, agents: await resolveAvailableAgents() };
      case 'session.start': {
        const runId =
          typeof rawFrame['runId'] === 'string' && rawFrame['runId'].trim().length > 0
            ? rawFrame['runId']
            : generateRunId();
        const agent = String(rawFrame['agent'] ?? '');
        if (!(await ensureAgentAvailable(agent))) {
          return { id, error: 'agent_unavailable', agent };
        }
        if (conn) {
          await runManager.subscribe(conn, runId, 0);
        }
        const run = await runManager.start(
          {
            runId,
            agent,
            model: typeof rawFrame['model'] === 'string' ? rawFrame['model'] : undefined,
            prompt: typeof rawFrame['prompt'] === 'string' ? rawFrame['prompt'] : '',
            attachments: sanitizeAttachments(rawFrame['attachments']),
            approvalMode: readApprovalMode(rawFrame['approvalMode']),
            sessionId: typeof rawFrame['sessionId'] === 'string' ? rawFrame['sessionId'] : undefined,
            cwd: typeof rawFrame['cwd'] === 'string' ? rawFrame['cwd'] : undefined,
            workspaceId: typeof rawFrame['workspaceId'] === 'string' ? rawFrame['workspaceId'] : undefined,
            forkSessionId: typeof rawFrame['forkSessionId'] === 'string' ? rawFrame['forkSessionId'] : undefined,
          },
          {
            tokenId: tokenRecord.id,
            name: tokenRecord.name,
            remoteAddress: null,
          },
        );
        return { id, run };
      }
      case 'run.stop': {
        const stopped = await runManager.stop(String(rawFrame['runId'] ?? ''));
        return { id, stopped };
      }
      case 'session.message': {
        const sessionId = String(rawFrame['sessionId'] ?? '');
        const run = await runManager.sendSessionInput(
          sessionId,
          String(rawFrame['prompt'] ?? ''),
          {
            tokenId: tokenRecord.id,
            name: tokenRecord.name,
            remoteAddress: null,
          },
          {
            agent: typeof rawFrame['agent'] === 'string' ? rawFrame['agent'] : undefined,
            model: typeof rawFrame['model'] === 'string' ? rawFrame['model'] : undefined,
            attachments: sanitizeAttachments(rawFrame['attachments']),
            approvalMode: readApprovalMode(rawFrame['approvalMode']),
          },
        );
        if (!run) {
          return { id, error: 'not_found' };
        }
        if (conn) {
          await runManager.subscribe(conn, run.runId, 0);
          await runManager.subscribeSession(conn, sessionId);
        }
        const session = await runManager.getSession(sessionId);
        return { id, ok: true, run, session };
      }
      case 'pairing.register': {
        const record = shortCodeStore.register({
          code: typeof rawFrame['code'] === 'string' ? rawFrame['code'] : undefined,
          url: typeof rawFrame['url'] === 'string' ? rawFrame['url'] : 'http://127.0.0.1:7878',
          token: typeof rawFrame['token'] === 'string' ? rawFrame['token'] : '',
        });
        return { id, type: 'pairing.consumed', ...record };
      }
      case 'pairing.consume': {
        const record = shortCodeStore.consume(String(rawFrame['code'] ?? ''));
        return record ? { id, type: 'pairing.consumed', ...record } : { id, error: 'not_found' };
      }
      case 'session.subscribe':
        return { id, ok: true };
      case 'session.unsubscribe':
        return { id, ok: true };
      default:
        return null;
    }
  }
}
