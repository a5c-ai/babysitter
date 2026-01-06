import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

function readWorkspaceFile(relPath: string): string {
  const root = path.resolve(__dirname, '..', '..');
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

suite('Prompt Builder webview template', () => {
  test('includes a Preview button wired to previewPrompt', () => {
    const source = readWorkspaceFile('src/extension/promptBuilderView.ts');
    assert.ok(source.includes('id="preview"'), 'expected Preview button id="preview"');
    assert.ok(
      source.includes("{ type: 'previewPrompt'") || source.includes("{ type: 'previewPrompt'"),
      'expected webview to postMessage type previewPrompt',
    );
  });

  test('preview click posts the current composed prompt output', () => {
    const source = readWorkspaceFile('src/extension/promptBuilderView.ts');
    assert.ok(
      /els\.preview\.addEventListener\([\s\S]*?['"]click['"][\s\S]*?vscode\.postMessage\([\s\S]*?type:\s*['"]previewPrompt['"][\s\S]*?text:\s*els\.output\.value[\s\S]*?\)/.test(
        source,
      ),
      'expected preview click handler to post previewPrompt with els.output.value',
    );
  });

  test('includes a preview overlay that renders promptPreview responses', () => {
    const source = readWorkspaceFile('src/extension/promptBuilderView.ts');
    assert.ok(source.includes('id="previewOverlay"'), 'expected preview overlay container');
    assert.ok(source.includes('id="previewText"'), 'expected preview text container');
    assert.ok(
      source.includes("msg.type === 'promptPreview'") ||
        source.includes('msg.type === "promptPreview"'),
      'expected webview to handle promptPreview responses',
    );
  });

  test('opens the preview overlay with the latest promptPreview content', () => {
    const source = readWorkspaceFile('src/extension/promptBuilderView.ts');
    assert.ok(
      /function openPreview\([\s\S]*?previewText\.textContent\s*=\s*text[\s\S]*?previewOverlay\.classList\.add\([\s\S]*?['"]open['"][\s\S]*?\)/.test(
        source,
      ),
      'expected openPreview() to set preview text and open the overlay',
    );
    assert.ok(
      /msg\.type\s*===\s*['"]promptPreview['"][\s\S]*?openPreview\([\s\S]*?msg\.text[\s\S]*?\)/.test(
        source,
      ),
      'expected promptPreview messages to call openPreview(msg.text)',
    );
  });

  test('regenerates the composed prompt when inputs change', () => {
    const source = readWorkspaceFile('src/extension/promptBuilderView.ts');

    assert.ok(
      source.includes("els.request.addEventListener('input'") ||
        source.includes('els.request.addEventListener("input"'),
      'expected request input listener',
    );
    assert.ok(
      source.includes('els.request.addEventListener') && source.includes('scheduleGenerate();'),
    );

    assert.ok(
      source.includes("input.addEventListener('input'") ||
        source.includes('input.addEventListener("input"'),
      'expected param input listener(s)',
    );

    assert.ok(
      source.includes("type: 'generate'") || source.includes('type: "generate"'),
      'expected webview to post generate messages',
    );
    assert.ok(
      source.includes('request: els.request.value') &&
        source.includes('attachments: state.attachments.slice()'),
      'expected generate payload to use current request + attachments',
    );

    assert.ok(
      source.includes("if (msg.type === 'prompt'") || source.includes('if (msg.type === "prompt"'),
      'expected prompt response handler',
    );
    assert.ok(
      source.includes('els.output.value = state.lastPrompt'),
      'expected prompt response to update composed prompt output',
    );
  });
});
