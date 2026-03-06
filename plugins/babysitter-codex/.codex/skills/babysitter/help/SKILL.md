---
name: babysitter:help
description: Help and documentation for babysitter commands, processes, skills, agents, and methodologies.
argument-hint: "[command|process|skill|agent|methodology] topic to get help on"
---

# babysitter:help

Help and documentation system for the babysitter Codex CLI plugin.

## No Arguments — Show Welcome

If no arguments provided, display this welcome:

```
Babysitter for Codex CLI — Orchestration Plugin

Primary Commands:
  /babysitter:call        Start an orchestration run (interactive)
  /babysitter:resume      Resume an existing run
  /babysitter:yolo        Start a run (non-interactive, no breakpoints)
  /babysitter:plan        Plan a workflow without executing
  /babysitter:forever     Start a never-ending periodic run

Secondary Commands:
  /babysitter:doctor      Diagnose run health (10 checks)
  /babysitter:assimilate  Assimilate external methodology
  /babysitter:user-install   Set up babysitter for yourself
  /babysitter:project-install  Onboard a project
  /babysitter:observe     Launch observer dashboard

Type /babysitter:help <command> for detailed help on a specific command.
```

## With Arguments — Show Details

If an argument is provided:

1. **Command help**: Read the SKILL.md for that command from `.codex/skills/babysitter/<name>/SKILL.md` and display its content
2. **Process help**: Read the process .js file from `.a5c/processes/<name>.js` and describe it
3. **Skill/agent help**: Use `babysitter skill:discover --json` to find it and display its description
4. **Methodology help**: Search the process library for matching methodology

Use the skill-loader module to resolve command names:
```javascript
const { getSkillContent } = require('./.codex/skill-loader');
const content = getSkillContent(args);
```
