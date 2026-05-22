# Fixtures and test data

## Principles

- Fixtures are deterministic and committed to the repo.
- Fixtures must never contain real secrets, tokens, private keys, customer data, or personal data beyond synthetic examples.
- Secret-like synthetic values should be clearly marked and used only to test redaction.
- Every fixture has an owner and purpose.
- Fixtures should be small enough to understand in a test failure.

## Core fixtures

| Fixture | Purpose |
| --- | --- |
| default org | simple org and namespace for current tests. |
| duplicate org repos | route ambiguity and cross-org denial. |
| repository with PR/issue/pipeline | core forge E2E path. |
| webhook delivery set | success, retry, replay, signature mismatch. |
| runner pool/job set | trusted/untrusted runner policy. |
| deployment/OAM set | environment, promotion, rollback. |
| company brain memory repo | graph/Markdown/frontmatter/search fixtures. |
| `.a5c` run fixture | Babysitter run import and redaction. |
| Agent Mux session fixture | session binding, transcript summary, events. |

## Directory proposal

```text
tests/fixtures/
  orgs/
  repositories/
  resources/
  webhooks/
  runners/
  deployments/
  agents/
  memory/
    company-brain/
    a5c-runs/
    sessions/
  browser/
```

## Redaction fixture requirements

Redaction fixtures should include synthetic values that look like:

- API keys;
- bearer tokens;
- private key headers;
- kubeconfig snippets;
- webhook signatures;
- high-entropy strings.

Tests assert these values do not appear in prompt previews, context bundles, memory imports, transcripts, artifacts, API responses, UI, or audit records.

## Fixture review checklist

- No real credentials.
- No real customer data.
- Org labels and namespace fields included.
- Expected status conditions documented.
- Stable timestamps and IDs.
- Cross-platform paths where possible.
