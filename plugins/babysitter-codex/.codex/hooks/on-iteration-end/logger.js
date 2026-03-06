'use strict';

/**
 * on-iteration-end/logger.js
 * Minimal logger stub for the on-iteration-end hook.
 * Fired at the end of each agent iteration loop.
 */

module.exports = function onIterationEndLogger(payload) {
  console.log('[hook:on-iteration-end]', JSON.stringify(payload, null, 2));
};
