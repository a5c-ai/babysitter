import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

function readWorkspaceFile(relPath: string): string {
  const root = path.resolve(__dirname, '..', '..');
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

suite('Run Details webview template', () => {
  test('wires Work Summaries preview to loadTextFile and renders textFile responses', () => {
    const source = readWorkspaceFile('src/extension/runDetailsView.ts');

    assert.ok(source.includes('Work Summaries'), 'expected Work Summaries section label');
    assert.ok(source.includes('id="workList"'), 'expected Work Summaries list container');
    assert.ok(source.includes('id="workPreview"'), 'expected Work Summaries preview container');
    assert.ok(source.includes('Prompts'), 'expected Prompts section label');
    assert.ok(source.includes('id="promptList"'), 'expected Prompts list container');
    assert.ok(source.includes('code/main.js'), 'expected main.js section label');
    assert.ok(source.includes('id="mainJsPreviewPre"'), 'expected main.js preview container');

    assert.ok(
      source.includes("{ type: 'loadTextFile'") || source.includes('{ type: "loadTextFile"'),
      'expected Preview button to postMessage type loadTextFile',
    );
    assert.ok(
      source.includes("msg.type === 'textFile'") || source.includes('msg.type === "textFile"'),
      'expected webview to handle textFile responses',
    );
    assert.ok(source.includes('(truncated)'), 'expected preview to surface truncation hint');
  });

  test('includes a Key files panel with a filter input', () => {
    const source = readWorkspaceFile('src/extension/runDetailsView.ts');

    assert.ok(source.includes('Key files'), 'expected Key files section label');
    assert.ok(source.includes('id="keyFilesFilter"'), 'expected Key files filter input');
    assert.ok(source.includes('pinnedIdsByRunId'), 'expected pinned-file persistence hook');
    assert.ok(
      source.includes('id="keyFilesRevealRun"'),
      'expected run-folder Reveal action in empty/error states',
    );
    assert.ok(
      source.includes('id="keyFilesCopyRun"'),
      'expected run-folder Copy path action in empty/error states',
    );
    assert.ok(source.includes('Copy contents'), 'expected Copy contents quick action label');
    assert.ok(source.includes('Save as...'), 'expected Save as quick action label');
    assert.ok(
      source.includes("{ type: 'copyFileContents'") ||
        source.includes('{ type: "copyFileContents"'),
      'expected Copy contents action to postMessage type copyFileContents',
    );
    assert.ok(
      source.includes("{ type: 'saveFileAs'") || source.includes('{ type: "saveFileAs"'),
      'expected Save as action to postMessage type saveFileAs',
    );
  });

  test('keeps an active work-summary preview open across snapshot refreshes', () => {
    const source = readWorkspaceFile('src/extension/runDetailsView.ts');

    assert.ok(
      /activeWorkPreviewFsPath/.test(source),
      'expected webview to track active work-summary preview fsPath',
    );
    assert.ok(
      /msg\.fsPath\s*===\s*activeWorkPreviewFsPath/.test(source),
      'expected textFile handler to apply updates only when fsPath matches active preview',
    );
  });

  test('renders empty and completion states for work-summary previews', () => {
    const source = readWorkspaceFile('src/extension/runDetailsView.ts');

    assert.ok(
      /latestRunStatus/.test(source),
      'expected webview to track latest run status for preview suffixes',
    );
    assert.ok(
      source.includes('No work summary output yet') || source.includes('No work summary output'),
      'expected work-summary preview to show an empty placeholder',
    );
    assert.ok(
      source.includes('Run finished') || source.includes('run finished'),
      'expected work-summary preview to surface completion status',
    );
  });

  test('renders a single process summary preview without Mermaid hooks', () => {
    const source = readWorkspaceFile('src/extension/runDetailsView.ts');

    assert.ok(
      source.includes('id="processSummaryPill"'),
      'expected process summary pill identifier',
    );
    assert.ok(
      source.includes('id="processSummaryPreview"'),
      'expected process summary preview container',
    );
    assert.ok(
      !source.includes('processMermaid'),
      'expected process.mermaid.md UI to be removed',
    );
    assert.ok(
      !/process\\.mermaid\\.md/i.test(source),
      'expected no references to process.mermaid.md',
    );
  });
});
