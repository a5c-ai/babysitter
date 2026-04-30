interface DataToggleProps {
    showInput: boolean;
    onToggle: (showInput: boolean) => void;
}
/** Input/Output tab toggle for switching between task input and result data */
export declare function DataToggle({ showInput, onToggle }: DataToggleProps): import("react/jsx-runtime").JSX.Element;
export type { DataToggleProps };
