import crypto from "crypto";

export interface InvocationKeyComponents {
  processId: string;
  stepId?: string;
  key?: string;
  taskId: string;
}

export interface InvocationKeyInfo {
  key: string;
  digest: string;
  components: InvocationKeyComponents;
}

export function hashInvocationKey(components: InvocationKeyComponents): InvocationKeyInfo {
  const slot = components.key ?? components.stepId;
  if (!slot) {
    throw new Error("hashInvocationKey requires either key or stepId");
  }
  const key = `${components.processId}:${slot}:${components.taskId}`;
  const digest = crypto.createHash("sha256").update(key).digest("hex");
  return { key, digest, components };
}
