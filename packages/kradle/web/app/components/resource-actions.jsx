'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function useSuccessMessage(router) {
  const [success, setSuccess] = useState(null);
  const timerRef = useRef(null);
  const showSuccess = useCallback((text, href) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSuccess({ text, href });
    timerRef.current = setTimeout(() => { setSuccess(null); router.refresh(); }, 1500);
  }, [router]);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return [success, showSuccess];
}

function SuccessBanner({ success }) {
  if (!success) return null;
  return <p role="status" className="mutationStatus" style={{ color: 'var(--success, #22c55e)' }}>{success.text}{success.href ? <> &middot; <a href={success.href}>View created resource</a></> : null}</p>;
}

export function RepositoryManager({ namespace, org, repositories = [] }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, showSuccess] = useSuccessMessage(router);
  const formRef = useRef(null);
  const repositoryNames = repositories.map((repository) => repository.metadata?.name).filter(Boolean);

  async function createRepository(formData) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/orgs/${org}/repositories`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          organizationRef: org,
          visibility: formData.get('visibility'),
          defaultBranch: formData.get('defaultBranch')
        })
      });
      const body = await response.json();
      if (response.ok) {
        const name = body.resource?.metadata?.name || formData.get('name');
        showSuccess(`Applied Repository/${name}`, `/orgs/${org}/repositories/${name}/code`);
        formRef.current?.reset();
      } else {
        setMessage(body.message || body.error || 'Repository apply failed');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteRepository(name) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/orgs/${org}/repositories/${encodeURIComponent(name)}`, { method: 'DELETE' });
      const body = await response.json();
      setMessage(response.ok ? `Deleted Repository/${name}` : body.message || body.error || 'Repository delete failed');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="card managementCard">
    <div className="cardTitle"><h3>Repository management</h3><span className="pill neutral">Krate-managed</span></div>
    <form ref={formRef} action={createRepository} className="formGrid">
      <label><span>Name</span><input name="name" required pattern="[a-z0-9]([-a-z0-9]*[a-z0-9])?" placeholder="repository-name" /></label>
      <label><span>Visibility</span><select name="visibility" defaultValue="internal"><option value="private">private</option><option value="internal">internal</option><option value="public">public</option></select></label>
      <label><span>Default branch</span><input name="defaultBranch" defaultValue="main" required /></label>
      <button type="submit" disabled={busy}>Create repository</button>
    </form>
    <p className="muted">Creates and updates repositories through Krate in workspace <code>{namespace}</code>.</p>
    {repositoryNames.length ? <ul className="compactList repositoryManageList">{repositoryNames.map((name) => <li key={name}><a href={`/orgs/${org}/repositories/${name}/code`}>Repository/{name}</a><span><a href={`/orgs/${org}/repositories/${name}/pull-requests`}>PRs</a><a href={`/orgs/${org}/repositories/${name}/settings`}>Settings</a><button type="button" disabled={busy} onClick={() => deleteRepository(name)}>Delete</button></span></li>)}</ul> : <p className="emptyText">No repositories are available yet.</p>}
    <SuccessBanner success={success} />
    {message ? <p role="status" className="mutationStatus">{message}</p> : null}
  </div>;
}


