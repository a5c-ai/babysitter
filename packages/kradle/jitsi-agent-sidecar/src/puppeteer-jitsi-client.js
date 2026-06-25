import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Browser ESM modules promoted from avatar-poc/ that ship under src/ (Dockerfile copies src/).
// They run in the puppeteer page, NOT in Node — served to the page over a tiny localhost server.
const BROWSER_DIR = path.join(__dirname, 'browser');

// CDN pins mirror avatar-poc/index.html exactly (es-module-shims@1.7.1, three@0.170.0,
// @met4citizen/talkinghead@1.5). CDN browser libs — no npm install, no lockfile change.
const ES_MODULE_SHIMS_URL = 'https://cdn.jsdelivr.net/npm/es-module-shims@1.7.1/dist/es-module-shims.js';
const AVATAR_IMPORTMAP = {
  imports: {
    three: 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js',
    'three/': 'https://cdn.jsdelivr.net/npm/three@0.170.0/',
    'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/',
    'three/examples/': 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/',
    '@met4citizen/talkinghead': 'https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.5/modules/talkinghead.mjs',
    // noVNC (MPL-2.0) — pinned CDN, loaded ONLY lazily via importShim() inside startScreenshare()
    // for a VNC websocket URL. Never eagerly imported, so audio-only / no-VNC stacks never fetch it.
    '@novnc/novnc/core/rfb.js': 'https://cdn.jsdelivr.net/npm/@novnc/novnc@1.5.0/core/rfb.js',
    '@novnc/novnc/': 'https://cdn.jsdelivr.net/npm/@novnc/novnc@1.5.0/',
  },
};

const BROWSER_MIME = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
};

