import type {
  BreakpointBackend,
  BreakpointBackendCapabilities,
  ListRespondersParams,
  SubmitAnswerParams,
  SubmitBreakpointParams,
  WaitForAnswerOptions,
} from "../backend.js";
import {
  selectBreakpointAnswer,
  unsupportedBackendFeatureMessage,
  unsupportedBreakpointBackendCapabilities,
} from "../backend.js";
import { GitHubIssuesBackend } from "./github-issues.js";
import type {
  Breakpoint,
  BreakpointAnswer,
  BreakpointPublicAnswer,
  BreakpointWaitResult,
  ExternalTrackerBackendConfig,
  ExternalTrackerFieldMapping,
  ExternalTrackerProvider,
  ExternalTrackerStatus,
  ResponderProfile,
} from "../types.js";
import {
  BreakpointSchema,
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
} from "../types.js";

export interface ExternalTrackerReference {
  provider: ExternalTrackerProvider;
  id: string;
  key?: string;
  url?: string;
}

export interface ExternalTrackerIssue {
  ref: ExternalTrackerReference;
  title: string;
  description?: string;
  status: ExternalTrackerStatus;
  labels: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
  comments: ExternalTrackerComment[];
  metadata?: Record<string, unknown>;
}

export interface ExternalTrackerComment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface ExternalTrackerWebhookEvent {
  provider: ExternalTrackerProvider;
  eventId: string;
  action: "issue.created" | "issue.updated" | "comment.created" | "issue.deleted";
  issue: ExternalTrackerIssue;
  comment?: ExternalTrackerComment;
  receivedAt: string;
}

export interface ExternalTrackerWebhookResult {
  accepted: boolean;
  duplicate: boolean;
  event?: ExternalTrackerWebhookEvent;
  breakpoint?: Breakpoint;
  answer?: BreakpointPublicAnswer;
}

export interface ExternalTrackerCreateIssueInput {
  title: string;
  description: string;
  labels: string[];
  assignees: string[];
  fields: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface ExternalTrackerAdapter {
  readonly provider: ExternalTrackerProvider;
  createIssue(input: ExternalTrackerCreateIssueInput): Promise<ExternalTrackerIssue>;
  getIssue(ref: ExternalTrackerReference): Promise<ExternalTrackerIssue>;
  listIssues(): Promise<ExternalTrackerIssue[]>;
  addComment(ref: ExternalTrackerReference, answer: SubmitAnswerParams): Promise<ExternalTrackerComment>;
  transitionIssue(ref: ExternalTrackerReference, status: ExternalTrackerStatus): Promise<void>;
  claimIssue?(ref: ExternalTrackerReference, responderId: string): Promise<void>;
  normalizeWebhook?(payload: unknown, headers?: Record<string, string>): ExternalTrackerWebhookEvent | null;
}

type JsonRecord = Record<string, unknown>;

const TRACKER_ANSWER_MARKER = "tasks-mux:tracker-answer:v1";
const SECRET_KEYS = [
  "token",
  "authorization",
  "auth",
  "secret",
  "password",
  "apiKey",
  "apiToken",
  "webhookSecret",
] as const;

function nowIso(): string {
  return new Date().toISOString();
}

function encodeRef(provider: ExternalTrackerProvider, externalId: string): string {
  return `tracker-${provider}-${Buffer.from(externalId, "utf8").toString("base64url")}`;
}

function decodeRef(id: string): { provider: ExternalTrackerProvider; externalId: string } {
  const match = /^tracker-(github-issues|jira|linear|generic-rest)-(.+)$/.exec(id);
  if (!match) {
    throw new Error(`Unknown external tracker breakpoint ID: ${id}`);
  }
  return {
    provider: match[1] as ExternalTrackerProvider,
    externalId: Buffer.from(match[2], "base64url").toString("utf8"),
  };
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function getPath(source: unknown, path: string | undefined): unknown {
  if (!path) return undefined;
  let current = source;
  for (const part of path.split(".")) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as JsonRecord)[part];
  }
  return current;
}

