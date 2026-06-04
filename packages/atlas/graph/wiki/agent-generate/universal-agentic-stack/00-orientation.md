---
id: page:agent-generate-universal-agentic-stack-orientation
nodeKind: Page
title: "Universal Agentic Stack Orientation"
slug: "agent-generate/universal-agentic-stack/00-orientation"
articlePath: "wiki/agent-generate/universal-agentic-stack/00-orientation.md"
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
# Universal Agentic Stack Orientation

The stack is easiest to understand if you read it as four connected bands rather than 11 unrelated boxes.

## What a layer means here

A layer is not a branding category. It is a responsibility boundary.

The question is not "Does this product mention tools, memory, or agents?"

The question is "Which responsibility does this part of the system actually own?"

## The four bands

| Band | Layers | What it answers |
|---|---|---|
| Model supply | 1-3 | What model exists, who serves it, and how requests reach it. |
| Agent system | 4-6 | How the agent thinks, what runtime hosts it, and what platform or extension system surrounds it. |
| Operating boundary | 7-9 | Where the agent works, where actions execute, and what policy constrains them. |
| Surface | 10-11 | What actions are exposed and how humans or systems experience the result. |

## The three ownership modes

When you place a product in the stack, mark each layer one of three ways:

- Owned: the product directly implements the responsibility.
- Exposed: the product presents the layer to the user, but depends on another component behind it.
- Delegated: the layer exists, but is provided by the host environment or another system.

This is the fastest way to stop category inflation.

## Read top-down or bottom-up

- Read top-down when you start from the user experience and want to know what lower layers make it possible.
- Read bottom-up when you start from a model, provider, or runtime technology and want to know what larger product it can support.
- Read the middle first when you are evaluating an "agent framework" or "coding agent" claim. Most of those claims live mainly in Layers 4, 5, and 6.

## The five questions that keep the map honest

1. What is the model artifact itself?
2. Who serves it and through what protocol?
3. Where does the agent loop actually live?
4. Where do files, tools, and commands execute?
5. What surface exposes actions and results to people or downstream systems?

If two tools answer different questions, they belong to different layers even if marketing puts them under the same label.

## The most important split in the whole map

Layers 4, 5, and 6 are where people collapse too much:

- Layer 4 is the decision loop.
- Layer 5 is the runtime that hosts the loop.
- Layer 6 is the platform and extension surface around runtimes.

If you only remember one distinction from this section, remember that one.

## Common mistakes

- Treating a provider or gateway as if it were an agent core.
- Treating a runtime with tools as if it were the full platform.
- Treating installed skills or plugins as runtime details instead of platform concerns.
- Ignoring workspace, execution, and sandbox because they are less visible in demos.
- Assuming the UI layer explains the compute path. It usually does not.

## What to do next

- Open [`04-worked-examples.md`](./04-worked-examples.md) if you want concrete product shapes.
- Open [`05-common-confusions.md`](./05-common-confusions.md) if your team keeps using the same words for different layers.
- Open [`03-placement-checklist.md`](./03-placement-checklist.md) if you already have a real product to classify.
