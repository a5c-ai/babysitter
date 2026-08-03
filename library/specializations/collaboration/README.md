# collaboration

PR and issue collaboration policy processes, plus the code-review rubrics the PR
lifecycles call. Everything here is about how a change moves through review: the policy
gates a PR must satisfy, the lifecycle variants that compose those gates for different
kinds of change, and the structured review rubrics that produce the verdict.

## Layout

- `code-review/` — 2 processes (review rubrics).
- `github/` — 16 processes (lifecycles, policy gates, utilities).

There are deliberately no root-level `.js` files in this specialization.

## code-review/

- `six-dimension-review.js` (`@process specializations/collaboration/code-review/six-dimension-review`)
  — Structured PR review across six dimensions: correctness, clarity, consistency,
  coverage, complexity, change-scope.
- `validator.js` (`@process specializations/collaboration/code-review/validator`)
  — Multi-dimensional PR validator. Runs six review dimensions in parallel (quality,
  architecture, tests, security, UX, business), materialises non-blocking findings as a
  deferred-debt filesystem (`docs/validation/<id>/<priority>/<category>/NN-title.md`),
  then posts an approve-or-request-changes verdict.

**These two carry DIFFERENT dimension sets and are not interchangeable.**
`six-dimension-review.js` hardcodes `correctness, clarity, consistency, coverage,
complexity, change-scope`; `validator.js` hardcodes `quality, architecture, tests,
security, ux, business`. Both happen to be six dimensions; that is the only thing they
share. Picking one over the other is a real choice, not a naming detail. Reconciling the
two rubrics is an open item, not something this README papers over.

## github/

### Entry point

- `pr-lifecycle-router.js` (`@process specializations/collaboration/github/pr-lifecycle-router`)
  — Dispatches to the appropriate pr-lifecycle variant based on (event x inferred change
  type). One entry point; many lifecycles.

### Lifecycle variants

- `pr-lifecycle-feature.js` (`@process specializations/collaboration/github/pr-lifecycle-feature`)
  — Standard feature/bugfix/chore PR lifecycle: branch+PR policies -> label taxonomy ->
  issue linking -> six-dimension review -> merge gate. Composes the individual gate
  processes into one end-to-end flow.
- `pr-lifecycle-hotfix.js` (`@process specializations/collaboration/github/pr-lifecycle-hotfix`)
  — Fast-path lifecycle for production hotfixes: minimal gates, mandatory incident link,
  on-call sign-off breakpoint, merge to main + backport to staging/develop.
- `pr-lifecycle-docs.js` (`@process specializations/collaboration/github/pr-lifecycle-docs`)
  — Docs-only PR lifecycle: verify docs-only scope -> link check -> style/voice audit ->
  technical-accuracy review (if touching technical docs) -> merge.
- `pr-lifecycle-security.js` (`@process specializations/collaboration/github/pr-lifecycle-security`)
  — Security PR lifecycle: embargo check -> restricted-reviewer gate -> confidentiality
  audit (no leaks in title/body/tests/diff) -> coordinated disclosure plan -> merge window.
- `pr-lifecycle-dependency-bump.js` (`@process specializations/collaboration/github/pr-lifecycle-dependency-bump`)
  — Dependency-bump (dependabot/renovate) lifecycle: verify lock-file-only change ->
  classify semver impact -> require green CI -> auto-merge patch/minor, require human
  approval for major.
- `pr-lifecycle-comment-response.js` (`@process specializations/collaboration/github/pr-lifecycle-comment-response`)
  — Lifecycle triggered by @mention on a PR comment: classify intent -> route to
  review-comment-response OR re-run a targeted gate -> post reply with fix commit ref.

### Policy gates

- `branch-policies.js` (`@process specializations/collaboration/github/branch-policies`)
  — Enforce branch-naming, target-branch, and no-direct-push-to-protected rules.
- `pr-policies.js` (`@process specializations/collaboration/github/pr-policies`)
  — Enforce PR hygiene: title conventions, scope, description completeness, linked issues,
  reviewers.
- `draft-pr-policy.js` (`@process specializations/collaboration/github/draft-pr-policy`)
  — Prohibit draft PRs for ready-to-merge flows; require ready-for-review state before
  CI/review gates apply.
- `label-taxonomy.js` (`@process specializations/collaboration/github/label-taxonomy`)
  — Enforce a canonical label taxonomy (type/area/priority) on issues and PRs.
- `issue-linking.js` (`@process specializations/collaboration/github/issue-linking`)
  — Ensure PRs and commits link to tracking issues with proper closing keywords.
- `issue-only-no-direct-commits.js` (`@process specializations/collaboration/github/issue-only-no-direct-commits`)
  — Every non-trivial commit must trace to an issue; direct commits without an issue
  reference are rejected in CI.

### Utilities

- `conflict-resolver.js` (`@process specializations/collaboration/github/conflict-resolver`)
  — Merge-conflict resolver. Detects conflicts, checks whether upstream already covers the
  PR (safe-close if so), otherwise rewrites the PR branch in place: rebase onto base,
  resolve each conflict category, verify locally, force-push-with-lease, re-invoke
  validator. Works DIRECTLY on the existing PR branch — never creates a new branch/PR.
- `pr-comment-response.js` (`@process specializations/collaboration/github/pr-comment-response`)
  — Respond to a PR review comment: classify intent, address the concern, post a reply
  linking the fix commit.
- `producer.js` (`@process specializations/collaboration/github/producer`)
  — Producer persona. Detects project phase -> ingests spec (`docs/specs/README.md`) ->
  extracts gaps vs current implementation -> dedupes against existing issues -> drafts
  issue bodies in parallel -> infers labels/assignees -> batch-creates GitHub issues.
  Optionally runs a tech-debt scan grouping `docs/validation/` findings into
  implementation issues.

## Composition

`pr-lifecycle-router.js` is the single entry point: it dispatches by event and inferred
change type to one of the six `pr-lifecycle-*` variants. The lifecycle variants in turn
compose the policy gates and the review rubric — `pr-lifecycle-feature.js` composes
branch-policies, pr-policies, label-taxonomy, issue-linking, and
`code-review/six-dimension-review.js` into one end-to-end flow. The other variants select
a narrower or wider set of the same gates to match the risk profile of the change.

## Assets

- Skill: [`skills/six-dimension-code-review/SKILL.md`](./skills/six-dimension-code-review/SKILL.md)
  — the canonical six-dimension review rubric.
- There are no agents in this specialization.

---

Descriptions in this README are transcribed from the files' own `@description` headers,
not invented.
