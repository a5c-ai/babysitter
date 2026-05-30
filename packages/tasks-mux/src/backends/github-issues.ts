import { execSync } from "node:child_process";

import type {
  BreakpointBackend,
  BreakpointBackendCapabilities,
  SubmitBreakpointParams,
  WaitForAnswerOptions,
  SubmitAnswerParams,
  ListRespondersParams,
} from "../backend.js";
import {
  unsupportedBackendFeatureMessage,
  unsupportedBreakpointBackendCapabilities,
} from "../backend.js";

import type {
  Breakpoint,
  BreakpointAnswer,
  BreakpointWaitResult,
  BreakpointContext,
  BreakpointRouting,
  BreakpointSubmitter,
  CodeSnippet,
  ResponderProfile,
  GitHubIssuesBackendConfig,
} from "../types.js";

import {
  BreakpointSchema,
  BreakpointContextSchema,
  BreakpointRoutingSchema,
  BreakpointSubmitterSchema,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_POLL_INTERVAL_MS,
} from "../types.js";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const ISSUE_PAYLOAD_MARKER = "tasks-mux:issue:v1";
const ANSWER_PAYLOAD_MARKER = "tasks-mux:answer:v1";

interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<{ name: string }>;
  assignees: Array<{ login: string }>;
  created_at: string;
  updated_at: string;
}

interface GitHubComment {
  id: number;
  body: string;
  user: { login: string } | null;
  created_at: string;
}

interface GitHubIssuePayloadV1 {
  version: 1;
  schema: "tasks-mux:issue";
  text: string;
  context: BreakpointContext;
  routing: BreakpointRouting;
  projectId?: string;
  repoId?: string;
  createdBy?: BreakpointSubmitter;
}

interface GitHubAnswerPayloadV1 {
  version: 1;
  schema: "tasks-mux:answer";
  text: string;
  confidence?: number;
  references?: string[];
  responderId?: string;
  responderName?: string;
  breakpointId?: string;
  answeredAt?: string;
}

interface ParsedAnswer {
  text: string;
  confidence?: number;
  references?: string[];
  responderId?: string;
  responderName?: string;
  breakpointId?: string;
  answeredAt?: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPayloadBlock(marker: string, payload: unknown): string {
  return `<!-- ${marker}\n${JSON.stringify(payload, null, 2)}\n-->`;
}

function extractPayloadBlock<T>(
  body: string | null,
  marker: string,
): { payload?: T; cleanedBody: string } {
  if (!body) return { cleanedBody: "" };
  const regex = new RegExp(
    `<!--\\s*${escapeRegExp(marker)}\\s*([\\s\\S]*?)\\s*-->`,
    "m",
  );
  const match = body.match(regex);
  if (!match) return { cleanedBody: body };
  let payload: T | undefined;
  const raw = match[1].trim();
  if (raw.length > 0) {
    try {
      payload = JSON.parse(raw) as T;
    } catch {
      payload = undefined;
    }
  }
  const cleanedBody = body.replace(match[0], "").trim();
  return { payload, cleanedBody };
}

function parseIssuePayload(raw: unknown): GitHubIssuePayloadV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as Partial<GitHubIssuePayloadV1>;
  if (payload.version !== 1 || payload.schema !== "tasks-mux:issue") {
    return null;
  }
  if (typeof payload.text !== "string") return null;
  const contextParse = BreakpointContextSchema.safeParse(payload.context);
  if (!contextParse.success) return null;
  const routingParse = BreakpointRoutingSchema.safeParse(payload.routing);
  if (!routingParse.success) return null;
  if (payload.createdBy) {
    const createdByParse = BreakpointSubmitterSchema.safeParse(payload.createdBy);
    if (!createdByParse.success) return null;
  }
  return {
    version: 1,
    schema: "tasks-mux:issue",
    text: payload.text,
    context: contextParse.data,
    routing: routingParse.data,
    projectId: payload.projectId,
    repoId: payload.repoId,
    createdBy: payload.createdBy,
  };
}

