type BrowserWindow = Window & {
  process?: NodeJS.Process;
  global?: typeof globalThis;
};

const browserWindow = typeof window === 'undefined' ? null : (window as BrowserWindow);

if (browserWindow) {
  if (!browserWindow.process) {
    browserWindow.process = {
      env: {},
      platform: 'win32',
      version: '0.0.0',
      versions: {
        node: '0.0.0',
        v8: '0.0.0',
        uv: '0.0.0',
        zlib: '0.0.0',
        brotli: '0.0.0',
        ares: '0.0.0',
        modules: '0',
        nghttp2: '0.0.0',
        napi: '0',
        llhttp: '0.0.0',
        openssl: '0.0.0',
        cldr: '0.0.0',
        icu: '0.0.0',
        tz: '0.0.0',
        unicode: '0.0.0',
        http_parser: '0.0.0',
      },
      argv: [],
      execArgv: [],
      pid: 0,
      ppid: 0,
      arch: 'x64',
      title: 'browser',
      browser: true,
      execPath: '',
      cwd() {
        return '/';
      },
      chdir() {},
      umask() {
        return 0;
      },
      nextTick(callback: (...args: unknown[]) => void, ...args: unknown[]) {
        setTimeout(() => callback(...args), 0);
      },
      exit() {
        throw new Error('process.exit is unavailable in the browser');
      },
      on() {
        return browserWindow.process!;
      },
      off() {
        return browserWindow.process!;
      },
      once() {
        return browserWindow.process!;
      },
      emit() {
        return false;
      },
      removeListener() {
        return browserWindow.process!;
      },
      addListener() {
        return browserWindow.process!;
      },
      prependListener() {
        return browserWindow.process!;
      },
      prependOnceListener() {
        return browserWindow.process!;
      },
      removeAllListeners() {
        return browserWindow.process!;
      },
      listeners() {
        return [];
      },
      rawListeners() {
        return [];
      },
      listenerCount() {
        return 0;
      },
      eventNames() {
        return [];
      },
      getMaxListeners() {
        return 0;
      },
      setMaxListeners() {
        return browserWindow.process!;
      },
      stdout: undefined,
      stderr: undefined,
      stdin: undefined,
      disconnect() {},
      connected: false,
      kill() {
        return false;
      },
      memoryUsage() {
        return {
          rss: 0,
          heapTotal: 0,
          heapUsed: 0,
          external: 0,
          arrayBuffers: 0,
        };
      },
      cpuUsage() {
        return { user: 0, system: 0 };
      },
      uptime() {
        return 0;
      },
      hrtime(time?: [number, number]) {
        return time ? [0, 0] : [0, 0];
      },
      dlopen() {
        throw new Error('process.dlopen is unavailable in the browser');
      },
      release: {
        name: 'node',
        sourceUrl: '',
        headersUrl: '',
        libUrl: '',
      },
      config: { variables: {} },
    } as unknown as NodeJS.Process;
  }

  if (!browserWindow.global) {
    browserWindow.global = globalThis;
  }
}

export {};
