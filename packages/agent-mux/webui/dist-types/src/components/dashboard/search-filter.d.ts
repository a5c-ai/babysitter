import type { RunStatus } from "@/types";
interface SearchFilterProps {
    search: string;
    onSearchChange: (value: string) => void;
    statusFilter: RunStatus | "all";
    onStatusFilterChange: (value: RunStatus | "all") => void;
    searchRef?: React.RefObject<HTMLInputElement>;
    groupByProject?: boolean;
    onGroupByProjectChange?: (value: boolean) => void;
}
export declare function SearchFilter({ search, onSearchChange, statusFilter, onStatusFilterChange, searchRef, groupByProject, onGroupByProjectChange }: SearchFilterProps): import("react/jsx-runtime").JSX.Element;
export {};
