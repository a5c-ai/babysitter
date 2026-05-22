import { createHmac, timingSafeEqual } from 'node:crypto';
import { createResource, clone } from './resource-model.js';
import { mapOidcIdentity } from './identity-policy.js';

const defaultScopes = {
  github: 'read:user user:email',
  sso: 'openid profile email groups'
};

export function createAuthProviderConfig(env = process.env) {
  const githubEnabled = env.KRATE_AUTH_GITHUB_ENABLED !== 'false';
  const ssoEnabled = env.KRATE_AUTH_SSO_ENABLED === 'true';
  return {
    session: { cookieName: env.KRATE_AUTH_COOKIE_NAME || 'krate_session' },
    delegatedIdentity: {
      enabled: env.KRATE_AUTH_DELEGATED_IDENTITY_ENABLED === 'true',
      userHeader: env.KRATE_AUTH_DELEGATED_USER_HEADER || 'x-forwarded-user',
      groupsHeader: env.KRATE_AUTH_DELEGATED_GROUPS_HEADER || 'x-forwarded-groups',
      emailHeader: env.KRATE_AUTH_DELEGATED_EMAIL_HEADER || 'x-forwarded-email',
      localDevelopment: {
        enabled: delegatedLocalDevelopmentEnabled(env),
        user: env.KRATE_AUTH_DELEGATED_LOCAL_USER || 'local-developer',
        email: env.KRATE_AUTH_DELEGATED_LOCAL_EMAIL || '',
        groups: env.KRATE_AUTH_DELEGATED_LOCAL_GROUPS || 'krate:repo-admins'
      }
    },
    providers: {
      github: {
        id: 'github',
        label: 'GitHub',
        type: 'github',
        enabled: githubEnabled,
        clientId: env.KRATE_AUTH_GITHUB_CLIENT_ID || '',
        clientSecret: env.KRATE_AUTH_GITHUB_CLIENT_SECRET || '',
        clientSecretConfigured: Boolean(env.KRATE_AUTH_GITHUB_CLIENT_SECRET),
        authorizationUrl: env.KRATE_AUTH_GITHUB_AUTHORIZATION_URL || 'https://github.com/login/oauth/authorize',
        tokenUrl: env.KRATE_AUTH_GITHUB_TOKEN_URL || 'https://github.com/login/oauth/access_token',
        userInfoUrl: env.KRATE_AUTH_GITHUB_USERINFO_URL || 'https://api.github.com/user',
        scopes: env.KRATE_AUTH_GITHUB_SCOPES || defaultScopes.github
      },
      sso: {
        id: 'sso',
        label: env.KRATE_AUTH_SSO_PROVIDER_NAME || 'Workspace SSO',
        type: 'oidc',
        enabled: ssoEnabled,
        issuerUrl: env.KRATE_AUTH_SSO_ISSUER_URL || '',
        clientId: env.KRATE_AUTH_SSO_CLIENT_ID || '',
        clientSecret: env.KRATE_AUTH_SSO_CLIENT_SECRET || '',
        clientSecretConfigured: Boolean(env.KRATE_AUTH_SSO_CLIENT_SECRET),
        authorizationUrl: env.KRATE_AUTH_SSO_AUTHORIZATION_URL || '',
        tokenUrl: env.KRATE_AUTH_SSO_TOKEN_URL || '',
        userInfoUrl: env.KRATE_AUTH_SSO_USERINFO_URL || '',
        scopes: env.KRATE_AUTH_SSO_SCOPES || defaultScopes.sso
      }
    }
  };
}

export function listEnabledAuthProviders(config = createAuthProviderConfig()) {
  return Object.values(config.providers).filter((provider) => provider.enabled && provider.clientId && provider.authorizationUrl);
}

