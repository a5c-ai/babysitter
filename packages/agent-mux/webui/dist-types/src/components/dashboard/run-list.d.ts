import type { Run } from "@/types";
interface RunListProps {
    runs: Run[];
    selectedIndex?: number;
    groupByProject?: boolean;
}
export declare function RunList({ runs, selectedIndex, groupByProject }: RunListProps): import("react/jsx-runtime").JSX.Element;
export {};
