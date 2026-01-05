import * as path from 'path';
import * as vscode from 'vscode';

import { JournalTailer } from '../core/journal';
import type { Run } from '../core/run';
import type { RunChangeBatch } from '../core/runFileChanges';
import {
  isFsPathInsideRoot,
  readRunDetailsSnapshot,
  readTextFileWithLimit,
  type RunDetailsSnapshot,
} from '../core/runDetailsSnapshot';
import { WorkSummaryTailSession } from '../core/workSummaryTailSession';
import type { AwaitingInputStatus } from '../core/awaitingInput';

type WebviewInboundMessage =
  | { type: 'ready' }
  | { type: 'refresh' }
  | { type: 'openInEditor'; fsPath: string }
  | { type: 'revealInExplorer'; fsPath: string }
  | { type: 'loadTextFile'; fsPath: string; tail?: boolean }
  | { type: 'copyText'; text: string }
  | { type: 'sendUserInput'; runId: string; text: string }
  | { type: 'sendEnter'; runId: string }
  | { type: 'sendEsc'; runId: string };

type WebviewOutboundMessage =
  | { type: 'snapshot'; snapshot: RunDetailsSnapshot }
  | { type: 'textFile'; fsPath: string; content: string; truncated: boolean; size: number }
  | { type: 'textFileError'; fsPath: string; message: string }
  | { type: 'error'; message: string };

export type RunInteractionController = {
  getAwaitingInput: (runId: string) => AwaitingInputStatus | undefined;
  sendUserInput: (runId: string, text: string) => Promise<boolean> | boolean;
  sendEnter: (runId: string) => Promise<boolean> | boolean;
  sendEsc: (runId: string) => Promise<boolean> | boolean;
  onDidChange: (handler: (runId: string) => void) => vscode.Disposable;
};

