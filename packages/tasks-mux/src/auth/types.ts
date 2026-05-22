import { z } from "zod";

// ── User ──────────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string().min(1),
  login: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  avatarUrl: z.string().url(),
  provider: z.literal("github"),
});
export type User = z.infer<typeof UserSchema>;

// ── AuthToken ─────────────────────────────────────────────────────────────

export const AuthTokenSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.string().datetime(),
  user: UserSchema,
});
export type AuthToken = z.infer<typeof AuthTokenSchema>;

// ── JWTPayload ────────────────────────────────────────────────────────────

export const JWTPayloadSchema = z.object({
  sub: z.string().min(1),
  login: z.string().min(1),
  name: z.string().min(1),
  iat: z.number().int(),
  exp: z.number().int(),
  type: z.enum(["access", "refresh"]),
});
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

// ── SSHKeyPair ────────────────────────────────────────────────────────────

export const SSHKeyPairSchema = z.object({
  publicKey: z.string().min(1),
  privateKey: z.string().min(1),
  fingerprint: z.string().min(1),
  algorithm: z.string().min(1),
  createdAt: z.string().datetime(),
});
export type SSHKeyPair = z.infer<typeof SSHKeyPairSchema>;

// ── GitForgeConfig ────────────────────────────────────────────────────────

export const GitForgeConfigSchema = z.object({
  type: z.enum(["github", "gitlab", "bitbucket"]),
  baseUrl: z.string().url(),
  credentials: z.record(z.string(), z.string()),
});
export type GitForgeConfig = z.infer<typeof GitForgeConfigSchema>;

// ── GitHubOAuthConfig ─────────────────────────────────────────────────────

export const GitHubOAuthConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  callbackUrl: z.string().url(),
  scopes: z.array(z.string()),
});
export type GitHubOAuthConfig = z.infer<typeof GitHubOAuthConfigSchema>;

// ── GitHubAppConfig ───────────────────────────────────────────────────────

export const GitHubAppConfigSchema = z.object({
  appId: z.string().min(1),
  privateKey: z.string().min(1),
  webhookSecret: z.string().optional(),
});
export type GitHubAppConfig = z.infer<typeof GitHubAppConfigSchema>;
