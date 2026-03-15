---
name: constitutional-ai-prompts
description: Constitutional AI and safety guardrail prompts for aligned LLM behavior
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Constitutional AI Prompts Skill

## Capabilities

- Design constitutional AI principles
- Implement self-critique and revision prompts
- Create harmlessness guidelines
- Design refusal patterns for unsafe requests
- Implement red-team testing prompts
- Create ethics-aware response frameworks

## Target Processes

- system-prompt-guardrails
- content-moderation-safety

## Implementation Details

### Constitutional Patterns

1. **Critique-Revision**: Self-evaluate and improve responses
2. **Principle Adherence**: Follow defined ethical principles
3. **Harmlessness Focus**: Prioritize safe responses
4. **Helpfulness Balance**: Balance helpfulness with safety
5. **Transparency**: Acknowledge limitations

### Configuration Options

- Constitutional principles list
- Critique prompts
- Revision guidelines
- Refusal templates
- Escalation triggers

### Best Practices

- Define clear constitutional principles
- Balance helpfulness and safety
- Test with adversarial inputs
- Document refusal patterns
- Regular principle review

### Dependencies

- langchain-core
