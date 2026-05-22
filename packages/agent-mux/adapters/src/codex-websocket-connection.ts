import WebSocket from 'ws';

import type {
  AgentEvent,
  CostRecord,
  InteractionResponse,
  ModelCapabilities,
  WebSocketConnection,
  WebSocketMessage,
} from '@a5c-ai/agent-mux-core';

type ApprovalMode = 'yolo' | 'prompt' | 'deny';

interface JsonRpcErrorShape {
  code?: number;
  message?: string;
}

interface JsonRpcResponse {
  id: string | number;
  result?: unknown;
  error?: JsonRpcErrorShape;
}

interface JsonRpcNotification {
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcServerRequest extends JsonRpcNotification {
  id: string | number;
}

interface PendingResponse {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

interface PendingInteractionRequest {
  id: string | number;
  method: string;
  params: Record<string, unknown>;
}

interface QueuedUserMessage {
  type: 'user_message';
  text: string;
}

interface QueuedInteractionResponse {
  type: 'interaction_response';
  interactionId: string;
  response: InteractionResponse;
}

type SendPayload = QueuedUserMessage | QueuedInteractionResponse | WebSocketMessage | Record<string, unknown>;

export class CodexWebSocketConnection implements WebSocketConnection {
  readonly connectionId: string;
  readonly connectionType = 'websocket' as const;
  readonly websocketUrl: string;
  readonly endpoint: string;

  private readonly prompt: string;
  private readonly cwd: string;
  private readonly requestedModel?: string;
  private readonly approvalMode: ApprovalMode;
  private readonly initialSessionId?: string;
  private readonly models: ModelCapabilities[];
  private readonly createSocket: (url: string) => WebSocket;

  private ws: WebSocket | null = null;
  private connected = false;
  private closed = false;
  private requestSeq = 0;
  private pendingResponses = new Map<string | number, PendingResponse>();
  private pendingInteractionRequests = new Map<string, PendingInteractionRequest>();
  private eventQueue: AgentEvent[] = [];
  private waitingResolver: ((event: AgentEvent | null) => void) | null = null;
  private threadId: string | null = null;
  private currentTurnId: string | null = null;
  private currentModelId: string | undefined;
  private turnIndex = -1;
  private textByItemId = new Map<string, string>();
  private thinkingByItemId = new Map<string, string>();

  constructor(options: {
    websocketUrl: string;
    connectionId: string;
    prompt: string;
    cwd: string;
    requestedModel?: string;
    approvalMode: ApprovalMode;
    sessionId?: string;
    models: ModelCapabilities[];
    createSocket?: (url: string) => WebSocket;
  }) {
    this.websocketUrl = options.websocketUrl;
    this.connectionId = options.connectionId;
    this.endpoint = options.websocketUrl;
    this.prompt = options.prompt;
    this.cwd = options.cwd;
    this.requestedModel = options.requestedModel;
    this.approvalMode = options.approvalMode;
    this.initialSessionId = options.sessionId;
    this.models = options.models;
    this.createSocket = options.createSocket ?? ((url) => new WebSocket(url));
  }

