import type { AgentMuxClient } from '@a5c-ai/agent-mux-core';

import type { ParsedArgs } from '../../parse-args.js';
import type { FlagDef } from '../../parse-args.js';
import { flagBool } from '../../parse-args.js';
import { ExitCode } from '../../exit-codes.js';
import { printError, printJsonError } from '../../output.js';
import { serveGatewayCommand } from './serve.js';
import { gatewayStatusCommand } from './status.js';
import { gatewayTokensCommand } from './tokens.js';

export const GATEWAY_FLAGS: Record<string, FlagDef> = {
  'config': { type: 'string' },
  'host': { type: 'string' },
  'port': { type: 'number' },
  'webui': { type: 'string' },
  'no-webui': { type: 'boolean' },
  'url': { type: 'string' },
  'name': { type: 'string' },
  'ttl-ms': { type: 'number' },
  'qr': { type: 'boolean' },
  'id': { type: 'string' },
};

export async function gatewayCommand(_client: AgentMuxClient, args: ParsedArgs): Promise<number> {
  const sub = args.subcommand;
  const jsonMode = flagBool(args.flags, 'json') === true;

  if (sub === 'serve') {
    return await serveGatewayCommand(args);
  }
  if (sub === 'status') {
    return await gatewayStatusCommand(args);
  }
  if (sub === 'tokens') {
    return await gatewayTokensCommand(args);
  }

  if (jsonMode) {
    printJsonError('VALIDATION_ERROR', 'Missing subcommand. Available: serve, tokens, status');
  } else {
    printError('Missing subcommand. Available: serve, tokens, status');
  }
  return ExitCode.USAGE_ERROR;
}