function env(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function getTrackerString(config: ExternalTrackerBackendConfig, key: string): string | undefined {
  return readString(asRecord(config.tracker)[key]);
}

function getTrackerNumber(config: ExternalTrackerBackendConfig, key: string): number | undefined {
  const value = asRecord(config.tracker)[key];
  return typeof value === "number" ? value : undefined;
}

function normalizeStatus(
  rawStatus: string | undefined,
  config: ExternalTrackerBackendConfig,
): ExternalTrackerStatus {
  if (!rawStatus) return "open";
  const mapped = config.statusMapping?.[rawStatus] ?? config.statusMapping?.[rawStatus.toLowerCase()];
  if (mapped) return mapped;
  const normalized = rawStatus.toLowerCase();
  if (normalized === "done" || normalized === "closed" || normalized === "resolved") return "completed";
  if (normalized === "cancelled" || normalized === "canceled") return "cancelled";
  if (normalized === "answered") return "answered";
  if (normalized === "claimed" || normalized === "in progress") return "claimed";
  return "open";
}

export function redactExternalTrackerSecrets<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactExternalTrackerSecrets(item)) as T;
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const redacted: JsonRecord = {};
  for (const [key, nested] of Object.entries(value as JsonRecord)) {
    const isSecret = SECRET_KEYS.some((secretKey) => key.toLowerCase().includes(secretKey.toLowerCase()));
    redacted[key] = isSecret ? "[REDACTED]" : redactExternalTrackerSecrets(nested);
  }
  return redacted as T;
}

function buildAnswerBlock(answer: SubmitAnswerParams): string {
  const payload = {
    version: 1,
    schema: "tasks-mux:tracker-answer",
    responderId: answer.responderId,
    responderName: answer.responderName,
    text: answer.text,
    confidence: answer.confidence,
    references: answer.references,
  };
  return [
    "## Answer",
    "",
    answer.text,
    "",
    `<!-- ${TRACKER_ANSWER_MARKER}`,
    JSON.stringify(payload, null, 2),
    "-->",
  ].join("\n");
}