  async connect(): Promise<void> {
    const socket = this.createSocket(this.websocketUrl);
    this.ws = socket;

    await new Promise<void>((resolve, reject) => {
      const onOpen = () => {
        cleanup();
        resolve();
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const cleanup = () => {
        socket.off('open', onOpen);
        socket.off('error', onError);
      };
      socket.once('open', onOpen);
      socket.once('error', onError);
    });

    socket.on('message', (data) => {
      void this.handleIncomingMessage(data.toString());
    });
    socket.on('close', () => {
      this.connected = false;
      this.closed = true;
      if (this.waitingResolver) {
        const resolve = this.waitingResolver;
        this.waitingResolver = null;
        resolve(null);
      }
    });
    socket.on('error', (error) => {
      this.pushEvent({
        type: 'error',
        runId: this.connectionId,
        agent: 'codex-websocket',
        timestamp: Date.now(),
        code: 'INTERNAL',
        message: error.message,
        recoverable: false,
      });
    });

    this.connected = true;

    await this.request('initialize', {
      clientInfo: { name: 'agent-mux', version: '0.4.0' },
      capabilities: {
        experimentalApi: true,
      },
    });
    await this.notify('initialized');

    if (this.initialSessionId) {
      const resumed = await this.request<{
        thread: { id: string };
        model?: string;
      }>('thread/resume', {
        threadId: this.initialSessionId,
        cwd: this.cwd,
        approvalPolicy: this.mapApprovalPolicy(),
        persistExtendedHistory: false,
        ...(this.requestedModel ? { model: this.requestedModel } : {}),
      });
      this.threadId = resumed.thread.id;
      this.currentModelId = resumed.model ?? this.requestedModel;
      this.pushEvent({
        type: 'session_start',
        runId: this.connectionId,
        agent: 'codex-websocket',
        timestamp: Date.now(),
        sessionId: resumed.thread.id,
        resumed: true,
      });
    } else {
      const started = await this.request<{
        thread: { id: string };
        model?: string;
      }>('thread/start', {
        cwd: this.cwd,
        approvalPolicy: this.mapApprovalPolicy(),
        sandbox: 'danger-full-access',
        experimentalRawEvents: false,
        persistExtendedHistory: false,
        ...(this.requestedModel ? { model: this.requestedModel } : {}),
      });
      this.threadId = started.thread.id;
      this.currentModelId = started.model ?? this.requestedModel;
      this.pushEvent({
        type: 'session_start',
        runId: this.connectionId,
        agent: 'codex-websocket',
        timestamp: Date.now(),
        sessionId: started.thread.id,
        resumed: false,
      });
    }

    if (this.prompt.trim().length > 0) {
      await this.startTurn(this.prompt);
    }
  }

  async send(data: SendPayload): Promise<void> {
    if (!this.connected || this.closed) {
      throw new Error('Codex app-server connection is not active');
    }

    if (this.isUserMessagePayload(data)) {
      await this.sendUserMessage(data.text);
      return;
    }

    if (this.isInteractionResponsePayload(data)) {
      await this.sendInteractionResponse(data.interactionId, data.response);
      return;
    }
  }

  async *receive(): AsyncIterableIterator<AgentEvent> {
    while (!this.closed || this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        yield event;
        continue;
      }

      const nextEvent = await new Promise<AgentEvent | null>((resolve) => {
        this.waitingResolver = resolve;
      });
      if (nextEvent) {
        yield nextEvent;
      }
    }
  }

  subscribe(_channel: string): AsyncIterableIterator<AgentEvent> {
    return this.receive();
  }

  async unsubscribe(_channel: string): Promise<void> {}

  async close(): Promise<void> {
    this.closed = true;
    const socket = this.ws;
    this.ws = null;
    if (socket && socket.readyState === WebSocket.OPEN) {
      await new Promise<void>((resolve) => {
        socket.once('close', () => resolve());
        socket.close();
      });
    }
    if (this.waitingResolver) {
      const resolve = this.waitingResolver;
      this.waitingResolver = null;
      resolve(null);
    }
  }

  private async handleIncomingMessage(raw: string): Promise<void> {
    let message: Record<string, unknown>;
    try {
      message = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      this.pushEvent({
        type: 'error',
        runId: this.connectionId,
        agent: 'codex-websocket',
        timestamp: Date.now(),
        code: 'INTERNAL',
        message: `Invalid Codex app-server message: ${raw}`,
        recoverable: false,
      });
      return;
    }

    if (typeof message['method'] === 'string' && message['id'] != null) {
      this.handleServerRequest({
        id: message['id'] as string | number,
        method: message['method'],
        params: (message['params'] as Record<string, unknown> | undefined) ?? {},
      });
      return;
    }

    if (typeof message['method'] === 'string') {
      this.handleNotification({
        method: message['method'],
        params: (message['params'] as Record<string, unknown> | undefined) ?? {},
      });
      return;
    }

    if (message['id'] != null) {
      this.handleResponse({
        id: message['id'] as string | number,
        result: message['result'],
        error: message['error'] as JsonRpcErrorShape | undefined,
      });
    }
  }

