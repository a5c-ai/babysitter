import { createAuthProviderConfig } from '@a5c-ai/kradle-sdk';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const config = createAuthProviderConfig();
    const response = Response.redirect(new URL('/login', request.url), 302);
    response.headers.append('Set-Cookie', `${config.session.cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
    return response;
  } catch (error) {
    // Fallback: clear a best-effort cookie name and redirect to login
    const response = Response.redirect(new URL('/login', request.url), 302);
    response.headers.append('Set-Cookie', `kradle_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
    return response;
  }
}
