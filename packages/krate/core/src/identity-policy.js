import { clone } from './resource-model.js';

export function mapOidcIdentity({ subject, email, groups = [] }) {
  if (!subject && !email) throw new Error('OIDC identity requires subject or email');
  const name = email || subject;
  return { name, uid: subject || email, groups: [...new Set(['system:authenticated', ...groups])], extra: { email } };
}

export class RbacAuthorizer {
  constructor(bindings = []) { this.bindings = bindings; }
  allow(subject, rule) { this.bindings.push({ subject, rule }); return this; }
  can(user, verb, kind, namespace = 'default') {
    const subjects = new Set([user?.name, ...(user?.groups || [])]);
    return this.bindings.some(({ subject, rule }) => {
      if (!subjects.has(subject)) return false;
      if (rule.namespace && rule.namespace !== namespace) return false;
      const verbs = new Set(rule.verbs || []);
      const kinds = new Set(rule.kinds || []);
      return (verbs.has('*') || verbs.has(verb)) && (kinds.has('*') || kinds.has(kind));
    });
  }
}

export function defaultAuthorizer() {
  return new RbacAuthorizer()
    .allow('system:authenticated', { verbs: ['get', 'list', 'watch'], kinds: ['*'] })
    .allow('krate:developers', { verbs: ['create', 'update'], kinds: ['PullRequest', 'Issue', 'Review', 'Pipeline', 'Job'] })
    .allow('krate:repo-admins', { verbs: ['create', 'update', 'delete'], kinds: ['Organization', 'User', 'Team', 'Invite', 'IdentityMapping', 'AuthProvider', 'Repository', 'SSHKey', 'RepositoryPermission', 'BranchProtection', 'RefPolicy', 'WebhookSubscription', 'WebhookDelivery', 'View', 'Selector', 'PullRequest', 'Issue', 'Review', 'Pipeline', 'Job'] })
    .allow('krate:platform-engineers', { verbs: ['*'], kinds: ['*'] });
}

export function createAdmissionPolicy({ name, mode = 'enforce', match, validate, message }) {
  if (!name) throw new Error('admission policy requires name');
  if (!['audit', 'enforce'].includes(mode)) throw new Error('mode must be audit or enforce');
  return { name, mode, match, validate, message };
}

export function evaluateAdmission(policies, request) {
  const warnings = [];
  const violations = [];
  for (const policy of policies) {
    if (policy.match && !policy.match(request)) continue;
    const valid = policy.validate ? policy.validate(request) : true;
    if (valid) continue;
    const entry = { policy: policy.name, mode: policy.mode, message: policy.message || `admission policy ${policy.name} rejected request` };
    if (policy.mode === 'audit') warnings.push(entry); else violations.push(entry);
  }
  return { allowed: violations.length === 0, warnings, violations };
}

export function serviceAccountForJob({ namespace = 'default', repository, pipeline, trustTier = 'trusted' }) {
  return {
    name: `krate-job-${pipeline}`,
    namespace,
    groups: ['system:serviceaccounts', `system:serviceaccounts:${namespace}`, 'krate:ci-jobs'],
    trustTier,
    scopes: trustTier === 'untrusted'
      ? { repository, pipeline, secrets: false, clusterApi: false }
      : { repository, pipeline, secrets: true, clusterApi: 'scoped' }
  };
}

function scalarToYaml(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string' && /^[a-zA-Z0-9_.:/-]+$/.test(value)) return value;
  return JSON.stringify(value);
}

export function toResourceYaml(value, indent = 0) {
  const spaces = ' '.repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value.map((item) => item && typeof item === 'object'
      ? `${spaces}- ${toResourceYaml(item, indent + 2).trimStart()}`
      : `${spaces}- ${scalarToYaml(item)}`).join('\n');
  }
  if (value && typeof value === 'object') {
    return Object.entries(clone(value)).map(([key, child]) => {
      if (child && typeof child === 'object') return `${spaces}${key}:\n${toResourceYaml(child, indent + 2)}`;
      return `${spaces}${key}: ${scalarToYaml(child)}`;
    }).join('\n');
  }
  return `${spaces}${scalarToYaml(value)}`;
}

