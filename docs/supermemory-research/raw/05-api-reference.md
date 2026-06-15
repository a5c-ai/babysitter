# Supermemory API Reference

Source: https://supermemory.ai/docs/api-reference

## Base URL

`https://api.supermemory.ai`

## Authentication

Bearer token (HTTP bearer scheme). API keys prefixed with `sm_`.

## POST /v3/documents

### Purpose

Ingest documents with flexible content types (text, URLs, files, images, videos) and optional metadata.

### Request Body

**Required:**
- `content` (string): The content to process -- can be a website URL, PDF, image, or video

**Optional Parameters:**
- `containerTag`: Organize documents with a tag (max 100 chars; alphanumeric with hyphens, underscores, dots)
- `entityContext`: Guide memory extraction (max 1,500 chars)
- `customId`: Custom document identifier (max 100 chars)
- `metadata`: Key-value pairs (strings, numbers, booleans, or string arrays)
- `taskType`: Choose "memory" (full context layer, default) or "superrag" (managed RAG service)
- `filepath`: File path information for filesystem integration
- `filterByMetadata`: Filter related memories by metadata criteria during ingestion
- `dreaming`: Processing mode -- "dynamic" (default, batches related documents) or "instant" (processes immediately)

### Response

**Success (200):**
```json
{
  "id": "string",
  "status": "string"
}
```

**Errors:**
- 401: Unauthorized (missing/invalid bearer token)
- 500: Internal server error

## Additional API Operations

### Memory Operations
- Create memories directly
- Update and version memory entries
- Soft-delete memories ("forgetting")
- Search across indexed content

### Document Operations
- Add single or batch documents
- Upload files for processing
- Update document metadata
- Delete by ID or custom identifiers
- Track processing status
- Access document chunks and presigned URLs

### Profile Operations
- Retrieve user profiles
- Get static + dynamic context
- Query with threshold filtering

### Search Operations
- Semantic search with metadata filtering
- Hybrid search (RAG + memory)
- Low-latency retrieval for conversational AI

## SDK Usage

### JavaScript/TypeScript
```javascript
import { Supermemory } from "supermemory";
const client = new Supermemory({ apiKey: "sm_..." });

// Add memory
await client.add({
  content: "User prefers functional patterns",
  containerTag: "user_123",
});

// Retrieve profile
const { profile, searchResults } = await client.profile({
  containerTag: "user_123",
  q: "programming style?",
});

// Hybrid search
const results = await client.search.memories({
  q: "how to deploy?",
  containerTag: "user_123",
  searchMode: "hybrid",
});
```

### Python
```python
from supermemory import Supermemory
client = Supermemory(api_key="sm_...")

client.add(content="User prefers functional patterns", container_tag="user_123")
profile = client.profile(container_tag="user_123", q="programming style?")
```
