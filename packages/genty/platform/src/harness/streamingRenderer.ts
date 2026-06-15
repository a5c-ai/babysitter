/**
 * Streaming Renderer (GAP-PERF-004).
 *
 * Buffers and dispatches streaming output chunks from harness sessions.
 * Supports typed chunk handling with listener registration and
 * buffered replay for late subscribers.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Type of streaming content chunk. */
export type StreamChunkType = "text" | "tool_use" | "tool_result" | "thinking" | "error";

/** A single chunk of streaming output. */
export interface StreamChunk {
  /** Chunk type discriminator. */
  type: StreamChunkType;
  /** The content of the chunk. */
  content: string;
  /** When the chunk was received (ISO 8601). */
  timestamp: string;
  /** Sequence number within the stream. */
  seq: number;
}

/** Callback invoked for each incoming chunk. */
export type StreamChunkListener = (chunk: StreamChunk) => void;

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

/**
 * Buffers streaming output and dispatches chunks to registered listeners.
 *
 * Designed for single-session use: one renderer per harness invocation.
 */
export class StreamingRenderer {
  private readonly buffer: StreamChunk[] = [];
  private readonly listeners: Set<StreamChunkListener> = new Set();
  private seq = 0;

  /**
   * Push a new chunk into the stream.
   * Immediately dispatches to all registered listeners.
   */
  push(type: StreamChunkType, content: string): StreamChunk {
    const chunk: StreamChunk = {
      type,
      content,
      timestamp: new Date().toISOString(),
      seq: this.seq++,
    };
    this.buffer.push(chunk);

    for (const listener of this.listeners) {
      listener(chunk);
    }

    return chunk;
  }

  /**
   * Register a listener for incoming chunks.
   * Returns an unsubscribe function.
   */
  onChunk(listener: StreamChunkListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Flush the buffer and return all accumulated chunks.
   * Clears the internal buffer after flushing.
   */
  flush(): StreamChunk[] {
    const flushed = [...this.buffer];
    this.buffer.length = 0;
    return flushed;
  }

  /**
   * Get the current buffer contents without clearing.
   */
  getBuffer(): readonly StreamChunk[] {
    return [...this.buffer];
  }

  /**
   * Get the number of chunks currently in the buffer.
   */
  get size(): number {
    return this.buffer.length;
  }

  /**
   * Get all chunks of a specific type from the buffer.
   */
  getByType(type: StreamChunkType): StreamChunk[] {
    return this.buffer.filter((c) => c.type === type);
  }

  /**
   * Clear the buffer and reset the sequence counter.
   */
  reset(): void {
    this.buffer.length = 0;
    this.seq = 0;
  }
}
