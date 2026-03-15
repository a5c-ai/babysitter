import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parseJournalDir, parseRunDir, getTaskDetail } from '../../lib/parser';
import { generateWebviewContent } from '../../panels/webview-content';

describe('unicode-special-chars edge cases', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unicode-test-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ---------------------------------------------------------------------------
  // Unicode in various fields
  // ---------------------------------------------------------------------------
  describe('unicode in run/task data', () => {
    it('handles unicode in runId', () => {
      const runDir = path.join(tmpDir, 'run-unicode');
      fs.mkdirSync(runDir, { recursive: true });

      const runId = 'run-测试-🚀-01';
      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId, processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.runId).toBe(runId);
    });

    it('handles unicode in processId', () => {
      const runDir = path.join(tmpDir, 'run-unicode-proc');
      fs.mkdirSync(runDir, { recursive: true });

      const processId = 'process-日本語-🎌';
      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'run-001', processId, createdAt: '2026-01-01T00:00:00Z' }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.processId).toBe(processId);
    });

    it('handles unicode in task titles', () => {
      const runDir = path.join(tmpDir, 'run-unicode-task');
      const journalDir = path.join(runDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'run-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      const title = 'Tâche: Déploiement en français 🇫🇷';
      fs.writeFileSync(
        path.join(journalDir, '000001.ULIDA.json'),
        JSON.stringify({
          type: 'EFFECT_REQUESTED',
          recordedAt: '2026-01-01T00:00:00Z',
          data: { effectId: 'eff-001', kind: 'node', title },
        }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.tasks).toHaveLength(1);
      expect(run!.tasks[0].title).toBe(title);
    });

    it('handles emoji in breakpoint questions', () => {
      const runDir = path.join(tmpDir, 'run-emoji-breakpoint');
      const journalDir = path.join(runDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'run-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      const question = '🚨 Do you approve deploying to production? 🚨';
      fs.writeFileSync(
        path.join(journalDir, '000001.ULIDA.json'),
        JSON.stringify({
          type: 'EFFECT_REQUESTED',
          recordedAt: '2026-01-01T00:00:00Z',
          data: { effectId: 'eff-bp-001', kind: 'breakpoint', title: question, question },
        }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.breakpointQuestion).toBe(question);
    });

    it('handles unicode in prompt/task descriptions', () => {
      const runDir = path.join(tmpDir, 'run-unicode-prompt');
      fs.mkdirSync(runDir, { recursive: true });

      const prompt = '任务：创建一个新的用户界面 🎨';
      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'run-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z', prompt }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.prompt).toBe(prompt);
    });

    it('handles right-to-left languages (Arabic, Hebrew)', () => {
      const runDir = path.join(tmpDir, 'run-rtl');
      const journalDir = path.join(runDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'run-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      const arabicTitle = 'مهمة: نشر التطبيق';
      const hebrewTitle = 'משימה: פריסת האפליקציה';

      fs.writeFileSync(
        path.join(journalDir, '000001.ULIDA.json'),
        JSON.stringify({
          type: 'EFFECT_REQUESTED',
          recordedAt: '2026-01-01T00:00:00Z',
          data: { effectId: 'eff-001', kind: 'node', title: arabicTitle },
        }),
      );

      fs.writeFileSync(
        path.join(journalDir, '000002.ULIDB.json'),
        JSON.stringify({
          type: 'EFFECT_REQUESTED',
          recordedAt: '2026-01-01T00:00:01Z',
          data: { effectId: 'eff-002', kind: 'node', title: hebrewTitle },
        }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.tasks).toHaveLength(2);
      expect(run!.tasks[0].title).toBe(arabicTitle);
      expect(run!.tasks[1].title).toBe(hebrewTitle);
    });

    it('handles zero-width characters and combining marks', () => {
      const runDir = path.join(tmpDir, 'run-zwj');
      const journalDir = path.join(runDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'run-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      // Title with zero-width joiner and combining marks
      const title = 'Task: é̃ with combining marks';

      fs.writeFileSync(
        path.join(journalDir, '000001.ULIDA.json'),
        JSON.stringify({
          type: 'EFFECT_REQUESTED',
          recordedAt: '2026-01-01T00:00:00Z',
          data: { effectId: 'eff-001', kind: 'node', title },
        }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.tasks).toHaveLength(1);
      expect(run!.tasks[0].title).toContain('combining marks');
    });
  });

  // ---------------------------------------------------------------------------
  // Special characters that need escaping
  // ---------------------------------------------------------------------------
  describe('special characters requiring escaping', () => {
    it('handles HTML special characters in task titles', () => {
      const runDir = path.join(tmpDir, 'run-html-chars');
      const journalDir = path.join(runDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'run-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      const title = '<script>alert("xss")</script> & "quotes" & \'apostrophes\'';
      fs.writeFileSync(
        path.join(journalDir, '000001.ULIDA.json'),
        JSON.stringify({
          type: 'EFFECT_REQUESTED',
          recordedAt: '2026-01-01T00:00:00Z',
          data: { effectId: 'eff-001', kind: 'node', title },
        }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.tasks[0].title).toBe(title);
    });

    it('handles SQL injection-like strings', () => {
      const runDir = path.join(tmpDir, 'run-sql-like');
      const journalDir = path.join(runDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'run-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      const title = "'; DROP TABLE tasks; --";
      fs.writeFileSync(
        path.join(journalDir, '000001.ULIDA.json'),
        JSON.stringify({
          type: 'EFFECT_REQUESTED',
          recordedAt: '2026-01-01T00:00:00Z',
          data: { effectId: 'eff-001', kind: 'node', title },
        }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.tasks[0].title).toBe(title);
    });

    it('handles newlines and special whitespace', () => {
      const runDir = path.join(tmpDir, 'run-newlines');
      const journalDir = path.join(runDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'run-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      const title = 'Task:\nMultiline\r\nDescription\t\twith\ttabs';
      fs.writeFileSync(
        path.join(journalDir, '000001.ULIDA.json'),
        JSON.stringify({
          type: 'EFFECT_REQUESTED',
          recordedAt: '2026-01-01T00:00:00Z',
          data: { effectId: 'eff-001', kind: 'node', title },
        }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.tasks[0].title).toBe(title);
    });

    it('handles backslashes and escaped characters', () => {
      const runDir = path.join(tmpDir, 'run-backslashes');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });

      const title = 'Path: C:\\Users\\Test\\Documents\\file.txt';
      fs.writeFileSync(
        path.join(taskDir, 'task.json'),
        JSON.stringify({ kind: 'node', title }),
      );

      const detail = getTaskDetail(runDir, 'eff-001');
      expect(detail).not.toBeNull();
      expect(detail!.title).toBe(title);
    });
  });

  // ---------------------------------------------------------------------------
  // HTML escaping in webview
  // ---------------------------------------------------------------------------
  describe('HTML escaping in webview content', () => {
    it('escapes HTML tags in task titles for webview', () => {
      const run = {
        runId: 'run-001',
        processId: 'proc-001',
        status: 'waiting' as const,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:01Z',
        tasks: [
          {
            effectId: 'eff-001',
            kind: 'node' as const,
            title: '<script>alert("xss")</script>',
            status: 'requested' as const,
          },
        ],
        events: [],
        totalTasks: 1,
        completedTasks: 0,
        failedTasks: 0,
        isStale: false,
      };

      const html = generateWebviewContent(run, 'nonce123', 'csp-source');

      // Should not contain raw script tags
      expect(html).not.toContain('<script>alert("xss")</script>');
      // Should contain escaped version
      expect(html).toContain('&lt;script&gt;');
    });

    it('escapes quotes in task titles for webview', () => {
      const run = {
        runId: 'run-001',
        processId: 'proc-001',
        status: 'waiting' as const,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:01Z',
        tasks: [
          {
            effectId: 'eff-001',
            kind: 'node' as const,
            title: 'Task with "quotes" and \'apostrophes\'',
            status: 'requested' as const,
          },
        ],
        events: [],
        totalTasks: 1,
        completedTasks: 0,
        failedTasks: 0,
        isStale: false,
      };

      const html = generateWebviewContent(run, 'nonce123', 'csp-source');

      // Should escape quotes in onclick attributes
      expect(html).toContain('&quot;');
    });

    it('escapes breakpoint questions for webview', () => {
      const run = {
        runId: 'run-001',
        processId: 'proc-001',
        status: 'waiting' as const,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:01Z',
        tasks: [
          {
            effectId: 'eff-bp-001',
            kind: 'breakpoint' as const,
            title: '<b>Approve</b> deployment?',
            status: 'requested' as const,
            breakpointQuestion: '<b>Approve</b> deployment?',
          },
        ],
        events: [],
        totalTasks: 1,
        completedTasks: 0,
        failedTasks: 0,
        breakpointQuestion: '<b>Approve</b> deployment?',
        breakpointEffectId: 'eff-bp-001',
        waitingKind: 'breakpoint' as const,
        isStale: false,
      };

      const html = generateWebviewContent(run, 'nonce123', 'csp-source');

      // Should not render HTML tags from question
      expect(html).not.toContain('<b>Approve</b>');
      expect(html).toContain('&lt;b&gt;Approve&lt;/b&gt;');
    });

    it('handles ampersands correctly in webview', () => {
      const run = {
        runId: 'run-001',
        processId: 'proc-001',
        status: 'waiting' as const,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:01Z',
        tasks: [
          {
            effectId: 'eff-001',
            kind: 'node' as const,
            title: 'Build & Deploy & Test',
            status: 'requested' as const,
          },
        ],
        events: [],
        totalTasks: 1,
        completedTasks: 0,
        failedTasks: 0,
        isStale: false,
      };

      const html = generateWebviewContent(run, 'nonce123', 'csp-source');

      // Should escape ampersands
      expect(html).toContain('&amp;');
    });

    it('handles Unicode characters safely in webview', () => {
      const run = {
        runId: 'run-测试-01',
        processId: 'proc-🚀',
        status: 'waiting' as const,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:01Z',
        tasks: [
          {
            effectId: 'eff-001',
            kind: 'node' as const,
            title: 'タスク: デプロイ 🎌',
            status: 'requested' as const,
          },
        ],
        events: [],
        totalTasks: 1,
        completedTasks: 0,
        failedTasks: 0,
        isStale: false,
      };

      const html = generateWebviewContent(run, 'nonce123', 'csp-source');

      // Unicode should be preserved (not double-encoded)
      expect(html).toContain('run-测试-01');
      expect(html).toContain('proc-🚀');
      expect(html).toContain('タスク: デプロイ 🎌');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases with stdout/stderr
  // ---------------------------------------------------------------------------
  describe('unicode in stdout/stderr', () => {
    it('handles unicode in stdout.txt', () => {
      const runDir = path.join(tmpDir, 'run-unicode-stdout');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });

      fs.writeFileSync(
        path.join(taskDir, 'task.json'),
        JSON.stringify({ kind: 'node', title: 'Test' }),
      );

      const stdout = '成功: ファイルをダウンロードしました 📥\nSuccess: Downloaded file 🎉';
      fs.writeFileSync(path.join(taskDir, 'stdout.txt'), stdout);

      const detail = getTaskDetail(runDir, 'eff-001');
      expect(detail).not.toBeNull();
      expect(detail!.stdout).toBe(stdout);
    });

    it('handles unicode in stderr.txt', () => {
      const runDir = path.join(tmpDir, 'run-unicode-stderr');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });

      fs.writeFileSync(
        path.join(taskDir, 'task.json'),
        JSON.stringify({ kind: 'node', title: 'Test' }),
      );

      const stderr = 'エラー: ファイルが見つかりません ❌\nError: File not found 🚨';
      fs.writeFileSync(path.join(taskDir, 'stderr.txt'), stderr);

      const detail = getTaskDetail(runDir, 'eff-001');
      expect(detail).not.toBeNull();
      expect(detail!.stderr).toBe(stderr);
    });

    it('handles mixed encodings in logs', () => {
      const runDir = path.join(tmpDir, 'run-mixed-encoding');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });

      fs.writeFileSync(
        path.join(taskDir, 'task.json'),
        JSON.stringify({ kind: 'node', title: 'Test' }),
      );

      const stdout = 'ASCII text\n中文文本\nРусский текст\nالنص العربي\n🎨🚀🎉';
      fs.writeFileSync(path.join(taskDir, 'stdout.txt'), stdout);

      const detail = getTaskDetail(runDir, 'eff-001');
      expect(detail).not.toBeNull();
      expect(detail!.stdout).toContain('ASCII text');
      expect(detail!.stdout).toContain('中文文本');
      expect(detail!.stdout).toContain('Русский текст');
      expect(detail!.stdout).toContain('النص العربي');
      expect(detail!.stdout).toContain('🎨🚀🎉');
    });
  });
});
