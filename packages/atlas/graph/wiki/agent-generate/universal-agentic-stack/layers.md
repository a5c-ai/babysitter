---
id: page:agent-generate-universal-agentic-stack-layers
nodeKind: Page
title: "Universal Agentic Stack Layers"
slug: "agent-generate/universal-agentic-stack/layers"
articlePath: "wiki/agent-generate/universal-agentic-stack/layers.md"
documents:
  - "layer:1-model"
  - "layer:2-provider"
  - "layer:3-transport"
  - "layer:4-agent-core"
  - "layer:5-agent-runtime"
  - "layer:6-agent-platform"
  - "layer:7-workspace"
  - "layer:8-execution"
  - "layer:9-sandbox"
  - "layer:10-interaction"
  - "layer:11-presentation"
---
# Universal Agentic Stack Layers

Derived from `graph/stack-layers/layers`. There are no modeled nested layer nodes; responsibilities/examples/fit notes are attributes on each top-level layer.

## Quick navigation

| Layer | Best question to ask |
|---|---|
| 1 Model | What model artifact is this, independent of who serves it? |
| 2 Provider | Who serves it, with what quota, auth, and deployment posture? |
| 3 Transport | What protocol or client path actually carries requests? |
| 4 Agent-Core | Where does the decision loop or graph logic live? |
| 5 Agent-Runtime | What hosts tools, state, approvals, and streaming around that loop? |
| 6 Agent-Platform | What installs, extends, launches, and distributes the runtime? |
| 7 Workspace | What working context is materialized for the agent? |
| 8 Execution | Where do commands and side effects actually run? |
| 9 Sandbox | What policy boundary constrains those side effects? |
| 10 Interaction | What actions are exposed to users or systems? |
| 11 Presentation | How are those actions and results rendered? |

## How to read this page

- Use the `Scope` line to identify the core boundary.
- Use `Responsibilities` to see what belongs inside that boundary.
- Use `Fit note` to avoid the most common category mistake.
- If you are comparing product shapes, skim [`07-comparison-matrix.md`](./07-comparison-matrix.md) first and then return here.

## Layer 11: Presentation

The presentation layer renders agent work to humans or downstream systems:
terminal UI, CLI, web UI, IDE panel, API endpoint, JSON stream, structured
event log, or dashboard. Realized by `Presentation` instances such as TUI,
CLI, web, IDE, and API surfaces.

- Scope: Outermost rendering surface for humans or downstream systems.
- Responsibilities:
  - Render prompts, transcripts, plans, tool calls, approvals, and results.
  - Provide human-readable and machine-readable output modes.
  - Own layout, accessibility, theme, streaming display, and navigation affordances.
- Examples:
  - TUI, CLI, web app, IDE side panel, notebook/chat surface.
  - REST/WebSocket API, JSON stream, structured event log, dashboard.
  - LangGraph app UI, LangSmith trace view, custom workflow console.
- Not this:
  - the command vocabulary itself
  - the approval logic behind an interaction
- Fit note: Products can be headless and still fit the stack through an API or event
stream presentation. Presentation can be supplied by a host IDE/web app
rather than by the agent framework itself.
- Source: `graph/stack-layers/layers/layer-11-presentation.yaml`

## Layer 10: Interaction

The interaction layer contains the actions exposed through an agent
surface: slash commands, keybindings, prompt controls, editor widgets,
voice or multimodal triggers, review/approve/resume gates, collaborative
actions, operational triggers, and telemetry affordances. Realized by
`InteractionPrimitive` nodes and related trigger/command records.

- Scope: Atomic user-agent and agent-system actions exposed by a surface.
- Responsibilities:
  - Expose commands, controls, triggers, approvals, and resumable interrupts.
  - Translate human/system gestures into runtime or platform actions.
  - Surface task state, telemetry, collaboration, and handoff controls.
- Examples:
  - Slash commands, keybindings, prompt controls, approve/reject interrupt.
  - GitHub Action trigger, webhook trigger, editor widget, dashboard button.
  - LangGraph human-in-the-loop review, edit, approve, resume controls.
- Not this:
  - layout, theming, or transcript rendering
  - the runtime that carries out the action
- Fit note: Interaction primitives are not presentation widgets by themselves; they are
the action vocabulary that a TUI, CLI, web UI, IDE, API, or automation host
renders and invokes.
- Source: `graph/stack-layers/layers/layer-10-interaction.yaml`

## Layer 9: Sandbox

The sandbox layer constrains `Execution`: filesystem allow/deny lists,
network allow/deny lists, binary allow/deny lists, environment and secret
scope, audit-log policy, and policy evaluation point (pre-call,
continuous, or post-call attestation). Coarse posture is captured by
filesystemPolicy and networkPolicy enums. Realized by `Sandbox` nodes.

- Scope: Policy-enforcement perimeter around execution and side effects.
- Responsibilities:
  - Enforce filesystem, network, binary, secret, and environment policy.
  - Record audit evidence and policy decisions around side effects.
  - Define approval, escalation, and attestation boundaries for execution.
