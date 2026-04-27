import { ProjectSummary } from '@/types';
export declare function useProjects(interval?: number, suppressSseRefetch?: boolean): {
    projects: ProjectSummary[];
    recentCompletionWindowMs: number;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
};
