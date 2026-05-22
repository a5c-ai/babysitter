# stale-bot — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Workflow only** — Keep labels for manual triage, remove the bot
2. **Everything** — Remove workflow, labels, CONTRIBUTING section
3. **Selective** — Let the user choose which layers to remove

**Warning**: Issues closed by stale-bot remain closed after uninstall. They are not automatically re-opened.

## Step 2: Remove Workflow

```bash
rm -f .github/workflows/stale.yml
```

Any running schedule stops on next cron tick.

## Step 3: Remove Labels (Optional)

Labels already applied to issues/PRs persist even if the label itself is deleted — they are silently removed from items. Consider keeping `stale` for historical context.

```bash
for L in stale keep-open pinned; do
  gh label delete "$L" --yes
done
```

**Do not delete** `security`, `wip`, `good first issue`, `help wanted` — they're useful beyond stale-bot.

## Step 4: Remove Label Seed Script

```bash
rm -f scripts/seed-stale-labels.sh
```

## Step 5: Clean CONTRIBUTING.md

Edit `CONTRIBUTING.md` and remove the "Stale Issues and PRs" section added during install.

## Step 6: Remove Processes

```bash
rm -rf .a5c/processes/stale-bot
```

## Step 7: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name stale-bot --project --json
```

## Step 8: (Optional) Re-open Recently Closed Stale Issues

If the team concludes the bot was too aggressive, bulk-reopen recent closures:

```bash
gh search issues --state closed --match body "automatically closed because it remained stale" \
  --sort updated --limit 100 --json number \
  --jq '.[].number' \
  | xargs -n1 -I{} gh issue reopen {} --comment "Re-opening after stale-bot removal; please confirm if still relevant."
```

## Notes

- Without the bot, backlog management returns to manual triage — consider a lightweight replacement (e.g. a weekly "triage day")
- Exempt labels still work for tracking purposes even without the workflow
- Bots cannot un-close items they closed — always safer to review before deleting labels
