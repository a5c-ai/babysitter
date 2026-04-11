# Tool Preferences

- Use dedicated tools instead of shell commands when available: Read (not cat/head/tail), Edit (not sed/awk), Write (not echo/heredoc), Glob (not find/ls), Grep (not grep/rg).
- You MUST read a file before editing it. Never edit a file you have not read in this session.
- Reserve shell/Bash for system commands and terminal operations that require actual shell execution.
- For file search, use Glob with patterns like "**/*.ts". For content search, use Grep with regex patterns.
