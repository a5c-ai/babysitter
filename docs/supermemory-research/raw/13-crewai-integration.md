# CrewAI + Supermemory Integration

Source: https://supermemory.ai/docs/integrations/crewai

## Purpose

Supermemory adds persistent memory capabilities to CrewAI agents, enabling retention across multiple runs. "CrewAI agents don't remember anything between runs by default. Supermemory fixes that."

## Key Features

### User Context Management

Retrieves and manages two types of user data:
- Static facts (preferences, expertise, job titles)
- Dynamic context (current projects and focus areas)

### Memory Storage & Retrieval

- Save crew outputs for future reference
- Search past interactions before starting new tasks
- Build upon previous work

## Implementation Approach

1. Initialize Supermemory and fetch user profiles with relevant memories
2. Inject retrieved context into agent backstories
3. Store crew results as memories for future sessions
4. Search memories to provide agents with contextual information

## Advanced Patterns

- Handle multiple users simultaneously
- Filter memories by metadata (project, agent type, confidence level)
- Selectively store only successful task completions