export function DeploymentManager({ namespace, org, repositories = [], delivery = {} }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, showSuccess] = useSuccessMessage(router);
  const deployFormRef = useRef(null);
  const repositoryNames = repositories.map((repository) => repository.metadata?.name).filter(Boolean);
  const deploymentNames = (delivery.applications || []).map((deployment) => deployment.name).filter(Boolean);

  async function createDeployment(formData) {
    const name = resourceName(formData.get('name')) || resourceName(formData.get('repository')) || 'deployment';
    const repository = String(formData.get('repository') || '').trim();
    const componentName = resourceName(formData.get('service')) || 'web';
    const image = String(formData.get('image') || '').trim();
    const environment = String(formData.get('environment') || 'development').trim();
    const port = Number(formData.get('port') || 8080);
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/orgs/${org}/resources`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          apiVersion: 'core.oam.dev/v1beta1',
          kind: 'Application',
          metadata: { name, namespace, labels: { 'krate.a5c.ai/org': org, 'krate.a5c.ai/namespace': namespace, 'krate.a5c.ai/repository': repository, 'krate.a5c.ai/environment': environment } },
          spec: {
            organizationRef: org,
            components: [{ name: componentName, type: 'webservice', properties: { image, ports: [{ port, expose: true }] } }],
            policies: [{ name: `${environment}-placement`, type: 'topology', properties: { clusters: ['local'], namespace } }],
            workflow: { steps: [{ name: `promote-${environment}`, type: 'deploy', properties: { policies: [`${environment}-placement`] } }] }
          }
        })
      });
      const body = await response.json();
      if (response.ok) {
        const deployName = body.resource?.metadata?.name || name;
        showSuccess(`Prepared deployment ${deployName}`, `/orgs/${org}/deployments`);
        deployFormRef.current?.reset();
      } else {
        setMessage(body.message || body.error || 'Deployment setup failed');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="card managementCard">
    <div className="cardTitle"><h3>Create deployment</h3><span className="pill neutral">guided</span></div>
    <p className="emptyText">Choose a repository, image, service, and environment. Advanced details stay collapsed after the deployment is prepared.</p>
    <form ref={deployFormRef} action={createDeployment} className="formGrid"><label><span>Name</span><input name="name" required placeholder="web-production" /></label><label><span>Repository</span><select name="repository" required>{repositoryNames.length ? repositoryNames.map((repo) => <option key={repo} value={repo}>{repo}</option>) : <option value="">Create a repository first</option>}</select></label><label><span>Service</span><input name="service" defaultValue="web" required /></label><label><span>Container image</span><input name="image" required placeholder="ghcr.io/acme/web:latest" /></label><label><span>Environment</span><select name="environment" defaultValue="development"><option value="development">development</option><option value="staging">staging</option><option value="production">production</option></select></label><label><span>Port</span><input name="port" type="number" min="1" max="65535" defaultValue="8080" /></label><button type="submit" disabled={busy || repositoryNames.length === 0}>Prepare deployment</button></form>
    <IdentityList title="Deployment flow" items={[`Repositories available: ${repositoryNames.length}`, `Deployments prepared: ${deploymentNames.length}`, ...(deploymentNames.slice(0, 4).map((name) => `Ready to inspect: ${name}`))]} />
    <SuccessBanner success={success} />
    {message ? <p role="status" className="mutationStatus">{message}</p> : null}
  </div>;
}

export function ResourceApplyPanel({ org = 'default', resource }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, showSuccess] = useSuccessMessage(router);
  const initialJson = useMemo(() => sanitizePlan(JSON.stringify(resource, null, 2)), [resource]);

  if (!resource) return <div className="card applyPanel emptyState"><div className="cardTitle"><h3>Advanced resource editor</h3><span className="pill neutral">org action</span></div><p className="emptyText">No editable resource is selected yet. Use a guided page first, or open advanced details when you need direct editing.</p><textarea name="resource" value="No resource selected yet." rows={8} readOnly spellCheck="false" /><button type="button" disabled>Save changes</button></div>;

  async function applyResource(formData) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/orgs/${org}/resources`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: formData.get('resource')
      });
      const body = await response.json();
      if (response.ok) {
        showSuccess(`Applied ${body.resource?.kind}/${body.resource?.metadata?.name}`);
      } else {
        setMessage(body.message || body.error || 'Resource apply failed');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <form action={applyResource} className="card applyPanel">
    <div className="cardTitle"><h3>Advanced resource editor</h3><span className="pill neutral">org action</span></div>
    <textarea name="resource" defaultValue={initialJson} rows={12} spellCheck="false" />
    <button type="submit" disabled={busy}>Save changes</button>
    <SuccessBanner success={success} />
    {message ? <p role="status" className="mutationStatus">{message}</p> : null}
  </form>;
}

