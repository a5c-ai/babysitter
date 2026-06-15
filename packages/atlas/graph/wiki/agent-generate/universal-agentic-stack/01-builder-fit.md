---
id: page:agent-generate-universal-agentic-stack-builder-fit
nodeKind: Page
title: "Builder and Product Fit"
slug: "agent-generate/universal-agentic-stack/01-builder-fit"
articlePath: "wiki/agent-generate/universal-agentic-stack/01-builder-fit.md"
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
# Builder and Product Fit

This page is for the question people usually ask first: "Where does this framework or product fit?"

## The fast answer

Most builder products do not own one single layer. They usually concentrate value in one of these zones:

- Layers 2-3: model access and routing
- Layers 4-5: agent definition and runtime behavior
- Layer 6: extension, deployment, or ecosystem surface
- Layers 10-11: interaction and presentation around another runtime

The job is to identify the center of gravity, then record what is delegated.

## Typical placements

| Thing you are evaluating | Usually lives in | Why |
|---|---|---|
| Model gateway or inference SDK | Layers 2-3 | It serves or speaks to the model, but does not own the agent loop. |
| Agent framework or orchestration library | Layers 4-5 | It defines the agent loop and some runtime behavior. |
| Coding agent CLI | Layers 4-6, often with 7-11 around it | It usually owns core, runtime, platform, and some user-facing surface. |
| Plugin or skill system | Layer 6 | It is part of the platform and extension contract. |
| Local shell runner, container runner, CI job runner | Layer 8 | It is where actions execute. |
| Approval policy or filesystem/network restriction system | Layer 9 | It constrains execution. |
| Web app, IDE panel, TUI, API surface | Layers 10-11 | It defines actions and presentation. |

## Product-shape heuristics

| If the product mainly sells... | Start by checking... |
|---|---|
| better model access | Layers 2-3 |
| better agent authoring | Layers 4-5 |
| deployment, extension, or operator workflows | Layer 6 |
| safe execution | Layers 8-9 |
| better human workflow around an agent | Layers 10-11 |

## LangGraph and custom-agent builders

| Stack area | Where it fits | Examples |
|---|---|---|
| Agent-Core | Graph/state-machine authoring and model/tool routing | `StateGraph`, graph nodes/edges/state, `create_agent`, tool dispatch, terminal routing |
| Agent-Runtime | Host process, durable state, checkpointing, tools, interrupts, and streaming | checkpointer/store, thread state, human-in-the-loop gate, host tool registry |
| Agent-Platform | Deployed graph operation and ecosystem extension surfaces | LangGraph Platform, LangSmith deployment, `RemoteGraph`, installed plugins, installed skills, launch/config surfaces |

## Builder categories that look similar but are not

| Category | Main layer weight | Why people confuse it |
|---|---|---|
| Agent builder | 4-5 | It often demos through a UI, so people over-credit 10-11 |
| Hosted agent platform | 5-6, often 10-11 too | It wraps the builder in deployment and operational surfaces |
| IDE integration | 10-11, sometimes 7 | It feels central because it is visible, but it may delegate the actual runtime |
| Gateway or router | 2-3 | It sits in the middle of traffic, which makes it look more "agentic" than it is |

## Rules of thumb

- If the thing mainly decides the next step, it is probably Layer 4.
- If it mainly hosts state, tools, approvals, and streaming around that loop, it is probably Layer 5.
- If it mainly manages installed extensions, channels, marketplaces, and launch contracts, it is probably Layer 6.
- If a product depends on an IDE, shell, or cloud control plane for workspace or execution, those layers still exist even when they are delegated.
- If the product is strongest when embedded into someone else's app, it probably does not own Layers 7-11.
- If the product feels complete because it can edit files and run commands, inspect Layers 7-9 carefully rather than assuming the entire stack.

## What not to do

- Do not force one product into all 11 layers just because it offers a polished experience.
- Do not collapse runtime and platform into one bucket when extension systems matter.
- Do not classify "custom agent building" as presentation just because the first touchpoint is a visual editor.
- Do not confuse hosted operation with model ownership. A hosted platform may still delegate Layers 1-3.

## Next pages

- Read [`04-worked-examples.md`](./04-worked-examples.md) for concrete placements.
- Read [`05-common-confusions.md`](./05-common-confusions.md) if the terminology still feels slippery.
