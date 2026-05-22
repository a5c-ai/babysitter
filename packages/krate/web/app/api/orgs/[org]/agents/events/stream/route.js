import { globalEventBus } from '@a5c-ai/krate-sdk';

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
  if (!process.env.KRATE_CONTROLLER_URL) return null;
  const target = new URL(`/api/orgs/${org}/agents/events/stream`, process.env.KRATE_CONTROLLER_URL);
  try {
    const upstream = await fetch(target, {
      cache: 'no-store',
      headers: { Accept: 'text/event-stream' },
      signal: request.signal
    });
    if (!upstream.ok || !upstream.body) return null;
    return new Response(upstream.body, { headers: streamHeaders() });
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  const { org } = await params;
  const upstream = await proxyControllerStream(org, request);
  if (upstream) return upstream;

  const encoder = new TextEncoder();
  let heartbeat;
  let closed = false;
  let unsubscribe = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          closed = true;
        }
      };
      const listener = (event) => send(event);
      send({ type: 'connected', org });
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