  private handleResponse(response: JsonRpcResponse): void {
    const pending = this.pendingResponses.get(response.id);
    if (!pending) {
      return;
    }
    this.pendingResponses.delete(response.id);
    if (response.error) {
      pending.reject(
        new Error(response.error.message ?? `Codex app-server request failed (${String(response.id)})`),
      );
      return;
    }
    pending.resolve(response.result);
  }

  private handleServerRequest(request: JsonRpcServerRequest): void {
    const interactionId = String(request.id);
    const params = request.params ?? {};
    this.pendingInteractionRequests.set(interactionId, {
      id: request.id,
      method: request.method,
      params,
    });

    const base = this.baseEvent();
    switch (request.method) {
      case 'item/commandExecution/requestApproval': {
        const command = String(params['command'] ?? 'command');
        const reason = params['reason'];
        this.pushEvent({
          ...base,
          type: 'approval_request',
          interactionId,
          action: 'command_execution',
          detail: typeof reason === 'string' && reason.length > 0 ? `${command}\n${reason}` : command,
          toolName: command,
          riskLevel: 'high',
        });
        return;
      }
      case 'item/fileChange/requestApproval': {
        const reason = params['reason'];
        this.pushEvent({
          ...base,
          type: 'approval_request',
          interactionId,
          action: 'file_change',
          detail: typeof reason === 'string' && reason.length > 0 ? reason : 'Codex requested file changes',
          toolName: 'file_change',
          riskLevel: 'medium',
        });
        return;
      }
      case 'item/permissions/requestApproval': {
        const reason = params['reason'];
        this.pushEvent({
          ...base,
          type: 'approval_request',
          interactionId,
          action: 'permission_request',
          detail: typeof reason === 'string' && reason.length > 0 ? reason : 'Codex requested additional permissions',
          toolName: 'permissions',
          riskLevel: 'high',
        });
        return;
      }
      case 'item/tool/requestUserInput': {
        const questions = params['questions'];
        const firstQuestion = Array.isArray(questions) ? questions[0] as Record<string, unknown> | undefined : undefined;
        this.pushEvent({
          ...base,
          type: 'input_required',
          interactionId,
          question: String(firstQuestion?.['question'] ?? 'Codex needs input'),
          context: undefined,
          source: 'tool',
        });
        return;
      }
      default: {
        this.pushEvent({
          ...base,
          type: 'debug',
          level: 'warn',
          message: `Unhandled Codex app-server server request: ${request.method}`,
        });
      }
    }
  }

