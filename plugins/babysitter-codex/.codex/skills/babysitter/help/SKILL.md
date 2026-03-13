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
  /babysitter:retrospect  Analyze a run and improve future processes
  /babysitter:model       Set/view model routing policy
  /babysitter:issue       Start workflow from GitHub issue
  /babysitter:team-install Install team-pinned setup from lockfile
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
   - Also search bundled upstream process library at `upstream/babysitter/skills/babysit/process`
3. **Skill/agent help**: Use wrapper discovery helpers; if invoking SDK CLI directly use `babysitter skill:discover --plugin-root "$CODEX_PLUGIN_ROOT" --json`
4. **Methodology help**: Search the process library for matching methodology

Use the skill-loader module to resolve command names:
```javascript
const { getSkillContent } = require('./.codex/skill-loader');
const content = getSkillContent(args);
```
