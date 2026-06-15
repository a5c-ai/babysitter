---
id: page:views
nodeKind: Page
title: "Reusable Atlas Views"
slug: "views"
articlePath: "wiki/views/README.md"
documents:
  - "page:views-service-tower"
  - "page:views-agent-stack-tower"
  - "page:views-quality-tower"
  - "page:views-library-tower"
---
# Reusable Atlas Views

Reusable views are wiki-backed projections that render graph records with a named UI template instead of plain markdown alone.

The first supported template is the `service-tower` view learned from the a5c Service Tower static page. It keeps the original idea of a stacked isometric building, but makes the floors, rooms, service lines, and record links configurable from wiki frontmatter.

## Available examples

| Page | Projection |
|---|---|
| [`service-tower.md`](./service-tower.md) | A broad Atlas catalog tower across schema, stack, and operations records. |
| [`agent-stack-tower.md`](./agent-stack-tower.md) | A tower focused on the universal agentic stack and runtime implementations. |
| [`quality-tower.md`](./quality-tower.md) | A tower focused on claims, evidence, CI surfaces, workflows, and quality records. |
| [`library-tower.md`](./library-tower.md) | A tower focused on generated process-library assets. |

## Template contract

Add this frontmatter to a wiki page:

```yaml
reusableView:
  type: service-tower
  options:
    title: "My Tower"
    subtitle: "What this projection explains"
    floors:
      - id: "floor-id"
        label: "FLOOR LABEL"
        subtitle: "What the floor groups"
        rooms:
          - id: "room-id"
            label: "Room label"
            color: "#D4A84B"
            query:
              kind: "Workflow"
              cluster: "workflows"
              limit: 8
```

Rooms can query by `kind`, `cluster`, free-text `search`, or explicit `ids`. Each room becomes a graph-backed catalog chamber with record links and service-line summaries.
