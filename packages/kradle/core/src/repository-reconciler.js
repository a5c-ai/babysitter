// Repository reconciler: ensures every Repository CRD has a backing Gitea repo.
//
// The create path (api-controller.createRepository) provisions repos created via
// the API/UI, but kubectl-applied or pre-existing CRDs bypass it — and a Gitea
// DB reset can orphan CRDs whose repos vanished. This reconciler closes that gap
// by ensuring each Repository's Gitea repo exists. It is idempotent (existing
// repos are skipped) and tolerant (a per-repo failure is collected, not fatal),
// so it is safe to run on a periodic loop.

const SILENT = { warn() {}, info() {} };

/**
 * @param {Array<object>} repositories  Repository resources (metadata.name, spec.organizationRef, spec.visibility, spec.defaultBranch)
 * @param {{ giteaService: object|null, logger?: { warn?: Function, info?: Function } }} deps
 * @returns {Promise<{ total:number, created:number, alreadyPresent:number, failed:number, skipped:number, reason?:string, errors:Array<{name:string,org:string,error:string}> }>}
 */
export async function reconcileRepositories(repositories = [], { giteaService, logger = SILENT } = {}) {
  if (!giteaService) {
    return { total: repositories.length, created: 0, alreadyPresent: 0, failed: 0, skipped: repositories.length, reason: 'not-configured', errors: [] };
  }

  let created = 0;
  let alreadyPresent = 0;
  let failed = 0;
  const errors = [];

  for (const resource of repositories) {
    const name = resource.metadata?.name;
    const org = resource.spec?.organizationRef || resource.metadata?.labels?.['kradle.a5c.ai/org'] || '';
    const visibility = resource.spec?.visibility || 'internal';
    try {
      const existing = await giteaService.getRepository(org, name);
      if (existing) { alreadyPresent++; continue; }
      await giteaService.createRepository(org, name, {
        private: visibility !== 'public',
        defaultBranch: resource.spec?.defaultBranch || 'main',
        description: resource.spec?.description || '',
      });
      created++;
      logger.info?.(`[kradle] provisioned Gitea repo ${org}/${name}`);
    } catch (err) {
      // A concurrent writer (another reconcile pass or the API create path) may
      // have created the repo between our check and create — idempotent success.
      if (/\b(409|422)\b/.test(err.message) || /exist/i.test(err.message)) {
        alreadyPresent++;
        continue;
      }
      failed++;
      errors.push({ name, org, error: err.message });
      logger.warn?.(`[kradle] repository reconcile failed for ${org}/${name}: ${err.message}`);
    }
  }

  return { total: repositories.length, created, alreadyPresent, failed, skipped: 0, errors };
}