function parseAnswerPayload(raw: unknown): ParsedAnswer | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as Partial<GitHubAnswerPayloadV1>;
  if (payload.version !== 1 || payload.schema !== "tasks-mux:answer") {
    return null;
  }
  if (typeof payload.text !== "string") return null;
  return {
    text: payload.text,
    confidence: typeof payload.confidence === "number" ? payload.confidence : undefined,
    references: Array.isArray(payload.references)
      ? payload.references.filter((item) => typeof item === "string")
      : undefined,
    responderId: typeof payload.responderId === "string" ? payload.responderId : undefined,
    responderName: typeof payload.responderName === "string" ? payload.responderName : undefined,
    breakpointId: typeof payload.breakpointId === "string" ? payload.breakpointId : undefined,
    answeredAt: typeof payload.answeredAt === "string" ? payload.answeredAt : undefined,
  };
}

function stripLegacyFooter(body: string): {
  cleanedBody: string;
  projectId?: string;
  repoId?: string;
} {
  const footerRegex = /\*Project:\s*([^|]+)\|\s*Repo:\s*([^*]+)\*/i;
  const match = footerRegex.exec(body);
  const projectId = match ? match[1].trim() : undefined;
  const repoId = match ? match[2].trim() : undefined;
  const cleanedBody = body.replace(footerRegex, "").replace(/\n---\n?$/, "").trim();
  return { cleanedBody, projectId, repoId };
}

function sliceSection(body: string, heading: string): string | null {
  const regex = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, "m");
  const match = regex.exec(body);
  if (!match) return null;
  const startIndex = match.index + match[0].length;
  const rest = body.slice(startIndex);
  const nextHeadingIndex = rest.search(/^##\s+/m);
  const section = nextHeadingIndex === -1 ? rest : rest.slice(0, nextHeadingIndex);
  return section.trim();
}

function parseLegacyFileReferences(body: string): string[] {
  const section = sliceSection(body, "File References");
  if (!section) return [];
  const lines = section.split(/\r?\n/);
  const files: string[] = [];
  for (const line of lines) {
    const match = /`([^`]+)`/.exec(line);
    if (match) {
      files.push(match[1].trim());
      continue;
    }
    const trimmed = line.replace(/^-/, "").trim();
    if (trimmed.length > 0) {
      files.push(trimmed);
    }
  }
  return files;
}

function parseLegacyCodeSnippets(body: string): CodeSnippet[] {
  const section = sliceSection(body, "Code Snippets");
  if (!section) return [];
  const snippets: CodeSnippet[] = [];
  const regex = /```([^\n]*)\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(section)) !== null) {
    const language = match[1]?.trim();
    const code = match[2].trim();
    const before = section.slice(0, match.index);
    const lines = before.trim().split(/\r?\n/);
    const lastLine = lines[lines.length - 1] ?? "";
    const filenameMatch = /^###\s+(.+)/.exec(lastLine.trim());
    if (filenameMatch) {
      snippets.push({
        filename: filenameMatch[1].trim(),
        code,
        language: language || undefined,
      });
    } else {
      snippets.push(code);
    }
  }
  return snippets;
}

function parseLegacyTags(body: string, labels: Array<{ name: string }>): string[] {
  const tagMatch = /\*\*Tags:\*\*\s*(.+)/i.exec(body);
  if (tagMatch) {
    return tagMatch[1]
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }
  return labels.map((label) => label.name);
}

