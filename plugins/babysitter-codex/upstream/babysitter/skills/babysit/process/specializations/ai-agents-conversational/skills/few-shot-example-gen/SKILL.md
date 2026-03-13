---
name: few-shot-example-gen
description: Few-shot example generation and optimization for improved LLM performance
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Few-Shot Example Generation Skill

## Capabilities

- Generate diverse few-shot examples
- Implement example selection strategies
- Optimize example ordering for performance
- Create dynamic example retrieval
- Design example formats for specific tasks
- Implement example quality validation

## Target Processes

- prompt-engineering-workflow
- intent-classification-system

## Implementation Details

### Example Selection Strategies

1. **Semantic Similarity**: Select similar examples
2. **MMR Selection**: Diverse example selection
3. **N-Gram Overlap**: Lexical similarity
4. **Random Sampling**: Baseline selection
5. **Length-Based**: Control example sizes

### Configuration Options

- Number of examples
- Selection algorithm
- Example format (input/output structure)
- Max token limits
- Example store backend

### Best Practices

- Cover edge cases in examples
- Balance example diversity
- Optimize example ordering
- Test with varied inputs
- Monitor token usage

### Dependencies

- langchain
- sentence-transformers (for semantic selection)