function answerFromComment(
  comment: ExternalTrackerComment,
  breakpointId: string,
): BreakpointAnswer | null {
  const marker = `<!-- ${TRACKER_ANSWER_MARKER}`;
  const markerIndex = comment.body.indexOf(marker);
  let text = comment.body.trim();
  let confidence: number | undefined;
  let references: string[] | undefined;
  if (markerIndex >= 0) {
    text = comment.body.slice(0, markerIndex).replace(/^## Answer\s*/m, "").trim();
    const jsonStart = comment.body.indexOf("\n", markerIndex);
    const jsonEnd = comment.body.indexOf("-->", jsonStart);
    if (jsonStart >= 0 && jsonEnd >= 0) {
      try {
        const payload = JSON.parse(comment.body.slice(jsonStart, jsonEnd).trim()) as JsonRecord;
        text = readString(payload.text) ?? text;
        confidence = typeof payload.confidence === "number" ? payload.confidence : undefined;
        references = readStringArray(payload.references);
      } catch {
        // Ignore malformed provider comments and fall back to visible text.
      }
    }
  } else if (!comment.body.includes("## Answer")) {
    return null;
  } else {
    text = comment.body.replace(/^## Answer\s*/m, "").trim();
  }

  if (text.length === 0) return null;
  return {
    id: `tracker-comment-${comment.id}`,
    breakpointId,
    responderId: comment.authorId,
    responderName: comment.authorName,
    text,
    confidence: confidence ?? 80,
    references: references ?? [],
    followUpQuestions: [],
    answeredAt: comment.createdAt,
  };
}

abstract class HttpTrackerAdapter implements ExternalTrackerAdapter {
  abstract readonly provider: ExternalTrackerProvider;

  constructor(protected readonly config: ExternalTrackerBackendConfig) {}

  abstract createIssue(input: ExternalTrackerCreateIssueInput): Promise<ExternalTrackerIssue>;
  abstract getIssue(ref: ExternalTrackerReference): Promise<ExternalTrackerIssue>;
  abstract listIssues(): Promise<ExternalTrackerIssue[]>;
  abstract addComment(ref: ExternalTrackerReference, answer: SubmitAnswerParams): Promise<ExternalTrackerComment>;
  abstract transitionIssue(ref: ExternalTrackerReference, status: ExternalTrackerStatus): Promise<void>;

  protected async requestJson(pathOrUrl: string, init: RequestInit = {}): Promise<unknown> {
    const baseUrl = getTrackerString(this.config, "baseUrl") ?? "";
    const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${baseUrl}${pathOrUrl}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init.headers as Record<string, string> | undefined),
    };
    if (init.body) headers["Content-Type"] = "application/json";
    this.applyAuth(headers);
    const response = await fetch(url, { ...init, headers });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`${this.provider} tracker request failed (${response.status}): ${body}`);
    }
    if (response.status === 204) return {};
    const text = await response.text();
    return text.length > 0 ? JSON.parse(text) as unknown : {};
  }

  protected applyAuth(headers: Record<string, string>): void {
    const token = env(this.config.auth?.tokenEnv) ?? env(this.config.auth?.apiTokenEnv);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  protected mapIssue(raw: unknown, fallbackId?: string): ExternalTrackerIssue {
    const mapping = this.config.fieldMapping;
    const record = asRecord(raw);
    const id = readString(getPath(record, mapping?.externalId)) ?? readString(record.id) ?? fallbackId ?? "";
    const key = readString(getPath(record, mapping?.externalKey)) ?? readString(record.key);
    const title = readString(getPath(record, mapping?.title)) ?? readString(record.title) ?? readString(record.summary) ?? key ?? id;
    const description = readString(getPath(record, mapping?.description)) ?? readString(record.description);
    const status = normalizeStatus(readString(getPath(record, mapping?.status)) ?? readString(record.status), this.config);
    const labels = readStringArray(getPath(record, mapping?.labels) ?? record.labels);
    const assignees = readStringArray(getPath(record, mapping?.assignee) ?? record.assignees);
    const createdAt = readString(record.createdAt) ?? readString(record.created_at) ?? nowIso();
    const updatedAt = readString(getPath(record, mapping?.updatedAt)) ?? readString(record.updatedAt) ?? readString(record.updated_at) ?? createdAt;
    const url = readString(getPath(record, mapping?.url)) ?? readString(record.url);
    return {
      ref: { provider: this.provider, id, key, url },
      title,
      description,
      status,
      labels,
      assignees,
      createdAt,
      updatedAt,
      comments: this.mapComments(record.comments),
      metadata: redactExternalTrackerSecrets(record),
    };
  }

  protected mapComments(raw: unknown): ExternalTrackerComment[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item, index) => {
      const record = asRecord(item);
      const author = asRecord(record.author ?? record.user);
      return {
        id: readString(record.id) ?? String(index),
        authorId: readString(record.authorId) ?? readString(author.id) ?? readString(author.login) ?? "unknown",
        authorName: readString(record.authorName) ?? readString(author.name) ?? readString(author.login) ?? "unknown",
        body: readString(record.body) ?? readString(record.text) ?? "",
        createdAt: readString(record.createdAt) ?? readString(record.created_at) ?? nowIso(),
      };
    });
  }

  normalizeWebhook(payload: unknown): ExternalTrackerWebhookEvent | null {
    const record = asRecord(payload);
    const issueSource = record.issue ?? record.data ?? record;
    const issue = this.mapIssue(issueSource);
    if (!issue.ref.id) return null;
    const comment = record.comment ? this.mapComments([record.comment])[0] : undefined;
    return {
      provider: this.provider,
      eventId: readString(record.eventId) ?? readString(record.id) ?? `${issue.ref.id}:${issue.updatedAt}:${comment?.id ?? "issue"}`,
      action: comment ? "comment.created" : "issue.updated",
      issue,
      comment,
      receivedAt: nowIso(),
    };
  }
}

export class JiraTrackerAdapter extends HttpTrackerAdapter {
  readonly provider = "jira" as const;

