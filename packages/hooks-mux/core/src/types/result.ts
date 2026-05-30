/**
 * The unified result returned by hook handlers after processing
 * a UnifiedHookEvent.
 *
 * Spec section 11.  All output fields are typed top-level fields,
 * NOT stored in a generic data bag.
 */
export interface UnifiedHookResult {
  decision?: 'allow' | 'deny' | 'block' | 'retry' | 'ask' | 'defer' | 'continue' | 'noop';
  reason?: string;
  systemMessage?: string;
  additionalContext?: string;
  followUpMessage?: string;
  continueSession?: boolean;
  stopReason?: string;
  suppressOutput?: boolean;
  sessionTitle?: string;
  reloadSkills?: boolean;
  displayContent?: string;

  toolMutation?: {
    mode: 'replace' | 'patch';
    value: unknown;
  };

  persistEnv?: Record<string, string>;
  unsetEnv?: string[];
  contextVars?: Record<string, string>;

  metadata?: Record<string, unknown>;
}
