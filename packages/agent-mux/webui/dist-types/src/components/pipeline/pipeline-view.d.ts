import type { Run } from "@/types";
interface PipelineViewProps {
    run: Run;
    selectedEffectId: string | null;
    onSelectEffect: (effectId: string) => void;
    runStatus?: string;
}
export declare const PipelineView: import("react").NamedExoticComponent<PipelineViewProps>;
export {};
