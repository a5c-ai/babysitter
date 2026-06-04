# Phase 6: Roadmap

Milestone plan M0-M5 synthesizing effort recalibration, dependency graph, critical path, and parallel tracks into an actionable execution sequence.

---

## M0: Quick Wins and Foundation
**Theme:** Unblock the maximum downstream work with minimum effort.
**Objective:** Ship 11 quick wins, resolve the UX respec blocker, and start all track foundations.
**Dependencies:** None -- all M0 items have no unresolved upstream blockers.
**Total effort:** ~11 S + 1 respec session = ~3 M equivalent

### M0a: Critical Quick Wins (start immediately)
| Gap ID | Title | Remaining | Track |
|--------|-------|-----------|-------|
| GAP-SUBOBS-001 | Streaming Output Capture from Invoked Harnesses | S | Track 1 |
| GAP-PERF-001 | Prompt Caching (Ephemeral) | S | Track 4 |

### M0b: High-Priority Quick Wins (start immediately, parallel)
| Gap ID | Title | Remaining | Track |
|--------|-------|-----------|-------|
| GAP-HADAPT-003 | Cost-Based Routing Policies | S | Track 8 |
| GAP-MCPC-003 | Channel Permission Relay | S | Track 8 |
| GAP-OBS-NEW-001 | Webhook and Alert System | S | Track 8 |
| GAP-PROMPT-010 | Safety and Reversibility Framework | S | Track 8 |
| GAP-STATE-001 | Long-Term Memory Extraction | S | Track 5 |
| GAP-ECO-003 | Plugin Trust, Provenance, Blocklist | S | Track 2 |
| GAP-SEC-002 | Trust Classes for Plugins | S | Track 2 |
| GAP-JSON-004 | JSON Session Management API | S | Track 3 |
| GAP-AGENT-001 | Sub-Harness Invocation with Isolation | S | Track 1 |
| GAP-AGENT-006 | Cross-Run State Sharing | S | Track 1 |

### M0c: Respec and Track Foundations
| Gap ID | Title | Action |
|--------|-------|--------|
| GAP-UX-001 | Rendering Foundation | Respec to target tula-ui/observer-dashboard |
| GAP-PROMPT-004 | Prompt Inspection Tooling (S) | Start Track 4 foundation |
| GAP-PROMPT-006 | Instructions Loaded Hook (S) | Start Track 4 foundation |
| GAP-REMOTE-007 | Host Contract Layer (M) | Start Track 3 foundation |
| GAP-PROC-001 | Process Chaining and Pipelines (M) | Start Track 5 foundation |

**Key deliverables:**
- CLI harness streaming works for all invocations
- Prompt caching active across adapters
- Memory injection into prompts
- Plugin trust and blocklist operational
- Channel-based breakpoint approval works
- UX-001 respecified with clear rendering target
- All 8 track foundations initiated

---

## M1: Critical Path Items
**Theme:** Advance the critical path chain (SUBOBS-001 -> SUBOBS-002 -> PAR-001 -> PAR-003 -> AGENT-003).
**Objective:** Enable concurrent execution and progress tracking -- the backbone of the orchestration engine.
**Dependencies:** M0 (SUBOBS-001, AGENT-001 completed)
**Total effort:** ~2 S + 4 M + 1 L = ~L-XL equivalent

### M1a: Subagent Observability (depends on M0: SUBOBS-001)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-SUBOBS-002 | Subagent Progress Tracking | S |
| GAP-SUBOBS-004 | Subagent Health and Timeout Monitoring | S |
| GAP-PERF-004 | Streaming Message Rendering | M |

### M1b: Parallelization Core (can start in parallel with M1a)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-PAR-001 | Concurrent Effect Execution | M |
| GAP-ROUTE-002 | Effect Priority and Scheduling | S |

### M1c: Coordinator Pattern (depends on M1a + M1b)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-PAR-003 | Multi-Harness Parallel Dispatch | L |

### M1d: Session Compaction (depends on M0: PROMPT-006)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-PERF-002 | Session Compaction | M |

