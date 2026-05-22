import type { BreakpointFile } from "@/types";
interface FilePreviewProps {
    files: BreakpointFile[];
    runId: string;
    effectId: string;
}
export declare function FilePreview({ files, runId, effectId }: FilePreviewProps): import("react/jsx-runtime").JSX.Element | null;
export {};
