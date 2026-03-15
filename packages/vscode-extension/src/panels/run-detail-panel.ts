import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as path from 'path';
import { RunCache } from '../lib/run-cache';
import { getTaskDetail } from '../lib/parser';
import { generateWebviewContent } from './webview-content';
import { approveBreakpoint } from './breakpoint-handler';

// ---------------------------------------------------------------------------
// RunDetailPanel — webview panel for a single run
// ---------------------------------------------------------------------------

export class RunDetailPanel {
  public static currentPanels: Map<string, RunDetailPanel> = new Map();

  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private runId: string;
  private workspaceRoot: string;
  private cache: RunCache;
  private extensionUri: vscode.Uri;

  // -------------------------------------------------------------------------
  // Create or reveal
  // -------------------------------------------------------------------------

  static createOrShow(
    extensionUri: vscode.Uri,
    cache: RunCache,
    runId: string,
    workspaceRoot: string,
  ): RunDetailPanel {
    const existing = RunDetailPanel.currentPanels.get(runId);
    if (existing) {
      existing.panel.reveal(vscode.ViewColumn.One);
      existing.update(cache, workspaceRoot);
      return existing;
    }

    const instance = new RunDetailPanel(extensionUri, cache, runId, workspaceRoot);
    RunDetailPanel.currentPanels.set(runId, instance);
    return instance;
  }

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  private constructor(
    extensionUri: vscode.Uri,
    cache: RunCache,
    runId: string,
    workspaceRoot: string,
  ) {
    this.extensionUri = extensionUri;
    this.cache = cache;
    this.runId = runId;
    this.workspaceRoot = workspaceRoot;

    // Derive a human-readable title
    const run = cache.getById(runId);
    const title = run && run.processId !== 'unknown'
      ? `Run: ${run.processId}`
      : `Run: ${runId.slice(0, 12)}`;

    this.panel = vscode.window.createWebviewPanel(
      'babysitterRunDetail',
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri],
      },
    );

    // Initial render
    this.renderHtml();

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      (message: { type: string; [key: string]: unknown }) => this.handleMessage(message),
      undefined,
      this.disposables,
    );

    // Refresh when panel becomes visible again
    this.panel.onDidChangeViewState(
      () => {
        if (this.panel.visible) {
          this.update(this.cache, this.workspaceRoot);
        }
      },
      undefined,
      this.disposables,
    );

    // Cleanup on dispose
    this.panel.onDidDispose(
      () => this.dispose(),
      undefined,
      this.disposables,
    );
  }

  // -------------------------------------------------------------------------
  // Update panel content
  // -------------------------------------------------------------------------

  update(cache: RunCache, workspaceRoot: string): void {
    this.cache = cache;
    this.workspaceRoot = workspaceRoot;
    this.renderHtml();
  }

  // -------------------------------------------------------------------------
  // Message handling from webview
  // -------------------------------------------------------------------------

  private handleMessage(message: { type: string; [key: string]: unknown }): void {
    switch (message.type) {
      case 'selectTask': {
        const effectId = String(message.effectId ?? '');
        if (!effectId) { return; }

        const runDirPath = path.join(this.workspaceRoot, '.a5c', 'runs', this.runId);
        const detail = getTaskDetail(runDirPath, effectId);
        if (detail) {
          void this.panel.webview.postMessage({ type: 'taskDetail', task: detail });
        }
        break;
      }

      case 'approveBreakpoint': {
        const effectId = String(message.effectId ?? '');
        if (!effectId) { return; }

        void approveBreakpoint(this.workspaceRoot, this.runId, effectId).then((success) => {
          if (success) {
            // Refresh the run data after approval
            this.cache.refresh(this.runId);
            this.renderHtml();
          }
        });
        break;
      }

      case 'refresh': {
        this.cache.refresh(this.runId);
        this.renderHtml();
        break;
      }

      case 'copyToClipboard': {
        const text = String(message.text ?? '');
        if (text) {
          void vscode.env.clipboard.writeText(text);
          void vscode.window.showInformationMessage('Copied to clipboard.');
        }
        break;
      }

      default:
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  private renderHtml(): void {
    const run = this.cache.getById(this.runId);
    if (!run) {
      this.panel.webview.html = `<!DOCTYPE html>
<html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#999">
<h2>Run Not Found</h2>
<p>The run <code>${this.escHtml(this.runId)}</code> could not be loaded.</p>
</body></html>`;
      return;
    }

    const nonce = this.getNonce();
    const cspSource = this.panel.webview.cspSource;
    this.panel.webview.html = generateWebviewContent(run, nonce, cspSource);
  }

  // -------------------------------------------------------------------------
  // Dispose
  // -------------------------------------------------------------------------

  dispose(): void {
    RunDetailPanel.currentPanels.delete(this.runId);

    this.panel.dispose();

    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) { d.dispose(); }
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private getNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private escHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
