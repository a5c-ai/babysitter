# Meta Specialization - Process, Skill, and Agent Creation

**Category**: Meta/System Specialization
**Focus**: Creating Domains, Specializations, Processes, Skills, and Agents
**Scope**: Babysitter SDK Orchestration Framework

## Overview

The Meta Specialization is a self-referential specialization focused on the creation and management of the Babysitter SDK's organizational structures: domains, specializations, processes, skills, and agents. This specialization codifies the methodology for building and extending the SDK's capability library.

This specialization enables systematic, quality-gated creation of new capabilities within the Babysitter SDK framework, ensuring consistency, completeness, and adherence to established patterns.

## Roles and Responsibilities

### Process Architect

**Primary Focus**: Designing and implementing orchestration processes

**Core Responsibilities**:
- Design process workflows with quality gates
- Define task definitions and agent/skill assignments
- Implement breakpoints for human-in-the-loop approval
- Create convergent loops for iterative refinement
- Document process inputs, outputs, and artifacts

**Key Skills**:
- Babysitter SDK process definition patterns
- Task definition (defineTask) syntax
- Quality gate design
- Breakpoint placement strategy
- Artifact management

**Deliverables**:
- Process JS files
- Process documentation
- Input/output schemas
- Task dependency graphs

### Skill Designer

**Primary Focus**: Creating and maintaining skill definitions

**Core Responsibilities**:
- Define skill capabilities and boundaries
- Document skill inputs/outputs
- Specify allowed tools for each skill
- Create skill documentation (SKILL.md)
- Integrate skills with processes

**Key Skills**:
- SKILL.md frontmatter syntax
- Tool permission management
- Skill capability scoping
- MCP server integration
- Best practices documentation

**Deliverables**:
- SKILL.md files
- Skill README.md files
- Supporting scripts
- Reference documentation

### Agent Designer

**Primary Focus**: Creating and maintaining agent definitions

**Core Responsibilities**:
- Define agent roles and expertise areas
- Create agent prompt templates
- Document agent interaction patterns
- Specify target processes for agents
- Design agent collaboration patterns

**Key Skills**:
- AGENT.md frontmatter syntax
- Prompt engineering
- Role-based agent design
- Expertise specification
- Process integration patterns

**Deliverables**:
- AGENT.md files
- Agent README.md files
- Prompt templates
- Interaction documentation

### Specialization Curator

**Primary Focus**: Managing specializations and domains

**Core Responsibilities**:
- Research specialization requirements
- Identify processes, skills, and agents needed
- Maintain backlogs and references
- Ensure consistency across specializations
- Quality assurance for new specializations

**Key Skills**:
- Domain analysis
- Reference research
- Backlog management
- Quality assessment
- Documentation standards

**Deliverables**:
- README.md and references.md
- processes-backlog.md
- skills-agents-backlog.md
- skills-agents-references.md

## Directory Structure

```
specializations/
├── meta/                           # This specialization
│   ├── README.md                   # This file
│   ├── references.md               # External references
│   ├── processes-backlog.md        # Phase 2 output
│   ├── skills-agents-backlog.md    # Phase 4 output
│   ├── skills-agents-references.md # Phase 5 output
│   ├── *.js                        # Process files (Phase 3)
│   ├── skills/                     # Skills (Phase 6)
│   │   └── <skill-name>/
│   │       ├── SKILL.md
│   │       ├── README.md
│   │       └── scripts/
│   └── agents/                     # Agents (Phase 6)
│       └── <agent-name>/
│           ├── AGENT.md
│           └── README.md
├── domains/
│   ├── business/
│   │   └── <specialization>/
│   ├── science/
│   │   └── <specialization>/
│   └── social-sciences-humanities/
│       └── <specialization>/
└── <non-domain-specialization>/    # R&D/Engineering specializations
    ├── README.md
    ├── references.md
    ├── processes-backlog.md
    ├── skills-agents-backlog.md
    ├── skills-agents-references.md
    ├── *.js
    ├── skills/
    └── agents/
```

## Creation Phases

### Phase 1: Research, README, and References

**Objective**: Establish foundation for the specialization

**Activities**:
- Research the specialization domain
- Identify key roles and responsibilities
- Document goals, objectives, and use cases
- Compile reference materials with links
- Create README.md with comprehensive overview
- Create references.md with curated links

**Output Files**:
- `README.md` - Specialization overview
- `references.md` - Reference materials

**Quality Criteria**:
- Clear scope definition
- Comprehensive role descriptions
- Relevant references with working links
- Consistent formatting

### Phase 2: Identifying Processes

**Objective**: Map out all processes for the specialization

**Activities**:
- Identify methodologies and work patterns
- Define process boundaries
- Describe process inputs/outputs
- Link to reference materials
- Create backlog with TODO items

**Output Files**:
- `processes-backlog.md` - List of processes to implement

**Backlog Format**:
```markdown
- [ ] process-name.js - Description of process. Reference: [link]
```

**Quality Criteria**:
- Comprehensive coverage of domain
- Clear process descriptions
- Traceable to references
- Appropriate granularity

### Phase 3: Create Process Files

**Objective**: Implement process orchestration files

**Activities**:
- Create JS files for each process
- Define task definitions with defineTask
- Implement quality gates and breakpoints
- Add input/output schemas
- Document process metadata

**Output Files**:
- `*.js` - Process implementation files

**Process File Structure**:
```javascript
/**
 * @process specialization/process-name
 * @description Process description
 * @inputs { param1: type, param2: type }
 * @outputs { result: type, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase implementation with ctx.task() calls
  // Breakpoints with ctx.breakpoint()
  // Return structured output
}

// Task definitions
export const taskName = defineTask('task-name', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Task title',
  skill: { name: 'skill-name' },
  agent: {
    name: 'agent-name',
    prompt: { /* ... */ },
    outputSchema: { /* ... */ }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```