function sanitizePlan(value) {
  return String(value || '')
    .replace(/KubeVela/g, 'Krate')
    .replace(/OAM/g, 'Krate deployment')
    .replace(/Gitea/g, 'Krate repositories')
    .replace(/gitea/g, 'Krate repositories')
    .replace(/Argo CD/g, 'Krate release sync')
    .replace(/GitOps/g, 'release sync')
    .replace(/Kubernetes/g, 'Krate')
    .replace(/kubernetes/g, 'Krate')
    .replace(/kubectl/g, 'Krate action')
    .replace(/SubjectAccessReview/g, 'access check')
    .replace(/RBAC/g, 'access policy')
    .replace(/smart-HTTP/g, 'repository streaming')
    .replace(/KRATE_GITEA_HTTP_URL/g, 'Krate repositories')
    .replace(/core\.oam\.dev/g, 'krate.delivery')
    .replace(/app\.oam\.dev/g, 'app.krate.delivery')
    .replace(/policy\.oam\.dev/g, 'policy.krate.delivery')
    .replace(/ApplicationRevision/g, 'Release')
    .replace(/ResourceTracker/g, 'ManagedResource')
    .replace(/YAML/g, 'advanced details')
    .replace(/yaml/g, 'advanced details');
}


export function UserManagementPanel({ namespace, org, identity = {}, repositories = [] }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const teams = identity.teams || [];
  const users = identity.users || [];
  const invites = identity.invites || [];
  const mappings = identity.mappings || [];
  const permissions = identity.permissions || [];
  const sshKeys = identity.sshKeys || [];

  async function applyKrateResource(resource) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/orgs/${org}/resources`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(resource)
      });
      const body = await response.json();
      setMessage(response.ok ? `Saved ${body.resource?.kind || resource.kind}/${body.resource?.metadata?.name || resource.metadata?.name}` : body.message || body.error || 'Save failed');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function inviteUser(formData) {
    const email = String(formData.get('email') || '').trim();
    const name = resourceName(email) || 'invite';
    await applyKrateResource({
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'Invite',
      metadata: { name, namespace },
      spec: { organizationRef: org, email, role: formData.get('role'), teams: splitList(formData.get('teams')), invitedBy: 'current-admin' },
      status: { phase: 'Pending' }
    });
  }

  async function transitionInvite(invite, phase) {
    await applyKrateResource({
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'Invite',
      metadata: { name: invite.name || resourceName(invite.email), namespace },
      spec: { organizationRef: org, email: invite.email, role: invite.role, teams: invite.teams || [], expiresAt: invite.expiresAt },
      status: { phase }
    });
  }

  async function saveTeam(formData) {
    const name = String(formData.get('name') || '').trim();
    await applyKrateResource({
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'Team',
      metadata: { name, namespace },
      spec: { organizationRef: org, displayName: formData.get('displayName') || name, members: splitList(formData.get('members')), maintainers: splitList(formData.get('maintainers')), repositoryGrants: [] },
      status: { phase: 'Active' }
    });
  }

  async function setUserDisabled(user, disabled) {
    await applyKrateResource({
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'User',
      metadata: { name: user.name, namespace, labels: { role: user.admin ? 'admin' : 'member' } },
      spec: { organizationRef: org, displayName: user.displayName, email: user.email, username: user.name, teams: user.teams || [], admin: user.admin, disabled },
      status: { phase: disabled ? 'Disabled' : 'Active' }
    });
  }

  async function saveMapping(formData) {
    const user = String(formData.get('user') || '').trim();
    const provider = String(formData.get('provider') || 'sso').trim();
    await applyKrateResource({
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'IdentityMapping',
      metadata: { name: `${provider}-${user}`, namespace },
      spec: {
        organizationRef: org,
        user,
        provider,
        subject: formData.get('subject'),
        email: formData.get('email'),
        workspaceIdentity: { name: formData.get('workspaceIdentity') || formData.get('email'), groups: splitList(formData.get('workspaceGroups')) },
        repositoryIdentity: { username: formData.get('repositoryUsername') || user, email: formData.get('email') }
      },
      status: { phase: 'Synced' }
    });
  }

  async function savePermission(formData) {
    const repository = String(formData.get('repository') || '').trim();
    const subject = String(formData.get('subject') || '').trim();
    await applyKrateResource({
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'RepositoryPermission',
      metadata: { name: `${repository}-${subject}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'), namespace },
      spec: { organizationRef: org, repository, subject, subjectKind: formData.get('subjectKind'), permission: formData.get('permission'), revoked: false },
      status: { phase: 'Synced' }
    });
  }

  async function revokePermission(grant) {
    await applyKrateResource({
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'RepositoryPermission',
      metadata: { name: grant.name || `${grant.repository}-${grant.subject}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'), namespace },
      spec: { organizationRef: org, repository: grant.repository, subject: grant.subject, subjectKind: grant.subjectKind || 'user', permission: grant.permission || 'read', revoked: true },
      status: { phase: 'Revoked' }
    });
  }

  async function saveSshKey(formData) {
    const owner = String(formData.get('owner') || '').trim();
    const title = String(formData.get('title') || owner || 'ssh-key').trim();
    await applyKrateResource({
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'SSHKey',
      metadata: { name: `${owner}-${title}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'), namespace },
      spec: { organizationRef: org, owner, title, scope: formData.get('scope'), repository: formData.get('repository'), key: formData.get('key'), revoked: false },
      status: { phase: 'Synced' }
    });
  }

  async function revokeSshKey(key) {
    await applyKrateResource({
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'SSHKey',
      metadata: { name: key.name, namespace },
      spec: { organizationRef: org, owner: key.owner, title: key.title, scope: key.scope, repository: key.repository, revoked: true },
      status: { phase: 'Revoked' }
    });
  }

  return <div className="identityGrid">
    <div className="card managementCard">
      <div className="cardTitle"><h3>Invite people</h3><span className="pill neutral">admin</span></div>
      <form action={inviteUser} className="formGrid"><label><span>Email</span><input name="email" type="email" required placeholder="teammate@example.com" /></label><label><span>Role</span><select name="role" defaultValue="member"><option value="member">member</option><option value="admin">admin</option></select></label><label><span>Teams</span><input name="teams" placeholder="maintainers, release" /></label><button type="submit" disabled={busy}>Send invite</button></form>
      <InviteReviewList invites={invites} busy={busy} onAccept={(invite) => transitionInvite(invite, 'Accepted')} onRevoke={(invite) => transitionInvite(invite, 'Revoked')} />
    </div>
    <div className="card managementCard"><div className="cardTitle"><h3>Teams</h3><span className="pill neutral">groups</span></div><form action={saveTeam} className="formGrid"><label><span>Name</span><input name="name" required placeholder="maintainers" /></label><label><span>Display name</span><input name="displayName" placeholder="Maintainers" /></label><label><span>Members</span><input name="members" placeholder="alice, bob" /></label><label><span>Maintainers</span><input name="maintainers" placeholder="alice" /></label><button type="submit" disabled={busy}>Save team membership</button></form><IdentityList title="Active teams" items={teams.map((team) => `${team.displayName} - ${team.members.length} members - ${team.maintainers.length} maintainers`)} /></div>
    <div className="card managementCard"><div className="cardTitle"><h3>Identity links</h3><span className="pill neutral">linked</span></div><form action={saveMapping} className="formGrid"><label><span>User</span><input name="user" required placeholder="alice" /></label><label><span>Provider</span><select name="provider" defaultValue="sso"><option value="sso">SSO</option><option value="github">GitHub</option><option value="delegated">Delegated</option></select></label><label><span>Email</span><input name="email" type="email" required /></label><label><span>Provider account</span><input name="subject" required /></label><label><span>Workspace identity</span><input name="workspaceIdentity" /></label><label><span>Workspace groups</span><input name="workspaceGroups" placeholder="krate:developers" /></label><label><span>Krate repository username</span><input name="repositoryUsername" /></label><button type="submit" disabled={busy}>Save identity link</button></form><IdentityList title="Linked users" items={mappings.map((mapping) => `${mapping.user} - ${mapping.provider} - ${mapping.phase}`)} /></div>
    <div className="card managementCard">
      <div className="cardTitle"><h3>Repository permissions</h3><span className="pill neutral">permissions</span></div>
      <form action={savePermission} className="formGrid"><label><span>Repository</span><select name="repository" required>{repositories.map((repo) => <option key={repo.metadata?.name} value={repo.metadata?.name}>{repo.metadata?.name}</option>)}</select></label><label><span>User or team</span><input name="subject" required placeholder="alice or maintainers" /></label><label><span>Subject type</span><select name="subjectKind" defaultValue="user"><option value="user">user</option><option value="team">team</option></select></label><label><span>Permission</span><select name="permission" defaultValue="read"><option value="read">read</option><option value="write">write</option><option value="admin">admin</option></select></label><button type="submit" disabled={busy}>Grant permission</button></form>
      <PermissionReviewList grants={permissions} busy={busy} onRevoke={revokePermission} />
    </div>
    <div className="card managementCard">
      <div className="cardTitle"><h3>SSH keys</h3><span className="pill neutral">secure access</span></div>
      <form action={saveSshKey} className="formGrid"><label><span>Owner</span><input name="owner" required placeholder="alice" /></label><label><span>Title</span><input name="title" required placeholder="laptop" /></label><label><span>Scope</span><select name="scope" defaultValue="user"><option value="user">user</option><option value="deploy">deploy</option></select></label><label><span>Repository</span><select name="repository"><option value="">All repositories</option>{repositories.map((repo) => <option key={repo.metadata?.name} value={repo.metadata?.name}>{repo.metadata?.name}</option>)}</select></label><label className="wideField"><span>Public key</span><textarea name="key" required rows={3} placeholder="ssh-ed25519 AAAA..." /></label><button type="submit" disabled={busy}>Save SSH key</button></form>
      <SshKeyReviewList keys={sshKeys} busy={busy} onRevoke={revokeSshKey} />
    </div>
    <div className="card"><div className="cardTitle"><h3>People</h3><span className="pill good">{users.length} users</span></div><UserReviewList users={users} busy={busy} onDisable={(user) => setUserDisabled(user, true)} onRestore={(user) => setUserDisabled(user, false)} />{message ? <p role="status" className="mutationStatus">{message}</p> : null}</div>
  </div>;
}