  private handleNotification(notification: JsonRpcNotification): void {
    const params = notification.params ?? {};

    switch (notification.method) {
      case 'turn/started': {
        const turn = params['turn'] as Record<string, unknown> | undefined;
        this.currentTurnId = typeof turn?.['id'] === 'string' ? turn['id'] : this.currentTurnId;
        this.turnIndex += 1;
        this.pushEvent({
          ...this.baseEvent(),
          type: 'turn_start',
          turnIndex: this.turnIndex,
        });
        return;
      }
      case 'turn/completed': {
        const turn = params['turn'] as Record<string, unknown> | undefined;
        const durationMs = typeof turn?.['durationMs'] === 'number' ? turn['durationMs'] : undefined;
        this.currentTurnId = null;
        this.pushEvent({
          ...this.baseEvent(),
          type: 'turn_end',
          turnIndex: this.turnIndex,
          ...(durationMs != null ? { cost: undefined } : {}),
        });
        return;
      }
      case 'item/started': {
        const item = params['item'] as Record<string, unknown> | undefined;
        if (!item) return;
        this.handleItemStarted(item);
        return;
      }
      case 'item/completed': {
        const item = params['item'] as Record<string, unknown> | undefined;
        if (!item) return;
        this.handleItemCompleted(item);
        return;
      }
      case 'item/agentMessage/delta': {
        const itemId = String(params['itemId'] ?? '');
        const delta = String(params['delta'] ?? '');
        const accumulated = (this.textByItemId.get(itemId) ?? '') + delta;
        this.textByItemId.set(itemId, accumulated);
        this.pushEvent({
          ...this.baseEvent(),
          type: 'text_delta',
          delta,
          accumulated,
        });
        return;
      }
      case 'item/reasoning/textDelta':
      case 'item/reasoning/summaryTextDelta': {
        const itemId = String(params['itemId'] ?? '');
        const delta = String(params['delta'] ?? '');
        const accumulated = (this.thinkingByItemId.get(itemId) ?? '') + delta;
        this.thinkingByItemId.set(itemId, accumulated);
        this.pushEvent({
          ...this.baseEvent(),
          type: 'thinking_delta',
          delta,
          accumulated,
        });
        return;
      }
      case 'item/commandExecution/outputDelta': {
        const delta = String(params['delta'] ?? '');
        this.pushEvent({
          ...this.baseEvent(),
          type: 'shell_stdout_delta',
          delta,
        });
        return;
      }
      case 'thread/tokenUsage/updated': {
        const tokenUsage = params['tokenUsage'] as Record<string, unknown> | undefined;
        const total = tokenUsage?.['total'] as Record<string, unknown> | undefined;
        if (!total) return;
        const inputTokens = Number(total['inputTokens'] ?? 0);
        const outputTokens = Number(total['outputTokens'] ?? 0);
        const cachedTokens = Number(total['cachedInputTokens'] ?? 0);
        const thinkingTokens = Number(total['reasoningOutputTokens'] ?? 0);
        const cost = this.buildCostRecord(inputTokens, outputTokens, thinkingTokens, cachedTokens);
        this.pushEvent({
          ...this.baseEvent(),
          type: 'token_usage',
          inputTokens,
          outputTokens,
          thinkingTokens,
          cachedTokens,
        });
        this.pushEvent({
          ...this.baseEvent(),
          type: 'cost',
          cost,
        });
        return;
      }
      case 'error': {
        const error = params['error'] as Record<string, unknown> | undefined;
        this.pushEvent({
          ...this.baseEvent(),
          type: 'error',
          code: 'INTERNAL',
          message: String(error?.['message'] ?? 'Codex app-server error'),
          recoverable: Boolean(params['willRetry']),
        });
        return;
      }
      case 'mcpServer/startupStatus/updated': {
        const status = String(params['status'] ?? '');
        if (status === 'failed') {
          this.pushEvent({
            ...this.baseEvent(),
            type: 'debug',
            level: 'warn',
            message: String(params['error'] ?? 'Codex MCP server failed to start'),
          });
        }
        return;
      }
      default:
        return;
    }
  }

  private handleItemStarted(item: Record<string, unknown>): void {
    const itemType = String(item['type'] ?? '');
    switch (itemType) {
      case 'agentMessage': {
        const itemId = String(item['id'] ?? '');
        this.textByItemId.set(itemId, '');
        this.pushEvent({
          ...this.baseEvent(),
          type: 'message_start',
        });
        return;
      }
      case 'reasoning': {
        const itemId = String(item['id'] ?? '');
        this.thinkingByItemId.set(itemId, '');
        this.pushEvent({
          ...this.baseEvent(),
          type: 'thinking_start',
          effort: undefined,
        });
        return;
      }
      case 'commandExecution': {
        const toolCallId = String(item['id'] ?? '');
        const command = String(item['command'] ?? 'command');
        this.pushEvent({
          ...this.baseEvent(),
          type: 'tool_call_start',
          toolCallId,
          toolName: 'commandExecution',
          inputAccumulated: command,
        });
        this.pushEvent({
          ...this.baseEvent(),
          type: 'shell_start',
          command,
          cwd: String(item['cwd'] ?? this.cwd),
        });
        return;
      }
      case 'mcpToolCall': {
        this.pushEvent({
          ...this.baseEvent(),
          type: 'mcp_tool_call_start',
          toolCallId: String(item['id'] ?? ''),
          server: String(item['server'] ?? ''),
          toolName: String(item['tool'] ?? ''),
          input: item['arguments'] ?? {},
        });
        return;
      }
      case 'dynamicToolCall': {
        this.pushEvent({
          ...this.baseEvent(),
          type: 'tool_call_start',
          toolCallId: String(item['id'] ?? ''),
          toolName: String(item['tool'] ?? ''),
          inputAccumulated: JSON.stringify(item['arguments'] ?? {}),
        });
        return;
      }
      default:
        return;
    }
  }

