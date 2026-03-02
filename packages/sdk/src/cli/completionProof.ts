import * as crypto from "node:crypto";
import type { RunMetadata } from "../storage/types";

const COMPLETION_PROOF_SALT = "babysitter-completion-secret-v1";

export function deriveCompletionProof(runId: string): string {
  return crypto.createHash("sha256").update(`${runId}:${COMPLETION_PROOF_SALT}`).digest("hex");
}

export function resolveCompletionProof(metadata: RunMetadata): string {
  return typeof metadata.completionProof === "string" ? metadata.completionProof : deriveCompletionProof(metadata.runId);
}
