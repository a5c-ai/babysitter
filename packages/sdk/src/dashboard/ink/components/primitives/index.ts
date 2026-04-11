/**
 * Barrel export for TUI primitive components.
 */

export { BorderBox, getBorderChars, borderBoxReducer } from "./BorderBox.js";
export type {
  BorderStyle,
  BorderBoxState,
  BorderBoxAction,
  BorderChars,
  BorderBoxProps,
} from "./BorderBox.js";

export { Tree, buildTreeLines } from "./Tree.js";
export type { TreeNode, TreeLine, TreeProps } from "./Tree.js";

export { ProgressBar, renderProgressBar } from "./ProgressBar.js";
export type {
  ProgressBarInput,
  ProgressBarOutput,
  ProgressBarProps,
} from "./ProgressBar.js";
