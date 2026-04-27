import type { ProjectSummary } from "@/types";
interface ProjectAccordionProps {
    projects: ProjectSummary[];
    statusFilter?: string;
    className?: string;
}
export declare function ProjectAccordion({ projects, statusFilter, className }: ProjectAccordionProps): import("react/jsx-runtime").JSX.Element;
export {};