**Quality Criteria**:
- Proper JSDoc metadata
- Correct SDK patterns
- Quality gates at decision points
- Breakpoints for approvals
- Proper error handling

### Phase 4: Identify Skills and Agents

**Objective**: Map skills and agents needed for processes

**Activities**:
- Analyze each process for skill/agent needs
- Identify reusable skills across processes
- Define agent roles and expertise
- Create mapping table (process -> skills/agents)
- Document in backlog

**Output Files**:
- `skills-agents-backlog.md` - Skills and agents to create

**Backlog Format**:
```markdown
## Skills

- [ ] SK-XX-001: skill-name - Description

## Agents

- [ ] AG-XX-001: agent-name - Description

## Process-to-Skill/Agent Mapping

| Process | Skills | Agents |
|---------|--------|--------|
| process.js | SK-XX-001 | AG-XX-001 |
```

**Quality Criteria**:
- Complete mapping for all processes
- Appropriate skill/agent granularity
- No duplicate functionality
- Clear naming conventions

### Phase 5: Research References

**Objective**: Find existing skills/agents to reuse or reference

**Activities**:
- Search GitHub for existing Claude skills
- Search for relevant MCP servers
- Document community resources
- Identify reusable components
- Add to references file

**Output Files**:
- `skills-agents-references.md` - External references

**Quality Criteria**:
- Active repositories with recent commits
- Relevant functionality
- Compatible licensing
- Working links

### Phase 6: Create Skills and Agents

**Objective**: Implement skill and agent definitions

**Activities**:
- Create directories for each skill/agent
- Write SKILL.md/AGENT.md files
- Add README documentation
- Create supporting scripts if needed
- Mark completed in backlog

**SKILL.md Structure**:
```markdown
---
name: skill-name
description: Skill description
allowed-tools: Bash Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: category
  backlog-id: SK-XX-001
---

# skill-name

Detailed skill documentation...
```

**AGENT.md Structure**:
```markdown
---
name: agent-name
description: Agent description
role: Role Category
expertise:
  - Expertise area 1
  - Expertise area 2
---

# Agent Name Agent

## Overview

Agent description...

## Capabilities

- Capability 1
- Capability 2

## Target Processes

- process-name

## Prompt Template

```javascript
{
  role: 'Role description',
  expertise: ['area1', 'area2'],
  task: 'Task description',
  guidelines: ['guideline1', 'guideline2'],
  outputFormat: 'format'
}
```
```

**Quality Criteria**:
- Valid frontmatter
- Comprehensive capabilities
- Process integration documented
- Prompt templates provided

### Phase 7: Integrate into Processes

**Objective**: Wire skills/agents into process files

**Activities**:
- Update task definitions with skill/agent names
- Verify skill.name and agent.name fields
- Test process with integrated skills/agents
- Update backlog with checkmarks

**Integration Pattern**:
```javascript
export const taskName = defineTask('task-name', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Task title',
  skill: { name: 'skill-name' },      // <-- Add skill reference
  agent: {
    name: 'agent-name',               // <-- Add agent reference
    prompt: { /* ... */ },
    outputSchema: { /* ... */ }
  },
  // ...
}));
```

**Quality Criteria**:
- All skills/agents referenced
- Valid skill/agent names
- Process runs successfully
- Backlog fully checked off

## Best Practices

### Process Design

1. **Quality Gates**: Include scoring tasks for iterative refinement
2. **Breakpoints**: Add human approval at critical decisions
3. **Artifacts**: Track all generated files
4. **Logging**: Use ctx.log for process observability
5. **Error Handling**: Handle failures gracefully

### Skill Design

1. **Single Responsibility**: Each skill should do one thing well
2. **Tool Permissions**: Only allow necessary tools
3. **Documentation**: Provide comprehensive usage examples
4. **Integration**: Document process integration points
5. **Constraints**: Clearly state limitations

### Agent Design

1. **Clear Role**: Define precise role and expertise
2. **Prompt Templates**: Provide reusable prompts
3. **Output Schemas**: Specify expected output format
4. **Collaboration**: Document interaction patterns
5. **Target Processes**: List applicable processes

### Naming Conventions

- **Processes**: `kebab-case.js` (e.g., `domain-creation.js`)
- **Skills**: `kebab-case` directory (e.g., `skill-validator/`)
- **Agents**: `kebab-case` directory (e.g., `process-architect/`)
- **Backlog IDs**: `SK-XX-NNN` for skills, `AG-XX-NNN` for agents

## Relationship to Other Specializations

**All Specializations**: Meta provides the framework for creating any specialization

**Technical Documentation**: Shares documentation patterns and standards

**Software Architecture**: Shares ADR and design patterns for process design

**Product Management**: Shares backlog management patterns

## Success Metrics

**Completeness**:
- All phases completed for each specialization
- All backlog items addressed
- All skills/agents integrated

**Quality**:
- Processes run without errors
- Skills/agents properly referenced
- Documentation comprehensive

**Consistency**:
- Uniform file structure
- Consistent naming conventions
- Standard frontmatter formats

## Continuous Improvement

1. **Review New Patterns**: Adopt successful patterns from other specializations
2. **Refactor Common Components**: Extract reusable skills/agents
3. **Update References**: Keep external references current
4. **Validate Integrations**: Regularly test process executions
5. **Gather Feedback**: Incorporate user feedback into improvements

---

## See Also

- **backlog.md**: Master backlog with phase instructions
- **references.md**: External reference materials
- **Babysitter SDK Documentation**: SDK patterns and API