function InviteReviewList({ invites, busy, onAccept, onRevoke }) {
  return <div><h4>Invite review</h4>{invites.length ? <ul className="compactList actionList">{invites.map((invite) => <li key={invite.name || invite.email}><span>{invite.email} - {invite.role} - {invite.phase}</span><span><button type="button" disabled={busy || invite.phase === 'Accepted'} onClick={() => onAccept(invite)}>Mark accepted</button><button type="button" disabled={busy || invite.phase === 'Revoked'} onClick={() => onRevoke(invite)}>Revoke invite</button></span></li>)}</ul> : <p className="emptyText">No invites need review.</p>}</div>;
}

function UserReviewList({ users, busy, onDisable, onRestore }) {
  return <div><h4>User access review</h4>{users.length ? <ul className="compactList actionList">{users.map((user) => <li key={user.name}><span>{user.displayName} - {user.email} - {user.admin ? 'admin' : 'member'} - {user.disabled ? 'disabled' : 'active'}</span><span>{user.disabled ? <button type="button" disabled={busy} onClick={() => onRestore(user)}>Restore user</button> : <button type="button" disabled={busy} onClick={() => onDisable(user)}>Disable user</button>}</span></li>)}</ul> : <p className="emptyText">No users returned yet.</p>}</div>;
}