function nonce(len = 16): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function renderWebviewHtml(webview: vscode.Webview): string {
  const cspSource = webview.cspSource;
  const scriptNonce = nonce();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https: data:; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${scriptNonce}';" />
  <title>Babysitter Run</title>
  <style>
    :root {
      --pad: 14px;
      --card: var(--vscode-editorWidget-background);
      --border: var(--vscode-editorWidget-border);
      --muted: var(--vscode-descriptionForeground);
      --shadow: rgba(0,0,0,.12);
      --accent: var(--vscode-button-background);
      --accentText: var(--vscode-button-foreground);
    }
    body {
      padding: 0;
      margin: 0;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
    }
    header {
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      padding: var(--pad);
      border-bottom: 1px solid var(--border);
      background: var(--vscode-editor-background);
    }
    .title {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .title h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .subtitle {
      color: var(--muted);
      font-size: 12px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    button {
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--vscode-foreground);
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
    }
    button.primary {
      background: var(--accent);
      color: var(--accentText);
      border-color: transparent;
    }
    main {
      padding: var(--pad);
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--pad);
    }
    .grid2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--pad);
    }
    @media (max-width: 920px) {
      .grid2 { grid-template-columns: 1fr; }
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      box-shadow: 0 1px 0 var(--shadow);
      padding: 12px;
      overflow: hidden;
    }
    .card h2 {
      margin: 0 0 10px 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--vscode-foreground);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .meta {
      display: grid;
      grid-template-columns: 160px 1fr;
      gap: 6px 10px;
      font-size: 12px;
    }
    .key { color: var(--muted); }
    .value {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: var(--vscode-editor-font-family);
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 340px;
      overflow: auto;
      padding-right: 4px;
    }
    .item {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
      justify-content: space-between;
      background: var(--vscode-editor-background);
    }
    .item .left { min-width: 0; flex: 1; }
    .item .name {
      font-size: 12px;
      font-family: var(--vscode-editor-font-family);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item .hint { color: var(--muted); font-size: 11px; margin-top: 2px; }
    .actions { display: flex; gap: 6px; align-items: center; }
    .pill {
      display: inline-flex;
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 1px 8px;
      color: var(--muted);
      font-size: 11px;
    }
    pre {
      margin: 0;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--vscode-textCodeBlock-background);
      overflow: auto;
      max-height: 340px;
      font-size: 11px;
      line-height: 1.4;
      font-family: var(--vscode-editor-font-family);
    }
    .empty { color: var(--muted); font-size: 12px; }
    .banner {
      display: none;
      margin: var(--pad);
      margin-bottom: 0;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--card);
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .banner.show { display: flex; }
    .banner .msg { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .banner.error { border-color: var(--vscode-notificationsErrorIcon-foreground); }
    .spinner {
      width: 14px;
      height: 14px;
      border-radius: 999px;
      border: 2px solid var(--border);
      border-top-color: var(--vscode-progressBar-background);
      animation: spin 1s linear infinite;
      flex: 0 0 auto;
    }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    button:focus-visible, textarea:focus-visible {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }
    textarea {
      width: 100%;
      box-sizing: border-box;
      resize: vertical;
      border-radius: 8px;
      border: 1px solid var(--border);
      padding: 10px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-family: var(--vscode-font-family);
      font-size: 12px;
      line-height: 1.4;
      outline: none;
    }
    textarea:focus {
      border-color: var(--vscode-focusBorder);
    }
  </style>
</head>
<body>
  <header>
    <div class="title">
      <h1 id="runTitle">Babysitter Run</h1>
      <div class="subtitle" id="runSubtitle"></div>
    </div>
    <div class="actions">
      <button id="refreshBtn" class="primary">Refresh</button>
    </div>
  </header>

  <div id="banner" class="banner" role="status" aria-live="polite">
    <div style="display:flex; align-items:center; gap:10px; min-width:0;">
      <div id="bannerSpinner" class="spinner" style="display:none;"></div>
      <div id="bannerMsg" class="msg"></div>
    </div>
    <div class="actions">
      <button id="bannerDismissBtn">Dismiss</button>
    </div>
  </div>

  <main>
    <section class="card" id="interactionCard" style="display:none;">
      <h2>
        Awaiting Input
        <span class="pill" id="interactionSource"></span>
      </h2>
      <div id="interactionPrompt" class="empty" style="margin-bottom: 10px;"></div>
      <textarea id="interactionText" rows="3" placeholder="Type a response / steering instruction..."></textarea>
      <div class="actions" style="justify-content: flex-end; margin-top: 10px;">
        <button id="interactionEscBtn">ESC</button>
        <button id="interactionEnterBtn">Enter</button>
        <button id="interactionSendBtn" class="primary">Send</button>
      </div>
      <div id="interactionHint" class="empty" style="margin-top: 8px;"></div>
    </section>

    <div class="grid2">
      <section class="card">
        <h2>Run</h2>
        <div class="meta" id="runMeta"></div>
      </section>
      <section class="card">
        <h2>State</h2>
        <div id="stateIssues" class="empty" style="margin-bottom: 8px; display:none;"></div>
        <pre id="stateJson">{}</pre>
      </section>
    </div>

    <div class="grid2">
      <section class="card">
        <h2>
          Latest Events
          <span class="pill" id="journalPill"></span>
        </h2>
        <div id="journalErrors" class="empty" style="margin-bottom: 8px; display:none;"></div>
        <pre id="journalJson">[]</pre>
      </section>
      <section class="card">
        <h2>
          Work Summaries
          <span class="pill" id="workPill"></span>
        </h2>
        <div class="list" id="workList"></div>
        <div id="textPreviewCard" style="margin-top: 10px; display:none;">
          <div class="actions" style="justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div class="empty" id="textPreviewTitle" style="margin: 0;"></div>
            <div class="actions" style="justify-content: flex-end;">
              <button id="textPreviewCopy">Copy</button>
              <button id="textPreviewClose">Close</button>
            </div>
          </div>
          <pre id="workPreview"></pre>
        </div>
        <div id="workEmpty" class="empty" style="margin-top: 10px;">No work summaries found.</div>
      </section>
    </div>

    <div class="grid2">
      <section class="card">
        <h2>
          Prompts
          <span class="pill" id="promptPill"></span>
        </h2>
        <div class="list" id="promptList"></div>
        <div id="promptEmpty" class="empty">No prompts found.</div>
      </section>
      <section class="card">
        <h2>
          code/main.js
          <span class="pill" id="mainJsPill"></span>
        </h2>
        <div class="empty" id="mainJsHint" style="margin-bottom: 10px;">Shows the run's process file when present.</div>
        <div class="actions" id="mainJsActions" style="display:none; justify-content: flex-start;">
          <button id="mainJsPreview">Preview</button>
          <button id="mainJsOpen">Open</button>
        </div>
      </section>
    </div>

    <section class="card">
      <h2>
        Artifacts
        <span class="pill" id="artifactsPill"></span>
      </h2>
      <div class="list" id="artifactsList"></div>
      <div id="artifactsEmpty" class="empty">No artifacts found.</div>
    </section>
  </main>

  <script nonce="${scriptNonce}">
    const vscode = acquireVsCodeApi();

    const el = (id) => document.getElementById(id);
    const runTitle = el('runTitle');
    const runSubtitle = el('runSubtitle');
    const runMeta = el('runMeta');
    const stateJson = el('stateJson');
    const stateIssues = el('stateIssues');
    const journalJson = el('journalJson');
    const journalErrors = el('journalErrors');
    const journalPill = el('journalPill');
    const workList = el('workList');
    const textPreviewCard = el('textPreviewCard');
    const textPreviewTitle = el('textPreviewTitle');
    const textPreviewCopy = el('textPreviewCopy');
    const textPreviewClose = el('textPreviewClose');
    const workPreview = el('workPreview');
    const workEmpty = el('workEmpty');
    const workPill = el('workPill');
    const promptList = el('promptList');
    const promptEmpty = el('promptEmpty');
    const promptPill = el('promptPill');
    const mainJsPill = el('mainJsPill');
    const mainJsHint = el('mainJsHint');
    const mainJsActions = el('mainJsActions');
    const mainJsPreview = el('mainJsPreview');
    const mainJsOpen = el('mainJsOpen');
    const artifactsList = el('artifactsList');
    const artifactsEmpty = el('artifactsEmpty');
    const artifactsPill = el('artifactsPill');
    const refreshBtn = el('refreshBtn');
    const interactionCard = el('interactionCard');
    const interactionSource = el('interactionSource');
    const interactionPrompt = el('interactionPrompt');
    const interactionText = el('interactionText');
    const interactionSendBtn = el('interactionSendBtn');
    const interactionEnterBtn = el('interactionEnterBtn');
    const interactionEscBtn = el('interactionEscBtn');
    const interactionHint = el('interactionHint');
    const banner = el('banner');
    const bannerMsg = el('bannerMsg');
    const bannerSpinner = el('bannerSpinner');
    const bannerDismissBtn = el('bannerDismissBtn');

	    let latestRunId = undefined;
	    let latestRunStatus = 'unknown';
	    let awaitingInputVisible = false;
	    let activeWorkPreviewFsPath = '';
	    let activeWorkPreviewContent = '';
	    let activeWorkPreviewTruncated = false;
	    let activeWorkPreviewError = '';
      let activeWorkPreviewAutoScroll = false;

    refreshBtn.addEventListener('click', () => vscode.postMessage({ type: 'refresh' }));
    bannerDismissBtn.addEventListener('click', () => hideBanner());
    textPreviewCopy.addEventListener('click', () => {
      if (!activeWorkPreviewContent) return;
      vscode.postMessage({ type: 'copyText', text: activeWorkPreviewContent });
    });
    textPreviewClose.addEventListener('click', () => {
      activeWorkPreviewFsPath = '';
      activeWorkPreviewContent = '';
      activeWorkPreviewTruncated = false;
      activeWorkPreviewError = '';
      activeWorkPreviewAutoScroll = false;
      renderActiveWorkPreview();
    });

    function showBanner(text, opts) {
      banner.classList.add('show');
      banner.classList.toggle('error', Boolean(opts && opts.error));
      bannerSpinner.style.display = opts && opts.spinner ? '' : 'none';
      bannerMsg.textContent = text || '';
    }

    function hideBanner() {
      banner.classList.remove('show');
      banner.classList.remove('error');
      bannerSpinner.style.display = 'none';
      bannerMsg.textContent = '';
    }

    function postInteraction(type, extra) {
      const runId = latestRunId;
      if (!runId) return;
      vscode.postMessage({ type, runId, ...(extra || {}) });
    }

    interactionSendBtn.addEventListener('click', () => {
      const text = (interactionText.value || '').trim();
      if (!text) return;
      postInteraction('sendUserInput', { text });
      interactionText.value = '';
    });
    interactionEnterBtn.addEventListener('click', () => postInteraction('sendEnter'));
    interactionEscBtn.addEventListener('click', () => postInteraction('sendEsc'));
    interactionText.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        interactionSendBtn.click();
      }
    });

    window.addEventListener('keydown', (e) => {
      const active = document.activeElement;
      const typing = active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT');

      if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        refreshBtn.click();
        return;
      }

      if (!awaitingInputVisible) return;

      if (!typing && e.key === '/') {
        e.preventDefault();
        interactionText.focus();
        return;
      }

      if (!typing && e.key === 'Escape') {
        e.preventDefault();
        interactionEscBtn.click();
        return;
      }

      if (!typing && e.key === 'Enter') {
        e.preventDefault();
        interactionEnterBtn.click();
        return;
      }
    });

	    window.addEventListener('message', (event) => {
	      const msg = event.data;
	      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'snapshot') {
        renderSnapshot(msg.snapshot);
        hideBanner();
        return;
      }
	      if (msg.type === 'textFile') {
	        renderTextFile(msg);
	        return;
	      }
	      if (msg.type === 'textFileError') {
	        renderTextFileError(msg);
	        return;
	      }
	      if (msg.type === 'error') {
	        showBanner(msg.message || 'Error', { error: true });
	      }
	    });

    function addMetaRow(key, value) {
      const k = document.createElement('div');
      k.className = 'key';
      k.textContent = key;
      const v = document.createElement('div');
      v.className = 'value';
      v.textContent = value || '';
      runMeta.appendChild(k);
      runMeta.appendChild(v);
    }

    function formatBytes(bytes) {
      if (bytes == null) return '';
      if (bytes < 1024) return bytes + ' B';
      const kb = bytes / 1024;
      if (kb < 1024) return kb.toFixed(1) + ' KB';
      const mb = kb / 1024;
      if (mb < 1024) return mb.toFixed(1) + ' MB';
      const gb = mb / 1024;
      return gb.toFixed(1) + ' GB';
    }

	    function renderSnapshot(snapshot) {
	      latestRunId = snapshot.run.id;
	      latestRunStatus = snapshot.run.status || 'unknown';
	      runTitle.textContent = snapshot.run.id;
	      runSubtitle.innerHTML = '';
      const status = document.createElement('span');
      status.className = 'pill';
      status.textContent = snapshot.run.status;
      runSubtitle.appendChild(status);
      const updated = document.createElement('span');
      updated.textContent = 'Updated: ' + new Date(snapshot.run.timestamps.updatedAt).toLocaleString();
      runSubtitle.appendChild(updated);

      runMeta.innerHTML = '';
      addMetaRow('Run root', snapshot.run.paths.runRoot);
      addMetaRow('State', snapshot.run.paths.stateJson);
      addMetaRow('Journal', snapshot.run.paths.journalJsonl);
      addMetaRow('Artifacts', snapshot.run.paths.artifactsDir);
      addMetaRow('Work summaries', snapshot.run.paths.workSummariesDir);
      addMetaRow('Created', new Date(snapshot.run.timestamps.createdAt).toLocaleString());

      const issues = snapshot.state.issues || [];
      if (issues.length > 0) {
        stateIssues.style.display = '';
        stateIssues.textContent = issues.map((i) => '[' + i.code + '] ' + i.message).join('  |  ');
      } else {
        stateIssues.style.display = 'none';
        stateIssues.textContent = '';
      }
      stateJson.textContent = JSON.stringify(snapshot.state.state || {}, null, 2);

      const journal = snapshot.journal;
      journalPill.textContent = (journal.entries?.length || 0) + ' entries';
      journalJson.textContent = JSON.stringify(journal.entries || [], null, 2);
      const jErrors = journal.errors || [];
      if (jErrors.length > 0) {
        journalErrors.style.display = '';
        journalErrors.textContent = jErrors.slice(0, 2).map((e) => 'Line ' + e.line + ': ' + e.message).join('  |  ');
      } else {
        journalErrors.style.display = 'none';
        journalErrors.textContent = '';
      }

	      renderWorkSummaries(snapshot.workSummaries || []);
        renderPrompts(snapshot.prompts || []);
        renderMainJs(snapshot.mainJs || null);
	      renderArtifacts(snapshot.artifacts || []);
	      renderInteraction(snapshot.awaitingInput);
	      renderActiveWorkPreview();
	    }

    function renderInteraction(awaitingInput) {
      if (!awaitingInput || awaitingInput.awaiting !== true) {
        awaitingInputVisible = false;
        interactionCard.style.display = 'none';
        interactionSource.textContent = '';
        interactionPrompt.textContent = '';
        interactionHint.textContent = '';
        return;
      }

      awaitingInputVisible = true;
      interactionCard.style.display = '';
      interactionSource.textContent = awaitingInput.source || '';
      interactionPrompt.textContent = awaitingInput.prompt ? awaitingInput.prompt : 'The o process appears to be waiting for input.';
      interactionHint.textContent = 'Shortcuts: Ctrl+Enter to send response, Enter to send Enter, Esc to send ESC, / to focus input.';
    }

	    function renderWorkSummaries(items) {
	      workPill.textContent = items.length + ' files';
	      workList.innerHTML = '';

	      const stillPresent =
	        activeWorkPreviewFsPath && items.some((item) => item && item.fsPath === activeWorkPreviewFsPath);
	      if (activeWorkPreviewFsPath && !stillPresent) {
	        activeWorkPreviewFsPath = '';
	        activeWorkPreviewContent = '';
	        activeWorkPreviewTruncated = false;
	        activeWorkPreviewError = '';
          activeWorkPreviewAutoScroll = false;
	      }

	      if (items.length === 0) {
	        workEmpty.style.display = '';
	        activeWorkPreviewFsPath = '';
	        activeWorkPreviewContent = '';
	        activeWorkPreviewTruncated = false;
	        activeWorkPreviewError = '';
          activeWorkPreviewAutoScroll = false;
	        return;
	      }
	      workEmpty.style.display = 'none';

      for (const item of items) {
        const row = document.createElement('div');
        row.className = 'item';

        const left = document.createElement('div');
        left.className = 'left';

        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = item.relPath;
        left.appendChild(name);

        const hint = document.createElement('div');
        hint.className = 'hint';
        const size = item.size != null ? formatBytes(item.size) : '';
        hint.textContent = [size].filter(Boolean).join(' | ');
        left.appendChild(hint);

        const actions = document.createElement('div');
        actions.className = 'actions';

	        const previewBtn = document.createElement('button');
	        previewBtn.textContent = 'Preview';
	        previewBtn.addEventListener('click', () => {
	          activeWorkPreviewFsPath = item.fsPath;
	          activeWorkPreviewContent = '';
	          activeWorkPreviewTruncated = false;
	          activeWorkPreviewError = '';
            activeWorkPreviewAutoScroll = true;
	          renderActiveWorkPreview();
	          vscode.postMessage({ type: 'loadTextFile', fsPath: item.fsPath, tail: true });
	        });

        const openBtn = document.createElement('button');
        openBtn.textContent = 'Open';
        openBtn.addEventListener('click', () => vscode.postMessage({ type: 'openInEditor', fsPath: item.fsPath }));

        actions.appendChild(previewBtn);
        actions.appendChild(openBtn);

        row.appendChild(left);
        row.appendChild(actions);
        workList.appendChild(row);
      }
    }

    function renderPrompts(items) {
      promptPill.textContent = items.length + ' files';
      promptList.innerHTML = '';

      if (items.length === 0) {
        promptEmpty.style.display = '';
        return;
      }
      promptEmpty.style.display = 'none';

      for (const item of items) {
        const row = document.createElement('div');
        row.className = 'item';

        const left = document.createElement('div');
        left.className = 'left';

        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = item.relPath;
        left.appendChild(name);

        const hint = document.createElement('div');
        hint.className = 'hint';
        const size = item.size != null ? formatBytes(item.size) : '';
        hint.textContent = [size].filter(Boolean).join(' | ');
        left.appendChild(hint);

        const actions = document.createElement('div');
        actions.className = 'actions';

        const previewBtn = document.createElement('button');
        previewBtn.textContent = 'Preview';
        previewBtn.addEventListener('click', () => {
          activeWorkPreviewFsPath = item.fsPath;
          activeWorkPreviewContent = '';
          activeWorkPreviewTruncated = false;
          activeWorkPreviewError = '';
          activeWorkPreviewAutoScroll = false;
          renderActiveWorkPreview();
          vscode.postMessage({ type: 'loadTextFile', fsPath: item.fsPath, tail: false });
        });

        const openBtn = document.createElement('button');
        openBtn.textContent = 'Open';
        openBtn.addEventListener('click', () => vscode.postMessage({ type: 'openInEditor', fsPath: item.fsPath }));

        actions.appendChild(previewBtn);
        actions.appendChild(openBtn);

        row.appendChild(left);
        row.appendChild(actions);
        promptList.appendChild(row);
      }
    }

    function renderMainJs(item) {
      if (!item || !item.fsPath) {
        mainJsPill.textContent = 'Missing';
        mainJsHint.textContent = 'No code/main.js found for this run.';
        mainJsActions.style.display = 'none';
        return;
      }

      mainJsPill.textContent = item.size != null ? formatBytes(item.size) : 'Present';
      mainJsHint.textContent = item.mtimeMs ? 'Updated: ' + new Date(item.mtimeMs).toLocaleString() : '';
      mainJsActions.style.display = '';

      mainJsPreview.onclick = () => {
        activeWorkPreviewFsPath = item.fsPath;
        activeWorkPreviewContent = '';
        activeWorkPreviewTruncated = false;
        activeWorkPreviewError = '';
        activeWorkPreviewAutoScroll = false;
        renderActiveWorkPreview();
        vscode.postMessage({ type: 'loadTextFile', fsPath: item.fsPath, tail: false });
      };

      mainJsOpen.onclick = () => vscode.postMessage({ type: 'openInEditor', fsPath: item.fsPath });
    }

    function renderArtifacts(items) {
      artifactsPill.textContent = items.length + ' items';
      artifactsList.innerHTML = '';

      if (items.length === 0) {
        artifactsEmpty.style.display = '';
        return;
      }
      artifactsEmpty.style.display = 'none';

      for (const item of items) {
        const row = document.createElement('div');
        row.className = 'item';

        const left = document.createElement('div');
        left.className = 'left';

        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = item.relPath + (item.isDirectory ? '/' : '');
        left.appendChild(name);

        const hint = document.createElement('div');
        hint.className = 'hint';
        const size = item.isDirectory ? 'Folder' : (item.size != null ? formatBytes(item.size) : '');
        hint.textContent = size;
        left.appendChild(hint);

        const actions = document.createElement('div');
        actions.className = 'actions';

        const revealBtn = document.createElement('button');
        revealBtn.textContent = 'Reveal';
        revealBtn.addEventListener('click', () => vscode.postMessage({ type: 'revealInExplorer', fsPath: item.fsPath }));
        actions.appendChild(revealBtn);

        if (!item.isDirectory) {
          const openBtn = document.createElement('button');
          openBtn.textContent = 'Open';
          openBtn.addEventListener('click', () => vscode.postMessage({ type: 'openInEditor', fsPath: item.fsPath }));
          actions.appendChild(openBtn);
        }

        row.appendChild(left);
        row.appendChild(actions);
        artifactsList.appendChild(row);
      }
    }

	    function renderTextFile(msg) {
	      if (!msg || typeof msg.content !== 'string') return;
	      activeWorkPreviewFsPath = msg.fsPath || activeWorkPreviewFsPath;
	      activeWorkPreviewContent = msg.content;
	      activeWorkPreviewTruncated = Boolean(msg.truncated);
	      activeWorkPreviewError = '';
	      renderActiveWorkPreview();
	    }

	    function renderTextFileError(msg) {
	      if (!msg || typeof msg.message !== 'string') return;
	      activeWorkPreviewFsPath = msg.fsPath || activeWorkPreviewFsPath;
	      activeWorkPreviewError = msg.message;
	      activeWorkPreviewContent = '';
	      activeWorkPreviewTruncated = false;
	      renderActiveWorkPreview();
	    }

	    function renderActiveWorkPreview() {
	      if (!activeWorkPreviewFsPath) {
          textPreviewCard.style.display = 'none';
	        workPreview.textContent = '';
	        return;
	      }

        textPreviewCard.style.display = '';
        textPreviewTitle.textContent =
          pathBasename(activeWorkPreviewFsPath) + (activeWorkPreviewAutoScroll ? ' (tailing)' : '');

	      if (activeWorkPreviewError) {
	        workPreview.textContent = 'Error loading work summary preview: ' + activeWorkPreviewError;
	        workPreview.scrollTop = 0;
	        return;
	      }

	      if (!activeWorkPreviewContent) {
	        if (latestRunStatus && latestRunStatus !== 'running' && latestRunStatus !== 'paused') {
	          workPreview.textContent = 'No work summary output. Run finished.';
	        } else {
	          workPreview.textContent = 'No work summary output yet.';
	        }
	        workPreview.scrollTop = 0;
	        return;
	      }

	      const suffixTruncated = activeWorkPreviewTruncated ? '\\n\\n(truncated)' : '';
	      const suffixDone =
	        latestRunStatus && latestRunStatus !== 'running' && latestRunStatus !== 'paused'
	          ? '\\n\\n(Run finished)'
	          : '';
	      workPreview.textContent = activeWorkPreviewContent + suffixTruncated + suffixDone;
        if (activeWorkPreviewAutoScroll) workPreview.scrollTop = workPreview.scrollHeight;
        else workPreview.scrollTop = 0;
	    }

      function pathBasename(fsPath) {
        if (!fsPath) return '';
        const parts = String(fsPath).split(/[/\\\\]+/);
        return parts[parts.length - 1] || fsPath;
      }

    showBanner('Loading run details...', { spinner: true });
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}

