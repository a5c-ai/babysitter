# Droid & Amp Adapter Implementation Plan

Based on research findings from Task #38, this document outlines implementation plans for the two high-value missing adapters.

## Droid Adapter (Factory AI)

### Overview
- **Tool**: Factory Droid CLI by Factory AI
- **Type**: Enterprise AI coding agent with terminal integration
- **Performance**: Top performer on terminal benchmarks (58.75% score)
- **Key Features**: End-to-end development workflows, debugging, refactoring, CI/CD integration

### Implementation Plan

#### Phase 1: Research & Setup
- [ ] Install droid CLI: `npm install -g @factory/droid-cli`
- [ ] Research authentication methods (API keys, OAuth)
- [ ] Analyze CLI command structure and output formats
- [ ] Document session file locations and formats

#### Phase 2: Basic Adapter
```typescript
export class DroidAdapter extends BaseAgentAdapter {
  readonly agent = 'droid' as const;
  readonly displayName = 'Factory Droid';
  readonly cliCommand = 'droid';
  readonly minVersion = '1.0.0';
  
  readonly capabilities: AgentCapabilities = {
    agent: 'droid',
    canResume: true,
    canFork: true,
    supportsMultiTurn: true,
    sessionPersistence: 'file',
    supportsTextStreaming: true,
    supportsToolCallStreaming: true,
    supportsNativeTools: true,
    // ... additional capabilities
  };
}
```

#### Phase 3: Advanced Features
- [ ] Session management integration
- [ ] MCP plugin support via droid's extension system
- [ ] Cost tracking for enterprise billing
- [ ] Headless mode support for automation

#### Phase 4: Testing & Documentation
- [ ] Unit tests covering all capabilities
- [ ] Integration tests with mock scenarios
- [ ] Documentation page: `docs/02-agents/droid.md`
- [ ] Docker E2E integration

---

## Amp Adapter (Sourcegraph)

### Overview
- **Tool**: Amp CLI by Sourcegraph
- **Type**: Agentic coding assistant with multi-model support
- **Key Features**: Multi-model routing, specialized subagents, Oracle model, VS Code integration

### Implementation Plan

#### Phase 1: Research & Setup
- [ ] Install amp CLI: `npm install -g @sourcegraph/amp-cli`
- [ ] Research authentication (Sourcegraph tokens)
- [ ] Analyze command structure: `amp chat`, `amp exec`, etc.
- [ ] Study output formats and event streaming

#### Phase 2: Basic Adapter
```typescript
export class AmpAdapter extends BaseAgentAdapter {
  readonly agent = 'amp' as const;
  readonly displayName = 'Sourcegraph Amp';
  readonly cliCommand = 'amp';
  readonly minVersion = '2.0.0';
  
  readonly capabilities: AgentCapabilities = {
    agent: 'amp',
    canResume: true,
    canFork: true,
    supportsMultiTurn: true,
    sessionPersistence: 'file',
    supportsTextStreaming: true,
    supportsToolCallStreaming: true,
    supportsNativeTools: true,
    supportsSubagentDispatch: true, // Amp's specialized subagents
    // ... additional capabilities
  };
}
```

#### Phase 3: Advanced Features
- [ ] Multi-model selection support
- [ ] Subagent integration (Oracle, Librarian)
- [ ] VS Code extension coordination
- [ ] Remote code reading capabilities

#### Phase 4: Testing & Documentation
- [ ] Comprehensive test suite
- [ ] Mock harness scenarios
- [ ] Documentation: `docs/02-agents/amp.md`
- [ ] Docker E2E integration

---

## Implementation Priority

### Phase 1: Droid (Recommended First)
**Rationale:**
- More mature enterprise tool
- Clear CLI interface
- Strong performance benchmarks
- Better documented API

### Phase 2: Amp
**Rationale:**
- Complex multi-model architecture
- Tight VS Code integration may complicate CLI usage
- Newer tool with potentially evolving interface

## Resource Requirements

### Development Time
- **Droid**: ~2-3 weeks (basic implementation)
- **Amp**: ~3-4 weeks (due to complexity)

### Testing Infrastructure
- Update Docker E2E matrix with new adapters
- Add mock scenarios for both tools
- Integration with existing test suites

### Documentation
- Per-adapter documentation pages
- Tutorial examples
- Installation guides
- Troubleshooting sections

## Success Criteria

### Droid Adapter Complete When:
- [ ] Basic chat functionality working
- [ ] Session resume/fork operational
- [ ] Cost tracking implemented
- [ ] All tests passing (>20 test cases)
- [ ] Documentation complete
- [ ] Docker E2E integration

### Amp Adapter Complete When:
- [ ] Multi-model selection working
- [ ] Subagent dispatch functional
- [ ] Stream processing reliable
- [ ] All tests passing (>25 test cases)
- [ ] Documentation complete
- [ ] Docker E2E integration

This implementation plan addresses the findings from Task #38 and provides a roadmap for adding the two most valuable missing adapters to agent-mux.