  private handleItemCompleted(item: Record<string, unknown>): void {
    const itemType = String(item['type'] ?? '');
    switch (itemType) {
      case 'agentMessage': {
        const itemId = String(item['id'] ?? '');
        const text = String(item['text'] ?? this.textByItemId.get(itemId) ?? '');
        this.textByItemId.delete(itemId);
        this.pushEvent({
          ...this.baseEvent(),
          type: 'message_stop',
          text,
        });
        return;
      }
      case 'reasoning': {
        const itemId = String(item['id'] ?? '');
        const thinking = this.thinkingByItemId.get(itemId) ?? '';
        this.thinkingByItemId.delete(itemId);
        this.pushEvent({
          ...this.baseEvent(),
          type: 'thinking_stop',
          thinking,
        });
        return;
      }
      case 'commandExecution': {
        const toolCallId = String(item['id'] ?? '');
        const command = String(item['command'] ?? 'command');
        const output = item['aggregatedOutput'] ?? '';
        const durationMs = Number(item['durationMs'] ?? 0);
        const exitCode = Number(item['exitCode'] ?? 0);
        this.pushEvent({
          ...this.baseEvent(),
          type: 'tool_result',
          toolCallId,
          toolName: 'commandExecution',
          output,
          durationMs,
        });
        this.pushEvent({
          ...this.baseEvent(),
          type: 'shell_exit',
          exitCode,
          durationMs,
        });
        return;
      }
      case 'mcpToolCall': {
        const toolCallId = String(item['id'] ?? '');
        const server = String(item['server'] ?? '');
        const toolName = String(item['tool'] ?? '');
        if (item['error']) {
          this.pushEvent({
            ...this.baseEvent(),
            type: 'mcp_tool_error',
            toolCallId,
            server,
            toolName,
            error: JSON.stringify(item['error']),
          });
          return;
        }
        this.pushEvent({
          ...this.baseEvent(),
          type: 'mcp_tool_result',
          toolCallId,
          server,
          toolName,
          output: item['result'] ?? null,
        });
        return;
      }
      case 'dynamicToolCall': {
        const toolCallId = String(item['id'] ?? '');
        const toolName = String(item['tool'] ?? '');
        if (item['success'] === false) {
          this.pushEvent({
            ...this.baseEvent(),
            type: 'tool_error',
            toolCallId,
            toolName,
            error: JSON.stringify(item['contentItems'] ?? []),
          });
          return;
        }
        this.pushEvent({
          ...this.baseEvent(),
          type: 'tool_result',
          toolCallId,
          toolName,
          output: item['contentItems'] ?? [],
          durationMs: Number(item['durationMs'] ?? 0),
        });
        return;
      }
      default:
        return;
    }
  }

  private async startTurn(text: string): Promise<void> {
    if (!this.threadId) {
      throw new Error('Codex app-server thread is not initialized');
    }

    const response = await this.request<{ turn: { id: string } }>('turn/start', {
      threadId: this.threadId,
      input: [this.asTextInput(text)],
      approvalPolicy: this.mapApprovalPolicy(),
    });
    this.currentTurnId = response.turn.id;
  }

  private async sendUserMessage(text: string): Promise<void> {
    if (!this.threadId) {
      throw new Error('Codex app-server thread is not initialized');
    }
    if (this.currentTurnId) {
      await this.request('turn/steer', {
        threadId: this.threadId,
        input: [this.asTextInput(text)],
        expectedTurnId: this.currentTurnId,
      });
      return;
    }
    await this.startTurn(text);
  }

