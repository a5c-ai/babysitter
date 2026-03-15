import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// EventEmitter
// ---------------------------------------------------------------------------
export class EventEmitter<T> {
  private _listeners: Array<(e: T) => void> = [];

  event = vi.fn((listener: (e: T) => void) => {
    this._listeners.push(listener);
    return new Disposable(() => {
      const idx = this._listeners.indexOf(listener);
      if (idx >= 0) {
        this._listeners.splice(idx, 1);
      }
    });
  });

  fire = vi.fn((data: T) => {
    for (const listener of this._listeners) {
      listener(data);
    }
  });

  dispose = vi.fn(() => {
    this._listeners = [];
  });
}

// ---------------------------------------------------------------------------
// TreeItemCollapsibleState
// ---------------------------------------------------------------------------
export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2,
}

// ---------------------------------------------------------------------------
// TreeItem
// ---------------------------------------------------------------------------
export class TreeItem {
  label?: string | { label: string; highlights?: [number, number][] };
  description?: string | boolean;
  iconPath?: ThemeIcon | Uri | { light: Uri; dark: Uri };
  tooltip?: string | MarkdownString;
  contextValue?: string;
  collapsibleState?: TreeItemCollapsibleState;
  command?: { command: string; title: string; arguments?: unknown[] };
  id?: string;
  resourceUri?: Uri;

  constructor(
    labelOrUri: string | Uri,
    collapsibleState?: TreeItemCollapsibleState,
  ) {
    if (typeof labelOrUri === 'string') {
      this.label = labelOrUri;
    } else {
      this.resourceUri = labelOrUri;
    }
    this.collapsibleState = collapsibleState ?? TreeItemCollapsibleState.None;
  }
}

// ---------------------------------------------------------------------------
// ThemeIcon
// ---------------------------------------------------------------------------
export class ThemeIcon {
  id: string;
  color?: ThemeColor;

  static readonly File = new ThemeIcon('file');
  static readonly Folder = new ThemeIcon('folder');

  constructor(id: string, color?: ThemeColor) {
    this.id = id;
    this.color = color;
  }
}

// ---------------------------------------------------------------------------
// ThemeColor
// ---------------------------------------------------------------------------
export class ThemeColor {
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}

// ---------------------------------------------------------------------------
// Uri
// ---------------------------------------------------------------------------
export class Uri {
  readonly scheme: string;
  readonly authority: string;
  readonly path: string;
  readonly query: string;
  readonly fragment: string;
  readonly fsPath: string;

  private constructor(scheme: string, authority: string, path: string, query: string, fragment: string) {
    this.scheme = scheme;
    this.authority = authority;
    this.path = path;
    this.query = query;
    this.fragment = fragment;
    this.fsPath = path.replace(/\//g, (process.platform === 'win32' ? '\\' : '/'));
  }

  static file(filePath: string): Uri {
    const normalized = filePath.replace(/\\/g, '/');
    return new Uri('file', '', normalized, '', '');
  }

  static parse(value: string): Uri {
    return new Uri('https', '', value, '', '');
  }

  static joinPath(base: Uri, ...pathSegments: string[]): Uri {
    const joined = [base.path, ...pathSegments].join('/');
    return new Uri(base.scheme, base.authority, joined, base.query, base.fragment);
  }

  with(change: { scheme?: string; authority?: string; path?: string; query?: string; fragment?: string }): Uri {
    return new Uri(
      change.scheme ?? this.scheme,
      change.authority ?? this.authority,
      change.path ?? this.path,
      change.query ?? this.query,
      change.fragment ?? this.fragment,
    );
  }

  toString(): string {
    return `${this.scheme}://${this.authority}${this.path}`;
  }
}

// ---------------------------------------------------------------------------
// MarkdownString
// ---------------------------------------------------------------------------
export class MarkdownString {
  value: string;
  isTrusted?: boolean;
  supportHtml?: boolean;
  supportThemeIcons?: boolean;

