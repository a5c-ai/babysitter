---
id: page:agent-generate-universal-agentic-stack-review-template
nodeKind: Page
title: "Review Template"
slug: "agent-generate/universal-agentic-stack/08-review-template"
articlePath: "wiki/agent-generate/universal-agentic-stack/08-review-template.md"
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
# Review Template

Use this page when you want to review one real product against the stack in a consistent way.

## Minimal review format

### Product

- Name:
- Short description:

### One-sentence placement

`This product mainly owns Layers __-__, delegates __-__, and exposes __ through __.`

### Layer assessment

| Layer band | Owned | Exposed | Delegated | Notes |
|---|---|---|---|---|
| 1-3 Model supply |  |  |  |  |
| 4-6 Agent system |  |  |  |  |
| 7-9 Operating boundary |  |  |  |  |
| 10-11 Surface |  |  |  |  |

### Evidence questions

- What model or provider choices are visible?
- Where does the actual decision loop live?
- Where do tools, approvals, and state live?
- What extension or deployment surface exists?
- What workspace and execution environment are actually used?
- What policy boundary constrains side effects?
- What actions and presentation surfaces are visible to users?

### Common overclaim check

- Does the UI look broader than the underlying runtime ownership?
- Does a gateway or SDK get described as an agent?
- Does plugin installation get confused with tool invocation?
- Does hosted execution get mistaken for full model ownership?

## Short review example

`This product mainly owns Layers 4-6, delegates Layers 7-9 to the host environment, and exposes Layers 10-11 through a web UI and API.`

That sentence is usually enough to correct a vague "full-stack agent platform" claim.

## Good follow-up pages

- Use [`03-placement-checklist.md`](./03-placement-checklist.md) before filling this in.
- Use [`07-comparison-matrix.md`](./07-comparison-matrix.md) if you want a quick prior.
- Use [`layers.md`](./layers.md) when a specific boundary is disputed.
