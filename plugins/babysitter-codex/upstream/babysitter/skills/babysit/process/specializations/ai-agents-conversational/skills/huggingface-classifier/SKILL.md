---
name: huggingface-classifier
description: Hugging Face transformer model fine-tuning and inference for intent classification
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# HuggingFace Classifier Skill

## Capabilities

- Fine-tune transformer models for classification
- Configure training pipelines with Trainer API
- Implement inference with optimizations
- Design label schemas and mappings
- Set up model evaluation and metrics
- Deploy models with HF Inference API

## Target Processes

- intent-classification-system
- entity-extraction-slot-filling

## Implementation Details

### Model Types

1. **BERT-based**: bert-base-uncased, distilbert
2. **RoBERTa-based**: roberta-base, xlm-roberta
3. **DeBERTa**: deberta-v3-base
4. **Domain-specific**: FinBERT, BioBERT

### Training Configuration

- Dataset preparation
- Tokenization settings
- Training arguments
- Evaluation metrics
- Early stopping

### Configuration Options

- Model selection
- Number of labels
- Training hyperparameters
- Batch sizes
- Learning rate schedules

### Best Practices

- Use appropriate base model
- Proper train/val/test splits
- Monitor for overfitting
- Evaluate on representative data

### Dependencies

- transformers
- datasets
- accelerate
