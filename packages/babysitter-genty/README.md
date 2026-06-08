# @a5c-ai/babysitter-genty

Babysitter orchestration provider for [genty](../genty) — bridges genty's framework-agnostic orchestration interfaces to the [`@a5c-ai/babysitter-sdk`](../babysitter-sdk) runtime.

## Install

```bash
npm install @a5c-ai/babysitter-genty @a5c-ai/babysitter-sdk
```

This package ships the built runtime in `dist/` and this README for npm publish-surface auditing.

## Usage

Importing the package auto-registers all providers into genty's global orchestration registry:

```ts
import "@a5c-ai/babysitter-genty";
```

Or register explicitly and access individual providers:

```ts
import {
  register,
  getGlobalRegistry,
  BabysitterOrchestrationProvider,
} from "@a5c-ai/babysitter-genty";

register();
```

The package implements genty's `OrchestrationRegistry` provider interfaces (orchestration, journal, governance, agents, session, processes) on top of the babysitter-sdk runtime.

## License

MIT © a5c-ai
