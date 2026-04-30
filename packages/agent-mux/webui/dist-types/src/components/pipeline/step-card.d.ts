import type { TaskEffect } from "@/types";
interface StepCardProps {
    task: TaskEffect;
    runId: string;
    onSelect: (effectId: string) => void;
    isSelected: boolean;
    defaultExpanded?: boolean;
    /** 1-based step number for display */
    stepNumber?: number;
}
export declare const StepCard: import("react").NamedExoticComponent<StepCardProps>;
export {};
