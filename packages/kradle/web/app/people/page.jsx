import { redirect } from 'next/navigation';

export const metadata = { title: 'People | Kradle' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const org = process.env.KRADLE_ORG || 'default';
  redirect(`/orgs/${org}/people`);
}
