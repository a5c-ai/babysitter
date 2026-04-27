interface AccordionProps {
    type?: "single" | "multiple";
    defaultValue?: string | string[];
    value?: string | string[];
    onValueChange?: (value: string | string[]) => void;
    collapsible?: boolean;
    className?: string;
    children: React.ReactNode;
}
export declare function Accordion({ children, className, ...props }: AccordionProps): import("react/jsx-runtime").JSX.Element;
export declare function AccordionItem({ className, children, value }: {
    className?: string;
    children: React.ReactNode;
    value: string;
}): import("react/jsx-runtime").JSX.Element;
export declare function AccordionTrigger({ className, children }: {
    className?: string;
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function AccordionContent({ className, children }: {
    className?: string;
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export {};
