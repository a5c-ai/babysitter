import path from "path";
import { ensureInitialized, serverEvents, type BatchedRunChangedEvent } from "@/lib/server-init";

export const dynamic = "force-dynamic";

// Extract runId from a runDir path (last segment of the directory)
function extractRunId(runDir: string): string {
  return path.basename(runDir);
}

export async function GET() {
  try {
    // Ensure watcher and cache are initialized
    await ensureInitialized();

    // Track cleanup via closure so cancel() can access it
    let cleanup: (() => void) | null = null;

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Send initial connection message
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`
          )
        );

        // Listen for run-changed events (batched by leading-edge debounce).
        // Each event contains runIds[] and runDirs[] for targeted client refresh.
        const runChangedListener = (event: BatchedRunChangedEvent) => {
          try {
            const message = {
              type: "update",
              runIds: event.runIds,
              // Keep singular runId for backward compatibility (first in batch)
              runId: event.runIds[0],
              timestamp: new Date().toISOString(),
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
            );
          } catch (err) {
            console.error("Failed to send run-changed event:", err);
          }
        };

        // Listen for new-run events
        const newRunListener = (event: {
          type: string;
          runDir: string;
          error?: Error;
        }) => {
          try {
            const runId = extractRunId(event.runDir);
            const message = {
              type: "new-run",
              runId,
              runDir: event.runDir,
              timestamp: new Date().toISOString(),
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
            );
          } catch (err) {
            console.error("Failed to send new-run event:", err);
          }
        };

        // Listen for watcher-error events (deduplicated in server-init)
        // These are logged server-side but NOT forwarded as SSE data events
        // to prevent transient filesystem errors from triggering client-side
        // status flashes. The client will self-heal via normal polling.
        const errorListener = (event: {
          type: string;
          runDir: string;
          error?: Error;
        }) => {
          // Log server-side only; do not push to client SSE stream
          console.warn(
            "Watcher error (suppressed from SSE):",
            event.error?.message ?? "unknown",
            event.runDir
          );
        };

        serverEvents.on("run-changed", runChangedListener);
        serverEvents.on("new-run", newRunListener);
        serverEvents.on("watcher-error", errorListener);

        // Keep-alive ping every 15 seconds
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch (err) {
            console.error("Failed to send ping:", err);
            clearInterval(pingInterval);
          }
        }, 15000);

        // Store cleanup via closure (accessible from cancel)
        cleanup = () => {
          clearInterval(pingInterval);
          serverEvents.off("run-changed", runChangedListener);
          serverEvents.off("new-run", newRunListener);
          serverEvents.off("watcher-error", errorListener);
        };
      },
      cancel() {
        if (cleanup) {
          cleanup();
          cleanup = null;
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to initialize SSE stream:", error);
    return new Response(
      JSON.stringify({ error: "Failed to initialize stream" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

