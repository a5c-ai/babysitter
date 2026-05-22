# Security Policy

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security reports.

Email the maintainers privately (see repo owner contact on GitHub) or use GitHub's private vulnerability reporting via the Security tab. Include:

- A description of the issue and its impact.
- Steps to reproduce.
- Affected package(s) and version(s).

We aim to acknowledge reports within 5 business days.

## Scope

- `@a5c-ai/agent-mux-core`, `-adapters`, `-cli`, `-harness-mock`, and the meta package `@a5c-ai/agent-mux`.
- Published artifacts on npm (verified via npm provenance).

Out of scope: issues in third-party agent CLIs (Claude Code, Codex, Cursor, etc.) — report those upstream.

## Supported Versions

Only the latest minor line receives security fixes.
