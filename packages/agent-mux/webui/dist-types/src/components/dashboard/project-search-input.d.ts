interface ProjectSearchInputProps {
    onSearch: (value: string) => void;
    debounceMs?: number;
    className?: string;
    placeholder?: string;
}
export declare function ProjectSearchInput({ onSearch, debounceMs, className, placeholder }: ProjectSearchInputProps): import("react/jsx-runtime").JSX.Element;
export {};