function PermissionReviewList({ grants, busy, onRevoke }) {
  return <div><h4>Permission review</h4>{grants.length ? <ul className="compactList actionList">{grants.map((grant) => <li key={grant.name || `${grant.repository}-${grant.subject}`}><span>{grant.repository} - {grant.subjectKind}:{grant.subject} - {grant.permission}{grant.revoked ? ' - revoked' : ''}</span><span><button type="button" disabled={busy || grant.revoked} onClick={() => onRevoke(grant)}>Revoke grant</button></span></li>)}</ul> : <p className="emptyText">No repository permissions yet.</p>}</div>;
}

function SshKeyReviewList({ keys, busy, onRevoke }) {
  return <div><h4>SSH key review</h4>{keys.length ? <ul className="compactList actionList">{keys.map((key) => <li key={key.name}><span>{key.title} - {key.owner} - {key.scope}{key.repository ? ` - ${key.repository}` : ''}{key.revoked ? ' - revoked' : ''}</span><span><button type="button" disabled={busy || key.revoked} onClick={() => onRevoke(key)}>Revoke SSH key</button></span></li>)}</ul> : <p className="emptyText">No SSH keys added yet.</p>}</div>;
}

function IdentityList({ title, items }) {
  return <div><h4>{title}</h4>{items.length ? <ul className="compactList">{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="emptyText">Nothing here yet.</p>}</div>;
}

function splitList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function resourceName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 63);
}