  constructor(value?: string, supportThemeIcons?: boolean) {
    this.value = value ?? '';
    this.supportThemeIcons = supportThemeIcons;
  }

  appendMarkdown(value: string): MarkdownString {
    this.value += value;
    return this;
  }

  appendText(value: string): MarkdownString {
    this.value += value;
    return this;
  }

  appendCodeblock(value: string, language?: string): MarkdownString {
    this.value += `\n\`\`\`${language ?? ''}\n${value}\n\`\`\`\n`;
    return this;
  }
}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export enum StatusBarAlignment {
  Left = 1,
  Right = 2,
}

export enum ViewColumn {
  One = 1,
  Two = 2,
  Three = 3,
}

// ---------------------------------------------------------------------------
// Disposable
// ---------------------------------------------------------------------------
export class Disposable {
  private _callOnDispose?: () => void;

  constructor(callOnDispose?: () => void) {
    this._callOnDispose = callOnDispose;
  }

  static from(...disposables: { dispose(): unknown }[]): Disposable {
    return new Disposable(() => {
      for (const d of disposables) {
        d.dispose();
      }
    });
  }

  dispose(): void {
    this._callOnDispose?.();
    this._callOnDispose = undefined;
  }
}

// ---------------------------------------------------------------------------
// workspace
// ---------------------------------------------------------------------------
const _mockConfiguration: Record<string, unknown> = {};

export const workspace = {
  createFileSystemWatcher: vi.fn(() => ({
    onDidCreate: vi.fn(() => new Disposable()),
    onDidChange: vi.fn(() => new Disposable()),
    onDidDelete: vi.fn(() => new Disposable()),
    dispose: vi.fn(),
  })),
  workspaceFolders: [
    {
      uri: Uri.file('/mock/workspace'),
      name: 'mock-workspace',
      index: 0,
    },
  ],
  getConfiguration: vi.fn((section?: string) => ({
    get: vi.fn((key: string, defaultValue?: unknown) => {
      const fullKey = section ? `${section}.${key}` : key;
      return _mockConfiguration[fullKey] ?? defaultValue;
    }),
    has: vi.fn((_key: string) => false),
    inspect: vi.fn(() => undefined),
    update: vi.fn(),
  })),
  onDidChangeConfiguration: vi.fn(() => new Disposable()),
  onDidChangeWorkspaceFolders: vi.fn(() => new Disposable()),
  fs: {
    readFile: vi.fn(() => Promise.resolve(Buffer.from(''))),
    writeFile: vi.fn(() => Promise.resolve()),
    stat: vi.fn(() => Promise.resolve({ type: 1, ctime: 0, mtime: 0, size: 0 })),
    readDirectory: vi.fn(() => Promise.resolve([])),
    createDirectory: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    rename: vi.fn(() => Promise.resolve()),
    copy: vi.fn(() => Promise.resolve()),
  },
};

// ---------------------------------------------------------------------------
// window
// ---------------------------------------------------------------------------
export const window = {
  createStatusBarItem: vi.fn(() => ({
    alignment: StatusBarAlignment.Left,
    priority: 0,
    text: '',
    tooltip: '',
    color: undefined,
    backgroundColor: undefined,
    command: undefined,
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  })),
  createTreeView: vi.fn(() => ({
    onDidChangeSelection: vi.fn(() => new Disposable()),
    onDidChangeVisibility: vi.fn(() => new Disposable()),
    onDidCollapseElement: vi.fn(() => new Disposable()),
    onDidExpandElement: vi.fn(() => new Disposable()),
    reveal: vi.fn(),
    dispose: vi.fn(),
    visible: true,
    message: undefined,
    title: undefined,
    description: undefined,
    badge: undefined,
  })),
  showInformationMessage: vi.fn(() => Promise.resolve(undefined)),
  showErrorMessage: vi.fn(() => Promise.resolve(undefined)),
  showWarningMessage: vi.fn(() => Promise.resolve(undefined)),
  showQuickPick: vi.fn(() => Promise.resolve(undefined)),
  showInputBox: vi.fn(() => Promise.resolve(undefined)),
  createWebviewPanel: vi.fn(() => ({
    webview: {
      html: '',
      options: {},
      onDidReceiveMessage: vi.fn(() => new Disposable()),
      postMessage: vi.fn(() => Promise.resolve(true)),
      asWebviewUri: vi.fn((uri: Uri) => uri),
      cspSource: 'mock-csp',
    },
    onDidDispose: vi.fn(() => new Disposable()),
    onDidChangeViewState: vi.fn(() => new Disposable()),
    reveal: vi.fn(),
    dispose: vi.fn(),
    visible: true,
    viewColumn: ViewColumn.One,
    active: true,
    title: '',
  })),
  onDidChangeActiveColorTheme: vi.fn(() => new Disposable()),
  onDidChangeActiveTextEditor: vi.fn(() => new Disposable()),
  activeTextEditor: undefined,
  withProgress: vi.fn((_options: unknown, task: (progress: unknown) => Promise<unknown>) =>
    task({ report: vi.fn() }),
  ),
  createOutputChannel: vi.fn(() => ({
    appendLine: vi.fn(),
    append: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
    name: 'mock-channel',
  })),
};

// ---------------------------------------------------------------------------
// commands
// ---------------------------------------------------------------------------
export const commands = {
  registerCommand: vi.fn((_command: string, _callback: (...args: unknown[]) => unknown) => new Disposable()),
  executeCommand: vi.fn(() => Promise.resolve()),
};

// ---------------------------------------------------------------------------
// env
// ---------------------------------------------------------------------------
export const env = {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
  },
  language: 'en',
  machineId: 'mock-machine-id',
  sessionId: 'mock-session-id',
  uriScheme: 'vscode',
};

