import { loadKrateUi, PageFrame, StatusPill, orgHref } from '../ui-shell.jsx';

export const metadata = { title: 'Organizations | Krate' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const { model } = await loadKrateUi(null);
  const orgs = model.orgs?.length ? model.orgs : [{ slug: 'default', displayName: 'Default org', namespace: 'krate-org-default' }];
  const activeOrg = orgs[0]?.slug || process.env.KRATE_ORG || 'default';
  return <PageFrame org={activeOrg} orgs={orgs} eyebrow="organizations" title="Choose an organization" text="Each organization has its own workspace, repositories, people, runs, and deployments." actions={[[`/orgs/${activeOrg}`, 'Open current'], ['/api/orgs', 'Advanced organization API']]} breadcrumbs={[[ '/orgs', 'Organizations' ]]}> 
    <section className="routeGrid two" aria-label="Organizations">
      <div className="card repoBrowser">
        <div className="cardTitle"><h2>Organizations</h2><StatusPill tone={orgs.length ? 'good' : 'warn'}>{orgs.length} ready</StatusPill></div>
        <p>Pick the workspace you want to use. Admins can create another organization from the advanced API or through installation automation.</p>
        <ul className="resourceList">
          {orgs.map((org) => <li key={org.slug || org.name}>
            <a href={`/orgs/${org.slug || org.name}`}><strong>{org.displayName || org.slug || org.name}</strong></a>
            <span>{org.namespace}</span>
            <small>{(org.slug || org.name) === activeOrg ? 'Current organization' : 'Open organization'}</small>
          </li>)}
        </ul>
      </div>
      <div className="card">
        <div className="cardTitle"><h2>Start here</h2><StatusPill tone="neutral">guided</StatusPill></div>
        <div className="metricGrid"><a href={orgHref(activeOrg, '/repositories')}><strong>{model.metrics.repositories}</strong><span>Repositories</span></a><a href={orgHref(activeOrg, '/people')}><strong>{model.identity?.counts?.users || 0}</strong><span>People</span></a><a href={orgHref(activeOrg, '/deployments')}><strong>{model.delivery?.applications?.length || 0}</strong><span>Deployments</span></a></div>
        <p>Organization resources stay isolated from each other while the Krate experience remains one flow.</p>
      </div>
    </section>
  </PageFrame>;
}
