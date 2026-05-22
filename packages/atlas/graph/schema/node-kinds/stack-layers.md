# NodeKinds: `Layer`

`Layer` records the eleven top-level bands of the universal agentic stack.
The graph does not model nested layer nodes. Internal block-diagram boxes such as
scope, responsibilities, examples, and fit notes are attributes on each Layer.

## Layer

| Attribute | Type | Required? | Notes |
|---|---|---|---|
| `id` | `id` | yes | `layer:<position>-<slug>` |
| `displayName` | `string` | yes | Human layer name. |
| `position` | `int` | yes | Unique stack position, 1 through 11. |
| `path` | `enum<compute,surfacing>` | yes | Broad stack path. |
| `summary` | `string` | yes | Canonical layer definition. |
| `scope` | `markdown` | no | Boundary for what belongs in the layer. |
| `responsibilities` | `list<string>` | no | Internal boxes shown in landscape docs; not nested layers. |
| `examples` | `list<string>` | no | Human examples and common products/concepts. |
| `fitNotes` | `markdown` | no | Guidance for collapsed, omitted, or host-owned layers. |

## Modeling rule

Do not create nested Layer records for stack internals. If a concept needs to be
mapped inside a layer, model it as the appropriate concrete NodeKind
(`AgentCoreImpl`, `AgentRuntimeImpl`, `AgentPlatformImpl`, `Plugin`, `Skill`,
`ToolDescriptor`, `ModelTransportProtocol`, etc.) and connect it to the top-level
Layer through `realizes` or a more specific domain edge.