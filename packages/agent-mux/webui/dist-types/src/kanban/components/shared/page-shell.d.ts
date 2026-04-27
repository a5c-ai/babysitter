export declare const pageShellContainerClassName = "mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6";
export declare const pageSectionClassName = "rounded-3xl border border-border/90 bg-card/95 p-6 shadow-lg";
export declare const pageInsetSectionClassName = "rounded-3xl border border-border/80 bg-background/60 p-5 shadow-sm";
export declare function PageShell(props: {
    children: React.ReactNode;
    className?: string;
    background?: "ambient" | "none";
}): import("react/jsx-runtime").JSX.Element;
export declare function PageSection(props: {
    children: React.ReactNode;
    className?: string;
    inset?: boolean;
}): import("react/jsx-runtime").JSX.Element;
export declare function PageHeroGrid(props: {
    children: React.ReactNode;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