  private async sendInteractionResponse(interactionId: string, response: InteractionResponse): Promise<void> {
    const pending = this.pendingInteractionRequests.get(interactionId);
    if (!pending || !this.ws) {
      throw new Error(`No pending Codex interaction ${interactionId}`);
    }
    this.pendingInteractionRequests.delete(interactionId);
    const result = this.buildInteractionResult(pending.method, response);
    this.ws.send(JSON.stringify({ id: pending.id, result }));
  }

  private buildInteractionResult(method: string, response: InteractionResponse): unknown {
    if (method === 'item/tool/requestUserInput') {
      return {
        answers: {
          response: {
            answers: [response.type === 'text' ? response.text : response.type],
          },
        },
      };
    }

    const approved = response.type === 'approve';
    switch (method) {
      case 'item/commandExecution/requestApproval':
        return { decision: approved ? 'accept' : 'decline' };
      case 'item/fileChange/requestApproval':
        return { decision: approved ? 'accept' : 'decline' };
      case 'item/permissions/requestApproval':
        return approved
          ? { permissions: {}, scope: 'turn' }
          : { permissions: {}, scope: 'turn' };
      default:
        return {};
    }
  }

  private async request<T = unknown>(method: string, params: Record<string, unknown>): Promise<T> {
    if (!this.ws) {
      throw new Error('Codex app-server socket is not connected');
    }
    const id = ++this.requestSeq;
    const payload = { method, id, params };
    const promise = new Promise<T>((resolve, reject) => {
      this.pendingResponses.set(id, { resolve: resolve as (value: unknown) => void, reject });
    });
    this.ws.send(JSON.stringify(payload));
    return promise;
  }

  private async notify(method: string): Promise<void> {
    if (!this.ws) {
      throw new Error('Codex app-server socket is not connected');
    }
    this.ws.send(JSON.stringify({ method }));
  }

  private asTextInput(text: string): { type: 'text'; text: string; text_elements: [] } {
    return {
      type: 'text',
      text,
      text_elements: [],
    };
  }

  private mapApprovalPolicy():
    | 'never'
    | 'on-request' {
    return this.approvalMode === 'yolo' ? 'never' : 'on-request';
  }

  private buildCostRecord(
    inputTokens: number,
    outputTokens: number,
    thinkingTokens: number,
    cachedTokens: number,
  ): CostRecord {
    const model = this.models.find((entry) => entry.modelId === this.currentModelId) ?? this.models[0];
    const inputPrice = model?.inputPricePerMillion ?? 0;
    const outputPrice = model?.outputPricePerMillion ?? 0;
    const thinkingPrice = model?.thinkingPricePerMillion ?? 0;
    const cachedPrice = model?.cachedInputPricePerMillion ?? inputPrice;
    const totalUsd =
      ((inputTokens - cachedTokens) / 1_000_000) * inputPrice +
      (cachedTokens / 1_000_000) * cachedPrice +
      (outputTokens / 1_000_000) * outputPrice +
      (thinkingTokens / 1_000_000) * thinkingPrice;

    return {
      totalUsd,
      inputTokens,
      outputTokens,
      thinkingTokens,
      cachedTokens,
    };
  }

  private isUserMessagePayload(data: unknown): data is QueuedUserMessage {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    const candidate = data as Partial<QueuedUserMessage>;
    return candidate.type === 'user_message' && typeof candidate.text === 'string';
  }

  private isInteractionResponsePayload(data: unknown): data is QueuedInteractionResponse {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    const candidate = data as Partial<QueuedInteractionResponse>;
    return candidate.type === 'interaction_response' && typeof candidate.interactionId === 'string' && candidate.response != null;
  }

  private pushEvent(event: AgentEvent): void {
    if (this.waitingResolver) {
      const resolve = this.waitingResolver;
      this.waitingResolver = null;
      resolve(event);
      return;
    }
    this.eventQueue.push(event);
  }

  private baseEvent(): Pick<AgentEvent, 'runId' | 'agent' | 'timestamp'> {
    return {
      runId: this.connectionId,
      agent: 'codex-websocket',
      timestamp: Date.now(),
    };
  }
}
