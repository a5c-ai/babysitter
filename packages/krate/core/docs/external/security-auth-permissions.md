# Security, auth, and permissions

## Purpose

External backend integration introduces provider tokens, webhooks, native permissions, and bidirectional writes. This document defines the security model.

## Auth principles

- Prefer GitHub Apps over PATs.
- Store app IDs, private keys, webhook secrets, and client secrets in Kubernetes Secrets.
- Never store provider access tokens in resource status.
- Installation tokens are short-lived and cached in memory only when possible.
- User-attributed writes require both Krate authorization and provider user authorization.

## Secret resources

```yaml
kind: Secret
metadata:
  name: github-app-a5c
  namespace: krate-org-a5c
type: Opaque
stringData:
  app-id: "..."
  private-key.pem: "..."
  webhook-secret: "..."
```

`ExternalBackendProvider.spec.authRef` points to the Secret. UI displays only Secret name/key metadata.

## Permission checks

Every write requires:

1. Krate org/RBAC permission;
2. provider binding allows interface and write mode;
3. provider credentials have required native permission;
4. actor attribution policy is satisfied;
5. approval policy is satisfied for agents or high-risk writes;
6. audit event is emitted.

## Webhook security

- Require HTTPS in production.
- Validate provider signature before parsing payload.
- Enforce replay/dedupe by delivery ID and timestamp where available.
- Queue processing after quick 2XX response.
- Store raw payloads only according to retention and redaction policy.
- Avoid logging headers or payload fields containing secrets.

## No-leak requirements

Provider secrets and tokens must not appear in:

- API responses;
- resource status;
- Kubernetes events;
- sync events;
- logs;
- UI;
- browser traces;
- memory/context bundles;
- test artifacts.

## Agent interactions

Agents may propose external writes, but Krate owns approval and execution. Agent write-back to GitHub issues, PRs, checks, comments, labels, or branch updates must produce an `ExternalWriteIntent` and pass approval policy unless explicitly trusted.

## Audit fields

Audit external operations with:

- org and namespace;
- provider and binding;
- interface;
- actor and optional provider user;
- native object ID/URL;
- action;
- write intent ID;
- result;
- digest of request/response with secrets removed.
