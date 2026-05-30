import { z } from "zod";
import { randomBytes } from "node:crypto";

// ── Enums ────────────────────────────────────────────────────────────────

export const BreakpointStatusSchema = z.enum([
  "pending",
  "routed",
  "claimed",
  "answered",
  "completed",
  "expired",
  "cancelled",
]);
export type BreakpointStatus = z.infer<typeof BreakpointStatusSchema>;

export const BreakpointStrategySchema = z.enum([
  "single",
  "first-response-wins",
  "collect-all",
  "quorum",
]);
export type BreakpointStrategy = z.infer<typeof BreakpointStrategySchema>;

// ── Urgency ──────────────────────────────────────────────────────────────

export const UrgencySchema = z.enum(["low", "medium", "high"]);
export type Urgency = z.infer<typeof UrgencySchema>;

// ── InteractionKind ──────────────────────────────────────────────────────

export const InteractionKindSchema = z.enum([
  "clarification",
  "approval",
  "intervention",
  "notification",
  "handoff",
]);
export type InteractionKind = z.infer<typeof InteractionKindSchema>;

// ── Code Snippet ─────────────────────────────────────────────────────────

export const CodeSnippetSchema = z.union([
  z.string(),
  z.object({
    filename: z.string(),
    code: z.string(),
    language: z.string().optional(),
  }),
]);
export type CodeSnippet = z.infer<typeof CodeSnippetSchema>;

// ── BreakpointContext ────────────────────────────────────────────────────

export const BreakpointContextLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  kind: z.enum(["reference", "repo", "artifact", "external"]).optional(),
}).catchall(z.unknown());
export type BreakpointContextLink = z.infer<typeof BreakpointContextLinkSchema>;

export const BreakpointContextSectionSchema = z.object({
  title: z.string().min(1),
  markdown: z.string().min(1),
}).catchall(z.unknown());
export type BreakpointContextSection = z.infer<typeof BreakpointContextSectionSchema>;

export const BreakpointContextArtifactSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  kind: z.enum(["image", "document", "trace", "log", "build", "external"]).optional(),
  mimeType: z.string().min(1).optional(),
}).catchall(z.unknown());
export type BreakpointContextArtifact = z.infer<typeof BreakpointContextArtifactSchema>;

export const BreakpointContextSchema = z.object({
  description: z.string(),
  codeSnippets: z.array(CodeSnippetSchema),
  fileReferences: z.array(z.string()),
  tags: z.array(z.string()),
  title: z.string().optional(),
  summary: z.string().optional(),
  markdown: z.string().optional(),
  domain: z.string().optional(),
  urgency: UrgencySchema.optional(),
  interactionKind: InteractionKindSchema.optional(),
  links: z.array(BreakpointContextLinkSchema).optional(),
  sections: z.array(BreakpointContextSectionSchema).optional(),
  artifacts: z.array(BreakpointContextArtifactSchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).catchall(z.unknown());
export type BreakpointContext = z.infer<typeof BreakpointContextSchema>;

// ── BreakpointRouting ────────────────────────────────────────────────────

export const BreakpointRoutingSchema = z.object({
  strategy: BreakpointStrategySchema,
  targetResponders: z.array(z.string()),
  timeoutMs: z.number().positive(),
  presentToUser: z.boolean(),
  breakpointId: z.string().optional(),
  autoApproveAfterN: z.number().int().optional(),
});
export type BreakpointRouting = z.infer<typeof BreakpointRoutingSchema>;

// ── ResponderProfile ─────────────────────────────────────────────────────

export const ResponderProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string(),
  domains: z.array(z.string()),
  tags: z.array(z.string()),
  availability: z.boolean(),
  responseTimeSla: z.number().positive(),
  publicKeyFingerprint: z.string().optional(),
}).strict();
export type ResponderProfile = z.infer<typeof ResponderProfileSchema>;

// ── BreakpointAnswer ─────────────────────────────────────────────────────

export const BreakpointAnswerRatingSchema = z.object({
  helpful: z.boolean(),
  comment: z.string().optional(),
  ratedAt: z.string().datetime(),
});
export type BreakpointAnswerRating = z.infer<typeof BreakpointAnswerRatingSchema>;

