import React from "react";
/** Unified copy button -- size='sm' for inline JSON values, size='md' for metadata/findings */
export declare function CopyButton({ value, size, className: extraClass }: {
    value: string;
    size?: "sm" | "md";
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
interface JsonNodeProps {
    /** The key name to display (null for root or array elements) */
    keyName: string | null;
    /** The value to render */
    value: unknown;
    /** Whether to default to expanded */
    defaultExpanded?: boolean;
    /** Whether this is the last item in its parent (controls trailing comma) */
    isLast?: boolean;
}
declare const JsonNode: React.NamedExoticComponent<JsonNodeProps>;
interface JsonTreeViewProps {
    data: unknown;
    defaultExpanded?: boolean;
}
export declare function JsonTreeView({ data, defaultExpanded }: JsonTreeViewProps): import("react/jsx-runtime").JSX.Element;
export { JsonNode };
export type { JsonNodeProps, JsonTreeViewProps };
