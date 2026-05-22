export declare function formatDuration(ms: number | undefined | null): string;
export declare function formatTimestamp(iso: string | undefined): string;
export declare function formatRelativeTime(iso: string | undefined): string;
export declare function truncateId(id: string, len?: number): string;
export declare function getStatusColor(status: string): string;
export declare function getStatusBg(status: string): string;
export declare function formatShortId(id: string, chars?: number): string;
export declare function friendlyProcessName(processId: string): string;
