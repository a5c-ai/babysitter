import * as fs from 'fs';
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
import {
  DEFAULT_MAX_COPY_CONTENTS_BYTES,
  readFileContentsForClipboard,
} from '../core/copyFileContents';
import { WorkSummaryTailSession } from '../core/workSummaryTailSession';
import type { AwaitingInputStatus } from '../core/awaitingInput';
import {
  computeKeyFilesGroupForRelPath,
  computeKeyFilesModel,
  getPinnedIdsForRun,
  groupKeyFiles,
  groupOrderIndex,
  matchesKeyFilesFilter,
  normalizePinnedIdsByRunId,
  togglePinnedId,
  setPinnedIdsForRun,
} from './keyFilesModel';

type WebviewInboundMessage =
  | { type: 'ready' }
  | { type: 'refresh' }
  | { type: 'openInEditor'; fsPath: string }
  | { type: 'openResolvedImport'; fromFsPath: string; specifier: string }
  | { type: 'revealInExplorer'; fsPath: string }
  | { type: 'saveFileAs'; fsPath: string }
  | { type: 'loadTextFile'; fsPath: string; tail?: boolean }
  | { type: 'copyText'; text: string }
  | { type: 'copyFileContents'; fsPath: string }
  | { type: 'sendUserInput'; runId: string; text: string }
  | { type: 'sendEnter'; runId: string }
  | { type: 'sendEsc'; runId: string };

type WebviewOutboundMessage =
  | { type: 'snapshot'; snapshot: RunDetailsSnapshot }
  | { type: 'textFile'; fsPath: string; content: string; truncated: boolean; size: number }
  | { type: 'textFileError'; fsPath: string; message: string }
  | { type: 'oInfo'; pid: number | null; label: string | null }
  | { type: 'oOutputSet'; text: string }
  | { type: 'oOutputAppend'; text: string }
  | { type: 'error'; message: string };

export type RunInteractionController = {
  getAwaitingInput: (runId: string) => AwaitingInputStatus | undefined;
  getPidForRunId?: (runId: string) => number | undefined;
  getLabelForRunId?: (runId: string) => string | undefined;
  getOutputTailForRunId?: (runId: string) => string | undefined;
  sendUserInput: (runId: string, text: string) => Promise<boolean> | boolean;
  sendEnter: (runId: string) => Promise<boolean> | boolean;
  sendEsc: (runId: string) => Promise<boolean> | boolean;
  onDidChange: (handler: (runId: string) => void) => vscode.Disposable;
  onDidOutput?: (handler: (event: { runId: string; chunk: string }) => void) => vscode.Disposable;
};

