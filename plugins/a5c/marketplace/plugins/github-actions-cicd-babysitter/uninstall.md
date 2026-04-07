# GitHub Actions CI/CD (Babysitter) — Uninstall Instructions

## Step 1: Remove Workflow Files

Remove all babysitter-related workflow files from `.github/workflows/`:

```bash
rm -f .github/workflows/babysitter-issue-comment.yml
rm -f .github/workflows/babysitter-pr-review.yml
rm -f .github/workflows/babysitter-feature-tdd.yml
rm -f .github/workflows/babysitter-gsd.yml
rm -f .github/workflows/babysitter-spec-kit.yml
rm -f .github/workflows/babysitter-security.yml
rm -f .github/workflows/babysitter-incident-response.yml
rm -f .github/workflows/babysitter-arch-docs.yml
```

## Step 2: Remove Environment Reference (Optional)

```bash
rm -f .github/babysitter.env
```

## Step 3: Clean Up Secrets (Optional)

Remind the user to remove API key secrets from their repository settings if no other workflows use them:
- Go to `https://github.com/<owner>/<repo>/settings/secrets/actions`
- Delete `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `AZURE_OPENAI_API_KEY` as applicable

## Step 4: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name github-actions-cicd-babysitter --project --json
```

## Step 5: Commit Changes

```bash
git add .github/workflows/
git commit -m "chore: remove babysitter GitHub Actions workflows"
git push
```

## Notes

- Removing workflow files from the default branch immediately stops them from triggering
- Any in-progress workflow runs will complete but no new ones will start
- Run artifacts in `.a5c/runs/` from previous CI runs are not affected — remove them separately if desired
