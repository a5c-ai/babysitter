# Agent-Mux Repository Integration

→ [Documentation Index](README.md) | Related: [V6 Vision](v6-vision.md) | [Package Specifications](package-specs.md)

## Integration Overview

As part of the V6 architecture refactoring, the agent-mux repository (`C:\work\agent-mux\`) will be unified into the babysitter monorepo. This integration consolidates the agent dispatch layer with the orchestration platform for improved cohesion and simplified maintenance.

## Agent-Mux Repository Structure

The agent-mux repository contains the following packages:

### Core Infrastructure
- **`@a5c-ai/agent-mux-core`** - Core types, client, and stream engine
- **`@a5c-ai/agent-mux-adapters`** - Harness adapters for various coding agents
- **`@a5c-ai/agent-mux-cli`** - Command-line interface
- **`@a5c-ai/agent-mux`** - Main SDK package ("Unified dispatch layer for local CLI-based AI coding agents")
- **`@a5c-ai/agent-mux-gateway`** - Gateway services

### User Interfaces
- **`@a5c-ai/agent-mux-ui`** - Core UI components
- **`@a5c-ai/agent-mux-webui`** - Web interface
- **`@a5c-ai/agent-mux-tui`** - Terminal user interface

### Platform-Specific Applications
- **`@a5c-ai/agent-mux-mobile-ios-app`** - iOS mobile application
- **`@a5c-ai/agent-mux-mobile-android-app`** - Android mobile application
- **`@a5c-ai/agent-mux-tv-androidtv-app`** - Android TV application
- **`@a5c-ai/agent-mux-tv-appletv-app`** - Apple TV application
- **`@a5c-ai/agent-mux-watch-watchos-app`** - watchOS application
- **`@a5c-ai/agent-mux-watch-wearos-app`** - Wear OS application

### Supporting Services
- **`@a5c-ai/agent-mux-observability`** - Monitoring and observability
- **`@a5c-ai/agent-mux-harness-mock`** - Testing and development mocks
- **`@a5c-ai/amux-proxy`** - Python proxy service

## Integration Strategy

### Package Migration Plan

**Phase 1: Core Infrastructure Integration**
- Migrate `agent-mux-core`, `agent-mux-adapters`, `agent-mux-cli`, and `agent-mux` packages
- Update `babysitter-agent` dependencies to use local agent-mux packages
- Maintain existing API compatibility during transition

**Phase 2: Service Layer Integration**  
- Integrate `agent-mux-gateway` and `agent-mux-observability`
- Consolidate monitoring and observability with babysitter observability systems
- Merge gateway functionality with babysitter service infrastructure

**Phase 3: UI and Application Integration**
- Migrate UI packages (`agent-mux-ui`, `agent-mux-webui`, `agent-mux-tui`)
- Integrate TUI with existing `@a5c-ai/babysitter-tui-plugins`
- Consolidate web interfaces with catalog and observer dashboard

**Phase 4: Platform Applications** 
- Migrate mobile and platform-specific applications
- Integrate with unified babysitter ecosystem
- Maintain platform-specific build and deployment processes

### Updated Package Hierarchy

```
Infrastructure Layer (Unified Dispatch/Mux)
├── @a5c-ai/agent-mux-core
├── @a5c-ai/agent-mux-adapters  
├── @a5c-ai/agent-mux-cli
├── @a5c-ai/agent-mux (main SDK)
├── @a5c-ai/agent-mux-gateway
├── @a5c-ai/hooks-mux (renamed from hooks-mux)
└── @a5c-ai/agent-plugins-mux (renamed from agent-plugins-mux)

Runtime Layer (Engine)
└── @a5c-ai/agent-runtime

Platform Layer (Persistence + Plugins)
├── @a5c-ai/agent-platform
└── @a5c-ai/agent-platform-meta-plugins

Orchestration Layer (Domain-Specific)
├── @a5c-ai/agent-platform-orchestration-plugin
├── @a5c-ai/babysitter-sdk (unchanged)
└── @a5c-ai/babysitter-agent (current renamed package target)

User Interface Layer
├── @a5c-ai/agent-mux-ui
├── @a5c-ai/agent-mux-webui
├── @a5c-ai/agent-mux-tui (integrated with babysitter-tui-plugins)
├── @a5c-ai/catalog (enhanced web interface)
└── @a5c-ai/observer-dashboard (enhanced observability)

Platform Applications
├── @a5c-ai/agent-mux-mobile-ios-app
├── @a5c-ai/agent-mux-mobile-android-app
├── @a5c-ai/agent-mux-tv-*-app (TV applications)
└── @a5c-ai/agent-mux-watch-*-app (watch applications)

Supporting Services
├── @a5c-ai/agent-mux-observability (integrated with babysitter observability)
├── @a5c-ai/agent-mux-harness-mock
└── @a5c-ai/amux-proxy
```

## Integration Dependencies

### Repository Structure Updates

**Workspace Configuration**: Update root `package.json` to include all agent-mux packages in workspace configuration

**Build System Alignment**: Harmonize TypeScript, ESLint, and build configurations between repositories

**Version Synchronization**: Establish unified versioning strategy across all packages

### API Compatibility

**Backward Compatibility**: Maintain existing agent-mux API surface during transition period

**Deprecation Strategy**: Provide clear migration path for external consumers of agent-mux packages

**Protocol Alignment**: Ensure agent-mux protocols align with babysitter orchestration patterns

### Testing Integration

**Test Suite Consolidation**: Integrate agent-mux test suites with babysitter testing infrastructure → [Testing Framework](testing-framework.md)

**E2E Testing**: Establish comprehensive end-to-end testing across unified platform

**Mock and Harness Testing**: Integrate `agent-mux-harness-mock` with babysitter testing tools

## Architecture Impact

### Enhanced Capabilities

**Unified Agent Dispatch**: Consolidated agent multiplexing and orchestration in single repository

**Improved UI/UX**: Comprehensive user interface options from command-line to mobile applications

**Enhanced Observability**: Integrated monitoring across agent dispatch and orchestration layers

### Simplified Maintenance

**Single Repository**: Reduced complexity of cross-repository dependencies and version coordination

**Unified Development**: Streamlined development workflow with all components in single monorepo

**Consistent Release Process**: Single release pipeline for entire agent platform ecosystem

---

**Related Documents**: [V6 Vision](v6-vision.md) | [Package Specifications](package-specs.md) | [Implementation Roadmap](implementation/)
