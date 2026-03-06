'use strict';

/**
 * on-run-complete/logger.js
 * Minimal logger stub for the on-run-complete hook.
 * Fired when a codex run finishes successfully.
 */

module.exports = function onRunCompleteLogger(payload) {
  console.log('[hook:on-run-complete]', JSON.stringify(payload, null, 2));
};