// ---------------------------------------------------------------------------
// languages
// ---------------------------------------------------------------------------
export const languages = {
  registerCodeLensProvider: vi.fn(() => new Disposable()),
  registerHoverProvider: vi.fn(() => new Disposable()),
};

// ---------------------------------------------------------------------------
// CancellationTokenSource
// ---------------------------------------------------------------------------
export class CancellationTokenSource {
  token = {
    isCancellationRequested: false,
    onCancellationRequested: vi.fn(() => new Disposable()),
  };
  cancel = vi.fn();
  dispose = vi.fn();
}

// ---------------------------------------------------------------------------
// ProgressLocation
// ---------------------------------------------------------------------------
export enum ProgressLocation {
  SourceControl = 1,
  Window = 10,
  Notification = 15,
}

// ---------------------------------------------------------------------------
// RelativePattern
// ---------------------------------------------------------------------------
export class RelativePattern {
  baseUri: Uri;
  base: string;
  pattern: string;

  constructor(base: string | Uri | { uri: Uri }, pattern: string) {
    if (typeof base === 'string') {
      this.base = base;
      this.baseUri = Uri.file(base);
    } else if (base instanceof Uri) {
      this.base = base.fsPath;
      this.baseUri = base;
    } else {
      this.base = base.uri.fsPath;
      this.baseUri = base.uri;
    }
    this.pattern = pattern;
  }
}

// ---------------------------------------------------------------------------
// FileSystemWatcher (type stub)
// ---------------------------------------------------------------------------
export type FileSystemWatcher = {
  onDidCreate: (listener: (e: Uri) => void) => Disposable;
  onDidChange: (listener: (e: Uri) => void) => Disposable;
  onDidDelete: (listener: (e: Uri) => void) => Disposable;
  dispose: () => void;
};

// ---------------------------------------------------------------------------
// Default export for module aliasing
// ---------------------------------------------------------------------------
export default {
  EventEmitter,
  TreeItem,
  TreeItemCollapsibleState,
  ThemeIcon,
  ThemeColor,
  Uri,
  MarkdownString,
  StatusBarAlignment,
  ViewColumn,
  Disposable,
  CancellationTokenSource,
  ProgressLocation,
  RelativePattern,
  workspace,
  window,
  commands,
  env,
  languages,
};
