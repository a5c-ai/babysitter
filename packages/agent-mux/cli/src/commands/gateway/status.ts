import type { ParsedArgs } from '../../parse-args.js';
import { flagBool, flagStr } from '../../parse-args.js';
import { ExitCode } from '../../exit-codes.js';
import { printError, printJsonOk, printKeyValue } from '../../output.js';

export async function gatewayStatusCommand(args: ParsedArgs): Promise<number> {
  const url = (flagStr(args.flags, 'url') ?? 'http://127.0.0.1:7878').replace(/\/+$/, '');
  const response = await fetch(`${url}/healthz`);
  if (!response.ok) {
    printError(`Gateway health check failed: ${response.status}`);
    return ExitCode.GENERAL_ERROR;
  }

  const payload = await response.json() as Record<string, unknown>;
  if (flagBool(args.flags, 'json') === true) {
    printJsonOk(payload);
    return ExitCode.SUCCESS;
  }

  printKeyValue([
    ['URL:', url],
    ['OK:', String(payload['ok'])],
    ['Version:', String(payload['serverVersion'] ?? '--')],
    ['Time:', String(payload['serverTime'] ?? '--')],
  ]);
  return ExitCode.SUCCESS;
}
