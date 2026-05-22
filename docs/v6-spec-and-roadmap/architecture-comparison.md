# V6 Architecture Comparison

## Overview

This document provides an architectural comparison between the current a5c.ai agent stack and the V6 architecture, highlighting the key differences in design philosophy, component organization, and system capabilities.

**Target Audience**: Architects, engineers, and system designers evaluating the V6 architectural approach

## Architectural Philosophy Comparison

### Current Architecture Philosophy

**Monolithic Integration**
- Single large package (`babysitter-agent`) containing all functionality
- Tight coupling between components
- All-or-nothing deployment model
- Shared state and configuration across all features

**Characteristics**:
- Simple deployment (single package)
- High coupling, low cohesion
- Difficult to isolate functionality
- Large bundle sizes for all use cases

### V6 Architecture Philosophy

**Layered Plugin Architecture**
- Clear separation between runtime, platform, and application layers
- Plugin-first design with metaplugins as a higher-order composition layer over plugins and hooks
- Selective deployment and functionality composition
- Isolated state management with defined interfaces

**Characteristics**:
- Selective deployment (compose functionality)
- High cohesion, low coupling
- Clear functional boundaries
- Optimized bundle sizes for specific use cases

## Component Organization Comparison

### Current Component Structure

```
Monolithic Package Structure
├── @a5c-ai/babysitter-agent (all functionality)
│   ├── governance/ (policies, authorities, sandbox)
│   ├── session/ (state, context, history, memory)
│   ├── mcp/ (channels, transport, client tools)
│   ├── harness/ (adapters, agentic tools)
│   ├── cost/ (tracking, observability)
│   ├── daemon/ (infrastructure)
│   └── pi/ (wrapper integration)
└── Supporting packages
    ├── @a5c-ai/hooks-mux
    ├── @a5c-ai/extension-mux
    └── @a5c-ai/babysitter-sdk
```

### V6 Component Structure

```
Layered Architecture
├── Infrastructure Layer (Dispatch/Mux)
│   ├── @a5c-ai/agent-mux (unchanged)
│   ├── @a5c-ai/hooks-mux (evolved from hooks-mux)
│   └── @a5c-ai/extension-mux (evolved from extension-mux)
├── Runtime Layer (Engine)
│   └── @a5c-ai/agent-runtime (filesystem-free core)
├── Platform Layer (Persistence + Plugins)
│   ├── @a5c-ai/agent-platform (plugin system host)
│   └── @a5c-ai/agent-platform-meta-plugins (extensibility)
├── Orchestration Layer (Domain-Specific)
│   ├── @a5c-ai/agent-platform-orchestration-plugin
│   ├── @a5c-ai/babysitter-sdk (unchanged)
│   └── @a5c-ai/babysitter-agent (complete solution)
└── Supporting Packages
    ├── @a5c-ai/catalog
    ├── @a5c-ai/observer-dashboard
    └── @a5c-ai/babysitter-tui-plugins
```

## Key Architectural Differences

### 1. Filesystem Dependencies

**Current**: Mixed filesystem access throughout all components
**V6**: Clear filesystem boundary - runtime layer filesystem-free, platform layer handles persistence

### 2. Plugin System

**Current**: Limited extensibility, hard-coded functionality
**V6**: Meta-plugin framework for composing capability concerns above concrete plugin and hook surfaces

### 3. Session Management

**Current**: Monolithic session handling
**V6**: Layered session management - in-memory runtime sessions + persistent platform sessions

### 4. Tool Integration

**Current**: Direct integration in monolithic package
**V6**: Plugin-based tool ecosystem with replaceable implementations

### 5. Event System

**Current**: Internal event handling
**V6**: Structured event-driven protocol between layers

## Deployment Pattern Comparison

### Current Deployment

**Single Package Model**:
- Install `@a5c-ai/babysitter-agent`
- Get all functionality regardless of needs
- Large bundle size for all use cases
- Monolithic configuration

**Bundle Characteristics**:
- One deployable carries the full feature set and its resource costs together
- Memory and startup costs are coupled to the monolith rather than to a selected slice
- All features are always loaded

### V6 Deployment Options

**Selective Deployment**:
- **Runtime Only**: `@a5c-ai/agent-runtime` for embedded use
- **Platform Core**: Add `@a5c-ai/agent-platform` for plugin hosting
- **Complete Solution**: Add `@a5c-ai/babysitter-agent` for full orchestration

