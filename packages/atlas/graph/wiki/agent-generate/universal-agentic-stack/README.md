---
id: page:agent-generate-universal-agentic-stack
nodeKind: Page
title: "Universal Agentic Stack"
slug: "agent-generate/universal-agentic-stack"
articlePath: "wiki/agent-generate/universal-agentic-stack/README.md"
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
# Universal Agentic Stack

This section is the Atlas field guide to the 11-layer agentic stack. It is meant to answer practical questions such as:

- "What exactly does this product own?"
- "What is delegated to the host?"
- "Why does this polished tool still not count as a full agent platform?"
- "Where do plugins, tools, gateways, workspaces, approvals, and UI surfaces actually belong?"

Use it to place products, frameworks, runtimes, plugins, and interfaces in the right part of the system instead of flattening everything into one vague "agent" bucket.

## Start here

If you only read three pages, read them in this order:

1. [`00-orientation.md`](./00-orientation.md)
2. [`04-worked-examples.md`](./04-worked-examples.md)
3. [`03-placement-checklist.md`](./03-placement-checklist.md)

## Start with the page that matches your question

| Page | Best for |
|---|---|
| [`00-orientation.md`](./00-orientation.md) | Learning the layer groups and the basic reading model. |
| [`01-builder-fit.md`](./01-builder-fit.md) | Placing LangGraph, custom-agent builders, coding agents, and gateways correctly. |
| [`02-landscape-diagram.md`](./02-landscape-diagram.md) | Seeing the whole stack at once in one visual map. |
| [`03-placement-checklist.md`](./03-placement-checklist.md) | Classifying a real tool or product step by step. |
| [`04-worked-examples.md`](./04-worked-examples.md) | Seeing complete stack placements for common product shapes. |
| [`05-common-confusions.md`](./05-common-confusions.md) | Untangling the terms people mix up most often. |
| [`06-reading-paths.md`](./06-reading-paths.md) | Following a short reading path based on your role or goal. |
| [`07-comparison-matrix.md`](./07-comparison-matrix.md) | Comparing common product shapes against the full stack at a glance. |
| [`08-review-template.md`](./08-review-template.md) | Reusing the stack as a repeatable product-review format. |
| [`09-faq.md`](./09-faq.md) | Answering the most common stack questions directly. |
| [`layers.md`](./layers.md) | Reading the full layer-by-layer reference from the graph. |
| [`source-map.md`](./source-map.md) | Tracing every page claim back to the graph files that generated it. |

## What this section helps you do

- Separate the model itself from the provider that serves it and the transport that carries requests.
- Distinguish the agent core from the runtime around it and the platform above it.
- Place plugins, installed skills, subagents, tool servers, and extension systems in the right layer.
- Understand which layers a framework owns and which layers it delegates to an IDE, host app, CI runner, cloud platform, or user shell.

## The core habit

Do not ask "What is this product?" in the singular. Ask:

1. Which layers does it own?
2. Which layers does it expose?
3. Which layers does it delegate?

That framing is the difference between a fuzzy taxonomy and an actually useful system map.

## Fast takeaways

- Most confusion comes from mixing Layers 4, 5, and 6: core, runtime, and platform are related but not the same thing.
- Many real products span multiple adjacent layers, but very few span the whole stack cleanly.
- Workspace, execution, and sandbox are operational layers, not just implementation details.
- Presentation and interaction are separate from the compute path: a great UI does not tell you where the agent logic really lives.

## Good reading paths

- If you are evaluating a framework claim, start with [`01-builder-fit.md`](./01-builder-fit.md), then read [`04-worked-examples.md`](./04-worked-examples.md).
- If you are classifying a real product, jump to [`03-placement-checklist.md`](./03-placement-checklist.md), then confirm against [`layers.md`](./layers.md).
- If you keep mixing up plugins, tools, runtime, and platform, read [`05-common-confusions.md`](./05-common-confusions.md).
- If you want a one-screen comparison across product shapes, open [`07-comparison-matrix.md`](./07-comparison-matrix.md).
- If you want to review a specific product systematically, use [`08-review-template.md`](./08-review-template.md).
- If you want direct answers instead of a guided path, open [`09-faq.md`](./09-faq.md).
- If you want the shortest guided route for your role, open [`06-reading-paths.md`](./06-reading-paths.md).
