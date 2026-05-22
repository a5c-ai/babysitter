import { promises as fs } from "node:fs";
import * as path from "node:path";
import type {
  BreakpointBackend,
  SubmitBreakpointParams,
  WaitForAnswerOptions,
  SubmitAnswerParams,
} from "../backend.js";
import type {
  Breakpoint,
  BreakpointAnswer,
  BreakpointPublicAnswer,
  BreakpointWaitResult,
  ProvenBreakpointAnswer,
  ProvenVerificationResult,
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
      routing: params.routing,
      answers: [],
      projectId: params.projectId,
      repoId: params.repoId,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + timeoutMs).toISOString(),
    };

    // Validate before writing
    BreakpointSchema.parse(breakpoint);

    await fs.writeFile(
      this.breakpointPath(id),
      JSON.stringify(breakpoint, null, 2) + "\n",
      "utf-8",
    );

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
    await this.getBreakpoint(id);

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
    await fs.writeFile(
      this.breakpointPath(id),
      JSON.stringify(breakpoint, null, 2) + "\n",
      "utf-8",
    );

    return publicAnswer;
  }

  async cancelBreakpoint(id: string): Promise<void> {
    const breakpoint = await this.getBreakpoint(id) as Breakpoint & { provenVerification?: ProvenVerificationResult };
    delete breakpoint.provenVerification;
    breakpoint.status = "cancelled";
    breakpoint.updatedAt = new Date().toISOString();

    await fs.writeFile(
      this.breakpointPath(id),
      JSON.stringify(breakpoint, null, 2) + "\n",
      "utf-8",
    );
  }

  async claimBreakpoint(id: string, responderId: string): Promise<Breakpoint> {
    const breakpoint = await this.getBreakpoint(id) as Breakpoint & { provenVerification?: ProvenVerificationResult };
    delete breakpoint.provenVerification;
    breakpoint.status = "claimed";
    breakpoint.claimedByResponderId = responderId;
    breakpoint.updatedAt = new Date().toISOString();

    await fs.writeFile(
      this.breakpointPath(id),
      JSON.stringify(breakpoint, null, 2) + "\n",
      "utf-8",
    );

    return breakpoint;
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
