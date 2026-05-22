# repo-archival — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `reason` | `superseded`, `sunset`, `merged`, `abandoned`, `open-sourced` | `sunset` | README template + notification |
| `successorUrl` | URL | (empty) | README + MIGRATION + notification |
| `noticeWindowDays` | integer | `14` | checklist timeline |
| `exportDeps` | `on`, `off` | `on` | `export-deps.sh` |
| `exportCi` | `on`, `off` | `on` | `export-ci.sh` |
| `notifyChannels` | csv of `github,slack,email,npm,pypi` | `github,npm` | `notify.sh` |
| `finalReleaseRequired` | `on`, `off` | `on` | checklist gate |
| `issueLabelOnArchive` | label name | `archived` | checklist step |
| `transferOpenPRs` | `on`, `off`, `prompt` | `prompt` | checklist step |
| `archiveDate` | YYYY-MM-DD | (set by user) | `notify.sh` env |
| `preserveBranchProtection` | `on`, `off` | `on` | GitHub archive is implicit read-only |

## 2. Set the Reason

Pick the tone by reason:

### Superseded

Emphasize continuity: successor link, migration guide required, API mapping table.

```markdown
> This project is archived and has been replaced by [<successor>](<link>).
> See the [migration guide](./docs/archive/MIGRATION.md).
```

### Sunset

Emphasize finality: no replacement, alternatives (if any), final release notes.

```markdown
> This project is archived and is no longer maintained.
> There is no direct replacement. Consider [alternative A](<link>) or [alternative B](<link>).
```

### Abandoned

Plain and neutral:

```markdown
> This project has been archived due to lack of active maintenance.
> Forks are welcome. The final state reflects the last commit before archival.
```

## 3. Custom Notification Channels

Edit `scripts/archival/notify.sh`:

```bash
# Add custom webhook
if [ -n "${DISCORD_WEBHOOK:-}" ]; then
  curl -X POST "$DISCORD_WEBHOOK" \
    -H 'Content-type: application/json' \
    -d "$(jq -Rs '{content: .}' <<< "$MESSAGE")"
fi

# Add email via mailx / sendgrid / ses
if [ -n "${MAILING_LIST:-}" ]; then
  echo "$MESSAGE" | mailx -s "[Archival] $REPO" "$MAILING_LIST"
fi
```

## 4. Longer / Shorter Notice Window

Edit `ARCHIVAL.md` and replace the `T-14` / `T-7` / `T-3` / `T-1` markers. For well-adopted projects, 30–60 days notice is courteous. For internal tooling, 1–7 days is often sufficient.

## 5. Skip Final Release

Not recommended. If the project has no formal releases (e.g., a pure GitHub Pages site):

```markdown
# In ARCHIVAL.md
## 2. Final release — N/A (this project has no release artifacts)
```

Still create a git tag for the final commit:

```bash
git tag archive/YYYY-MM-DD -m "Final state before archival"
git push --tags
```

## 6. Automated Transfer of Open PRs

For large PR backlogs, use `gh`:

```bash
# Comment on every open PR
gh pr list --state open --json number -q '.[].number' | while read -r n; do
  gh pr comment "$n" --body "This repo is being archived on $ARCHIVE_DATE. This PR will be closed. If the work is still relevant, please reopen it in <successor-link>."
done

# Close them all
gh pr list --state open --json number -q '.[].number' | xargs -I {} gh pr close {}
```

## 7. Auto-label Issues as Archived

```bash
gh issue list --state open --json number -q '.[].number' | \
  xargs -I {} gh issue edit {} --add-label archived
```

## 8. Export Richer Dependency Info

### Node — include transitive resolution details

```bash
npm ls --all --json --long > docs/archive/dependency-graph-detailed.json
npm audit --json > docs/archive/final-audit.json
```

### Python

```bash
pip-licenses --format=json --output-file=docs/archive/licenses.json
```

## 9. Link the Archive from the Successor

In the successor repo's README, add:

```markdown
> This project supersedes [<archived-repo>](<archived-link>).
> See the [migration guide](<archived-link>/blob/main/docs/archive/MIGRATION.md).
```

## 10. npm / PyPI Deprecation Messages

### npm

```bash
npm deprecate '<pkg>@<=X.Y.Z' \
  'This package is archived as of YYYY-MM-DD. See <successor-url>.'
```

Use a version range to deprecate all existing versions.

### PyPI

PyPI supports per-version yanking via the web UI (Manage → Yank). There is no global "deprecate package" equivalent; the canonical approach is a final release that emits a `DeprecationWarning` at import:

```python
import warnings
warnings.warn(
    "This package is archived as of YYYY-MM-DD. See <successor-url>.",
    DeprecationWarning,
    stacklevel=2,
)
```

## 11. Post-archival Audit

After archival, run a process that verifies all closure steps actually happened:

```bash
babysitter run:create \
  --process-id repo-archival-verify \
  --entry .a5c/processes/repo-archival/verify.js#process \
  --prompt "Verify the repo is archived, README redirect committed, deps exported, and stakeholders notified" \
  --json
```
