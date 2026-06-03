# Programmatic Adapter Opportunities Research

This document summarizes research into which existing subprocess-based adapters would benefit from programmatic SDK or remote API variants.

## Current State

### Existing Adapter Types
- **Subprocess adapters** (11): cursor, copilot, gemini, qwen, hermes, omp, openclaw, claude, codex, pi, opencode
- **Programmatic adapters** (3): claude-agent-sdk, codex-sdk, pi-sdk  
- **Remote adapters** (3): opencode-http, codex-websocket, agent-mux-remote

## Research Results

### High Priority Candidates

#### 1. Google Gemini SDK Adapter
- **Current**: `gemini` CLI command
- **Opportunity**: Official Google AI SDKs (Python, Node.js, Go, Java)
- **Benefits**:
  - Direct SDK integration eliminates CLI subprocess overhead
  - Better streaming support with WebSocket via Gemini Live API
  - Native tool calling without CLI parsing
  - Production-ready officially supported libraries
- **Recommendation**: Implement `gemini-sdk-adapter` extending BaseProgrammaticAdapter

#### 2. Qwen/DashScope SDK Adapter  
- **Current**: `qwen` CLI command
- **Opportunity**: Official Alibaba DashScope SDKs + OpenAI-compatible API
- **Benefits**:
  - Already uses OpenAI-compatible API underneath CLI
  - Official Python/Node.js SDKs available
  - Async/streaming support built-in
  - Significant performance improvement over CLI
- **Recommendation**: Implement `qwen-sdk-adapter` extending BaseProgrammaticAdapter

#### 3. GitHub Copilot SDK Adapter
- **Current**: `gh copilot` CLI extension  
- **Opportunity**: New GitHub Copilot SDK (public preview as of April 2026)
- **Benefits**:
  - Same engine as CLI but with programmatic control
  - Multi-language SDKs (Python, TypeScript, Go, .NET, Java)
  - OpenTelemetry support for distributed tracing
  - JSON-RPC communication with Copilot server
- **Recommendation**: Implement `copilot-sdk-adapter` extending BaseProgrammaticAdapter

### Medium Priority Candidates

#### 4. Cursor API Adapter
- **Current**: `cursor-agent` CLI command
- **Opportunity**: Community reverse-engineered APIs (HTTP/2 + streaming)
- **Status**: No official SDK, but APIs exist
- **Recommendation**: Monitor for official API release before implementing

#### 5. Hermes RPC Adapter
- **Current**: `hermes` CLI command  
- **Opportunity**: Proposed RPC mode + existing REST endpoints
- **Status**: RPC mode not yet implemented
- **Recommendation**: Consider when RPC mode becomes available

#### 6. OpenClaw SDK Adapter
- **Current**: `openclaw` CLI command
- **Opportunity**: Python SDK (`openclaw-py`) + REST API
- **Benefits**: Open-source with plugin system
- **Recommendation**: Medium priority for open-source integration scenarios

### Not Recommended

#### 7. OMP/MCP
- **Analysis**: MCP is a protocol standard, not an agent platform
- **Current Support**: Already integrated in existing adapters via MCP plugin support
- **Recommendation**: No separate adapter needed

## Implementation Recommendations

### Phase 1: High-Impact SDK Adapters
1. `gemini-sdk-adapter` - Google AI SDK integration
2. `qwen-sdk-adapter` - DashScope SDK integration  
3. `copilot-sdk-adapter` - GitHub Copilot SDK integration

### Phase 2: API/Remote Adapters
4. `cursor-api-adapter` - When official API becomes available
5. `hermes-rpc-adapter` - When RPC mode is implemented

### Phase 3: Specialty Adapters  
6. `openclaw-sdk-adapter` - For open-source integration needs

## Technical Approach

### Programmatic Adapters
- Extend `BaseProgrammaticAdapter`
- Use official SDKs for direct integration
- Implement streaming via SDK native capabilities
- Mock implementations for testing

### Remote Adapters
- Extend `BaseRemoteAdapter`
- HTTP/WebSocket connections to APIs
- Server lifecycle management
- Real-time bidirectional communication

## Next Steps

1. **Implement high-priority SDK adapters** (gemini-sdk, qwen-sdk, copilot-sdk)
2. **Update adapter validation** to support non-subprocess adapter types
3. **Create comprehensive tests** for new adapter variants
4. **Update documentation** with new adapter capabilities
5. **Monitor** Cursor and Hermes for official API releases

## Sources

- [Gemini API libraries | Google AI for Developers](https://ai.google.dev/gemini-api/docs/libraries)
- [Install DashScope and OpenAI SDKs | Alibaba Cloud Model Studio](https://www.alibabacloud.com/help/en/model-studio/install-sdk)  
- [GitHub Copilot SDK | GitHub](https://github.com/github/copilot-sdk)
- [Cursor APIs Overview | Cursor Docs](https://cursor.com/docs/api)
- [Hermes Agent | NousResearch](https://github.com/nousresearch/hermes-agent)
- [OpenClaw | GitHub](https://github.com/openclaw/openclaw)
- [Model Context Protocol | GitHub](https://github.com/modelcontextprotocol)
