---
name: deploy
description: Deploy the application to a target environment. Use when deploying code, releasing, or pushing to staging/production. Requires explicit user invocation.
argument-hint: [environment] [--skip-tests] [--dry-run]
disable-model-invocation: true
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, WebFetch
model: sonnet
effort: high
shell: bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_SKILL_DIR}/scripts/validate-deploy-command.sh"
          if: "Bash(rm *)"
  PostToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_SKILL_DIR}/scripts/log-deploy-action.sh"
---

# Deploy Skill

Deploy the application to the specified environment.

## Arguments

- `$ARGUMENTS[0]` (or `$0`): Target environment (`staging`, `production`, `canary`). Defaults to `staging`.
- Additional flags are parsed from `$ARGUMENTS`.

## Dynamic Context

Current branch and recent commits:
!`git log --oneline -5`

Current deployment status:
!`curl -s https://deploy.internal.example.com/api/status 2>/dev/null || echo "Status endpoint unavailable"`

## Deployment Procedure

### Pre-flight Checks

1. Verify you are on a clean git branch with no uncommitted changes:
   ```bash
   git status --porcelain
   ```

2. Run the test suite (unless `--skip-tests` was passed):
   ```bash
   npm run test:ci
   ```

3. Check that the build succeeds:
   ```bash
   npm run build
   ```

4. Verify environment configuration exists for the target:
   ```bash
   ls -la config/deploy/$0.env
   ```

### Deploy

5. If `--dry-run` was passed, show what would be deployed and stop:
   ```bash
   npm run deploy -- --env $0 --dry-run
   ```

6. Otherwise, execute the deployment:
   ```bash
   npm run deploy -- --env $0
   ```

7. Wait for health checks to pass (up to 5 minutes):
   ```bash
   npm run deploy:health-check -- --env $0 --timeout 300
   ```

### Post-deploy

8. Tag the release in git:
   ```bash
   git tag -a "deploy-$0-$(date +%Y%m%d-%H%M%S)" -m "Deployed to $0"
   ```

9. Notify the team (if production):
   ```bash
   if [ "$0" = "production" ]; then
     curl -X POST https://hooks.slack.example.com/deploy \
       -H "Content-Type: application/json" \
       -d "{\"text\": \"Production deploy complete: $(git rev-parse --short HEAD)\"}"
   fi
   ```

## Rollback

If the deployment fails at any step:

1. Run the rollback command:
   ```bash
   npm run deploy:rollback -- --env $0
   ```

2. Verify health checks pass after rollback.

3. Report the failure with the error details.

## Additional Resources

For detailed deployment configuration, see [deployment-guide.md](deployment-guide.md).
For environment-specific notes, see [environments/](environments/).
