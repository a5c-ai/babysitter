import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import {
  scanProcessCatalog,
  type ProcessCatalog,
  type ProcessExport,
} from '../core/processCatalog';
import { buildGuidedPrompt } from '../core/promptBuilder';
import { PromptBuilderBridge } from './promptBuilderBridge';

type PromptBuilderWireExport = Pick<
  ProcessExport,
  'id' | 'modulePath' | 'exportName' | 'kind' | 'params' | 'doc' | 'returnKeys'
>;
type PromptBuilderWireCatalog = Pick<ProcessCatalog, 'version' | 'generatedAt'> & {
  exports: PromptBuilderWireExport[];
};

function toWireCatalog(catalog: ProcessCatalog): PromptBuilderWireCatalog {
  return {
    version: catalog.version,
    generatedAt: catalog.generatedAt,
    exports: catalog.exports.map((e) => {
      const base: PromptBuilderWireExport = {
        id: e.id,
        modulePath: e.modulePath,
        exportName: e.exportName,
        kind: e.kind,
        params: e.params,
      };
      if (e.doc) base.doc = e.doc;
      if (e.returnKeys) base.returnKeys = e.returnKeys;
      return base;
    }),
  };
}

function getNonce(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function htmlForWebview(webview: vscode.Webview, title: string): string {
  const nonce = getNonce();
  const csp = [
    `default-src 'none'`,
    `img-src ${webview.cspSource} https: data:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
  ].join('; ');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      :root {
        --border: 1px solid var(--vscode-panel-border);
      }
      body {
        padding: 0;
        margin: 0;
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background);
        font-family: var(--vscode-font-family);
      }
      .wrap {
        display: flex;
        height: 100vh;
      }
      .sidebar {
        width: 420px;
        border-right: var(--border);
        display: flex;
        flex-direction: column;
        min-width: 320px;
      }
      .main {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 360px;
      }
      @media (max-width: 900px) {
        .wrap {
          flex-direction: column;
          height: auto;
          min-height: 100vh;
        }
        .sidebar {
          width: auto;
          min-width: 0;
          border-right: none;
          border-bottom: var(--border);
        }
        .main {
          min-width: 0;
        }
        .list {
          max-height: 44vh;
        }
      }
      .toolbar {
        padding: 10px 12px;
        border-bottom: var(--border);
        display: flex;
        gap: 8px;
        align-items: center;
      }
      input[type="text"] {
        flex: 1;
        border: var(--border);
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        padding: 6px 8px;
        border-radius: 6px;
        outline: none;
      }
      input[type="text"]:focus-visible,
      select:focus-visible,
      textarea:focus-visible,
      button:focus-visible {
        outline: 1px solid var(--vscode-focusBorder);
        outline-offset: 2px;
      }
      select {
        width: 100%;
        border: var(--border);
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        padding: 8px;
        border-radius: 6px;
        outline: none;
      }
      .list {
        padding: 10px 12px;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .pill {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 999px;
        border: var(--border);
        opacity: 0.9;
        font-size: 12px;
      }
      .section {
        padding: 12px;
        border-bottom: var(--border);
      }
      .section h2 {
        margin: 0 0 8px;
        font-size: 13px;
        font-weight: 600;
        opacity: 0.95;
      }
      .row {
        display: flex;
        gap: 10px;
      }
      @media (max-width: 900px) {
        .row {
          flex-direction: column;
        }
      }
      .col {
        flex: 1;
        min-width: 200px;
      }
      .field {
        margin-bottom: 10px;
      }
      .label {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: baseline;
        margin-bottom: 4px;
        font-size: 12px;
        opacity: 0.9;
      }
      textarea {
        width: 100%;
        min-height: 70px;
        resize: vertical;
        border: var(--border);
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        padding: 8px;
        border-radius: 6px;
        outline: none;
        box-sizing: border-box;
      }
      .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      button {
        border: var(--border);
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
      }
      button.secondary {
        background: transparent;
        color: var(--vscode-foreground);
      }
      button:disabled {
        opacity: 0.55;
        cursor: default;
      }
      .muted {
        opacity: 0.8;
        font-size: 12px;
        line-height: 1.4;
      }
      .attachments {
        border: 1px dashed var(--vscode-panel-border);
        border-radius: 8px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .attachment-item {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        border: var(--border);
        border-radius: 8px;
        padding: 6px 8px;
        background: var(--vscode-input-background);
      }
      .attachment-item code {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: block;
      }
      .linkbtn {
        border: none;
        background: transparent;
        color: var(--vscode-textLink-foreground);
        padding: 0;
      }
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        z-index: 10;
      }
      .overlay.open {
        display: flex;
      }
      .modal {
        width: min(980px, 100%);
        max-height: min(82vh, 900px);
        display: flex;
        flex-direction: column;
        background: var(--vscode-editor-background);
        border: var(--border);
        border-radius: 10px;
        box-shadow: 0 16px 44px rgba(0, 0, 0, 0.35);
        overflow: hidden;
      }
      .modal header {
        padding: 10px 12px;
        border-bottom: var(--border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .modal header h3 {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
      }
      .modal pre {
        margin: 0;
        padding: 12px;
        white-space: pre-wrap;
        overflow: auto;
        font-family: var(--vscode-editor-font-family);
        font-size: var(--vscode-editor-font-size);
        line-height: var(--vscode-editor-line-height);
        color: var(--vscode-editor-foreground);
        background: var(--vscode-editor-background);
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="sidebar">
        <div class="toolbar">
          <input id="search" type="text" placeholder="Search processes..." aria-label="Search processes" />
        </div>
        <div class="list">
          <div>
            <div class="label">
              <span>Process</span>
              <span id="count" class="pill">0</span>
            </div>
            <select id="processSelect" size="18" aria-label="Process list"></select>
          </div>
          <div class="muted" id="processMeta">Loading...</div>
        </div>
      </div>
      <div class="main">
        <div class="section">
          <h2>Inputs</h2>
          <div class="row">
            <div class="col">
              <div class="field">
                <div class="label"><span>Request</span></div>
                <textarea id="request" placeholder="Describe what you want to do..." aria-label="Request"></textarea>
              </div>
              <div class="field">
                <div class="label"><span>Files</span><span class="muted">Drag from Explorer</span></div>
                <div id="attachments" class="attachments">
                  <div class="muted">Drop file links here to include them in the prompt.</div>
                </div>
              </div>
            </div>
            <div class="col">
              <div id="params"></div>
            </div>
          </div>
          <div class="actions">
            <button id="dispatch">Dispatch via o</button>
            <button id="preview" class="secondary">Preview</button>
            <button id="insert" class="secondary">Insert into editor</button>
            <button id="copy" class="secondary">Copy to clipboard</button>
          </div>
        </div>
        <div class="section" style="flex: 1; display: flex; flex-direction: column;">
          <h2>Generated Prompt</h2>
          <textarea id="output" style="flex: 1; min-height: 180px;" spellcheck="false" aria-label="Generated prompt"></textarea>
          <div class="muted" id="status" style="margin-top: 8px;"></div>
        </div>
      </div>
    </div>

    <div id="previewOverlay" class="overlay" role="dialog" aria-modal="true" aria-label="Prompt preview">
      <div class="modal">
        <header>
          <h3>Prompt preview</h3>
          <button id="previewClose" class="secondary" aria-label="Close preview">Close</button>
        </header>
        <pre id="previewText"></pre>
      </div>
    </div>

    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      const state = {
        catalog: null,
        exports: [],
        selectedId: '',
        attachments: [],
        paramValues: {},
        lastPrompt: '',
      };

      const els = {
        search: document.getElementById('search'),
        count: document.getElementById('count'),
        select: document.getElementById('processSelect'),
        meta: document.getElementById('processMeta'),
        request: document.getElementById('request'),
        params: document.getElementById('params'),
        output: document.getElementById('output'),
        status: document.getElementById('status'),
        attachments: document.getElementById('attachments'),
        dispatch: document.getElementById('dispatch'),
        preview: document.getElementById('preview'),
        insert: document.getElementById('insert'),
        copy: document.getElementById('copy'),
        previewOverlay: document.getElementById('previewOverlay'),
        previewClose: document.getElementById('previewClose'),
        previewText: document.getElementById('previewText'),
      };

      function setStatus(text) {
        els.status.textContent = text || '';
      }

      function updateActions() {
        const hasPrompt = (els.output.value || '').trim().length > 0;
        els.dispatch.disabled = !hasPrompt;
        els.preview.disabled = !hasPrompt;
        els.insert.disabled = !hasPrompt;
        els.copy.disabled = !hasPrompt;
      }

      function openPreview(text) {
        els.previewText.textContent = text || '';
        els.previewOverlay.classList.add('open');
        els.previewClose.focus();
      }

      function closePreview() {
        els.previewOverlay.classList.remove('open');
      }

      let persistTimer = null;
      function schedulePersist() {
        if (persistTimer) clearTimeout(persistTimer);
        persistTimer = setTimeout(() => {
          vscode.postMessage({
            type: 'persist',
            state: {
              selectedId: state.selectedId,
              request: els.request.value || '',
              attachments: state.attachments.slice(),
              paramValues: { ...state.paramValues },
            },
          });
        }, 150);
      }

      function stringifyParamLabel(p) {
        const bits = [];
        if (p.isRest) bits.push('rest');
        if (p.hasDefault) bits.push('optional');
        return bits.length ? bits.join(', ') : 'required';
      }

      function parseValue(name, raw) {
        const trimmed = (raw || '').trim();
        if (!trimmed) return undefined;
        if (name === 'task' || name === 'prompt' || name === 'request') return trimmed;
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try { return JSON.parse(trimmed); } catch (_) { return trimmed; }
        }
        return trimmed;
      }

      let generateTimer = null;
      function scheduleGenerate() {
        if (generateTimer) clearTimeout(generateTimer);
        generateTimer = setTimeout(() => {
          vscode.postMessage({
            type: 'generate',
            processId: state.selectedId,
            args: collectArgs(),
            request: els.request.value || '',
            attachments: state.attachments.slice(),
          });
        }, 120);
      }

      function collectArgs() {
        const exp = state.exports.find((e) => e.id === state.selectedId);
        const args = {};
        if (!exp) return args;
        for (const p of exp.params || []) {
          const raw = state.paramValues[p.name] ?? '';
          const parsed = parseValue(p.name, raw);
          if (parsed !== undefined) args[p.name] = parsed;
        }
        return args;
      }

      function renderAttachments() {
        els.attachments.innerHTML = '';
        const hint = document.createElement('div');
        hint.className = 'muted';
        hint.textContent = 'Drop file links here to include them in the prompt.';
        if (state.attachments.length === 0) els.attachments.appendChild(hint);

        for (const uri of state.attachments) {
          const row = document.createElement('div');
          row.className = 'attachment-item';
          const code = document.createElement('code');
          code.textContent = uri;
          const remove = document.createElement('button');
          remove.className = 'linkbtn';
          remove.textContent = 'Remove';
          remove.addEventListener('click', () => {
            state.attachments = state.attachments.filter((x) => x !== uri);
            renderAttachments();
            scheduleGenerate();
            schedulePersist();
          });
          row.appendChild(code);
          row.appendChild(remove);
          els.attachments.appendChild(row);
        }
      }

      function renderProcessList() {
        const q = (els.search.value || '').trim().toLowerCase();
        const items = q
          ? state.exports.filter((e) => e.id.toLowerCase().includes(q) || (e.doc || '').toLowerCase().includes(q))
          : state.exports;
        els.select.innerHTML = '';
        for (const e of items) {
          const opt = document.createElement('option');
          opt.value = e.id;
          opt.textContent = \`[\${e.kind}] \${e.exportName} - \${e.modulePath}\`;
          els.select.appendChild(opt);
        }
        els.count.textContent = String(items.length);

        if (!state.selectedId && items.length > 0) {
          state.selectedId = items[0].id;
          els.select.value = state.selectedId;
        } else if (state.selectedId) {
          els.select.value = state.selectedId;
        }
      }

      function renderSelected() {
        const exp = state.exports.find((e) => e.id === state.selectedId);
        if (!exp) {
          els.meta.textContent =
            state.exports.length === 0 ? 'No processes found. Run o init (or add files under .a5c/processes/).' : 'Select a process to start.';
          els.params.innerHTML = '';
          return;
        }

        const metaLines = [];
        metaLines.push(exp.id);
        if (exp.doc) metaLines.push('\\n' + exp.doc);
        if (exp.returnKeys && exp.returnKeys.length) metaLines.push('\\nreturns: ' + exp.returnKeys.join(', '));
        els.meta.textContent = metaLines.join('\\n');

        els.params.innerHTML = '';
        for (const p of exp.params || []) {
          const wrapper = document.createElement('div');
          wrapper.className = 'field';

          const label = document.createElement('div');
          label.className = 'label';
          const left = document.createElement('span');
          left.textContent = p.name;
          const right = document.createElement('span');
          right.className = 'muted';
          right.textContent = stringifyParamLabel(p);
          label.appendChild(left);
          label.appendChild(right);

          const input = document.createElement('textarea');
          input.id = 'param_' + p.name;
          input.placeholder = p.name === 'ctx' ? '{ "domain": "package" }' : '';
          input.value = state.paramValues[p.name] ?? '';
          input.addEventListener('input', () => {
            state.paramValues[p.name] = input.value;
            scheduleGenerate();
            schedulePersist();
          });

          wrapper.appendChild(label);
          wrapper.appendChild(input);
          els.params.appendChild(wrapper);
        }
      }

      function onCatalog(catalog) {
        state.catalog = catalog;
        state.exports = (catalog.exports || []).slice();
        renderProcessList();
        renderSelected();
        renderAttachments();
        scheduleGenerate();
        schedulePersist();
        setStatus(\`Loaded \${state.exports.length} exports (\${catalog.generatedAt}).\`);
        updateActions();
      }

      els.search.addEventListener('input', () => {
        renderProcessList();
      });

      els.select.addEventListener('change', () => {
        state.selectedId = els.select.value;
        state.paramValues = {};
        renderSelected();
        scheduleGenerate();
        schedulePersist();
      });

      els.request.addEventListener('input', () => {
        scheduleGenerate();
        schedulePersist();
      });

      els.output.addEventListener('input', () => {
        updateActions();
      });

      els.attachments.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });
      els.attachments.addEventListener('drop', (e) => {
        e.preventDefault();
        const dt = e.dataTransfer;
        const uriList = (dt && dt.getData && dt.getData('text/uri-list')) || '';
        const plain = (dt && dt.getData && dt.getData('text/plain')) || '';
        const raw = uriList || plain || '';
        if (!raw.trim()) return;
        vscode.postMessage({ type: 'drop', text: raw });
      });

      els.copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(els.output.value || '');
          setStatus('Copied prompt to clipboard.');
        } catch (err) {
          setStatus('Copy failed: ' + (err && err.message ? err.message : String(err)));
        }
      });

      els.insert.addEventListener('click', () => {
        vscode.postMessage({ type: 'insert', text: els.output.value || '' });
      });

      els.dispatch.addEventListener('click', () => {
        vscode.postMessage({ type: 'dispatch', text: els.output.value || '' });
      });

      els.preview.addEventListener('click', () => {
        vscode.postMessage({ type: 'previewPrompt', text: els.output.value || '' });
      });

      els.previewClose.addEventListener('click', () => closePreview());
      els.previewOverlay.addEventListener('click', (e) => {
        if (e.target === els.previewOverlay) closePreview();
      });

      window.addEventListener('message', (event) => {
        const msg = event.data;
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'hydrate') {
          const s = msg.state || {};
          if (typeof s.selectedId === 'string') state.selectedId = s.selectedId;
          if (typeof s.request === 'string') els.request.value = s.request;
          if (Array.isArray(s.attachments)) state.attachments = s.attachments.filter((x) => typeof x === 'string');
          if (s.paramValues && typeof s.paramValues === 'object') {
            const pv = {};
            for (const k of Object.keys(s.paramValues)) {
              const v = s.paramValues[k];
              if (typeof v === 'string') pv[k] = v;
            }
            state.paramValues = pv;
          }
          renderProcessList();
          renderSelected();
          renderAttachments();
          scheduleGenerate();
          schedulePersist();
        }
        if (msg.type === 'attachmentsMerged') {
          const incoming = Array.isArray(msg.items) ? msg.items.filter((x) => typeof x === 'string') : [];
          if (incoming.length === 0) return;
          for (const item of incoming) if (!state.attachments.includes(item)) state.attachments.push(item);
          renderAttachments();
          scheduleGenerate();
          schedulePersist();
        }
        if (msg.type === 'catalog') onCatalog(msg.catalog);
        if (msg.type === 'prompt') {
          state.lastPrompt = msg.text || '';
          els.output.value = state.lastPrompt;
          updateActions();
        }
        if (msg.type === 'promptPreview') {
          openPreview(msg.text || '');
        }
        if (msg.type === 'dispatchPreview') {
          openPreview(msg.text || '');
        }
        if (msg.type === 'status') setStatus(msg.text || '');
      });

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && els.previewOverlay.classList.contains('open')) {
          e.preventDefault();
          closePreview();
          return;
        }
        if (!(e.ctrlKey || e.metaKey)) return;

        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          els.search.focus();
          return;
        }
        if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          els.request.focus();
          return;
        }
        if (e.key === 'Enter' && e.shiftKey) {
          e.preventDefault();
          if (!els.insert.disabled) els.insert.click();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (!els.dispatch.disabled) els.dispatch.click();
          return;
        }
      });

      setStatus('Scanning .a5c/processes...');
      updateActions();
      vscode.postMessage({ type: 'ready' });
    </script>
  </body>
</html>`;
}

export function registerPromptBuilderCommand(context: vscode.ExtensionContext): vscode.Disposable {
  return vscode.commands.registerCommand('babysitter.openPromptBuilder', () =>
    openPromptBuilder(context),
  );
}

let promptBuilderPanel: vscode.WebviewPanel | undefined;

export async function openPromptBuilder(context: vscode.ExtensionContext): Promise<void> {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    await vscode.window.showErrorMessage(
      'Babysitter: open a workspace folder to use the prompt builder.',
    );
    return;
  }

  const processesRootPath = path.join(workspaceRoot, '.a5c', 'processes');
  if (!vscode.workspace.fs) {
    await vscode.window.showErrorMessage('Babysitter: VS Code filesystem APIs unavailable.');
    return;
  }

  if (!promptBuilderPanel) {
    promptBuilderPanel = vscode.window.createWebviewPanel(
      'babysitter.promptBuilder',
      'Babysitter: Prompt Builder',
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true },
    );
    promptBuilderPanel.onDidDispose(
      () => {
        promptBuilderPanel = undefined;
      },
      undefined,
      context.subscriptions,
    );
    promptBuilderPanel.webview.html = htmlForWebview(
      promptBuilderPanel.webview,
      'Babysitter Prompt Builder',
    );

    const bridge = new PromptBuilderBridge({
      webview: promptBuilderPanel.webview,
      workspaceRoot,
      memento: context.workspaceState,
    });

    promptBuilderPanel.webview.onDidReceiveMessage(
      async (msg: unknown) => {
        if (!promptBuilderPanel) return;
        if (!msg || typeof msg !== 'object' || !('type' in msg)) return;
        const typed = msg as { type: string; [key: string]: unknown };

        if (await bridge.handleMessage(msg)) return;

        if (typed.type === 'ready') {
          await bridge.hydrate();
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: 'Babysitter: scanning .a5c/processes...',
            },
            async () => {
              const exists = fsExists(processesRootPath);
              if (!exists) {
                await promptBuilderPanel?.webview.postMessage({
                  type: 'status',
                  text: `Missing ${processesRootPath}. Run \`o init\` or add processes in .a5c/processes/.`,
                });
                await promptBuilderPanel?.webview.postMessage({
                  type: 'catalog',
                  catalog: { version: 1, generatedAt: new Date().toISOString(), exports: [] },
                });
                return;
              }
              const catalog = scanProcessCatalog(processesRootPath);
              await promptBuilderPanel?.webview.postMessage({
                type: 'catalog',
                catalog: toWireCatalog(catalog),
              });
            },
          );
          return;
        }

        if (typed.type === 'generate') {
          const processId = typeof typed.processId === 'string' ? typed.processId : '';
          const args =
            typeof typed.args === 'object' && typed.args !== null
              ? (typed.args as Record<string, unknown>)
              : {};
          const request = typeof typed.request === 'string' ? typed.request : '';
          const attachments = Array.isArray(typed.attachments)
            ? typed.attachments.filter((x): x is string => typeof x === 'string')
            : [];
          const text = buildGuidedPrompt({ processId, args, request, attachments });
          void promptBuilderPanel.webview.postMessage({ type: 'prompt', text });
          return;
        }

        if (typed.type === 'insert') {
          const text = typeof typed.text === 'string' ? typed.text : '';
          const editor = vscode.window.activeTextEditor;
          if (!editor) {
            void promptBuilderPanel.webview.postMessage({
              type: 'status',
              text: 'No active editor to insert into.',
            });
            return;
          }
          await editor.insertSnippet(new vscode.SnippetString(text));
          void promptBuilderPanel.webview.postMessage({
            type: 'status',
            text: 'Inserted prompt into editor.',
          });
          return;
        }

        if (typed.type === 'dispatch') {
          const text = typeof typed.text === 'string' ? typed.text.trim() : '';
          if (!text) {
            void promptBuilderPanel.webview.postMessage({
              type: 'status',
              text: 'Prompt is empty.',
            });
            return;
          }
          await vscode.commands.executeCommand('babysitter.dispatchRun', text);
          void promptBuilderPanel.webview.postMessage({ type: 'status', text: 'Dispatched.' });
          return;
        }
      },
      undefined,
      context.subscriptions,
    );
  }

  promptBuilderPanel.reveal(vscode.ViewColumn.One);
}

function fsExists(p: string): boolean {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}
