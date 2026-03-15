---
name: prompt-template-design
description: Structured prompt template creation with variables, formatting, and version control
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Prompt Template Design Skill

## Capabilities

- Create structured prompt templates with variables
- Implement prompt formatting with different styles
- Design system/user/assistant message templates
- Handle dynamic context injection
- Implement prompt versioning and management
- Create reusable prompt components

## Target Processes

- prompt-engineering-workflow
- system-prompt-guardrails

## Implementation Details

### Template Patterns

1. **LangChain PromptTemplate**: Variable-based templates
2. **ChatPromptTemplate**: Message-based templates
3. **FewShotPromptTemplate**: With example selection
4. **PipelinePromptTemplate**: Composed templates

### Configuration Options

- Variable names and defaults
- Input validation rules
- Output format specification
- Partial variable handling
- Template inheritance

### Best Practices

- Clear variable naming conventions
- Structured output instructions
- Version control for templates
- Testing with edge cases
- Documentation of template purpose

### Dependencies

- langchain-core
