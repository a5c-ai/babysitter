# data-privacy — Install Instructions

Set up data privacy feedback loops — PII detection via Microsoft Presidio or `detect-pii`, a data classification audit that maps fields to categories (PII / PHI / financial / public), and a GDPR/CCPA readiness checklist enforced in CI. Stack-agnostic with Python-first detection tooling.

## Step 1: Interview the User

### Stage 1: Project Analysis

1. Detect language(s): Node, Python, Go, etc.
2. Discover data-handling locations: `models/`, `schemas/`, `*.prisma`, `*.sql`, `migrations/`, OpenAPI spec
3. Check for existing data-classification artifacts: `data-map.md`, `dpia.md`, `gdpr-checklist.md`, `PRIVACY.md`
4. Check existing PII tooling: `presidio-analyzer`, `detect-pii`, `@scanoss/scanner`
5. Check for fixtures/seed data that may contain real PII: `fixtures/`, `seed.sql`, `test-data/`
6. Summarize findings to the user

### Stage 2: Layers

Ask the user which layers to install (multi-select):

1. **PII detection in code + logs** — Presidio or detect-pii against source + sample log snapshots
2. **Data classification audit** — Generate `data-map.md` template mapping fields to categories
3. **Fixtures PII scan** — Fail CI if fixtures/seed files contain real-looking PII
4. **GDPR/CCPA checklist gate** — Require checklist updates when schemas change
5. **All** — Install every layer

### Stage 3: Jurisdictions

Ask:
- Applicable regimes? (`GDPR`, `CCPA/CPRA`, `HIPAA`, `LGPD`, `PIPEDA` — default: pick based on user/audience)
- Default DSAR response window? (GDPR: 30 days; CCPA: 45 days)
- Data retention default? (default: `365 days` with per-field overrides)

## Step 2: Install PII Detection (Presidio)

```bash
pip install presidio-analyzer presidio-anonymizer
python -m spacy download en_core_web_lg
```

Create `scripts/pii-scan.py`:

```python
import sys, pathlib
from presidio_analyzer import AnalyzerEngine

analyzer = AnalyzerEngine()
EXTS = {".md", ".txt", ".log", ".json", ".yaml", ".yml", ".csv"}
SKIP = {"node_modules", "dist", ".next", ".git", "__pycache__"}

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
findings = 0
for p in root.rglob("*"):
    if any(part in SKIP for part in p.parts):
        continue
    if p.suffix not in EXTS or not p.is_file():
        continue
    try:
        text = p.read_text(errors="ignore")
    except Exception:
        continue
    results = analyzer.analyze(
        text=text,
        entities=["EMAIL_ADDRESS", "PHONE_NUMBER", "CREDIT_CARD", "US_SSN",
                 "IP_ADDRESS", "IBAN_CODE", "PERSON"],
        language="en",
    )
    if results:
        findings += len(results)
        for r in results:
            print(f"{p}:{r.start} {r.entity_type} score={r.score:.2f}")

if findings:
    print(f"PII findings: {findings}", file=sys.stderr)
    sys.exit(1)
```

Add script:

```json
{ "scripts": { "privacy:pii": "python scripts/pii-scan.py ." } }
```

### Lightweight alternative (detect-pii / Node)

```bash
npm install -D @microsoft/presidio-anonymizer-js  # or a regex-based detector
```

## Step 3: Generate Data Classification Template

Create `docs/data-map.md`:

```markdown
# Data Classification Map

| Field | Store | Category | Regime | Retention | Lawful Basis | Notes |
|-------|-------|----------|--------|-----------|--------------|-------|
| users.email | postgres.users | PII | GDPR/CCPA | 365d | Contract | Encrypted at rest |
| users.phone | postgres.users | PII | GDPR/CCPA | 365d | Contract | Optional |
| users.dob | postgres.users | PII | GDPR | 365d | Consent | Age verification |
| payments.card_last4 | postgres.payments | Financial | PCI | 7y | Legal obligation | |
| events.ip | clickhouse.events | PII | GDPR | 90d | Legitimate interest | |

## Categories
- **PII** — personally identifiable information
- **PHI** — protected health information
- **Financial** — cards, bank, transactions
- **Public** — non-sensitive
- **Internal** — business-confidential, non-personal
```