**Key deliverables:**
- Subagent progress with percentage and ETA
- Concurrent effect execution in orchestration loop
- Multi-harness parallel dispatch with team coordination
- Session compaction with multiple strategies

---

## M2: Parallel Track Items
**Theme:** Advance independent streams that do not require critical path items.
**Objective:** Make progress across ecosystem, remote, prompt, and tooling tracks simultaneously.
**Dependencies:** M0 (track foundations started). Each sub-group has its own internal dependencies.
**Total effort:** ~8 S + 5 M + 2 L = ~XL equivalent

### M2a: Ecosystem Track (depends on M0: ECO-003)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-ECO-002 | CC Marketplace Protocol Support | L |
| GAP-ECO-004 | Plugin Auto-Update and Versioning | S |
| GAP-ECO-005 | Plugin Validation and Diagnostics | S |
| GAP-USER-017 | Plugin Management Integration | S |

### M2b: Remote Track (depends on M0: REMOTE-007)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-REMOTE-003 | Remote Sessions (WebSocket) | M |

### M2c: Prompt and Observability Track (depends on M0: PROMPT-004, PERF-001)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-OBS-003 | Prompt Plan Observability | S |
| GAP-OBS-005 | Context Introspection | S |
| GAP-HADAPT-005 | Harness Health Monitoring | S |
| GAP-ROUTE-003 | Effect Result Caching | S |

### M2d: Process Track (depends on M0: PROC-001)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-PROC-003 | Process Versioning and Migration | L |
| GAP-AGENT-004 | Built-in Process Templates | S |
| GAP-PROF-001 | Auto-Configure from User Profile | S |

### M2e: Independent Tooling
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-TOOLS-026 | Structured User Interaction | S |
| GAP-TOOLS-031 | MCP Resource Browsing | S |
| GAP-UX-011 | Command Discoverability | S |
| GAP-TOOLS-028 | Sleep/Delay Effect Enhancement | S |

**Key deliverables:**
- CC marketplace protocol operational
- Plugin auto-update and validation working
- Remote sessions with WebSocket transport
- Prompt inspection and context introspection commands
- Process versioning system
- Built-in process templates packaged

---

## M3: Integration Milestones
**Theme:** Wire cross-track dependencies together. Items that need outputs from multiple prior milestones.
**Objective:** Complete the cross-cutting integrations that span Track 1 + Track 2, Track 1 + Track 5, etc.
**Dependencies:** M1 + M2 (multiple tracks must have progressed)
**Total effort:** ~3 S + 4 M + 3 L = ~XL equivalent

### M3a: Agent Delegation (depends on M1c: PAR-003 and M1a: SUBOBS-002)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-AGENT-003 | Process Orchestration with Effect Routing | L |
| GAP-AGENT-005 | Cross-Run Communication | L |

### M3b: Parallelization Extensions (depends on M1b: PAR-001)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-PAR-005 | Parallel File Operations | M |
| GAP-PAR-006 | Streaming Parallelism | M |
| GAP-PERF-007 | Aggressive Parallelism | M |
| GAP-TOOLS-017 | Git Worktree Isolation | L |

### M3c: Ecosystem Integration (depends on M2a: ECO-002)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-ECO-001 | CC Plugin Compatibility Layer | M |
| GAP-OBS-006 | Analytics and Feature Flags | M |

### M3d: Observability and Summarization
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-OBS-008 | Agent Progress Summarization | M |
| GAP-OBS-007 | Audit Export | M |

### M3e: Prompt Compression (depends on M1d: PERF-002)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-PROMPT-007 | Context Compression Families | L |

**Key deliverables:**
- Process orchestration with dynamic harness routing
- Cross-run message passing
- Git worktree isolation for parallel code tasks
- CC plugin compatibility fully working
- Analytics pipeline with configurable sinks
- Context compression with semantic families

---

## M4: Polish and UX
**Theme:** User experience, interaction patterns, and respecified rendering components.
**Objective:** Ship rich UX on the rendering target decided in M0 respec. Finalize interaction patterns.
**Dependencies:** M0 (UX-001 respecified), M1 (SUBOBS-001/002 for progress data), M3 (OBS-008 for triage)
**Total effort:** ~2 S + 5 M + 3 L = ~XL equivalent

