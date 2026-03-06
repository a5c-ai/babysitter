'use strict';

/**
 * on-run-start/logger.js
 * Minimal logger stub for the on-run-start hook.
 * Fired when a new codex run begins.
 */

module.exports = function onRunStartLogger(payload) {
  console.log('[hook:on-run-start]', JSON.stringify(payload, null, 2));
};
