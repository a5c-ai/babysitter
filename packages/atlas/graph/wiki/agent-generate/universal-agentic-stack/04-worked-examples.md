---
id: page:agent-generate-universal-agentic-stack-worked-examples
nodeKind: Page
title: "Worked Examples"
slug: "agent-generate/universal-agentic-stack/04-worked-examples"
articlePath: "wiki/agent-generate/universal-agentic-stack/04-worked-examples.md"
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
# Worked Examples

This page shows how the stack works on real product shapes. The goal is not to produce one perfect label. The goal is to identify where the value is concentrated and which layers are delegated.

## Example 1: Bare model API

Think of a plain provider API call with no agent loop around it.

| Layer area | What exists |
|---|---|
| 1-3 | Strongly owned: model, provider, transport |
| 4-6 | Minimal or absent |
| 7-9 | Usually delegated to the caller |
| 10-11 | Often just an API response surface |

This is not an agent platform by itself. It is the lower part of the stack that an agent core can build on top of.

One-sentence placement:

`This product mainly owns Layers 1-3, delegates the agent system and operating boundary to the caller, and exposes a thin API surface.`

## Example 2: Model gateway

Think of a system that normalizes access to multiple providers.

| Layer area | What exists |
|---|---|
| 2-3 | Strongly owned: provider routing and transport compatibility |
| 4-6 | Often absent or thin |
| 7-9 | Usually delegated |
| 10-11 | May expose a dashboard or API |

The common mistake here is to confuse a gateway with an agent runtime. Routing requests is not the same thing as owning the loop.

One-sentence placement:

`This product mainly owns Layers 2-3, may expose a surface for routing or analytics, and usually delegates the agent loop, workspace, execution, and policy layers.`

## Example 3: Agent framework library

Think of a graph-based or loop-based builder that developers embed into their own app.

| Layer area | What exists |
|---|---|
| 4 | Strongly owned |
| 5 | Partly owned, depending on runtime features |
| 6 | Sometimes present, sometimes thin |
| 7-11 | Often delegated to the host application |

This is where many custom-agent builder products live. They are extremely important, but they usually do not own the full operating boundary or surface.

One-sentence placement:

`This product mainly owns Layers 4-5, may touch Layer 6, and usually delegates workspace, execution, sandbox, and presentation to the host application.`

## Example 4: Coding agent CLI

Think of a local coding agent that edits files, runs commands, asks for approvals, and streams output.

| Layer area | What exists |
|---|---|
| 4-6 | Usually strongly owned |
| 7-9 | Often strongly owned or explicitly mediated |
| 10-11 | Strongly owned through CLI or TUI |
| 1-3 | Delegated to chosen model/provider stack |

This is why coding agents feel like "complete products": they often span more of the stack than framework libraries do.

One-sentence placement:

`This product mainly owns Layers 4-11, while delegating model, provider, and transport choices to an external model stack.`

## Example 5: Hosted agent platform

Think of a service that hosts agents, gives them deployment surfaces, and exposes collaboration or observability around them.

| Layer area | What exists |
|---|---|
| 4-6 | Usually strongly owned |
| 7-9 | Often partly owned, partly abstracted behind hosted infrastructure |
| 10-11 | Strongly owned through dashboards, APIs, and workflows |
| 1-3 | Sometimes delegated to external providers, sometimes bundled |

The critical question is whether hosted execution and policy are real product layers or just hidden infrastructure. If the user can rely on them, they still belong on the map.

One-sentence placement:

`This product mainly owns Layers 4-11 and may either delegate or bundle Layers 1-3 depending on how model access is offered.`

## Example 6: IDE extension around an agent

Think of an IDE panel that exposes an agent but depends on another runtime under the hood.

| Layer area | What exists |
|---|---|
| 10-11 | Strongly owned by the extension |
| 7 | Sometimes partly owned through editor workspace integration |
| 4-9 | Often delegated to a local or remote agent runtime |

Do not over-credit the extension. A polished IDE surface can still be mostly a presentation and interaction layer over someone else's runtime and platform.

One-sentence placement:

`This product mainly owns Layers 10-11, may partly own workspace integration, and usually delegates most of the runtime and platform below it.`

## Quick pattern summary

| Product shape | Layers where value usually concentrates |
|---|---|
| Model API | 1-3 |
| Gateway | 2-3 |
| Framework library | 4-5 |
| Coding agent | 4-11, with 1-3 delegated |
| Hosted platform | 4-11, sometimes with 1-3 delegated |
| IDE extension | 10-11, sometimes 7 |

## How to use these examples

- Use them to get the first rough placement.
- Then use [`03-placement-checklist.md`](./03-placement-checklist.md) to refine the result.
- If you need a clean writeup format, continue to [`08-review-template.md`](./08-review-template.md).
- If the product does not fit neatly, record split ownership instead of forcing a single label.
