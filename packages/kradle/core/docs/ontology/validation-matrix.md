# Validation Matrix

| Requirement | Ontology | Implementation | Validation |
| --- | --- | --- | --- |
| CRD vs aggregated storage | `resource-taxonomy.md`, `storage-and-data-boundaries.md` | `src/resource-model.js`, `src/control-plane.js` | storage tests, `validate-doc-coverage.mjs` |
| RBAC and admission | `policies-and-invariants.md` | `src/identity-policy.js`, `src/control-plane.js` | RBAC/admission tests |
| Warm Gitea receive path | `workflows.md`, `storage-and-data-boundaries.md` | `src/data-plane.js` | Gitea backend tests |
| BranchProtection and RefPolicy | `resource-contracts.md`, `events-and-hooks.md` | `src/data-plane.js` | protected branch/ref tests |
| Fork CI isolation | `runners-and-ci.md` | `src/runners-ci.js` | runner scheduler tests |
| Webhook signing/replay | `events-and-hooks.md` | `src/hooks-events.js` | webhook bus tests |
| UI YAML transparency | `web-ui-excellent-flows.md` | `src/web-ui.js` | smoke assertions |
| Backup/restore/release gates | `operations-and-release.md` | `src/operations.js`, `scripts/build.mjs`, `scripts/smoke.mjs` | `npm run check` with docs and ontology coverage |

## Local validation commands

- `npm run build`
- `npm run validate:docs`
- `npm test`
- `npm run smoke`
- `npm run check`

## Green definition

The project is green only when all ontology files exist, coverage terms are found in docs and source, tests pass, smoke assertions pass, and the Babysitter run returns a successful completion proof.
