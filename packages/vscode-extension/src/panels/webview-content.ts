import { Run, TaskEffect } from '../types';

// ---------------------------------------------------------------------------
// HTML escape
// ---------------------------------------------------------------------------

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---------------------------------------------------------------------------
// Duration formatting (duplicated here to keep webview-content self-contained
// from the vscode API — this file must not import vscode)
// ---------------------------------------------------------------------------

function fmtDuration(ms: number | undefined): string {
  if (ms === undefined || ms < 0) { return '-'; }
  if (ms < 1000) { return '< 1s'; }
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) { return m > 0 ? `${h}h ${m}m` : `${h}h`; }
  if (m > 0) { return sec > 0 ? `${m}m ${sec}s` : `${m}m`; }
  return `${sec}s`;
}

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    const ss = d.getSeconds().toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function statusIcon(status: string): string {
  switch (status) {
    case 'resolved': return '&#10003;';  // checkmark
    case 'error': return '&#10007;';     // cross
    case 'requested': return '&#9679;';  // filled circle
    default: return '&#9675;';           // empty circle
  }
}

function eventIcon(type: string): string {
  switch (type) {
    case 'RUN_CREATED': return '&#9654;';       // play
    case 'EFFECT_REQUESTED': return '&#8594;';  // right arrow
    case 'EFFECT_RESOLVED': return '&#10003;';  // check
    case 'RUN_COMPLETED': return '&#9632;';     // stop square
    case 'RUN_FAILED': return '&#9888;';        // warning
    default: return '&#8226;';                   // bullet
  }
}

// ---------------------------------------------------------------------------
// Main HTML generator
// ---------------------------------------------------------------------------

