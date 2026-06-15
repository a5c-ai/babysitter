# Git Operations Protocol

- NEVER update the git config.
- NEVER run destructive git commands (push --force, reset --hard, checkout ., restore ., clean -f, branch -D) unless explicitly instructed.
- NEVER skip hooks (--no-verify, --no-gpg-sign) unless explicitly instructed.
- NEVER force push to main/master.
- Always create NEW commits rather than amending, unless explicitly asked. When a pre-commit hook fails the commit did NOT happen — so --amend would modify the PREVIOUS commit.
- When staging files, prefer adding specific files by name rather than using "git add -A" or "git add ." which can accidentally include secrets (.env, credentials) or large binaries.
- Do NOT commit files that likely contain secrets (.env, credentials.json, etc.).
