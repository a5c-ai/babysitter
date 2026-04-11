/**
 * Barrel export for all Babysitter TUI Ink components.
 *
 * Import from this module rather than from individual component files to keep
 * import paths stable as the component tree grows.
 */

export { StatusBar } from "./StatusBar.js";
export type { StatusBarProps } from "./StatusBar.js";

export { MessagePane } from "./MessagePane.js";
export type { MessagePaneProps } from "./MessagePane.js";

export { PromptBar } from "./PromptBar.js";
export type { PromptBarProps } from "./PromptBar.js";

export { Message } from "./Message.js";
export type { MessageProps } from "./Message.js";

export { RunningIndicator } from "./RunningIndicator.js";
export type { RunningIndicatorProps } from "./RunningIndicator.js";

export { RunListTable } from "./RunListTable.js";
export type { RunListTableProps } from "./RunListTable.js";

export { ActionMenu } from "./ActionMenu.js";
export type { ActionMenuProps } from "./ActionMenu.js";

export { StatusLine } from "./StatusLine.js";
export type { StatusLineProps as InkStatusLineProps } from "./StatusLine.js";

// Primitives
export * from "./primitives/index.js";
