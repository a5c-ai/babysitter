// avatar.js — avatar renderer for the avatar-render PoC (proves gap G1).
//
// Two modes, one control surface:
//
//   1) TalkingHead scene-owned mode (when a real, user-owned GLB is provided): construct
//      @met4citizen/TalkingHead bound to the #avatar-stage host. TalkingHead manages its own
//      Three.js scene/camera/renderer/WebGL canvas; we expose mood/gesture/gaze/view + direct
//      viseme morph writes and a renderFrame()/getCanvas() pair so the compositor can drawImage
//      the avatar's WebGL canvas onto the single #out canvas.
//
//   2) License-clean PRIMITIVE placeholder (DEFAULT — no glbUrl): we build our OWN tiny
//      Three.js scene (a head-proxy mesh group with a separately-addressable "mouth" mesh whose
//      scale we drive from setViseme) on our OWN WebGLRenderer canvas. This ships nothing and
//      fetches nothing — NO CC-BY-NC sample avatar. The PoC renders something out of the box and
//      degrades gracefully when TalkingHead / a full rig is not loadable headlessly.
//
// Avatar asset / licensing (risk X8 — see README): this module MUST NOT load TalkingHead's
// bundled brunette.glb (CC BY-NC). The placeholder is an explicit, documented PoC default — NOT a
// hidden production fallback.

import * as THREE from 'three';

// Azure/Oculus viseme morph vocabulary TalkingHead understands; the placeholder maps any of
// these onto its single mouth-open scale so setViseme() visibly drives the mouth even without a rig.
const KNOWN_VISEMES = new Set([
  'aa', 'E', 'I', 'O', 'U', 'PP', 'SS', 'TH', 'DD', 'FF', 'kk', 'nn', 'RR', 'CH', 'sil',
]);

// Rough "openness" each viseme contributes to the placeholder mouth (0..1). Approximate; the
// real per-morph fidelity is a TalkingHead/GLB concern (risk X4), not the placeholder's job.
const VISEME_OPENNESS = {
  aa: 1.0, E: 0.55, I: 0.4, O: 0.85, U: 0.7, PP: 0.05, SS: 0.2, TH: 0.3,
  DD: 0.35, FF: 0.25, kk: 0.4, nn: 0.3, RR: 0.45, CH: 0.4, sil: 0.0,
};

const MOOD_COLORS = {
  neutral: 0x9fb4c7, happy: 0xffd27f, angry: 0xff6f6f, sad: 0x7f9bff,
  fear: 0xc7a6ff, disgust: 0x9fd6a0, love: 0xff9fd0, sleep: 0x556070,
};

/**
 * Create the avatar renderer.
 *
 * @param {Object} opts
 * @param {HTMLElement} opts.stageEl          Host element for the avatar's WebGL canvas (#avatar-stage).
 * @param {string} [opts.glbUrl]              Optional user-owned/RPM GLB URL. Falsy => primitive placeholder.
 * @returns {Promise<{
 *   mode: 'talkinghead' | 'placeholder',
 *   setMood: (mood: string) => void,
 *   playGesture: (name: string) => void,
 *   lookAt: (x: number, y: number) => void,
 *   lookAtCamera: () => void,
 *   setView: (view: string) => void,
 *   setViseme: (visemeId: string, weight: number) => void,
 *   renderFrame: () => void,
 *   getCanvas: () => HTMLCanvasElement,
 * }>}
 */
export async function createAvatar({ stageEl, glbUrl } = {}) {
  if (!stageEl) throw new Error('avatar.js: createAvatar() requires { stageEl }');

  // Prefer the real TalkingHead rig only when a user-owned GLB is explicitly supplied. We never
  // fetch a bundled/CC-BY-NC asset, and we degrade to the primitive on any failure.
  if (glbUrl) {
    try {
      return await createTalkingHeadAvatar({ stageEl, glbUrl });
    } catch (err) {
      // Explicit, documented PoC degrade — surface the reason, then fall through to placeholder.
      console.warn(
        `avatar.js: TalkingHead/GLB path failed (${err && err.message}); ` +
          'degrading to license-clean primitive placeholder.',
      );
    }
  }

  return createPrimitiveAvatar({ stageEl });
}

