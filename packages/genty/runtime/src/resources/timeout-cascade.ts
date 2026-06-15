/**
 * Nested timeout management with cascading abort signals.
 *
 * Manages timeouts at three levels: run -> iteration -> effect.
 * When a parent timeout fires (or is cleared), all children are
 * automatically aborted.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Handle returned by each `create*Timeout` method. */
export interface TimeoutHandle {
  /** AbortSignal that fires when the timeout elapses or is cancelled. */
  readonly signal: AbortSignal;
  /** Manually clear the timeout and abort any children. */
  clear(): void;
}

// ---------------------------------------------------------------------------
// Internal node
// ---------------------------------------------------------------------------

interface TimeoutNode {
  controller: AbortController;
  timer: ReturnType<typeof setTimeout> | undefined;
  children: TimeoutNode[];
}

// ---------------------------------------------------------------------------
// TimeoutCascade
// ---------------------------------------------------------------------------

export class TimeoutCascade {
  private _run: TimeoutNode | undefined;
  private _iteration: TimeoutNode | undefined;

  // -- Factory methods ------------------------------------------------------

  /**
   * Create a run-level timeout.
   *
   * Clears any existing run (and its children) before creating a new one.
   */
  createRunTimeout(ms: number): TimeoutHandle {
    // Tear down any previous run hierarchy.
    if (this._run) {
      this._clearNode(this._run);
    }

    this._run = this._createNode(ms, undefined);
    this._iteration = undefined; // Children belong to previous run.

    return this._handleFor(this._run);
  }

  /**
   * Create an iteration-level timeout nested under the current run.
   *
   * Clears any existing iteration (and its effect children) first.
   *
   * @throws {Error} if no run timeout is active.
   */
  createIterationTimeout(ms: number): TimeoutHandle {
    if (!this._run) {
      throw new Error(
        "Cannot create iteration timeout: no run timeout is active",
      );
    }

    // Tear down previous iteration.
    if (this._iteration) {
      this._removeChild(this._run, this._iteration);
      this._clearNode(this._iteration);
    }

    this._iteration = this._createNode(ms, this._run);
    return this._handleFor(this._iteration);
  }

  /**
   * Create an effect-level timeout nested under the current iteration.
   *
   * @throws {Error} if no iteration timeout is active.
   */
  createEffectTimeout(ms: number): TimeoutHandle {
    if (!this._iteration) {
      throw new Error(
        "Cannot create effect timeout: no iteration timeout is active",
      );
    }

    const node = this._createNode(ms, this._iteration);
    return this._handleFor(node);
  }

  /**
   * Tear down all active timeouts (run, iteration, and effects).
   */
  clearAll(): void {
    if (this._run) {
      this._clearNode(this._run);
      this._run = undefined;
      this._iteration = undefined;
    }
  }

  // -- Internals ------------------------------------------------------------

  /**
   * Create a new `TimeoutNode`, register it as a child of `parent` (if any),
   * and set up parent-abort cascading.
   */
  private _createNode(
    ms: number,
    parent: TimeoutNode | undefined,
  ): TimeoutNode {
    const controller = new AbortController();

    const node: TimeoutNode = {
      controller,
      timer: undefined,
      children: [],
    };

    // Schedule the timeout.
    node.timer = setTimeout(() => {
      node.timer = undefined;
      this._abortNode(node);
    }, ms);

    // If the parent is already aborted, abort immediately.
    if (parent) {
      if (parent.controller.signal.aborted) {
        clearTimeout(node.timer);
        node.timer = undefined;
        controller.abort(parent.controller.signal.reason);
      } else {
        parent.children.push(node);

        // Listen for parent abort to cascade.
        const onParentAbort = (): void => {
          this._abortNode(node);
        };
        parent.controller.signal.addEventListener("abort", onParentAbort, {
          once: true,
        });
      }
    }

    return node;
  }

  /** Abort a node and all of its children recursively. */
  private _abortNode(node: TimeoutNode): void {
    if (node.timer !== undefined) {
      clearTimeout(node.timer);
      node.timer = undefined;
    }
    if (!node.controller.signal.aborted) {
      node.controller.abort(new Error("Timeout elapsed"));
    }
    for (const child of node.children) {
      this._abortNode(child);
    }
    node.children.length = 0;
  }

  /** Clear a node: abort it and all descendants. */
  private _clearNode(node: TimeoutNode): void {
    this._abortNode(node);
  }

  /** Remove a child from a parent's children array. */
  private _removeChild(parent: TimeoutNode, child: TimeoutNode): void {
    const idx = parent.children.indexOf(child);
    if (idx !== -1) {
      parent.children.splice(idx, 1);
    }
  }

  /** Create a public `TimeoutHandle` for a node. */
  private _handleFor(node: TimeoutNode): TimeoutHandle {
    return {
      signal: node.controller.signal,
      clear: () => {
        this._clearNode(node);
      },
    };
  }
}
