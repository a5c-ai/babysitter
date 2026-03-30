---
name: setfit-few-shot
description: SetFit few-shot learning for efficient intent classification with minimal data
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# SetFit Few-Shot Skill

## Capabilities

- Train SetFit models with few examples per class
- Configure contrastive learning settings
- Implement efficient classification pipelines
- Design few-shot training strategies
- Set up model evaluation
- Deploy lightweight classifiers

## Target Processes

- intent-classification-system

## Implementation Details

### SetFit Advantages

1. **Few Examples**: 8-16 examples per class
2. **No Prompts**: No prompt engineering needed
3. **Fast Training**: Minutes vs hours
4. **Small Models**: Sentence transformer base

### Training Process

- Contrastive fine-tuning of embeddings
- Classification head training
- Iterative sampling strategies

### Configuration Options

- Base sentence transformer model
- Number of training examples
- Contrastive learning epochs
- Classification head architecture
- Evaluation metrics

### Best Practices

- Diverse few-shot examples
- Balance class examples
- Use appropriate base model
- Validate on held-out data

### Dependencies

- setfit
- sentence-transformers
