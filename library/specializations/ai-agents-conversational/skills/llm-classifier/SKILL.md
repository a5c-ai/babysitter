---
name: llm-classifier
description: LLM-based zero-shot and few-shot classification for flexible intent detection
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# LLM Classifier Skill

## Capabilities

- Implement zero-shot classification with LLMs
- Design few-shot classification prompts
- Configure structured output for labels
- Implement confidence scoring
- Design classification taxonomies
- Handle multi-label classification

## Target Processes

- intent-classification-system
- dialogue-flow-design

## Implementation Details

### Classification Patterns

1. **Zero-Shot**: No examples, description-based
2. **Few-Shot**: Example-based classification
3. **Structured Output**: JSON schema for labels
4. **Chain-of-Thought**: Reasoning before classification
5. **Ensemble**: Multiple prompts/models

### Configuration Options

- LLM model selection
- Label descriptions
- Example selection strategy
- Output format specification
- Confidence calibration

### Best Practices

- Clear label descriptions
- Representative examples
- Consistent output format
- Calibrate confidence scores
- Test with edge cases

### Dependencies

- langchain-core
- LLM provider
