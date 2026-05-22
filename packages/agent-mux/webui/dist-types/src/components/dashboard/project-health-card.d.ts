import type { ProjectSummary, Run, RunStatus } from "@/types";
interface ProjectHealthCardProps {
    project: ProjectSummary;
    statusFilter: RunStatus | "all";
    sortMode?: "status" | "activity";
    onHide?: (projectName: string) => void;
    onStopRun?: (run: Run) => void;
    stoppingRunIds?: Set<string>;
}
export declare function ProjectHealthCard({ project, statusFilter, sortMode, onHide, onStopRun, stoppingRunIds, }: ProjectHealthCardProps): import("react/jsx-runtime").JSX.Element;
export {};