// --- TalkingHead scene-owned path (real rig; only with a user-owned GLB) ---------------------
async function createTalkingHeadAvatar({ stageEl, glbUrl }) {
  // Imported lazily so a missing/blocked CDN module does not break the placeholder path.
  const mod = await import('@met4citizen/talkinghead');
  const TalkingHead = mod.TalkingHead || mod.default;
  if (!TalkingHead) throw new Error('TalkingHead export not found');

  const head = new TalkingHead(stageEl, {
    ttsEndpoint: null, // no TTS — lipsync is driven directly via setViseme.
    lipsyncModules: [],
    cameraView: 'upper',
  });

  await head.showAvatar({ url: glbUrl, body: 'F', avatarMood: 'neutral' });

  // Resolve the renderer's WebGL canvas TalkingHead created inside stageEl.
  const getCanvas = () => {
    const c = stageEl.querySelector('canvas');
    if (!c) throw new Error('TalkingHead canvas not found in stageEl');
    return c;
  };

  return {
    mode: 'talkinghead',
    setMood: (mood) => { try { head.setMood(mood); } catch { /* tolerate unknown mood */ } },
    playGesture: (name) => { try { head.playGesture(name); } catch { /* tolerate */ } },
    lookAt: (x, y) => { try { head.lookAt(x, y, 500); } catch { /* tolerate */ } },
    lookAtCamera: () => { try { head.lookAtCamera(500); } catch { /* tolerate */ } },
    setView: (view) => { try { head.setView(view); } catch { /* tolerate */ } },
    setViseme: (visemeId, weight) => {
      // TalkingHead drives morphs internally during animation; for the PoC we nudge the
      // mouth-open morph target directly when reachable.
      try {
        const dict = head.morphs && head.morphs[0] && head.morphs[0].morphTargetDictionary;
        const target = head.morphs && head.morphs[0];
        const name = `viseme_${visemeId}`;
        if (dict && target && name in dict) {
          target.morphTargetInfluences[dict[name]] = weight;
        }
      } catch { /* tolerate — placeholder semantics are best-effort on a full rig */ }
    },
    renderFrame: () => {
      // TalkingHead runs its own rAF render loop; expose an explicit single-frame render when present.
      try { head.render?.(); } catch { /* tolerate */ }
    },
    getCanvas,
  };
}

// --- License-clean primitive placeholder path (DEFAULT) --------------------------------------
function createPrimitiveAvatar({ stageEl }) {
  const width = stageEl.clientWidth || 320;
  const height = stageEl.clientHeight || 240;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x101418, 1);
  stageEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
  camera.position.set(0, 0.1, 3.2);
  camera.lookAt(0, 0.1, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2, 3, 4);
  scene.add(key);

  // A head-ish group: head sphere + two eyes + a separately-addressable mouth box.
  const group = new THREE.Group();

  const headMat = new THREE.MeshStandardMaterial({ color: MOOD_COLORS.neutral, roughness: 0.6, metalness: 0.05 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 48), headMat);
  group.add(head);

  const eyeGeo = new THREE.SphereGeometry(0.12, 24, 24);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x14181c, roughness: 0.3 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.33, 0.22, 0.9);
  eyeR.position.set(0.33, 0.22, 0.9);
  group.add(eyeL, eyeR);

  // The mouth: a flat box we scale in Y from setViseme(). Separately addressable so lipsync drives it.
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.08, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x3a1418, roughness: 0.5 }),
  );
  const MOUTH_BASE_Y = 1; // base scale.y; viseme weight grows it.
  mouth.position.set(0, -0.32, 0.92);
  group.add(mouth);

  scene.add(group);

  // Internal control state.
  let mouthWeight = 0;
  let view = 'upper';

  const applyView = () => {
    switch (view) {
      case 'head': camera.position.set(0, 0.2, 2.4); break;
      case 'upper': camera.position.set(0, 0.1, 3.2); break;
      case 'mid': camera.position.set(0, -0.1, 4.4); break;
      case 'full': camera.position.set(0, -0.2, 5.6); break;
      default: camera.position.set(0, 0.1, 3.2);
    }
    camera.lookAt(0, 0.1, 0);
  };

  const renderFrame = () => {
    // Drive the mouth from the latest viseme weight (scale.y; small open => tall mouth).
    mouth.scale.y = MOUTH_BASE_Y + mouthWeight * 6;
    mouth.position.y = -0.32 - mouthWeight * 0.04;
    renderer.render(scene, camera);
  };

  // Render an initial frame so getCanvas() is non-blank immediately.
  renderFrame();

  return {
    mode: 'placeholder',
    setMood: (mood) => {
      const c = MOOD_COLORS[mood] ?? MOOD_COLORS.neutral;
      headMat.color.setHex(c);
    },
    playGesture: (name) => {
      // Placeholder gesture: a brief head tilt so the call is observable. No animation rig.
      const tilt = { handup: 0.2, index: 0.1, ok: 0.05, thumbup: 0.08, thumbdown: -0.08, side: 0.15, shrug: -0.15 };
      group.rotation.z = tilt[name] ?? 0;
    },
    lookAt: (x, y) => {
      // Map normalized-ish screen coords to a small head rotation.
      group.rotation.y = THREE.MathUtils.clamp((x ?? 0), -1, 1) * 0.5;
      group.rotation.x = THREE.MathUtils.clamp((y ?? 0), -1, 1) * 0.3;
    },
    lookAtCamera: () => { group.rotation.set(0, 0, 0); },
    setView: (v) => { view = v; applyView(); },
    setViseme: (visemeId, weight) => {
      const open = KNOWN_VISEMES.has(visemeId) ? (VISEME_OPENNESS[visemeId] ?? 0.5) : 0.5;
      mouthWeight = THREE.MathUtils.clamp((weight ?? 0) * open, 0, 1);
    },
    renderFrame,
    getCanvas: () => renderer.domElement,
  };
}
