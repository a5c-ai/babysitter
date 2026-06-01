# codeowners — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `location` | `.github/CODEOWNERS`, `docs/CODEOWNERS`, `CODEOWNERS` | `.github/CODEOWNERS` | file path |
| `fallbackOwner` | handle | `@org/maintainers` | top-level `*` rule |
| `granularity` | `package`, `directory`, `file-pattern` | `package` | gen-codeowners script |
| `minCommittersForOwner` | integer | `2` | gen-codeowners threshold |
| `topAuthorCount` | integer | `3` | authors sampled per dir |
| `requireCodeOwnerReview` | `on`, `off` | `on` | branch protection |
| `autoAssignOnOpen` | `on`, `off` | `on` | GitHub native |
| `driftCheckSchedule` | cron | `0 6 1 * *` | workflow cron |
| `failOnUnresolvedOwners` | `on`, `off` | `on` | validator `--checks=owners` |
| `allowUnownedPaths` | `on`, `off` | `off` | validator flag |
| `handleType` | `team`, `user`, `mixed` | `team` | manual review post-gen |

## 2. Add a New Ownership Rule

Edit `.github/CODEOWNERS`:

```
# Later rules override earlier ones
/packages/sdk/src/storage/    @org/storage-team @org/sdk-team
*.tf                           @org/sre
/migrations/                   @org/dba @org/backend
```

## 3. Move Ownership Between Teams

```
# Remove this:
/packages/agent-mux/cli/   @org/old-team
# Add this:
/packages/agent-mux/cli/   @org/new-team @org/maintainers
```

Notify `@org/old-team` in the PR description.

## 4. Adjust Granularity for Monorepos

For strict package-level ownership, use directory globs only:

```
/packages/sdk/        @org/sdk
/packages/catalog/    @org/frontend
```

For mixed granularity, add file-pattern overrides **after** directory rules:

```
/packages/sdk/                  @org/sdk
/packages/sdk/**/*.sql           @org/dba   # DBAs override SDK team for SQL
```

## 5. Exclude Paths from Ownership

Lines without owners are valid but discouraged. Better: assign a catch-all team:

```
# Vendor-managed, don't require review
/third_party/    @org/bot-account
```

## 6. Configure Branch Protection (via API)

Paired with the `branch-protection` plugin:

```yaml
required_pull_request_reviews:
  require_code_owner_reviews: true
  required_approving_review_count: 1
```

## 7. Change Drift-Check Cadence

Edit `.github/workflows/codeowners.yml`:

```yaml
schedule:
  - cron: '0 9 * * 1'  # weekly Monday
```

## 8. Relax for Emergency Hotfixes

GitHub allows admins to merge without CODEOWNERS review if **Allow specified actors to bypass required pull requests** is enabled for the admin team in branch protection.

Document the bypass audit process in `SECURITY.md`.

## 9. Integrate with PR Templates

In `.github/pull_request_template.md`:

```markdown
### Reviewers

Code Owners will be auto-assigned. To add reviewers beyond CODEOWNERS, @-mention them in this PR.
```

## 10. Regenerate After Major Refactor

```bash
babysitter run:create \
  --process-id codeowners-regenerate \
  --entry .a5c/processes/codeowners/regenerate.js#process \
  --prompt "Rebuild .github/CODEOWNERS from current git history, preserving team handle overrides" \
  --json
```

## 11. Multi-Owner Rules

Any owner listed can approve:

```
/packages/sdk/   @org/sdk-team @org/maintainers @alice
```

To require approval from **all** listed owners, use GitHub's **Require multiple reviewers** branch protection setting with `required_approving_review_count` equal to the number of owning teams.
