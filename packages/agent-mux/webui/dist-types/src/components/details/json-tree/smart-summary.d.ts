import React from "react";
/** SmartSectionHeader -- reusable section header with consistent styling */
export declare function SmartSectionHeader({ children, className: extraClass }: {
    children: React.ReactNode;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
/** Status pill -- colored dot + text */
export declare function StatusPill({ status }: {
    status: string;
}): import("react/jsx-runtime").JSX.Element;
/** Score bar -- colored progress indicator */
export declare function ScoreBar({ score }: {
    score: number;
}): import("react/jsx-runtime").JSX.Element;
/** Quality pass/fail badge */
export declare function QualityBadge({ passes }: {
    passes: boolean;
}): import("react/jsx-runtime").JSX.Element;
/** At-a-Glance Header Bar */
export declare function AtAGlanceHeader({ status, score, passesQuality, taskId, }: {
    status: string | null;
    score: number | null;
    passesQuality: boolean | null;
    taskId: string | null;
}): import("react/jsx-runtime").JSX.Element | null;
/** Boolean Flags Grid */
export declare function BooleanFlagsGrid({ booleans, }: {
    booleans: Array<{
        key: string;
        value: boolean;
    }>;
}): import("react/jsx-runtime").JSX.Element | null;
/** Findings / Issues Section */
export declare function FindingsSection({ findings, }: {
    findings: Array<{
        key: string;
        items: string[];
    }>;
}): import("react/jsx-runtime").JSX.Element | null;
/** Summary Block -- quote/info style card */
export declare function SummaryBlock({ summary }: {
    summary: string;
}): import("react/jsx-runtime").JSX.Element;
/** Metadata Grid -- compact 2-column key-value layout */
export declare function MetadataGrid({ metadata, }: {
    metadata: Array<{
        key: string;
        value: unknown;
    }>;
}): import("react/jsx-runtime").JSX.Element | null;
/** Collapsible Raw JSON section */
export declare function CollapsibleRawJson({ data }: {
    data: unknown;
}): import("react/jsx-runtime").JSX.Element;
