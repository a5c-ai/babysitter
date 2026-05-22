---
id: page:generators-tools
nodeKind: Page
title: "@v6/graph-tools"
slug: "generators/tools"
articlePath: "wiki/generators/tools/README.md"
documents: []
---
# @v6/graph-tools

Utility package for loading the v6 catalog graph, querying it from scripts or a CLI, and rendering deterministic generator templates.

## CLI

```bash
Push-Location graph/wiki/generators/tools; npm install; Pop-Location
node graph/wiki/generators/tools/src/cli.mjs stats --root graph
node graph/wiki/generators/tools/src/cli.mjs nodes --root graph --kind AgentProduct
node graph/wiki/generators/tools/src/cli.mjs get --root graph agent:a5c --json
node graph/wiki/generators/tools/src/cli.mjs edges --root graph agent:a5c --direction outgoing
node graph/wiki/generators/tools/src/cli.mjs render --root graph --template wiki/generators/templates/examples/layers.md.tmpl --kind Layer --stdout
```

## Library

```js
import { loadGraph, createQuery, renderTemplate } from "@v6/graph-tools";

const graph = await loadGraph({ rootDir: "." });
const query = createQuery(graph);
const layers = query.nodesByKind("Layer");
const markdown = renderTemplate("{{#each nodes}}- {{id}}\n{{/each}}", { nodes: layers });
```

## Generator specs

`generate` runs a YAML/JSON spec:

```yaml
id: stack-layers-example
query:
  kind: Layer
  sort: attributes.position
render:
  template: wiki/generators/templates/examples/layers.md.tmpl
output:
  path: wiki/generated/layers.md
```

Outputs are written with `\n` line endings and a sibling `.manifest.json` containing the input node ids and SHA-256 content hash.

