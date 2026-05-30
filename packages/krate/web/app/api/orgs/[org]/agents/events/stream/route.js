import { globalEventBus } from '@a5c-ai/krate-sdk';
import { requireAuth } from '../../../../../../lib/api-auth.js';

export const dynamic = 'force-dynamic';

function streamHeaders() {
  return {
    'Cache-Control': 'no-store, no-transform',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream; charset=utf-8',
    'X-Accel-Buffering': 'no'
  };
}

async function proxyControllerStream(org, request) {
  if (!process.env.KRATE_CONTROLLER_URL) {
    console.warn('[agent-events-stream] KRATE_CONTROLLER_URL not set, falling back to local event bus');
    return null;
  }
  const requestUrl = new URL(request.url);
  const cursor = request.headers.get('Last-Event-ID') || requestUrl.searchParams.get('cursor') || '';
  const target = new URL(`/api/orgs/${org}/agents/events/stream`, process.env.KRATE_CONTROLLER_URL);
  if (cursor) target.searchParams.set('cursor', cursor);
  try {
    const upstream = await fetch(target, {
      cache: 'no-store',
      headers: cursor ? { Accept: 'text/event-stream', 'Last-Event-ID': cursor } : { Accept: 'text/event-stream' },
      signal: request.signal
    });
    if (!upstream.ok || !upstream.body) {
      console.warn(`[agent-events-stream] upstream returned ${upstream.status} for ${target}, falling back to local event bus`);
      return null;
    }
    return new Response(upstream.body, { headers: streamHeaders() });
  } catch (err) {
    console.warn(`[agent-events-stream] upstream connection to ${target} failed:`, err.message);
    return null;
  }
}

export async function GET(request, { params }) {
  const session = requireAuth(request);
  if (!session) {
    return Response.json({ error: 'unauthorized', message: 'Authentication required' }, { status: 401 });
  }
  const { org } = await params;
  const requestUrl = new URL(request.url);
  const cursor = request.headers.get('Last-Event-ID') || requestUrl.searchParams.get('cursor') || '';
  const upstream = await proxyControllerStream(org, request);
  if (upstream) return upstream;

  const encoder = new TextEncoder();
  let heartbeat;
  let closed = false;
  let unsubscribe = () => {};

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch (err) {
          console.warn('[agent-events-stream] enqueue failed:', err.message || err);
          closed = true;
        }
      };
      const listener = (event) => send(event);
      send({ type: 'connected', org });
      for (const event of await globalEventBus.replaySince(cursor)) send(event);
      globalEventBus.subscribe(listener);
      unsubscribe = () => globalEventBus.unsubscribe(listener);
      heartbeat = setInterval(() => send({ type: 'heartbeat', org }), 30000);
      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
      }, { once: true });
    },
    cancel() {
      closed = true;
      clearInterval(heartbeat);
      unsubscribe();
    }
  });

  return new Response(stream, { headers: streamHeaders() });
}