export const DecisionMemorySchema = z.object({
  applicabilityContext: z.string().min(1),
  reasoning: z.string().min(1),
  enrichedContext: z.string().optional(),
  savedAt: z.string().datetime(),
});
export type DecisionMemory = z.infer<typeof DecisionMemorySchema>;

export const BreakpointAnswerSchema = z.object({
  id: z.string().min(1),
  breakpointId: z.string().min(1),
  responderId: z.string().min(1),
  responderName: z.string().min(1),
  text: z.string(),
  approved: z.boolean().optional(),
  confidence: z.number().min(0).max(100),
  references: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  answeredAt: z.string().datetime(),
  rating: BreakpointAnswerRatingSchema.optional(),
  decisionMemory: DecisionMemorySchema.optional(),
});
export type BreakpointAnswer = z.infer<typeof BreakpointAnswerSchema>;

// ── Proven Breakpoint Types ──────────────────────────────────────────────

export const ProvenBreakpointAnswerSchema = BreakpointAnswerSchema.extend({
  signature: z.string().min(1),
  publicKeyFingerprint: z.string().min(1),
  signedAt: z.string().datetime(),
  signedFields: z.array(z.string()),
});
export type ProvenBreakpointAnswer = z.infer<typeof ProvenBreakpointAnswerSchema>;

export const BreakpointPublicAnswerSchema = z.union([
  ProvenBreakpointAnswerSchema,
  BreakpointAnswerSchema,
]);
export type BreakpointPublicAnswer = z.infer<typeof BreakpointPublicAnswerSchema>;

export function isProvenBreakpointAnswer(answer: unknown): answer is ProvenBreakpointAnswer {
  return ProvenBreakpointAnswerSchema.safeParse(answer).success;
}

export const ProvenVerificationResultSchema = z.object({
  valid: z.boolean(),
  publicKeyFingerprint: z.string().optional(),
  responderName: z.string().optional(),
  reason: z.string().optional(),
  verifiedAt: z.string().datetime(),
});
export type ProvenVerificationResult = z.infer<typeof ProvenVerificationResultSchema>;

// ── Breakpoint ───────────────────────────────────────────────────────────

export const BreakpointSubmitterSchema = z.object({
  sub: z.string().min(1),
  login: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
});
export type BreakpointSubmitter = z.infer<typeof BreakpointSubmitterSchema>;

export const BreakpointSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  context: BreakpointContextSchema,
  status: BreakpointStatusSchema,
  routing: BreakpointRoutingSchema,
  answers: z.array(BreakpointPublicAnswerSchema),
  selectedAnswer: z.string().optional(),
  projectId: z.string().optional(),
  repoId: z.string().optional(),
  createdBy: BreakpointSubmitterSchema.optional(),
  claimedByResponderId: z.string().min(1).optional(),
  claimedByResponderName: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});
export type Breakpoint = z.infer<typeof BreakpointSchema>;

// ── BreakpointWaitResult ─────────────────────────────────────────────────

export const BreakpointWaitResultSchema = z.object({
  answered: z.boolean(),
  breakpoint: BreakpointSchema,
  answer: BreakpointPublicAnswerSchema.optional(),
  allAnswers: z.array(BreakpointPublicAnswerSchema),
  resolution: z.string().optional(),
  elapsedMs: z.number().nonnegative(),
});
export type BreakpointWaitResult = z.infer<typeof BreakpointWaitResultSchema>;

// ── ExpertiseArea ────────────────────────────────────────────────────────

export const ExpertiseAreaSchema = z.object({
  domain: z.string().min(1),
  topics: z.array(z.string()),
  keywords: z.array(z.string()),
  proficiency: z.number().int().min(1).max(5),
});
export type ExpertiseArea = z.infer<typeof ExpertiseAreaSchema>;

// ── BreakpointBrowserSession ────────────────────────────────────────────

export const BreakpointBrowserSessionSchema = z.object({
  breakpointId: z.string().min(1),
  slug: z.string().min(1),
  url: z.string().url(),
  authToken: z.string().min(1),
  expiresAt: z.string().datetime(),
  mode: z.enum(["same-user", "responder"]),
  responderId: z.string().min(1).optional(),
  responderName: z.string().min(1).optional(),
});
export type BreakpointBrowserSession = z.infer<typeof BreakpointBrowserSessionSchema>;

// ── BreakpointSessionView ───────────────────────────────────────────────

