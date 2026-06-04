---
id: page:agent-generate-universal-agentic-stack-faq
nodeKind: Page
title: "FAQ"
slug: "agent-generate/universal-agentic-stack/09-faq"
articlePath: "wiki/agent-generate/universal-agentic-stack/09-faq.md"
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
# FAQ

## Why not just call everything an agent platform?

Because different products own different responsibilities. The stack is useful only if it preserves those boundaries instead of rewarding the broadest label.

## Can one product occupy multiple layers?

Yes. Most serious products occupy multiple adjacent layers. The mistake is not spanning multiple layers. The mistake is pretending to own layers that are actually delegated.

## What if one product bundles another?

Then record the bundle honestly. You can say the top-level product exposes a broader surface while delegating or embedding lower layers from another component.

## Is a plugin system part of runtime or platform?

Usually platform. A runtime invokes tools inside a running session. A platform defines installation, extension contracts, manifests, lifecycle, discovery, and ecosystem behavior around runtimes.

## Is a gateway part of the provider or transport?

Usually transport-adjacent, sometimes close to provider concerns. The key question is whether it serves models itself or mainly routes traffic to someone else who does.

## Is an approval prompt the sandbox?

No. The approval prompt is only one visible part of the policy boundary. The sandbox is the broader restriction and audit system around execution.

## What if a local model collapses model and provider?

Operationally they can collapse. Conceptually the stack still keeps them separate so you do not mix the model artifact with the serving boundary.

## Why separate interaction from presentation?

Because commands, approvals, and action vocabulary are not the same thing as layout, rendering, or transcript display. One is what you can do. The other is how it is shown.

## What should I do when the classification still feels fuzzy?

Use [`08-review-template.md`](./08-review-template.md), force yourself to write the one-sentence placement, and then verify disputed boundaries in [`layers.md`](./layers.md).