  async createIssue(input: ExternalTrackerCreateIssueInput): Promise<ExternalTrackerIssue> {
    const projectKey = getTrackerString(this.config, "projectKey");
    const issueType = getTrackerString(this.config, "issueType") ?? "Task";
    const fields: JsonRecord = {
      project: projectKey ? { key: projectKey } : undefined,
      issuetype: { name: issueType },
      summary: input.title,
      description: input.description,
      labels: input.labels,
      ...input.fields,
    };
    const raw = await this.requestJson("/rest/api/3/issue", {
      method: "POST",
      body: JSON.stringify({ fields: redactExternalTrackerSecrets(fields) }),
    });
    return this.mapIssue(raw);
  }

  async getIssue(ref: ExternalTrackerReference): Promise<ExternalTrackerIssue> {
    const key = encodeURIComponent(ref.key ?? ref.id);
    const raw = await this.requestJson(`/rest/api/3/issue/${key}?expand=renderedFields,comments`);
    return this.mapIssue(raw, ref.id);
  }

  async listIssues(): Promise<ExternalTrackerIssue[]> {
    const jql = getTrackerString(this.config, "jql") ?? "";
    const maxResults = getTrackerNumber(this.config, "maxResults") ?? 50;
    const raw = await this.requestJson(`/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`);
    const issues = asRecord(raw).issues;
    return Array.isArray(issues) ? issues.map((issue) => this.mapIssue(issue)) : [];
  }

  async addComment(ref: ExternalTrackerReference, answer: SubmitAnswerParams): Promise<ExternalTrackerComment> {
    const key = encodeURIComponent(ref.key ?? ref.id);
    const raw = await this.requestJson(`/rest/api/3/issue/${key}/comment`, {
      method: "POST",
      body: JSON.stringify({ body: buildAnswerBlock(answer) }),
    });
    return this.mapComments([raw])[0];
  }

  async transitionIssue(ref: ExternalTrackerReference, status: ExternalTrackerStatus): Promise<void> {
    const transitions = asRecord(asRecord(this.config.tracker).transitions);
    const transitionId = readString(transitions[status]);
    if (!transitionId) return;
    const key = encodeURIComponent(ref.key ?? ref.id);
    await this.requestJson(`/rest/api/3/issue/${key}/transitions`, {
      method: "POST",
      body: JSON.stringify({ transition: { id: transitionId } }),
    });
  }
}

export class LinearTrackerAdapter extends HttpTrackerAdapter {
  readonly provider = "linear" as const;

  protected override applyAuth(headers: Record<string, string>): void {
    const token = env(this.config.auth?.tokenEnv) ?? env(this.config.auth?.apiTokenEnv);
    if (token) headers.Authorization = token;
  }

  private async graphql(query: string, variables: JsonRecord): Promise<JsonRecord> {
    const raw = await this.requestJson("/graphql", {
      method: "POST",
      body: JSON.stringify({ query, variables: redactExternalTrackerSecrets(variables) }),
    });
    return asRecord(asRecord(raw).data);
  }

  async createIssue(input: ExternalTrackerCreateIssueInput): Promise<ExternalTrackerIssue> {
    const teamId = getTrackerString(this.config, "teamId");
    const data = await this.graphql(
      `mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) { success issue { id identifier title url state { name } createdAt updatedAt } }
      }`,
      { input: { teamId, title: input.title, description: input.description, labelIds: input.labels, ...input.fields } },
    );
    return this.mapIssue(asRecord(asRecord(data.issueCreate).issue));
  }

  async getIssue(ref: ExternalTrackerReference): Promise<ExternalTrackerIssue> {
    const data = await this.graphql(
      `query Issue($id: String!) {
        issue(id: $id) { id identifier title description url createdAt updatedAt state { name } comments { nodes { id body createdAt user { id name } } } }
      }`,
      { id: ref.id },
    );
    const issue = asRecord(data.issue);
    const comments = asRecord(issue.comments).nodes;
    return this.mapIssue({ ...issue, comments: Array.isArray(comments) ? comments : [] }, ref.id);
  }

  async listIssues(): Promise<ExternalTrackerIssue[]> {
    const teamId = getTrackerString(this.config, "teamId");
    const data = await this.graphql(
      `query Issues($filter: IssueFilter) {
        issues(filter: $filter, first: 50) { nodes { id identifier title description url createdAt updatedAt state { name } } }
      }`,
      { filter: teamId ? { team: { id: { eq: teamId } } } : undefined },
    );
    const nodes = asRecord(data.issues).nodes;
    return Array.isArray(nodes) ? nodes.map((issue) => this.mapIssue(issue)) : [];
  }

