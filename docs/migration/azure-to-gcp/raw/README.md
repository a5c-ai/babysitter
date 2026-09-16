# Raw inventory dumps (read-only, 2026-09-16)

Produced by task `azure-inventory` of the `azure-to-gcp-migration` run. Re-run the `_collect*.sh` scripts to refresh; diff against these files.

| Dir | Contents | Notes |
|---|---|---|
| `azure/` | `az … -o json` per command (`_collect.sh` base pass, `_collect-detail.sh` + `_collect-detail2.sh` detail passes), `acr-tags/` per-repo tag lists + newest manifests, `_resources-by-rg.tsv`, `_acr-hub-summary.tsv` | No `keys list`, no secret values. `*.err` files keep the exact error of failed commands (mostly foreign-tenant Key Vault AKV10032). |
| `k8s/` | `kubectl get … -A -o json` per resource kind, `secrets-names.txt` (namespace/name/type only), `configmaps-names.json`, `crds-names.json`, `helm-list.json`, `helm-history-*.json`, `helm-values-redacted-*.json` (every string leaf replaced by `<string>`), `top-*.json`, `events-warning.json` | Pods/Deployments JSON contain env var NAMES with `secretKeyRef`; verified no literal secret values. |
| `dns/` | `a5c-ai-lookups.tsv` (A/CNAME via 8.8.8.8), `a5c-ai-ns.txt`, `http-probes.tsv` (HTTPS status codes) | Wildcard `*.a5c.ai` confirmed with a random label. |
| `github/` | repo metadata, deploy workflow run history, workflows per repo | via `gh api`. |

Gotcha: Windows `jq` emits CRLF. Any `$(jq -r …)` word list must be piped through `tr -d '\r'` or `az` silently receives `name\r` (pass 1 lost all but the last element of every loop).
| `gcp/` | `gcloud-auth-check.txt` (sanitized transcript of the 2026-09-16 auth probe: expired `tal@muskal.net` token, stale ADC, SDK 405.0.1), `inventory.sh` (read-only project inventory to run after re-auth; writes `<command>.json` / `.err` + `_summary.tsv` here) | Produced by task `gcp-readiness`. Project `boot-464019` was NOT inventoried yet — auth blocked (see `../03-gcp-readiness.md`). Secret Manager is listed by name only. |
