---
name: memory-summarization
description: Conversation summarization for memory compression and context management
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Memory Summarization Skill

## Capabilities

- Implement conversation summarization strategies
- Configure rolling summary updates
- Design hierarchical summarization
- Implement token-aware summarization
- Create extractive and abstractive summaries
- Design summary quality evaluation

## Target Processes

- conversational-memory-system
- long-term-memory-management

## Implementation Details

### Summarization Strategies

1. **Rolling Summary**: Update summary with new messages
2. **Hierarchical**: Multi-level summarization
3. **Token-Budget**: Fit within token limits
4. **Extractive**: Key message selection
5. **Abstractive**: LLM-generated summaries

### Configuration Options

- LLM for summarization
- Summary token budget
- Update frequency
- Summary template
- Quality thresholds

### Best Practices

- Balance detail vs compression
- Preserve key information
- Monitor summary quality
- Test with long conversations
- Handle context window limits

### Dependencies

- langchain-core
- LLM provider
