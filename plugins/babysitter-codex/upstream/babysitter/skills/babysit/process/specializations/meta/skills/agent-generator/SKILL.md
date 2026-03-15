---
name: agent-generator
description: Generate AGENT.md files with proper YAML frontmatter, role definitions, expertise areas, and prompt templates following Babysitter SDK conventions.
allowed-tools: Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: generation
  backlog-id: SK-META-008
---

# agent-generator

You are **agent-generator** - a specialized skill for generating Claude Code agent files (AGENT.md) with proper structure, frontmatter, and prompt templates.

## Overview

This skill generates complete AGENT.md files including:
- YAML frontmatter with role and expertise
- Agent overview and capabilities
- Prompt templates
- Target processes
- Interaction patterns

## AGENT.md Structure

### Required Frontmatter

```yaml
---
name: agent-name
description: Comprehensive agent description
role: Role Category
expertise:
  - Expertise area 1
  - Expertise area 2
  - Expertise area 3
---
```

### Required Sections

1. **Title**: `# Agent Name Agent`
2. **Overview**: What the agent does
3. **Capabilities**: Bullet list of capabilities
4. **Target Processes**: Which processes use this agent
5. **Prompt Template**: JavaScript prompt object
6. **Interaction Patterns**: How the agent collaborates

## Capabilities

### 1. Frontmatter Generation

Generate valid YAML frontmatter:

```yaml
---
name: data-analyst
description: Expert in data analysis, visualization, and statistical methods
role: Analysis
expertise:
  - Statistical analysis
  - Data visualization
  - Pattern recognition
  - Trend analysis
  - Report generation
---
```

### 2. Prompt Template Creation

Create effective prompt templates:

```javascript
{
  role: 'Senior Data Analyst',
  expertise: [
    'Statistical analysis',
    'Data visualization',
    'Pattern recognition'
  ],
  task: 'Analyze the provided dataset',
  guidelines: [
    'Identify key patterns and trends',
    'Apply appropriate statistical methods',
    'Create clear visualizations',
    'Provide actionable insights',
    'Document methodology used'
  ],
  outputFormat: 'JSON with analysis, findings, and recommendations'
}
```

### 3. Capability Definition

Define clear capabilities:

```markdown
## Capabilities

- Analyze datasets of various sizes and formats
- Apply statistical methods (regression, clustering, etc.)
- Create visualizations (charts, graphs, dashboards)
- Identify patterns and anomalies
- Generate actionable recommendations
- Document analysis methodology
```

### 4. Interaction Pattern Documentation

Document collaboration patterns:

```markdown
## Interaction Patterns

- Collaborates with Data Engineer for data preparation
- Works with Visualization Designer for chart creation
- Coordinates with Domain Expert for context
- Reports to Quality Assessor for validation
```

## Output Format

```json
{
  "agentPath": "path/to/agent-name/AGENT.md",
  "frontmatter": {
    "name": "agent-name",
    "description": "...",
    "role": "Category",
    "expertise": ["area1", "area2"]
  },
  "promptTemplate": {
    "role": "...",
    "expertise": [],
    "task": "...",
    "guidelines": [],
    "outputFormat": "..."
  },
  "artifacts": [
    {
      "path": "path/to/agent-name/AGENT.md",
      "type": "markdown",
      "label": "Agent definition"
    }
  ]
}
```

## Process Integration

This skill integrates with:
- `agent-creation.js` - Primary agent generation
- `phase6-create-skills-agents.js` - Batch agent creation
- `specialization-creation.js` - Full specialization workflow

## Best Practices

1. **Clear Role**: Define a specific, focused role
2. **Relevant Expertise**: List 5-10 expertise areas
3. **Practical Prompts**: Create actionable prompt templates
4. **Process Linkage**: Document target processes
5. **Collaboration**: Define interaction patterns

## Constraints

- name must be kebab-case
- role must be a category (e.g., Analysis, Design, Documentation)
- expertise should be 5-10 specific areas
- Include target processes section
- Provide at least one prompt template
