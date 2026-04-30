import type { Run } from "@/types";
interface ProjectSectionProps {
    projectName: string;
    runs: Run[];
    selectedIndex?: number;
    defaultExpanded?: boolean;
    statusFilter?: string;
    enabled?: boolean;
}
export declare function ProjectSection({ projectName, runs: _initialRuns, selectedIndex, defaultExpanded: _defaultExpanded, statusFilter, enabled, }: ProjectSectionProps): import("react/jsx-runtime").JSX.Element;
export {};
