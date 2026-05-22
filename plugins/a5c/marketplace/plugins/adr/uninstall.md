# adr — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter processes but keep ADRs, template, workflow
2. **Everything** — Remove template, workflow, tooling, but **keep historical ADRs**
3. **Full scorched-earth** — Remove every ADR (strongly discouraged)

**Warning**: Historical ADRs are the reasoning trail of the project. They should almost never be deleted — even superseded ADRs carry meaning. Confirm before removing anything under `docs/adr/NNNN-*.md`.

## Step 2: Keep Historical ADRs (Default)

Do **not** remove files matching `docs/adr/[0-9]*.md`. These are authored decisions and must be preserved as immutable history even if the tooling goes away.

## Step 3: Remove the PR Nudge Workflow

```bash
rm -f .github/workflows/adr-nudge.yml
```

If the nudge job was added to an existing workflow, remove only that job.

## Step 4: Remove the Template (Optional)

Only if the user confirms:

```bash
rm -f docs/adr/template.md
```

If `adr new` is still in use, leaving the template in place is recommended.

## Step 5: Uninstall adr-tools

### macOS

```bash
brew uninstall adr-tools
```

### Linux (manual install)

```bash
sudo rm -f /usr/local/bin/adr
sudo rm -f /usr/local/bin/_adr*
```

### log4brains

```bash
npm uninstall log4brains
rm -rf .log4brains/
rm -f .log4brains.yml
```

## Step 6: Remove `.adr-dir`

```bash
rm -f .adr-dir
```

## Step 7: Remove npm Scripts

Edit `package.json` and delete the `adr:*` scripts.

## Step 8: Remove README Link (If No Longer Relevant)

If `docs/adr/` is being removed entirely (strongly discouraged), remove the link from `README.md`. Otherwise leave it — the ADRs are still valuable reference material.

## Step 9: Clean Up log4brains Static Output

```bash
rm -rf .log4brains/out/
```

If the static site was published to GitHub Pages / Netlify / S3, take down the deployment separately.

## Step 10: Remove Processes

```bash
rm -rf .a5c/processes/adr
```

## Step 11: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name adr --project --json
```

## Notes

- Superseded ADRs reference each other via `Superseded by [NNNN](NNNN-...md)` links — if ADRs are removed, those references break
- Even projects that abandon ADR tooling usually keep the historical records; the decision trail outlives the tool
- If migrating to a different decision-record system (RFCs, design docs in Notion, etc.), export the existing ADRs first
- GitHub search / blame history on `docs/adr/*.md` remains useful even without tooling
