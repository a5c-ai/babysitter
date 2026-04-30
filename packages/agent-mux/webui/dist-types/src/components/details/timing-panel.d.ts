import type { TaskDetail, TaskEffect } from "@/types";
interface TimingPanelProps {
    task: TaskDetail | null;
    runDuration?: number;
    /** All tasks in the run — needed for the cascading timeline */
    allTasks?: TaskEffect[];
}
export declare function TimingPanel({ task, runDuration, allTasks }: TimingPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
