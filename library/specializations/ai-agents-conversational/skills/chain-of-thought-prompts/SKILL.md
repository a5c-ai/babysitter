---
name: chain-of-thought-prompts
description: Chain-of-thought and step-by-step reasoning prompts for complex problem solving
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Chain-of-Thought Prompts Skill

## Capabilities

- Design chain-of-thought prompting patterns
- Implement step-by-step reasoning templates
- Create self-consistency prompting
- Design tree-of-thought patterns
- Implement reasoning verification
- Create structured reasoning outputs

## Target Processes

- prompt-engineering-workflow
- self-reflection-agent

## Implementation Details

### CoT Patterns

1. **Zero-Shot CoT**: "Let's think step by step"
2. **Few-Shot CoT**: Examples with reasoning
3. **Self-Consistency**: Multiple reasoning paths
4. **Tree-of-Thought**: Branching reasoning
5. **ReAct**: Reasoning + Action interleaved

### Configuration Options

- Reasoning trigger phrases
- Step format structure
- Verification prompts
- Reasoning chain length
- Consistency voting threshold

### Best Practices

- Clear reasoning step markers
- Explicit final answer extraction
- Verify reasoning validity
- Handle reasoning errors
- Monitor reasoning quality

### Dependencies

- langchain-core