function parseLegacyUrgency(body: string, labels: Array<{ name: string }>): string | undefined {
  const urgencyMatch = /\*\*Urgency:\*\*\s*(\w+)/i.exec(body);
  if (urgencyMatch) {
    const normalized = urgencyMatch[1].trim().toLowerCase();
    if (normalized === "low" || normalized === "medium" || normalized === "high") {
      return normalized;
    }
  }
  const labelMatch = labels.find((label) => label.name.startsWith("urgency:"));
  if (labelMatch) {
    const normalized = labelMatch.name.replace(/^urgency:/, "").toLowerCase();
    if (normalized === "low" || normalized === "medium" || normalized === "high") {
      return normalized;
    }
  }
  return undefined;
}

function extractLegacyDescription(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "";
  const nextHeadingIndex = trimmed.search(/^##\s+/m);
  const description = nextHeadingIndex === -1 ? trimmed : trimmed.slice(0, nextHeadingIndex);
  return description.trim();
}
/**
 * Resolve a GitHub token by trying `gh auth token` first,
 * then falling back to the GITHUB_TOKEN environment variable.
 */
export function getGitHubToken(): string {
  try {
    const token = execSync("gh auth token", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    if (token) return token;
  } catch {
    // gh CLI not available or not authenticated
  }
  const envToken = process.env.GITHUB_TOKEN;
  if (envToken) return envToken;
  throw new Error(
    "No GitHub token found. Install the GitHub CLI and run `gh auth login`, or set the GITHUB_TOKEN environment variable.",
  );
}

/**
 * Minimum character length for a plain-text comment to be treated
 * as an answer from an assigned responder (heuristic).
 */
const PLAIN_TEXT_ANSWER_MIN_LENGTH = 80;

/**
 * Parse an answer from a GitHub issue comment body.
 * Looks for a hidden JSON payload block, a "## Answer" heading anywhere
 * in the body, a JSON code block with an "answer" field, or a sufficiently
 * long plain-text comment (for assigned responders handled upstream).
 */
export function parseAnswerFromComment(
  body: string,
  options?: { isAssignedResponder?: boolean },
): ParsedAnswer | null {
  const { payload } = extractPayloadBlock<GitHubAnswerPayloadV1>(
    body,
    ANSWER_PAYLOAD_MARKER,
  );
  const payloadAnswer = parseAnswerPayload(payload);
  if (payloadAnswer) {
    return payloadAnswer;
  }

  // Try "## Answer" marker anywhere in the body
  const markerIndex = body.indexOf("## Answer");
  if (markerIndex !== -1) {
    const afterMarker = body.slice(markerIndex + "## Answer".length).trim();
    if (afterMarker.length > 0) {
      // Split off metadata footer (after --- separator)
      const hrIndex = afterMarker.indexOf("\n---\n");
      const answerText = hrIndex !== -1 ? afterMarker.slice(0, hrIndex).trim() : afterMarker;
      let confidence: number | undefined;
      let references: string[] | undefined;
      if (hrIndex !== -1) {
        const footer = afterMarker.slice(hrIndex + 5);
        const confMatch = /\*\*Confidence:\*\*\s*(\d+)\/100/.exec(footer);
        if (confMatch) confidence = parseInt(confMatch[1], 10);
        const refMatch = /\*\*References:\*\*\s*(.+)/.exec(footer);
        if (refMatch) references = refMatch[1].split(",").map((s) => s.trim());
      }
      return { text: answerText, confidence, references };
    }
  }

  // Try JSON code block with "answer" field
  const jsonBlockMatch = body.match(
    /```(?:json)?\s*\n(\{[\s\S]*?\})\s*\n```/,
  );
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1]) as Record<string, unknown>;
      if (typeof parsed.answer === "string") {
        return {
          text: parsed.answer,
          confidence: typeof parsed.confidence === "number" ? parsed.confidence : undefined,
          references: Array.isArray(parsed.references) ? parsed.references as string[] : undefined,
        };
      }
    } catch {
      // Not valid JSON, skip
    }
  }

  // Plain-text fallback for assigned responders with long comments
  if (options?.isAssignedResponder && body.trim().length >= PLAIN_TEXT_ANSWER_MIN_LENGTH) {
    return { text: body.trim() };
  }

  return null;
}

