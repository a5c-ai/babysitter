// compositor.js — single output-canvas compositor for the avatar-render PoC.
//
// Responsibility:
//   Own the single #out canvas (and its 2D context) that becomes the published video track.
//   Each requestAnimationFrame:
//     1. avatar.renderFrame(); ctx.drawImage(avatar.getCanvas(), 0,0,w,h)  — base layer.
//     2. drawAnnotationLayer(ctx)  — STUB 2D overlay (future lower-third / timestamp; G7).
//     3. drawScreenLayer(ctx)      — STUB for the noVNC / screen-share layer (G7); no-op.
//
//   The compositor deliberately NEVER calls captureStream() itself — capture is owned by
//   publish-effect.js so the capture/effect lifecycle is testable in isolation.
//
//   Exposes start()/stop(), frameCount(), getCanvas(), and a lastFrameNonBlank() pixel probe
//   used by verify.mjs (V4) to assert non-blank rendering.

/**
 * Create the compositor over a single output canvas.
 *
 * @param {Object} opts
 * @param {HTMLCanvasElement} opts.outCanvas   The #out canvas (published surface).
 * @param {Object} opts.avatar                 A createAvatar() surface (renderFrame/getCanvas).
 * @returns {{
 *   start: () => void,
 *   stop: () => void,
 *   getCanvas: () => HTMLCanvasElement,
 *   frameCount: () => number,
 *   lastFrameNonBlank: () => boolean,
 * }}
 */
export function createCompositor({ outCanvas, avatar } = {}) {
  if (!outCanvas) throw new Error('compositor.js: createCompositor() requires { outCanvas }');
  if (!avatar) throw new Error('compositor.js: createCompositor() requires { avatar }');

  const ctx = outCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('compositor.js: 2D context unavailable on outCanvas');

  const w = outCanvas.width;
  const h = outCanvas.height;

  let rafId = null;
  let frames = 0;
  let running = false;

  // rAF is not available in some headless/eval contexts; fall back to a timer so the loop still
  // runs. (This is a runtime-environment shim, not a behavioral fallback.)
  const raf =
    (typeof requestAnimationFrame === 'function')
      ? requestAnimationFrame
      : (cb) => setTimeout(() => cb(Date.now()), 16);
  const caf =
    (typeof cancelAnimationFrame === 'function') ? cancelAnimationFrame : clearTimeout;

  function composite() {
    // 1) Base layer: render the avatar a frame, then copy its WebGL canvas onto #out.
    try {
      avatar.renderFrame();
      const src = avatar.getCanvas();
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(src, 0, 0, w, h);
    } catch (err) {
      // Surface but do not crash the loop; a single bad frame should not kill compositing.
      console.warn('compositor.js: base-layer draw failed:', err && err.message);
    }

    // 2) Annotation overlay layer — STUB. The future G7 lower-third/annotation 2D layer would
    //    draw here (e.g. captions, timestamps, names). For the PoC we draw a tiny static marker
    //    so the layer path is exercised and visible in the captured frame.
    drawAnnotationLayer(ctx, w, h, frames);

    // 3) Screenshare / noVNC layer — STUB (no-op). The desktop/screen canvas would composite here.
    drawScreenLayer(ctx, w, h);

    frames += 1;
  }

  function loop() {
    if (!running) return;
    composite();
    rafId = raf(loop);
  }

  return {
    start() {
      if (running) return;
      running = true;
      rafId = raf(loop);
    },
    stop() {
      running = false;
      if (rafId != null) caf(rafId);
      rafId = null;
    },
    getCanvas: () => outCanvas,
    frameCount: () => frames,

    /**
     * Sample a grid of pixels via getImageData and report whether the last composited frame is
     * NOT all-blank (all-transparent or all-black). Used by verify.mjs V4.
     */
    lastFrameNonBlank() {
      // Sample a sparse grid rather than the full buffer (cheap, sufficient to detect content).
      const cols = 8;
      const rows = 8;
      let nonBlank = false;
      for (let iy = 0; iy < rows && !nonBlank; iy += 1) {
        for (let ix = 0; ix < cols && !nonBlank; ix += 1) {
          const x = Math.floor(((ix + 0.5) / cols) * w);
          const y = Math.floor(((iy + 0.5) / rows) * h);
          const d = ctx.getImageData(x, y, 1, 1).data;
          // Non-blank == some opacity AND some luminance above a small threshold.
          if (d[3] > 0 && (d[0] > 4 || d[1] > 4 || d[2] > 4)) {
            nonBlank = true;
          }
        }
      }
      return nonBlank;
    },
  };
}

// --- Stub layers (documented placeholders for future G7 work) --------------------------------

function drawAnnotationLayer(ctx, w, h, frame) {
  // STUB: a static lower-third bar + a frame counter so the overlay path is exercised. The real
  // annotation layer (captions/labels/timestamps) would be composited here as a 2D overlay.
  ctx.save();
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, h - 28, w, 28);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#cfe';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(`avatar-poc  frame ${frame}`, 8, h - 9);
  ctx.restore();
}

function drawScreenLayer(/* ctx, w, h */) {
  // STUB / no-op: where the noVNC / screen-share desktop canvas would composite (G7 / II.4).
  // Intentionally empty in the PoC.
}
