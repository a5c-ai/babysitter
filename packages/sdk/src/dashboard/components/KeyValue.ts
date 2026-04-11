/**
 * KeyValue — renders a label: value pair with alignment.
 */
import { colors, colorize } from "../colors";

export interface KeyValueOptions {
  labelWidth?: number;
  separator?: string;
}

export function renderKeyValue(
  label: string,
  value: string | number | boolean | undefined,
  options: KeyValueOptions = {},
): string {
  const { labelWidth = 0, separator = ":" } = options;
  const paddedLabel = labelWidth > 0 ? label.padEnd(labelWidth) : label;
  const displayValue = value === undefined ? colorize("(not set)", colors.dim) : String(value);
  return `${colorize(paddedLabel, colors.bold)}${separator} ${displayValue}`;
}

export function renderKeyValueBlock(
  entries: Array<[string, string | number | boolean | undefined]>,
  options: KeyValueOptions = {},
): string {
  const maxLabel = Math.max(...entries.map(([label]) => label.length));
  const opts = { ...options, labelWidth: options.labelWidth ?? maxLabel };
  return entries.map(([label, value]) => renderKeyValue(label, value, opts)).join("\n");
}
