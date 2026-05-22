export interface ShortcutEntry {
    keys: string[];
    description: string;
    context: "global" | "dashboard" | "run-detail" | "session-workspace";
}
export declare const SHORTCUTS: ShortcutEntry[];
export declare const SHORTCUT_SECTION_LABELS: Record<string, string>;
export declare function ShortcutsHelp(): import("react/jsx-runtime").JSX.Element;
