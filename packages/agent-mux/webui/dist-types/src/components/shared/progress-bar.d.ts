type ProgressVariant = "default" | "success" | "error" | "warning";
interface ProgressBarProps {
    value: number;
    variant?: ProgressVariant;
    glow?: boolean;
    className?: string;
}
export declare function ProgressBar({ value, variant, glow, className }: ProgressBarProps): import("react/jsx-runtime").JSX.Element;
export {};
