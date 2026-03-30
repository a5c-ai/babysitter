---
name: rasa-nlu-integration
description: Rasa NLU pipeline configuration and training for intent and entity extraction
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Rasa NLU Integration Skill

## Capabilities

- Configure Rasa NLU pipelines
- Design training data in Rasa format
- Set up intent classification components
- Configure entity extraction (DIETClassifier)
- Implement pipeline optimization
- Set up model evaluation and testing

## Target Processes

- intent-classification-system
- chatbot-design-implementation

## Implementation Details

### Pipeline Components

1. **Tokenizers**: WhitespaceTokenizer, SpacyTokenizer
2. **Featurizers**: CountVectorsFeaturizer, SpacyFeaturizer
3. **Classifiers**: DIETClassifier, FallbackClassifier
4. **Entity Extractors**: DIETClassifier, SpacyEntityExtractor

### Configuration Files

- config.yml: Pipeline configuration
- nlu.yml: Training data
- domain.yml: Intents and entities

### Configuration Options

- Pipeline component selection
- Featurizer settings
- Classifier parameters
- Entity extraction rules
- Fallback thresholds

### Best Practices

- Start with recommended pipelines
- Tune based on domain
- Balance complexity vs performance
- Regular model retraining

### Dependencies

- rasa
