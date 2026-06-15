import type {
  CommandHandler,
  ContextProvider,
  EventHandler,
  ExtensionContext,
  ExtensionEvent,
  ExtensionEventType,
  ExtensionPermission,
  ExtensionToolDefinition,
  GentyExtension,
  KeyHandler,
  StatusBarItem,
} from './types.js';

interface NamedEventHandler {
  extensionName: string;
  handler: EventHandler;
}

export class ExtensionRegistry {
  private extensions = new Map<string, GentyExtension>();
  private tools = new Map<string, ExtensionToolDefinition>();
  private commands = new Map<string, CommandHandler>();
  private keyBindings = new Map<string, { extensionName: string; handler: KeyHandler }>();
  private eventListeners = new Map<ExtensionEventType, NamedEventHandler[]>();
  private statusBarItems = new Map<string, StatusBarItem>();
  private contextProviders = new Map<string, ContextProvider>();
  private config = new Map<string, unknown>();
  private permissionPolicy: Set<ExtensionPermission> | 'allow-all' = 'allow-all';

  setPermissionPolicy(allowed: Set<ExtensionPermission> | 'allow-all'): void {
    this.permissionPolicy = allowed;
  }

  async activate(extension: GentyExtension): Promise<void> {
    if (this.extensions.has(extension.name)) {
      throw new Error(`Extension "${extension.name}" is already registered`);
    }

    if (this.permissionPolicy !== 'allow-all' && extension.permissions) {
      for (const perm of extension.permissions) {
        if (!this.permissionPolicy.has(perm)) {
          throw new Error(`Extension "${extension.name}" requires permission "${perm}" which is not allowed by policy`);
        }
      }
    }

    const ctx = this.createContext(extension.name);
    await extension.activate(ctx);
    this.extensions.set(extension.name, extension);
  }

  async deactivate(name: string): Promise<void> {
    const ext = this.extensions.get(name);
    if (!ext) return;
    await ext.deactivate?.();
    this.extensions.delete(name);
    this.removeExtensionArtifacts(name);
  }

  async deactivateAll(): Promise<void> {
    for (const name of [...this.extensions.keys()]) {
      await this.deactivate(name);
    }
  }

  async emit(event: ExtensionEvent): Promise<void> {
    const handlers = this.eventListeners.get(event.type) ?? [];
    for (const { handler } of handlers) {
      try {
        await handler(event);
      } catch {
        // Extension event handlers must not crash the host
      }
    }
  }

  getTool(name: string): ExtensionToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ExtensionToolDefinition[] {
    return [...this.tools.values()];
  }

  getCommand(name: string): CommandHandler | undefined {
    return this.commands.get(name);
  }

  getAllCommands(): Map<string, CommandHandler> {
    return new Map(this.commands);
  }

  getKeyBinding(key: string): KeyHandler | undefined {
    return this.keyBindings.get(key)?.handler;
  }

  getStatusBarItems(): StatusBarItem[] {
    return [...this.statusBarItems.values()].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  getContextProviders(): ContextProvider[] {
    return [...this.contextProviders.values()];
  }

  getExtensionNames(): string[] {
    return [...this.extensions.keys()];
  }

  setConfig(key: string, value: unknown): void {
    this.config.set(key, value);
  }

  private createContext(extensionName: string): ExtensionContext {
    const prefix = `ext:${extensionName}:`;
    return {
      registerTool: (tool) => {
        this.tools.set(`${prefix}${tool.name}`, { ...tool, name: `${prefix}${tool.name}` });
      },
      registerCommand: (name, handler) => {
        this.commands.set(`${prefix}${name}`, handler);
      },
      registerKeyBinding: (key, handler) => {
        const existing = this.keyBindings.get(key);
        if (existing && existing.extensionName !== extensionName) {
          throw new Error(`Key binding "${key}" already registered by extension "${existing.extensionName}"`);
        }
        this.keyBindings.set(key, { extensionName, handler });
      },
      onEvent: (event, handler) => {
        const handlers = this.eventListeners.get(event) ?? [];
        handlers.push({ extensionName, handler });
        this.eventListeners.set(event, handlers);
      },
      registerStatusBarItem: (item) => {
        this.statusBarItems.set(`${prefix}${item.id}`, { ...item, id: `${prefix}${item.id}` });
      },
      injectContext: (provider) => {
        this.contextProviders.set(`${prefix}${provider.id}`, { ...provider, id: `${prefix}${provider.id}` });
      },
      getConfig: <T = unknown>(key: string, defaultValue?: T): T => {
        return (this.config.get(`${prefix}${key}`) ?? defaultValue) as T;
      },
      log: (level, message, ...args) => {
        const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : level === 'debug' ? console.debug : console.log;
        fn(`[${extensionName}]`, message, ...args);
      },
    };
  }

  private removeExtensionArtifacts(name: string): void {
    const prefix = `ext:${name}:`;
    for (const key of [...this.tools.keys()]) if (key.startsWith(prefix)) this.tools.delete(key);
    for (const key of [...this.commands.keys()]) if (key.startsWith(prefix)) this.commands.delete(key);
    for (const key of [...this.statusBarItems.keys()]) if (key.startsWith(prefix)) this.statusBarItems.delete(key);
    for (const key of [...this.contextProviders.keys()]) if (key.startsWith(prefix)) this.contextProviders.delete(key);
    for (const [key, binding] of [...this.keyBindings.entries()]) {
      if (binding.extensionName === name) this.keyBindings.delete(key);
    }
    for (const [eventType, handlers] of this.eventListeners.entries()) {
      this.eventListeners.set(eventType, handlers.filter(h => h.extensionName !== name));
    }
  }
}
