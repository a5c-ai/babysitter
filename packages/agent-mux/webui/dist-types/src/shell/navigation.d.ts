export declare function titleForPath(pathname: string): string;
type SessionPaletteRecord = {
    sessionId?: unknown;
    title?: unknown;
    agent?: unknown;
    updatedAt?: unknown;
};
export type SessionPaletteAction = {
    id: string;
    label: string;
    to: string;
};
export declare function buildRecentSessionActions(sessions: SessionPaletteRecord[], limit?: number): SessionPaletteAction[];
export {};
