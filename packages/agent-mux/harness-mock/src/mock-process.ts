/**
 * MockProcess — simulates a harness subprocess with configurable behavior.
 *
 * Emits output chunks on a schedule, handles stdin interactions,
 * simulates file operations, and exits with the configured code/timing.
 */

import { EventEmitter } from 'node:events';
import type {
  HarnessScenario,
  MockExecutionResult,
  OutputChunk,
  FileOperation,
  InteractionResolution,
  StdinInteraction,
  SubprocessMockHandle,
  SubprocessResult,
} from './types.js';

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let nextPid = 10000;
let nextHandleId = 1;

// ---------------------------------------------------------------------------
// MockProcess
// ---------------------------------------------------------------------------

export class MockProcess extends EventEmitter implements SubprocessMockHandle {
  readonly scenario: HarnessScenario;
  readonly pid: number;
  readonly id: number;

  private _exited = false;
  private _exitCode: number | undefined;
  private _stdout = '';
  private _stderr = '';
  private _fileChanges: FileOperation[] = [];
  private _timers: ReturnType<typeof setTimeout>[] = [];
  private _stdinBuffer = '';
  private _pendingInteraction: {
    interaction: StdinInteraction;
    nextIndex: number;
    timeoutTimer?: ReturnType<typeof setTimeout>;
    resolved: boolean;
  } | null = null;
  private readonly _startedAt = Date.now();

  constructor(scenario: HarnessScenario) {
    super();
    this.scenario = scenario;
    this.pid = nextPid++;
    this.id = nextHandleId++;
  }

  // -----------------------------------------------------------------------
  // MockHarnessHandle
  // -----------------------------------------------------------------------

  get exited(): boolean { return this._exited; }
  get exitCode(): number | undefined { return this._exitCode; }
  get stdout(): string { return this._stdout; }
  get stderr(): string { return this._stderr; }
  get fileChanges(): FileOperation[] { return [...this._fileChanges]; }

  async stop(): Promise<void> {
    this.kill('SIGTERM');
    await this.waitForExit();
  }

  forceStop(): void {
    this.kill('SIGKILL');
  }

  write(data: string): void {
    if (this._exited) throw new Error('Cannot write to exited process');
    this._acceptInput(data);
  }

  kill(signal = 'SIGTERM'): void {
    if (this._exited) return;
    this._cleanup();
    this._exit(signal === 'SIGKILL' ? 137 : 143);
  }

