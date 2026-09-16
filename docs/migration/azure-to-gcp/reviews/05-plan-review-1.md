# Review 1 of `05-migration-plan.md` + `06-verification-checklist.md` — adversarial completeness + safety review

Date: **2026-09-16**. Reviewer role: adversarial migration reviewer. Reviewed: [`../05-migration-plan.md`](../05-migration-plan.md) (584 lines, 12:36) and [`../06-verification-checklist.md`](../06-verification-checklist.md) (227 lines, 12:41) against [`../01-azure-inventory.json`](../01-azure-inventory.json) (26 systems, 33 RGs), [`../02-source-origins.json`](../02-source-origins.json) (26 origins, couplings C1–C18, corrections geekonomy = `Benihakak/geekonomy`, benchmarks/tb-fleet/trial-telemetry = `MantisOS/babysitter-benchmarks`), [`../04-target-architecture.md`](../04-target-architecture.md) rev 2.1 and [`../03-gcp-readiness.md`](../03-gcp-readiness.md) §3.1/§3.2 (the reuse audit and the owner decisions received 2026-09-16). Nothing was run against Azure or GCP (no `gcloud auth`, no `az`); nothing was changed outside this file; no secret value appears here.

Independently verified in the `staging` checkout (`57b13a4c5`) for this review: every test file named in A.1 exists (`packages/atlas/webui/tests/atlas-deploy-postgres-workflow.test.ts`, `packages/kradle/core/tests/{deployment,agent-workspace-controller,agent-dispatch-controller,assistant-runtime}.test.js`, `packages/kradle/installer/tests/plans.test.ts`, `packages/adapters/cli/tests/live-stack/{scenario-contract.ts,primary-live-runner.test.ts}`); the npm scripts the plan runs exist (`test:kradle` = `npm run test --workspace=@a5c-ai/kradle` → `node --test tests/*.test.js`; atlas `test:smoke` = vitest; installer `test` = vitest; kradle core `e2e` = `node --test tests/e2e/*.test.js`, which today holds only `lifecycle.test.js`); `publish.yml` job ids/names/lines match (`deploy_atlas_webui` L1748 "Deploy Atlas WebUI To AKS", `deploy_kradle` L2205 "Deploy Kradle To AKS", `helm uninstall kubevela` L2433, `gitea.persistence.type=emptyDir` L2502, "Post-deploy E2E smoke (non-blocking)" L2541, `e2e_smoke_kradle` L2546, `g0_rt_jitsi_e2e` L2643, `deploy_staging_cloud` L2683, four `:latest` occurrences); `deployment.test.js:506` pins `'Deploy Kradle To AKS'` inside the test at L469; chart `values.yaml` has `image.controller`/`image.web` (L25/29), `global.imagePullSecrets` (L13), `storageClassName: standard` (L37), `assistant.existingSecret` (L94), `serviceAccount` (L112), `networkPolicy` (L126), `agents` (L479); `deployments.yaml:463` `ATLAS_BASE_URL`. The setup-minikube path cited in T8 is `packages/kradle/core/scripts/setup-minikube.mjs`, not `scripts/setup-minikube.mjs` (moot — T8 is removed below).

## Verdict: **NOT APPROVED** (`approved = false`)

The plan is structurally strong — every inventory system and every origin is covered, the N-1..N-7 corrections are carried in, secrets provenance / OAuth callbacks / TTL lowering / gates / rollback are all present — but it was written before the three owner decisions of 2026-09-16 (03 §3.2) and conflicts with all three in load-bearing places. Those conflicts change the phase order, the trigger of the first real deploy, the content of Phase A, Phase D and Phase E, ten checklist rows and the OB-1 gate. They are listed first (B-1..B-3) with the exact lines and the required rewrite. A second group (R-1..R-8) are checklist failures independent of the owner decisions. Nits follow. Nothing here changes a disposition in 04 except the two the owner superseded (D-16, D-21).

---

## B — Blocking: conflicts with the owner decisions of 2026-09-16