class RunDetailsPanel {
  private readonly panel: vscode.WebviewPanel;
  private readonly run: Run;
  private readonly journalTailer = new JournalTailer();
  private journalEntries: unknown[] = [];
  private readonly interaction: RunInteractionController | undefined;
  private readonly workSummaryTailSession = new WorkSummaryTailSession({
    maxBytes: 200_000,
    maxChars: 200_000,
  });
  private activeTextTailFsPath: string | undefined;

  private readonly disposables: vscode.Disposable[] = [];

  constructor(params: {
    extensionUri: vscode.Uri;
    run: Run;
    onDisposed: () => void;
    interaction?: RunInteractionController;
  }) {
    this.run = params.run;
    this.interaction = params.interaction;
    this.panel = vscode.window.createWebviewPanel(
      'babysitter.runDetails',
      `Run ${params.run.id}`,
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [params.extensionUri],
      },
    );

    this.panel.webview.html = renderWebviewHtml(this.panel.webview);

    this.disposables.push(
      this.panel.onDidDispose(() => {
        params.onDisposed();
        this.dispose();
      }),
      this.panel.webview.onDidReceiveMessage((msg: WebviewInboundMessage) => {
        void this.onMessage(msg);
      }),
    );
  }

  reveal(): void {
    this.panel.reveal(vscode.ViewColumn.Active);
  }

  dispose(): void {
    for (const d of this.disposables.splice(0)) d.dispose();
  }

  private async onMessage(msg: WebviewInboundMessage): Promise<void> {
    if (!msg || typeof msg !== 'object') return;
    switch (msg.type) {
      case 'ready':
      case 'refresh':
        await this.refresh();
        return;
      case 'openInEditor':
        await this.openInEditor(msg.fsPath);
        return;
      case 'revealInExplorer':
        await this.revealInExplorer(msg.fsPath);
        return;
      case 'loadTextFile':
        await this.loadTextFile(msg.fsPath, msg.tail ?? true);
        return;
      case 'copyText':
        await this.copyText(msg.text);
        return;
      case 'sendUserInput':
        await this.sendUserInput(msg.runId, msg.text);
        return;
      case 'sendEnter':
        await this.sendEnter(msg.runId);
        return;
      case 'sendEsc':
        await this.sendEsc(msg.runId);
        return;
      default:
        return;
    }
  }

  private async post(message: WebviewOutboundMessage): Promise<void> {
    try {
      await this.panel.webview.postMessage(message);
    } catch {
      // ignore
    }
  }

  async refresh(): Promise<void> {
    try {
      const { snapshot, nextJournalEntries } = readRunDetailsSnapshot({
        run: this.run,
        journalTailer: this.journalTailer,
        existingJournalEntries: this.journalEntries,
        maxJournalEntries: 30,
        maxArtifacts: 500,
        maxWorkSummaries: 50,
        maxPrompts: 50,
      });
      this.journalEntries = nextJournalEntries;
      const processAwaiting = this.interaction?.getAwaitingInput(this.run.id);
      if (processAwaiting) snapshot.awaitingInput = processAwaiting;
      await this.post({ type: 'snapshot', snapshot });

      if (this.activeTextTailFsPath) {
        const update = this.workSummaryTailSession.poll();
        if (update?.type === 'set') {
          await this.post({
            type: 'textFile',
            fsPath: update.fsPath,
            content: update.content,
            truncated: update.truncated,
            size: update.size,
          });
        } else if (update?.type === 'error') {
          await this.post({ type: 'textFileError', fsPath: update.fsPath, message: update.message });
          this.activeTextTailFsPath = undefined;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.post({ type: 'error', message: `Failed to refresh run details: ${message}` });
    }
  }

  private async sendUserInput(runId: string, text: string): Promise<void> {
    if (!this.interaction) {
      await this.post({
        type: 'error',
        message: 'No interactive `o` process is available to send input.',
      });
      return;
    }
    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (!trimmed) return;
    const ok = await this.interaction.sendUserInput(runId, trimmed);
    if (!ok)
      await this.post({
        type: 'error',
        message: 'Could not send input: no associated `o` process.',
      });
  }

  private async sendEnter(runId: string): Promise<void> {
    if (!this.interaction) {
      await this.post({
        type: 'error',
        message: 'No interactive `o` process is available to send Enter.',
      });
      return;
    }
    const ok = await this.interaction.sendEnter(runId);
    if (!ok)
      await this.post({
        type: 'error',
        message: 'Could not send Enter: no associated `o` process.',
      });
  }

  private async sendEsc(runId: string): Promise<void> {
    if (!this.interaction) {
      await this.post({
        type: 'error',
        message: 'No interactive `o` process is available to send ESC.',
      });
      return;
    }
    const ok = await this.interaction.sendEsc(runId);
    if (!ok)
      await this.post({ type: 'error', message: 'Could not send ESC: no associated `o` process.' });
  }

  private async openInEditor(fsPath: string): Promise<void> {
    if (!isFsPathInsideRoot(this.run.paths.runRoot, fsPath)) {
      await this.post({
        type: 'error',
        message: 'Refusing to open a file outside the run directory.',
      });
      return;
    }
    try {
      await vscode.window.showTextDocument(vscode.Uri.file(fsPath), { preview: true });
    } catch {
      await this.post({ type: 'error', message: `Could not open: ${path.basename(fsPath)}` });
    }
  }

  private async revealInExplorer(fsPath: string): Promise<void> {
    if (!isFsPathInsideRoot(this.run.paths.runRoot, fsPath)) return;
    await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(fsPath));
  }

  private async loadTextFile(fsPath: string, tail: boolean): Promise<void> {
    if (!isFsPathInsideRoot(this.run.paths.runRoot, fsPath)) return;

    if (!tail) {
      this.activeTextTailFsPath = undefined;
      try {
        const res = readTextFileWithLimit(fsPath, 200_000);
        await this.post({
          type: 'textFile',
          fsPath,
          content: res.content,
          truncated: res.truncated,
          size: res.size,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await this.post({ type: 'textFileError', fsPath, message });
      }
      return;
    }

    this.activeTextTailFsPath = fsPath;
    const res = this.workSummaryTailSession.start(fsPath);
    if (res.type === 'set') {
      await this.post({ type: 'textFile', fsPath, content: res.content, truncated: res.truncated, size: res.size });
      return;
    }

    await this.post({ type: 'textFileError', fsPath, message: res.message });
  }

  private async copyText(text: string): Promise<void> {
    const value = typeof text === 'string' ? text : '';
    if (!value) return;
    try {
      await vscode.env.clipboard.writeText(value);
      vscode.window.setStatusBarMessage('Babysitter: copied to clipboard', 2000);
    } catch {
      // ignore
    }
  }
}

export function createRunDetailsViewManager(
  context: vscode.ExtensionContext,
  params?: { interaction?: RunInteractionController },
): {
  open: (run: Run) => Promise<void>;
  onRunChangeBatch: (batch: RunChangeBatch) => void;
} {
  const panelsByRunId = new Map<string, RunDetailsPanel>();
  const interaction = params?.interaction;

  if (interaction) {
    context.subscriptions.push(
      interaction.onDidChange((runId) => {
        const panel = panelsByRunId.get(runId);
        if (panel) void panel.refresh();
      }),
    );
  }

  const open = async (run: Run): Promise<void> => {
    const existing = panelsByRunId.get(run.id);
    if (existing) {
      existing.reveal();
      await existing.refresh();
      return;
    }

    const panel = new RunDetailsPanel({
      extensionUri: context.extensionUri,
      run,
      onDisposed: () => {
        panelsByRunId.delete(run.id);
      },
      ...(interaction ? { interaction } : {}),
    });
    panelsByRunId.set(run.id, panel);
    context.subscriptions.push(panel);
    await panel.refresh();
  };

  const onRunChangeBatch = (batch: RunChangeBatch): void => {
    for (const runId of batch.runIds) {
      const panel = panelsByRunId.get(runId);
      if (panel) void panel.refresh();
    }
  };

  return { open, onRunChangeBatch };
}