function nonce(len = 16): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function renderWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const cspSource = webview.cspSource;
  const scriptNonce = nonce();
  const mermaidScriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js'),
  );
  const keyFilesHelpersJs = [
    computeKeyFilesGroupForRelPath,
    groupOrderIndex,
    matchesKeyFilesFilter,
    normalizePinnedIdsByRunId,
    getPinnedIdsForRun,
    togglePinnedId,
    setPinnedIdsForRun,
    groupKeyFiles,
    computeKeyFilesModel,
  ]
    .map((fn) => fn.toString())
    .join('\n\n');

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
    button:focus-visible, textarea:focus-visible, input:focus-visible, .item[role="button"]:focus-visible {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: 2px;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    .md {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
      background: var(--vscode-editor-background);
      color: var(--vscode-foreground);
      font-size: 12px;
      line-height: 1.5;
      max-height: 320px;
      overflow: auto;
      box-sizing: border-box;
    }
    .md h1, .md h2, .md h3, .md h4, .md h5, .md h6 {
      margin: 10px 0 6px;
      font-weight: 600;
    }
    .md h1 { font-size: 15px; }
    .md h2 { font-size: 14px; }
    .md h3 { font-size: 13px; }
    .md pre {
      background: var(--vscode-textBlockQuote-background);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 8px;
      overflow: auto;
      margin: 8px 0;
    }
	    .md code {
	      font-family: var(--vscode-editor-font-family);
	      font-size: 12px;
	    }
      .md .mermaid {
        overflow: auto;
        padding: 6px 0;
      }
	    .md .md-li { margin: 2px 0; }
	    .md .md-blank { height: 8px; }
	    .md .md-p { margin: 2px 0; }
    .evtable {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .evtable th, .evtable td {
      border: 1px solid var(--border);
      padding: 6px 8px;
      vertical-align: top;
    }
    .evtable th {
      text-align: left;
      font-weight: 600;
      background: var(--card);
      position: sticky;
      top: 0;
      z-index: 1;
    }
	    .evtable code {
	      font-family: var(--vscode-editor-font-family);
	      font-size: 12px;
	      white-space: pre-wrap;
	      word-break: break-word;
	    }
	    .codepre {
	      font-family: var(--vscode-editor-font-family);
	      font-size: 12px;
	      line-height: 1.35;
	      tab-size: 2;
	      white-space: pre;
	    }
	    .codepre .tok-kw { color: var(--vscode-symbolIcon-keywordForeground, #c586c0); }
	    .codepre .tok-str { color: var(--vscode-symbolIcon-stringForeground, #ce9178); }
	    .codepre .tok-com { color: var(--vscode-descriptionForeground, #6a9955); }
	    .codepre .tok-num { color: var(--vscode-symbolIcon-numberForeground, #b5cea8); }
	    .codepre .tok-id { color: inherit; }
	    .codepre .tok-pun { color: var(--vscode-descriptionForeground, #808080); }
	    .codepre a.tok-link { color: var(--vscode-textLink-foreground); text-decoration: underline; cursor: pointer; }
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
    input[type="text"] {
      width: 100%;
      box-sizing: border-box;
      border-radius: 8px;
      border: 1px solid var(--border);
      padding: 8px 10px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-family: var(--vscode-font-family);
      font-size: 12px;
      line-height: 1.4;
      outline: none;
    }
    input[type="text"]:focus {
      border-color: var(--vscode-focusBorder);
    }
    .keyfiles-head {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 10px;
    }
    .keyfiles-sections {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .keyfiles-section-title {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.02em;
      text-transform: uppercase;
      margin: 0 0 6px 0;
    }
    .keyfiles-groups {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .keyfiles-group-label {
      font-size: 11px;
      color: var(--muted);
      margin: 6px 0 -2px 0;
    }
	    .keyfiles-scroll {
	      max-height: min(420px, 45vh);
	      min-height: 120px;
	      overflow: auto;
	      padding-right: 4px;
	    }
    .item[role="button"] {
      cursor: pointer;
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

      <section class="card" id="oDispatchCard" style="display:none;">
        <h2>
          o Process
          <span class="pill" id="oPidPill"></span>
        </h2>
        <div class="meta" id="oMeta"></div>
        <div class="actions" style="justify-content:flex-end; margin-top: 10px;">
          <button id="oCopyBtn">Copy output</button>
        </div>
        <pre id="oOutputPre" style="max-height: 220px; overflow: auto; margin: 10px 0 0 0;"></pre>
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
          <div id="journalDebug" class="empty" style="margin-bottom: 8px; display:none;"></div>
	        <table class="evtable" id="journalTable">
	          <thead>
	            <tr>
	              <th style="width: 190px;">Time</th>
              <th style="width: 170px;">Event</th>
              <th style="width: 70px;">Id</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody id="journalBody"></tbody>
        </table>
      </section>
      <section class="card">
        <h2>
          Work Summaries
          <span class="pill" id="workPill"></span>
          <label class="pill" style="display:inline-flex; gap:6px; align-items:center; margin-left: 8px; cursor:pointer;">
            <input id="tailLatestWork" type="checkbox" style="margin:0;" />
            Tail latest
          </label>
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
          <div id="workPreviewHtml" class="md" style="display:none;"></div>
          <pre id="workPreview"></pre>
        </div>
        <div id="workEmpty" class="empty" style="margin-top: 10px;">No work summaries found.</div>
      </section>
    </div>

    <section class="card" id="keyFilesCard">
      <h2>
        Key files
        <span class="pill" id="keyFilesPill"></span>
	      </h2>
	      <div class="keyfiles-head">
	        <label for="keyFilesFilter" class="sr-only">Filter key files</label>
	        <input id="keyFilesFilter" type="text" placeholder="Filter files by substring..." aria-label="Filter key files by substring" />
	      </div>
      <div class="keyfiles-sections">
        <div id="keyFilesPinnedWrap" style="display:none;">
          <div class="keyfiles-section-title">Pinned</div>
          <div class="keyfiles-groups" id="keyFilesPinned"></div>
        </div>
        <div id="keyFilesImportantWrap" style="display:none;">
          <div class="keyfiles-section-title">Important</div>
          <div class="keyfiles-groups" id="keyFilesImportant"></div>
        </div>
        <div id="keyFilesAllWrap" style="display:none;">
          <div class="keyfiles-section-title">All files</div>
          <div class="keyfiles-scroll" id="keyFilesAll"></div>
        </div>
      </div>
      <div id="keyFilesEmpty" class="empty" style="display:none; margin-top: 10px;"></div>
      <div class="actions" id="keyFilesEmptyActions" style="display:none; justify-content: flex-start; margin-top: 10px;">
        <button id="keyFilesRevealRun">Reveal run folder</button>
        <button id="keyFilesCopyRun">Copy run path</button>
      </div>
    </section>

    <div class="grid2">
      <section class="card" id="processCard">
        <h2>Process</h2>

        <div class="actions" style="justify-content: flex-start; margin-bottom: 8px; gap: 8px; flex-wrap: wrap;">
          <span class="pill" id="processMdPill">process.md</span>
          <button id="processMdOpen" style="display:none;">Open</button>
        </div>
        <div id="processMdPreview" class="md">No process.md found.</div>

        <div class="actions" style="justify-content: flex-start; margin-top: 12px; margin-bottom: 8px; gap: 8px; flex-wrap: wrap;">
          <span class="pill" id="processMermaidPill">process.mermaid.md</span>
          <button id="processMermaidOpen" style="display:none;">Open</button>
        </div>
        <div id="processMermaidPreview" class="md">No process.mermaid.md found.</div>
      </section>

      <section class="card" id="mainJsCard">
        <h2>
          code/main.js
          <span class="pill" id="mainJsPill"></span>
        </h2>
	        <div class="empty" id="mainJsHint" style="margin-bottom: 10px;"></div>
	        <div class="actions" id="mainJsActions" style="display:none; justify-content: flex-start;">
	          <button id="mainJsPreview">Preview</button>
	          <button id="mainJsOpen">Open</button>
	          <button id="mainJsSaveAs">Save as...</button>
	        </div>
	        <pre id="mainJsPreviewPre" class="codepre" style="max-height: 320px; overflow: auto; margin: 0;"></pre>
      </section>
    </div>

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
        Artifacts
        <span class="pill" id="artifactsPill"></span>
      </h2>
      <div class="list" id="artifactsList"></div>
      <div id="artifactsEmpty" class="empty">No artifacts found.</div>
    </section>
  </main>

    <script nonce="${scriptNonce}" src="${mermaidScriptUri.toString()}"></script>
	  <script nonce="${scriptNonce}">
	    const vscode = acquireVsCodeApi();

    ${keyFilesHelpersJs}

    const el = (id) => document.getElementById(id);
    const runTitle = el('runTitle');
    const runSubtitle = el('runSubtitle');
    const runMeta = el('runMeta');
    const stateJson = el('stateJson');
    const stateIssues = el('stateIssues');
	    const journalErrors = el('journalErrors');
      const journalDebug = el('journalDebug');
	    const journalPill = el('journalPill');
	    const journalTable = el('journalTable');
	    const journalBody = el('journalBody');
    const workList = el('workList');
    const textPreviewCard = el('textPreviewCard');
    const textPreviewTitle = el('textPreviewTitle');
    const textPreviewCopy = el('textPreviewCopy');
    const textPreviewClose = el('textPreviewClose');
    const workPreview = el('workPreview');
    const workPreviewHtml = el('workPreviewHtml');
    const workEmpty = el('workEmpty');
    const workPill = el('workPill');
    const tailLatestWork = el('tailLatestWork');
    const promptList = el('promptList');
    const promptEmpty = el('promptEmpty');
    const promptPill = el('promptPill');
    const processMdPill = el('processMdPill');
    const processMdOpen = el('processMdOpen');
    const processMdPreview = el('processMdPreview');
	    const processMermaidPill = el('processMermaidPill');
	    const processMermaidOpen = el('processMermaidOpen');
	    const processMermaidPreview = el('processMermaidPreview');
	    const mainJsPreview = el('mainJsPreview');
    const mainJsPill = el('mainJsPill');
    const mainJsHint = el('mainJsHint');
    const mainJsActions = el('mainJsActions');
    const mainJsOpen = el('mainJsOpen');
    const mainJsSaveAs = el('mainJsSaveAs');
    const mainJsPreviewPre = el('mainJsPreviewPre');
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
      const oDispatchCard = el('oDispatchCard');
      const oPidPill = el('oPidPill');
      const oMeta = el('oMeta');
      const oCopyBtn = el('oCopyBtn');
      const oOutputPre = el('oOutputPre');
	    const banner = el('banner');
	    const bannerMsg = el('bannerMsg');
	    const bannerSpinner = el('bannerSpinner');
	    const bannerDismissBtn = el('bannerDismissBtn');
    const keyFilesPill = el('keyFilesPill');
    const keyFilesFilter = el('keyFilesFilter');
    const keyFilesPinnedWrap = el('keyFilesPinnedWrap');
    const keyFilesPinned = el('keyFilesPinned');
    const keyFilesImportantWrap = el('keyFilesImportantWrap');
    const keyFilesImportant = el('keyFilesImportant');
    const keyFilesAllWrap = el('keyFilesAllWrap');
    const keyFilesAll = el('keyFilesAll');
    const keyFilesEmpty = el('keyFilesEmpty');
    const keyFilesEmptyActions = el('keyFilesEmptyActions');
    const keyFilesRevealRun = el('keyFilesRevealRun');
    const keyFilesCopyRun = el('keyFilesCopyRun');

	    let latestRunId = undefined;
	    let latestRunStatus = 'unknown';
      let latestSnapshot = undefined;
	    let awaitingInputVisible = false;
	    let activeWorkPreviewFsPath = '';
	    let activeWorkPreviewContent = '';
      let activeWorkPreviewTruncated = false;
      let activeWorkPreviewError = '';
      let activeWorkPreviewAutoScroll = false;
      let activeWorkPreviewMode = 'plain'; // 'plain' | 'markdown' | 'code'
      let activeWorkPreviewKind = ''; // '' | 'workTail' | 'filePreview'
      const textFileCache = new Map(); // fsPath -> { content?: string, truncated?: boolean, size?: number, mtimeMs?: number, error?: string }
      let processMdTarget = null;
      let processMermaidTarget = null;
      let mainJsTarget = null;
      let tailLatestWorkEnabled = false;
	      let keyFilesFilterValue = '';
		      let pinnedIdsByRunId = {};
		      let keyFilesRenderHandle = 0;
          let oPid = null;
          let oLabel = null;
          let oOutputText = '';

	      const initialState = vscode.getState() || {};
	      if (initialState && typeof initialState === 'object') {
	        pinnedIdsByRunId = normalizePinnedIdsByRunId(initialState.pinnedIdsByRunId);
          tailLatestWorkEnabled = Boolean(initialState.tailLatestWorkEnabled);
	      }
      tailLatestWork.checked = tailLatestWorkEnabled;
      tailLatestWork.addEventListener('change', () => {
        tailLatestWorkEnabled = Boolean(tailLatestWork.checked);
        persistViewState();
        if (latestSnapshot) renderWorkSummaries(latestSnapshot.workSummaries || []);
      });

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
	      activeWorkPreviewKind = '';
	      renderActiveWorkPreview();
	    });

      mainJsPreviewPre.addEventListener('click', (e) => {
        const target = e && e.target && e.target.closest ? e.target.closest('a.tok-link') : null;
        if (!target || !target.dataset) return;
        const specEnc = target.dataset.spec || '';
        const spec = specEnc ? decodeURIComponent(specEnc) : '';
        if (!spec || !mainJsTarget || !mainJsTarget.fsPath) return;
        vscode.postMessage({ type: 'openResolvedImport', fromFsPath: mainJsTarget.fsPath, specifier: spec });
      });

      oCopyBtn.addEventListener('click', () => {
        if (!oOutputText) return;
        vscode.postMessage({ type: 'copyText', text: oOutputText });
      });

	    keyFilesFilter.addEventListener('input', () => {
	      const next = (keyFilesFilter.value || '').toString();
	      if (next === keyFilesFilterValue) return;
	      keyFilesFilterValue = next;
	      scheduleRenderKeyFiles();
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
        if (msg.type === 'oInfo') {
          oPid = typeof msg.pid === 'number' ? msg.pid : null;
          oLabel = typeof msg.label === 'string' ? msg.label : null;
          renderOProcess();
          return;
        }
        if (msg.type === 'oOutputSet') {
          oOutputText = typeof msg.text === 'string' ? msg.text : '';
          if (oOutputText.length > 200_000) oOutputText = oOutputText.slice(-200_000);
          renderOProcess();
          return;
        }
	        if (msg.type === 'oOutputAppend') {
	          const chunk = typeof msg.text === 'string' ? msg.text : '';
	          if (chunk) {
	            oOutputText = '' + oOutputText + chunk;
	            if (oOutputText.length > 200_000) oOutputText = oOutputText.slice(-200_000);
	            renderOProcess();
	          }
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
	      addMetaRowTo(runMeta, key, value);
	    }

      function addMetaRowTo(container, key, value) {
        if (!container) return;
        const k = document.createElement('div');
        k.className = 'key';
        k.textContent = key;
        const v = document.createElement('div');
        v.className = 'value';
        v.textContent = value || '';
        container.appendChild(k);
        container.appendChild(v);
      }

      function renderOProcess() {
        const hasPid = typeof oPid === 'number' && isFinite(oPid);
        oDispatchCard.style.display = hasPid ? '' : 'none';
        oPidPill.textContent = hasPid ? 'pid ' + String(oPid) : '';
        oMeta.innerHTML = '';
        if (hasPid) {
          addMetaRowTo(oMeta, 'Label', oLabel || '');
          addMetaRowTo(oMeta, 'PID', String(oPid));
        }
        oOutputPre.textContent = oOutputText || '';
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
	        latestSnapshot = snapshot;
          oPid = null;
          oLabel = null;
          oOutputText = '';
          renderOProcess();
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
	      const journalCount = journal.entries?.length || 0;
	      const renderedCount = renderJournalTable(journal.entries || []);
	      journalPill.textContent =
          journalCount + ' entries' + (renderedCount !== journalCount ? ' (rendered ' + renderedCount + ')' : '');
        if (journalDebug) {
          if (journalCount > 0 && renderedCount === 0) {
            const first = journal.entries && journal.entries.length > 0 ? journal.entries[0] : null;
            journalDebug.textContent =
              'Entries exist but rendered 0. First entry keys: ' +
              (first && typeof first === 'object' ? Object.keys(first).join(', ') : typeof first);
            journalDebug.style.display = '';
          } else {
            journalDebug.textContent = '';
            journalDebug.style.display = 'none';
          }
        }
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
        renderPinnedPreviews(snapshot);
	      renderArtifacts(snapshot.artifacts || []);
	      renderInteraction(snapshot.awaitingInput);
        renderKeyFiles(snapshot);
	      renderActiveWorkPreview();
	    }

	      function scheduleRenderKeyFiles() {
	        if (!latestSnapshot) return;
	        if (keyFilesRenderHandle) cancelAnimationFrame(keyFilesRenderHandle);
	        keyFilesRenderHandle = requestAnimationFrame(() => {
	          keyFilesRenderHandle = 0;
	          renderKeyFiles(latestSnapshot);
	        });
	      }

	      function persistViewState() {
	        const nextState = { ...(vscode.getState() || {}), pinnedIdsByRunId, tailLatestWorkEnabled };
	        vscode.setState(nextState);
	      }

	      function persistPinnedIdsByRunId() {
	        persistViewState();
	      }

	      function setPinnedIds(runId, ids) {
	        pinnedIdsByRunId = setPinnedIdsForRun(pinnedIdsByRunId, runId, Array.isArray(ids) ? ids : []);
	        persistPinnedIdsByRunId();
	      }

	      function togglePinned(runId, fileId) {
	        const current = getPinnedIdsForRun(pinnedIdsByRunId, runId);
	        const next = togglePinnedId(current, fileId);
	        setPinnedIds(runId, next);
	        scheduleRenderKeyFiles();
	      }

      function formatMtime(mtimeMs) {
	        if (mtimeMs == null) return '';
	        try {
	          return new Date(mtimeMs).toLocaleString();
	        } catch {
	          return '';
	        }
	      }

	      function setButtonEnabled(button, enabled) {
	        button.disabled = !enabled;
	        button.setAttribute('aria-disabled', enabled ? 'false' : 'true');
	      }

	      function renderKeyFiles(snapshot) {
	        const model = computeKeyFilesModel({
	          snapshot,
	          filterValue: keyFilesFilterValue,
	          pinnedIdsByRunId,
	        });

	        if (model.nextPinnedIds && model.runId) {
	          setPinnedIds(model.runId, model.nextPinnedIds);
	        }

	        const runId = model.runId;
	        const runRoot = model.runRoot;
	        const pinnedIds = getPinnedIdsForRun(pinnedIdsByRunId, runId);
	        const pinnedSet = new Set(pinnedIds);

	        keyFilesPill.textContent = model.pillText || '';

	        keyFilesPinned.innerHTML = '';
	        keyFilesImportant.innerHTML = '';
	        keyFilesAll.innerHTML = '';
	        keyFilesEmpty.style.display = 'none';
	        keyFilesEmpty.textContent = '';
	        keyFilesEmptyActions.style.display = 'none';
	        keyFilesRevealRun.onclick = null;
	        keyFilesCopyRun.onclick = null;

	        if (model.emptyMessage) {
	          keyFilesPinnedWrap.style.display = 'none';
	          keyFilesImportantWrap.style.display = 'none';
	          keyFilesAllWrap.style.display = 'none';
	          keyFilesEmpty.style.display = '';
	          keyFilesEmpty.textContent = model.emptyMessage;

	          if (model.showRunActions) {
	            keyFilesEmptyActions.style.display = '';
	            setButtonEnabled(keyFilesRevealRun, model.canRevealRunRoot);
	            setButtonEnabled(keyFilesCopyRun, model.canCopyRunRoot);
              keyFilesRevealRun.title = 'Reveal the run folder in your OS';
              keyFilesCopyRun.title = 'Copy the run folder path';
	            if (model.canRevealRunRoot) {
	              keyFilesRevealRun.onclick = () => vscode.postMessage({ type: 'revealInExplorer', fsPath: runRoot });
	            }
	            if (model.canCopyRunRoot) {
	              keyFilesCopyRun.onclick = () => vscode.postMessage({ type: 'copyText', text: runRoot });
	            }
	          }
	          return;
	        }

	        const COPY_CONTENTS_MAX_BYTES = 1000000;
	        const BINARY_EXTS = new Set([
	          'png',
	          'jpg',
	          'jpeg',
	          'gif',
	          'webp',
	          'bmp',
	          'ico',
	          'pdf',
	          'zip',
	          'gz',
	          'tgz',
	          'tar',
	          '7z',
	          'rar',
	          'jar',
	          'exe',
	          'dll',
	          'so',
	          'dylib',
	          'wasm',
	          'class',
	          'bin',
	          'dat',
	        ]);
	        const extOf = (p) => {
	          const s = (p || '').toString();
	          const idx = s.lastIndexOf('.');
	          if (idx === -1) return '';
	          return s.slice(idx + 1).toLowerCase();
	        };

	        function appendRow(container, item) {
	          const fsPath = item && typeof item.fsPath === 'string' ? item.fsPath : '';
	          const canCopy = Boolean(fsPath);
	          const canReveal = Boolean(fsPath);
	          const canOpen = Boolean(fsPath);
            const canSaveAs = Boolean(fsPath) && item && item.isDirectory !== true;
	          const ext = extOf(item.relPath || item.displayName || fsPath);
	          const canCopyContents =
	            Boolean(fsPath) &&
	            item &&
	            item.isDirectory !== true &&
	            typeof item.size === 'number' &&
	            item.size >= 0 &&
	            item.size <= COPY_CONTENTS_MAX_BYTES &&
	            !BINARY_EXTS.has(ext);

	          const row = document.createElement('div');
	          row.className = 'item';
	          row.title = fsPath;

	          const left = document.createElement('div');
	          left.className = 'left';

	          const name = document.createElement('div');
	          name.className = 'name';
	          const primary = item.relPath || item.displayName || fsPath;
	          name.textContent = primary || '';
	          left.appendChild(name);

	          const hint = document.createElement('div');
	          hint.className = 'hint';
	          const hintParts = [];
	          if (item.size != null) hintParts.push(formatBytes(item.size));
	          const mt = formatMtime(item.mtimeMs);
	          if (mt) hintParts.push(mt);
	          hint.textContent = hintParts.join(' | ');
	          left.appendChild(hint);

	          const actions = document.createElement('div');
	          actions.className = 'actions';

	          const pinBtn = document.createElement('button');
	          const isPinned = pinnedSet.has(item.id);
	          pinBtn.textContent = isPinned ? 'Unpin' : 'Pin';
            pinBtn.title = isPinned ? 'Unpin this file' : 'Pin this file';
	          pinBtn.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
	          pinBtn.setAttribute('aria-label', (isPinned ? 'Unpin ' : 'Pin ') + (primary || 'file'));
	          pinBtn.addEventListener('click', (e) => {
	            e.stopPropagation();
	            togglePinned(runId, item.id);
	          });
	          actions.appendChild(pinBtn);

	          const copyBtn = document.createElement('button');
	          copyBtn.textContent = 'Copy path';
            copyBtn.title = 'Copy file path';
	          copyBtn.setAttribute('aria-label', 'Copy path for ' + (primary || 'file'));
	          setButtonEnabled(copyBtn, canCopy);
	          copyBtn.addEventListener('click', (e) => {
	            e.stopPropagation();
	            if (!canCopy) return;
	            vscode.postMessage({ type: 'copyText', text: fsPath });
	          });
	          actions.appendChild(copyBtn);

	          const copyContentsBtn = document.createElement('button');
	          copyContentsBtn.textContent = 'Copy contents';
	          copyContentsBtn.setAttribute('aria-label', 'Copy contents for ' + (primary || 'file'));
	          if (!canCopyContents) {
	            const size = typeof item.size === 'number' ? item.size : null;
	            if (size != null && size > COPY_CONTENTS_MAX_BYTES) {
	              copyContentsBtn.title = 'Disabled: file is too large to copy contents';
	            } else if (BINARY_EXTS.has(ext)) {
	              copyContentsBtn.title = 'Disabled: file appears to be binary';
	            } else if (item.isDirectory) {
	              copyContentsBtn.title = 'Disabled: not a file';
	            } else {
	              copyContentsBtn.title = 'Disabled';
	            }
	          }
	          setButtonEnabled(copyContentsBtn, canCopyContents);
	          copyContentsBtn.addEventListener('click', (e) => {
	            e.stopPropagation();
	            if (!canCopyContents) return;
	            vscode.postMessage({ type: 'copyFileContents', fsPath });
	          });
	          actions.appendChild(copyContentsBtn);

            const saveAsBtn = document.createElement('button');
            saveAsBtn.textContent = 'Save as...';
            saveAsBtn.setAttribute('aria-label', 'Save a copy of ' + (primary || 'file'));
            if (!canSaveAs) {
              if (item && item.isDirectory) {
                saveAsBtn.title = 'Disabled: not a file';
              } else {
                saveAsBtn.title = 'Disabled';
              }
            } else {
              saveAsBtn.title = 'Save a copy of this file to another location';
            }
            setButtonEnabled(saveAsBtn, canSaveAs);
            saveAsBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              if (!canSaveAs) return;
              vscode.postMessage({ type: 'saveFileAs', fsPath });
            });
            actions.appendChild(saveAsBtn);

	          const revealBtn = document.createElement('button');
	          revealBtn.textContent = 'Reveal';
            revealBtn.title = 'Reveal this file in your OS';
	          revealBtn.setAttribute('aria-label', 'Reveal ' + (primary || 'file') + ' in Explorer');
	          setButtonEnabled(revealBtn, canReveal);
	          revealBtn.addEventListener('click', (e) => {
	            e.stopPropagation();
	            if (!canReveal) return;
	            vscode.postMessage({ type: 'revealInExplorer', fsPath });
	          });
	          actions.appendChild(revealBtn);

	          const openBtn = document.createElement('button');
	          openBtn.textContent = 'Open';
            openBtn.title = 'Open this file in VS Code';
	          openBtn.setAttribute('aria-label', 'Open ' + (primary || 'file'));
	          setButtonEnabled(openBtn, canOpen);
	          openBtn.addEventListener('click', (e) => {
	            e.stopPropagation();
	            if (!canOpen) return;
	            vscode.postMessage({ type: 'openInEditor', fsPath });
	          });
	          actions.appendChild(openBtn);

	          if (canOpen) {
	            row.setAttribute('role', 'button');
	            row.tabIndex = 0;
	            row.setAttribute('aria-label', 'Open ' + (primary || 'file'));
	            const open = () => vscode.postMessage({ type: 'openInEditor', fsPath });
	            row.addEventListener('click', (e) => {
	              if (e && e.target && e.target.closest && e.target.closest('button')) return;
	              open();
	            });
	            row.addEventListener('keydown', (e) => {
	              if (e.key === 'Enter' || e.key === ' ') {
	                e.preventDefault();
	                open();
	              }
	            });
	          }

	          row.appendChild(left);
	          row.appendChild(actions);
	          container.appendChild(row);
	        }

	        function renderGrouped(container, grouped) {
	          for (const group of grouped) {
	            if (!group || !Array.isArray(group.items) || group.items.length === 0) continue;
	            const label = document.createElement('div');
	            label.className = 'keyfiles-group-label';
	            label.textContent = group.group || 'Other';
	            container.appendChild(label);
	            for (const item of group.items) appendRow(container, item);
	          }
	        }

	        if (model.groupedPinned.some((g) => g.items.length > 0)) {
	          keyFilesPinnedWrap.style.display = '';
	          renderGrouped(keyFilesPinned, model.groupedPinned);
	        } else {
	          keyFilesPinnedWrap.style.display = 'none';
	        }

	        if (model.groupedImportant.some((g) => g.items.length > 0)) {
	          keyFilesImportantWrap.style.display = '';
	          renderGrouped(keyFilesImportant, model.groupedImportant);
	        } else {
	          keyFilesImportantWrap.style.display = 'none';
	        }

	        if (model.groupedAll.some((g) => g.items.length > 0)) {
	          keyFilesAllWrap.style.display = '';
	          renderGrouped(keyFilesAll, model.groupedAll);
	        } else {
	          keyFilesAllWrap.style.display = 'none';
	        }
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
          activeWorkPreviewKind = '';
	      }

	      if (items.length === 0) {
	        workEmpty.style.display = '';
	        activeWorkPreviewFsPath = '';
	        activeWorkPreviewContent = '';
	        activeWorkPreviewTruncated = false;
	        activeWorkPreviewError = '';
          activeWorkPreviewAutoScroll = false;
          activeWorkPreviewKind = '';
	        return;
	      }
	      workEmpty.style.display = 'none';

	      if (tailLatestWorkEnabled && (activeWorkPreviewKind === '' || activeWorkPreviewKind === 'workTail')) {
	        const newest = items[0];
	        if (newest && newest.fsPath && newest.fsPath !== activeWorkPreviewFsPath) {
	          activeWorkPreviewFsPath = newest.fsPath;
	          activeWorkPreviewContent = '';
	          activeWorkPreviewTruncated = false;
	          activeWorkPreviewError = '';
	          activeWorkPreviewAutoScroll = true;
	          activeWorkPreviewMode = 'plain';
	          activeWorkPreviewKind = 'workTail';
	          renderActiveWorkPreview();
	          vscode.postMessage({ type: 'loadTextFile', fsPath: newest.fsPath, tail: true });
	        }
	      }

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
            activeWorkPreviewMode = 'plain';
            activeWorkPreviewKind = 'workTail';
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

      function safeString(v) {
        if (v == null) return '';
        if (typeof v === 'string') return v;
        try {
          return JSON.stringify(v);
        } catch {
          return String(v);
        }
      }

      function summarizeEvent(entry) {
        if (!entry || typeof entry !== 'object') return safeString(entry);

        const obj = entry;
        const ev = obj.event || obj.type || obj.kind || obj.name || obj.action || '';
        const data = obj.data ?? obj.payload ?? obj.body ?? obj.value;
        const msg =
          obj.message ||
          obj.text ||
          obj.detail ||
          obj.reason ||
          obj.summary ||
          obj.description ||
          '';

        if (ev === 'function_call' && data && typeof data === 'object') {
          const fn = data.function || data.name || '';
          if (fn) return 'function_call: ' + fn;
          return 'function_call';
        }
        if (ev === 'breakpoint_approved' && data && typeof data === 'object') {
          const bp = data.breakpoint || '';
          return bp ? 'breakpoint_approved: ' + bp : 'breakpoint_approved';
        }
        if (ev === 'run_created' && data && typeof data === 'object') {
          const runId = data.runId || '';
          return runId ? 'run_created: ' + runId : 'run_created';
        }
        if (typeof msg === 'string' && msg.trim()) return msg.trim();
        return data ? safeString(data) : safeString(entry);
      }

      function renderJournalTable(entries) {
        if (!journalBody) {
          showBanner('Journal table failed to render: missing journalBody element.', { error: true });
          return 0;
        }
        journalBody.innerHTML = '';
        const list = Array.isArray(entries) ? entries : [];
        if (list.length === 0) {
          const tr = document.createElement('tr');
          const td = document.createElement('td');
          td.colSpan = 4;
          td.className = 'empty';
          td.textContent = 'No events yet.';
          tr.appendChild(td);
          journalBody.appendChild(tr);
          return 0;
        }

        let rendered = 0;
        for (let idx = list.length - 1; idx >= 0; idx--) {
          const entry = list[idx];
          const tr = document.createElement('tr');
          const tsRaw =
            entry && typeof entry === 'object'
              ? entry.timestamp || entry.time || entry.createdAt || entry.updatedAt || ''
              : '';
          let ts = '';
          if (tsRaw) {
            try {
              const d = new Date(String(tsRaw));
              ts = isNaN(d.getTime()) ? String(tsRaw) : d.toLocaleString();
            } catch {
              ts = String(tsRaw);
            }
          }

          const ev =
            entry && typeof entry === 'object'
              ? String(entry.event || entry.type || entry.kind || entry.name || entry.action || '')
              : '';
          const id =
            entry && typeof entry === 'object'
              ? String(entry.id || entry.runId || entry.requestId || entry.pid || '')
              : '';
          const summary = summarizeEvent(entry);

          const tdTime = document.createElement('td');
          tdTime.textContent = ts;
          tr.appendChild(tdTime);

          const tdEv = document.createElement('td');
          tdEv.textContent = ev || '(unknown)';
          tr.appendChild(tdEv);

          const tdId = document.createElement('td');
          tdId.textContent = id;
          tr.appendChild(tdId);

          const tdSummary = document.createElement('td');
          const code = document.createElement('code');
          const text = String(summary || '');
          code.textContent = text.length > 240 ? text.slice(0, 240) + '...' : text;
          code.title = text;
          tdSummary.appendChild(code);
          tr.appendChild(tdSummary);

          journalBody.appendChild(tr);
          rendered++;
        }

        return rendered;
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
          activeWorkPreviewMode = 'plain';
          activeWorkPreviewKind = 'filePreview';
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

    function findImportantByRel(snapshot, predicate) {
      const items = Array.isArray(snapshot.importantFiles) ? snapshot.importantFiles : [];
      for (const item of items) {
        if (!item || typeof item.relPath !== 'string' || typeof item.fsPath !== 'string') continue;
        if (predicate(item.relPath)) return item;
      }
      return null;
    }

    function getCachedText(fsPath) {
      const cached = textFileCache.get(fsPath);
      return cached && typeof cached.content === 'string' ? cached.content : '';
    }

    function ensureCached(fsPath, mtimeMs) {
      const cached = textFileCache.get(fsPath);
      if (!cached || cached.mtimeMs !== mtimeMs) {
        vscode.postMessage({ type: 'loadTextFile', fsPath, tail: false });
        textFileCache.set(fsPath, { ...(cached || {}), mtimeMs });
      }
    }

		    function renderPinnedPreviews(snapshot) {
	      processMdTarget = findImportantByRel(snapshot, (rel) => {
	        const norm = String(rel).replace(/\\\\/g, '/').toLowerCase();
	        return (
            norm === 'process.md' ||
            norm === 'artifacts/process.md' ||
            norm === 'run/process.md' ||
            norm === 'run/artifacts/process.md'
          );
	      });
      processMermaidTarget = findImportantByRel(snapshot, (rel) => {
        const norm = String(rel).replace(/\\\\/g, '/').toLowerCase();
        return norm === 'artifacts/process.mermaid.md' || norm === 'run/artifacts/process.mermaid.md';
      });
      mainJsTarget = snapshot.mainJs && snapshot.mainJs.fsPath ? snapshot.mainJs : null;

      // process.md
	      if (processMdTarget) {
	        processMdPill.textContent = processMdTarget.relPath;
	        processMdOpen.style.display = '';
	        processMdOpen.onclick = () => vscode.postMessage({ type: 'openInEditor', fsPath: processMdTarget.fsPath });
	        ensureCached(processMdTarget.fsPath, processMdTarget.mtimeMs || 0);
	        const content = getCachedText(processMdTarget.fsPath);
	        processMdPreview.innerHTML = content ? renderMarkdownToHtml(content) : 'Loading...';
          if (content) renderMermaidIn(processMdPreview);
	      } else {
	        processMdPill.textContent = 'process.md';
	        processMdOpen.style.display = 'none';
	        processMdPreview.textContent = 'No process.md found.';
      }

      // process.mermaid.md
	      if (processMermaidTarget) {
	        processMermaidPill.textContent = processMermaidTarget.relPath;
	        processMermaidOpen.style.display = '';
	        processMermaidOpen.onclick = () =>
	          vscode.postMessage({ type: 'openInEditor', fsPath: processMermaidTarget.fsPath });
	        ensureCached(processMermaidTarget.fsPath, processMermaidTarget.mtimeMs || 0);
	        const content = getCachedText(processMermaidTarget.fsPath);
	        processMermaidPreview.innerHTML = content ? renderMarkdownToHtml(content) : 'Loading...';
          if (content) renderMermaidIn(processMermaidPreview);
	      } else {
	        processMermaidPill.textContent = 'process.mermaid.md';
	        processMermaidOpen.style.display = 'none';
	        processMermaidPreview.textContent = 'No process.mermaid.md found.';
      }

	      // main.js
		      if (mainJsTarget) {
		        mainJsPill.textContent = mainJsTarget.size != null ? formatBytes(mainJsTarget.size) : 'Present';
		        mainJsHint.textContent = mainJsTarget.mtimeMs ? 'Updated: ' + new Date(mainJsTarget.mtimeMs).toLocaleString() : '';
		        mainJsActions.style.display = '';
		        mainJsPreview.onclick = () => vscode.postMessage({ type: 'loadTextFile', fsPath: mainJsTarget.fsPath, tail: false });
		        mainJsOpen.onclick = () => vscode.postMessage({ type: 'openInEditor', fsPath: mainJsTarget.fsPath });
		        mainJsSaveAs.onclick = () => vscode.postMessage({ type: 'saveFileAs', fsPath: mainJsTarget.fsPath });
		        ensureCached(mainJsTarget.fsPath, mainJsTarget.mtimeMs || 0);
		        const content = getCachedText(mainJsTarget.fsPath);
            if (content) {
              mainJsPreviewPre.innerHTML = highlightJavaScriptToHtml(content);
            } else {
              mainJsPreviewPre.textContent = 'Loading...';
            }
	      } else {
	        mainJsPill.textContent = 'Missing';
	        mainJsHint.textContent = 'No code/main.js found for this run.';
	        mainJsActions.style.display = 'none';
	        mainJsPreviewPre.textContent = '';
	      }
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

        const isMarkdown =
          !item.isDirectory && typeof item.relPath === 'string' && item.relPath.toLowerCase().endsWith('.md');
        if (isMarkdown) {
          const previewBtn = document.createElement('button');
          previewBtn.textContent = 'Preview';
          previewBtn.title = 'Preview Markdown';
          previewBtn.addEventListener('click', () => {
            activeWorkPreviewFsPath = item.fsPath;
            activeWorkPreviewContent = '';
            activeWorkPreviewTruncated = false;
            activeWorkPreviewError = '';
            activeWorkPreviewAutoScroll = false;
            activeWorkPreviewMode = 'markdown';
            activeWorkPreviewKind = 'filePreview';
            renderActiveWorkPreview();
            vscode.postMessage({ type: 'loadTextFile', fsPath: item.fsPath, tail: false });
          });
          actions.appendChild(previewBtn);
        }

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
	        if (msg.fsPath) {
	          textFileCache.set(msg.fsPath, {
	            ...(textFileCache.get(msg.fsPath) || {}),
	            content: msg.content,
	            truncated: Boolean(msg.truncated),
	            size: msg.size,
	          });
	        }
	        if (msg.fsPath && msg.fsPath === activeWorkPreviewFsPath) {
	          activeWorkPreviewFsPath = msg.fsPath;
	          activeWorkPreviewContent = msg.content;
	          activeWorkPreviewTruncated = Boolean(msg.truncated);
	          activeWorkPreviewError = '';
	          renderActiveWorkPreview();
	        }
        if (latestSnapshot) renderPinnedPreviews(latestSnapshot);
	    }

	    function renderTextFileError(msg) {
	      if (!msg || typeof msg.message !== 'string') return;
        if (msg.fsPath) {
          textFileCache.set(msg.fsPath, { ...(textFileCache.get(msg.fsPath) || {}), error: msg.message });
        }
        if (msg.fsPath && msg.fsPath === activeWorkPreviewFsPath) {
          activeWorkPreviewError = msg.message;
          activeWorkPreviewContent = '';
          activeWorkPreviewTruncated = false;
          renderActiveWorkPreview();
        }
        if (latestSnapshot) renderPinnedPreviews(latestSnapshot);
	    }

	      function escapeHtml(text) {
	        return String(text)
	          .replace(/&/g, '&amp;')
	          .replace(/</g, '&lt;')
	          .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
	          .replace(/'/g, '&#39;');
	      }

        function b64EncodeUnicode(text) {
          try {
            return btoa(unescape(encodeURIComponent(String(text || ''))));
          } catch {
            return btoa(String(text || ''));
          }
        }

        function b64DecodeUnicode(b64) {
          try {
            return decodeURIComponent(escape(atob(String(b64 || ''))));
          } catch {
            try {
              return atob(String(b64 || ''));
            } catch {
              return '';
            }
          }
        }

	        let mermaidInitialized = false;
	        function renderMermaidIn(root) {
	          const lib = window.mermaid;
	          if (!root || !lib) return;

          const nodes = Array.from(root.querySelectorAll('.mermaid[data-mermaid-b64]'));
          if (nodes.length === 0) return;

          for (const node of nodes) {
            if (node.dataset && node.dataset.mermaidRendered === 'true') continue;
            const b64 = node.dataset ? node.dataset.mermaidB64 : '';
            node.textContent = b64DecodeUnicode(b64);
            if (node.dataset) node.dataset.mermaidRendered = 'true';
          }

	          try {
	            if (!mermaidInitialized && typeof lib.initialize === 'function') {
                const isDark =
                  document && document.body && document.body.classList
                    ? document.body.classList.contains('vscode-dark')
                    : false;
	              lib.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'default' });
	              mermaidInitialized = true;
	            }
	          } catch {
	            // ignore
	          }

	          try {
	            if (typeof lib.run === 'function') {
	              const res = lib.run({ nodes, suppressErrors: true });
                if (res && typeof res.then === 'function') res.catch(() => {});
	            }
	          } catch {
	            // ignore
	          }
	        }

        const JS_KEYWORDS = new Set([
          'break','case','catch','class','const','continue','debugger','default','delete','do','else','export','extends',
          'finally','for','function','if','import','in','instanceof','let','new','return','super','switch','this','throw',
          'try','typeof','var','void','while','with','yield','await','async',
        ]);

        function computeImportLiteralRanges(code) {
          const s = String(code || '');
          const ranges = [];
          const add = (re) => {
            re.lastIndex = 0;
            for (;;) {
              const m = re.exec(s);
              if (!m) break;
              const quote = m[1] || "'";
              const spec = m[2] || '';
              const literal = quote + spec + quote;
              const rel = m[0].indexOf(literal);
              if (rel >= 0) {
                ranges.push({ start: m.index + rel, end: m.index + rel + literal.length, spec });
              }
            }
          };
          add(/\\bfrom\\s*(['"])([^'"]+)\\1/g);
          add(/\\bimport\\s*\\(\\s*(['"])([^'"]+)\\1\\s*\\)/g);
          add(/\\brequire\\s*\\(\\s*(['"])([^'"]+)\\1\\s*\\)/g);
          add(/\\bexport\\s+\\*\\s+from\\s*(['"])([^'"]+)\\1/g);
          ranges.sort((a, b) => a.start - b.start);
          return ranges;
        }

        function escapeHtmlAttr(text) {
          return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function highlightJavaScriptToHtml(code) {
          const s = String(code || '');
          const ranges = computeImportLiteralRanges(s);
          let rangeIdx = 0;

          const takeRangeAt = (start, end) => {
            while (rangeIdx < ranges.length && ranges[rangeIdx].end <= start) rangeIdx++;
            const r = ranges[rangeIdx];
            if (!r) return null;
            if (r.start === start && r.end === end) return r;
            return null;
          };

          let i = 0;
          let out = '';
          while (i < s.length) {
            const ch = s[i];

            if (ch === '/' && s[i + 1] === '/') {
              const start = i;
              i += 2;
              while (i < s.length && s[i] !== '\\n') i++;
              const text = s.slice(start, i);
              out += '<span class="tok-com">' + escapeHtml(text) + '</span>';
              continue;
            }

            if (ch === '/' && s[i + 1] === '*') {
              const start = i;
              i += 2;
              while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++;
              if (i < s.length) i += 2;
              const text = s.slice(start, i);
              out += '<span class="tok-com">' + escapeHtml(text) + '</span>';
              continue;
            }

	            if (ch === '"' || ch === '\\'' || ch === '\\x60') {
              const quote = ch;
              const start = i;
              i++;
              let escaped = false;
              while (i < s.length) {
                const c = s[i];
                if (escaped) {
                  escaped = false;
                  i++;
                  continue;
                }
                if (c === '\\\\') {
                  escaped = true;
                  i++;
                  continue;
                }
                if (c === quote) {
                  i++;
                  break;
                }
                i++;
              }
              const end = i;
              const text = s.slice(start, end);
              const range = takeRangeAt(start, end);
              if (range) {
                const specEnc = encodeURIComponent(range.spec || '');
                out +=
                  '<a class="tok-link" data-spec="' +
                  escapeHtmlAttr(specEnc) +
                  '"><span class="tok-str">' +
                  escapeHtml(text) +
                  '</span></a>';
              } else {
                out += '<span class="tok-str">' + escapeHtml(text) + '</span>';
              }
              continue;
            }

            if (ch >= '0' && ch <= '9') {
              const start = i;
              i++;
              while (i < s.length) {
                const c = s[i];
                const isNum = (c >= '0' && c <= '9') || c === '.' || c === '_' || c === 'x' || c === 'X' || c === 'e' || c === 'E' || c === '+' || c === '-';
                if (!isNum) break;
                i++;
              }
              out += '<span class="tok-num">' + escapeHtml(s.slice(start, i)) + '</span>';
              continue;
            }

            const isIdentStart =
              (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '_' || ch === '$';
            if (isIdentStart) {
              const start = i;
              i++;
              while (i < s.length) {
                const c = s[i];
                const isIdent =
                  (c >= 'A' && c <= 'Z') ||
                  (c >= 'a' && c <= 'z') ||
                  (c >= '0' && c <= '9') ||
                  c === '_' ||
                  c === '$';
                if (!isIdent) break;
                i++;
              }
              const word = s.slice(start, i);
              out +=
                '<span class="' +
                (JS_KEYWORDS.has(word) ? 'tok-kw' : 'tok-id') +
                '">' +
                escapeHtml(word) +
                '</span>';
              continue;
            }

            const isWs = ch === ' ' || ch === '\\t' || ch === '\\n' || ch === '\\r';
            if (isWs) {
              out += escapeHtml(ch);
              i++;
              continue;
            }

            out += '<span class="tok-pun">' + escapeHtml(ch) + '</span>';
            i++;
          }

          return out;
        }

		      function renderMarkdownToHtml(markdown) {
		        const lines = String(markdown || '').split(/\\r?\\n/);
		        let out = '';
		        let inCode = false;
		        let codeLang = '';
            let mermaidLines = [];
		        for (const rawLine of lines) {
		          const line = String(rawLine);
		          const fence = line.match(/^\\x60\\x60\\x60\\s*([a-zA-Z0-9_-]+)?\\s*$/);
		          if (fence) {
		            if (!inCode) {
		              inCode = true;
		              codeLang = fence[1] || '';
                  if (String(codeLang).toLowerCase() === 'mermaid') {
                    mermaidLines = [];
                  } else {
			              out += '<pre><code class="lang-' + escapeHtml(codeLang) + '">';
                  }
			            } else {
                  const lower = String(codeLang).toLowerCase();
                  if (lower === 'mermaid') {
                    out +=
                      '<div class="mermaid" data-mermaid-b64="' +
                      b64EncodeUnicode(mermaidLines.join('\\n')) +
                      '"></div>';
                    mermaidLines = [];
                  } else {
			              inCode = false;
			              codeLang = '';
			              out += '</code></pre>';
                  }
                  inCode = false;
                  codeLang = '';
			            }
		            continue;
		          }
	          if (inCode) {
              if (String(codeLang).toLowerCase() === 'mermaid') {
                mermaidLines.push(line);
              } else {
	              out += escapeHtml(line) + '\\n';
              }
	            continue;
	          }
		          const heading = line.match(/^(#{1,6})\\s+(.*)$/);
		          if (heading) {
	            const level = heading[1].length;
	            out +=
	              '<h' + level + '>' + escapeHtml(heading[2]) + '</h' + level + '>';
	            continue;
	          }
	          const list = line.match(/^\\s*[-*]\\s+(.*)$/);
	          if (list) {
	            out += '<div class="md-li">- ' + escapeHtml(list[1]) + '</div>';
	            continue;
	          }
	          if (!line.trim()) {
	            out += '<div class="md-blank"></div>';
	            continue;
	          }
	          out += '<div class="md-p">' + escapeHtml(line) + '</div>';
		        }
            if (inCode) {
              if (String(codeLang).toLowerCase() === 'mermaid') {
                out +=
                  '<div class="mermaid" data-mermaid-b64="' +
                  b64EncodeUnicode(mermaidLines.join('\\n')) +
                  '"></div>';
              } else {
                out += '</code></pre>';
              }
            }
		        return out;
		      }

	    function renderActiveWorkPreview() {
	      if (!activeWorkPreviewFsPath) {
          textPreviewCard.style.display = 'none';
	        workPreview.textContent = '';
          workPreviewHtml.innerHTML = '';
          workPreviewHtml.style.display = 'none';
	        return;
	      }

        textPreviewCard.style.display = '';
        textPreviewTitle.textContent =
          pathBasename(activeWorkPreviewFsPath) + (activeWorkPreviewAutoScroll ? ' (tailing)' : '');

	      if (activeWorkPreviewError) {
	        workPreview.textContent = 'Error loading work summary preview: ' + activeWorkPreviewError;
          workPreview.style.display = '';
          workPreviewHtml.innerHTML = '';
          workPreviewHtml.style.display = 'none';
	        workPreview.scrollTop = 0;
	        return;
	      }

	      if (!activeWorkPreviewContent) {
	        if (latestRunStatus && latestRunStatus !== 'running' && latestRunStatus !== 'paused') {
	          workPreview.textContent = 'No work summary output. Run finished.';
	        } else {
	          workPreview.textContent = 'No work summary output yet.';
	        }
          workPreview.style.display = '';
          workPreviewHtml.innerHTML = '';
          workPreviewHtml.style.display = 'none';
	        workPreview.scrollTop = 0;
	        return;
	      }

	      const suffixTruncated = activeWorkPreviewTruncated ? '\\n\\n(truncated)' : '';
	      const suffixDone =
	        latestRunStatus && latestRunStatus !== 'running' && latestRunStatus !== 'paused'
	          ? '\\n\\n(Run finished)'
	          : '';
	        if (activeWorkPreviewMode === 'markdown') {
	          workPreview.style.display = 'none';
	          workPreviewHtml.style.display = '';
	          workPreviewHtml.innerHTML = renderMarkdownToHtml(activeWorkPreviewContent);
            renderMermaidIn(workPreviewHtml);
	          workPreviewHtml.scrollTop = 0;
	        } else {
          workPreview.style.display = '';
          workPreviewHtml.innerHTML = '';
          workPreviewHtml.style.display = 'none';
          workPreview.textContent = activeWorkPreviewContent + suffixTruncated + suffixDone;
          if (activeWorkPreviewAutoScroll) workPreview.scrollTop = workPreview.scrollHeight;
          else workPreview.scrollTop = 0;
        }
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

    this.panel.webview.html = renderWebviewHtml(this.panel.webview, params.extensionUri);

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
      case 'openResolvedImport':
        await this.openResolvedImport(msg.fromFsPath, msg.specifier);
        return;
      case 'revealInExplorer':
        await this.revealInExplorer(msg.fsPath);
        return;
      case 'saveFileAs':
        await this.saveFileAs(msg.fsPath);
        return;
      case 'loadTextFile':
        await this.loadTextFile(msg.fsPath, msg.tail ?? true);
        return;
      case 'copyText':
        await this.copyText(msg.text);
        return;
      case 'copyFileContents':
        await this.copyFileContents(msg.fsPath);
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

      const pid = this.interaction?.getPidForRunId?.(this.run.id);
      const label = this.interaction?.getLabelForRunId?.(this.run.id);
      const tail = this.interaction?.getOutputTailForRunId?.(this.run.id);
      await this.post({
        type: 'oInfo',
        pid: typeof pid === 'number' ? pid : null,
        label: label ?? null,
      });
      await this.post({ type: 'oOutputSet', text: typeof tail === 'string' ? tail : '' });

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
          await this.post({
            type: 'textFileError',
            fsPath: update.fsPath,
            message: update.message,
          });
          this.activeTextTailFsPath = undefined;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.post({ type: 'error', message: `Failed to refresh run details: ${message}` });
    }
  }

  async appendOOutput(chunk: string): Promise<void> {
    const text = typeof chunk === 'string' ? chunk : '';
    if (!text) return;
    await this.post({ type: 'oOutputAppend', text });
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
    const value = typeof fsPath === 'string' ? fsPath : '';
    if (!value) return;
    if (!isFsPathInsideRoot(this.run.paths.runRoot, value)) {
      await this.post({
        type: 'error',
        message: 'Refusing to open a file outside the run directory.',
      });
      return;
    }
    try {
      await vscode.window.showTextDocument(vscode.Uri.file(value), { preview: true });
    } catch {
      await this.post({ type: 'error', message: `Could not open: ${path.basename(value)}` });
    }
  }

  private async openResolvedImport(fromFsPath: string, specifier: string): Promise<void> {
    const from = typeof fromFsPath === 'string' ? fromFsPath : '';
    if (!from) return;
    if (!isFsPathInsideRoot(this.run.paths.runRoot, from)) return;

    const spec = typeof specifier === 'string' ? specifier.trim() : '';
    if (!spec) return;

    const isRelative = spec.startsWith('.');
    const isRunAbsolute = spec.startsWith('/');
    if (!isRelative && !isRunAbsolute) {
      await this.post({
        type: 'error',
        message: `Cannot open import: "${spec}" (only relative imports are supported here).`,
      });
      return;
    }

    const baseDir = path.dirname(from);
    const base = isRunAbsolute
      ? path.resolve(this.run.paths.runRoot, `.${spec}`)
      : path.resolve(baseDir, spec);

    const candidates = [
      base,
      `${base}.js`,
      `${base}.mjs`,
      `${base}.cjs`,
      `${base}.ts`,
      `${base}.tsx`,
      path.join(base, 'index.js'),
      path.join(base, 'index.ts'),
    ];

    let resolved: string | undefined;
    for (const c of candidates) {
      try {
        const st = fs.statSync(c);
        if (!st.isFile()) continue;
        resolved = c;
        break;
      } catch {
        // ignore
      }
    }

    if (!resolved) {
      await this.post({ type: 'error', message: `Cannot resolve import path: ${spec}` });
      return;
    }

    if (!isFsPathInsideRoot(this.run.paths.runRoot, resolved)) {
      await this.post({
        type: 'error',
        message: 'Refusing to open an import outside the run directory.',
      });
      return;
    }

    await this.openInEditor(resolved);
  }

  private async revealInExplorer(fsPath: string): Promise<void> {
    const value = typeof fsPath === 'string' ? fsPath : '';
    if (!value) return;
    if (!isFsPathInsideRoot(this.run.paths.runRoot, value)) {
      await this.post({
        type: 'error',
        message: 'Refusing to reveal a file outside the run directory.',
      });
      return;
    }
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(value));
    } catch {
      await this.post({
        type: 'error',
        message: `Could not reveal: ${path.basename(value)} (file not found)`,
      });
      return;
    }
    try {
      await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(value));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.post({ type: 'error', message: `Could not reveal in OS: ${message}` });
    }
  }

  private async saveFileAs(fsPath: string): Promise<void> {
    const value = typeof fsPath === 'string' ? fsPath : '';
    if (!value) return;

    if (!isFsPathInsideRoot(this.run.paths.runRoot, value)) {
      await this.post({
        type: 'error',
        message: 'Refusing to save a file outside the run directory.',
      });
      return;
    }

    const sourceUri = vscode.Uri.file(value);
    let stat: vscode.FileStat;
    try {
      stat = await vscode.workspace.fs.stat(sourceUri);
    } catch {
      await this.post({
        type: 'error',
        message: `Could not save: ${path.basename(value)} (file not found)`,
      });
      return;
    }
    if (stat.type & vscode.FileType.Directory) {
      await this.post({ type: 'error', message: 'Save as is not supported for directories.' });
      return;
    }

    const basename = path.basename(value) || 'file';
    const defaultUri = vscode.Uri.file(path.join(path.dirname(value), basename));
    const destUri = await vscode.window.showSaveDialog({
      title: `Save a copy of ${basename}`,
      saveLabel: 'Save As...',
      defaultUri,
    });
    if (!destUri) return;

    try {
      await vscode.workspace.fs.copy(sourceUri, destUri, { overwrite: true });
      vscode.window.setStatusBarMessage('Babysitter: saved file', 2000);
      return;
    } catch {
      // Fall back to read/write to support some cross-filesystem cases.
    }

    const MAX_FALLBACK_BYTES = 25 * 1024 * 1024;
    if (stat.size > MAX_FALLBACK_BYTES) {
      await this.post({
        type: 'error',
        message: `Could not save file (copy failed and file is too large for fallback): ${basename}`,
      });
      return;
    }

    try {
      const data = await vscode.workspace.fs.readFile(sourceUri);
      await vscode.workspace.fs.writeFile(destUri, data);
      vscode.window.setStatusBarMessage('Babysitter: saved file', 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.post({ type: 'error', message: `Could not save file: ${message}` });
    }
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
      await this.post({
        type: 'textFile',
        fsPath,
        content: res.content,
        truncated: res.truncated,
        size: res.size,
      });
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

  private async copyFileContents(fsPath: string): Promise<void> {
    const value = typeof fsPath === 'string' ? fsPath : '';
    if (!value) return;

    const res = await readFileContentsForClipboard({
      runRoot: this.run.paths.runRoot,
      fsPath: value,
      maxBytes: DEFAULT_MAX_COPY_CONTENTS_BYTES,
    });
    if (!res.ok) {
      await this.post({ type: 'error', message: res.message });
      return;
    }

    try {
      await vscode.env.clipboard.writeText(res.content);
      vscode.window.setStatusBarMessage('Babysitter: copied file contents to clipboard', 2000);
    } catch {
      await this.post({ type: 'error', message: 'Could not copy to clipboard.' });
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

  if (interaction?.onDidOutput) {
    context.subscriptions.push(
      interaction.onDidOutput((evt) => {
        const panel = panelsByRunId.get(evt.runId);
        if (panel) void panel.appendOOutput(evt.chunk);
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
