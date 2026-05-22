export interface Shortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    action: () => void;
    description: string;
}
export declare function useKeyboard(shortcuts: Shortcut[]): void;
