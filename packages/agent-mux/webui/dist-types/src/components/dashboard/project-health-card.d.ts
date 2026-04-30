import type { ProjectSummary, RunStatus } from "@/types";
interface ProjectHealthCardProps {
    project: ProjectSummary;
    statusFilter: RunStatus | "all";
    sortMode?: "status" | "activity";
    onHide?: (projectName: string) => void;
}
export declare function ProjectHealthCard({ project, statusFilter, sortMode, onHide }: ProjectHealthCardProps): import("react/jsx-runtime").JSX.Element;
export {};