  waitForExit(): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    if (this._exited) {
      return Promise.resolve({
        exitCode: this._exitCode!,
        stdout: this._stdout,
        stderr: this._stderr,
      });
    }
    return new Promise((resolve) => {
      this.once('exit', () => {
        resolve({
          exitCode: this._exitCode!,
          stdout: this._stdout,
          stderr: this._stderr,
        });
      });
    });
  }

  async waitForCompletion(): Promise<MockExecutionResult> {
    const result = await this.waitForExit();
    const subprocess: SubprocessResult = {
      type: 'subprocess',
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
    };
    return {
      success: result.exitCode === 0,
      durationMs: Date.now() - this._startedAt,
      error: result.exitCode === 0
        ? undefined
        : {
          code: 'PROCESS_EXIT',
          message: result.stderr.trim() || `Process exited with code ${result.exitCode}`,
        },
      results: subprocess,
    };
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /**
   * Start the mock process. Call this after setting up event listeners.
   * Returns the handle for chaining.
   */
  start(): SubprocessMockHandle {
    const process = this.scenario.process ?? { exitCode: 0 };
    const startDelay = process.startupDelayMs ?? 0;

    this._schedule(startDelay, () => {
      this.emit('spawn');
      this._validateExpectations();
      this._applyFileOperations();
      this._emitSimulatedTelemetry();
      this._emitOutputChunks();
    });

    if (process.hang) {
      // Don't schedule exit — process hangs
      return this;
    }

    if (process.crashAfterMs !== undefined) {
      this._schedule(process.crashAfterMs, () => {
        if (!this._exited) {
          const signal = process.crashSignal ?? 'SIGTERM';
          this._exit(signal === 'SIGKILL' ? 137 : 143);
        }
      });
    }

    return this;
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  private _emitOutputChunks(index = 0): void {
    if (!this.scenario.output || index >= this.scenario.output.length) {
      this._scheduleExit();
      return;
    }

    const chunk = this.scenario.output[index]!;
    this._schedule(chunk.delayMs ?? 0, () => {
      if (this._exited) return;

      const hookStep = this.scenario.runtimeHooks?.steps.find((step) => step.chunkIndex === index);
      const proceed = () => {
        if (chunk.stream === 'stdout') {
          this._stdout += chunk.data;
          this.emit('stdout', chunk.data);
        } else {
          this._stderr += chunk.data;
          this.emit('stderr', chunk.data);
        }
        if (this._beginInteraction(chunk, index + 1)) {
          return;
        }
        this._emitOutputChunks(index + 1);
      };

      if (!hookStep) {
        proceed();
        return;
      }

      this.emit('runtime-hook', hookStep);

      if (hookStep.decision === 'timeout') {
        return;
      }

      this._schedule(hookStep.delayMs ?? 0, () => {
        if (this._exited) return;
        this.emit('runtime-hook-result', hookStep);
        if (hookStep.decision === 'deny') {
          const line = `${hookStep.errorMessage ?? `Runtime hook denied ${hookStep.kind}`}\n`;
          this._stderr += line;
          this.emit('stderr', line);
          this._exit(2);
          return;
        }
        proceed();
      });
    });
  }

  private _applyFileOperations(): void {
    if (!this.scenario.fileOperations) return;
    let cumulativeDelay = 0;
    for (const op of this.scenario.fileOperations) {
      this._schedule(cumulativeDelay, () => {
        if (this._exited) return;
        this._fileChanges.push(op);
        this.emit('file-operation', op);
      });
      cumulativeDelay += 1;
    }
  }

  private _beginInteraction(chunk: OutputChunk, nextIndex: number): boolean {
    if (!this.scenario.interactions || this._pendingInteraction) return false;
    for (const interaction of this.scenario.interactions) {
      const pattern = typeof interaction.triggerPattern === 'string'
        ? new RegExp(interaction.triggerPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        : interaction.triggerPattern;

      if (!pattern.test(chunk.data)) {
        continue;
      }

      this._pendingInteraction = {
        interaction,
        nextIndex,
        resolved: false,
      };

      if (interaction.timeoutMs !== undefined) {
        const timer = setTimeout(() => {
          if (!this._pendingInteraction?.resolved) {
            this._resolveInteraction('timeout');
          }
        }, interaction.timeoutMs);
        this._timers.push(timer);
        this._pendingInteraction.timeoutTimer = timer;
      }

      if (interaction.response) {
        this._schedule(interaction.delayMs ?? 0, () => {
          if (this._exited || !this._pendingInteraction || this._pendingInteraction.resolved) return;
          this.emit('auto-response', interaction.response);
          this._acceptInput(interaction.response);
        });
      }

      if (this._stdinBuffer.length > 0) {
        this._tryResolveInteractionFromInput(this._stdinBuffer);
      }

      return true;
    }
    return false;
  }

  private _acceptInput(data: string): void {
    this._stdinBuffer += data;
    this.emit('stdin', data);
    this._tryResolveInteractionFromInput(data);
  }

  private _tryResolveInteractionFromInput(input: string): void {
    if (!this._pendingInteraction || this._pendingInteraction.resolved) {
      return;
    }

    const normalizedInput = input.trim();
    if (normalizedInput.length === 0) {
      return;
    }

    const interaction = this._pendingInteraction.interaction;
    const allowPattern = this._toInputPattern(interaction.allowPattern, /^y(?:es)?\s*$/i);
    const denyPattern = this._toInputPattern(interaction.denyPattern, /^n(?:o)?\s*$/i);

    if (allowPattern.test(normalizedInput)) {
      this._resolveInteraction('allow');
      return;
    }
    if (denyPattern.test(normalizedInput)) {
      this._resolveInteraction('deny');
    }
  }

  private _resolveInteraction(decision: 'allow' | 'deny' | 'timeout'): void {
    if (!this._pendingInteraction || this._pendingInteraction.resolved) return;

    const pending = this._pendingInteraction;
    pending.resolved = true;
    if (pending.timeoutTimer) {
      clearTimeout(pending.timeoutTimer);
    }

    const resolution = decision === 'allow'
      ? pending.interaction.onAllow
      : decision === 'deny'
        ? pending.interaction.onDeny
        : pending.interaction.onTimeout;

    this._pendingInteraction = null;
    this._emitResolution(resolution, pending.nextIndex);
  }

  private _emitResolution(resolution: InteractionResolution | undefined, nextIndex: number): void {
    const output = resolution?.output ?? [];
    const emitAt = (index: number) => {
      if (this._exited) return;
      if (index >= output.length) {
        if (resolution?.exitCode !== undefined) {
          this._exit(resolution.exitCode);
          return;
        }
        this._emitOutputChunks(nextIndex);
        return;
      }

      const chunk = output[index]!;
      this._schedule(chunk.delayMs ?? 0, () => {
        if (this._exited) return;
        if (chunk.stream === 'stdout') {
          this._stdout += chunk.data;
          this.emit('stdout', chunk.data);
        } else {
          this._stderr += chunk.data;
          this.emit('stderr', chunk.data);
        }
        emitAt(index + 1);
      });
    };

    emitAt(0);
  }

  private _toInputPattern(pattern: string | RegExp | undefined, fallback: RegExp): RegExp {
    if (!pattern) return fallback;
    if (pattern instanceof RegExp) return pattern;
    return new RegExp(pattern, 'i');
  }

  private _emitSimulatedTelemetry(): void {
    if (!this.scenario.telemetry) return;

    if (this.scenario.telemetry.spans) {
      let cumulativeDelay = 0;
      for (const span of this.scenario.telemetry.spans) {
        cumulativeDelay += (span.delayMs ?? 0);
        this._schedule(cumulativeDelay, () => {
          if (this._exited) return;
          this.emit('telemetry-span', span);
        });
      }
    }

    if (this.scenario.telemetry.metrics) {
      let cumulativeDelay = 0;
      for (const metric of this.scenario.telemetry.metrics) {
        cumulativeDelay += (metric.delayMs ?? 0);
        this._schedule(cumulativeDelay, () => {
          if (this._exited) return;
          this.emit('telemetry-metric', metric);
        });
      }
    }
  }

  private _scheduleExit(): void {
    const process = this.scenario.process ?? { exitCode: 0 };
    if (process.hang) return;
    if (process.crashAfterMs !== undefined) return;
    const shutdownDelay = process.shutdownDelayMs ?? 0;
    this._schedule(shutdownDelay, () => {
      if (!this._exited) {
        this._exit(process.exitCode);
      }
    });
  }

  private _validateExpectations(): void {
    // These are checked synchronously at start for test assertions
    if (this.scenario.expectedEnv) {
      this.emit('validate-env', this.scenario.expectedEnv);
    }
    if (this.scenario.expectedArgs) {
      this.emit('validate-args', this.scenario.expectedArgs);
    }
    if (this.scenario.expectedCwd) {
      this.emit('validate-cwd', this.scenario.expectedCwd);
    }
  }

  private _exit(code: number): void {
    if (this._exited) return;
    this._exited = true;
    this._exitCode = code;
    this._cleanup();
    this.emit('exit', code);
  }

  private _schedule(delayMs: number, fn: () => void): void {
    if (delayMs <= 0) {
      // Use setImmediate for zero-delay to maintain async semantics
      const timer = setTimeout(fn, 0);
      this._timers.push(timer);
    } else {
      const timer = setTimeout(fn, delayMs);
      this._timers.push(timer);
    }
  }

  private _cleanup(): void {
    this._pendingInteraction = null;
    for (const timer of this._timers) {
      clearTimeout(timer);
    }
    this._timers = [];
  }
}
