---
description: help and documentation for babysitter command usage, processes, skills, agents, and methodologies. use this command to understand how to use babysitter effectively.
argument-hint: Specific command, process, skill, agent, or methodology you want help with (e.g. "help command doctor" or "help process retrospect").
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob, WebFetch, WebSearch, Search, AskUserQuestion, TodoWrite, TodoRead, BashOutput, Skill, KillShell, MultiEdit, LS
---

## if no arguments provided:

show this message:

```
👋 Welcome to the Babysitter Help Center! Here you can find documentation and guidance on how to use Babysitter effectively.

📚 **Documentation**: Explore our comprehensive documentation to understand Babysitter's features, processes, skills, agents, and methodologies. [Read the Docs](https://github.com/a5c-ai/babysitter)

Or ask specific questions about commands, processes, skills, agents, methodologies, domains, specialities to get targeted help

If you have specific questions or need assistance with a particular aspect of Babysitter, feel free to ask! Just type /babysitter:help followed by your question or the topic you want to learn more about.

The Available commands are:
Primary commands:

- /babysitter:call [input] - start a babysitter process by calling it directly with input (e.g. /babysitter:call finetune an embedding model with this data set and these parameters)

- /babysitter:resume [process id or name] - resume a paused babysitter process by its id or name (e.g. /babysitter:resume retrospect-process-1234)

- /babysitter:yolo [input] - start a babysitter process in YOLO mode, where the babysitter will take full control and make all decisions autonomously without user input, until it finishes or encounters a critical issue (e.g. /babysitter:yolo add an authentication system to my app)

- /babysitter:plan [input] - generate a detailed plan for a babysitter process without executing it, allowing the user to review and modify the plan before execution (e.g. /babysitter:plan build a todo list app)

- /babysitter:forever [input] - start a babysitter process in forever mode, where the babysitter will run indefinitely. good for periodic and ongoing tasks like monitoring, maintenance, or continuous improvement (e.g. /babysitter:forever monitor my server uptime and performance)

Secondary commands:

- /babysitter:doctor [issue] - Diagnose and troubleshoot issues in the current run, process, or babysitter environment.

- /babysitter:assimilate [target github repo or reference] - Assimilate an external methodology, specification or workflow into babysitter process definitions with skills and agents. you can also use this command to integrate a specific AI coding harness (e.g. codex, opencode, antigravity) with the babysitter SDK.

- /babysitter:user-install - onboarding command for new users to install and set up babysitter, creation of a user profile, customization, how much you want control over different aspects, etc.

- /babysitter:project-install - onboarding command for babysitter into new  or existing projects.

- /babysitter:observe - launch the babysitter observer dashboard (web interface) to monitor and manage babysitter processes in real time.

```

## if arguments provided:

if the argument is "command [command name]", "process [process name]", "skill [skill name]", "agent [agent name]", or "methodology [methodology name]", then show the detailed documentation for that specific command, process, skill, agent, or methodology after reading the relevant files.