  async addComment(ref: ExternalTrackerReference, answer: SubmitAnswerParams): Promise<ExternalTrackerComment> {
    const data = await this.graphql(
      `mutation Comment($input: CommentCreateInput!) {
        commentCreate(input: $input) { success comment { id body createdAt user { id name } } }
      }`,
      { input: { issueId: ref.id, body: buildAnswerBlock(answer) } },
    );
    return this.mapComments([asRecord(asRecord(data.commentCreate).comment)])[0];
  }

  async transitionIssue(ref: ExternalTrackerReference, status: ExternalTrackerStatus): Promise<void> {
    const stateIds = asRecord(asRecord(this.config.tracker).workflowStateIds);
    const stateId = readString(stateIds[status]);
    if (!stateId) return;
    await this.graphql(
      `mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) { success }
      }`,
      { id: ref.id, input: { stateId } },
    );
  }

  protected override mapIssue(raw: unknown, fallbackId?: string): ExternalTrackerIssue {
    const record = asRecord(raw);
    const state = asRecord(record.state);
    return super.mapIssue({
      ...record,
      key: record.identifier,
      status: readString(state.name),
    }, fallbackId);
  }
}

export class GenericRestTrackerAdapter extends HttpTrackerAdapter {
  readonly provider = "generic-rest" as const;

  async createIssue(input: ExternalTrackerCreateIssueInput): Promise<ExternalTrackerIssue> {
    const path = getTrackerString(this.config, "createPath") ?? "/issues";
    const raw = await this.requestJson(path, {
      method: getTrackerString(this.config, "createMethod") ?? "POST",
      body: JSON.stringify(redactExternalTrackerSecrets({ ...input, fields: input.fields })),
    });
    return this.mapIssue(raw);
  }

  async getIssue(ref: ExternalTrackerReference): Promise<ExternalTrackerIssue> {
    const template = getTrackerString(this.config, "getPath") ?? "/issues/{id}";
    const raw = await this.requestJson(template.replace("{id}", encodeURIComponent(ref.id)));
    return this.mapIssue(raw, ref.id);
  }

  async listIssues(): Promise<ExternalTrackerIssue[]> {
    const path = getTrackerString(this.config, "listPath") ?? "/issues";
    const raw = await this.requestJson(path);
    const items = Array.isArray(raw) ? raw : asRecord(raw).items;
    return Array.isArray(items) ? items.map((item) => this.mapIssue(item)) : [];
  }

  async addComment(ref: ExternalTrackerReference, answer: SubmitAnswerParams): Promise<ExternalTrackerComment> {
    const template = getTrackerString(this.config, "commentPath") ?? "/issues/{id}/comments";
    const raw = await this.requestJson(template.replace("{id}", encodeURIComponent(ref.id)), {
      method: getTrackerString(this.config, "commentMethod") ?? "POST",
      body: JSON.stringify({ body: buildAnswerBlock(answer), answer: redactExternalTrackerSecrets(answer) }),
    });
    return this.mapComments([raw])[0];
  }

