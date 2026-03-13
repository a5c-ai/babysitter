'use strict';

/**
 * on-task-start/logger.js
 * Minimal logger stub for the on-task-start hook.
 * Fired when an individual task begins execution.
 */

module.exports = function onTaskStartLogger(payload) {
  console.log('[hook:on-task-start]', JSON.stringify(payload, null, 2));
};
