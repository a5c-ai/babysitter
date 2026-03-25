---
name: langgraph-hitl
description: Human-in-the-loop integration for LangGraph workflows with approval and intervention points
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# LangGraph Human-in-the-Loop Skill

## Capabilities

- Implement interrupt points in LangGraph workflows
- Configure human approval gates
- Design intervention interfaces
- Handle workflow resumption after human input
- Implement timeout and escalation logic
- Create notification systems for pending approvals

## Target Processes

- langgraph-workflow-design
- tool-safety-validation

## Implementation Details

### HITL Patterns

1. **Interrupt Before**: Pause before node execution
2. **Interrupt After**: Pause after node for review
3. **Conditional Interrupt**: Context-based pausing
4. **Tool Call Approval**: Review tool invocations

### Configuration Options

- Interrupt node selection
- Approval timeout settings
- Escalation paths
- Notification channels
- State modification permissions

### Best Practices

- Clear approval prompts
- Reasonable timeout defaults
- Proper escalation chains
- Audit logging for approvals

### Dependencies

- langgraph
- langgraph-checkpoint (for persistence)
