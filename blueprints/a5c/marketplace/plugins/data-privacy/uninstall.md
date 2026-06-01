# data-privacy — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter privacy processes but keep scans and checklists
2. **Everything** — Remove all scripts, docs, workflow, and processes
3. **Selective** — Let the user choose which layers to remove

**Warning**: `docs/data-map.md` and `docs/privacy-checklist.md` are often regulatory artifacts. Confirm before deleting — archive separately if needed.

## Step 2: Remove PII Detection

```bash
pip uninstall presidio-analyzer presidio-anonymizer
# spaCy models are large — keep unless clearly unused
rm -f scripts/pii-scan.py
```

Remove `privacy:pii` from `package.json` scripts.

## Step 3: Remove Data Classification Map

**Only if the user confirms** — this is often a compliance artifact:

```bash
rm -f docs/data-map.md
```

Prefer to archive (move to `docs/archive/`) instead of deleting.

## Step 4: Remove GDPR/CCPA Checklist

Similarly — archive rather than delete unless the user is certain:

```bash
rm -f docs/privacy-checklist.md
```

## Step 5: Remove Fixtures PII Gate

```bash
rm -f scripts/fixtures-pii-gate.sh
```

Remove `privacy:fixtures` from scripts.

## Step 6: Remove Schema-Change Gate

```bash
rm -f scripts/schema-change-requires-checklist.sh
```

Remove `privacy:schema-gate` from scripts.

## Step 7: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/data-privacy.yml
```

## Step 8: Remove Processes

```bash
rm -rf .a5c/processes/data-privacy
```

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name data-privacy --project --json
```

## Notes

- Privacy documentation removed from source control may still be required by regulation — ensure a replacement exists before removal
- Fixtures that previously passed the PII gate are not re-scanned after uninstall — run a final scan before removal if desired
- If the schema-change gate was a required branch protection check, update branch protection
