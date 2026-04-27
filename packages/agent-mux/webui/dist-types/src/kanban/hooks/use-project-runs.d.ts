import { Run } from '@/types';
interface UseProjectRunsOptions {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
    sort?: 'status' | 'activity';
    enabled?: boolean;
}
export declare function useProjectRuns(projectName: string, options?: UseProjectRunsOptions): {
    runs: Run[];
    totalCount: number;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
};
export {};