- Examples:
  - Read-only filesystem, workspace-write mode, network-disabled mode.
  - Binary allow list, secret scope, approval-required command policy.
  - Container, VM, OS sandbox, or hosted policy engine.
- Not this:
  - the shell or process runner itself
  - the human-facing approval UI by itself
- Fit note: Custom-agent frameworks may leave sandboxing entirely to the embedding
host. Production tools should model this layer explicitly even when users
only see a simple approval prompt.
- Source: `graph/stack-layers/layers/layer-9-sandbox.yaml`

## Layer 8: Execution

The execution layer hosts agent-driven tool calls and shell commands:
local process, Docker container, SSH remote, Kubernetes pod, cloud
function, direct host, or service-side executor. Execution posture includes
process lifecycle, signal propagation, resource limits, isolation, network
policy, filesystem access, GPU access, and concrete runtime substrate.
Realized by `Execution` nodes.

- Scope: Invocation environment for agent-driven tools, commands, and side effects.
- Responsibilities:
  - Start, stream, interrupt, and stop tool/shell/process execution.
  - Own process lifecycle, resource limits, environment variables, and mounts.
  - Route side effects to local, remote, container, or hosted executors.
- Examples:
  - Local shell, Docker, SSH remote, Kubernetes pod, GitHub Actions runner.
  - Browser automation worker, notebook/kernel executor, cloud function.
  - LangGraph tool node executing inside a host application runtime.
- Not this:
  - the repo or mounted files being operated on
  - the policy system that restricts execution
- Fit note: Frameworks often delegate execution to user-defined tools. Hosted agent
products may make this layer invisible but still need it for auditing and
policy mapping.
- Source: `graph/stack-layers/layers/layer-8-execution.yaml`

## Layer 7: Workspace

The workspace is the materialized working directory or project context the
agent operates against — a git worktree, clone, symlinked overlay,
IDE-managed project, mounted remote, or virtual ephemeral workspace.
Workspace posture includes materialization, storage backend, indexing,
git hooks, artifact scope, and multi-tenant policy. Realized by `Workspace` nodes.

- Scope: Materialized working context the agent reads, writes, indexes, and reasons over.
- Responsibilities:
  - Materialize project files, indexes, artifacts, and session-visible state.
  - Define git/worktree, mounting, overlay, and persistence behavior.
  - Bound what files, generated outputs, and caches belong to the agent task.
- Examples:
  - Local repository, remote clone, IDE project, container-mounted workspace.
  - Git worktree, generated artifact directory, vector/code index, cache scope.
  - LangGraph app state when backed by project files or persisted stores.
- Not this:
  - the process that runs the command
  - the UI surface that renders the result
- Fit note: Some products are read-only and omit this layer. Others delegate workspace
ownership to an IDE, CI runner, hosted environment, or user shell.
- Source: `graph/stack-layers/layers/layer-7-workspace.yaml`

## Layer 6: Agent-Platform

The platform wraps one or more `AgentRuntimeImpl`s with extension,
distribution, and operator concerns: installed plugins, installed skills,
native extension formats, subagents, tool servers, channel adapters,
launch/config registries, identity, marketplace, and update channels.
Realized by `AgentPlatformImpl` instances.

- Scope: Extension, distribution, launch, and ecosystem surface around runtimes.
- Responsibilities:
  - Load installed plugins, installed skills, commands, hooks, subagents, and tool servers.
  - Broker capability profiles, launch profiles, identity, marketplaces, and updates.
  - Bridge channels such as MCP, HTTP/SSE, A2A, chat, mailbox, and gateway adapters.
  - Publish the platform-specific extension contract and installation scopes.
- Examples:
  - Claude plugins/skills, Codex/Gemini/OpenCode extension packages, a5c plugins.
  - LangGraph Platform, LangSmith deployment, RemoteGraph, hosted graph operations.
  - Skill directories, plugin registries, marketplace manifests, MCP server configs.
- Not this:
  - a single tool invocation inside one running session
  - the inner decision loop itself
- Fit note: Installed plugins and skills belong explicitly in this layer. Products may
expose a platform without owning a model/provider, or may hide platform
services inside an IDE or hosted control plane. a5c platform is modeled as
a unified same-layer extension host, not a Pi wrapper.
- Source: `graph/stack-layers/layers/layer-6-agent-platform.yaml`

## Layer 5: Agent-Runtime

The runtime hosts an agent process around the core: built-in tools,
internal session state, tool registry, hook sockets, approval primitives,
subprocess execution posture, streaming, output guards, and runtime
identity. Realized by `AgentRuntimeImpl` instances.

- Scope: Host process and operational runtime for an agent core.
- Responsibilities:
  - Maintain internal session and transcript state.
  - Provide built-in tools, dynamic tool discovery, hooks, and approvals.
  - Manage subprocess/tool execution posture and streaming events.
  - Enforce runtime output, resume, and journal/event contracts.
- Examples:
  - LangGraph checkpointer/store, thread state, interrupts, streaming runtime.
  - Claude Code/Codex/Gemini CLI process runtimes.
  - a5c unified runtime, Pi-compatible session profiles, agent-mux remote runtime.
  - Built-in file/shell/search tools, approval gates, session files.
