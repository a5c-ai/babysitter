# data-privacy — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `piiEntities` | list | `[EMAIL_ADDRESS,PHONE_NUMBER,CREDIT_CARD,US_SSN,IP_ADDRESS,IBAN_CODE,PERSON]` | `scripts/pii-scan.py` |
| `piiMinScore` | `0.0`–`1.0` | `0.5` | Presidio analyzer threshold |
| `piiLanguage` | locale | `en` | spaCy model |
| `piiExtensions` | list | `[.md,.txt,.log,.json,.yaml,.yml,.csv]` | pii-scan.py |
| `piiSkipDirs` | list | `[node_modules,dist,.next,.git]` | pii-scan.py |
| `jurisdictions` | `GDPR`,`CCPA`,`CPRA`,`HIPAA`,`LGPD`,`PIPEDA` | detected | `privacy-checklist.md` |
| `defaultRetention` | duration | `365d` | `data-map.md` |
| `dsarWindow` | days | `30` (GDPR) / `45` (CCPA) | checklist |
| `schemaPaths` | glob list | `[schema.prisma,migrations/,models/,schemas/]` | schema-gate script |
| `ciGate` | `off`, `warn`, `error` | `error` | workflow |

## 2. Extend Detected Entities

Edit `scripts/pii-scan.py`:

```python
results = analyzer.analyze(
    text=text,
    entities=[
        "EMAIL_ADDRESS", "PHONE_NUMBER", "CREDIT_CARD", "US_SSN",
        "IP_ADDRESS", "IBAN_CODE", "PERSON", "LOCATION",
        "DATE_TIME", "NRP", "US_DRIVER_LICENSE", "MEDICAL_LICENSE",
    ],
    language="en",
    score_threshold=0.6,
)
```

## 3. Add Custom Entity Recognizer

```python
from presidio_analyzer import PatternRecognizer, Pattern

internal_id = PatternRecognizer(
    supported_entity="INTERNAL_ID",
    patterns=[Pattern(name="internal", regex=r"\bINT-\d{8}\b", score=0.9)],
)
analyzer.registry.add_recognizer(internal_id)
```

## 4. Scope the Scan

For large repos, restrict scan to high-risk directories:

```bash
python scripts/pii-scan.py src/
python scripts/pii-scan.py logs/sample/
```

Exclude generated or vendor dirs:

```python
SKIP = {"node_modules", "dist", ".next", ".git", "__pycache__",
        "vendor", "third_party", "generated"}
```

## 5. Tune PII Score Threshold

Lower score = more findings (more false positives). Start at `0.5`, tighten to `0.7` once cleaner:

```python
results = analyzer.analyze(text=text, entities=[...], language="en",
                           score_threshold=0.7)
```

## 6. Adjust Retention Per Field

Edit `docs/data-map.md` and set per-row retention:

```markdown
| users.last_login_ip | postgres.users | PII | GDPR | 30d | Legitimate interest | |
| analytics.session   | clickhouse     | PII | GDPR | 90d | Consent | pseudonymized |
```

## 7. Checklist Enforcement Policy

Require checklist update when specific paths change:

```bash
# scripts/schema-change-requires-checklist.sh
schema_paths='(schema\.prisma|migrations/|models/|schemas/|graphql/.*\.graphql)'
```

Expand to any file that defines user-visible data.

## 8. Integrate with Logger Redaction

Make sure PII-logging prevention is in place (pairs with `observability` plugin):

```typescript
logger = pino({
  redact: {
    paths: ['*.email', '*.phone', '*.ssn', '*.password',
            '*.creditCard', '*.ip', 'req.headers.authorization'],
    censor: '[REDACTED]',
  },
});
```

## 9. Run Privacy Audit Process

```bash
babysitter run:create \
  --process-id privacy-audit \
  --entry .a5c/processes/data-privacy/audit.js#process \
  --prompt "Update data-map.md for all recently added fields, flag any PII fields lacking retention, verify DSAR and deletion endpoints exist" \
  --json
```

## 10. DSAR Endpoint Stub

Scaffold DSAR endpoints in the preferred framework. For Fastify:

```typescript
app.get('/me/export', { preHandler: [authenticate] }, async (req, reply) => {
  const data = await collectUserData(req.user.id);
  reply.header('content-type', 'application/json');
  reply.header('content-disposition', 'attachment; filename="export.json"');
  return data;
});

app.delete('/me', { preHandler: [authenticate] }, async (req, reply) => {
  await queueDeletion(req.user.id, { gracePeriodDays: 30 });
  return { status: 'scheduled', completesBy: '...' };
});
```

Reference the deletion flow in `privacy-checklist.md` so auditors can trace implementation to policy.