// Serve src/browser/ over http://127.0.0.1:0 so the page can ESM-import the avatar modules.
// Same node:http static-server pattern as avatar-poc/verify.mjs. node:http only — no dependency.
function startBrowserModuleServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
        const rel = urlPath.replace(/^\/+/, '');
        const filePath = path.join(rootDir, rel);
        if (!path.resolve(filePath).startsWith(path.resolve(rootDir))) {
          res.writeHead(403); res.end('forbidden'); return;
        }
        if (!rel || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          res.writeHead(404); res.end('not found'); return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': BROWSER_MIME[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } catch (e) {
        res.writeHead(500); res.end(String(e && e.message));
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

// The page-side bootstrap. Uses es-module-shims' window.importShim() (in shimMode) so the bare
// `three` / `@met4citizen/talkinghead` specifiers inside avatar.js resolve through the
// importmap-shim — native dynamic import() would not consult the shim's importmap on a browser
// that supports importmaps natively. It grafts an off-screen #avatar-stage + #out canvas onto the
// LIVE Jitsi document, builds the avatar + compositor (configured from the JITSI_AVATAR_* config),
// defines window.__kradleAvatar (the controller the G8 client methods already target), and
// captureStreams #out -> publish effect -> setEffect on the live conference. On any error it
// records the reason on window.__kradleAvatarBoot.
function avatarBootstrapSource(baseUrl, avatarCfg) {
  return `
(async () => {
  try {
    const cfg = ${JSON.stringify(avatarCfg || {})};
    const importShim = window.importShim;
    const { createAvatar } = await importShim(${JSON.stringify(baseUrl)} + '/avatar.js');
    const { createCompositor } = await importShim(${JSON.stringify(baseUrl)} + '/compositor.js');
    const { createCanvasPublishEffect, attachToConference } = await importShim(${JSON.stringify(baseUrl)} + '/publish-effect.js');

    // Off-screen stage for the avatar's WebGL canvas + the 640x480 composited #out surface.
    const stage = document.createElement('div');
    stage.id = '__kradle_avatar_stage';
    stage.style.cssText = 'position:fixed;left:-9999px;top:0;width:640px;height:480px';
    document.body.appendChild(stage);
    const out = document.createElement('canvas');
    out.id = '__kradle_out';
    out.width = 640; out.height = 480;
    out.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(out);

    // no modelUrl => license-clean primitive placeholder (never auto-loads a CC-BY-NC GLB).
    const avatar = await createAvatar({ stageEl: stage, glbUrl: cfg.modelUrl || undefined });
    avatar.setMood(cfg.defaultMood || 'neutral');
    avatar.setView(cfg.defaultView || 'upper');

    const compositor = createCompositor({ outCanvas: out, avatar });
    compositor.start();

    // Share the SAME AudioContext as publishAudio() so lipsync rides the published-audio clock (X1).
    if (!window.__kradleAudio && typeof AudioContext !== 'undefined') {
      const ctx = new AudioContext();
      window.__kradleAudio = { ctx, dest: ctx.createMediaStreamDestination() };
    }

    // captureStream #out -> LJM stream-effect -> setEffect on the live local video track.
    const effect = createCanvasPublishEffect({ canvas: out, fps: 25 });
    const attachResult = await attachToConference({ effect, conference: window.APP && window.APP.conference });

    window.__kradleVideo = { compositor, out, effect, attachResult };

    // Controller the G8 client methods (window.__kradleAvatar?.<m>?.()) forward to. __raw keeps the
    // underlying avatar.js surface for the LipsyncRunner (which needs setViseme).
    window.__kradleAvatar = {
      __raw: avatar,
      setExpression(expr /*, opts */) { avatar.setMood(expr); },
      setPosture(p) { if (p) avatar.setView(p); },
      playGesture(g /*, opts */) { avatar.playGesture(g); },
      lookAt(target) {
        if (target === 'camera') { avatar.lookAtCamera(); return; }
        if (target && typeof target === 'object') { avatar.lookAt(target.x ?? 0, target.y ?? 0); return; }
        avatar.lookAt(0, 0);
      },
      setView(v) { avatar.setView(v); },
      drawCanvas(ops) { if (window.__kradleVideo && window.__kradleVideo.compositor && window.__kradleVideo.compositor.pushAnnotation) window.__kradleVideo.compositor.pushAnnotation(ops); },
      clearCanvas() { if (window.__kradleVideo && window.__kradleVideo.compositor && window.__kradleVideo.compositor.clearAnnotations) window.__kradleVideo.compositor.clearAnnotations(); },
      // G7: composite a screen/desktop source into the published video. No fallback — each branch
      // is the intended path for its input; an unsupported input throws and is surfaced.
      async startScreenshare({ source, url } = {}) {
        const comp = window.__kradleVideo && window.__kradleVideo.compositor;
        if (!comp || !comp.setScreenSource) throw new Error('compositor has no screen layer');
        try {
          const isVncUrl = typeof url === 'string' && /^wss?:\\/\\//i.test(url);
          if (isVncUrl || source === 'vnc') {
            // VNC websocket: lazily import noVNC RFB (only here, never eagerly) onto a stage canvas.
            const { default: RFB } = await window.importShim('@novnc/novnc/core/rfb.js');
            const targetCanvas = document.createElement('canvas');
            targetCanvas.id = '__kradle_vnc';
            stage.appendChild(targetCanvas);
            const rfb = new RFB(targetCanvas, url);
            comp.setScreenSource((rfb && rfb._canvas) || targetCanvas, { mode: 'full' });
            window.__kradleScreen = { kind: 'vnc', rfb, canvas: targetCanvas, url };
          } else if (source === 'display') {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const video = document.createElement('video');
            video.autoplay = true; video.muted = true; video.playsInline = true;
            video.srcObject = stream;
            stage.appendChild(video);
            await video.play().catch(() => {});
            comp.setScreenSource(video, { mode: 'full' });
            window.__kradleScreen = { kind: 'display', video, stream };
          } else if (typeof url === 'string' && /^https?:\\/\\//i.test(url)) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url;
            stage.appendChild(img);
            comp.setScreenSource(img, { mode: 'inset' });
            window.__kradleScreen = { kind: 'image', img, url };
          } else {
            throw new Error('startScreenshare: unsupported source/url (' + String(source) + ', ' + String(url) + ')');
          }
          window.__kradleScreenError = null;
        } catch (err) {
          window.__kradleScreenError = String((err && (err.stack || err.message)) || err);
          console.error('kradle startScreenshare failed:', err);
          throw err;
        }
      },
      stopScreenshare() {
        const comp = window.__kradleVideo && window.__kradleVideo.compositor;
        const s = window.__kradleScreen;
        try {
          if (s && s.rfb && s.rfb.disconnect) s.rfb.disconnect();
          if (s && s.stream && s.stream.getTracks) s.stream.getTracks().forEach((t) => t.stop());
        } catch (err) { console.warn('kradle stopScreenshare teardown:', err && err.message); }
        if (comp && comp.clearScreen) comp.clearScreen();
        window.__kradleScreen = null;
      },
    };

    window.__kradleAvatarBoot = { ready: true, mode: avatar.mode, attached: !!(attachResult && attachResult.attached), reason: attachResult && attachResult.reason };
  } catch (err) {
    window.__kradleAvatarBoot = { ready: false, error: (err && (err.stack || err.message)) || String(err) };
    console.error('kradle avatar bootstrap failed:', err);
  }
})();
`;
}

function roomUrlWithJwt(roomUrl, jwt) {
  if (!jwt) return roomUrl;
  const url = new URL(roomUrl);
  url.searchParams.set('jwt', jwt);
  return url.toString();
}

export function createPuppeteerJitsiClient(config = {}) {
  let browser = null;
  let page = null;
  // Static server for src/browser/* modules; only started when videoMode === 'publish'.
  let moduleServer = null;
  // Last avatar-injection error, if any (kept observable instead of silently swallowed).
  let injectAvatarError = null;

  async function evaluateBestEffort(fn, ...args) {
    if (!page) return;
    try {
      await page.evaluate(fn, ...args);
    } catch {
      // Jitsi UI APIs vary by deployment; IPC command acknowledgement should not crash the sidecar.
    }
  }

  // Inject the avatar render+publish pipeline into the live Jitsi page (videoMode === 'publish'
  // only). Starts the src/browser/ module server, then injects es-module-shims + a CDN
  // importmap-shim + a module-shim bootstrap (defined above). Best-effort: never crashes connect().
  async function injectAvatar(runtimeConfig) {
    if (!page) return;
    const avatarCfg = runtimeConfig.avatar || {};
    moduleServer = await startBrowserModuleServer(BROWSER_DIR);
    try {
      // shimMode:true forces es-module-shims to honor importmap-shim + importShim() even on a
      // browser with NATIVE importmap support (Chrome). Must be set BEFORE the shim loads.
      await page.addScriptTag({ content: 'window.esmsInitOptions = { shimMode: true };' });
      await page.addScriptTag({ url: ES_MODULE_SHIMS_URL });
      await page.addScriptTag({ content: JSON.stringify(AVATAR_IMPORTMAP), type: 'importmap-shim' });
      // The bootstrap self-invokes and drives the modules via window.importShim() (defined above).
      await page.addScriptTag({ content: avatarBootstrapSource(moduleServer.baseUrl, avatarCfg) });
      // Give the shim a moment to evaluate the bootstrap (it sets window.__kradleAvatarBoot).
      await page.waitForFunction(() => !!window.__kradleAvatarBoot, { timeout: 20000 }).catch(() => {});
    } catch (err) {
      // CSP or addScriptTag variance must never crash connect; the G8 methods stay best-effort
      // no-ops. Surface the cause (not silent): record it and log so a missing avatar is diagnosable.
      injectAvatarError = String(err && err.stack ? err.stack : err);
      // eslint-disable-next-line no-console
      console.error('[kradle-avatar] avatar injection failed (G8 methods remain no-ops):', err);
    }
  }

  return {
    async connect(overrides = {}) {
      const runtimeConfig = { ...config, ...overrides };
      const onEvent = runtimeConfig.onEvent;
      const publishing = runtimeConfig.videoMode === 'publish';
      const puppeteer = await import('puppeteer-core');
      browser = await puppeteer.launch({
        headless: runtimeConfig.headless ?? true,
        executablePath: runtimeConfig.chromiumExecutablePath || process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROMIUM_PATH || 'chromium',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--use-fake-ui-for-media-stream',
          '--use-fake-device-for-media-stream',
          '--autoplay-policy=no-user-gesture-required',
          // SwiftShader GL so a GPU-less pod can software-render the avatar WebGL (publish only).
          ...(publishing ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []),
        ],
      });
      page = await browser.newPage();
      await page.goto(roomUrlWithJwt(runtimeConfig.roomUrl, runtimeConfig.jwt), { waitUntil: 'domcontentloaded', timeout: 30000 });
      await evaluateBestEffort((name) => {
        window.localStorage.setItem('displayname', name || 'Kradle Agent');
      }, runtimeConfig.participantName);
      // Best-effort inbound chat listener. Jitsi message APIs vary by deployment, so the
      // in-page subscription is wrapped in evaluateBestEffort and silently no-ops if absent.
      if (typeof onEvent === 'function') {
        try {
          await page.exposeFunction('__kradleEmit', (event) => onEvent(event));
          await evaluateBestEffort(() => {
            const room = window.APP?.conference?.room;
            room?.on?.('message', (id, text) => {
              window.__kradleEmit?.({ type: 'chat', sender: id, text });
            });
            // G5/G6 inbound-audio tap (best-effort). Jitsi remote-track APIs vary by deployment;
            // when a remote audio track arrives, signal the sidecar so it can pull/transcribe
            // frames. The actual PCM extraction (MediaStreamTrackProcessor/AudioWorklet) is the
            // manual/live part; here we surface the signal only and never crash if unsupported.
            const conf = window.APP?.conference;
            const onRemoteTrack = (track) => {
              try {
                if (track && (track.getType?.() === 'audio' || track.kind === 'audio')) {
                  window.__kradleEmit?.({ type: 'inbound_audio', participantId: track.getParticipantId?.() });
                }
              } catch { /* tolerate */ }
            };
            conf?.addEventListener?.('TRACK_ADDED', onRemoteTrack);
            conf?.on?.('track.trackAdded', onRemoteTrack);
          });
        } catch {
          // exposeFunction can throw if the binding already exists; never crash connect.
        }
      }
      // Avatar render + publish pipeline. Gated on videoMode === 'publish'; when absent, NOTHING is
      // injected and the page behaves exactly as before (window.__kradleAvatar stays undefined,
      // the G8 methods remain best-effort no-ops). Audio-only / no-video stacks are byte-unchanged.
      if (publishing) {
        await injectAvatar(runtimeConfig);
      }
      return { connected: true, participants: [{ id: 'agent', name: runtimeConfig.participantName || 'Kradle Agent' }] };
    },

    // G3 audio publish: turn a TTS descriptor into a live audio MediaStreamTrack in the page
    // (shared AudioContext + MediaStreamAudioDestinationNode, mirroring avatar-poc/lipsync.js),
    // then publish it into the conference in place of the fake mic. Best-effort: on a headless
    // page with no live conference this no-ops gracefully and never throws.
    async publishAudio(descriptor) {
      const lipsyncBase = moduleServer ? moduleServer.baseUrl : null;
      await evaluateBestEffort(async (desc, lsBase) => {
        if (!desc || typeof AudioContext === 'undefined') return;
        // One shared AudioContext + destination for the page lifetime (stable published track).
        const w = window;
        if (!w.__kradleAudio) {
          const ctx = new AudioContext();
          w.__kradleAudio = { ctx, dest: ctx.createMediaStreamDestination() };
        }
        const { ctx, dest } = w.__kradleAudio;
        // ADDITIVE avatar/lipsync branch — only when the avatar is present AND the descriptor
        // carries Azure-style viseme timing. Shares the SAME __kradleAudio.ctx clock as the audio
        // path (X1). When absent, control falls through to today's exact tone/pcm render below.
        if (w.__kradleAvatar && lsBase && Array.isArray(desc.visemes) && Array.isArray(desc.vtimes)) {
          try {
            const importer = window.importShim || ((u) => import(u));
            const { buildVisemeSchedule, LipsyncRunner } = await importer(lsBase + '/lipsync.js');
            const sampleRate = desc.sampleRate || 48000;
            const channels = desc.channels || 1;
            let audioBuffer = null;
            if (desc.kind === 'pcm' && desc.bytes) {
              const i16 = new Int16Array(desc.bytes.buffer || new Uint8Array(desc.bytes).buffer);
              const frames = Math.floor(i16.length / channels);
              audioBuffer = ctx.createBuffer(channels, frames, sampleRate);
              for (let ch = 0; ch < channels; ch += 1) {
                const data = audioBuffer.getChannelData(ch);
                for (let i = 0; i < frames; i += 1) data[i] = i16[i * channels + ch] / 32768;
              }
            }
            const schedule = buildVisemeSchedule(desc.visemes, desc.vtimes, { unit: desc.visemeUnit || 'ticks' });
            const runner = new LipsyncRunner({ audioContext: ctx, audioBuffer, avatar: w.__kradleAvatar.__raw, schedule });
            runner.play();
            w.__kradleLipsync = runner;
            // Publish the runner's audio track (rides the shared clock) into the conference.
            const track = runner.getAudioTrack();
            const conf = window.APP?.conference;
            const localAudio = conf?.getLocalAudioTrack?.()
              || conf?.getLocalTracks?.().find((t) => t.getType?.() === 'audio');
            if (track && localAudio?.track && conf?.replaceTrack) {
              conf.replaceTrack(localAudio, track);
            }
            return;
          } catch (err) {
            // NOT a fallback: the avatar is present and the descriptor carries viseme timing, so
            // lipsync is the INTENDED path. Surface the failure loudly (probe + console) and
            // re-throw — do NOT silently degrade to a plain tone, which would mask a real lipsync
            // fault behind audible-but-wrong output. evaluateBestEffort still keeps connect() alive.
            w.__kradleLipsyncError = String(err && err.stack ? err.stack : err);
            // eslint-disable-next-line no-console
            console.error('[kradle-avatar] lipsync publish failed:', err);
            throw err;
          }
        }
        if (desc.kind === 'tone') {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = desc.freq || 440;
          osc.connect(dest);
          const startAt = ctx.currentTime;
          osc.start(startAt);
          osc.stop(startAt + (desc.durationMs || 200) / 1000);
        } else if (desc.kind === 'pcm' && desc.bytes) {
          const sampleRate = desc.sampleRate || 48000;
          const channels = desc.channels || 1;
          const i16 = new Int16Array(
            desc.bytes.buffer || new Uint8Array(desc.bytes).buffer,
          );
          const frames = Math.floor(i16.length / channels);
          const buf = ctx.createBuffer(channels, frames, sampleRate);
          for (let ch = 0; ch < channels; ch += 1) {
            const data = buf.getChannelData(ch);
            for (let i = 0; i < frames; i += 1) data[i] = i16[i * channels + ch] / 32768;
          }
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(dest);
          src.start();
        } else {
          return;
        }
        // Publish the generated audio track into the conference, replacing the fake mic.
        try {
          const track = dest.stream.getAudioTracks()[0];
          const conf = window.APP?.conference;
          const localAudio = conf?.getLocalAudioTrack?.()
            || conf?.getLocalTracks?.().find((t) => t.getType?.() === 'audio');
          if (track && localAudio?.track && conf?.replaceTrack) {
            conf.replaceTrack(localAudio, track);
          }
        } catch { /* no live conference in headless harness — track still exists locally */ }
      }, descriptor, lipsyncBase);
    },

    async sendChat(text) {
      await evaluateBestEffort((message) => {
        const api = window.APP?.conference;
        if (api?.sendMessage) api.sendMessage(message);
      }, text);
    },

    async raiseHand() {
      await evaluateBestEffort(() => window.APP?.conference?.room?.setRaisedHand?.(true));
    },

    async lowerHand() {
      await evaluateBestEffort(() => window.APP?.conference?.room?.setRaisedHand?.(false));
    },

    async react(emoji) {
      await evaluateBestEffort((value) => window.APP?.conference?.sendEndpointMessage?.('', { type: 'reaction', emoji: value }), emoji);
    },

    // DEPRECATED (legacy `share_screen` IPC action): merely window.open()s a URL in the headless
    // page — it does NOT composite anything into the published video. The real G7 screen-share
    // path is `start_screenshare` -> startScreenshare() (noVNC RFB / getDisplayMedia / image ->
    // compositor screen layer). Kept only for back-compat; prefer start_screenshare.
    async shareScreen(url) {
      await evaluateBestEffort((value) => window.open(value, '_blank'), url);
    },

    async setExpression(expression, options = {}) {
      await evaluateBestEffort((value, opts) => window.__kradleAvatar?.setExpression?.(value, opts), expression, options);
    },

    async setPosture(posture) {
      await evaluateBestEffort((value) => window.__kradleAvatar?.setPosture?.(value), posture);
    },

    async playGesture(gesture, options = {}) {
      await evaluateBestEffort((value, opts) => window.__kradleAvatar?.playGesture?.(value, opts), gesture, options);
    },

    async lookAt(target) {
      await evaluateBestEffort((value) => window.__kradleAvatar?.lookAt?.(value), target);
    },

    async setView(view) {
      await evaluateBestEffort((value) => window.__kradleAvatar?.setView?.(value), view);
    },

    async drawCanvas(ops) {
      await evaluateBestEffort((value) => window.__kradleAvatar?.drawCanvas?.(value), ops);
    },

    async startScreenshare(options = {}) {
      await evaluateBestEffort((opts) => window.__kradleAvatar?.startScreenshare?.(opts), options);
    },

    async stopScreenshare() {
      await evaluateBestEffort(() => window.__kradleAvatar?.stopScreenshare?.());
    },

    async sendVideoMetadata(metadata) {
      await evaluateBestEffort((value) => window.__kradleAvatar?.sendVideoMetadata?.(value), metadata);
    },

    // Diagnostic: surfaces the avatar-injection failure (if any) instead of leaving it swallowed.
    get lastAvatarError() {
      return injectAvatarError;
    },

    async disconnect() {
      if (page) {
        // Tear down the avatar pipeline first (best-effort): stop compositing + the capture effect.
        await evaluateBestEffort(() => {
          // Tear down any active screen share first (close RFB / stop display tracks) so the
          // websocket / capture stream is released before the page closes.
          try {
            const s = window.__kradleScreen;
            if (s?.rfb?.disconnect) s.rfb.disconnect();
            if (s?.stream?.getTracks) s.stream.getTracks().forEach((t) => t.stop());
          } catch { /* best-effort teardown */ }
          window.__kradleVideo?.compositor?.clearScreen?.();
          window.__kradleScreen = null;
          window.__kradleLipsync?.stop?.();
          window.__kradleVideo?.compositor?.stop?.();
          window.__kradleVideo?.effect?.stopEffect?.();
        });
        await evaluateBestEffort(() => window.APP?.conference?.hangup?.());
        await page.close().catch(() => {});
        page = null;
      }
      if (browser) {
        await browser.close().catch(() => {});
        browser = null;
      }
      if (moduleServer) {
        await new Promise((r) => moduleServer.server.close(() => r()));
        moduleServer = null;
      }
    },
  };
}