### M4a: Rendering Foundation (after UX-001 respec in M0)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-UX-001 | Rendering Foundation (respecified) | L |
| GAP-UX-001e | Progress and Status Line | S |
| GAP-UX-001c | Permission/Breakpoint Approval UI | S |

### M4b: Visualization Components (depends on M4a: UX-001)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-UX-001a | Effect Tree Visualization | M |
| GAP-UX-001b | Structured Diff Rendering | M |
| GAP-UX-001d | Message Type Rendering | L |
| GAP-UX-001f | Streaming Output Panels | L |

### M4c: Interaction and Views (can proceed alongside M4b)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-UX-008 | Resume Dashboard | S |
| GAP-UX-009 | Failure Triage View | S |
| GAP-UX-010 | Typed Effect Interaction Patterns | M |
| GAP-TOOLS-023 | Multi-Step Workflow Composition | L |

### M4d: Subagent Dashboard (depends on M4a + M1a)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-SUBOBS-005 | Dashboard Subagent Drill-Down (respecified) | L |

**Key deliverables:**
- tula-ui rendering foundation operational
- Effect tree, diff, and streaming panels
- Progress and status indicators
- Resume dashboard with run picker
- Failure triage with root cause analysis
- ctx.workflow() intrinsic for multi-step composition

---

## M5: Ecosystem and Long-Tail
**Theme:** Specialized capabilities, long-chain dependencies, and stretch goals.
**Objective:** Complete the backlog with security, advanced lifecycle, and remaining tooling.
**Dependencies:** Various from M2-M4
**Total effort:** ~1 S + 3 M + 5 L = ~XL-XXL equivalent

### M5a: Security and Auth (depends on M2: partial)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-TOOLS-032 | MCP Authentication | L |
| GAP-SEC-006 | OAuth Integration | L |
| GAP-SEC-007 | Privacy Settings | M |

### M5b: Advanced Run Lifecycle (depends on M2d: PROC-003)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-STATE-006 | Session Rewind and History | L |
| GAP-RUN-003 | Run Forking and Branching | L |
| GAP-STATE-002 | Memory Consolidation | L |

### M5c: Advanced Patterns (depends on M3: various)
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-PAR-010 | Fork-Join Process Pattern | L |
| GAP-SESSION-003 | Session Templates and Presets | M |
| GAP-SESSION-005 | Session Sharing and Collaboration | L |

### M5d: Remaining Tooling and Observability
| Gap ID | Title | Remaining |
|--------|-------|-----------|
| GAP-TOOLS-012 | LSP Integration | L |
| GAP-TOOLS-029 | Structured Output Tool | M |
| GAP-TOOLS-037 | Fetch Content Processing | M |
| GAP-BRK-003 | Breakpoint Analytics and SLA | S |
| GAP-TOOLS-007 | JS/TS REPL Tool | S |
| GAP-RUN-001 | Run Comparison and Diffing | M |
| GAP-RUN-002 | Run Archival and Restore | M |

**Key deliverables:**
- Full OAuth and MCP authentication
- Privacy settings with PII filtering
- Session rewind and run forking
- Fork-join process pattern
- Session templates and collaboration
- LSP integration for code-aware routing
- Complete backlog closure

---

## Milestone Summary Table

| Milestone | Theme | Gap Count | Effort Estimate | Key Metric |
|-----------|-------|-----------|-----------------|------------|
| M0 | Quick wins + foundation | 16 + respec | ~3 M | Unblocks 50+ downstream gaps |
| M1 | Critical path | 7 | ~L-XL | Concurrent execution works |
| M2 | Parallel tracks | 16 | ~XL | 5 independent streams progress |
| M3 | Integration | 11 | ~XL | Cross-track features work |
| M4 | Polish and UX | 12 | ~XL | Rich rendering and interaction |
| M5 | Ecosystem + long-tail | 16 | ~XL-XXL | Backlog closed |
| **Total** | | **78** | | **All non-CLOSED gaps addressed** |