- Not this:
  - a package installer or marketplace
  - the trained model or provider endpoint
- Fit note: Frameworks can leave runtime to the host app; CLI products often combine
core and runtime in one binary. a5c runtime is modeled as a unified
same-layer implementation that can map Pi, Claude, Codex, LangGraph, and
agent-mux runtime profiles without depending on one of them.
- Source: `graph/stack-layers/layers/layer-5-agent-runtime.yaml`

## Layer 4: Agent-Core

The agent-core layer drives an inference turn or graph step end-to-end:
prompt/context assembly, state transition, tool dispatch, child-agent
handoff, message materialization, result synthesis, and stop detection.
Realized by `AgentCoreImpl` instances.

- Scope: Inner loop and graph/turn semantics for one agent brain.
- Responsibilities:
  - Define loop, graph, or state-machine iteration semantics.
  - Assemble prompt/context and normalize message/state materialization.
  - Dispatch tools/subagents and synthesize terminal results.
  - Detect stops, interrupts, graph terminal states, and budget exits.
- Examples:
  - LangGraph StateGraph, graph nodes/edges/state, create_agent routing.
  - Claude Code/Codex/Gemini CLI loop cores.
  - a5c unified core and Pi-compatible tool-use loop profiles.
  - Tool dispatch, stop detection, context-window handling, result envelopes.
- Not this:
  - the transport client that calls the provider
  - plugin installation or ecosystem distribution
- Fit note: This is where custom agent builders fit first. A product may expose only a
core library without owning runtime, platform, workspace, or presentation.
a5c's core is modeled as a unified same-layer contract, not as built on top
of Pi; Pi is a compatibility profile.
- Source: `graph/stack-layers/layers/layer-4-agent-core.yaml`

## Layer 3: Transport

The protocol and client path that carries inference requests from an
`AgentCoreImpl` to a `Provider`, plus optional proxies or gateways that
interpose between them. This layer is modeled as one top-level layer; wire
protocol, client library, and proxy behavior are responsibilities/examples,
not nested layer nodes.

- Scope: Wire and client path between agent core and provider.
- Responsibilities:
  - Encode request, response, streaming, tool-call, and error payloads.
  - Run the in-process client or adapter that speaks the provider protocol.
  - Optionally route through a proxy, gateway, recorder, or policy interposer.
- Examples:
  - OpenAI Responses, OpenAI Chat Completions, Anthropic Messages, Gemini GenerateContent.
  - HTTP, SSE, WebSocket, gRPC, OpenAI-compatible gateways.
  - LangChain chat-model adapters and transport clients.
- Not this:
  - the provider organization behind the endpoint
  - the graph or loop that decides what to send
- Fit note: Custom-agent frameworks often hide transport behind model abstractions.
Gateway products may occupy mostly this layer while delegating core/runtime
behavior upward.
- Source: `graph/stack-layers/layers/layer-3-transport.yaml`

## Layer 2: Provider

The hosted-inference vendor or self-hosted serving boundary that exposes a
`ModelVersion` over an endpoint. Provider posture covers auth scheme, rate
limits, regions, fine-tuning availability, and SLA — distinct from the wire
protocol (Layer 3) and the agent-side core that consumes it (Layer 4).

- Scope: Hosted or self-hosted serving boundary.
- Responsibilities:
  - Serve model versions through authenticated endpoints.
  - Own availability, regions, quotas, rate limits, billing, and deployment posture.
  - Publish provider-specific model and endpoint capabilities.
- Examples:
  - Anthropic, OpenAI, Google, Azure OpenAI, AWS Bedrock, OpenRouter.
  - Self-hosted vLLM, Ollama, llama.cpp, or custom inference gateway.
  - Auth scheme, region, quota, rate-limit, and SLA records.
- Not this:
  - the request protocol itself
  - the agent logic above the provider
- Fit note: LangChain/LangGraph apps usually choose providers through model adapters
rather than owning this layer. Gateways may specialize here while leaving
higher layers to another product.
- Source: `graph/stack-layers/layers/layer-2-provider.yaml`

## Layer 1: Model

The trained model artifact itself — weights, tokenizer, inference graph —
independent of any provider that serves it. Concrete realizations are
`ModelFamily` and `ModelVersion` nodes. Capability claims about token
limits, modalities, native tools, and reasoning posture are bound to
`ModelVersion`, not to providers or transports.

- Scope: Trained artifact and declared capability surface.
- Responsibilities:
  - Preserve model family/version identity.
  - Declare token, modality, reasoning, tool, and output-shape capabilities.
  - Separate model-native behavior from provider/runtime behavior.
- Examples:
  - Model family and version records.
  - Context window and output token limits.
  - Native tool-use, reasoning, vision, audio, and embedding support.
- Not this:
  - provider-specific quotas or deployment regions
  - runtime behavior around tool calls and approvals
- Fit note: Custom-agent apps may expose model choice directly or hide it behind a
provider/model configuration. Local inference collapses Model and Provider
operationally, but the graph keeps them separate.
- Source: `graph/stack-layers/layers/layer-1-model.yaml`
