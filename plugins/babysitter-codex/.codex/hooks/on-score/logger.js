'use strict';

/**
 * on-score/logger.js
 * Minimal logger stub for the on-score hook.
 * Fired when an evaluation score is produced for a run or task.
 */

module.exports = function onScoreLogger(payload) {
  console.log('[hook:on-score]', JSON.stringify(payload, null, 2));
};
