import { promises as fs } from "node:fs";
import * as path from "node:path";
import type {
  AddBreakpointCommentParams,
  AssignBreakpointParams,
  BreakpointBackend,
  BreakpointBackendCapabilities,
  BreakpointExport,
  BreakpointMetricsSummary,
  BreakpointSearchQuery,
  BulkBreakpointOperationResult,
  BulkUpdateBreakpointsParams,
  SubmitBreakpointParams,
  TransitionBreakpointParams,
  WaitForAnswerOptions,
  SubmitAnswerParams,
} from "../backend.js";
import type {
  Breakpoint,
  BreakpointAnswer,
  BreakpointComment,
  BreakpointPublicAnswer,
  BreakpointStatus,
  BreakpointWaitResult,
  ProvenBreakpointAnswer,
  ProvenVerificationResult,
  TaskPriority,
} from "../types.js";
import {
  generateBreakpointId,
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
  BREAKPOINTS_DIR,
  BreakpointSchema,
  BreakpointPublicAnswerSchema,
  ProvenBreakpointAnswerSchema,
  isProvenBreakpointAnswer,
  validateBreakpointTransition,
} from "../types.js";
import { signAnswer, signAnswerWithKeyRecord } from "../proven/sign.js";
import { verifyAnswer as verifyProvenAnswer } from "../proven/verify.js";
import type { PrivateKeyRecord } from "../proven/types.js";
import { selectBreakpointAnswer as selectPublicBreakpointAnswer } from "../backend.js";

export interface GitNativeBackendOptions {
  /** Path to the .breakpoints directory. Defaults to `.breakpoints` in cwd. */
  breakpointsDir?: string;
  /** Default poll interval in ms. Defaults to 3000. */
  pollIntervalMs?: number;
  /** Default timeout in ms. Defaults to 30 minutes. */
  timeoutMs?: number;
  /** Path to a .key.json private key file for signing answers. Optional. */
  signingKeyPath?: string;
}

export class GitNativeBackend implements BreakpointBackend {
  readonly name = "git-native";

  private breakpointsDir: string;
  private defaultPollIntervalMs: number;
  private defaultTimeoutMs: number;
  private signingKeyPath: string | undefined;

  constructor(options?: GitNativeBackendOptions) {
    this.breakpointsDir = options?.breakpointsDir
      ?? path.resolve(process.cwd(), BREAKPOINTS_DIR);
    this.defaultPollIntervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.defaultTimeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.signingKeyPath = options?.signingKeyPath;
  }

  private breakpointPath(id: string): string {
    return path.join(this.breakpointsDir, `${id}.json`);
  }

  private answerPath(id: string): string {
    return path.join(this.breakpointsDir, `${id}.answer.json`);
  }

  private provenPath(id: string): string {
    return path.join(this.breakpointsDir, `${id}.proven.json`);
  }

  capabilities(): BreakpointBackendCapabilities {
    return {
      search: true,
      bulkOperations: true,
      assignment: true,
      comments: true,
      history: true,
      metrics: true,
      export: true,
      forms: true,
      notifications: false,
      escalation: true,
    };
  }

  /**
   * Load the signing key from the configured signingKeyPath.
   * Returns null if no signing key is configured or the file cannot be read.
   */
  private async loadSigningKey(): Promise<PrivateKeyRecord | null> {
    if (!this.signingKeyPath) return null;
    try {
      const raw = await fs.readFile(this.signingKeyPath, "utf-8");
      return JSON.parse(raw) as PrivateKeyRecord;
    } catch {
      return null;
    }
  }

