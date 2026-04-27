import type { RunStatus, TaskStatus } from "@/types";
interface StatusBadgeProps {
    status: RunStatus | TaskStatus | string;
    className?: string;
    waitingKind?: 'breakpoint' | 'task';
    isStale?: boolean;
}
export declare function StatusBadge({ status, className, waitingKind, isStale }: StatusBadgeProps): import("react/jsx-runtime").JSX.Element;
export {};
