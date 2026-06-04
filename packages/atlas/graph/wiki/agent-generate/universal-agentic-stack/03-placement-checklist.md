---
id: page:agent-generate-universal-agentic-stack-placement-checklist
nodeKind: Page
title: "Placement Checklist"
slug: "agent-generate/universal-agentic-stack/03-placement-checklist"
articlePath: "wiki/agent-generate/universal-agentic-stack/03-placement-checklist.md"
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
# Placement Checklist

Use this checklist when someone says "this tool is an agent platform" or "this framework does everything." It forces the classification into concrete responsibilities instead of labels.

## Step 1: Pin down the model side

- What model family or version is actually being used?
- Who serves it?
- What transport or protocol carries requests to it?

This covers Layers 1, 2, and 3.

## Step 2: Pin down the agent side

- Where is the actual decision loop or graph logic?
- Where do tools, approvals, interrupts, and session state live?
- Where do installed skills, plugins, channels, and extension contracts live?

This covers Layers 4, 5, and 6.

## Step 3: Pin down the operating boundary

- What workspace does the agent read and write?
- Where do shell commands, browser runs, or tool actions execute?
- What policy restricts files, network, secrets, or binaries?

This covers Layers 7, 8, and 9.

## Step 4: Pin down the surface

- What actions are exposed to users or systems?
- How are results rendered, streamed, or integrated?

This covers Layers 10 and 11.

## Step 5: Record what is delegated

Not every product owns every layer. Explicitly note when a layer is delegated to:

- an IDE
- a host application
- a CI runner
- a cloud control plane
- a user-managed shell or container

Delegated layers still exist. They just are not owned by the product you are classifying.

## Step 6: Write the placement in one sentence

Force yourself to write a short sentence with three parts:

1. main owned layers
2. main delegated layers
3. main exposed surface

If you cannot do that clearly, your classification is still too fuzzy.

## Minimal worksheet

| Layer band | Owned | Exposed | Delegated | Notes |
|---|---|---|---|---|
| 1-3 Model supply |  |  |  |  |
| 4-6 Agent system |  |  |  |  |
| 7-9 Operating boundary |  |  |  |  |
| 10-11 Surface |  |  |  |  |

Fill this before arguing about labels.

## Output format

When you finish, you should be able to say something like:

`This product mainly owns Layers 4-6, delegates 7-9 to the host environment, and exposes Layers 10-11 through a web UI and API.`

## Follow-up

- Use [`layers.md`](./layers.md) to verify disputed boundaries.
- Use [`04-worked-examples.md`](./04-worked-examples.md) if you want to compare your result to common product shapes.