export const BreakpointSessionViewSchema = z.object({
  breakpoint: BreakpointSchema,
  expiresAt: z.string().datetime(),
  canAnswer: z.boolean(),
  mode: z.enum(["same-user", "responder"]),
  responderId: z.string().min(1).optional(),
  responderName: z.string().min(1).optional(),
});
export type BreakpointSessionView = z.infer<typeof BreakpointSessionViewSchema>;

// ── Organization Types ──────────────────────────────────────────────────

export interface GitHubRepo {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  defaultBranch: string;
  language: string | null;
  isPrivate: boolean;
  repoRoot?: string;
  configRoot?: string;
  responderDir?: string;
  isConfigSource?: boolean;
  connectedAt: string;
  connectedBy: string;
}

export interface ProjectMember {
  userId: string;
  login: string;
  name: string;
  avatarUrl?: string;
  role: "owner" | "member";
  addedAt: string;
}

export interface TeamMember {
  userId: string;
  login: string;
  name: string;
  avatarUrl?: string;
  role: "owner" | "member";
  addedAt: string;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  inviteeLogin: string;
  inviteeUserId?: string;
  inviterId: string;
  inviterLogin: string;
  status: "pending" | "accepted" | "revoked";
  token: string;
  createdAt: string;
  acceptedAt?: string;
  revokedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerLogin: string;
  members: TeamMember[];
  invitations: TeamInvitation[];
  projectIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KnownUser {
  id: string;
  login: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  provider: "github";
  lastSeenAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerLogin: string;
  teamId?: string;
  teamName?: string;
  repos: GitHubRepo[];
  members: ProjectMember[];
  memberIds?: string[];
  responderIds?: string[];
  breakpointCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  ownerLogin: string;
  teamName?: string;
  repoCount: number;
  breakpointCount: number;
  memberCount: number;
}

// ── Routing Configuration ────────────────────────────────────────────────

export const GitNativeBackendConfigSchema = z.object({
  type: z.literal("git-native"),
  breakpointsDir: z.string().optional(),
  pollIntervalMs: z.number().positive().optional(),
  timeoutMs: z.number().positive().optional(),
});

export const ServerBackendConfigSchema = z.object({
  type: z.literal("server"),
  url: z.string().min(1),
  authToken: z.string().min(1).optional(),
});
export type ServerBackendConfig = z.infer<typeof ServerBackendConfigSchema>;

export const GitHubIssuesBackendConfigSchema = z.object({
  type: z.literal("github-issues"),
  owner: z.string().min(1),
  repo: z.string().min(1),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
  pollIntervalMs: z.number().positive().optional(),
  timeoutMs: z.number().positive().optional(),
});
export type GitHubIssuesBackendConfig = z.infer<typeof GitHubIssuesBackendConfigSchema>;

export const BackendConfigSchema = z.discriminatedUnion("type", [
  GitNativeBackendConfigSchema,
  ServerBackendConfigSchema,
  GitHubIssuesBackendConfigSchema,
]);
export type BackendConfig = z.infer<typeof BackendConfigSchema>;

export const RoutingRuleSchema = z.object({
  domains: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  backend: z.string().min(1),
  backendConfig: z.record(z.string(), z.unknown()),
});
export type RoutingRule = z.infer<typeof RoutingRuleSchema>;

export const RoutingConfigSchema = z.object({
  defaultBackend: z.string().min(1),
  routes: z.array(RoutingRuleSchema),
});
export type RoutingConfig = z.infer<typeof RoutingConfigSchema>;

// ── Constants ────────────────────────────────────────────────────────────

export const DEFAULT_POLL_INTERVAL_MS = 3_000;
export const DEFAULT_TIMEOUT_MS = 30 * 60 * 1_000; // 30 minutes
export const BREAKPOINTS_DIR = ".breakpoints";
export const BREAKPOINTS_KEYS_DIR = ".breakpoints/.keys";
export const BREAKPOINTS_TRUSTED_KEYS_DIR = ".breakpoints/.keys/trusted";
export const BREAKPOINTS_PRIVATE_KEYS_DIR = ".breakpoints/.keys/private";

// ── Utility ──────────────────────────────────────────────────────────────

export function generateBreakpointId(): string {
  return randomBytes(12).toString("hex");
}
