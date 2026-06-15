---
description: Launch the babysitter observer dashboard. Installs and runs the real-time observer UI that watches babysitter runs, displaying task progress, journal events, and orchestration state in your browser.
argument-hint: [--watch-dir <dir>]
allowed-tools: Read, Grep, Write, Task, Bash
---

Run the babysitter observer dashboard:

1. Determine the watch directory — this is usually the project's container directory (the parent of the project dir), or the current working directory if not specified.
2. Launch the standalone dashboard package: `npx -y @a5c-ai/babysitter-observer-dashboard@latest --watch-dir <dir>`.
3. This is a blocking process — it will keep running until stopped.
4. Report the URL printed by the dashboard to the user, then open it in the browser.

Do not fall back to `babysitter observe`; the core Babysitter CLI does not expose
that subcommand. Some harness runtimes may provide a separate
`agent-platform observe` surface, but this skill uses the verified standalone
dashboard package.
