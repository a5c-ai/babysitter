import { redirect } from 'next/navigation';

export const metadata = { title: 'People | Krate' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const org = process.env.KRATE_ADMIN_ORG || process.env.KRATE_ORG || 'default';
  redirect(`/orgs/${org}/people`);
}
