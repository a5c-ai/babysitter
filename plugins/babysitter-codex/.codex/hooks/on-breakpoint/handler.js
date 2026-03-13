'use strict';

/**
 * on-breakpoint/handler.js
 * Minimal handler stub for the on-breakpoint hook.
 * Fired when the agent reaches a designated breakpoint (e.g., for inspection or pause).
 */

module.exports = function onBreakpointHandler(payload) {
  console.log('[hook:on-breakpoint]', JSON.stringify(payload, null, 2));
};
