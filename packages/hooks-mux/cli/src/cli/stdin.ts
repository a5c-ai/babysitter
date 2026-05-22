/**
 * Stdin reading utility.
 */

/**
 * Read all of stdin as a string.
 * Returns empty string if stdin is a TTY (interactive terminal).
 */
export function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stdin = process.stdin;

    if (stdin.isTTY) {
      resolve('');
      return;
    }

    stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
    stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stdin.on('error', reject);
  });
}