**Bundle Characteristics**:
- Runtime, platform, and complete deployments can be measured independently once slice-specific commands exist
- Complete deployments are composed as needed
- Selective imports can reduce shipped code for narrower deployments, but the amount must be proven per slice

## Functional Capability Comparison

### Current Capabilities

**Integrated Features**:
- ✅ Pi wrapper integration
- ✅ Governance and policy system
- ✅ Session management and continuity
- ✅ MCP integration
- ✅ Cost tracking and monitoring
- ✅ Daemon infrastructure
- ✅ Observability features

**Limitations**:
- ❌ Cannot use subset of features
- ❌ Cannot extend with custom functionality
- ❌ Cannot replace built-in implementations
- ❌ Large resource footprint for simple use cases

### V6 Capabilities

**Layered Features**:
- ✅ All current functionality maintained
- ✅ Selective functionality composition
- ✅ Plugin-based extensibility
- ✅ Custom implementation replacement
- ✅ Optimized resource usage
- ✅ Meta-plugin framework

**Enhancements**:
- ✅ Dynamic plugin loading
- ✅ Plugin marketplace support
- ✅ Network-distributed plugins
- ✅ Plugin dependency management
- ✅ Hook type extensions
- ✅ Context variable systems

## Performance Characteristics

This comparison is intentionally qualitative. Broad bundle, memory, and latency figures were removed from the normative architecture comparison until a benchmark harness and release gate exist for a concrete slice.

### Current Performance Profile

**Resource Usage**:
- Resource usage is measured at the monolith level rather than at a slice level
- Startup and tool overhead include the cost of loading the integrated feature set
- Fine-grained attribution is difficult because the deployment unit is broad

**Characteristics**:
- All functionality loaded regardless of use
- No selective optimization possible
- Fixed performance profile

### V6 Performance Profile

**Resource Usage**:
- Resource usage should be measured per deployment slice rather than inferred globally
- Runtime-only, platform, and complete deployments may each carry different baselines
- Any startup, memory, or overhead target requires a named benchmark command and fallback plan

**Characteristics**:
- Pay-for-what-you-use resource model
- Selective optimization opportunities
- Performance tuning per deployment pattern

## Development Experience Comparison

### Current Development

**Characteristics**:
- Single large codebase
- High blast radius for changes
- Difficult component isolation for testing
- Monolithic build and deployment

**Developer Impact**:
- Simple mental model (everything in one place)
- Difficult to work on isolated features
- Large-scale coordination required for changes
- Limited extensibility options

### V6 Development

**Characteristics**:
- Clear architectural layers and boundaries
- Isolated component development
- Focused testing and validation
- Incremental build and deployment

**Developer Impact**:
- More complex mental model initially
- Clear domain boundaries enable focused work
- Independent component evolution
- Extensive extensibility through plugins

## Extension and Customization

### Current Extension Model

**Limitations**:
- Fork-based customization
- No plugin system
- Hard-coded functionality
- Difficult to maintain custom variations

### V6 Extension Model

**Capabilities**:
- Plugin-based customization
- Meta-plugin framework for deep extensions built atop plugin and hook surfaces
- Hook type extensions
- Network-distributed functionality
- Plugin marketplace ecosystem
- Semantic versioning and dependency management

## System Integration Comparison

### Current Integration Patterns

**Agent-Mux Integration**: Direct integration with monolithic interface
**Hook Integration**: Via hooks-mux with limited extensibility
**MCP Integration**: Built-in MCP client functionality

### V6 Integration Patterns

**Agent-Mux Integration**: Layered integration with clear protocol boundaries
**Hook Integration**: Via hooks-mux with meta-plugin composition over concrete hook and plugin surfaces
**MCP Integration**: Plugin-based MCP integration with replaceable implementations

## Summary

The V6 architecture represents a fundamental shift from monolithic integration to layered plugin architecture, providing:

**Key Improvements**:
- **Selective Deployment**: Compose functionality based on actual needs
- **Extensibility**: Meta-plugin framework enables deep customization
- **Performance**: Resource optimization through selective loading
- **Development**: Clear boundaries enable focused development

**Trade-offs**:
- **Complexity**: More complex initial mental model
- **Coordination**: More components require interface coordination
- **Learning**: Plugin development requires understanding of plugin patterns

The V6 architecture is designed for organizations that need selective functionality, extensibility, and performance optimization, while the current architecture serves well for simple, all-inclusive deployment scenarios.

---

**Document Status**: Draft  
**Architecture Responsibility**: Architecture Team
