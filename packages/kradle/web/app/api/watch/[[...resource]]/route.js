import { createKradleApiController } from '@a5c-ai/kradle-sdk';

export const dynamic = 'force-dynamic';
const advancedWatchMode = '--watch';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const resourceParts = resolvedParams?.resource || [];
  if (resourceParts[0] !== 'orgs' || !resourceParts[1] || !resourceParts[2]) {
    return Response.json({ error: 'not_found', message: 'Live updates are scoped to /api/watch/orgs/{org}/{resource}' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  const resourcePath = resourceParts.join('/');
  try {
    const controller = createKradleApiController();
    const encoder = new TextEncoder();
    let watcher;
    let closed = false;
    const stream = new ReadableStream({
      start(streamController) {
        const enqueue = (event, data) => {
          if (closed) return;
          try {
            streamController.enqueue(encoder.encode(`event: ${event}\ndata: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`));
          } catch {
            closed = true;
          }
        };
        const close = () => {
          if (closed) return;
          closed = true;
          try { streamController.close(); } catch (err) { console.warn('Stream close failed:', err.message || err); }
        };
        enqueue('kradle', { type: 'SYNC', resource: resourcePath, namespace: controller.namespace });
        watcher = controller.watchResource(resourcePath, {
          stdout(chunk) {
            for (const line of chunk.toString('utf8').split(/\r?\n/).filter(Boolean)) enqueue('kradle', line);
          },
          stderr(chunk) {
            enqueue('kradle-error', { resource: resourcePath, error: chunk.toString('utf8').trim() });
          },
          error(error) {
            enqueue('kradle-error', { resource: resourcePath, error: error.message });
            close();
          },
          close(code) {
            enqueue('kradle-close', { resource: resourcePath, code });
            close();
          }
        });
        request.signal.addEventListener('abort', () => { closed = true; watcher?.child?.kill(); });
      },
      cancel() {
        closed = true;
        watcher?.child?.kill();
      }
    });

    return new Response(stream, {
      headers: {
        'Cache-Control': 'no-store, no-transform',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream; charset=utf-8',
        'X-Accel-Buffering': 'no'
      }
    });
  } catch (error) {
    return Response.json({ error: 'operation_failed', message: error.message }, { status: error.message?.includes('not found') ? 404 : 500 });
  }
}
