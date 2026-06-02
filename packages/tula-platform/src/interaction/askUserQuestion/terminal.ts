import type { Readable, Writable } from "node:stream";

export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const CYAN = "\x1b[36m";
export const DIM = "\x1b[2m";
export const YELLOW = "\x1b[33m";

const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const CLEAR_LINE = "\x1b[2K";
const CURSOR_COL1 = "\x1b[G";
const CURSOR_UP = "\x1b[A";

interface ArrowSelectOptions {
  multiSelect?: boolean;
}

export function isTTYInput(
  stream: Readable,
): stream is NodeJS.ReadStream & { setRawMode: (mode: boolean) => void } {
  return "isTTY" in stream && (stream as NodeJS.ReadStream).isTTY === true && typeof (stream as NodeJS.ReadStream).setRawMode === "function";
}

function renderOptions(
  output: Writable,
  options: string[],
  cursor: number,
  selected: Set<number>,
  multiSelect: boolean,
): number {
  let lines = 0;
  for (const [index, label] of options.entries()) {
    const isCurrent = index === cursor;
    const prefix = multiSelect
      ? selected.has(index)
        ? isCurrent
          ? `${CYAN}${BOLD}> [x]${RESET} `
          : "  [x] "
        : isCurrent
          ? `${CYAN}${BOLD}> [ ]${RESET} `
          : "  [ ] "
      : isCurrent
        ? `${CYAN}${BOLD}> ${RESET}`
        : "  ";
    const text = isCurrent ? `${CYAN}${BOLD}${label}${RESET}` : label;
    output.write(`${CLEAR_LINE}${CURSOR_COL1}${prefix}${text}\n`);
    lines++;
  }

  if (multiSelect) {
    output.write(`${CLEAR_LINE}${CURSOR_COL1}${DIM}(Space to toggle, Enter to confirm, Esc to cancel)${RESET}\n`);
    lines++;
  } else {
    output.write(`${CLEAR_LINE}${CURSOR_COL1}${DIM}(Up/Down to move, Enter to select, 1-9 shortcut, Esc to cancel)${RESET}\n`);
    lines++;
  }

  return lines;
}

function moveUp(output: Writable, count: number): void {
  if (count > 0) {
    output.write(`${CURSOR_UP}`.repeat(count));
  }
}

export function promptArrowKeySelect(
  input: NodeJS.ReadStream,
  output: Writable,
  options: string[],
  opts?: ArrowSelectOptions,
): Promise<number | number[] | undefined> {
  const multiSelect = opts?.multiSelect ?? false;

  return new Promise((resolve) => {
    let cursor = 0;
    const selected = new Set<number>();
    let renderedLines = 0;
    let resolved = false;

    const cleanup = (): void => {
      if (resolved) {
        return;
      }
      resolved = true;
      input.removeListener("data", onData);
      try {
        input.setRawMode(false);
      } catch {
        // Ignore stream cleanup failures.
      }
      output.write(SHOW_CURSOR);
    };

    const finish = (value: number | number[] | undefined): void => {
      cleanup();
      resolve(value);
    };

    const redraw = (): void => {
      moveUp(output, renderedLines);
      renderedLines = renderOptions(output, options, cursor, selected, multiSelect);
    };

    const onData = (data: Buffer): void => {
      if (resolved) {
        return;
      }

      const key = data.toString("utf8");
      if (key === "\x03" || key === "\x1b" || key === "\x1b\x1b") {
        finish(undefined);
        return;
      }

      if (key === "\r" || key === "\n") {
        finish(multiSelect ? [...selected].sort((left, right) => left - right) : cursor);
        return;
      }

      if (key === " " && multiSelect) {
        if (selected.has(cursor)) {
          selected.delete(cursor);
        } else {
          selected.add(cursor);
        }
        redraw();
        return;
      }

      if (key === "\x1b[A") {
        cursor = cursor > 0 ? cursor - 1 : options.length - 1;
        redraw();
        return;
      }

      if (key === "\x1b[B") {
        cursor = cursor < options.length - 1 ? cursor + 1 : 0;
        redraw();
        return;
      }

      if (!multiSelect && /^[1-9]$/.test(key)) {
        const index = Number(key) - 1;
        if (index < options.length) {
          finish(index);
        }
      }
    };

    output.write(HIDE_CURSOR);
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
    renderedLines = renderOptions(output, options, cursor, selected, multiSelect);
  });
}
