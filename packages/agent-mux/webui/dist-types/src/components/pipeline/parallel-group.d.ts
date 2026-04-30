import type { ReactNode } from "react";
interface ParallelGroupProps {
    children: ReactNode;
    count: number;
    className?: string;
}
/**
 * Visual wrapper that groups tasks detected as running in parallel.
 * Shows a dashed border container with a "parallel" label and renders
 * the grouped StepCards inside.
 */
export declare const ParallelGroup: import("react").NamedExoticComponent<ParallelGroupProps>;
export {};
