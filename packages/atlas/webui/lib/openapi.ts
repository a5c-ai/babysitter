// OpenAPI 3.1 spec for the Atlas Catalog public REST API.
// Authoritative source — served as JSON at /api/v1/openapi.json
// and rendered as Swagger UI at /api/v1/docs.

export const openapiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Atlas Catalog API",
    version: "1.0.0",
    description:
      "Public read-only REST API over the Atlas catalog (NodeKinds, EdgeKinds, records, edges, clusters). Backed by the same in-memory index as the Atlas web UI.",
  },
  servers: [{ url: "/", description: "current host" }],
  tags: [
    { name: "explore", description: "Browse NodeKinds, EdgeKinds, clusters" },
    { name: "view", description: "Record detail and neighborhoods" },
    { name: "search", description: "Full-text search across the catalog" },
    { name: "spec", description: "OpenAPI document and docs UI" },
  ],
  paths: {
    "/api/v1/kinds": {
      get: {
        tags: ["explore"],
        summary: "List all NodeKinds",
        parameters: [
          {
            name: "cluster",
            in: "query",
            description: "Filter by cluster id",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Array of NodeKind summaries",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NodeKindList" },
              },
            },
          },
        },
      },
    },
    "/api/v1/kinds/{nodeKindId}": {
      get: {
        tags: ["explore"],
        summary: "NodeKind detail with paginated instance refs",
        parameters: [
          { name: "nodeKindId", in: "path", required: true, schema: { type: "string" } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50, maximum: 500 },
          },
          { name: "cursor", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "NodeKind detail",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NodeKindDetail" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/v1/edges": {
      get: {
        tags: ["explore"],
        summary: "List all EdgeKinds",
        responses: {
          "200": {
            description: "Array of EdgeKind summaries",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EdgeKindList" },
              },
            },
          },
        },
      },
    },
    "/api/v1/edges/{edgeKindId}": {
      get: {
        tags: ["explore"],
        summary: "EdgeKind detail with paginated wired pairs",
        parameters: [
          { name: "edgeKindId", in: "path", required: true, schema: { type: "string" } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50, maximum: 500 },
          },
          { name: "cursor", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "EdgeKind detail",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EdgeKindDetail" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/v1/clusters": {
      get: {
        tags: ["explore"],
        summary: "List all clusters with their NodeKind membership",
        responses: {
          "200": {
            description: "Array of cluster descriptors",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ClusterList" },
              },
            },
          },
        },
      },
    },
    "/api/v1/records/{id}": {
      get: {
        tags: ["view"],
        summary: "Full record by id, with incoming/outgoing edges",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          {
            name: "expand",
            in: "query",
            description:
              "Set to `neighbors` to inline the full record for each first-hop neighbor.",
            schema: { type: "string", enum: ["neighbors"] },
          },
        ],
        responses: {
          "200": {
            description: "Record detail",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecordDetail" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/v1/records/{id}/neighbors": {
      get: {
        tags: ["view"],
        summary: "BFS neighborhood around a record (graph viz friendly)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          {
            name: "depth",
            in: "query",
            schema: { type: "integer", default: 1, minimum: 1, maximum: 3 },
          },
          {
            name: "kinds",
            in: "query",
            description: "Comma-separated NodeKind names to include",
            schema: { type: "string" },
          },
          {
            name: "edges",
            in: "query",
            description: "Comma-separated EdgeKind names to include",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Subgraph",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Neighborhood" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/v1/search": {
      get: {
        tags: ["search"],
        summary: "Full-text search across records (Fuse.js)",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" } },
          { name: "kind", in: "query", schema: { type: "string" } },
          { name: "cluster", in: "query", schema: { type: "string" } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 25, maximum: 200 },
          },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: {
          "200": {
            description: "Ranked search hits",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SearchResult" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/api/v1/openapi.json": {
      get: {
        tags: ["spec"],
        summary: "Return this OpenAPI document",
        responses: {
          "200": {
            description: "OpenAPI 3.1 JSON",
            content: { "application/json": { schema: { type: "object" } } },
          },
        },
      },
    },
    "/api/v1/docs": {
      get: {
        tags: ["spec"],
        summary: "Swagger UI rendering of this spec",
        responses: { "200": { description: "HTML page" } },
      },
    },
  },
  components: {
    responses: {
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/Error" } },
        },
      },
      BadRequest: {
        description: "Invalid query",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/Error" } },
        },
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
            required: ["code", "message"],
          },
        },
        required: ["error"],
      },
      NodeKindSummary: {
        type: "object",
        properties: {
          id: { type: "string" },
          displayName: { type: "string" },
          cluster: { type: "string", nullable: true },
          instanceCount: { type: "integer" },
        },
        required: ["id", "displayName", "instanceCount"],
      },
      NodeKindList: {
        type: "array",
        items: { $ref: "#/components/schemas/NodeKindSummary" },
      },
      NodeKindDetail: {
        type: "object",
        properties: {
          id: { type: "string" },
          displayName: { type: "string" },
          cluster: { type: "string", nullable: true },
          schema: { type: "object" },
          instanceCount: { type: "integer" },
          instances: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                displayName: { type: "string" },
              },
            },
          },
          nextCursor: { type: "string", nullable: true },
        },
      },
      EdgeKindSummary: {
        type: "object",
        properties: {
          id: { type: "string" },
          sourceKinds: { type: "array", items: { type: "string" } },
          targetKinds: { type: "array", items: { type: "string" } },
          wiredPairCount: { type: "integer" },
        },
        required: ["id", "wiredPairCount"],
      },
      EdgeKindList: {
        type: "array",
        items: { $ref: "#/components/schemas/EdgeKindSummary" },
      },
      EdgePair: {
        type: "object",
        properties: { from: { type: "string" }, to: { type: "string" } },
        required: ["from", "to"],
      },
      EdgeKindDetail: {
        allOf: [
          { $ref: "#/components/schemas/EdgeKindSummary" },
          {
            type: "object",
            properties: {
              description: { type: "string" },
              cardinality: { type: "string" },
              pairs: {
                type: "array",
                items: { $ref: "#/components/schemas/EdgePair" },
              },
              nextCursor: { type: "string", nullable: true },
            },
          },
        ],
      },
      Cluster: {
        type: "object",
        properties: {
          id: { type: "string" },
          nodeKinds: { type: "array", items: { type: "string" } },
          recordCount: { type: "integer" },
        },
        required: ["id", "nodeKinds", "recordCount"],
      },
      ClusterList: {
        type: "array",
        items: { $ref: "#/components/schemas/Cluster" },
      },
      RecordRef: {
        type: "object",
        properties: {
          id: { type: "string" },
          nodeKind: { type: "string" },
          displayName: { type: "string" },
        },
      },
      EdgeRef: {
        type: "object",
        properties: {
          kind: { type: "string" },
          to: { type: "string" },
          from: { type: "string" },
        },
      },
      RecordDetail: {
        type: "object",
        properties: {
          id: { type: "string" },
          nodeKind: { type: "string" },
          attributes: { type: "object", additionalProperties: true },
          file: { type: "string" },
          cluster: { type: "string" },
          outgoingEdges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                kind: { type: "string" },
                to: { type: "string" },
              },
            },
          },
          incomingEdges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                kind: { type: "string" },
                from: { type: "string" },
              },
            },
          },
        },
      },
      Neighborhood: {
        type: "object",
        properties: {
          nodes: {
            type: "array",
            items: { $ref: "#/components/schemas/RecordRef" },
          },
          edges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                from: { type: "string" },
                to: { type: "string" },
                kind: { type: "string" },
              },
            },
          },
        },
      },
      SearchHit: {
        type: "object",
        properties: {
          id: { type: "string" },
          nodeKind: { type: "string" },
          score: { type: "number" },
          snippet: { type: "string" },
        },
      },
      SearchResult: {
        type: "object",
        properties: {
          total: { type: "integer" },
          hits: {
            type: "array",
            items: { $ref: "#/components/schemas/SearchHit" },
          },
        },
      },
    },
  },
} as const;
