# Git forge interface

## Purpose

The git forge interface syncs repository, pull request, ref, commit, key, collaborator, and repository policy state. It is the broadest external backend interface and is supported by GitHub, GitLab, Bitbucket, Gitea, and similar systems.

## Provider contract

```ts
interface GitForgeProvider {
  listRepositories(cursor): Page<ExternalRepository>;
  getRepository(ref): ExternalRepository;
  createRepository(input): ExternalRepository;
  updateRepository(ref, patch): ExternalRepository;
  listPullRequests(repoRef, cursor): Page<ExternalPullRequest>;
  getPullRequest(ref): ExternalPullRequest;
  createPullRequest(input): ExternalPullRequest;
  updatePullRequest(ref, patch): ExternalPullRequest;
  mergePullRequest(ref, options): ExternalPullRequest;
  listRefs(repoRef, cursor): Page<ExternalRef>;
  getCommit(repoRef, sha): ExternalCommit;
  listDeployKeys(repoRef, cursor): Page<ExternalDeployKey>;
  syncDeployKeys(repoRef, desired): SyncResult;
  listCollaborators(repoRef, cursor): Page<ExternalCollaborator>;
  syncBranchProtection(repoRef, desired): SyncResult;
}
```

## Resource mapping

| External concept | Krate resource/projection |
| --- | --- |
| repository | `Repository` |
| pull request / merge request | `PullRequest` |
| review | `Review` |
| PR comment/review thread | `ReviewComment` projection or activity stream |
| branch/tag/ref | `GitRef` projection or repository status |
| commit | `Commit` projection or lazy detail |
| deploy key/SSH key | `SSHKey` / `RepositoryPermission` / deploy-key projection |
| collaborator/team permission | `RepositoryPermission` |
| branch protection | `BranchProtection` / `RefPolicy` |
| repository webhook | `WebhookSubscription` |

## GitHub mapping

GitHub repositories map to Krate `Repository`; GitHub pull requests map to `PullRequest`; PR reviews/comments map to `Review` and activity projections; deploy keys map to SSH key/deploy-key projections; branch protection maps to `BranchProtection` and `RefPolicy` where fields overlap.

## Sync rules

- Webhooks handle `repository`, `pull_request`, `pull_request_review`, `pull_request_review_comment`, `push`, `create`, `delete`, `branch_protection_rule`, `deploy_key`, and membership/collaborator-related events where available.
- Backfill lists repositories, PRs, refs, branch protection, keys, and collaborators.
- PR sync must coordinate with issue sync because provider issue numbers and PR numbers may share namespace.
- Git operations can use provider clone URLs and provider credentials; Krate should not require PATs.
- Branch protection writes require explicit ownership mode and permission review.

## User-facing changes

- Repository settings show whether GitHub or Krate owns each setting.
- PR pages show native provider link, sync state, and conflict status.
- SSH/deploy key panels show mirrored vs Krate-managed keys.
- Branch protection editor can operate read-only, write-through, or reviewed-write depending on sync policy.

## Acceptance criteria

- A git-forge-only provider can sync repos/PRs/refs without issue or CI support.
- PR state converges from webhooks and periodic backfill.
- Branch protection/key writes are explicit and audited.
- GitHub issue/PR shared numbering does not create duplicate records.
