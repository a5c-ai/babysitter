export declare function TooltipProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function Tooltip({ children, open, defaultOpen, onOpenChange }: {
    children: React.ReactNode;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}): import("react/jsx-runtime").JSX.Element;
export declare function TooltipTrigger({ children, asChild }: {
    children: React.ReactNode;
    asChild?: boolean;
}): import("react/jsx-runtime").JSX.Element;
export declare function TooltipContent({ className, children, sideOffset }: {
    className?: string;
    children: React.ReactNode;
    sideOffset?: number;
}): import("react/jsx-runtime").JSX.Element;
