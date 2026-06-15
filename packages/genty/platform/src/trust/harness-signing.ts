import type { IdentityKeyPair } from '@a5c-ai/genty-core/trust';
import { signPrompt, verifyPrompt, signToolResult, verifyToolResult, signModelResponse, verifyModelResponse, hashContent } from '@a5c-ai/genty-core/trust';
import type { PromptPayload, ToolResultPayload, ModelResponsePayload } from '@a5c-ai/genty-core/trust';

export interface TrustContext {
  keyPair: IdentityKeyPair;
  agentId: string;
  sessionId: string;
}

export function signOutgoingPrompt(ctx: TrustContext, prompt: string, type: 'initial' | 'followup' | 'steering' = 'initial') {
  const payload: PromptPayload = {
    promptType: type,
    content: prompt,
    authorId: ctx.agentId,
    timestamp: new Date().toISOString(),
  };
  return signPrompt(ctx.keyPair, payload);
}

export function verifyIncomingPrompt(publicKey: string, envelope: ReturnType<typeof signPrompt>) {
  return verifyPrompt(publicKey, envelope);
}

export function signOutgoingToolResult(ctx: TrustContext, toolName: string, input: unknown, output: unknown) {
  const payload: ToolResultPayload = {
    toolName,
    inputParams: input,
    output,
    timestamp: new Date().toISOString(),
  };
  return signToolResult(ctx.keyPair, payload);
}

export function verifyIncomingToolResult(publicKey: string, envelope: ReturnType<typeof signToolResult>) {
  return verifyToolResult(publicKey, envelope);
}

export function signIncomingModelResponse(ctx: TrustContext, content: string, model: string, provider: string) {
  const payload: ModelResponsePayload = {
    modelId: model,
    provider,
    inputMessagesHash: hashContent(''),
    outputContent: content,
    timestamp: new Date().toISOString(),
  };
  return signModelResponse(ctx.keyPair, payload);
}

export function verifySignedModelResponse(publicKey: string, envelope: ReturnType<typeof signModelResponse>) {
  return verifyModelResponse(publicKey, envelope);
}