/**
 * BreakpointBackend implementation backed by GitHub Issues.
 *
 * Each breakpoint maps to a GitHub issue; answers are detected
 * from issue comments containing payload blocks, "## Answer" markers, or JSON blocks.
 */
export class GitHubIssuesBackend implements BreakpointBackend {
  readonly name = "github-issues";

  private owner: string;
  private repo: string;
  private labels: string[];
  private assignees: string[];
  private defaultPollIntervalMs: number;
  private defaultTimeoutMs: number;

  /**
   * Maps breakpointId -> GitHub issue number.
   *
   * Used for legacy non-`gh-{number}` IDs within a single process.
   * New breakpoints always use `gh-{number}` IDs and remain durable
   * across backend restarts without this map.
   */
  private issueMap = new Map<string, number>();

  private tokenOverride?: string;

  /**
   * Resolve the GitHub issue number from a breakpoint ID.
   * Checks the in-memory map first, then parses the `gh-{number}` format
   * so that IDs survive across backend instances.
   */
  private resolveIssueNumber(breakpointId: string): number {
    const mapped = this.issueMap.get(breakpointId);
    if (mapped !== undefined) return mapped;

    const match = /^gh-(\d+)$/.exec(breakpointId);
    if (match) {
      const num = parseInt(match[1], 10);
      this.issueMap.set(breakpointId, num);
      return num;
    }

    throw new Error(`Unknown breakpoint ID: ${breakpointId}`);
  }

  constructor(config: GitHubIssuesBackendConfig) {
    this.owner = config.owner;
    this.repo = config.repo;
    this.labels = config.labels ?? [];
    this.assignees = config.assignees ?? [];
    this.defaultPollIntervalMs = config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.defaultTimeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  capabilities(): BreakpointBackendCapabilities {
    return {
      ...unsupportedBreakpointBackendCapabilities,
      comments: true,
      history: true,
      export: true,
    };
  }

  /**
   * Override the token resolution for testing.
   * @internal
   */
  setToken(token: string): void {
    this.tokenOverride = token;
  }

  private getToken(): string {
    if (this.tokenOverride) return this.tokenOverride;
    return getGitHubToken();
  }

  private async githubFetch(
    path: string,
    options: RequestInit = {},
    retryCount = 0,
  ): Promise<Response> {
    const maxRetries = 3;
    const token = this.getToken();
    const url = `${GITHUB_API_BASE}${path}`;
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      ...(options.headers as Record<string, string> | undefined),
    };
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, { ...options, headers });

    // Handle rate limiting
    if (response.status === 403 || response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      if (retryAfter) {
        if (retryCount >= maxRetries) {
          throw new Error(
            `GitHub API rate limit exceeded after ${maxRetries} retries`,
          );
        }
        const waitMs = parseInt(retryAfter, 10) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        return this.githubFetch(path, options, retryCount + 1);
      }
      // 403 without Retry-After is likely an auth failure or forbidden repo
      if (response.status === 403) {
        const errorBody = await response.text();
        throw new Error(
          `GitHub API forbidden (403): ${errorBody}`,
        );
      }
    }

