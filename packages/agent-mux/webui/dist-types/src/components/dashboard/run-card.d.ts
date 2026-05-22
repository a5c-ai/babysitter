import type { Run } from "@/types";
interface RunCardProps {
    run: Run;
    selected?: boolean;
    stopping?: boolean;
    onStop?: (run: Run) => void;
}
export declare const RunCard: import("react").NamedExoticComponent<RunCardProps>;
export {};
