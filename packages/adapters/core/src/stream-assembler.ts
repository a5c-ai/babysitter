/**
 * StreamAssembler — stateful utility for reassembling fragmented agent output.
 *
 * Operates in two modes:
 * - Line mode (default): each line is returned as-is from feed().
 * - Block mode: lines are accumulated until a termination condition is met.
 *
 * @see 05-adapter-system.md §6
 */

/** Predicate that determines when a block is complete. */
export type BlockTerminator = (line: string, accumulated: string) => boolean;

/**
 * Stateful utility for reassembling fragmented agent output into
 * complete, parseable units. One instance per run.
 */
export class StreamAssembler {
  private _buffer: string[] = [];
  private _terminator: BlockTerminator | null = null;

  /**
   * Feeds a line into the assembler. In line mode, returns the line
   * unchanged. In block mode, accumulates the line and returns null
   * until the block is complete, then returns the assembled block.
   */
  feed(line: string): string | null {
    if (this._terminator === null) {
      // Line mode — pass through
      return line;
    }

    // Block mode — accumulate
    this._buffer.push(line);
    const accumulated = this._buffer.join('\n');

    if (this._terminator(line, accumulated)) {
      // Block complete
      this._terminator = null;
      const result = accumulated;
      this._buffer = [];
      return result;
    }

    return null;
  }

  /**
   * Begins block accumulation mode. Subsequent calls to feed()
   * will accumulate lines until endBlock() is called or the
   * termination predicate returns true.
   */
  startBlock(terminator: BlockTerminator): void {
    this._terminator = terminator;
    this._buffer = [];
  }

  /**
   * Forces the current block to end and returns whatever has been
   * accumulated so far. Returns null if not in block mode.
   */
  endBlock(): string | null {
    if (this._terminator === null && this._buffer.length === 0) {
      return null;
    }
    const result = this._buffer.length > 0 ? this._buffer.join('\n') : null;
    this._terminator = null;
    this._buffer = [];
    return result;
  }

  /** Whether the assembler is currently in block accumulation mode. */
  get inBlock(): boolean {
    return this._terminator !== null;
  }

  /**
   * Resets the assembler to its initial state.
   */
  reset(): void {
    this._buffer = [];
    this._terminator = null;
  }

  /**
   * Returns the number of lines currently accumulated in the buffer.
   * Zero when not in block mode.
   */
  get bufferedLineCount(): number {
    return this._buffer.length;
  }

  /**
   * Returns the raw accumulated content without ending the block.
   */
  peek(): string {
    return this._buffer.join('\n');
  }
}