## Step 4: GDPR/CCPA Checklist

Create `docs/privacy-checklist.md`:

```markdown
# Privacy Checklist

- [ ] `data-map.md` updated for every new field in user-visible models
- [ ] DSAR (Data Subject Access Request) endpoint implemented: `GET /me/export`
- [ ] Deletion endpoint implemented: `DELETE /me` (cascading + soft-delete clearly documented)
- [ ] Retention policy defined per field in `data-map.md`
- [ ] Encryption in transit (TLS) and at rest (disk encryption + column-level where applicable)
- [ ] Consent captured at collection point and stored with timestamp
- [ ] Privacy policy URL reachable and matches implemented behavior
- [ ] Third-party data processors listed (Stripe, Sentry, Datadog, etc.) with DPAs on file
- [ ] Cookie banner / consent management for CCPA "Do Not Sell" and GDPR opt-in
- [ ] Breach notification process documented (72h GDPR / state-specific for CCPA)
- [ ] PII not logged (see logger redaction config)
- [ ] Test fixtures contain synthetic data only
```

## Step 5: Fixtures PII Gate

Create `scripts/fixtures-pii-gate.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
dirs=(fixtures test-data seed seeds)
for d in "${dirs[@]}"; do
  [ -d "$d" ] || continue
  python scripts/pii-scan.py "$d" || {
    echo "::error::PII detected in $d — use synthetic data"
    exit 1
  }
done
```

```json
{ "scripts": { "privacy:fixtures": "bash scripts/fixtures-pii-gate.sh" } }
```

## Step 6: Require Checklist Update on Schema Change

Add a CI check that compares PR changes:

```bash
# scripts/schema-change-requires-checklist.sh
set -euo pipefail
base=${GITHUB_BASE_REF:-main}
git fetch origin "$base" --depth=1
schema_changed=$(git diff --name-only "origin/$base"...HEAD | grep -E '(schema\.prisma|migrations/|models/|schemas/)' || true)
map_changed=$(git diff --name-only "origin/$base"...HEAD | grep -E 'docs/data-map\.md|docs/privacy-checklist\.md' || true)

if [ -n "$schema_changed" ] && [ -z "$map_changed" ]; then
  echo "::error::Schema changed but data-map.md/privacy-checklist.md not updated"
  echo "Changed schema files:"
  echo "$schema_changed"
  exit 1
fi
```

```json
{ "scripts": { "privacy:schema-gate": "bash scripts/schema-change-requires-checklist.sh" } }
```

## Step 7: Create GitHub Actions Workflow

Create `.github/workflows/data-privacy.yml`:

```yaml
name: Data Privacy

on:
  pull_request:
  push:
    branches: [main]

jobs:
  pii-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: |
          pip install presidio-analyzer presidio-anonymizer
          python -m spacy download en_core_web_lg
      - run: python scripts/pii-scan.py .

  fixtures-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install presidio-analyzer && python -m spacy download en_core_web_lg
      - run: bash scripts/fixtures-pii-gate.sh

  schema-gate:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - run: bash scripts/schema-change-requires-checklist.sh
```

## Step 8: Run Baseline

```bash
npm run privacy:pii || true
npm run privacy:fixtures || true
```

Report findings and point the user at `docs/data-map.md` to begin classification.

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name data-privacy --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. `python scripts/pii-scan.py .` runs without dependency errors
2. `docs/data-map.md` and `docs/privacy-checklist.md` exist
3. Fixtures gate passes or flags PII
4. Schema-gate fails PRs that change schema without updating privacy docs
5. Workflow committed at `.github/workflows/data-privacy.yml`

## Reference

- Microsoft Presidio: https://microsoft.github.io/presidio/
- GDPR text: https://gdpr-info.eu/
- CCPA/CPRA: https://oag.ca.gov/privacy/ccpa
- NIST Privacy Framework: https://www.nist.gov/privacy-framework
