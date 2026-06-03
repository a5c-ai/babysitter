---
title: Multi-Adapter Architecture Design
date: 2026-04-13
version: 1.0
---

# Multi-Adapter Architecture Design

> Archived design document. Preserved for historical context; not part of the current normative `reference/` contract.

## Overview

Extend agent-mux to support multiple adapter types beyond subprocess-based execution. This enables integration with sophisticated tools that provide HTTP APIs, WebSocket interfaces, or direct SDK access.

## Current Architecture (Subprocess-Only)

```typescript
interface AgentAdapter {
  buildSpawnArgs(options: RunOptions): SpawnArgs;
  parseEvent(line: string, context: ParseContext): AgentEvent | AgentEvent[] | null;
  // ... session, auth, config methods
}
```

**Limitations:**
- Forces all tools into subprocess model
- Cannot leverage HTTP APIs, WebSocket streaming, or native SDKs
- Suboptimal for TUI-first tools (OpenCode), server-based tools (Codex app-server)

## Proposed Architecture

### 1. Adapter Type Hierarchy

```typescript
// Base interface (shared across all adapter types)
interface BaseAgentAdapter {
  // Identity
  readonly agent: AgentName;
  readonly displayName: string;
  readonly adapterType: 'subprocess' | 'remote' | 'programmatic';
  
  // Capabilities (unchanged)
  readonly capabilities: AgentCapabilities;
  readonly models: ModelCapabilities[];
  
  // Common functionality
  detectAuth(): Promise<AuthState>;
  getAuthGuidance(): AuthSetupGuidance;
  sessionDir(cwd?: string): string;
  parseSessionFile(filePath: string): Promise<Session>;
  // ... other common methods
}

// Subprocess adapters (current model)
interface SubprocessAdapter extends BaseAgentAdapter {
  readonly adapterType: 'subprocess';
  readonly cliCommand: string;
  buildSpawnArgs(options: RunOptions): SpawnArgs;
  parseEvent(line: string, context: ParseContext): AgentEvent | AgentEvent[] | null;
}

// Remote adapters (HTTP, WebSocket, Unix sockets)
interface RemoteAdapter extends BaseAgentAdapter {
  readonly adapterType: 'remote';
  readonly connectionType: 'http' | 'websocket' | 'unix';
  
  connect(options: RunOptions): Promise<RemoteConnection>;
  disconnect(connection: RemoteConnection): Promise<void>;
  
  // Optional: start/stop server if adapter manages it
  startServer?(): Promise<ServerInfo>;
  stopServer?(serverInfo: ServerInfo): Promise<void>;
}

// Programmatic adapters (direct SDK integration)
interface ProgrammaticAdapter extends BaseAgentAdapter {
  readonly adapterType: 'programmatic';
  
  execute(options: RunOptions): AsyncIterableIterator<AgentEvent>;
}
```

### 2. Connection Abstractions

```typescript
// Remote connection interface
interface RemoteConnection {
  readonly connectionId: string;
  readonly connectionType: 'http' | 'websocket' | 'unix';
  
  send(data: unknown): Promise<void>;
  receive(): AsyncIterableIterator<AgentEvent>;
  close(): Promise<void>;
}

// HTTP-specific connection
interface HttpConnection extends RemoteConnection {
  readonly connectionType: 'http';
  readonly baseUrl: string;
  
  get(path: string, params?: Record<string, unknown>): Promise<unknown>;
  post(path: string, data?: unknown): Promise<unknown>;
  stream(path: string, data?: unknown): AsyncIterableIterator<AgentEvent>;
}

// WebSocket-specific connection  
interface WebSocketConnection extends RemoteConnection {
  readonly connectionType: 'websocket';
  readonly websocketUrl: string;
  
  subscribe(channel: string): AsyncIterableIterator<AgentEvent>;
  unsubscribe(channel: string): Promise<void>;
}
```

### 3. Server Management

```typescript
interface ServerInfo {
  readonly serverId: string;
  readonly serverType: string;
  readonly endpoint: string;
  readonly pid?: number;
  readonly health?: 'starting' | 'healthy' | 'unhealthy';
}

interface ServerManager {
  start(adapter: RemoteAdapter, options?: ServerOptions): Promise<ServerInfo>;
  stop(serverId: string): Promise<void>;
  health(serverId: string): Promise<ServerInfo>;
  list(): Promise<ServerInfo[]>;
}
```

## Implementation Plan

### Phase 1: Core Architecture

1. **Create new interface hierarchy** in `packages/core/src/adapter-types.ts`
2. **Extend AgentAdapter** to be union type: `SubprocessAdapter | RemoteAdapter | ProgrammaticAdapter`
3. **Update BaseAgentAdapter** in adapters package to implement `SubprocessAdapter`
4. **Maintain backward compatibility** - all existing adapters continue working

### Phase 2: Execution Engine Updates

1. **Update RunHandleImpl** to route based on `adapter.adapterType`
2. **Create RemoteRunner** for HTTP/WebSocket execution
3. **Create ProgrammaticRunner** for direct SDK execution  
4. **Add ServerManager** for lifecycle management
5. **Update event streaming** to handle different execution models

### Phase 3: New Adapter Implementations

1. **opencode-http**: HTTP server + REST API + SSE streaming
2. **codex-sdk**: Direct SDK integration
3. **codex-websocket**: WebSocket app-server integration
4. **claude-agent-sdk**: Programmatic Claude interface
5. **pi-sdk**: Enhanced programmatic Pi interface