### B-1 Branch model: there is no `migrate/azure-to-gcp` branch and no "merge the Phase A PR" step; the first push of GKE-targeting workflow changes to `staging` **is** the staging deploy

Owner constraint (03 §3.2 / task context `ownerConstraints[0]`): environments are branch-tied — babysitter changes go directly to `staging` (CI deploys the `*-staging` environments) and are promoted to `main` (production). Downtime is acceptable. No feature branch, no dual-deploy/coexistence machinery.

Consequence the plan does not draw: because a push to `staging` triggers `publish.yml` → `deploy_atlas_webui` + `deploy_kradle` immediately, **Phase B (GCP foundation) and Phase C (GitHub variables) must be complete before the first push of the Phase A commits**, otherwise the rewritten jobs run against non-existent variables/cluster and fail (loudly — the "Check deployment configuration" step — but it is still a broken staging deploy for nothing). The plan today has A in parallel with B and gates D on "merge of the Phase A PR", which is the opposite ordering.

Every place that conflicts (05 unless noted):

| Where | Text today | Required change |
|---|---|---|
| §0 ground rule 6 | "OB-1 plan approval (before Phase A merges anything to `staging`)" | OB-1 = approval of this plan **before the docs commit and before any `terraform apply`**; it is no longer tied to A.12 |
| §0 chain diagram (L17–22) and the wave mapping (L25) | `A source (babysitter, branch migrate/azure-to-gcp)` in parallel with B; `C → D` after both | Replace with the owner's order: **OB-1 → commit 03/04/05/06 docs on `staging` → B (infra-seed fix, infra platform, infra addons) → C (org/repo variables + Secret Manager values for BOTH envs) → A committed locally on `staging` in A.1..A.10 order, A.11/A.12 verified locally, then ONE push (= D.1/D.2 staging deploy) → promote `staging` → `main` (= D.3/D.4 prod deploy) → other repos D.5–D.13 → data (E.1 imports; E.0 exports are read-only and may start as soon as B's buckets exist — say so explicitly as the only deviation from the literal order) → F parallel-run → OB-2 → G cutover → OB-3 → H** |
| §0 intro (L31) | "Phase A (source changes) needs only 0.5 and 0.6" | Phase A needs **all** of §0, Phase B exit and Phase C exit, because its push deploys |
| §1 heading + intro (L49–51) | branch, "one PR to `staging`", "merges only after OB-1", "`ci.yml` … dispatch it manually" on the PR | "Commits are made on `staging` locally, one per sub-section, and **not pushed** until B and C are green and A.12 is PASS; the push is the D.1/D.2 trigger. `ci.yml` is `pull_request`-only: dispatch it after the push with `gh workflow run ci.yml --ref staging`." Add the workstation warning from memory: **a hook on this machine auto-commits and pushes edits to the current branch** — Phase A must therefore run only after Phase C, in one session, and every intermediate push is a real staging deploy (acceptable as downtime, never silent: the ESO `wait` step and the config check fail the job) |
| A.9 (L242) | "commit 6 — after OB-1 confirms D-7" | D-7 is confirmed at OB-1, which now precedes everything; A.9 is simply commit 6 |
| A.11 last line (L289), A.12 (3)/(4)/(5) (L293) | `--ref migrate/azure-to-gcp`; `git diff staging...migrate/azure-to-gcp` | `--ref staging` after the push; diffs against the docs commit: `git diff <docs-commit-sha>...HEAD` |
| §4 preconditions (L394) | "Phase A PR merged to `staging` (OB-1)" and the D.0 staging-secret entry as a Phase D precondition | Secret Manager values (staging **and** prod — see B-1.b) are entered in **Phase C**, before the A push; D's precondition is "Phase A pushed" |
| D.1 trigger (L398) | "merge of the Phase A PR into `staging`" | "the Phase A push to `staging`" |
| D.3 (L400) | "Phase E.1 import verified for `atlas` first, then merge `staging` → `main`" | Owner order is promote first, then data: D.3 = promote (the fresh db-init runs), **then** E.1.2 restore replaces the initialised schema (the E.0.2 row already describes exactly that sequence) — make D.3 and E.1 agree |
| §9.1 P-3 (L549) | "while the Phase A PR is open … implementer works on `migrate/azure-to-gcp`" | Rewrite: no other run may edit `publish.yml`/charts on `staging` between the docs commit and the Phase A push; the auto-push hook is the concrete hazard |
| §9.2 Phase A (L558) | `git branch -D migrate/azure-to-gcp` | `git revert` of the Phase A commits on `staging` and push (that push redeploys the Azure workflow on AKS — Azure variables/secrets still exist until H.4, so this restores Azure serving) |
| §9.3 OB-1 (L571) | "after A.12 PASS, before the Phase A PR merges" | "before the docs commit / any apply; A.12 is a verifier gate before the Phase A push, not an owner breakpoint" |
| 06 Phase A heading (L30), X-A.1 (L34), X-A.18 (L51), X-A.19 (L52), X-A.22 (L55) | all `migrate/azure-to-gcp` | X-A.1: `git log --format='%h %s' <docs-commit>..HEAD` on `staging` (first line is the tests commit; verifier checks it out locally: `git stash; git checkout <tests-commit>; npm run test:kradle; ( cd packages/atlas/webui && npm run test:smoke )` → non-zero; back to HEAD → zero). X-A.18: `gh workflow run ci.yml --ref staging` after the push. X-A.19/X-A.22: `git diff <docs-commit>...HEAD …` |
| README row 05 | "A source changes → B GCP IaC → C GitHub config → D" | order per the chain above |

