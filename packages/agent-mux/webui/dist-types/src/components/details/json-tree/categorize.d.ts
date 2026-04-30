/** Type guard for plain objects */
export declare function isRecord(v: unknown): v is Record<string, unknown>;
/** Format a camelCase or snake_case key into a readable label */
export declare function formatLabel(key: string): string;
/** Known array keys that represent "findings"-style lists of strings */
export declare const FINDINGS_KEYS: Set<string>;
export interface CategorizedData {
    status: string | null;
    score: number | null;
    passesQuality: boolean | null;
    booleans: Array<{
        key: string;
        value: boolean;
    }>;
    findings: Array<{
        key: string;
        items: string[];
    }>;
    summary: string | null;
    taskId: string | null;
    metadata: Array<{
        key: string;
        value: unknown;
    }>;
}
export declare function categorizeData(data: unknown): CategorizedData;
