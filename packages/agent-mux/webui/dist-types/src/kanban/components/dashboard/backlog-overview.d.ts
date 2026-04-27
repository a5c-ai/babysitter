type BoardPresentation = "board" | "list";
interface BacklogOverviewProps {
    projectId?: string;
    routeBasePath?: string;
    forcedPresentation?: BoardPresentation;
    routeMode?: "board" | "issue" | "create";
    initialIssueId?: string;
    initialIssueKey?: string;
    initialProjectId?: string;
}
export declare function BacklogOverview({ projectId: requestedProjectId, routeBasePath, forcedPresentation, routeMode, initialIssueId, initialIssueKey, initialProjectId, }?: BacklogOverviewProps): import("react/jsx-runtime").JSX.Element | null;
export {};
