import type { AdaptOutputOptions, AdaptedOutput } from './types';
import type { AdapterCapabilities } from '../types/adapter';

/**
 * Fields that require specific adapter capabilities.
 */
const CAPABILITY_FIELD_MAP: Record<string, (caps: AdapterCapabilities) => boolean> = {
  toolMutation: (caps) => caps.supportsToolInputMutation || caps.supportsToolResultMutation,
  decision: (caps) => caps.supportsBlock,
  watchPaths: () => false,
};

/**
 * Adapt a merged execution result to a harness-native output format.
 *
 * Checks adapter capabilities to determine which output fields are supported,
 * strips unsupported fields, and tracks degradation.
 */
export function adaptOutput(options: AdaptOutputOptions): AdaptedOutput {
  const { mergedResult, capabilities } = options;

  const output: Record<string, unknown> = {};
  const degradedFields: string[] = [];

  // Only include decision when it carries a meaningful value
  if (mergedResult.decision !== 'noop' && mergedResult.decision !== 'continue') {
    output['decision'] = mergedResult.decision;
  }

  if (mergedResult.reason) {
    output['reason'] = mergedResult.reason;
  }

  if (Object.keys(mergedResult.persistEnv).length > 0) {
    output['persistEnv'] = mergedResult.persistEnv;
  }

  if (mergedResult.unsetEnv.length > 0) {
    output['unsetEnv'] = mergedResult.unsetEnv;
  }

  if (Object.keys(mergedResult.contextVars).length > 0) {
    output['contextVars'] = mergedResult.contextVars;
  }

  if (mergedResult.additionalContext) {
    if (capabilities.supportsNativeAdditionalContext) {
      output['additionalContext'] = mergedResult.additionalContext;
    } else {
      degradedFields.push('additionalContext');
    }
  }

  if (mergedResult.systemMessage) {
    output['systemMessage'] = mergedResult.systemMessage;
  }

  if (mergedResult.continueSession) {
    output['continue'] = mergedResult.continueSession;
  }

  if (mergedResult.stopReason) {
    output['stopReason'] = mergedResult.stopReason;
  }

  if (mergedResult.suppressOutput) {
    output['suppressOutput'] = mergedResult.suppressOutput;
  }

  if (mergedResult.followUpMessage) {
    output['followUpMessage'] = mergedResult.followUpMessage;
  }

  if (Object.keys(mergedResult.metadata).length > 0) {
    output['metadata'] = mergedResult.metadata;
  }

  // Conditionally include capability-gated fields
  if (mergedResult.toolMutation) {
    if (CAPABILITY_FIELD_MAP['toolMutation'](capabilities)) {
      output['toolMutation'] = mergedResult.toolMutation;
    } else {
      degradedFields.push('toolMutation');
    }
  }

  const watchPaths = (mergedResult as unknown as { watchPaths?: unknown }).watchPaths;
  if (watchPaths !== undefined) {
    degradedFields.push('watchPaths');
  }

  // Decision/blocking support check
  if (output['decision'] && !CAPABILITY_FIELD_MAP['decision'](capabilities)) {
    degradedFields.push('decision');
    delete output['decision'];
  }

  return { output, degradedFields };
}
