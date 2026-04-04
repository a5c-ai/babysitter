# MCP Apps - Skills and Agents Backlog

Future skills and agents ideas for the MCP Apps sub-specialization beyond the initial set already implemented.

## Overview

- **Existing Skills**: 6 (mcp-app-scaffolding, mcp-csp-investigation, mcp-tool-resource-pattern, mcp-host-styling-integration, mcp-app-verification, single-file-bundling)
- **Existing Agents**: 4 (mcp-app-architect, mcp-ui-developer, mcp-migration-specialist, csp-security-auditor)
- **Backlog Skills**: 12
- **Backlog Agents**: 6

---

## Skills Backlog

### Performance and Build Skills

| ID | Skill Name | Description | Target Processes | Priority |
|----|------------|-------------|------------------|----------|
| S-MCP-001 | mcp-bundle-analyzer | Analyze Vite single-file bundle composition, identify large dependencies, suggest tree-shaking and compression improvements | mcp-app-performance-optimization | High |
| S-MCP-002 | mcp-asset-optimizer | Optimize inlined assets (compress images to WebP/AVIF base64, subset web fonts to used glyphs, minify SVGs) for smaller bundle size | mcp-app-performance-optimization | Medium |
| S-MCP-003 | mcp-lazy-init-pattern | Implement lazy initialization patterns for MCP Apps -- defer heavy component rendering until `ontoolinput` fires | mcp-app-performance-optimization, create-mcp-app | Medium |

### Streaming and Real-Time Skills

| ID | Skill Name | Description | Target Processes | Priority |
|----|------------|-------------|------------------|----------|
| S-MCP-004 | mcp-polling-architecture | Design and implement app-only tool polling with visibility-based pause, configurable intervals, and error recovery | mcp-app-streaming-patterns | High |
| S-MCP-005 | mcp-partial-input-handler | Implement `ontoolinputpartial` for progressive UI rendering during long-running tool execution | mcp-app-streaming-patterns, create-mcp-app | Medium |

### Testing Skills

| ID | Skill Name | Description | Target Processes | Priority |
|----|------------|-------------|------------------|----------|
| S-MCP-006 | mcp-mock-transport | Create mock `PostMessageTransport` for unit testing App handlers without a real host environment | mcp-app-testing-automation | High |
| S-MCP-007 | mcp-basic-host-integration-test | Set up integration test harness that programmatically launches basic-host and verifies end-to-end MCP App behavior | mcp-app-testing-automation | High |
| S-MCP-008 | mcp-visual-regression-test | Configure visual regression testing for MCP App UI across light/dark host themes | mcp-app-testing-automation | Medium |

### State and Authorization Skills

| ID | Skill Name | Description | Target Processes | Priority |
|----|------------|-------------|------------------|----------|
| S-MCP-009 | mcp-server-side-state | Implement server-side state management via app-only tools with optimistic UI updates | mcp-app-state-persistence | Medium |
| S-MCP-010 | mcp-model-context-state | Implement state persistence via `app.updateModelContext()` for conversation-scoped state | mcp-app-state-persistence | Medium |
| S-MCP-011 | mcp-oauth-flow | Implement OAuth 2.0 flow for MCP Apps using `callServerTool()` for token exchange, compatible with CSP constraints | mcp-app-authorization | Low |

### Accessibility Skills

| ID | Skill Name | Description | Target Processes | Priority |
|----|------------|-------------|------------------|----------|
| S-MCP-012 | mcp-a11y-audit | Automated accessibility audit for MCP Apps: keyboard navigation, screen reader compatibility, color contrast against host theme variables, focus management | mcp-app-accessibility-audit | Medium |

---

## Agents Backlog

### Performance Agents

| ID | Agent Name | Description | Target Processes | Priority |
|----|------------|-------------|------------------|----------|
| A-MCP-001 | mcp-performance-optimizer | Expert in MCP App bundle optimization, Vite configuration tuning, asset compression, and rendering performance within sandboxed iframe constraints | mcp-app-performance-optimization | High |

