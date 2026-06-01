import { buildAuthorizationRedirect, createAuthProviderConfig } from '@a5c-ai/krate-sdk';

export const dynamic = 'force-dynamic';

function resolvePublicUrl(request) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}${new URL(request.url).pathname}`;
  if (process.env.KRATE_PUBLIC_URL) return `${process.env.KRATE_PUBLIC_URL}${new URL(request.url).pathname}`;
  return request.url;
}

export async function GET(request, { params }) {
  const { provider } = await params;
  const config = createAuthProviderConfig();
  const selected = config.providers[provider];
  if (!selected) {
    return Response.redirect(new URL(`/login?error=provider_not_found`, request.url).toString(), 302);
  }
  try {
    const redirect = buildAuthorizationRedirect({ provider: selected, requestUrl: resolvePublicUrl(request) });
    return Response.redirect(redirect.url, 302);
  } catch (error) {
    return Response.redirect(new URL(`/login?error=provider_disabled`, request.url).toString(), 302);
  }
}
