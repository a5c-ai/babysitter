---
name: domain-model-extractor
description: Extract domain models from monolithic codebases using DDD principles for microservices decomposition
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Domain Model Extractor Skill

Extracts domain models from monolithic codebases using Domain-Driven Design principles to support microservices decomposition.

## Purpose

Enable domain analysis for:
- Bounded context identification
- Aggregate detection
- Entity relationship mapping
- Domain event discovery
- Ubiquitous language extraction

## Capabilities

### 1. Bounded Context Identification
- Analyze code modules
- Identify domain boundaries
- Map team ownership
- Define context relationships

### 2. Aggregate Detection
- Find aggregate roots
- Map entity relationships
- Identify invariants
- Define consistency boundaries

### 3. Entity Relationship Mapping
- Extract entities
- Map relationships
- Identify value objects
- Document associations

### 4. Domain Event Discovery
- Find implicit events
- Map state changes
- Identify triggers
- Document event flows

### 5. Ubiquitous Language Extraction
- Build domain vocabulary
- Map term usage
- Identify synonyms
- Create glossary

### 6. Context Map Generation
- Map context relationships
- Identify integration patterns
- Document shared kernels
- Define anti-corruption layers

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| EventStorming tools | Domain discovery | Manual/Digital |
| Architecture analyzers | Code analysis | CLI |
| Visualization tools | Context mapping | Export |
| Custom AST analyzers | Code parsing | CLI |

## Output Schema

```json
{
  "extractionId": "string",
  "timestamp": "ISO8601",
  "domain": {
    "boundedContexts": [
      {
        "name": "string",
        "purpose": "string",
        "aggregates": [],
        "entities": [],
        "events": [],
        "services": []
      }
    ],
    "contextMap": {
      "relationships": []
    }
  },
  "ubiquitousLanguage": {
    "terms": []
  },
  "recommendations": {
    "serviceDecomposition": [],
    "integrationPatterns": []
  }
}
```

## Integration with Migration Processes

- **monolith-to-microservices**: Domain analysis
- **migration-planning-roadmap**: Strategic design

## Related Skills

- `architecture-analyzer`: Structure analysis

## Related Agents

- `ddd-analyst`: DDD expertise
- `microservices-decomposer`: Service extraction
