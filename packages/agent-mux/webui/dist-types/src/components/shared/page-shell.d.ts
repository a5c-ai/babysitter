export declare const pageShellContainerClassName = "page-shell__container";
export declare const pageSectionClassName = "page-section";
export declare const pageInsetSectionClassName = "page-section page-section--inset";
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
