# MCP Apps - Processes Backlog

Future process ideas for the MCP Apps sub-specialization. Each process should be implemented following the Babysitter SDK patterns with `defineTask`, `ctx.breakpoint()`, `ctx.parallel.all()`, and quality-gated convergence loops.

## Implementation Guidelines

Each process should be implemented following the Babysitter SDK patterns:
- **Process file**: `[process-name].js` in the specialization directory
- **JSDoc required**: `@process`, `@description`, `@inputs`, `@outputs`
- **Export pattern**: `export async function process(inputs, ctx) { ... }`
- **Task definitions**: Use `defineTask` from `@a5c-ai/babysitter-sdk`
- **Breakpoints**: Use `ctx.breakpoint()` for human approval gates
- **Parallel execution**: Use `ctx.parallel.all()` for independent tasks
- **Reference-code-first**: All MCP Apps processes should begin with cloning the SDK repo at the published version

---

## Process Categories

### Performance and Optimization

#### 1. MCP App Performance Optimization
**Description**: Analyze and optimize an existing MCP App for bundle size, load time, rendering performance, and memory usage within the sandboxed iframe constraints.

**Key Activities**:
- Analyze current bundle size and identify large dependencies
- Audit Vite build configuration for tree-shaking and code splitting opportunities
- Profile rendering performance (initial paint, interaction responsiveness)
- Optimize asset inlining strategy (compress images, subset fonts)
- Implement lazy initialization patterns where applicable
- Benchmark before/after with basic-host
- Document optimization decisions and trade-offs

**Estimated Complexity**: Medium

---

#### 2. MCP App Streaming Patterns (Real-Time Dashboards)
**Description**: Implement real-time data streaming patterns for MCP Apps that need continuously updating UIs (dashboards, monitors, logs).

**Key Activities**:
- Design polling architecture using app-only tools (visibility: ['app'])
- Implement `ontoolinputpartial` for streaming partial input during tool execution
- Create efficient DOM update strategies to minimize reflows
- Implement visibility-based pause (stop polling when iframe is hidden)
- Handle connection interruption and recovery
- Add rate limiting to prevent excessive server calls
- Test with basic-host under sustained data flow

**Estimated Complexity**: High

---

### Quality and Compliance

#### 3. MCP App Accessibility Audit
**Description**: Audit and remediate accessibility issues in MCP Apps, accounting for the unique constraints of sandboxed iframe rendering within AI chat hosts.

**Key Activities**:
- Audit keyboard navigation within the iframe
- Verify screen reader compatibility for dynamic content updates
- Check color contrast against host theme variables (both light and dark themes)
- Test focus management across host-app boundary
- Verify ARIA labels and roles for interactive elements
- Ensure safe area insets are respected
- Document accessibility limitations inherent to sandboxed iframe model
- Create accessibility testing checklist specific to MCP Apps

**Estimated Complexity**: Medium

---

#### 4. MCP App Testing Automation
**Description**: Set up automated testing infrastructure for MCP Apps covering unit tests, integration tests with basic-host, and visual regression testing.

**Key Activities**:
- Set up Vitest for unit testing App handlers and data transformations
- Create mock `PostMessageTransport` for testing without a real host
- Implement integration tests that launch basic-host and verify end-to-end flow
- Add visual regression testing for UI rendering across host themes
- Create test fixtures for `ontoolinput`/`ontoolresult` payloads
- Implement CSP validation tests (verify all declared origins)
- Set up CI pipeline for automated test execution
- Document testing patterns for MCP App developers

**Estimated Complexity**: High

---

### Architecture Patterns

#### 5. MCP App Multi-View Architecture
**Description**: Design and implement MCP Apps with multiple distinct views served from a single resource, where different tools reference the same resource URI but provide different data.

**Key Activities**:
- Design resource URI scheme for multi-view apps
- Implement view routing based on `ontoolinput` arguments
- Create shared component library across views
- Handle view transitions and state management
- Implement graceful degradation per-view
- Test each view independently with basic-host
- Document multi-view architectural decisions

**Estimated Complexity**: High

---

#### 6. MCP App State Persistence Patterns
**Description**: Implement state persistence patterns for MCP Apps that need to maintain state across tool invocations, working around the sandboxed iframe's lack of localStorage/sessionStorage.

**Key Activities**:
- Design server-side state management via app-only tools
- Implement `updateModelContext()` for persisting state in the conversation
- Create state serialization/deserialization patterns
- Handle state migration between app versions
- Implement optimistic UI updates with server confirmation
- Test state persistence across multiple tool invocations
- Document pattern trade-offs (server-side vs model context vs tool arguments)

**Estimated Complexity**: Medium

---

#### 7. MCP App Authorization Patterns
**Description**: Implement authentication and authorization flows for MCP Apps that need to access protected APIs, handling the constraints of sandboxed iframes and CSP.

**Key Activities**:
- Design OAuth 2.0 / API key flow compatible with sandboxed iframe
- Implement token exchange via `callServerTool()` (server-side token management)
- Configure CSP for authorization endpoints
- Handle token refresh and expiration
- Implement secure credential storage on the server side
- Create user consent flows via breakpoints
- Test authorization flow end-to-end
- Document security considerations and threat model

**Estimated Complexity**: High

---

#### 8. MCP App Binary Resource Handling
**Description**: Implement patterns for MCP Apps that need to handle binary resources (images, PDFs, audio, video) within the sandboxed iframe constraints.

**Key Activities**:
- Design binary data flow (server-side processing vs base64 inline vs blob URL)
- Implement large binary chunking via app-only tools
- Configure CSP for any CDN or storage origins
- Handle progressive loading for large binaries
- Implement download/export patterns (within iframe constraints)
- Test with various binary types and sizes
- Document size limits and performance characteristics

**Estimated Complexity**: Medium

---

## Implementation Priority

### Phase 1: Foundation (High Priority)
1. MCP App Testing Automation
2. MCP App Performance Optimization

### Phase 2: Advanced Patterns (Medium Priority)
3. MCP App Streaming Patterns
4. MCP App State Persistence Patterns
5. MCP App Multi-View Architecture

### Phase 3: Specialized (Lower Priority)
6. MCP App Accessibility Audit
7. MCP App Authorization Patterns
8. MCP App Binary Resource Handling

---

## Common Breakpoints (Human Approval Gates)

- Architecture decision review (multi-view routing, state persistence strategy)
- CSP audit review (any process touching external origins)
- Performance optimization trade-off approval
- Authorization flow security review
- Accessibility remediation prioritization

## Parallel Execution Opportunities

- Unit test execution + integration test execution
- Performance profiling + bundle analysis
- Light theme testing + dark theme testing
- Multiple binary format testing

---

**Created**: 2026-04-04
**Version**: 1.0.0
**Status**: Processes Identified
**Next Step**: Implement process JavaScript files