### Testing Agents

| ID | Agent Name | Description | Target Processes | Priority |
|----|------------|-------------|------------------|----------|
| A-MCP-002 | mcp-test-architect | Expert in MCP App testing strategies: mock transport design, basic-host integration testing, visual regression, CSP validation, and CI pipeline configuration | mcp-app-testing-automation | High |

### Streaming Agents

| ID | Agent Name | Description | Target Processes | Priority |
|----|------------|-------------|------------------|----------|
| A-MCP-003 | mcp-realtime-specialist | Expert in real-time MCP App patterns: app-only tool polling, ontoolinputpartial streaming, visibility-based pause, efficient DOM updates, and connection recovery | mcp-app-streaming-patterns | Medium |

### Accessibility Agents

| ID | Agent Name | Description | Target Processes | Priority |
|----|------------|-------------|------------------|----------|
| A-MCP-004 | mcp-accessibility-auditor | Expert in MCP App accessibility: iframe-specific constraints, host theme contrast, keyboard navigation within sandboxed context, ARIA patterns for dynamic content | mcp-app-accessibility-audit | Medium |

### Architecture Agents

| ID | Agent Name | Description | Target Processes | Priority |
|----|------------|-------------|------------------|----------|
| A-MCP-005 | mcp-state-architect | Expert in MCP App state management strategies: server-side state via app-only tools, model context persistence, optimistic updates, and state migration between app versions | mcp-app-state-persistence, mcp-app-multi-view | Medium |
| A-MCP-006 | mcp-auth-specialist | Expert in MCP App authorization: OAuth flows within CSP constraints, server-side token management via callServerTool, secure credential storage, and threat modeling for sandboxed iframe apps | mcp-app-authorization | Low |

---

## Shared Candidates (Cross-Specialization)

### Skills Shared with CLI/MCP Development

| ID | Skill Name | Shared With | Reason |
|----|------------|-------------|--------|
| S-MCP-006 | mcp-mock-transport | cli-mcp-development | MCP testing infrastructure |
| S-MCP-007 | mcp-basic-host-integration-test | cli-mcp-development | MCP server testing |

### Skills Shared with Web Development

| ID | Skill Name | Shared With | Reason |
|----|------------|-------------|--------|
| S-MCP-002 | mcp-asset-optimizer | web-development | Asset optimization techniques |
| S-MCP-012 | mcp-a11y-audit | web-development | Accessibility auditing |

### Skills Shared with Security/Compliance

| ID | Skill Name | Shared With | Reason |
|----|------------|-------------|--------|
| S-MCP-011 | mcp-oauth-flow | security-compliance | OAuth implementation patterns |

---

## Implementation Priority Matrix

### High Priority (Implement First)

**Skills**: S-MCP-001 (bundle-analyzer), S-MCP-004 (polling-architecture), S-MCP-006 (mock-transport), S-MCP-007 (basic-host-integration-test)

**Agents**: A-MCP-001 (performance-optimizer), A-MCP-002 (test-architect)

### Medium Priority (Implement Next)

**Skills**: S-MCP-002, S-MCP-003, S-MCP-005, S-MCP-008, S-MCP-009, S-MCP-010, S-MCP-012

**Agents**: A-MCP-003, A-MCP-004, A-MCP-005

### Low Priority (Implement As Needed)

**Skills**: S-MCP-011 (oauth-flow)

**Agents**: A-MCP-006 (auth-specialist)

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Backlog Skills** | 12 |
| **Backlog Agents** | 6 |
| **Shared Candidates (Skills)** | 5 |
| **High Priority Skills** | 4 |
| **High Priority Agents** | 2 |

---

**Created**: 2026-04-04
**Version**: 1.0.0
**Status**: Skills/Agents Identified
**Next Step**: Implement high-priority skills and agents