export function buildAuthorizationRedirect({ provider, requestUrl, state = cryptoSafeState() }) {
  if (!provider?.enabled) throw new Error(`${provider?.label || 'Provider'} sign-in is disabled`);
  if (!provider.clientId) throw new Error(`${provider.label} client id is not configured`);
  if (!provider.authorizationUrl) throw new Error(`${provider.label} authorization endpoint is not configured`);
  const request = new URL(requestUrl || 'http://localhost/login');
  const redirectUri = new URL(`/api/auth/callback/${provider.id}`, `${request.protocol}//${request.host}`);
  const target = new URL(provider.authorizationUrl);
  target.searchParams.set('response_type', 'code');
  target.searchParams.set('client_id', provider.clientId);
  target.searchParams.set('redirect_uri', redirectUri.toString());
  target.searchParams.set('scope', provider.scopes || 'openid profile email');
  target.searchParams.set('state', state);
  return { url: target.toString(), state, redirectUri: redirectUri.toString() };
}


export async function exchangeOAuthCodeForProfile({ provider, code, requestUrl, fetchImpl = globalThis.fetch }) {
  if (!provider?.enabled) throw new Error(`${provider?.label || 'Provider'} sign-in is disabled`);
  if (!code) throw new Error('authorization code is required');
  if (!provider.tokenUrl || !provider.userInfoUrl) throw new Error(`${provider.label} token and profile endpoints are required`);
  if (!provider.clientId || !provider.clientSecret) throw new Error(`${provider.label} client credentials are not configured`);
  const request = new URL(requestUrl || 'http://localhost/login');
  const redirectUri = new URL(`/api/auth/callback/${provider.id}`, `${request.protocol}//${request.host}`).toString();
  const tokenResponse = await fetchImpl(provider.tokenUrl, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: provider.clientId, client_secret: provider.clientSecret })
  });
  if (!tokenResponse.ok) throw new Error(`${provider.label} token exchange failed with ${tokenResponse.status}`);
  const token = await tokenResponse.json();
  const accessToken = token.access_token;
  if (!accessToken) throw new Error(`${provider.label} did not return an access token`);
  const profileResponse = await fetchImpl(provider.userInfoUrl, { headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` } });
  if (!profileResponse.ok) throw new Error(`${provider.label} profile lookup failed with ${profileResponse.status}`);
  const profile = await profileResponse.json();
  return normalizeProviderProfile(provider, profile);
}

export function normalizeProviderProfile(provider, profile = {}) {
  if (provider.id === 'github' || provider.type === 'github') {
    const username = profile.login || profile.username || profile.name;
    return {
      provider: provider.id,
      subject: String(profile.id || username || profile.email),
      email: profile.email || (username ? `${username}@users.noreply.github.com` : undefined),
      displayName: profile.name || username || profile.email,
      username,
      groups: [],
      teams: [],
      admin: false
    };
  }
  const groups = Array.isArray(profile.groups) ? profile.groups : String(profile.groups || '').split(',').map((group) => group.trim()).filter(Boolean);
  return {
    provider: provider.id,
    subject: profile.sub || profile.id || profile.email,
    email: profile.email,
    displayName: profile.name || profile.preferred_username || profile.email,
    username: profile.preferred_username || profile.username || profile.email,
    groups,
    teams: [],
    admin: groups.includes('krate:platform-engineers') || groups.includes('krate:repo-admins')
  };
}

export function profileFromDelegatedHeaders(headers, config = createAuthProviderConfig(), options = {}) {
  if (!config.delegatedIdentity.enabled) throw new Error('Delegated identity sign-in is disabled');
  const getHeader = (name) => typeof headers.get === 'function' ? headers.get(name) : headers[name] || headers[name.toLowerCase()];
  const localProfile = localDelegatedDevelopmentProfile(config, options);
  const headerUser = getHeader(config.delegatedIdentity.userHeader);
  const user = headerUser || localProfile.user;
  if (!user) throw new Error(`Delegated identity header ${config.delegatedIdentity.userHeader} is missing`);
  const email = getHeader(config.delegatedIdentity.emailHeader) || localProfile.email || (String(user).includes('@') ? user : undefined);
  const groups = String(getHeader(config.delegatedIdentity.groupsHeader) || localProfile.groups || '').split(',').map((group) => group.trim()).filter(Boolean);
  return { provider: 'delegated', subject: user, email, displayName: user, username: normalizeName(user), groups, teams: [], admin: groups.includes('krate:platform-engineers') || groups.includes('krate:repo-admins'), delegatedIdentitySource: headerUser ? 'proxy-header' : 'local-development' };
}

export async function registerLoginProfile({ controller, namespace, profile }) {
  const org = process.env.KRATE_ADMIN_ORG || process.env.KRATE_ORG || 'default';
  const orgNamespace = namespace || `krate-org-${org}`;
  const adminUsername = process.env.KRATE_ADMIN_USERNAME || '';
  const isBootstrapAdmin = adminUsername && (profile.username === adminUsername || profile.email === adminUsername || normalizeName(profile.email || '') === adminUsername || normalizeName(profile.username || '') === adminUsername);
  const mapped = mapLoginProfileToKrateIdentity({ ...profile, namespace: orgNamespace, organizationRef: org, admin: isBootstrapAdmin || profile.admin });
  const userResult = await controller.applyResource(mapped.user);
  const mappingResult = await controller.applyResource(mapped.mapping);
  return { ...mapped, userResult, mappingResult };
}

export function createSessionCookie(config, profile, options = {}) {
  const secret = options.secret || process.env.KRATE_SESSION_SECRET || '';
  const payload = Buffer.from(JSON.stringify({ provider: profile.provider, subject: profile.subject, user: profile.username || profile.email })).toString('base64url');
  let value;
  if (secret) {
    const signature = createHmac('sha256', secret).update(payload).digest('base64url');
    value = `${payload}.${signature}`;
  } else {
    value = payload;
  }
  return `${config.session.cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax`;
}

export function parseSessionCookie(config, cookieValue, options = {}) {
  if (!cookieValue || typeof cookieValue !== 'string') return null;
  const secret = options.secret || process.env.KRATE_SESSION_SECRET || '';
  try {
    const dotIndex = cookieValue.indexOf('.');
    const isSigned = dotIndex !== -1;

    if (isSigned && !secret) {
      // Signed cookie but no secret to verify — reject
      return null;
    }

    if (!isSigned && secret) {
      // No signature present but secret is configured — reject (could be tampered or unsigned legacy)
      return null;
    }

    let payload;
    if (isSigned && secret) {
      payload = cookieValue.slice(0, dotIndex);
      const receivedSig = cookieValue.slice(dotIndex + 1);
      const expectedSig = createHmac('sha256', secret).update(payload).digest('base64url');
      // Constant-time comparison
      const expected = Buffer.from(expectedSig, 'base64url');
      const received = Buffer.from(receivedSig, 'base64url');
      if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
        return null;
      }
    } else {
      payload = cookieValue;
    }

    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const user = typeof session.user === 'string' ? session.user.trim() : '';
    const subject = typeof session.subject === 'string' ? session.subject.trim() : '';
    const provider = typeof session.provider === 'string' ? session.provider.trim() : '';
    if (!user && !subject) return null;
    return {
      cookieName: config.session.cookieName,
      provider: provider || 'krate',
      subject: subject || user,
      user: user || subject
    };
  } catch {
    return null;
  }
}

export function mapLoginProfileToKrateIdentity({ provider = 'sso', subject, email, displayName, username, groups = [], teams = [], admin = false, namespace = 'krate-org-default', organizationRef = 'default' }) {
  const userName = username || normalizeName(email || subject || displayName || 'user');
  const krateGroups = [...new Set(['krate:users', admin ? 'krate:platform-engineers' : 'krate:developers', ...groups])];
  const identity = mapOidcIdentity({ subject, email, groups: krateGroups });
  const user = createResource('User', { name: userName, namespace, labels: { role: admin ? 'admin' : 'member' } }, {
    organizationRef,
    displayName: displayName || userName,
    email,
    username: userName,
    teams,
    admin,
    disabled: false
  }, { phase: 'Active', lastLoginProvider: provider, groups: identity.groups });
  const mapping = createResource('IdentityMapping', { name: `${provider}-${userName}`, namespace }, {
    organizationRef,
    user: userName,
    provider,
    subject: subject || email,
    email,
    workspaceIdentity: { name: identity.name, uid: identity.uid, groups: identity.groups },
    repositoryIdentity: { username: userName, email }
  }, { phase: 'Synced' });
  return { identity, user, mapping };
}

export function createInviteResource({ email, role = 'member', teams = [], invitedBy = 'admin', namespace = 'krate-org-default', organizationRef = 'default', expiresInDays = 7 }) {
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
  return createResource('Invite', { name: normalizeName(email), namespace, labels: { role } }, { organizationRef, email, role, teams, invitedBy, expiresAt }, { phase: 'Pending' });
}

export function createTeamResource({ name, displayName = name, members = [], maintainers = [], repositoryGrants = [], namespace = 'krate-org-default', organizationRef = 'default' }) {
  return createResource('Team', { name, namespace }, { organizationRef, displayName, members, maintainers, repositoryGrants }, { phase: 'Active', memberCount: members.length });
}

export function createAuthProviderResources(config = createAuthProviderConfig(), namespace = 'krate-org-default', organizationRef = 'default') {
  return Object.values(config.providers).map((provider) => createResource('AuthProvider', { name: provider.id, namespace }, {
    organizationRef,
    type: provider.type,
    label: provider.label,
    enabled: provider.enabled,
    scopes: provider.scopes,
    delegatedIdentity: clone(publicDelegatedIdentityConfig(config.delegatedIdentity))
  }, { phase: provider.enabled ? 'Configured' : 'Disabled', clientConfigured: Boolean(provider.clientId) }));
}

export function identityBackendSyncPlan({ users = [], teams = [], invites = [], mappings = [], permissions = [], sshKeys = [] } = {}) {
  return {
    users: users.map((user) => ({ action: 'ensure-user', user: user.metadata?.name, email: user.spec?.email, disabled: Boolean(user.spec?.disabled) })),
    teams: teams.map((team) => ({ action: 'ensure-team', team: team.metadata?.name, members: team.spec?.members || [], maintainers: team.spec?.maintainers || [] })),
    invites: invites.map((invite) => ({ action: 'send-invite', email: invite.spec?.email, teams: invite.spec?.teams || [], role: invite.spec?.role || 'member' })),
    mappings: mappings.map((mapping) => ({ action: 'link-identity', user: mapping.spec?.user, provider: mapping.spec?.provider, repositoryIdentity: mapping.spec?.repositoryIdentity })),
    permissions: permissions.map((permission) => ({ action: 'sync-repository-permission', repository: permission.spec?.repository, subject: permission.spec?.subject, subjectKind: permission.spec?.subjectKind || 'user', permission: permission.spec?.permission })),
    sshKeys: sshKeys.map((key) => ({ action: 'sync-ssh-key', owner: key.spec?.owner, repository: key.spec?.repository, scope: key.spec?.scope, title: key.spec?.title }))
  };
}

function normalizeName(value) {
  return String(value || 'user').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 63) || 'user';
}

function localDelegatedDevelopmentProfile(config, options = {}) {
  if (!isLocalDevelopmentRequest(options.requestUrl, options.env)) return {};
  const localConfig = config.delegatedIdentity.localDevelopment || {};
  if (!localConfig.enabled) return {};
  const request = new URL(options.requestUrl);
  const user = request.searchParams.get('user') || request.searchParams.get('username') || localConfig.user;
  const email = request.searchParams.get('email') || localConfig.email;
  const groups = request.searchParams.get('groups') || localConfig.groups;
  return { user, email, groups };
}

function delegatedLocalDevelopmentEnabled(env = process.env) {
  if (env.KRATE_AUTH_DELEGATED_LOCAL_DEVELOPMENT === 'true') return true;
  if (env.KRATE_AUTH_DELEGATED_LOCAL_DEVELOPMENT === 'false') return false;
  return env.NODE_ENV !== 'production';
}

function isLocalDevelopmentRequest(requestUrl) {
  if (!requestUrl) return false;
  const { hostname } = new URL(requestUrl);
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1' || hostname === '::';
}

function publicDelegatedIdentityConfig(delegatedIdentity) {
  return {
    enabled: delegatedIdentity.enabled,
    userHeader: delegatedIdentity.userHeader,
    groupsHeader: delegatedIdentity.groupsHeader,
    emailHeader: delegatedIdentity.emailHeader,
    localDevelopment: clone(delegatedIdentity.localDevelopment)
  };
}

function cryptoSafeState() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
