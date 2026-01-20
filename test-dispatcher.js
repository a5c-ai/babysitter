// Test the TypeScript hook dispatcher
const { callHook } = require('./packages/sdk/dist/hooks/dispatcher.js');

async function test() {
  console.log('Testing callHook...');

  try {
    const result = await callHook({
      hookType: 'on-run-start',
      payload: {
        runId: 'test-dispatcher-456',
        processId: 'test/process',
        entry: 'test.js#main',
        timestamp: new Date().toISOString(),
      },
      cwd: process.cwd(),
      timeout: 10000,
    });

    console.log('Hook result:', JSON.stringify(result, null, 2));
    console.log('Success! Hook was called.');
  } catch (error) {
    console.error('Error calling hook:', error);
  }
}

test();
