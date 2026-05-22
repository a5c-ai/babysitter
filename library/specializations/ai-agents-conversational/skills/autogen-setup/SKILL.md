---
name: autogen-setup
description: Microsoft AutoGen multi-agent configuration for conversational AI systems
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
graph:
  domains: [domain:software-engineering]
  specializations: [specialization:ai-agents-conversational]
  skillAreas: [skill-area:multi-agent-coordination, skill-area:agentic-loops]
  roles: [role:ml-engineer, role:backend-engineer]
  workflows: [workflow:feature-development, workflow:ml-model-lifecycle]
  topics: [topic:design-patterns, topic:api-design]

---

# AutoGen Setup Skill

## Capabilities

- Configure AutoGen agents (AssistantAgent, UserProxyAgent)
- Set up agent conversations and group chats
- Implement code execution capabilities
- Design human-in-the-loop patterns
- Configure nested agent architectures
- Implement custom reply functions

## Target Processes

- multi-agent-system
- autonomous-task-planning

## Implementation Details

### Agent Types

1. **AssistantAgent**: LLM-powered assistant
2. **UserProxyAgent**: Human proxy with code execution
3. **GroupChatManager**: Multi-agent orchestration
4. **ConversableAgent**: Base class for custom agents

### Configuration Options

- LLM configuration (models, temperatures)
- Code execution settings
- Human input mode
- Max consecutive auto-replies
- Function calling configuration

### Patterns

- Two-agent conversations
- Group chats with selection
- Nested conversations
- Teachable agents

### Best Practices

- Proper termination conditions
- Safe code execution sandboxing
- Clear agent system messages
- Monitor conversation flow

### Dependencies

- pyautogen
