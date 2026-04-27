interface TabsProps {
    className?: string;
    children: React.ReactNode;
    defaultValue?: string;
    value?: string;
    orientation?: "horizontal" | "vertical";
    onValueChange?: (value: string) => void;
    "data-testid"?: string;
}
export declare function Tabs({ className, children, "data-testid": testId, ...props }: TabsProps): import("react/jsx-runtime").JSX.Element;
export declare function TabsList({ className, children }: {
    className?: string;
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function TabsTrigger({ className, children, value }: {
    className?: string;
    children: React.ReactNode;
    value: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function TabsContent({ className, children, value }: {
    className?: string;
    children: React.ReactNode;
    value: string;
}): import("react/jsx-runtime").JSX.Element;
export {};