    return response;
  }

  private repoPath(): string {
    return `/repos/${this.owner}/${this.repo}`;
  }

  private mapIssueToBreakpoint(
    issue: GitHubIssue,
  ): Breakpoint {
    const breakpointId = `gh-${issue.number}`;
    const { payload, cleanedBody } = extractPayloadBlock<GitHubIssuePayloadV1>(
      issue.body,
      ISSUE_PAYLOAD_MARKER,
    );
    const parsedPayload = parseIssuePayload(payload);
    const { cleanedBody: legacyBody, projectId: legacyProjectId, repoId: legacyRepoId } =
      stripLegacyFooter(cleanedBody);
    const legacyTags = parseLegacyTags(legacyBody, issue.labels);
    const legacyUrgency = parseLegacyUrgency(legacyBody, issue.labels);
    const legacyContext: BreakpointContext = {
      description: extractLegacyDescription(legacyBody),
      codeSnippets: parseLegacyCodeSnippets(legacyBody),
      fileReferences: parseLegacyFileReferences(legacyBody),
      tags: legacyTags,
      urgency: legacyUrgency as BreakpointContext["urgency"],
    };
    const routing: BreakpointRouting = parsedPayload?.routing ?? {
      strategy: "single",
      targetResponders: issue.assignees.map((a) => a.login),
      timeoutMs: this.defaultTimeoutMs,
      presentToUser: false,
    };
    const hasAssignee = issue.assignees.length > 0;
    let status: Breakpoint["status"];
    if (issue.state === "closed") {
      status = "completed";
    } else if (hasAssignee) {
      status = "claimed";
    } else {
      status = "pending";
    }

    return BreakpointSchema.parse({
      id: breakpointId,
      text: parsedPayload?.text ?? issue.title,
      context: parsedPayload?.context ?? legacyContext,
      status,
      routing,
      answers: [],
      projectId: parsedPayload?.projectId ?? legacyProjectId,
      repoId: parsedPayload?.repoId ?? legacyRepoId,
      createdBy: parsedPayload?.createdBy,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      expiresAt: new Date(
        new Date(issue.created_at).getTime() + routing.timeoutMs,
      ).toISOString(),
    });
  }

  private buildAnswerFromComment(
    comment: GitHubComment,
    breakpointId: string,
    isAssignedResponder: boolean,
  ): BreakpointAnswer | null {
    if (!comment.body) return null;
    const parsed = parseAnswerFromComment(comment.body, { isAssignedResponder });
    if (!parsed) return null;
    const responderId = parsed.responderId ?? comment.user?.login ?? "unknown";
    const responderName = parsed.responderName ?? responderId;
    return {
      id: `comment-${comment.id}`,
      breakpointId: parsed.breakpointId === breakpointId ? parsed.breakpointId : breakpointId,
      responderId,
      responderName,
      text: parsed.text,
      confidence: parsed.confidence ?? 80,
      references: parsed.references ?? [],
      followUpQuestions: [],
      answeredAt: parsed.answeredAt ?? comment.created_at,
    };
  }

  private formatIssueBody(params: SubmitBreakpointParams): string {
    const parts: string[] = [];
    const context = params.context;
    const createdBy = (params as { createdBy?: BreakpointSubmitter }).createdBy;
    if (context.title && context.title !== params.text) {
      parts.push(`**Title:** ${context.title}`);
    }
    if (context.summary) {
      parts.push(`**Summary:** ${context.summary}`);
    }
    if (context.description) {
      parts.push(context.description);
    }
    if (context.markdown) {
      parts.push("## Details");
      parts.push(context.markdown);
    }
    if (context.codeSnippets.length > 0) {
      parts.push("## Code Snippets");
      for (const snippet of context.codeSnippets) {
        if (typeof snippet === "string") {
          parts.push("```\n" + snippet + "\n```");
        } else {
          parts.push(
            `### ${snippet.filename}` +
            "\n```" + (snippet.language ?? "") + "\n" +
            snippet.code +
            "\n```",
          );
        }
      }
    }
    if (context.fileReferences.length > 0) {
      parts.push("## File References");
      parts.push(context.fileReferences.map((f) => `- \`${f}\``).join("\n"));
    }
    if (context.tags.length > 0) {
      parts.push(`**Tags:** ${context.tags.join(", ")}`);
    }
    if (context.domain) {
      parts.push(`**Domain:** ${context.domain}`);
    }
    if (context.interactionKind) {
      parts.push(`**Interaction Kind:** ${context.interactionKind}`);
    }
    if (context.urgency) {
      parts.push(`**Urgency:** ${context.urgency}`);
    }
    if (context.links && context.links.length > 0) {
      parts.push("## Links");
      parts.push(
        context.links
          .map((link) => `- ${link.label}: ${link.url}`)
          .join("\n"),
      );
    }
    if (context.sections && context.sections.length > 0) {
      parts.push("## Sections");
      for (const section of context.sections) {
        parts.push(`### ${section.title}`);
        parts.push(section.markdown);
      }
    }
    if (context.artifacts && context.artifacts.length > 0) {
      parts.push("## Artifacts");
      parts.push(
        context.artifacts
          .map((artifact) => `- ${artifact.label}: ${artifact.url}`)
          .join("\n"),
      );
    }
    if (context.metadata && Object.keys(context.metadata).length > 0) {
      parts.push("## Metadata");
      parts.push(`\`\`\`json\n${JSON.stringify(context.metadata, null, 2)}\n\`\`\``);
    }
    parts.push(`\n---\n*Project: ${params.projectId ?? "unknown"} | Repo: ${params.repoId ?? "unknown"}*`);
    const payload: GitHubIssuePayloadV1 = {
      version: 1,
      schema: "tasks-mux:issue",
      text: params.text,
      context: {
        description: context.description,
        codeSnippets: context.codeSnippets,
        fileReferences: context.fileReferences,
        tags: context.tags,
        title: context.title,
        summary: context.summary,
        markdown: context.markdown,
        domain: context.domain,
        urgency: context.urgency,
        interactionKind: context.interactionKind,
        links: context.links,
        sections: context.sections,
        artifacts: context.artifacts,
        metadata: context.metadata,
      },
      routing: {
        strategy: params.routing.strategy,
        targetResponders: params.routing.targetResponders,
        timeoutMs: params.routing.timeoutMs,
        presentToUser: params.routing.presentToUser,
        autoApproveAfterN: params.routing.autoApproveAfterN,
        breakpointId: params.routing.breakpointId,
      },
      projectId: params.projectId,
      repoId: params.repoId,
      createdBy,
    };
    parts.push(buildPayloadBlock(ISSUE_PAYLOAD_MARKER, payload));
    return parts.join("\n\n");
  }

  async submitBreakpoint(params: SubmitBreakpointParams): Promise<Breakpoint> {
    if (params.proven) {
      throw new Error(unsupportedBackendFeatureMessage(this.name, "ask_breakpoint.proven"));
    }

    const urgency = params.context.urgency;
    const issueLabels = [...this.labels];
    if (urgency) {
      issueLabels.push(`urgency:${urgency}`);
    }

    const response = await this.githubFetch(`${this.repoPath()}/issues`, {
      method: "POST",
      body: JSON.stringify({
        title: params.text,
        body: this.formatIssueBody(params),
        labels: issueLabels,
        assignees: this.assignees,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${errorBody}`);
    }

    const issue = (await response.json()) as GitHubIssue;
    const breakpointId = `gh-${issue.number}`;
    this.issueMap.set(breakpointId, issue.number);

    return this.mapIssueToBreakpoint(issue);
  }

  async getBreakpoint(id: string): Promise<Breakpoint> {
    const issueNumber = this.resolveIssueNumber(id);

    const response = await this.githubFetch(
      `${this.repoPath()}/issues/${issueNumber}`,
    );
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${errorBody}`);
    }

    const issue = (await response.json()) as GitHubIssue;
    const breakpoint = this.mapIssueToBreakpoint(issue);

    // Fetch comments to detect answers
    const assigneeLogins = new Set(issue.assignees.map((a) => a.login));
    const commentsResponse = await this.githubFetch(
      `${this.repoPath()}/issues/${issueNumber}/comments`,
    );
    if (commentsResponse.ok) {
      const comments = (await commentsResponse.json()) as GitHubComment[];
      for (const comment of comments) {
        if (!comment.body) continue;
        const commenterLogin = comment.user?.login ?? "";
        const isAssignedResponder = assigneeLogins.has(commenterLogin);
        const answer = this.buildAnswerFromComment(comment, breakpoint.id, isAssignedResponder);
        if (answer) {
          breakpoint.answers.push(answer);
        }
      }
      if (breakpoint.answers.length > 0 && breakpoint.status === "claimed") {
        breakpoint.status = "answered";
      }
    }

    return breakpoint;
  }

  async waitForAnswer(
    id: string,
    options?: WaitForAnswerOptions,
  ): Promise<BreakpointWaitResult> {
    const issueNumber = this.resolveIssueNumber(id);

    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const pollIntervalMs = options?.pollIntervalMs ?? this.defaultPollIntervalMs;
    const signal = options?.signal;

    const startTime = Date.now();

    while (true) {
      if (signal?.aborted) {
        const breakpoint = await this.getBreakpoint(id);
        return {
          answered: false,
          breakpoint,
          allAnswers: [],
          resolution: "aborted",
          elapsedMs: Date.now() - startTime,
        };
      }

      // Fetch issue metadata for assignees and state
      const issueMetaResponse = await this.githubFetch(
        `${this.repoPath()}/issues/${issueNumber}`,
      );
      const assigneeLogins = new Set<string>();
      let issueMeta: GitHubIssue | null = null;
      if (issueMetaResponse.ok) {
        issueMeta = (await issueMetaResponse.json()) as GitHubIssue;
        for (const a of issueMeta.assignees) {
          assigneeLogins.add(a.login);
        }
      }

      // Check for comments with answers
      const commentsResponse = await this.githubFetch(
        `${this.repoPath()}/issues/${issueNumber}/comments`,
      );
      if (!commentsResponse.ok) {
        const errorBody = await commentsResponse.text();
        throw new Error(
          `Failed to fetch comments for issue #${issueNumber} (${commentsResponse.status}): ${errorBody}`,
        );
      }
      const comments = (await commentsResponse.json()) as GitHubComment[];
      for (const comment of comments) {
        if (!comment.body) continue;
        const commenterLogin = comment.user?.login ?? "";
        const isAssignedResponder = assigneeLogins.has(commenterLogin);
        const answer = this.buildAnswerFromComment(comment, `gh-${issueNumber}`, isAssignedResponder);
        if (!answer) continue;
        const breakpoint = await this.getBreakpoint(id);
        return {
          answered: true,
          breakpoint: { ...breakpoint, status: "answered", answers: [answer] },
          answer,
          allAnswers: [answer],
          elapsedMs: Date.now() - startTime,
        };
      }

      // Check if issue was closed (reuse metadata already fetched)
      if (issueMeta && issueMeta.state === "closed") {
        const breakpoint = this.mapIssueToBreakpoint(issueMeta);
        return {
          answered: false,
          breakpoint,
          allAnswers: [],
          resolution: "closed",
          elapsedMs: Date.now() - startTime,
        };
      }

      // Check timeout
      if (Date.now() - startTime >= timeoutMs) {
        const breakpoint = await this.getBreakpoint(id);
        return {
          answered: false,
          breakpoint,
          allAnswers: [],
          resolution: "timeout",
          elapsedMs: Date.now() - startTime,
        };
      }

      // Wait before next poll
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, pollIntervalMs);
        if (signal) {
          const onAbort = () => {
            clearTimeout(timer);
            resolve();
          };
          signal.addEventListener("abort", onAbort, { once: true });
        }
      });
    }
  }

  async listResponders(_params?: ListRespondersParams): Promise<ResponderProfile[]> {
    return this.assignees.map((login) => ({
      id: login,
      type: "human" as const,
      name: login,
      title: "",
      capabilities: ["review", "approval", "text"],
      domains: [],
      tags: [],
      availability: true,
      responseTimeSla: this.defaultTimeoutMs / 1000,
    }));
  }

  async claimBreakpoint(id: string, responderId: string): Promise<Breakpoint> {
    const issueNumber = this.resolveIssueNumber(id);

    // Post claim comment
    await this.githubFetch(
      `${this.repoPath()}/issues/${issueNumber}/comments`,
      {
        method: "POST",
        body: JSON.stringify({
          body: `Claimed by ${responderId}`,
        }),
      },
    );

    // Actually assign the responder on the GitHub issue
    await this.githubFetch(
      `${this.repoPath()}/issues/${issueNumber}/assignees`,
      {
        method: "POST",
        body: JSON.stringify({
          assignees: [responderId],
        }),
      },
    );

    return this.getBreakpoint(id);
  }

  async answerBreakpoint(
    id: string,
    answer: SubmitAnswerParams,
  ): Promise<BreakpointAnswer> {
    if (answer.sign || answer.keyFingerprint) {
      throw new Error(unsupportedBackendFeatureMessage(this.name, "answer signing"));
    }

    const issueNumber = this.resolveIssueNumber(id);

    const metadataLines: string[] = [];
    if (answer.confidence !== undefined) {
      metadataLines.push(`**Confidence:** ${answer.confidence}/100`);
    }
    if (answer.references && answer.references.length > 0) {
      metadataLines.push(`**References:** ${answer.references.join(", ")}`);
    }
    const metadataSection = metadataLines.length > 0
      ? `\n\n---\n${metadataLines.join("\n")}`
      : "";
    const breakpointId = `gh-${issueNumber}`;
    const payload: GitHubAnswerPayloadV1 = {
      version: 1,
      schema: "tasks-mux:answer",
      text: answer.text,
      confidence: answer.confidence,
      references: answer.references,
      responderId: answer.responderId,
      responderName: answer.responderName,
      breakpointId,
    };
    const commentBody = `## Answer\n\n${answer.text}${metadataSection}\n\n${buildPayloadBlock(
      ANSWER_PAYLOAD_MARKER,
      payload,
    )}`;
    const response = await this.githubFetch(
      `${this.repoPath()}/issues/${issueNumber}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ body: commentBody }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${errorBody}`);
    }

    const comment = (await response.json()) as GitHubComment;

    // Close the issue now that it's answered
    await this.githubFetch(
      `${this.repoPath()}/issues/${issueNumber}`,
      {
        method: "PATCH",
        body: JSON.stringify({ state: "closed" }),
      },
    );

    return {
      id: `comment-${comment.id}`,
      breakpointId,
      responderId: answer.responderId,
      responderName: answer.responderName,
      text: answer.text,
      confidence: answer.confidence ?? 80,
      references: answer.references ?? [],
      followUpQuestions: answer.followUpQuestions ?? [],
      answeredAt: comment.created_at,
      decisionMemory: answer.decisionMemory
        ? { ...answer.decisionMemory, savedAt: new Date().toISOString() }
        : undefined,
    };
  }

  async listPendingBreakpoints(responderId?: string): Promise<Breakpoint[]> {
    const params = new URLSearchParams({
      state: "open",
      assignee: responderId ?? "",
    });
    for (const label of this.labels) {
      params.append("labels", label);
    }

    const response = await this.githubFetch(
      `${this.repoPath()}/issues?${params.toString()}`,
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${errorBody}`);
    }

    const issues: GitHubIssue[] = await response.json() as GitHubIssue[];
    return issues.map((issue) => {
      const breakpointId = `gh-${issue.number}`;
      this.issueMap.set(breakpointId, issue.number);
      return this.mapIssueToBreakpoint(issue);
    });
  }

  async cancelBreakpoint(id: string): Promise<void> {
    const issueNumber = this.resolveIssueNumber(id);

    const response = await this.githubFetch(
      `${this.repoPath()}/issues/${issueNumber}`,
      {
        method: "PATCH",
        body: JSON.stringify({ state: "closed" }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${errorBody}`);
    }
  }
}
