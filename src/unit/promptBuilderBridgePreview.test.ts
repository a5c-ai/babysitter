import * as assert from 'assert';

import {
  PromptBuilderBridge,
  type PromptBuilderWebviewLike,
} from '../extension/promptBuilderBridge';

function makeWebview(): { webview: PromptBuilderWebviewLike; messages: unknown[] } {
  const messages: unknown[] = [];
  return {
    messages,
    webview: {
      postMessage: (message: unknown) => {
        messages.push(message);
        return true;
      },
    },
  };
}

suite('PromptBuilderBridge prompt preview', () => {
  test('previewPrompt responds with a trimmed promptPreview', async () => {
    const { webview, messages } = makeWebview();
    const bridge = new PromptBuilderBridge({ webview, workspaceRoot: process.cwd() });

    const handled = await bridge.handleMessage({ type: 'previewPrompt', text: '  hello  ' });
    assert.strictEqual(handled, true);
    assert.deepStrictEqual(messages, [{ type: 'promptPreview', text: 'hello' }]);
  });

  test('previewDispatch responds with a trimmed dispatchPreview', async () => {
    const { webview, messages } = makeWebview();
    const bridge = new PromptBuilderBridge({ webview, workspaceRoot: process.cwd() });

    const handled = await bridge.handleMessage({ type: 'previewDispatch', prompt: '  hello  ' });
    assert.strictEqual(handled, true);
    assert.deepStrictEqual(messages, [{ type: 'dispatchPreview', text: 'hello' }]);
  });

  test('previewPrompt posts status when the prompt is empty', async () => {
    const { webview, messages } = makeWebview();
    const bridge = new PromptBuilderBridge({ webview, workspaceRoot: process.cwd() });

    const handled = await bridge.handleMessage({ type: 'previewPrompt', text: '\n\t' });
    assert.strictEqual(handled, true);
    assert.deepStrictEqual(messages, [{ type: 'status', text: 'Prompt is empty.' }]);
  });
});
