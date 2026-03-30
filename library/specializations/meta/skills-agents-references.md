# Meta Specialization - Skills and Agents References

External references for skills and agents that can be used or adapted for the Meta Specialization.

## Claude Skills Repositories

### General Purpose Skills

| Resource | Description | Link |
|----------|-------------|------|
| Awesome Claude Skills (Composio) | Curated list of Claude Code skills | https://github.com/ComposioHQ/awesome-claude-skills |
| Awesome Claude Skills (VoltAgent) | Another curated skills collection | https://github.com/VoltAgent/awesome-claude-skills |
| Claude Code Skills | Collection of practical skills | https://github.com/levnikolaevich/claude-code-skills |
| Claude Skills Factory | Tool for creating new skills | https://github.com/alirezarezvani/claude-code-skill-factory |

### Documentation and Research Skills

| Resource | Description | Link |
|----------|-------------|------|
| AI Research Skills | Skills for research workflows | https://github.com/zechenzhangAGI/AI-research-SKILLs |
| Claude Research Team | Multi-agent research patterns | https://github.com/bigph00t/claude-research-team |

### Development and Validation Skills

| Resource | Description | Link |
|----------|-------------|------|
| Trail of Bits Skills | Security-focused validation | https://github.com/trailofbits/skills |
| Compound Engineering | Engineering workflow plugins | https://github.com/EveryInc/compound-engineering-plugin |
| Spec Kit Subagent | Specification-driven subagent | https://github.com/jcmrs/claude-code-spec-kit-subagent-plugin |

## MCP Servers

### Relevant MCP Servers

| Server | Description | Link |
|--------|-------------|------|
| MCP Hub | Directory of MCP servers | https://mcphub.io/ |
| Awesome MCP Servers | Curated MCP collection | https://github.com/modelcontextprotocol/awesome-mcp-servers |

### File and Code Analysis

| Server | Description | Use Case |
|--------|-------------|----------|
| filesystem MCP | File system operations | Reading/writing skill files |
| codebase MCP | Code analysis | Validating process files |

## Agent Patterns

### Multi-Agent Frameworks

| Resource | Description | Link |
|----------|-------------|------|
| Agent Resources | Collection of agent patterns | https://github.com/kasperjunge/agent-resources |
| SWE Agents | Software engineering agents | https://github.com/wshobson/agents |

### Prompt Templates

| Resource | Description | Link |
|----------|-------------|------|
| Vibe Coding Template | Coding prompt templates | https://github.com/KhazP/vibe-coding-prompt-template |
| Aristotle Plugin | Philosophical reasoning | https://github.com/afhverjuekki/claude-code-aristotle-plugin |

## Documentation Tools

### Markdown and Docs

| Tool | Description | Link |
|------|-------------|------|
| Markdownlint | Markdown validation | https://github.com/DavidAnson/markdownlint |
| ADR Tools | Architecture decision records | https://github.com/npryce/adr-tools |
| Divio Documentation | Documentation system | https://documentation.divio.com/ |

### API Documentation

| Tool | Description | Link |
|------|-------------|------|
| OpenAPI Generator | API doc generation | https://openapi-generator.tech/ |
| JSON Schema | Schema validation | https://json-schema.org/ |

## Process Orchestration

### Workflow Patterns

| Resource | Description | Link |
|----------|-------------|------|
| Temporal.io | Workflow orchestration | https://temporal.io/ |
| Prefect | Modern orchestration | https://www.prefect.io/ |

### Quality Gates

| Resource | Description | Link |
|----------|-------------|------|
| Continuous Delivery | Gate patterns | https://continuousdelivery.com/ |
| Martin Fowler CI | CI patterns | https://martinfowler.com/articles/continuousIntegration.html |

## Applicable Skills from Other Specializations

### From software-architecture

| Skill | Description | Reusability |
|-------|-------------|-------------|
| adr-generator | ADR generation | Could adapt for documentation processes |
| markdown-processor | Markdown processing | Directly reusable |
| docs-site-generator | Documentation generation | Directly reusable |

### From technical-documentation

| Skill | Description | Reusability |
|-------|-------------|-------------|
| tech-writing-linter | Technical writing validation | Could adapt for skill/agent docs |
| style-guide-enforcer | Style enforcement | Directly reusable |

### From qa-testing-automation

| Skill | Description | Reusability |
|-------|-------------|-------------|
| test-validator | Validation patterns | Could adapt for phase validation |
| quality-scorer | Quality scoring | Directly reusable |

## Reusable Agents from Other Specializations

### From software-architecture

| Agent | Description | Reusability |
|-------|-------------|-------------|
| technical-writer | Documentation writing | Directly reusable |
| adr-author | ADR authoring | Could adapt for process documentation |

### From product-management

| Agent | Description | Reusability |
|-------|-------------|-------------|
| backlog-manager | Backlog management | Directly applicable |
| requirements-analyst | Requirements analysis | Could adapt for skill/agent analysis |

## Implementation Notes

### Skills to Create vs Reuse

**Create New**:
- specialization-researcher (unique to meta)
- process-generator (SDK-specific)
- skill-generator (SDK-specific)
- agent-generator (SDK-specific)
- specialization-validator (unique to meta)

**Potentially Reuse/Adapt**:
- documentation-generator (from technical-documentation)
- quality-assessor (from qa-testing-automation)
- technical-writer agent (from software-architecture)

### Common Patterns to Follow

1. **Skill Structure**:
   - Follow SKILL.md format from existing skills
   - Use consistent tool permissions
   - Include comprehensive examples

2. **Agent Structure**:
   - Follow AGENT.md format from existing agents
   - Include prompt templates
   - Document interaction patterns

3. **Integration Patterns**:
   - Reference skill.name in task definitions
   - Reference agent.name in task definitions
   - Use io.inputJsonPath and io.outputJsonPath

---

## Quick Reference

### GitHub Search Queries

```
"claude skills" in:readme
"SKILL.md" path:skills
"AGENT.md" path:agents
"defineTask" language:javascript
"babysitter" skill
```

### MCP Search

```
mcphub.io search: documentation
mcphub.io search: validation
mcphub.io search: generation
```
