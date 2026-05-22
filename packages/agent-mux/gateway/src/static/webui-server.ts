import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

function existingDirectory(candidates: string[]): string | null {
  for (const candidate of candidates) {
    try {
      if (fsSync.statSync(candidate).isDirectory()) {
        return candidate;
      }
    } catch {
      // Ignore missing candidates.
    }
  }
  return null;
}

function defaultWebuiRoot(): string | null {
  const candidates: string[] = [];

  try {
    const resolved = require.resolve('@a5c-ai/agent-mux-webui/package.json');
    candidates.push(path.join(path.dirname(resolved), 'dist'));
  } catch {
    // Fall back to local workspace paths.
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  candidates.push(path.resolve(moduleDir, '../../../webui/dist'));
  candidates.push(path.resolve(process.cwd(), 'packages/agent-mux/webui/dist'));

  return existingDirectory(candidates);
}

export function resolveWebuiRoot(configuredRoot: string | null | undefined): string | null {
  if (configuredRoot == null) {
    return defaultWebuiRoot();
  }
  return path.extname(configuredRoot) ? path.dirname(configuredRoot) : configuredRoot;
}

function mimeTypeFor(filePath: string): string {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

async function fileResponse(filePath: string): Promise<Response> {
  const body = await fs.readFile(filePath);
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': mimeTypeFor(filePath),
      'cache-control': 'no-cache',
    },
  });
}

export async function serveWebuiRequest(
  requestPath: string,
  webuiRoot: string | null,
): Promise<Response | null> {
  if (!webuiRoot) {
    return new Response(
      'agent-mux webui is not installed. Install @a5c-ai/agent-mux-webui or pass --webui /path/to/dist.',
      { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } },
    );
  }

  const normalized = requestPath === '/' ? '/index.html' : requestPath;
  const safeRelative = normalized.replace(/^\/+/, '');
  const resolved = path.resolve(webuiRoot, safeRelative);
  const rootResolved = path.resolve(webuiRoot);
  if (!resolved.startsWith(rootResolved)) {
    return new Response('Not Found', { status: 404 });
  }

  try {
    const stat = await fs.stat(resolved);
    if (stat.isDirectory()) {
      return await fileResponse(path.join(resolved, 'index.html'));
    }
    return await fileResponse(resolved);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  try {
    return await fileResponse(path.join(rootResolved, 'index.html'));
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}
