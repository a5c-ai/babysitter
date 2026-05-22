// Types and Zod schemas
export {
  UserSchema,
  type User,
  AuthTokenSchema,
  type AuthToken,
  JWTPayloadSchema,
  type JWTPayload,
  SSHKeyPairSchema,
  type SSHKeyPair,
  GitForgeConfigSchema,
  type GitForgeConfig,
  GitHubOAuthConfigSchema,
  type GitHubOAuthConfig,
  GitHubAppConfigSchema,
  type GitHubAppConfig,
} from "./types.js";

// JWT utilities
export {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  refreshAccessToken,
} from "./jwt.js";

// SSH key management
export {
  generateSSHKeyPair,
  parsePublicKey,
  calculateFingerprint,
  formatAuthorizedKey,
} from "./ssh-keys.js";

// GitHub OAuth client
export { GitHubOAuthClient } from "./github-oauth.js";

// GitHub App client
export {
  GitHubAppClient,
  type Installation,
  type CreateKeyPROpts,
  type CreateKeyPRResult,
} from "./github-app.js";

// Forge interface
export {
  type GitForge,
  type PullRequestOpts,
  type PullRequestResult,
  type PushFileOpts,
  type RepoInfo,
  GitHubForge,
  createForge,
} from "./forge-interface.js";

// Auth middleware
export {
  createAuthMiddleware,
  type AuthMiddlewareOpts,
} from "./middleware.js";
