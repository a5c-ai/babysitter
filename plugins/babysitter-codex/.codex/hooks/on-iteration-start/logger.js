'use strict';

/**
 * on-iteration-start/logger.js
 * Minimal logger stub for the on-iteration-start hook.
 * Fired at the beginning of each agent iteration loop.
 */

module.exports = function onIterationStartLogger(payload) {
  console.log('[hook:on-iteration-start]', JSON.stringify(payload, null, 2));
};
