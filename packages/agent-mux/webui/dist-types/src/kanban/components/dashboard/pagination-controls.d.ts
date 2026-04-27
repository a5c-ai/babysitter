interface PaginationControlsProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    className?: string;
}
export declare function PaginationControls({ currentPage, totalItems, itemsPerPage, onPageChange, className }: PaginationControlsProps): import("react/jsx-runtime").JSX.Element | null;
export {};
