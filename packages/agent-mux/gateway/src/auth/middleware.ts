import type { TokenStore, TokenRecord } from './tokens.js';

export function parseBearerToken(headerValue: string | null | undefined): string | null {
  if (!headerValue) return null;
  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export async function authenticateBearerToken(
  tokenStore: TokenStore,
  headerValue: string | null | undefined,
): Promise<TokenRecord | null> {
  const token = parseBearerToken(headerValue);
  if (!token) return null;
  const record = await tokenStore.verify(token);
  if (!record) return null;
  await tokenStore.touch(record.id);
  return record;
}
