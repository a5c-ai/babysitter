'use strict';

/**
 * on-run-fail/logger.js
 * Minimal logger stub for the on-run-fail hook.
 * Fired when a codex run terminates with an error.
 */

module.exports = function onRunFailLogger(payload) {
  console.error('[hook:on-run-fail]', JSON.stringify(payload, null, 2));
};
