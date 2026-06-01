# runbooks — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter processes but keep `docs/runbooks/` content
2. **Everything** — Remove the `docs/runbooks/` tree, alert annotations, and README links
3. **Selective** — Let the user choose specific categories

**Warning**: Removing runbooks strips responders of their only lifeline at 3AM. Strongly recommend keeping the `docs/runbooks/` tree even after uninstalling the plugin. Confirm with the user before deleting content.

## Step 2: Decide What to Preserve

Ask explicitly:

- Keep `services/*.md` that were hand-edited? (default: **yes**)
- Keep `postmortems/` history? (default: **yes** — historical record)
- Keep `on-call/integration-status.md`? (default: yes)

Only remove the scaffolding that is clearly unedited or clearly undesired.

## Step 3: Remove Scaffolded Templates

```bash
# Only remove files that match the shipped templates byte-for-byte
rm -f docs/runbooks/services/template.md
rm -f docs/runbooks/incidents/severity.md
rm -f docs/runbooks/incidents/comms-templates.md
rm -f docs/runbooks/on-call/rotation.md
rm -f docs/runbooks/postmortems/template.md
```

If no runbooks were ever filled in, it is safe to remove the tree:

```bash
rm -rf docs/runbooks
```

## Step 4: Remove Alert Annotations

If the plugin added `runbook_url` annotations to Prometheus rules, grep and review:

```bash
grep -rn "runbook_url" prometheus/ alerts/ 2>/dev/null
```

Remove only the lines that reference the removed runbook paths. **Do not remove** annotations that point to valid external runbooks.

## Step 5: Remove PagerDuty / Opsgenie Links

Review alerting integration code or Terraform:

```bash
grep -rn "runbook" terraform/ infra/ 2>/dev/null
```

Remove `links[].href` entries or `details.runbook` fields that point to deleted pages.

## Step 6: Remove README Link

Edit top-level `README.md` and remove the "On-call / Operations" section if the `docs/runbooks/` tree was deleted.

## Step 7: Remove Processes

```bash
rm -rf .a5c/processes/runbooks
```

## Step 8: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name runbooks --project --json
```

## Notes

- Postmortem history is organizational memory — do not delete unless the user explicitly opts in
- If the paging provider dashboard shows broken runbook links after uninstall, update the integration to point elsewhere or unset the link field
- Service catalog entries (Backstage `catalog-info.yaml`) may reference runbook URLs — check and update manually
