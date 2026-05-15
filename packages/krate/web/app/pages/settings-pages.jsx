import { loadKrateUi, DegradedBanner } from '../lib/krate-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { getSignedInUser } from '../lib/krate-ui.jsx';
import { AppSettingsForm } from '../components/app-settings.jsx';
import { UserProfileForm } from '../components/user-profile.jsx';

export async function AppSettingsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/settings" eyebrow="application settings" title="Settings" text="Customize appearance, locale, live update preferences, and cache behavior for the Krate console." actions={[['/', 'Home']]} breadcrumbs={[['/', 'Krate'], ['/settings', 'Settings']]}>
    <DegradedBanner model={ui.model} />
    <AppSettingsForm />
  </PageFrame>;
}

export async function UserProfilePage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const currentUser = await getSignedInUser();
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/profile" eyebrow="user profile" title="Profile" text="View and manage your account, API keys, and session information." actions={[['/', 'Home']]} breadcrumbs={[['/', 'Krate'], ['/profile', 'Profile']]}>
    <DegradedBanner model={ui.model} />
    <UserProfileForm org={activeOrg} user={currentUser} />
  </PageFrame>;
}
