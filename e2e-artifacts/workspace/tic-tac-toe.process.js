/**
 * @process tic-tac-toe-builder
 * @description Build a modern tic-tac-toe game with HTML/JS
 * @inputs { prompt: string }
 * @outputs { status: string, files: array, message: string }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Task: Build the game files
const buildGameTask = defineTask('build-game', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build tic-tac-toe game with modern UI',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Expert web developer specializing in modern UI/UX',
      task: args.prompt,
      context: {
        requirements: [
          'Create HTML file with modern, responsive design',
          'Create JavaScript file with game logic',
          'Add CSS for modern styling with animations and transitions',
          'Include modern game mechanics and interactions',
          'Ensure clean, maintainable code structure'
        ]
      },
      instructions: [
        'Create index.html with semantic HTML5 structure',
        'Implement game.js with tic-tac-toe logic',
        'Style with modern CSS including animations, gradients, shadows',
        'Add smooth transitions and hover effects',
        'Make it responsive for mobile and desktop',
        'Include win detection and game reset functionality',
        'Test that the game works correctly',
        'Return ONLY the JSON result in the exact format specified in outputFormat'
      ],
      outputFormat: 'JSON object with: { status: "success"|"failed", files: ["list of created files"], message: "summary of what was created" }'
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['success', 'failed'] },
        files: { type: 'array', items: { type: 'string' } },
        message: { type: 'string' }
      },
      required: ['status', 'files', 'message']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Task: Verify the implementation
const verifyGameTask = defineTask('verify-game', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify tic-tac-toe game implementation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer',
      task: 'Verify that the tic-tac-toe game was created correctly',
      context: {
        createdFiles: args.files,
        requirements: [
          'Files exist and are properly formatted',
          'HTML structure is semantic and valid',
          'JavaScript includes game logic',
          'CSS includes modern styling with animations',
          'Game is functional and playable'
        ]
      },
      instructions: [
        'Read and verify all created files exist',
        'Check HTML structure is valid and semantic',
        'Verify JavaScript has complete game logic',
        'Confirm CSS has modern styling with transitions/animations',
        'Ensure game mechanics work correctly',
        'Verify responsive design elements are present',
        'Return ONLY the JSON result in the exact format specified in outputFormat'
      ],
      outputFormat: 'JSON: { status: "success"|"failed", verified: true|false, issues: ["list of any issues found"], message: "verification summary" }'
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['success', 'failed'] },
        verified: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        message: { type: 'string' }
      },
      required: ['status', 'verified', 'message']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

/**
 * Main process function
 */
export async function process(inputs, ctx) {
  const { prompt } = inputs;

  // Build the game
  const buildResult = await ctx.task(buildGameTask, { prompt });

  if (buildResult.status !== 'success') {
    return {
      status: 'failed',
      files: [],
      message: `Failed to build game: ${buildResult.message || 'Unknown error'}`
    };
  }

  // Verify the implementation
  const verifyResult = await ctx.task(verifyGameTask, { files: buildResult.files });

  return {
    status: verifyResult.verified ? 'success' : 'failed',
    files: buildResult.files,
    message: `Game creation ${verifyResult.verified ? 'completed successfully' : 'completed with issues'}. ${verifyResult.message}`
  };
}
