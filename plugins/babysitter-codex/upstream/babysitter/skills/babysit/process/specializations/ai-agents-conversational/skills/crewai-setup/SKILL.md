---
name: crewai-setup
description: CrewAI multi-agent orchestration setup for collaborative AI systems
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# CrewAI Setup Skill

## Capabilities

- Configure CrewAI agents with roles and goals
- Define tasks and expected outputs
- Set up crew orchestration patterns
- Implement agent collaboration workflows
- Configure memory and knowledge sharing
- Design hierarchical agent structures

## Target Processes

- multi-agent-system
- plan-and-execute-agent

## Implementation Details

### Core Components

1. **Agents**: Define roles, goals, backstories, and tools
2. **Tasks**: Specify descriptions, expected outputs, and assigned agents
3. **Crews**: Orchestrate agents with process types
4. **Tools**: Custom tool integration for agents

### Process Types

- Sequential: Linear task execution
- Hierarchical: Manager-led coordination
- Consensus: Agent voting and agreement

### Configuration Options

- LLM selection per agent
- Tool assignment
- Memory configuration
- Delegation settings
- Verbose/debug modes

### Best Practices

- Clear role definitions
- Appropriate task granularity
- Proper tool assignment
- Monitor agent interactions
- Handle failures gracefully

### Dependencies

- crewai
- crewai-tools
