import { orgHref, orgNavigationGroups, getSignedInUser } from './krate-ui.jsx';
import { GlobalSearch } from '../components/global-search.jsx';
import { NotificationBell } from '../components/notification-bell.jsx';
import { CommandPaletteWrapper } from '../components/command-palette.jsx';
import { KeyboardShortcuts } from '../components/keyboard-shortcuts.jsx';
import { MobileNavToggle } from '../components/mobile-nav-toggle.jsx';

export function AppShell({ children, org = 'default', orgs = [], currentPath = '/', currentUser = null, loadError = null }) {
  const visibleOrgs = orgs.length ? orgs : [{ slug: org, displayName: org }];
  const currentOrg = visibleOrgs.find((item) => (item.slug || item.name) === org) || visibleOrgs[0];
  const currentHref = currentPath === '/' ? '/' : `/${String(currentPath || '').replace(/^\/+/, '').split('/')[0]}`;
  const signedInName = currentUser?.user || currentUser?.subject || '';
  const userInitial = (signedInName.trim()[0] || 'K').toUpperCase();
  return <>
    <a className="skipLink" href="#main-content">Skip to content</a>
    <header className="appTopbar" aria-label="Krate global navigation">
      <MobileNavToggle />
      <a className="brandMark" href={orgHref(org, '/')} aria-label="a5c.ai Krate home"><span className="brandSigil">K</span><span className="brandWordmark"><strong>Kr<span>ate</span></strong><em>a5c.ai</em></span></a>
      <GlobalSearch org={org} />
      <nav className="topbarNav" aria-label="Global actions"><a href="/orgs">Orgs</a><a href={orgHref(org, '/repositories')}>Repos</a><a href={orgHref(org, '/inbox')}>Reviews</a></nav>
      <div className="topbarAccount" aria-label={signedInName ? 'Signed-in user' : 'Account'}><NotificationBell org={org} />{signedInName ? <><a className="userChip" href={orgHref(org, '/people')}><span className="userAvatar" aria-hidden="true">{userInitial}</span><span className="userName">{signedInName}</span></a><a className="signOutLink" href="/api/auth/logout">Sign out</a></> : <a className="signInLink" href="/login">Sign in</a>}</div>
    </header>
    {loadError ? <div className="loadErrorBanner" role="alert"><span>Data may be incomplete: {loadError}</span><a href="" onClick={(e) => { e.preventDefault(); window.location.reload(); }}>Retry</a></div> : null}
    <div className="appBody"><aside className="appSidebar" id="krate-sidebar" aria-label="Krate sections"><div className="sidebarSectionTitle">Workspace</div><details className="orgSwitcher"><summary><span>Organization</span><strong>{currentOrg?.displayName || currentOrg?.slug || currentOrg?.name || org}</strong></summary><div>{visibleOrgs.map((item) => <a key={item.slug || item.name} href={`/orgs/${item.slug || item.name}`} aria-current={(item.slug || item.name) === org ? 'page' : undefined}>{item.displayName || item.slug || item.name}</a>)}<a href="/orgs">View all organizations</a></div></details><nav className="sidebarNav">{orgNavigationGroups.map((group) => <section className="sidebarNavGroup" key={group.title}><h2>{group.title}</h2>{group.items.map(([href, label, description]) => <a key={href} href={orgHref(org, href)} aria-current={href === currentHref ? 'page' : undefined}><span>{label}</span><small>{description}</small></a>)}</section>)}<details className="advancedNav"><summary>Advanced</summary><a href={orgHref(org, '/advanced-plans')} aria-current={currentHref === '/advanced-plans' ? 'page' : undefined}>Resource details</a><a href={orgHref(org, '/controller-api')} aria-current={currentHref === '/controller-api' ? 'page' : undefined}>API diagnostics</a></details></nav></aside><div className="appContent">{children}</div></div>
    <CommandPaletteWrapper org={org} />
    <KeyboardShortcuts org={org} />
  </>;
}

export async function PageFrame({ eyebrow, title, text, actions = [], breadcrumbs = [['/', 'Krate']], org = 'default', orgs = [], currentPath = '/', loadError = null, children }) {
  const currentUser = await getSignedInUser();
  return <AppShell org={org} orgs={orgs} currentPath={currentPath} currentUser={currentUser} loadError={loadError}><main id="main-content" className="routeMain">
    <nav className="breadcrumbs" aria-label="Breadcrumbs">{breadcrumbs.map(([href, label], index) => <a key={`${href}-${label}`} href={orgHref(org, href)} aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}>{label}</a>)}</nav>
    <section className="routeHero" aria-labelledby="route-title"><div><span className="eyebrow">{eyebrow}</span><h1 id="route-title">{title}</h1><p className="lede">{text}</p></div>{actions.length ? <div className="heroActions" aria-label="page actions">{actions.map(([href, label]) => <a key={href} href={orgHref(org, href)}>{label}</a>)}</div> : null}</section>
    {children}
  </main></AppShell>;
}