  /**
   * Load a proven answer file for a breakpoint, if it exists.
   */
  private async loadProvenAnswer(id: string) {
    try {
      const raw = await fs.readFile(this.provenPath(id), "utf-8");
      return ProvenBreakpointAnswerSchema.parse(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  private async loadStoredAnswer(id: string): Promise<BreakpointPublicAnswer | null> {
    try {
      const raw = await fs.readFile(this.answerPath(id), "utf-8");
      return BreakpointPublicAnswerSchema.parse(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  private async loadPublicAnswer(id: string): Promise<BreakpointPublicAnswer | null> {
    const [storedAnswer, provenAnswer] = await Promise.all([
      this.loadStoredAnswer(id),
      this.loadProvenAnswer(id),
    ]);

    return provenAnswer ?? storedAnswer;
  }

  private async writeBreakpoint(breakpoint: Breakpoint): Promise<void> {
    await fs.writeFile(
      this.breakpointPath(breakpoint.id),
      JSON.stringify(breakpoint, null, 2) + "\n",
      "utf-8",
    );
  }

  private historyEntry(args: {
    type: Breakpoint["history"][number]["type"];
    actorId?: string;
    fromStatus?: BreakpointStatus;
    toStatus?: BreakpointStatus;
    message?: string;
    metadata?: Record<string, unknown>;
  }): Breakpoint["history"][number] {
    return {
      id: generateBreakpointId(),
      at: new Date().toISOString(),
      ...args,
    };
  }

  private auditEntry(args: {
    action: string;
    actorId?: string;
    redacted?: boolean;
    metadata?: Record<string, unknown>;
  }): Breakpoint["auditLog"][number] {
    return {
      id: generateBreakpointId(),
      at: new Date().toISOString(),
      redacted: args.redacted ?? false,
      action: args.action,
      actorId: args.actorId,
      metadata: args.metadata,
    };
  }

  private async listAllBreakpoints(): Promise<Breakpoint[]> {
    let files: string[];
    try {
      files = await fs.readdir(this.breakpointsDir);
    } catch {
      return [];
    }

    const breakpoints: Breakpoint[] = [];
    for (const file of files) {
      if (!file.endsWith(".json") || file.includes(".answer.") || file.includes(".proven.")) {
        continue;
      }
      try {
        const raw = await fs.readFile(path.join(this.breakpointsDir, file), "utf-8");
        breakpoints.push(BreakpointSchema.parse(JSON.parse(raw)));
      } catch {
        // Preserve existing malformed-file tolerance.
      }
    }
    return breakpoints;
  }

  private async assertBlockingDependenciesSatisfied(breakpoint: Breakpoint): Promise<void> {
    const blockingDependencies = breakpoint.dependsOn.filter((dependency) => dependency.blocking !== false);
    if (blockingDependencies.length === 0) return;

    const unmet: string[] = [];
    for (const dependency of blockingDependencies) {
      const requiredStatus = dependency.requiredStatus ?? "completed";
      try {
        const dependencyBreakpoint = await this.getBreakpoint(dependency.id);
        if (dependencyBreakpoint.status !== requiredStatus) {
          unmet.push(`${dependency.id} is ${dependencyBreakpoint.status}, requires ${requiredStatus}`);
        }
      } catch {
        unmet.push(`${dependency.id} is missing, requires ${requiredStatus}`);
      }
    }

    if (unmet.length > 0) {
      throw new Error(`Invalid breakpoint status transition: blocking dependencies are not satisfied (${unmet.join("; ")})`);
    }
  }

  async submitBreakpoint(params: SubmitBreakpointParams): Promise<Breakpoint> {
    await fs.mkdir(this.breakpointsDir, { recursive: true });

    const id = generateBreakpointId();
    const now = new Date().toISOString();
    const timeoutMs = params.routing.timeoutMs || this.defaultTimeoutMs;

    const breakpoint: Breakpoint = {
      id,
      text: params.text,
      context: params.context,
      status: "pending",
      priority: params.priority,
      dependsOn: params.dependsOn ?? [],
      routing: params.routing,
      answers: [],
      projectId: params.projectId,
      repoId: params.repoId,
      comments: [],
      history: [
        {
          id: generateBreakpointId(),
          type: "created",
          at: now,
          toStatus: "pending",
          message: "Breakpoint created",
        },
      ],
      auditLog: [
        {
          id: generateBreakpointId(),
          action: "breakpoint.created",
          at: now,
          redacted: false,
        },
      ],
      forms: [],
      formSubmissions: [],
      notifications: [],
      metrics: {
        answerCount: 0,
        commentCount: 0,
      },
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + timeoutMs).toISOString(),
    };

    // Validate before writing
    BreakpointSchema.parse(breakpoint);

    await this.writeBreakpoint(BreakpointSchema.parse(breakpoint));

    return breakpoint;
  }

  async getBreakpoint(id: string): Promise<Breakpoint> {
    const raw = await fs.readFile(this.breakpointPath(id), "utf-8");
    const breakpoint = BreakpointSchema.parse(JSON.parse(raw));

    const answer = await this.loadPublicAnswer(id);
    if (answer) {
      const existingIndex = breakpoint.answers.findIndex((candidate) => candidate.id === answer.id);
      if (existingIndex === -1) {
        breakpoint.answers.push(answer);
      } else {
        breakpoint.answers[existingIndex] = answer;
      }
      if (breakpoint.status === "pending" || breakpoint.status === "claimed") {
        breakpoint.status = "answered";
      }
    }

    const selectedAnswer = selectPublicBreakpointAnswer(breakpoint);
    if (selectedAnswer && isProvenBreakpointAnswer(selectedAnswer)) {
      const verification = await this.verifyProvenFile(selectedAnswer);
      // Attach verification result as metadata on the breakpoint
      (breakpoint as Breakpoint & { provenVerification?: ProvenVerificationResult })
        .provenVerification = verification;
    }

    return breakpoint;
  }

  async waitForAnswer(
    id: string,
    options?: WaitForAnswerOptions,
  ): Promise<BreakpointWaitResult> {
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
          allAnswers: breakpoint.answers,
          resolution: "aborted",
          elapsedMs: Date.now() - startTime,
        };
      }

      // Check for answer file
      try {
        await fs.access(this.answerPath(id));
        const breakpoint = await this.getBreakpoint(id);
        const answer = selectPublicBreakpointAnswer(breakpoint);
        return {
          answered: true,
          breakpoint: { ...breakpoint, status: "answered" },
          answer,
          allAnswers: breakpoint.answers,
          resolution: "answered",
          elapsedMs: Date.now() - startTime,
        };
      } catch {
        // No answer yet
      }

      // Check cancellation status
      const breakpoint = await this.getBreakpoint(id);
      if (breakpoint.status === "cancelled") {
        return {
          answered: false,
          breakpoint,
          allAnswers: breakpoint.answers,
          resolution: "cancelled",
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

  async listPendingBreakpoints(responderId?: string): Promise<Breakpoint[]> {
    let files: string[];
    try {
      files = await fs.readdir(this.breakpointsDir);
    } catch {
      return [];
    }

    const pending: Breakpoint[] = [];
    for (const file of files) {
      if (!file.endsWith(".json") || file.includes(".answer.") || file.includes(".proven.")) {
        continue;
      }
      try {
        const raw = await fs.readFile(
          path.join(this.breakpointsDir, file),
          "utf-8",
        );
        const bp = BreakpointSchema.parse(JSON.parse(raw));
        if (bp.status !== "pending" && bp.status !== "routed") continue;

        // Check expiration
        if (new Date(bp.expiresAt) < new Date()) continue;

        // Filter by responder if specified
        if (responderId && bp.routing.targetResponders.length > 0) {
          if (!bp.routing.targetResponders.includes(responderId)) continue;
        }

        // Check if answer already exists
        try {
          await fs.access(this.answerPath(bp.id));
          continue; // Already answered
        } catch {
          // No answer, include it
        }

        pending.push(bp);
      } catch {
        // Skip malformed files
      }
    }

    return pending;
  }

  async answerBreakpoint(
    id: string,
    answer: SubmitAnswerParams,
  ): Promise<BreakpointPublicAnswer> {
    // Verify breakpoint exists
    const existing = await this.getBreakpoint(id);
    const validation = validateBreakpointTransition(existing.status, "answered");
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    await this.assertBlockingDependenciesSatisfied(existing);
    const fromStatus = existing.status;

    const answerId = generateBreakpointId();
    const now = new Date().toISOString();

    const breakpointAnswer: BreakpointAnswer = {
      id: answerId,
      breakpointId: id,
      responderId: answer.responderId,
      responderName: answer.responderName,
      text: answer.text,
      approved: answer.approved,
      confidence: answer.confidence ?? 80,
      references: answer.references ?? [],
      followUpQuestions: answer.followUpQuestions ?? [],
      answeredAt: now,
      decisionMemory: answer.decisionMemory
        ? { ...answer.decisionMemory, savedAt: now }
        : undefined,
    };

    if (answer.sign === false && answer.keyFingerprint) {
      throw new Error("keyFingerprint cannot be used when sign=false");
    }

    let publicAnswer: BreakpointPublicAnswer = breakpointAnswer;

    if (answer.keyFingerprint) {
      publicAnswer = await signAnswer(breakpointAnswer, answer.keyFingerprint, this.breakpointsDir);
    } else if (answer.sign === true) {
      const signingKey = await this.loadSigningKey();
      if (!signingKey) {
        throw new Error("answer_breakpoint.sign requested, but no signing key is configured");
      }
      publicAnswer = signAnswerWithKeyRecord(breakpointAnswer, signingKey);
    } else if (answer.sign !== false) {
      const signingKey = await this.loadSigningKey();
      if (signingKey) {
        publicAnswer = signAnswerWithKeyRecord(breakpointAnswer, signingKey);
      }
    }

    BreakpointPublicAnswerSchema.parse(publicAnswer);

    await fs.writeFile(
      this.answerPath(id),
      JSON.stringify(publicAnswer, null, 2) + "\n",
      "utf-8",
    );

    if (isProvenBreakpointAnswer(publicAnswer)) {
      await fs.writeFile(
        this.provenPath(id),
        JSON.stringify(publicAnswer, null, 2) + "\n",
        "utf-8",
      );
    } else {
      await fs.rm(this.provenPath(id), { force: true });
    }

    // Update the breakpoint status
    const breakpoint = await this.getBreakpoint(id) as Breakpoint & { provenVerification?: ProvenVerificationResult };
    delete breakpoint.provenVerification;
    breakpoint.status = "answered";
    breakpoint.updatedAt = now;
    breakpoint.history.push(this.historyEntry({
      type: "answer",
      actorId: answer.responderId,
      fromStatus,
      toStatus: "answered",
      message: "Breakpoint answered",
    }));
    breakpoint.auditLog.push(this.auditEntry({
      action: "breakpoint.answered",
      actorId: answer.responderId,
    }));
    breakpoint.metrics = {
      ...breakpoint.metrics,
      answerCount: breakpoint.answers.length,
      responseTimeMs: Date.parse(now) - Date.parse(breakpoint.createdAt),
    };
    await this.writeBreakpoint(BreakpointSchema.parse(breakpoint));

    return publicAnswer;
  }

  async cancelBreakpoint(id: string): Promise<void> {
    const breakpoint = await this.getBreakpoint(id) as Breakpoint & { provenVerification?: ProvenVerificationResult };
    delete breakpoint.provenVerification;
    const validation = validateBreakpointTransition(breakpoint.status, "cancelled");
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    const fromStatus = breakpoint.status;
    breakpoint.status = "cancelled";
    breakpoint.updatedAt = new Date().toISOString();

    breakpoint.history.push(this.historyEntry({
      type: "status",
      fromStatus,
      toStatus: "cancelled",
      message: "Breakpoint cancelled",
    }));
    breakpoint.auditLog.push(this.auditEntry({ action: "breakpoint.cancelled" }));
    await this.writeBreakpoint(BreakpointSchema.parse(breakpoint));
  }

  async claimBreakpoint(id: string, responderId: string): Promise<Breakpoint> {
    const breakpoint = await this.getBreakpoint(id) as Breakpoint & { provenVerification?: ProvenVerificationResult };
    delete breakpoint.provenVerification;
    const validation = validateBreakpointTransition(breakpoint.status, "claimed");
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    const fromStatus = breakpoint.status;
    breakpoint.status = "claimed";
    breakpoint.claimedByResponderId = responderId;
    breakpoint.updatedAt = new Date().toISOString();

    breakpoint.history.push(this.historyEntry({
      type: "status",
      actorId: responderId,
      fromStatus,
      toStatus: "claimed",
      message: "Breakpoint claimed",
    }));
    breakpoint.auditLog.push(this.auditEntry({
      action: "breakpoint.claimed",
      actorId: responderId,
    }));
    await this.writeBreakpoint(BreakpointSchema.parse(breakpoint));

    return breakpoint;
  }

  async assignBreakpoint(id: string, params: AssignBreakpointParams): Promise<Breakpoint> {
    const breakpoint = await this.getBreakpoint(id) as Breakpoint & { provenVerification?: ProvenVerificationResult };
    delete breakpoint.provenVerification;
    const validation = validateBreakpointTransition(breakpoint.status, "assigned");
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    const fromStatus = breakpoint.status;
    breakpoint.status = "assigned";
    breakpoint.assigneeId = params.assigneeId;
    breakpoint.assigneeName = params.assigneeName;
    breakpoint.updatedAt = new Date().toISOString();
    breakpoint.history.push(this.historyEntry({
      type: "assigned",
      actorId: params.actorId,
      fromStatus,
      toStatus: "assigned",
      message: `Assigned to ${params.assigneeName ?? params.assigneeId}`,
    }));
    breakpoint.auditLog.push(this.auditEntry({
      action: "breakpoint.assigned",
      actorId: params.actorId,
      metadata: { assigneeId: params.assigneeId },
    }));

    const parsed = BreakpointSchema.parse(breakpoint);
    await this.writeBreakpoint(parsed);
    return parsed;
  }

  async transitionBreakpoint(id: string, params: TransitionBreakpointParams): Promise<Breakpoint> {
    const breakpoint = await this.getBreakpoint(id) as Breakpoint & { provenVerification?: ProvenVerificationResult };
    delete breakpoint.provenVerification;
    const validation = validateBreakpointTransition(breakpoint.status, params.status);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    if (params.status === "answered" || params.status === "completed") {
      await this.assertBlockingDependenciesSatisfied(breakpoint);
    }

    const fromStatus = breakpoint.status;
    breakpoint.status = params.status;
    breakpoint.updatedAt = new Date().toISOString();
    breakpoint.history.push(this.historyEntry({
      type: "status",
      actorId: params.actorId,
      fromStatus,
      toStatus: params.status,
      message: params.message,
      metadata: params.metadata,
    }));
    breakpoint.auditLog.push(this.auditEntry({
      action: "status.changed",
      actorId: params.actorId,
      metadata: { fromStatus, toStatus: params.status },
    }));
    if (params.status === "completed") {
      breakpoint.metrics = {
        ...breakpoint.metrics,
        completionTimeMs: Date.parse(breakpoint.updatedAt) - Date.parse(breakpoint.createdAt),
      };
    }

    const parsed = BreakpointSchema.parse(breakpoint);
    await this.writeBreakpoint(parsed);
    return parsed;
  }

  async addBreakpointComment(
    id: string,
    params: AddBreakpointCommentParams,
  ): Promise<BreakpointComment> {
    const breakpoint = await this.getBreakpoint(id) as Breakpoint & { provenVerification?: ProvenVerificationResult };
    delete breakpoint.provenVerification;
    const comment: BreakpointComment = {
      id: generateBreakpointId(),
      authorId: params.authorId,
      authorName: params.authorName,
      text: params.text,
      createdAt: new Date().toISOString(),
      metadata: params.metadata,
    };

    breakpoint.comments.push(comment);
    breakpoint.updatedAt = comment.createdAt;
    breakpoint.history.push(this.historyEntry({
      type: "comment",
      actorId: params.authorId,
      message: "Comment added",
      metadata: { commentId: comment.id },
    }));
    breakpoint.auditLog.push(this.auditEntry({
      action: "comment.added",
      actorId: params.authorId,
      metadata: { commentId: comment.id },
    }));
    breakpoint.metrics = {
      ...breakpoint.metrics,
      commentCount: breakpoint.comments.length,
    };
    await this.writeBreakpoint(BreakpointSchema.parse(breakpoint));
    return comment;
  }

  async searchBreakpoints(query: BreakpointSearchQuery): Promise<{
    items: Breakpoint[];
    total: number;
    offset: number;
    limit: number;
  }> {
    const all = await this.listAllBreakpoints();
    const filtered = all.filter((breakpoint) => matchesSearchQuery(breakpoint, query));
    const sorted = filtered.sort((left, right) => compareBreakpoints(left, right, query));
    const offset = query.offset ?? 0;
    const limit = query.limit ?? sorted.length;
    return {
      items: sorted.slice(offset, offset + limit),
      total: sorted.length,
      offset,
      limit,
    };
  }

  async bulkUpdateBreakpoints(params: BulkUpdateBreakpointsParams): Promise<BulkBreakpointOperationResult> {
    const items: BulkBreakpointOperationResult["items"] = [];

    for (const id of params.ids) {
      try {
        let breakpoint: Breakpoint;
        if (params.action === "reassign") {
          if (!params.assigneeId) throw new Error("assigneeId is required for reassign");
          breakpoint = await this.assignBreakpoint(id, {
            assigneeId: params.assigneeId,
            assigneeName: params.assigneeName,
            actorId: params.actorId,
          });
        } else if (params.action === "cancel") {
          await this.cancelBreakpoint(id);
          breakpoint = await this.getBreakpoint(id);
        } else if (params.action === "close") {
          breakpoint = await this.transitionBreakpoint(id, {
            status: "completed",
            actorId: params.actorId,
            message: params.message,
          });
        } else if (params.action === "transition") {
          if (!params.status) throw new Error("status is required for transition");
          breakpoint = await this.transitionBreakpoint(id, {
            status: params.status,
            actorId: params.actorId,
            message: params.message,
          });
        } else {
          if (!params.answer) throw new Error("answer is required for approve");
          await this.answerBreakpoint(id, { ...params.answer, approved: true });
          breakpoint = await this.getBreakpoint(id);
        }
        items.push({ id, ok: true, breakpoint });
      } catch (error) {
        items.push({
          id,
          ok: false,
          errorCode: isNotFoundError(error) ? "not_found" : isInvalidTransitionError(error) ? "invalid_transition" : "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const succeeded = items.filter((item) => item.ok).length;
    return {
      total: params.ids.length,
      succeeded,
      failed: params.ids.length - succeeded,
      items,
    };
  }

  async getBreakpointMetrics(query: BreakpointSearchQuery = {}): Promise<BreakpointMetricsSummary> {
    const result = await this.searchBreakpoints(query);
    const byStatus: Partial<Record<BreakpointStatus, number>> = {};
    const byPriority: Partial<Record<TaskPriority, number>> = {};
    const responseTimes: number[] = [];
    const completionTimes: number[] = [];

    for (const breakpoint of result.items) {
      byStatus[breakpoint.status] = (byStatus[breakpoint.status] ?? 0) + 1;
      const priority = breakpoint.priority ?? "medium";
      byPriority[priority] = (byPriority[priority] ?? 0) + 1;
      if (typeof breakpoint.metrics?.responseTimeMs === "number") {
        responseTimes.push(breakpoint.metrics.responseTimeMs);
      }
      if (typeof breakpoint.metrics?.completionTimeMs === "number") {
        completionTimes.push(breakpoint.metrics.completionTimeMs);
      }
    }

    return {
      total: result.total,
      byStatus,
      byPriority,
      responseTimeAverageMs: average(responseTimes),
      completionTimeAverageMs: average(completionTimes),
    };
  }

  async exportBreakpoints(query: BreakpointSearchQuery = {}): Promise<BreakpointExport> {
    const result = await this.searchBreakpoints(query);
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      total: result.total,
      items: result.items.map(redactBreakpointForExport),
    };
  }

  /**
   * Verify the selected public answer against trusted public keys.
   */
  async verifyAnswer(id: string): Promise<ProvenVerificationResult> {
    const breakpoint = await this.getBreakpoint(id);
    const answer = selectPublicBreakpointAnswer(breakpoint);
    if (!answer || !isProvenBreakpointAnswer(answer)) {
      return {
        valid: false,
        reason: "No signed answer found",
        verifiedAt: new Date().toISOString(),
      };
    }

    return this.verifyProvenFile(answer);
  }

  /**
   * Verify a loaded ProvenBreakpointAnswer against trusted keys in the
   * breakpoints directory.
   */
  private async verifyProvenFile(provenAnswer: ProvenBreakpointAnswer): Promise<ProvenVerificationResult> {
    // The proven/verify module's loadTrustedPublicKeys uses baseDir/.keys/trusted/
    // Our breakpointsDir IS the .breakpoints directory, so we pass it as baseDir.
    return verifyProvenAnswer(provenAnswer, this.breakpointsDir);
  }
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

function matchesSearchQuery(breakpoint: Breakpoint, query: BreakpointSearchQuery): boolean {
  if (query.status && !query.status.includes(breakpoint.status)) return false;
  if (query.priority && !query.priority.includes(breakpoint.priority ?? "medium")) return false;
  if (query.assigneeId && breakpoint.assigneeId !== query.assigneeId) return false;
  if (query.responderId && !matchesResponder(breakpoint, query.responderId)) return false;
  if (query.domain && !breakpoint.context.domain?.toLowerCase().includes(query.domain.toLowerCase())) return false;
  if (query.tags && query.tags.length > 0) {
    const tags = new Set(breakpoint.context.tags.map((tag) => tag.toLowerCase()));
    if (!query.tags.every((tag) => tags.has(tag.toLowerCase()))) return false;
  }
  if (query.createdAfter && Date.parse(breakpoint.createdAt) < Date.parse(query.createdAfter)) return false;
  if (query.createdBefore && Date.parse(breakpoint.createdAt) > Date.parse(query.createdBefore)) return false;
  if (query.updatedAfter && Date.parse(breakpoint.updatedAt) < Date.parse(query.updatedAfter)) return false;
  if (query.updatedBefore && Date.parse(breakpoint.updatedAt) > Date.parse(query.updatedBefore)) return false;
  if (query.query && !searchText(breakpoint).includes(query.query.toLowerCase())) return false;
  return true;
}

function matchesResponder(breakpoint: Breakpoint, responderId: string): boolean {
  return breakpoint.routing.targetResponders.includes(responderId) ||
    breakpoint.claimedByResponderId === responderId ||
    breakpoint.assigneeId === responderId ||
    breakpoint.answers.some((answer) => answer.responderId === responderId);
}

function searchText(breakpoint: Breakpoint): string {
  return [
    breakpoint.id,
    breakpoint.text,
    breakpoint.assigneeId,
    breakpoint.assigneeName,
    breakpoint.context.title,
    breakpoint.context.summary,
    breakpoint.context.description,
    breakpoint.context.domain,
    ...breakpoint.context.tags,
    ...breakpoint.comments.map((comment) => comment.text),
  ].filter(Boolean).join("\n").toLowerCase();
}

function compareBreakpoints(
  left: Breakpoint,
  right: Breakpoint,
  query: BreakpointSearchQuery,
): number {
  const direction = query.sortDirection === "asc" ? 1 : -1;
  const sortBy = query.sortBy ?? "createdAt";
  if (sortBy === "priority") {
    return (PRIORITY_WEIGHT[left.priority ?? "medium"] - PRIORITY_WEIGHT[right.priority ?? "medium"]) * direction;
  }
  const leftValue = sortBy === "status" ? left.status : left[sortBy];
  const rightValue = sortBy === "status" ? right.status : right[sortBy];
  return String(leftValue).localeCompare(String(rightValue)) * direction;
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && (
    "code" in error && error.code === "ENOENT" ||
    /no such file|not found/i.test(error.message)
  );
}

function isInvalidTransitionError(error: unknown): boolean {
  return error instanceof Error && /transition|terminal|dependenc/i.test(error.message);
}

function redactBreakpointForExport(breakpoint: Breakpoint): Breakpoint {
  return BreakpointSchema.parse({
    ...breakpoint,
    context: {
      ...breakpoint.context,
      metadata: redactSecrets(breakpoint.context.metadata),
    },
    comments: breakpoint.comments.map((comment) => ({
      ...comment,
      metadata: redactSecrets(comment.metadata),
    })),
    auditLog: breakpoint.auditLog.map((entry) => ({
      ...entry,
      metadata: redactSecrets(entry.metadata),
      redacted: entry.metadata ? true : entry.redacted,
    })),
    notifications: breakpoint.notifications.map((notification) => ({
      ...notification,
      target: notification.target ? "[redacted]" : undefined,
      secretEnv: notification.secretEnv ? "[redacted]" : undefined,
    })),
  });
}

function redactSecrets<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item)) as T;
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (/token|secret|password|authorization|apiKey|apiToken/i.test(key)) {
      redacted[key] = "[redacted]";
    } else {
      redacted[key] = redactSecrets(nested);
    }
  }
  return redacted as T;
}
