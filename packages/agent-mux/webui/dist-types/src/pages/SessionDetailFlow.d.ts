export type NativeSessionMessage = {
    role?: string;
    content?: string;
    thinking?: string;
    toolCalls?: Array<{
        toolCallId?: string;
        toolName?: string;
        input?: unknown;
        output?: unknown;
        durationMs?: number;
    }>;
    toolResult?: {
        toolCallId?: string;
        toolName?: string;
        output?: unknown;
    };
};
export type SessionCost = {
    totalUsd?: number;
    inputTokens?: number;
    outputTokens?: number;
    thinkingTokens?: number;
    cachedTokens?: number;
};
export type AgentFlowSegmentKind = 'user' | 'assistant' | 'thinking' | 'tool' | 'system' | 'lifecycle';
export type AgentFlowSegment = {
    id: string;
    kind: AgentFlowSegmentKind;
    title: string;
    detail: string;
    weight: number;
};
export type AgentFlowLane = {
    runId: string;
    agent: string;
    status: string;
    startedAt: number;
    segmentCount: number;
    toolCount: number;
    totalUsd: number | null;
    segments: AgentFlowSegment[];
};
export declare function buildAgentFlowLanes(runs: Array<Record<string, unknown>>, eventBuffers: Record<string, {
    events: Record<string, unknown>[];
} | undefined>): AgentFlowLane[];
export declare function buildNativeAgentFlowLane(sessionId: string, messages: NativeSessionMessage[], agent: string, status: string): AgentFlowLane | null;
