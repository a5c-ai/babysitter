---
id: page:agent-generate-universal-agentic-stack-common-confusions
nodeKind: Page
title: "Common Confusions"
slug: "agent-generate/universal-agentic-stack/05-common-confusions"
articlePath: "wiki/agent-generate/universal-agentic-stack/05-common-confusions.md"
documents:
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
# Common Confusions

Most stack mistakes come from overloaded language, not from missing diagrams. This page untangles the terms that people reuse too loosely.

## "Tool" vs "runtime"

A tool is a callable capability.

A runtime is the host that discovers tools, invokes them, streams events, manages approvals, and keeps session state around them.

If you remove the runtime and the tool is still just a callable function or shell command, it was never the runtime.

## "Plugin or skill" vs "tool"

A tool is usually something the agent can invoke during execution.

A plugin or skill usually belongs to the extension system around the runtime and platform: install scope, manifests, discovery, lifecycle, configuration, launch behavior, and compatibility surface.

That is why plugins and skills map better to Layer 6 than Layer 5.

## "Gateway" vs "agent"

A gateway moves or normalizes traffic between the caller and the provider.

An agent decides what to do next.

If the product mostly routes requests, translates protocols, or multiplexes providers, it is probably living in Layers 2-3 rather than Layer 4.

## "Framework" vs "platform"

A framework usually gives you composition primitives.

A platform usually adds deployment, extension, operator workflows, identity, channels, and installation contracts around those primitives.

Many products contain both, but not in equal proportion.

## "Workspace" vs "execution"

Workspace is the materialized thing the agent operates on.

Execution is where the side effect actually runs.

A repo mounted into a container shows both layers clearly:

- the repo mount is Layer 7
- the container process that runs the command is Layer 8

## "Approval" vs "sandbox"

An approval prompt is not the whole sandbox.

The sandbox is the policy boundary that determines whether the side effect can happen, under what conditions, with what restrictions, and with what audit trail.

Approvals are often just one visible feature of Layer 9.

## "UI" vs "interaction"

The UI is how things are rendered.

Interaction is the action vocabulary exposed through that surface: commands, approvals, interrupts, resume controls, triggers, and actions.

Presentation is Layer 11. Interaction is Layer 10.

## "RAG" vs "workspace"

RAG is a retrieval pattern.

Workspace is the broader working context the agent reads or writes.

A vector index may be part of a workspace, but it does not replace the workspace layer.

## "This product does everything"

Usually it does not.

Usually it owns some layers, abstracts some layers, and delegates the rest. The right move is to record that split instead of rewarding marketing language with a broader classification than the product actually earns.
