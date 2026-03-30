/**
 * @process specializations/common-utilities/docx-conversion
 * @description Reusable HTML-to-DOCX conversion task using pandoc with graceful fallback
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Convert an HTML file to DOCX using pandoc.
 * Gracefully falls back if pandoc is not installed.
 * 
 * @param {object} args
 * @param {string} args.htmlPath - Path to the source HTML file
 * @param {string} args.docxPath - Path to the output DOCX file
 */
export const convertToDocxTask = defineTask('convert-to-docx', (args, taskCtx) => ({
  kind: 'shell',
  title: `Convert ${args.htmlPath?.split('/').pop() || 'HTML'} to DOCX`,
  shell: {
    command: [
      'if command -v pandoc &> /dev/null; then',
      `  pandoc "${args.htmlPath}" -o "${args.docxPath}" --from html --to docx`,
      `  && echo '{"success": true, "path": "${args.docxPath}", "converter": "pandoc"}'`,
      'else',
      `  echo '{"success": false, "path": "${args.htmlPath}", "reason": "pandoc not installed, HTML file is the output", "converter": "none"}'`,
      'fi'
    ].join(' ')
  },
  io: {
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

export default convertToDocxTask;
