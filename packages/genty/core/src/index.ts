export type {
  AgentCoreHistoryEntry,
  AgentCorePromptResult,
  AgentCorePromptInput,
  AgentCorePromptOptions,
  AgentCorePromptPart,
  AgentCoreOutputFormat,
  AgentCoreJsonSchema,
  AgentCoreStructuredOutputOptions,
  AgentCoreTextPromptPart,
  AgentCoreImageUrlPromptPart,
  AgentCoreImageBase64PromptPart,
  AgentCoreSessionEvent,
  AgentCoreSessionOptions,
  AgentCoreToolOptions,
  AgentCoreToolOptions as AgenticToolOptions,
  CustomToolDefinition,
  ProgrammaticToolCallingOptions,
  ToolResult,
} from "./types";
export { AGENT_CORE_TOOL_NAMES } from "./types";
export { AGENT_CORE_TOOL_NAMES as AGENTIC_TOOL_NAMES } from "./types";
export {
  AgentCoreSessionHandle,
  createAgentCoreSession,
  type AgentCoreEventListener,
} from "./session";
export {
  createAgentCoreToolDefinitions,
  createCodingToolDefinitions,
  createProcessAuthoringToolDefinitions,
  disposeAgentCoreToolDefinitions,
  resetRunScopedConfig,
  parseSearchResults,
  stripHtmlTags,
  extractTextFromHtml,
  filterByRelevance,
} from "./tools";
export { DeferredToolRegistry } from "./deferredToolRegistry";

// L4 Agent-Core interfaces
export type {
  AgentLoopStrategyKind,
  SequentialStrategy,
  ConcurrentStrategy,
  GroupChatStrategy,
  HandoffContextTransfer,
  HandoffStrategy,
  ComposedStrategy,
  AgentLoopStrategy,
  AgentLoopState,
  AgentLoopIterationResult,
  AgentLoopPromptContext,
  AgentLoopRunOptions,
  AgentLoopConfig,
  AgentLoop,
  PromptFn,
  SequentialLoopRunnerConfig,
  ConcurrentLoopRunnerConfig,
  ConcurrentIterationOutput,
  GroupChatLoopRunnerConfig,
  HandoffLoopRunnerConfig,
  HandoffCapableOutput,
} from "./loop";
export {
  AgentLoopImpl,
  createAgentLoop,
  SequentialLoopRunner,
  ConcurrentLoopRunner,
  GroupChatLoopRunner,
  HandoffLoopRunner,
} from "./loop";
export type {
  InvocationMode,
  SubagentDescriptor,
  OversightConfig,
  SubagentResult,
  SubagentInvocationOptions,
  SubagentInvoker,
  InvokeFn,
  ReviewFn,
  OversightResult,
} from "./subagent";
export { SubagentInvokerImpl, OversightRunner } from "./subagent";
export type {
  CompactionStrategyKind,
  PriorityCompactionStrategy,
  SlidingCompactionStrategy,
  SummaryCompactionStrategy,
  CompactionStrategy,
  ContextEntry,
  ContextManagerConfig,
  ContextManager,
  ContextManagerImplOptions,
  PriorityCompactionResult,
  SlidingCompactionResult,
  SummaryCompactionResult,
  SummarizeFn,
} from "./context";
export {
  ContextManagerImpl,
  estimateTokens,
  estimateEntryTokens,
  applyPriorityCompaction,
  applySlidingCompaction,
  applySummaryCompaction,
} from "./context";
export type {
  SynthesisStrategyKind,
  MergeSynthesisStrategy,
  VoteSynthesisStrategy,
  RankSynthesisStrategy,
  SynthesisStrategy,
  SynthesisInput,
  SynthesisOutput,
  ResultSynthesizer,
  ResultSynthesizerImplOptions,
  RankSynthesisConfig,
} from "./synthesis";
export {
  ResultSynthesizerImpl,
  applyMergeSynthesis,
  applyVoteSynthesis,
  applyRankSynthesis,
} from "./synthesis";

// Trust enforcement primitives
export {
  createKeyPair, signPayload, verifySignature,
  createAgentIdentity, createToolIdentity,
  signModelResponse, verifyModelResponse,
  signAgentRequest, verifyAgentRequest, signPrompt, verifyPrompt, hashContent,
  signToolResult, verifyToolResult, signPermissionEvidence, verifyPermissionEvidence, isPermissionValid,
  verifyTrustChain,
} from "./trust";
export type {
  SignedEnvelope, IdentityKeyPair, AgentIdentity, ToolIdentity, DelegationChainLink,
  ModelResponsePayload, AgentRequestPayload, PromptPayload,
  ToolResultPayload, PermissionEvidencePayload, TrustChainLink, ChainVerificationResult,
} from "./trust";

// Extension API
export { ExtensionRegistry } from "./extensions";
export type {
  GentyExtension, ExtensionContext, ExtensionToolDefinition, ExtensionPermission,
  CommandHandler, KeyHandler, EventHandler, ExtensionEventType, ExtensionEvent,
  StatusBarItem, ContextProvider, TurnContext, ContextInjection,
  ExtensionManifest, ExtensionSource,
} from "./extensions";

// Microagents — isolated subprocess agents with structured I/O
export type {
  JSONSchema as MicroagentJSONSchema,
  IsolationMode,
  MicroagentManifest,
  MicroagentInvocation,
  MicroagentResult,
  ValidationResult as MicroagentValidationResult,
  MicroagentRegistryFilter,
} from "./microagents";
export {
  MicroagentRegistry,
  MicroagentRunner,
  validateInput as validateMicroagentInput,
  validateOutput as validateMicroagentOutput,
  validateAgainstSchema as validateMicroagentSchema,
  builtInManifests,
  formatConverterManifest,
  systemIntegratorManifest,
  codeAnalyzerManifest,
  schemaGeneratorManifest,
  diffApplierManifest,
} from "./microagents";
