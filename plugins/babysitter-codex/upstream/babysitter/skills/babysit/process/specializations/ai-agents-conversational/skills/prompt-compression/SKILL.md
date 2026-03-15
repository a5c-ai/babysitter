---
name: prompt-compression
description: Token-efficient prompt compression techniques for cost optimization
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Prompt Compression Skill

## Capabilities

- Implement token-efficient prompt compression
- Design context pruning strategies
- Configure selective context inclusion
- Implement LLMLingua-style compression
- Design summary-based compression
- Create compression quality metrics

## Target Processes

- cost-optimization-llm
- agent-performance-optimization

## Implementation Details

### Compression Techniques

1. **LLMLingua**: Token-level compression
2. **Summary Compression**: LLM-based summarization
3. **Selective Context**: Relevant section extraction
4. **Token Pruning**: Remove low-importance tokens
5. **Document Filtering**: Pre-retrieval filtering

### Configuration Options

- Compression ratio targets
- Quality threshold settings
- Token budget constraints
- Compression model selection
- Evaluation metrics

### Best Practices

- Monitor quality vs compression tradeoff
- Test with representative prompts
- Set appropriate compression ratios
- Validate compressed prompt quality
- Track cost savings

### Dependencies

- llmlingua (optional)
- tiktoken
- transformers
