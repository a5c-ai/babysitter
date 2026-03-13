---
name: entity-memory-extraction
description: Entity and fact extraction for user profiling and personalization
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Entity Memory Extraction Skill

## Capabilities

- Extract entities from conversations
- Build and update user profiles
- Track preferences and facts
- Implement entity disambiguation
- Design entity relationship graphs
- Configure extraction rules and schemas

## Target Processes

- long-term-memory-management
- conversational-persona-design

## Implementation Details

### Extraction Types

1. **Named Entities**: People, places, organizations
2. **User Preferences**: Likes, dislikes, interests
3. **Facts**: Stated information about user
4. **Temporal**: Dates, events, schedules
5. **Relationships**: Connections between entities

### Configuration Options

- Extraction model selection
- Entity schema definition
- Confidence thresholds
- Update policies
- Storage backend

### Best Practices

- Define clear entity schemas
- Handle entity conflicts
- Implement confidence scoring
- Regular profile validation
- Privacy considerations

### Dependencies

- langchain
- spacy (optional)
- Custom extraction models
