'use strict';

/**
 * on-task-complete/logger.js
 * Minimal logger stub for the on-task-complete hook.
 * Fired when an individual task finishes successfully.
 */

module.exports = function onTaskCompleteLogger(payload) {
  console.log('[hook:on-task-complete]', JSON.stringify(payload, null, 2));
};
