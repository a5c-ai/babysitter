// Routes: /orgs/[org]/settings, /settings/secrets — app preferences and user profile.
import { loadKradleUi, DegradedBanner } from '../lib/kradle-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { getSignedInUser } from '../lib/kradle-ui.jsx';
import { AppSettingsForm } from '../components/settings/app-settings.jsx';
import { UserProfileForm } from '../components/settings/user-profile.jsx';

export async function AppSettingsPage({ org = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/settings" eyebrow="application settings" title="Settings" text="Customize appearance, locale, live update preferences, and cache behavior for the Kradle console." actions={[['/', 'Home']]} breadcrumbs={[['/', 'Kradle'], ['/settings', 'Settings']]}>
    <DegradedBanner model={ui.model} />
    <AppSettingsForm />
  </PageFrame>;
}

export async function UserProfilePage({ org = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const currentUser = await getSignedInUser();
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/profile" eyebrow="user profile" title="Profile" text="View and manage your account, API keys, and session information." actions={[['/', 'Home']]} breadcrumbs={[['/', 'Kradle'], ['/profile', 'Profile']]}>
    <DegradedBanner model={ui.model} />
    <UserProfileForm org={activeOrg} user={currentUser} />
  </PageFrame>;
}
