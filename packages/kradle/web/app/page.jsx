import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const metadata = { title: 'Krate' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  let org = null;

  // Try to read user's last-used org from cookie
  try {
    const cookieStore = await cookies();
    const lastOrg = cookieStore.get('krate_last_org')?.value;
    if (lastOrg && /^[a-z0-9][-a-z0-9]*$/.test(lastOrg)) {
      org = lastOrg;
    }
  } catch {
    // ignore cookie read failures
  }

  // Fall back to env vars, then 'default'
  if (!org) {
    org = process.env.KRATE_ADMIN_ORG || process.env.KRATE_ORG || 'default';
  }

  redirect('/orgs/' + org);
}