export function generateWebviewContent(run: Run, nonce: string, cspSource: string): string {
  const progressPercent = run.totalTasks > 0
    ? Math.round((run.completedTasks / run.totalTasks) * 100)
    : 0;

  const pipelineHtml = run.tasks.map((task, i) => buildStepCard(task, i)).join('\n');
  const eventsHtml = [...run.events].reverse().map(buildEventCard).join('\n');

  const breakpointBanner = run.breakpointQuestion && run.breakpointEffectId
    ? `<div class="breakpoint-banner" id="breakpoint-banner">
        <span class="bp-icon">&#9995;</span>
        <span class="bp-text">${esc(run.breakpointQuestion)}</span>
        <button class="bp-approve" onclick="approveBreakpoint('${esc(run.breakpointEffectId)}')">Approve</button>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
  <style nonce="${nonce}">
    /* ------------------------------------------------------------------ */
    /* Reset & Base                                                       */
    /* ------------------------------------------------------------------ */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-editor-foreground, #cccccc);
      background: var(--vscode-editor-background, #1e1e1e);
      overflow-x: hidden;
    }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--vscode-scrollbarSlider-background, #4e4e4e); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--vscode-scrollbarSlider-hoverBackground, #6e6e6e); }

    /* ------------------------------------------------------------------ */
    /* Top Banner                                                         */
    /* ------------------------------------------------------------------ */
    .top-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: var(--vscode-sideBar-background, #252526);
      border-bottom: 1px solid var(--vscode-editorGroup-border, #444444);
      flex-wrap: wrap;
      gap: 10px;
    }
    .run-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-badge.pending { background: #2196f3; color: #fff; }
    .status-badge.waiting { background: var(--vscode-charts-yellow, #cca700); color: #000; }
    .status-badge.completed { background: var(--vscode-charts-green, #388e3c); color: #fff; }
    .status-badge.failed { background: var(--vscode-charts-red, #d32f2f); color: #fff; }
    .run-id { font-family: var(--vscode-editor-fontFamily, monospace); font-size: 12px; opacity: 0.7; }
    .process-id { font-weight: 600; }
    .duration { font-size: 12px; opacity: 0.7; }

    .progress-bar {
      position: relative;
      min-width: 200px;
      max-width: 300px;
      height: 22px;
      background: var(--vscode-input-background, #3c3c3c);
      border-radius: 11px;
      overflow: hidden;
      border: 1px solid var(--vscode-input-border, #555);
    }
    .progress-fill {
      height: 100%;
      background: var(--vscode-charts-green, #388e3c);
      transition: width 0.4s ease;
      border-radius: 11px 0 0 11px;
    }
    .progress-text {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      color: #fff;
      text-shadow: 0 0 4px rgba(0,0,0,0.5);
    }

    /* ------------------------------------------------------------------ */
    /* Breakpoint Banner                                                  */
    /* ------------------------------------------------------------------ */
    .breakpoint-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 20px;
      background: rgba(204, 167, 0, 0.15);
      border-bottom: 2px solid var(--vscode-charts-yellow, #cca700);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .bp-icon { font-size: 20px; }
    .bp-text { flex: 1; font-weight: 500; }
    .bp-approve {
      padding: 6px 16px;
      border: none;
      border-radius: 4px;
      background: var(--vscode-button-background, #0e639c);
      color: var(--vscode-button-foreground, #fff);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .bp-approve:hover { opacity: 0.85; }

    /* ------------------------------------------------------------------ */
    /* Main 3-Column Layout                                               */
    /* ------------------------------------------------------------------ */
    .main-layout {
      display: grid;
      grid-template-columns: 250px 1fr 300px;
      height: calc(100vh - 80px);
      overflow: hidden;
    }

    /* ------------------------------------------------------------------ */
    /* Pipeline Panel (left)                                              */
    /* ------------------------------------------------------------------ */
    .pipeline-panel {
      border-right: 1px solid var(--vscode-editorGroup-border, #444);
      overflow-y: auto;
      padding: 12px;
      background: var(--vscode-sideBar-background, #252526);
    }
    .pipeline-panel h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      opacity: 0.6;
      margin-bottom: 10px;
      padding: 0 4px;
    }
    .step-card {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px;
      border: 1px solid var(--vscode-editorGroup-border, #444);
      border-radius: 6px;
      margin-bottom: 6px;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .step-card:hover {
      background: var(--vscode-list-hoverBackground, #2a2d2e);
    }
    .step-card.selected {
      border-color: var(--vscode-focusBorder, #007fd4);
      background: var(--vscode-list-hoverBackground, #2a2d2e);
    }
    .step-number {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
      background: var(--vscode-badge-background, #4d4d4d);
      color: var(--vscode-badge-foreground, #fff);
    }
    .step-info { flex: 1; min-width: 0; }
    .step-title {
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .step-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      font-size: 11px;
      opacity: 0.7;
    }
    .kind-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 3px;
      background: var(--vscode-badge-background, #4d4d4d);
      color: var(--vscode-badge-foreground, #fff);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .status-icon-resolved { color: var(--vscode-charts-green, #388e3c); }
    .status-icon-error { color: var(--vscode-charts-red, #d32f2f); }
    .status-icon-requested { color: var(--vscode-charts-yellow, #cca700); }

    /* ------------------------------------------------------------------ */
    /* Task Detail Panel (center)                                         */
    /* ------------------------------------------------------------------ */
    .task-detail-panel {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .tab-bar {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--vscode-editorGroup-border, #444);
      background: var(--vscode-sideBar-background, #252526);
      flex-shrink: 0;
    }
    .tab {
      padding: 10px 18px;
      border: none;
      border-bottom: 2px solid transparent;
      background: none;
      color: var(--vscode-editor-foreground, #ccc);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.15s, border-color 0.15s;
    }
    .tab:hover { opacity: 0.9; }
    .tab.active {
      opacity: 1;
      border-bottom-color: var(--vscode-focusBorder, #007fd4);
    }
    .tab-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
    }
    .placeholder {
      text-align: center;
      padding: 60px 20px;
      opacity: 0.4;
      font-size: 14px;
    }
    .detail-section { margin-bottom: 20px; }
    .detail-section h4 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      opacity: 0.5;
      margin-bottom: 8px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 6px 12px;
      font-size: 12px;
    }
    .detail-label { opacity: 0.6; font-weight: 500; }
    .detail-value { word-break: break-all; }
    pre.code-block {
      background: var(--vscode-textCodeBlock-background, #1a1a1a);
      border: 1px solid var(--vscode-editorGroup-border, #444);
      border-radius: 4px;
      padding: 12px;
      font-family: var(--vscode-editor-fontFamily, 'Consolas', monospace);
      font-size: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 400px;
      overflow-y: auto;
    }
    .no-data {
      font-style: italic;
      opacity: 0.4;
      font-size: 12px;
    }
    .bp-detail-approve {
      margin-top: 12px;
      padding: 8px 20px;
      border: none;
      border-radius: 4px;
      background: var(--vscode-button-background, #0e639c);
      color: var(--vscode-button-foreground, #fff);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .bp-detail-approve:hover { opacity: 0.85; }

    /* ------------------------------------------------------------------ */
    /* Event Stream Panel (right)                                         */
    /* ------------------------------------------------------------------ */
    .event-stream-panel {
      border-left: 1px solid var(--vscode-editorGroup-border, #444);
      overflow-y: auto;
      padding: 12px;
      background: var(--vscode-sideBar-background, #252526);
    }
    .event-stream-panel h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      opacity: 0.6;
      margin-bottom: 10px;
      padding: 0 4px;
    }
    .event-card {
      padding: 8px 10px;
      border: 1px solid var(--vscode-editorGroup-border, #444);
      border-radius: 4px;
      margin-bottom: 4px;
      font-size: 11px;
    }
    .event-header {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .event-icon { font-size: 12px; flex-shrink: 0; }
    .event-type { font-weight: 600; flex: 1; }
    .event-time { opacity: 0.5; font-family: var(--vscode-editor-fontFamily, monospace); font-size: 10px; }
    .event-card details { margin-top: 6px; }
    .event-card summary {
      cursor: pointer;
      font-size: 10px;
      opacity: 0.5;
      user-select: none;
    }
    .event-card details pre {
      margin-top: 4px;
      font-size: 10px;
      background: var(--vscode-textCodeBlock-background, #1a1a1a);
      padding: 6px 8px;
      border-radius: 3px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 200px;
      overflow-y: auto;
    }

    /* ------------------------------------------------------------------ */
    /* Responsive: collapse to single column                              */
    /* ------------------------------------------------------------------ */
    @media (max-width: 800px) {
      .main-layout {
        grid-template-columns: 1fr;
        height: auto;
      }
      .pipeline-panel, .event-stream-panel {
        border-left: none;
        border-right: none;
        border-bottom: 1px solid var(--vscode-editorGroup-border, #444);
        max-height: 300px;
      }
      .task-detail-panel {
        min-height: 400px;
      }
    }
  </style>
</head>
<body>

  <!-- Top Banner -->
  <div class="top-banner">
    <div class="run-info">
      <span class="status-badge ${esc(run.status)}">${esc(run.status.toUpperCase())}</span>
      <span class="run-id" title="${esc(run.runId)}">${esc(run.runId.length > 12 ? run.runId.slice(0, 12) + '...' : run.runId)}</span>
      <span class="process-id">${esc(run.processId)}</span>
      <span class="duration">${fmtDuration(run.duration)}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${progressPercent}%"></div>
      <span class="progress-text">${run.completedTasks}/${run.totalTasks} tasks</span>
    </div>
  </div>

  ${breakpointBanner}

  <!-- Main 3-Column Layout -->
  <div class="main-layout">

    <!-- Left: Pipeline -->
    <div class="pipeline-panel">
      <h3>Pipeline</h3>
      ${pipelineHtml || '<p class="no-data">No tasks yet</p>'}
    </div>

    <!-- Center: Task Detail -->
    <div class="task-detail-panel" id="task-detail">
      <div class="tab-bar">
        <button class="tab active" data-tab="overview">Overview</button>
        <button class="tab" data-tab="agent">Agent</button>
        <button class="tab" data-tab="logs">Logs</button>
        <button class="tab" data-tab="data">Data</button>
        <button class="tab" data-tab="breakpoint">Breakpoint</button>
      </div>
      <div class="tab-content" id="tab-content">
        <p class="placeholder">Select a task from the pipeline</p>
      </div>
    </div>

    <!-- Right: Event Stream -->
    <div class="event-stream-panel">
      <h3>Events (${run.events.length})</h3>
      <div class="event-list">
        ${eventsHtml || '<p class="no-data">No events yet</p>'}
      </div>
    </div>

  </div>

  <!-- Script -->
  <script nonce="${nonce}">
    (function() {
      const vscode = acquireVsCodeApi();
      let currentTask = null;
      let activeTab = 'overview';

      // ---------------------------------------------------------------
      // Task selection
      // ---------------------------------------------------------------
      window.selectTask = function(effectId) {
        document.querySelectorAll('.step-card').forEach(function(c) { c.classList.remove('selected'); });
        var el = document.querySelector('[data-effect-id="' + effectId + '"]');
        if (el) { el.classList.add('selected'); }
        vscode.postMessage({ type: 'selectTask', effectId: effectId });
      };

      // ---------------------------------------------------------------
      // Breakpoint approval
      // ---------------------------------------------------------------
      window.approveBreakpoint = function(effectId) {
        vscode.postMessage({ type: 'approveBreakpoint', effectId: effectId });
      };

      // ---------------------------------------------------------------
      // Tab switching
      // ---------------------------------------------------------------
      document.querySelectorAll('.tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
          tab.classList.add('active');
          activeTab = tab.getAttribute('data-tab');
          showTabContent(activeTab);
        });
      });

      // ---------------------------------------------------------------
      // Messages from extension host
      // ---------------------------------------------------------------
      window.addEventListener('message', function(event) {
        var msg = event.data;
        if (msg.type === 'taskDetail') {
          currentTask = msg.task;
          showTabContent(activeTab);
        } else if (msg.type === 'refresh') {
          // Extension will replace the full HTML
        }
      });

      // ---------------------------------------------------------------
      // Tab rendering
      // ---------------------------------------------------------------
      function showTabContent(tabName) {
        var el = document.getElementById('tab-content');
        if (!el) { return; }
        if (!currentTask) {
          el.innerHTML = '<p class="placeholder">Select a task from the pipeline</p>';
          return;
        }
        switch (tabName) {
          case 'overview': el.innerHTML = renderOverviewTab(currentTask); break;
          case 'agent': el.innerHTML = renderAgentTab(currentTask); break;
          case 'logs': el.innerHTML = renderLogsTab(currentTask); break;
          case 'data': el.innerHTML = renderDataTab(currentTask); break;
          case 'breakpoint': el.innerHTML = renderBreakpointTab(currentTask); break;
          default: el.innerHTML = renderOverviewTab(currentTask);
        }
      }

      function renderOverviewTab(task) {
        var rows = [
          gridRow('Title', escapeHtml(task.title || '-')),
          gridRow('Kind', '<span class="kind-badge">' + escapeHtml(task.kind || '-') + '</span>'),
          gridRow('Status', escapeHtml(task.status || '-')),
          gridRow('Effect ID', '<code>' + escapeHtml(task.effectId || '-') + '</code>'),
        ];
        if (task.taskId) { rows.push(gridRow('Task ID', escapeHtml(task.taskId))); }
        if (task.stepId) { rows.push(gridRow('Step ID', escapeHtml(task.stepId))); }
        if (task.invocationKey) { rows.push(gridRow('Inv. Key', '<code>' + escapeHtml(task.invocationKey) + '</code>')); }
        if (task.label) { rows.push(gridRow('Label', escapeHtml(task.label))); }
        if (task.requestedAt) { rows.push(gridRow('Requested', escapeHtml(task.requestedAt))); }
        if (task.resolvedAt) { rows.push(gridRow('Resolved', escapeHtml(task.resolvedAt))); }
        if (task.duration !== undefined && task.duration !== null) {
          rows.push(gridRow('Duration', formatDuration(task.duration)));
        }
        if (task.error) { rows.push(gridRow('Error', '<span style="color:var(--vscode-errorForeground,#f44336)">' + escapeHtml(task.error) + '</span>')); }

        return '<div class="detail-section"><h4>Task Overview</h4><div class="detail-grid">' + rows.join('') + '</div></div>';
      }

      function renderAgentTab(task) {
        if (!task.agent) {
          return '<p class="no-data">No agent information available for this task.</p>';
        }
        var rows = [
          gridRow('Agent Name', escapeHtml(task.agent.name || '-')),
        ];
        var html = '<div class="detail-section"><h4>Agent Information</h4><div class="detail-grid">' + rows.join('') + '</div></div>';
        if (task.agent.prompt) {
          html += '<div class="detail-section"><h4>Agent Prompt</h4><pre class="code-block">' + escapeHtml(formatJson(task.agent.prompt)) + '</pre></div>';
        }
        return html;
      }

      function renderLogsTab(task) {
        var html = '';
        if (task.stdout) {
          html += '<div class="detail-section"><h4>stdout</h4><pre class="code-block">' + escapeHtml(task.stdout) + '</pre></div>';
        }
        if (task.stderr) {
          html += '<div class="detail-section"><h4>stderr</h4><pre class="code-block" style="border-color:var(--vscode-charts-red,#d32f2f)">' + escapeHtml(task.stderr) + '</pre></div>';
        }
        if (!html) {
          html = '<p class="no-data">No logs available for this task.</p>';
        }
        return html;
      }

      function renderDataTab(task) {
        var html = '';
        if (task.input !== undefined && task.input !== null) {
          html += '<div class="detail-section"><h4>Input</h4><pre class="code-block">' + escapeHtml(formatJson(task.input)) + '</pre></div>';
        }
        if (task.result !== undefined && task.result !== null) {
          html += '<div class="detail-section"><h4>Result</h4><pre class="code-block">' + escapeHtml(formatJson(task.result)) + '</pre></div>';
        }
        if (task.taskDef !== undefined && task.taskDef !== null) {
          html += '<div class="detail-section"><h4>Task Definition</h4><pre class="code-block">' + escapeHtml(formatJson(task.taskDef)) + '</pre></div>';
        }
        if (!html) {
          html = '<p class="no-data">No data available for this task.</p>';
        }
        return html;
      }

      function renderBreakpointTab(task) {
        if (task.kind !== 'breakpoint') {
          return '<p class="no-data">This task is not a breakpoint.</p>';
        }
        var html = '<div class="detail-section"><h4>Breakpoint</h4>';
        if (task.breakpointQuestion) {
          html += '<p style="margin-bottom:12px;font-size:13px">' + escapeHtml(task.breakpointQuestion) + '</p>';
        }
        html += '<div class="detail-grid">';
        html += gridRow('Status', escapeHtml(task.status));
        html += gridRow('Effect ID', '<code>' + escapeHtml(task.effectId) + '</code>');
        html += '</div>';
        if (task.status === 'requested') {
          const safeId = escapeHtml(task.effectId);
          html += '<button class="bp-detail-approve" onclick="approveBreakpoint(&apos;' + safeId + '&apos;)">Approve Breakpoint</button>';
        }
        html += '</div>';
        return html;
      }

      // ---------------------------------------------------------------
      // Helpers
      // ---------------------------------------------------------------
      function gridRow(label, value) {
        return '<span class="detail-label">' + label + '</span><span class="detail-value">' + value + '</span>';
      }

      function escapeHtml(str) {
        if (str === null || str === undefined) { return ''; }
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      function formatJson(obj) {
        try { return JSON.stringify(obj, null, 2); }
        catch(e) { return String(obj); }
      }

      function formatDuration(ms) {
        if (ms === undefined || ms === null || ms < 0) { return '-'; }
        if (ms < 1000) { return '< 1s'; }
        var s = Math.floor(ms / 1000);
        var h = Math.floor(s / 3600);
        var m = Math.floor((s % 3600) / 60);
        var sec = s % 60;
        if (h > 0) { return m > 0 ? h + 'h ' + m + 'm' : h + 'h'; }
        if (m > 0) { return sec > 0 ? m + 'm ' + sec + 's' : m + 'm'; }
        return sec + 's';
      }
    })();
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Fragment builders
// ---------------------------------------------------------------------------

function buildStepCard(task: TaskEffect, index: number): string {
  const statusClass = `status-icon-${task.status}`;
  const dur = fmtDuration(task.duration);
  return `<div class="step-card" onclick="selectTask('${esc(task.effectId)}')" data-effect-id="${esc(task.effectId)}">
  <div class="step-number">${index + 1}</div>
  <div class="step-info">
    <div class="step-title">${esc(task.title || task.effectId)}</div>
    <div class="step-meta">
      <span class="kind-badge">${esc(task.kind)}</span>
      <span class="${statusClass}">${statusIcon(task.status)}</span>
      <span class="duration">${dur}</span>
    </div>
  </div>
</div>`;
}

function buildEventCard(evt: { type: string; ts: string; payload: Record<string, unknown>; seq: number }): string {
  return `<div class="event-card">
  <div class="event-header">
    <span class="event-icon">${eventIcon(evt.type)}</span>
    <span class="event-type">${esc(evt.type)}</span>
    <span class="event-time">${fmtTime(evt.ts)}</span>
  </div>
  <details><summary>Details</summary><pre>${esc(JSON.stringify(evt.payload, null, 2))}</pre></details>
</div>`;
}
