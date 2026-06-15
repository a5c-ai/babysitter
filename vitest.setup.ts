import { EventEmitter } from 'node:events';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  if (typeof document !== 'undefined') {
    cleanup();
  }
});

vi.doMock('ink-testing-library', async () => {
  const { render: inkRender } = await import('ink');

  class Stdout extends EventEmitter {
    frames: string[] = [];
    private _lastFrame: string | undefined;

    write = (frame: string): void => {
      this.frames.push(frame);
      this._lastFrame = frame;
    };

    lastFrame = (): string | undefined => this._lastFrame;

    get columns(): number {
      return 100;
    }
  }

  class Stderr extends EventEmitter {
    frames: string[] = [];
    private _lastFrame: string | undefined;

    write = (frame: string): void => {
      this.frames.push(frame);
      this._lastFrame = frame;
    };

    lastFrame = (): string | undefined => this._lastFrame;
  }

  class Stdin extends EventEmitter {
    isTTY = true;
    private readonly queue: string[] = [];

    write = (data: string): void => {
      this.queue.push(data);
      this.emit('readable');
      this.emit('data', data);
    };

    read(): string | null {
      return this.queue.shift() ?? null;
    }

    setEncoding(): void {}
    setRawMode(): void {}
    resume(): void {}
    pause(): void {}
    ref(): void {}
    unref(): void {}
  }

  const instances: Array<{ unmount(): void; cleanup(): void }> = [];

  const render = (tree: Parameters<typeof inkRender>[0]) => {
    const stdout = new Stdout();
    const stderr = new Stderr();
    const stdin = new Stdin();
    const instance = inkRender(tree, {
      stdout: stdout as never,
      stderr: stderr as never,
      stdin: stdin as never,
      debug: true,
      exitOnCtrlC: false,
      patchConsole: false,
    });
    instances.push(instance);
    return {
      rerender: instance.rerender,
      unmount: instance.unmount,
      cleanup: instance.cleanup,
      stdout,
      stderr,
      stdin,
      frames: stdout.frames,
      lastFrame: stdout.lastFrame,
    };
  };

  const cleanup = (): void => {
    for (const instance of instances.splice(0)) {
      instance.unmount();
      instance.cleanup();
    }
  };

  return { render, cleanup };
});