  async transitionIssue(ref: ExternalTrackerReference, status: ExternalTrackerStatus): Promise<void> {
    const template = getTrackerString(this.config, "transitionPath");
    if (!template) return;
    await this.requestJson(template.replace("{id}", encodeURIComponent(ref.id)), {
      method: getTrackerString(this.config, "transitionMethod") ?? "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async claimIssue(ref: ExternalTrackerReference, responderId: string): Promise<void> {
    const template = getTrackerString(this.config, "claimPath");
    if (!template) return;
    await this.requestJson(template.replace("{id}", encodeURIComponent(ref.id)), {
      method: getTrackerString(this.config, "claimMethod") ?? "PATCH",
      body: JSON.stringify({ assignee: responderId }),
    });
  }
}

export class ExternalTrackerBackend implements BreakpointBackend {
  readonly name = "external-tracker";

  private readonly adapter?: ExternalTrackerAdapter;
  private readonly delegatedGitHub?: GitHubIssuesBackend;
  private readonly refsByBreakpointId = new Map<string, ExternalTrackerReference>();
  private readonly seenWebhookEvents = new Set<string>();
  private readonly defaultPollIntervalMs: number;
  private readonly defaultTimeoutMs: number;

  constructor(private readonly config: ExternalTrackerBackendConfig) {
    this.defaultPollIntervalMs = config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.defaultTimeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (config.provider === "github-issues") {
      const tracker = asRecord(config.tracker);
      const owner = readString(tracker.owner);
      const repo = readString(tracker.repo);
      if (!owner || !repo) {
        throw new Error('external-tracker provider "github-issues" requires tracker.owner and tracker.repo.');
      }
      this.delegatedGitHub = new GitHubIssuesBackend({
        type: "github-issues",
        owner,
        repo,
        labels: readStringArray(tracker.labels),
        assignees: readStringArray(tracker.assignees),
        pollIntervalMs: config.pollIntervalMs,
        timeoutMs: config.timeoutMs,
      });
    } else {
      this.adapter = createExternalTrackerAdapter(config);
    }
  }

  capabilities(): BreakpointBackendCapabilities {
    return {
      ...unsupportedBreakpointBackendCapabilities,
      assignment: true,
      comments: true,
      history: true,
      export: this.config.provider === "github-issues",
    };
  }

  async submitBreakpoint(params: SubmitBreakpointParams): Promise<Breakpoint> {
    if (this.delegatedGitHub) return this.delegatedGitHub.submitBreakpoint(params);
    if (params.proven) {
      throw new Error(unsupportedBackendFeatureMessage(this.name, "ask_breakpoint.proven"));
    }
    const adapter = this.requireAdapter();
    const issue = await adapter.createIssue({
      title: params.context.title ?? params.text,
      description: params.context.markdown ?? params.context.description,
      labels: params.context.tags,
      assignees: params.routing.targetResponders,
      fields: this.buildMappedFields(params, this.config.fieldMapping),
      metadata: { projectId: params.projectId, repoId: params.repoId },
    });
    const breakpoint = this.issueToBreakpoint(issue, params);
    this.refsByBreakpointId.set(breakpoint.id, issue.ref);
    return breakpoint;
  }

  async getBreakpoint(id: string): Promise<Breakpoint> {
    if (this.delegatedGitHub) return this.delegatedGitHub.getBreakpoint(id);
    const ref = this.resolveRef(id);
    const issue = await this.requireAdapter().getIssue(ref);
    const breakpoint = this.issueToBreakpoint(issue);
    this.refsByBreakpointId.set(breakpoint.id, issue.ref);
    return breakpoint;
  }

  async waitForAnswer(id: string, options?: WaitForAnswerOptions): Promise<BreakpointWaitResult> {
    if (this.delegatedGitHub) return this.delegatedGitHub.waitForAnswer(id, options);
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const pollIntervalMs = options?.pollIntervalMs ?? this.defaultPollIntervalMs;
    const startTime = Date.now();
    while (true) {
      const breakpoint = await this.getBreakpoint(id);
      const answer = selectBreakpointAnswer(breakpoint);
      if (answer) {
        return {
          answered: true,
          breakpoint,
          answer,
          allAnswers: breakpoint.answers,
          elapsedMs: Date.now() - startTime,
        };
      }
      if (breakpoint.status === "completed" || breakpoint.status === "cancelled") {
        return {
          answered: false,
          breakpoint,
          allAnswers: breakpoint.answers,
          resolution: breakpoint.status,
          elapsedMs: Date.now() - startTime,
        };
      }
      if (options?.signal?.aborted) {
        return {
          answered: false,
          breakpoint,
          allAnswers: breakpoint.answers,
          resolution: "aborted",
          elapsedMs: Date.now() - startTime,
        };
      }
      if (Date.now() - startTime >= timeoutMs) {
        return {
          answered: false,
          breakpoint,
          allAnswers: breakpoint.answers,
          resolution: "timeout",
          elapsedMs: Date.now() - startTime,
        };
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  async listPendingBreakpoints(responderId?: string): Promise<Breakpoint[]> {
    if (this.delegatedGitHub) return this.delegatedGitHub.listPendingBreakpoints(responderId);
    const issues = await this.requireAdapter().listIssues();
    return issues
      .filter((issue) => issue.status === "open" || issue.status === "claimed")
      .filter((issue) => !responderId || issue.assignees.includes(responderId))
      .map((issue) => {
        const breakpoint = this.issueToBreakpoint(issue);
        this.refsByBreakpointId.set(breakpoint.id, issue.ref);
        return breakpoint;
      });
  }

  async answerBreakpoint(id: string, answer: SubmitAnswerParams): Promise<BreakpointPublicAnswer> {
    if (this.delegatedGitHub) return this.delegatedGitHub.answerBreakpoint(id, answer);
    if (answer.sign || answer.keyFingerprint) {
      throw new Error(unsupportedBackendFeatureMessage(this.name, "answer signing"));
    }
    const ref = this.resolveRef(id);
    const comment = await this.requireAdapter().addComment(ref, answer);
    await this.requireAdapter().transitionIssue(ref, "answered");
    return answerFromComment(comment, id) ?? {
      id: `tracker-comment-${comment.id}`,
      breakpointId: id,
      responderId: answer.responderId,
      responderName: answer.responderName,
      text: answer.text,
      confidence: answer.confidence ?? 80,
      references: answer.references ?? [],
      followUpQuestions: answer.followUpQuestions ?? [],
      answeredAt: comment.createdAt,
      decisionMemory: answer.decisionMemory
        ? { ...answer.decisionMemory, savedAt: nowIso() }
        : undefined,
    };
  }

  async cancelBreakpoint(id: string): Promise<void> {
    if (this.delegatedGitHub) return this.delegatedGitHub.cancelBreakpoint(id);
    await this.requireAdapter().transitionIssue(this.resolveRef(id), "cancelled");
  }

  async listResponders(_params?: ListRespondersParams): Promise<ResponderProfile[]> {
    if (this.delegatedGitHub) return this.delegatedGitHub.listResponders();
    const responders = readStringArray(asRecord(this.config.tracker).responders);
    return responders.map((id) => ({
      id,
      type: "tracker" as const,
      name: id,
      title: `${this.config.provider} tracker responder`,
      capabilities: ["tracking", "issue", this.config.provider],
      domains: [],
      tags: [this.config.provider, "tracker"],
      availability: true,
      responseTimeSla: this.defaultTimeoutMs / 1000,
      trackerBackend: this.config.provider,
      trackerConfig: redactExternalTrackerSecrets(asRecord(this.config.tracker)),
    }));
  }

  async claimBreakpoint(id: string, responderId: string): Promise<Breakpoint> {
    if (this.delegatedGitHub) return this.delegatedGitHub.claimBreakpoint(id, responderId);
    const ref = this.resolveRef(id);
    await this.requireAdapter().claimIssue?.(ref, responderId);
    await this.requireAdapter().transitionIssue(ref, "claimed");
    return this.getBreakpoint(id);
  }

  handleWebhook(payload: unknown, headers?: Record<string, string>): ExternalTrackerWebhookResult {
    if (!this.adapter?.normalizeWebhook) {
      return { accepted: false, duplicate: false };
    }
    const event = this.adapter.normalizeWebhook(payload, headers);
    if (!event) return { accepted: false, duplicate: false };
    const eventKey = `${event.provider}:${event.eventId}`;
    if (this.seenWebhookEvents.has(eventKey)) {
      return { accepted: true, duplicate: true, event };
    }
    this.seenWebhookEvents.add(eventKey);
    const breakpoint = this.issueToBreakpoint(event.issue);
    this.refsByBreakpointId.set(breakpoint.id, event.issue.ref);
    const answer = event.comment ? answerFromComment(event.comment, breakpoint.id) ?? undefined : undefined;
    return { accepted: true, duplicate: false, event, breakpoint, answer };
  }

  private requireAdapter(): ExternalTrackerAdapter {
    if (!this.adapter) {
      throw new Error(`External tracker provider "${this.config.provider}" is delegated, not adapter-backed.`);
    }
    return this.adapter;
  }

  private resolveRef(id: string): ExternalTrackerReference {
    const cached = this.refsByBreakpointId.get(id);
    if (cached) return cached;
    const parsed = decodeRef(id);
    if (parsed.provider !== this.config.provider) {
      throw new Error(`Breakpoint ${id} belongs to ${parsed.provider}, not ${this.config.provider}.`);
    }
    const ref = { provider: parsed.provider, id: parsed.externalId };
    this.refsByBreakpointId.set(id, ref);
    return ref;
  }

  private issueToBreakpoint(issue: ExternalTrackerIssue, submitted?: SubmitBreakpointParams): Breakpoint {
    const id = encodeRef(issue.ref.provider, issue.ref.id);
    const status = this.mapStatusToBreakpoint(issue.status);
    const answers = issue.comments
      .map((comment) => answerFromComment(comment, id))
      .filter((answer): answer is BreakpointAnswer => answer !== null);
    return BreakpointSchema.parse({
      id,
      text: issue.title,
      context: submitted
        ? {
            ...submitted.context,
            metadata: {
              ...submitted.context.metadata,
              externalTracker: redactExternalTrackerSecrets({
                provider: issue.ref.provider,
                id: issue.ref.id,
                key: issue.ref.key,
                url: issue.ref.url,
              }),
            },
          }
        : {
        description: issue.description ?? issue.title,
        codeSnippets: [],
        fileReferences: [],
        tags: issue.labels,
        title: issue.title,
        links: issue.ref.url ? [{ label: issue.ref.key ?? issue.ref.id, url: issue.ref.url, kind: "external" }] : undefined,
        metadata: {
          externalTracker: redactExternalTrackerSecrets({
            provider: issue.ref.provider,
            id: issue.ref.id,
            key: issue.ref.key,
            url: issue.ref.url,
          }),
        },
      },
      status: answers.length > 0 && status === "claimed" ? "answered" : status,
      routing: submitted?.routing ?? {
        strategy: "single",
        targetResponders: issue.assignees,
        timeoutMs: this.defaultTimeoutMs,
        presentToUser: false,
      },
      answers,
      selectedAnswer: answers[0]?.id,
      projectId: submitted?.projectId,
      repoId: submitted?.repoId,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      expiresAt: new Date(new Date(issue.createdAt).getTime() + (submitted?.routing.timeoutMs ?? this.defaultTimeoutMs)).toISOString(),
    });
  }

  private mapStatusToBreakpoint(status: ExternalTrackerStatus): Breakpoint["status"] {
    switch (status) {
      case "claimed":
        return "claimed";
      case "answered":
        return "answered";
      case "completed":
        return "completed";
      case "cancelled":
        return "cancelled";
      case "open":
      default:
        return "pending";
    }
  }

  private buildMappedFields(
    params: SubmitBreakpointParams,
    mapping: ExternalTrackerFieldMapping | undefined,
  ): Record<string, unknown> {
    const fields: Record<string, unknown> = {};
    if (mapping?.title) fields[mapping.title] = params.context.title ?? params.text;
    if (mapping?.description) fields[mapping.description] = params.context.markdown ?? params.context.description;
    if (mapping?.labels) fields[mapping.labels] = params.context.tags;
    if (mapping?.assignee) fields[mapping.assignee] = params.routing.targetResponders;
    if (mapping?.priority && params.context.urgency) fields[mapping.priority] = params.context.urgency;
    if (mapping?.metadata) {
      for (const [source, destination] of Object.entries(mapping.metadata) as Array<[string, string]>) {
        fields[destination] = getPath(params.context.metadata, source);
      }
    }
    return redactExternalTrackerSecrets(fields);
  }
}

export function createExternalTrackerAdapter(
  config: ExternalTrackerBackendConfig,
): ExternalTrackerAdapter {
  switch (config.provider) {
    case "jira":
      return new JiraTrackerAdapter(config);
    case "linear":
      return new LinearTrackerAdapter(config);
    case "generic-rest":
      return new GenericRestTrackerAdapter(config);
    case "github-issues":
      throw new Error('Use ExternalTrackerBackend delegation for provider "github-issues".');
  }
  throw new Error(`Unsupported external tracker provider: ${(config as { provider?: string }).provider ?? "unknown"}`);
}
