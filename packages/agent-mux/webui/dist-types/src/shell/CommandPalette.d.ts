export interface CommandPaletteAction {
    id: string;
    label: string;
    run(): void;
}
export declare function CommandPalette(props: {
    actions: CommandPaletteAction[];
    open: boolean;
    onClose(): void;
}): JSX.Element | null;
//# sourceMappingURL=CommandPalette.d.ts.map