**B-1.b — coexistence machinery to remove** (the owner said downtime is acceptable and there is no dual-deploy):

1. A.4 step 8 and step 10 (L202, L204) add a `dig`-vs-`GKE_INGRESS_IP` gate to the public smoke steps. That is DNS-detection logic embedded in the product workflow purely so both clouds can run at once. Drop it: the "Post-deploy E2E smoke" is already `non-blocking` (publish.yml L2541) — leave it non-blocking and let it be red until G.2; for `e2e_smoke_kradle` either mark it `continue-on-error: true` until cutover or accept a red job (loud, not silent). Then `GKE_INGRESS_IP` is not needed as a GitHub variable: C.1 becomes 9 variables, X-C.1 expects `9`, X-D.2h is deleted, X-C.2's `GKE_INGRESS_IP` row goes.
2. The OAuth-secret timing split (04 §4.8 timing, 05 §4 preconditions "REGENERATE … at this step for staging", G.3 "regenerate the prod OAuth client secrets in the window", P-5, the G.2/G.3 rollback caveats about re-entering the new secret on AKS) exists only to keep Azure prod logins alive during coexistence. Replace with: **regenerate all four OAuth client secrets once, when Secret Manager is filled in Phase C**; from that moment GitHub login on AKS is broken for both envs (accepted downtime — state it). G.3 loses its secret step and its `force-sync` annotation; its rollback becomes "DNS back; Azure serves without GitHub login"; P-5 is deleted; Phase F can test **prod** login with the hosts-file override and the real secret (X-F.6's test-session workaround becomes optional, not the only prod auth check).
3. E.0's `terraform apply -target=…buckets` ahead of the cluster (L424) and P-6 are extra machinery; with the owner order B completes before any export, so exports simply run after B's full apply. Delete the `-target` sentence and P-6.
4. Recommended, not required: the G.1 (T-2 d) → G.2 (T-1 d) → G.3 → G.4 (T+1 d) pacing is coexistence-driven. Keep the canary (it proves HTTP-01 on GKE before any real host moves — R-2) and OB-2, but allow G.2–G.4 in one session; leave the per-record rollback table as is.

### B-2 kradle state: no CR export/import, no freeze window, no `cr-*` scripts/tests; both environments start from the chart bootstrap on GKE (supersedes 04 §4.18, D-16, D-21)

Owner constraint (`ownerConstraints[1]`): kradle state is NOT important — only its initial bootstrap state. The plan builds a whole lane around the opposite. Every line that must go or change:

| Where | Today | Required |
|---|---|---|
| 05 §0 ground rule 1 last sentence | "The one non-dump data move (kradle CR objects) goes through scripted … code (04 §4.18)" | Delete; the source-first story becomes "there is no non-dump data move" |
| 05 §0 0.8 + X-0.9 | 20 decisions incl. D-16, D-21 | Remove D-16 and D-21 (superseded); X-0.9 regex/count → 18. D-27 (gitea reproducibility) is answered by the same statement (gitea content is kradle state) — list it under "taken", keep E.0.15 as "not exported (owner 2026-09-16)" |
| 05 §0 defaults line (L45) | "D-16 import kradle prod durable kinds; … D-21 owner picks the day, 30-min read-only window" | Delete both; the cutover day is asked at OB-2 |
| 05 A.1 T8 (L98), "Run T1–T9" (L102), A.12 (2) "T1–T9" | new `cr-migration.test.js` | Delete T8 (keep the numbering gap or renumber — say which); the minikube harness path cited is wrong anyway |
| 05 A.6 row `scripts/cr-export.mjs`, `cr-import.mjs`, `src/cr-migration.js` (L231) | new scripts + `package.json` scripts | Delete |
| 06 X-A.1 "T2/T4/T5/T8 missing", X-A.2 "T3–T8", X-A.23, X-A.24 | CR migration scripts/tests | Delete X-A.23/X-A.24; fix the T ranges |
| 05 B.2 tfvars `kradle_org_namespaces` (L326) and the `kradle-runtime-prod@` WI binding list (L320) | `kradle-org-a5c-ai, -default, -knack, -commander-verify, kradle-org-staging-a5c-ai, -staging-default` | Only the org namespaces the chart **bootstraps** exist on GKE. Derive the list from the chart render (X-A.6: `grep 'kind: Namespace' -A2 /tmp/k.yaml`) — `knack` and `commander-verify` are runtime-created orgs on AKS and will not exist |
| 05 D.4 row (L401) | "happens inside the D-21 window: CR export (E.0.5) → deploy → CR import (E.1.5)"; expected "CR counts per kind = export; `kradle-org-a5c-ai`, `-default`, `-knack`, `-commander-verify` re-created by import" | Expected = the **bootstrap set**: admin org `a5c-ai` / admin user `tmuskal` (values `admin.*`), namespace `kradle-org-a5c-ai` with its NetworkPolicy, gitea sandbox repo `agent-sandbox` (values `gitea.bootstrap.sandboxRepo`) with its `Repository` CR `Ready`, `kradle-gitea-agent-token` auto-provisioned. No window, no export, no import |
| 06 X-D.4b (L124) | expects 4 org namespaces "after import" | Replace with the bootstrap expectation above (count = the number the chart renders; still `≥ 1` NetworkPolicy in `kradle-org-a5c-ai`) and extend X-D.4a with the sandbox-repo / admin-org checks |
| 05 E.0.2 (L431) | "**D-21 window** (30 min)" for the atlas prod dump | Keep the mechanism (dump twice, diff counts) but it is the atlas quiescence check, not D-21 — rename |
| 05 E.0.13/E.1.5 (L442), E.0.14 (L443), "E.1 ordering" paragraph (L447) | kradle prod CR export/import; staging CR export "for the record" | Delete both rows; E.1 ordering becomes "D.3/D.4 promote → E.1.2 atlas restore → verify → F → G.3". Remove the `gs://boot-464019-pg-dumps/kradle/` and `…/kradle-staging/` prefixes everywhere |
| 06 X-E.16, X-E.17, X-E.19 (L156–159) | export/import/verify rows | Delete. Keep X-E.18 (Repositories `Ready`) but expected = the bootstrap repo only |
| 05 §6 OB-2 sentence (L474), §9.3 OB-2 (L572), 06 X-F.21 (L190) | "the D-21 window date" | "the cutover day (asked at OB-2)" |
| 05 G.3 (L487) | "in the D-21 window, after E.1.2/E.1.5 verified" | "after E.1.2 verified and D.3/D.4 green" (plus the B-1.b OAuth simplification) |
| 05 §9.1 R-17/D-24 (L544) | "server-side dry-run gate; release tag pinned" | The dry-run gate no longer exists; D-24 (pin a release tag for the `main` promotion) stands on its own — say so |
| 05 §9.2 Phase E (L562) | "imports are wiped by label (E.1.5)" | Only the atlas restore Job can be re-run |
| 05 header / README / 04 | 04 rev 2.1 is executed as is | Add to the 05 header (and a one-line banner at 04 §4.18, §2 #1, §10.B D-16/D-21): "superseded 2026-09-16 by owner decision: kradle starts from the chart bootstrap on GKE; no CR export/import; no freeze window". 04 itself does not need a revision 3 if the banner is there |

Side effect worth stating in D.2/D.4: the AKS `kradle-org-*` namespaces, all `kradle.a5c.ai` objects and the gitea emptyDir content are **abandoned** with the cluster in H.2 step 7 — list them there so H is auditable against 02 `orphans`.

### B-3 Preconditions: gcloud is already authenticated and the reuse audit already ran

Owner constraint (`ownerConstraints[2]`) and 03 §3.1: `gcloud` is authenticated as `tal@a5c.ai` with `core/project=boot-464019`; `inventory.sh` ran; the project is greenfield (APIs `container`, `artifactregistry`, `secretmanager`, `sqladmin`, `dns`, `sts`, `cloudresourcemanager` not enabled; `default` VPC only, 0 static addresses, 0 WIF pools; SAs = compute default + `vertex-express@`; one bucket `a5c-videos`). Remaining: ADC and the SDK update from an **elevated** shell.

| Where | Today | Required |
|---|---|---|
| 05 0.1 / 06 X-0.1 | `gcloud components update …` | Add "**from an elevated shell** — 03 §3.1: the component manager is blocked by directory permissions on `C:\Program Files (x86)\Google\Cloud SDK`"; `gcloud billing` (0.4) also depends on this update |
| 05 0.2 / 06 X-0.2 | "Log in as the Google account that owns `boot-464019` (unknown today …)" | Mark **done 2026-09-16** (`gcloud auth list` → `tal@a5c.ai` active; `gcloud config get-value project` → `boot-464019`; `roles/owner` per 03 §3.1). Keep X-0.2 as a cheap re-check; drop "unknown today" and the mandatory new configuration |
| 05 0.3 / X-0.3 | ADC | Unchanged — this is the real remaining precondition; say so |
| 05 0.9 / 06 X-0.10 | "run `inventory.sh` … fill 03 §3.1" | Mark done; replace X-0.10 with `grep -c 'greenfield' docs/migration/azure-to-gcp/03-gcp-readiness.md` ≥ 1 (or delete it) |
| 05 B.0 (L303) | "`inventory.sh` (done in §0.9)" | Cite 03 §3.1 directly; keep the quota / org-policy checks (those were not done) |
| 05 B.2 intro (L299) | "if 03 §3.1 shows any existing resource … `terraform import`" | State the concrete result: **nothing to import**. Add explicit dispositions for what does exist, so nothing is silently ignored: `default` auto-mode VPC with `default-allow-ssh`/`-rdp` from `0.0.0.0/0` (pick one: leave it untouched and outside terraform, or delete it by an owner command after the platform VPC exists — record in `reviews/05-phase-b-log.md`); compute default SA (untouched; nodes use `gke-node@`); `vertex-express@` (not reused); `a5c-videos` (untouched). Also note `generativelanguage` is enabled and Vertex API is enabled (D-7 lanes) |
| 03 §0 verdict table | still "No / authenticated = false" | Outside 05's scope but inconsistent with 03 §3.1 — add a one-line "superseded by §3.1" note at the top of 03 |

---

## R — Required (checklist items that fail independently of the owner decisions)

**R-1 Tests-first evidence under direct-to-`staging`.** A.1 is explicit and lists exact files (PASS on content), but the mechanics — "run T1–T9, they must fail, record in the commit body", then the X-A.1 `git log staging..branch` evidence — assume a branch. Rewrite X-A.1 as in B-1 and state in A.1 that red-before-green is verified **locally** by the implementer and the verifier, never by a push.

**R-2 Secret counts and timing.** 05 §4 preconditions say "13 staging secrets listed in A.0"; only 7 are staging (`atlas-staging-github-oauth`, `atlas-staging-postgres`, `atlas-staging-webui-auth`, `kradle-staging-assistant-keys`, `kradle-staging-github-oauth`, `kradle-staging-test-auth`, `kradle-staging-jitsi-jwt`) — X-D.0 already lists 7. With B-1 all 13 values are entered in Phase C; extend X-D.0 to the 6 prod shells (count only) before D.3/D.4.

**R-3 N-2 is not achieved for `geekonomy-deployer@`.** B.2 `iam.tf` binds it to **both** `principalSet://…/attribute.repository/Benihakak/geekonomy` and `principal://…/subject/repo:Benihakak/geekonomy:ref:refs/heads/main`. The repository-wide binding already admits every branch, so the `main`-only subject binding is redundant and the SA's `cloudsql.admin` (its terraform apply) is assumable from any branch/PR of that repo. Either split it (`geekonomy-deployer@` = plan/build/deploy on `attribute.repository`; `geekonomy-terraform@` = `cloudsql.admin` + state write on the `main` subject only) or record explicitly that the foreign repo's branch protection is the control (D-13 consequence). `github-terraform@`/`github-terraform-plan@` are split correctly.

**R-4 Secret values touch process arguments.** G.3: `gh secret set … --body "$(gcloud secrets versions access …)"` places the value in a command line (visible in `ps` and shell history) → `gcloud secrets versions access latest --secret kradle-prod-test-auth | gh secret set KRADLE_TEST_AUTH_SECRET --repo a5c-ai/babysitter` (stdin). X-F.6: the secret is interpolated into `curl -d "{…}"` → build the JSON in a pipe and use `--data @-`. E.0.6 (`read -s`) and E.0.4 (in-pod consumption) are fine.

**R-5 "Azure read-only" needs its exception stated.** E.0.6 correctly refuses a firewall-rule write, but E.0.4, E.0.6 and X-E.8 create ephemeral pods in the AKS cluster (`kubectl run`) — a write to the cluster. Add to §0 ground rule 3: "ephemeral pods created in AKS for read-only dumps are permitted and deleted afterwards; Azure control-plane writes (firewall rules, scaling, secrets) are not". Same for the docs commit + Phase A revert pushes, which redeploy on AKS through the existing workflow (state that this is the existing CI behaviour, not a migration write).

**R-6 Checklist rows without an executable command.** X-E.22 says "restore into ns `atlas-restore-test` and `diff` counts" without the command — give it (`kubectl create ns atlas-restore-test; kubectl kustomize packages/atlas/webui/deploy/base | kubectl -n atlas-restore-test apply -f - --selector app=atlas-postgres` or an explicit scratch overlay; then the `restore-job.yaml` with `DUMP_OBJECT` and the `rowcount.sql` diff). X-F.13 tells the operator to "apply the e2e fixture used by `packages/kradle/core/tests/e2e/*.test.js` for that kind" — that directory contains only `lifecycle.test.js`; name the fixture source per kind (or the `tests/*.test.js` file whose fixture is reused) or the row is not executable. X-F.5, X-F.17, X-B.13 are manual/browser/console steps — acceptable, but mark them "manual, evidence = screenshot/record" instead of implying a command.

**R-7 Completeness — name the residue that "goes with the cluster".** All 26 inventory systems and all 26 origins map to a plan step (table below), but `krate-legacy-residue` (01 #3; 02 ORPHAN: ACR repos `krate-controller`/`krate-web`, 100 `krate.a5c.ai` CRDs, `kradle-staging/krate-tls`), the kyverno failed release, `vela-system`, `gatekeeper-system`, `app-routing-system` + LB `134.33.26.182`, AppGW residue, and the ACR dead repos (`budgets`, `onboard`, `tokens-dispenser`, `claude-web*`, `hub/github-runner`) appear nowhere in 05/06. They are deleted implicitly by H.2 step 7; add a "deleted with `rg-hub-development-westus3`" list to that row so H.2 is auditable against 02 `orphans`. Also state the justified no-change for org secret `A5C_AGENT_GITHUB_TOKEN` (02 lists it as Azure-related; it is not — keep) and for the second Azure subscription `1a6a4872-…` (D-22 ignore).

**R-8 Ordering text elsewhere.** README row 05 and the 05 header sentence describe A → B → C; 05 §0 ground rule 5 ("staging before prod") is fine. Update both to the B-1 order.

---

## Checklist result

| # | Item | Result | Notes |
|---|---|---|---|
| 1 | Completeness vs 01/02 JSON with 04 dispositions | **PASS (with R-7)** | 26/26 systems, 26/26 origins, C1–C18, GitHub wiring incl. corrected origins (`Benihakak/geekonomy` D.6, `MantisOS/babysitter-benchmarks` D.7 + tb-fleet H.2.3 + trial-telemetry E.0.10). Mapping: kradle-prod D.4, kradle-staging D.2, krate residue H.2.7 (implicit — R-7), atlas-prod D.3, atlas-staging D.1, content-studio D.8/E.0.3, babysitter-web-staging D.11, a5c-app ×2 D.12/E.0.8, aeq D.10/E.0.4, hub D.13/E.0.5–6/E.0.11, osb D.9, arc-runners D-18/X-F.19, platform-addons B.3, aks-cluster+hub-rg H.2.7, acr H.2.7, ai-accounts A.9/H.2.5, litellm E.0.12/H.2.4, geekonomy D.6/E.0.7/H.2.1, personoids H.2.5, static-sites D.7/H.2.2/H.2.6/E.0.11, promoted-idle H.2.6, dev-vms H.2.6, tb-fleet H.2.3, archives+tfstate E.0.9–10/H.2.8–9, monitoring H.2.5/10 |
| 2 | Source-first | **PASS (with R-5)** | No `az acr import`, no manifest/secret copy; manifests extracted from the workflow heredocs into `packages/atlas/webui/deploy/`; foreign repos own their IaC; one-off transfers are enumerated in E. After B-2 there is no non-dump data move at all. Hand touches outside terraform/CI that must stay listed as one-offs: bootstrap-bucket apply, first platform apply with ADC (B.5.2), `gcloud secrets versions add`, restore Job apply, `-target` (to be removed), `force-sync` annotation (to be removed with B-1.b) |
| 3 | Tests-first ordering explicit with exact test files | **PASS on content, FAIL on mechanics** | Files verified to exist; T8 removed (B-2); X-A.1 branch-based (B-1, R-1) |
| 4 | Every step ↔ checklist row; every row has command + expected result | **FAIL (R-6) + rows to delete/replace (B-1, B-2, B-3)** | Phase 0: 0.1–0.9 ↔ X-0.1–10; A.1–A.12 ↔ X-A.1–25; B.0–B.5 ↔ X-B.0–22; C.1–C.4 ↔ X-C.1–8/X-H.6; D.1–D.13 ↔ X-D.0–15; E.0.1–16 ↔ X-E.1–24; F ↔ X-F.1–21; G.1–4 ↔ X-G.1–7; H.1–4 ↔ X-H.1–8 — complete. Commands are exact except X-E.22, X-F.13 and the manual rows |
| 5 | Gates (OB-2 cutover, OB-3 decommission), rollback per phase, no stateful deletion before verified backup | **PASS (OB-1 placement fixed by B-1)** | H.2 prerequisites cite the X-E rows; `a5ctf-rg` last of D1; `rg-hub-development-westus3` after G.4 + 7 d; rollback table per phase |
| 6 | Secrets never printed; OAuth callback URLs covered; DNS TTL lowered before cutover | **PASS (with R-4)** | Values only via `gcloud secrets versions add`; counts checked, never values; OAuth callbacks hostname-based and unchanged (05 §6); TTL 600 s ≥ 24 h before G (0.7/X-0.8) |
| 7 | Architecture review N-1..N-3 (and N-4..N-7) carried in | **PASS (with R-3)** | N-1: `geekonomy-deployer@` `container.clusterViewer` + `RoleBinding` (B.2/B.3, X-B.10/11). N-2: `github-terraform@` on the exact `main` subject (B.2, X-B.9) — not for geekonomy (R-3). N-3: decompress-then-sha256 loop (E.0.10, X-E.11), ≈100 MB. N-4: bpx no GCP role (D.10). N-5: `alekc/kubectl` (B.3, X-B.22). N-6: "alternative … recorded in 03 §3.1" (X-B.13). N-7: moot after B-2 |

## Nits (fix while editing; none affects the verdict)

- X-H.5 expects exactly `6` archive prefixes but H.3 also keeps `<mantis*>/` — use `≥ 6` or list the exact set.
- 06 X-B.0 "after platform apply: 13" — fine, but say the pre-apply count from 03 §3.1 (`compute`, `iam`, `iamcredentials`, `aiplatform` enabled; the other 9 not).
- 05 A.6 T7 row: `google-auth-library` dependency check — good; add that P-4 (Windows lockfile) applies to that `npm install`.
- 05 D.6 names `redis-deployment.yaml`; X-D.6 waits on `deploy/geekonomy-redis` — consistent, but say the Deployment name is the chart's `fullname-redis`.
- 05 §6 Phase F "Azure untouched: `kubectl … get ns | wc -l` unchanged (32 + header)" — after the docs commit and Phase A revert-tests the AKS deploys still run; the namespace count is unchanged but Deployment revisions are not; X-D.15 compares Deployment **count**, which is fine — say "count, not revision".
- 06 header kube context `gke_boot-464019_us-central1-a_a5c-boot-gke` matches the zonal cluster — good; add the `gcloud container clusters get-credentials a5c-boot-gke --zone us-central1-a` line once so the operator knows how it appears.

## What passes (for the record)

- Registry/auth/storage-class/namespace conventions (A.0) are precise enough to implement without 04; every variable name is consistent across A.0, C.1, X-C.2 and the `infra` workflow.
- Phase B is terraform-only, two stages with separate state, plan-on-PR / apply-on-main, bootstrap bucket declared, least-privilege SAs with `can-i` matrices, budget before any Vertex-pointed workflow.
- Phase E covers every stateful item in 01 §2.1/§4.11 including "confirmed no export" rows; integrity checks are hashes + row counts, not sizes.
- Phase G is executable by someone who was not in the room (record names, old/new values, RFC 4592 rule, propagation check, per-step rollback); apex/`www` never touched.
- Phase H orders deletions by dependency, keeps `a5ctf-rg` last, `NetworkWatcherRG` last overall, and keeps the archives.

## Required actions before re-review

1. Apply B-1 (order, triggers, OB-1, branch references in 05/06/README, coexistence machinery removal incl. `GKE_INGRESS_IP`, OAuth timing, `-target`).
2. Apply B-2 (remove the CR lane everywhere listed; bootstrap expectations in D.4/X-D.4a/b; superseded banners for 04 §4.18/D-16/D-21; decision count 18).
3. Apply B-3 (preconditions reflect 03 §3.1; elevated-shell SDK update; ADC as the remaining item; explicit dispositions for the pre-existing default VPC/SAs/bucket).
4. Apply R-1..R-8.
5. Re-run this review (`05-plan-review-2.md`).
