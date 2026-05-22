interface ProjectSectionHeaderProps {
    projectName: string;
    activeRuns: number;
    completedRuns: number;
    failedRuns: number;
    totalRuns: number;
    latestUpdate?: string;
    className?: string;
}
export declare function ProjectSectionHeader({ projectName, activeRuns, completedRuns, failedRuns, totalRuns, latestUpdate, className, }: ProjectSectionHeaderProps): import("react/jsx-runtime").JSX.Element;
export {};