### Phase 4: Mock Infrastructure

1. **MockHttpServer**: Simulate HTTP endpoints + SSE
2. **MockWebSocketServer**: Simulate real-time connections
3. **MockSDK**: Simulate direct SDK calls
4. **Enhanced scenarios**: Support all adapter types

## Adapter Naming Convention

**Pattern**: `{tool}-{type}` where type indicates the integration method:

- `opencode` (subprocess, default)
- `opencode-http` (HTTP server)
- `codex` (subprocess, current)
- `codex-sdk` (programmatic SDK)
- `codex-websocket` (WebSocket app-server)
- `claude-agent-sdk` (programmatic)

## Example Adapter Implementations

### HTTP Adapter (OpenCode)

```typescript
class OpenCodeHttpAdapter implements RemoteAdapter {
  readonly adapterType = 'remote';
  readonly connectionType = 'http';
  readonly agent = 'opencode-http';
  
  async connect(options: RunOptions): Promise<HttpConnection> {
    // Start 'opencode serve' if needed
    const serverInfo = await this.ensureServer();
    
    // Create HTTP connection
    return new OpenCodeHttpConnection({
      baseUrl: serverInfo.endpoint,
      sessionId: options.sessionId,
      model: options.model,
    });
  }
  
  private async ensureServer(): Promise<ServerInfo> {
    // Check if server already running
    // If not, start via 'opencode serve --port 0'
    // Return connection details
  }
}

class OpenCodeHttpConnection implements HttpConnection {
  async *stream(path: string, data: unknown): AsyncIterableIterator<AgentEvent> {
    // POST to /api/chat/stream with SSE
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Accept': 'text/event-stream' }
    });
    
    for await (const chunk of response.body) {
      yield this.parseServerSentEvent(chunk);
    }
  }
}
```

### SDK Adapter (Codex)

```typescript
class CodexSdkAdapter implements ProgrammaticAdapter {
  readonly adapterType = 'programmatic';
  readonly agent = 'codex-sdk';
  
  async *execute(options: RunOptions): AsyncIterableIterator<AgentEvent> {
    const sdk = new CodexSDK({
      apiKey: process.env.OPENAI_API_KEY,
      model: options.model || this.defaultModelId,
    });
    
    const stream = await sdk.chat.completions.create({
      messages: [{ role: 'user', content: options.prompt }],
      stream: true,
    });
    
    for await (const chunk of stream) {
      yield this.parseCodexChunk(chunk);
    }
  }
}
```

## Migration Strategy

1. **Backward Compatible**: All existing adapters continue working unchanged
2. **Gradual Adoption**: Add new adapter types without breaking existing functionality  
3. **Clear Documentation**: Document when to use each adapter type
4. **Mock Support**: Ensure all adapter types have full mock coverage

## Benefits

1. **Native Performance**: Direct SDK integration eliminates subprocess overhead
2. **Real-time Streaming**: WebSocket connections enable bidirectional communication
3. **Full Capabilities**: HTTP APIs provide access to complete tool feature sets
4. **Flexible Integration**: Choose the best integration method per tool
5. **Future-Proof**: Support emerging tools with non-CLI interfaces

## Claude-Specific Transport Note

Claude now spans multiple distinct integration surfaces that should not be collapsed into a single "server mode" mental model:

- `claude` CLI can provide a **persistent structured subprocess transport** through `--print --input-format stream-json --output-format stream-json`, with stdin carrying later user turns and stdout carrying structured events.
- `claude-agent-sdk` is a **programmatic persistent transport** with direct callback integration.
- `claude-remote-control` is the **server-managed Claude surface for Claude.ai / Claude app clients**. Agent-mux can launch and observe the bridge honestly, but it does not advertise local stdin-driven chat semantics for it.
- Claude channels are **MCP-mediated push/reply integrations into a running Claude host session**, not a standalone replacement for the CLI or SDK transports.

Agent-mux should model these surfaces honestly and only advertise the transport semantics each one actually supports.

## Trade-offs

1. **Complexity**: Multiple execution paths increase code complexity
2. **Resource Management**: HTTP servers and connections need lifecycle management
3. **Testing**: More sophisticated mocking required
4. **Dependencies**: Programmatic adapters may require additional npm dependencies

## Files to Create/Modify

### New Files
- `packages/core/src/adapter-types.ts` - New interface hierarchy
- `packages/core/src/remote-runner.ts` - HTTP/WebSocket execution
- `packages/core/src/programmatic-runner.ts` - SDK execution  
- `packages/core/src/server-manager.ts` - Server lifecycle management
- `packages/adapters/src/remote-adapter-base.ts` - Base class for remote adapters
- `packages/adapters/src/programmatic-adapter-base.ts` - Base class for SDK adapters

### Modified Files
- `packages/core/src/adapter.ts` - Update AgentAdapter union type
- `packages/core/src/run-handle-impl.ts` - Route by adapter type
- `packages/adapters/src/base-adapter.ts` - Implement SubprocessAdapter
- `packages/harness-mock/src/index.ts` - Add mock infrastructure

This architecture enables agent-mux to evolve beyond subprocess-only integration while maintaining full backward compatibility and providing a clear path for supporting sophisticated AI tools with diverse integration requirements.
