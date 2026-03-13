---
name: nemo-guardrails
description: NVIDIA NeMo Guardrails configuration for conversational safety and control
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# NeMo Guardrails Skill

## Capabilities

- Configure NeMo Guardrails rails
- Design Colang conversation flows
- Implement input/output rails
- Set up topic control
- Configure jailbreak detection
- Implement fact-checking rails

## Target Processes

- system-prompt-guardrails
- content-moderation-safety

## Implementation Details

### Rail Types

1. **Input Rails**: Filter user inputs
2. **Output Rails**: Filter LLM outputs
3. **Dialog Rails**: Control conversation flow
4. **Retrieval Rails**: Filter retrieved content
5. **Execution Rails**: Control action execution

### Colang Components

- Flow definitions
- Bot message templates
- User message patterns
- Actions and subflows

### Configuration Options

- Rails configuration
- LLM selection
- Embedding model
- Action handlers
- Custom rail implementations

### Best Practices

- Start with built-in rails
- Design clear flows
- Test with adversarial inputs
- Monitor rail activations

### Dependencies

- nemoguardrails
