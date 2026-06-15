---
id: page:agent-generate-universal-agentic-stack-comparison-matrix
nodeKind: Page
title: "Comparison Matrix"
slug: "agent-generate/universal-agentic-stack/07-comparison-matrix"
articlePath: "wiki/agent-generate/universal-agentic-stack/07-comparison-matrix.md"
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
# Comparison Matrix

This page compresses the handbook into one comparison surface. Use it when you want to compare product shapes quickly before reading the detail pages.

Legend:

- `strong` means the product shape usually owns that layer directly
- `partial` means it often owns part of the layer or exposes it through another host
- `delegated` means the layer usually exists outside the product

## Product-shape matrix

| Product shape | 1-3 Model supply | 4-6 Agent system | 7-9 Operating boundary | 10-11 Surface |
|---|---|---|---|---|
| Bare model API | strong | delegated | delegated | partial |
| Model gateway | strong in 2-3 | delegated | delegated | partial |
| Agent framework library | delegated | strong | delegated | delegated |
| Coding agent CLI | delegated or partial | strong | strong or partial | strong |
| Hosted agent platform | partial | strong | strong or partial | strong |
| IDE extension over an agent | delegated | delegated or partial | partial | strong |

## What the matrix is good for

- spotting over-claimed products quickly
- separating visible UI strength from deeper system ownership
- comparing two products that feel similar but own different parts of the stack

## What the matrix is not for

- final classification of a specific product
- edge cases where one product bundles another
- situations where deployment mode changes the layer boundary

For those cases, continue with [`03-placement-checklist.md`](./03-placement-checklist.md) and [`layers.md`](./layers.md).
