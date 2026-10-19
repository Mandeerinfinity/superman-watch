/* Nick's Superman Watch v3: 3D hologram of the S shield.
   Real extruded + bevelled geometry built from the same SVG paths as the 2D shield, rendered with three.js (vendored, lazy-loaded).
   Holographic shader: Fresnel glow, scanlines, flicker and glitch, a projector cone from the dial, particle dust and a cheap
   quarter-resolution bloom. The WebGL loop only runs while the hologram is visible (driven by the app's single rAF loop). */
import * as THREE from '../vendor/three-holo.module.min.js';

const SM = window.SM;
const VARIANTS = {
  classic: { name: 'Classic 3D', solid: true, beam: '#9fdcff', dust: '#fff1c8', glow: '#ffd9a8', edge: '#ffe7b0' },
  cyan: { name: 'Cyan hologram', solid: false, color: '#3fe0ff', beam: '#4fe0ff', dust: '#b6f6ff', edge: '#b9f7ff' },
  kryptonite: { name: 'Kryptonite', solid: false, color: '#45ff78', beam: '#58ff88', dust: '#c8ffd8', edge: '#caffd9' },
  gold: { name: 'Gold', solid: true, gold: true, beam: '#ffd27a', dust: '#fff0c0', glow: '#ffcf6a', edge: '#fff0c0' }
};
export { VARIANTS };

function addBlend(m) {
  m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation;
  m.blendSrc = THREE.SrcAlphaFactor; m.blendDst = THREE.OneFactor;
  m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor;
  m.transparent = true; m.depthWrite = false; return m;
}

const HOLO_VS = `
uniform float uTime; uniform float uGlitch;
varying vec3 vN; varying vec3 vView; varying vec3 vWorld; varying vec3 vLocal;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float slice = floor(wp.y * 16.0 + floor(uTime * 24.0) * 7.0);
  float band = step(0.9, fract(sin(slice * 12.9898) * 43758.5453));
  wp.x += band * uGlitch * 0.12 * sin(uTime * 83.0 + slice);
  vWorld = wp.xyz; vLocal = position;
  vN = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const HOLO_FS = `
uniform vec3 uColor; uniform float uTime; uniform float uOpacity; uniform float uFlicker; uniform float uGlitch; uniform float uStrength; uniform float uFace;
varying vec3 vN; varying vec3 vView; varying vec3 vWorld; varying vec3 vLocal;
void main(){
  vec3 n = normalize(vN);
  float fres = pow(1.0 - abs(dot(n, normalize(vView))), 2.2);
  float scan = 0.6 + 0.4 * sin(vWorld.y * 150.0 - uTime * 8.0);
  float fine = 0.85 + 0.15 * sin(vWorld.y * 520.0);
  float bandT = fract(vWorld.y * 0.32 - uTime * 0.22);
  float band = smoothstep(0.0, 0.05, bandT) * (1.0 - smoothstep(0.05, 0.12, bandT));
  float face = pow(max(0.0, n.z), 3.0);
  vec3 col = uColor * (0.3 + 1.6 * fres + 0.8 * face * uFace) * scan * fine + vec3(0.55) * face * uFace * uFace;
  col += uColor * band * 1.4 + vec3(1.0) * pow(fres, 5.0) * 0.8;
  col.r += uGlitch * 0.5 * max(0.0, sin(vWorld.y * 70.0 + uTime * 30.0));
  col.b += uGlitch * 0.5 * max(0.0, sin(vWorld.y * 70.0 - uTime * 30.0 + 1.5));
  float a = ((0.08 + 0.9 * fres) * uStrength + 0.55 * face * uFace) * scan * uOpacity * uFlicker + band * 0.3 * uOpacity * min(uStrength, 1.0);
  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
}`;
const CONE_VS = `
varying float vT; varying vec3 vN; varying vec3 vView; varying float vAng;
uniform float uH;
void main(){
  vT = position.y / uH + 0.5;
  vAng = atan(position.x, position.z);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal); vView = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const CONE_FS = `
uniform vec3 uColor; uniform float uTime; uniform float uOpacity; uniform float uFlicker;
varying float vT; varying vec3 vN; varying vec3 vView; varying float vAng;
void main(){
  float edge = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 1.4);
  float fall = pow(1.0 - vT, 1.3) * smoothstep(1.0, 0.72, vT);
  float streak = 0.55 + 0.45 * sin(vAng * 21.0 + uTime * 0.9) * sin(vAng * 7.0 - uTime * 0.6);
  float rise = 0.75 + 0.25 * sin(vT * 40.0 - uTime * 6.0);
  float a = (0.08 + 0.55 * edge) * fall * streak * rise * uOpacity * uFlicker;
  gl_FragColor = vec4(uColor * (1.0 + edge), a);
}`;
const SPRITE_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SPRITE_FS = `
uniform vec3 uColor; uniform float uOpacity; uniform float uTime; uniform float uRing; varying vec2 vUv;
void main(){
  float d = length(vUv - 0.5) * 2.0;
  float core = exp(-d * d * 10.0);
  float ring = uRing * smoothstep(0.08, 0.0, abs(d - 0.55 - 0.08 * sin(uTime * 2.0))) * 0.6;
  float a = (core + ring) * uOpacity * smoothstep(1.0, 0.8, d);
  gl_FragColor = vec4(uColor * (1.0 + core), a);
}`;
const DUST_VS = `
attribute float aSeed; uniform float uTime; uniform float uSize; uniform float uH; uniform float uPR;
varying float vA;
void main(){
  vec3 p = position;
  float t = uTime * (0.05 + aSeed * 0.08);
  p.y = mod(p.y + t * uH, uH) - uH * 0.5;
  p.x += sin(uTime * 0.7 + aSeed * 40.0) * 0.06; p.z += cos(uTime * 0.6 + aSeed * 30.0) * 0.06;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = (0.35 + 0.65 * abs(sin(uTime * (1.0 + aSeed * 3.0) + aSeed * 50.0))) * smoothstep(0.5, 0.35, abs(p.y / uH));
  gl_PointSize = uSize * uPR * (0.5 + aSeed) * (8.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const DUST_FS = `
uniform vec3 uColor; uniform float uOpacity; varying float vA;
void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, d); gl_FragColor = vec4(uColor, a * a * vA * uOpacity); }`;
const FS_QUAD_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const BLUR_FS = `
uniform sampler2D tMap; uniform vec2 uDir; varying vec2 vUv;
void main(){
  vec4 c = texture2D(tMap, vUv) * 0.227027;
  c += texture2D(tMap, vUv + uDir * 1.3846) * 0.316216; c += texture2D(tMap, vUv - uDir * 1.3846) * 0.316216;
  c += texture2D(tMap, vUv + uDir * 3.2307) * 0.070270; c += texture2D(tMap, vUv - uDir * 3.2307) * 0.070270;
  gl_FragColor = c;
}`;
const COMP_FS = `uniform sampler2D tMap; uniform float uStrength; varying vec2 vUv; void main(){ vec4 c = texture2D(tMap, vUv); gl_FragColor = vec4(c.rgb * uStrength, 1.0); }`;

function shieldGeometries() {
  const { OUT, IN, S, TRIM } = SM.SHIELD;
  const loader = new THREE.SVGLoader();
  const shapes = (d) => {
    const data = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" transform="translate(-100 86) scale(1 -1)" d="${d}"/></svg>`);
    return data.paths[0].toShapes();
  };
  const ex = (d, depth, bt, bs, seg, z0) => {
    const g = new THREE.ExtrudeGeometry(shapes(d), { depth, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: seg, curveSegments: 28 });
    g.translate(0, 0, z0); g.scale(.01, .01, .01); g.computeVertexNormals(); return g;
  };
  return {
    trim: ex(`${TRIM} ${OUT}`, 7, 2.4, 1.5, 3, -9),
    border: ex(`${OUT} ${IN}`, 11, 2.6, 1.7, 3, -7),
    field: ex(`${IN} ${S}`, 5, 1, .8, 2, -5),
    s: ex(S, 13, 3, 2.1, 4, -5)
  };
}

export function create(opts) {
  const host = opts.host;
  const canvas = document.createElement('canvas');
  canvas.className = 'holo-cv';
  canvas.setAttribute('aria-label', 'Hologram of the S shield. Drag to spin, pinch or scroll to zoom.');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
  const pm = new THREE.PMREMGenerator(renderer);
  const envTex = pm.fromScene(new THREE.RoomEnvironment(), .04).texture; pm.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-3, 4, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7fd8ff, 1.6); rim.position.set(4, -1, -3); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, .25));

  const geos = shieldGeometries();
  const shield = new THREE.Group(), spin = new THREE.Group(), rig = new THREE.Group();
  spin.add(shield); rig.add(spin); scene.add(rig);
  const parts = {};
  ['trim', 'border', 'field', 's'].forEach(k => { const m = new THREE.Mesh(geos[k]); m.layers.set(3); parts[k] = m; shield.add(m); });
  const edgeGroup = new THREE.Group(); shield.add(edgeGroup);
  const edgeMat = addBlend(new THREE.LineBasicMaterial({ color: 0xffffff, opacity: .85 }));
  const edgeMatS = addBlend(new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 1 }));
  ['trim', 'border', 's'].forEach(k => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geos[k], 28), k === 's' ? edgeMatS : edgeMat); edgeGroup.add(e); });

  const holoMats = {}, uniforms = { uTime: { value: 0 }, uGlitch: { value: 0 }, uFlicker: { value: 1 }, uOpacity: { value: 1 } };
  const strength = { trim: 1, border: 1.2, field: .18, s: 1.6 }, faceK = { trim: .35, border: .55, field: .06, s: 1 };
  Object.keys(parts).forEach(k => {
    holoMats[k] = addBlend(new THREE.ShaderMaterial({
      vertexShader: HOLO_VS, fragmentShader: HOLO_FS, side: THREE.DoubleSide,
      uniforms: { uTime: uniforms.uTime, uGlitch: uniforms.uGlitch, uFlicker: uniforms.uFlicker, uOpacity: uniforms.uOpacity, uColor: { value: new THREE.Color('#3fe0ff') }, uStrength: { value: strength[k] }, uFace: { value: faceK[k] } }
    }));
  });
  const solid = {
    classic: {
      trim: new THREE.MeshPhysicalMaterial({ color: '#e8b64c', metalness: 1, roughness: .2, clearcoat: .4, envMap: envTex, envMapIntensity: 1.3 }),
      border: new THREE.MeshPhysicalMaterial({ color: '#cc0f27', metalness: .2, roughness: .32, clearcoat: 1, clearcoatRoughness: .06, envMap: envTex }),
      field: new THREE.MeshPhysicalMaterial({ color: '#ffc81a', metalness: .12, roughness: .34, clearcoat: 1, clearcoatRoughness: .1, envMap: envTex }),
      s: new THREE.MeshPhysicalMaterial({ color: '#dd1830', metalness: .22, roughness: .26, clearcoat: 1, clearcoatRoughness: .05, envMap: envTex })
    },
    gold: {
      trim: new THREE.MeshPhysicalMaterial({ color: '#f6d27c', metalness: 1, roughness: .16, envMap: envTex, envMapIntensity: 1.4 }),
      border: new THREE.MeshPhysicalMaterial({ color: '#d8a23c', metalness: 1, roughness: .34, envMap: envTex, envMapIntensity: 1.2 }),
      field: new THREE.MeshPhysicalMaterial({ color: '#8d6420', metalness: 1, roughness: .55, envMap: envTex }),
      s: new THREE.MeshPhysicalMaterial({ color: '#ffe39a', metalness: 1, roughness: .1, envMap: envTex, envMapIntensity: 1.5 })
    }
  };

  /* projector cone, lens glow, emitter ring, dust */
  const beamU = { uColor: { value: new THREE.Color('#4fe0ff') }, uTime: uniforms.uTime, uOpacity: { value: 1 }, uFlicker: uniforms.uFlicker, uH: { value: 1 } };
  const coneGeo = new THREE.CylinderGeometry(1, .04, 1, 64, 1, true);
  const cone = new THREE.Mesh(coneGeo, addBlend(new THREE.ShaderMaterial({ vertexShader: CONE_VS, fragmentShader: CONE_FS, uniforms: beamU, side: THREE.DoubleSide })));
  scene.add(cone);
  const lensU = { uColor: { value: new THREE.Color('#4fe0ff') }, uOpacity: { value: 1 }, uTime: uniforms.uTime, uRing: { value: 1 } };
  const lens = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addBlend(new THREE.ShaderMaterial({ vertexShader: SPRITE_VS, fragmentShader: SPRITE_FS, uniforms: lensU })));
  scene.add(lens);
  const haloU = { uColor: { value: new THREE.Color('#4fe0ff') }, uOpacity: { value: .35 }, uTime: uniforms.uTime, uRing: { value: 0 } };
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), addBlend(new THREE.ShaderMaterial({ vertexShader: SPRITE_VS, fragmentShader: SPRITE_FS, uniforms: haloU })));
  halo.position.z = -.35; halo.scale.set(4.2, 4.2, 1); rig.add(halo);
  const DUST_MAX = 900, dPos = new Float32Array(DUST_MAX * 3), dSeed = new Float32Array(DUST_MAX);
  for (let i = 0; i < DUST_MAX; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 1.05;
    dPos[i * 3] = Math.cos(a) * r; dPos[i * 3 + 1] = (Math.random() - .5) * 3.2; dPos[i * 3 + 2] = Math.sin(a) * r * .8; dSeed[i] = Math.random();
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3)); dGeo.setAttribute('aSeed', new THREE.BufferAttribute(dSeed, 1));
  const dustU = { uColor: { value: new THREE.Color('#b6f6ff') }, uTime: uniforms.uTime, uSize: { value: 5 }, uH: { value: 3.2 }, uPR: { value: 1 }, uOpacity: { value: 1 } };
  const dust = new THREE.Points(dGeo, addBlend(new THREE.ShaderMaterial({ vertexShader: DUST_VS, fragmentShader: DUST_FS, uniforms: dustU })));
  dust.frustumCulled = false; dust.layers.set(2); cone.layers.set(2); lens.layers.set(2); scene.add(dust);
  camera.layers.enable(2); camera.layers.enable(3);

  /* quarter-res bloom */
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)), quadScene = new THREE.Scene(), quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  quad.frustumCulled = false; quadScene.add(quad);
  const blurMat = new THREE.ShaderMaterial({ vertexShader: FS_QUAD_VS, fragmentShader: BLUR_FS, uniforms: { tMap: { value: null }, uDir: { value: new THREE.Vector2() } }, depthTest: false, depthWrite: false });
  const compMat = new THREE.ShaderMaterial({ vertexShader: FS_QUAD_VS, fragmentShader: COMP_FS, uniforms: { tMap: { value: null }, uStrength: { value: .9 } }, depthTest: false, depthWrite: false });
  compMat.blending = THREE.CustomBlending; compMat.blendSrc = THREE.OneFactor; compMat.blendDst = THREE.OneFactor; compMat.blendSrcAlpha = THREE.ZeroFactor; compMat.blendDstAlpha = THREE.OneFactor; compMat.transparent = true;
  let rtA = null, rtB = null;

  const S = {
    mode: null, variant: 'cyan', visible: false, w: 0, h: 0, pr: 1, zoom: 1, rotY: 0, velY: .55, tiltX: 0, tiltZ: 0,
    dragTilt: 0, lastT: 0, glitchUntil: 0, nextGlitch: 3, pointers: new Map(), pinch0: 0, zoom0: 1, lensPx: [.5, .7], shieldPx: [.5, .34], sizeFrac: .42,
    devTilt: [0, 0], quality: 0, frames: 0, ms: 0, bloom: true
  };

  function setVariant(v) {
    S.variant = VARIANTS[v] ? v : 'cyan';
    const V = VARIANTS[S.variant];
    Object.keys(parts).forEach(k => {
      parts[k].material = V.solid ? solid[V.gold ? 'gold' : 'classic'][k] : holoMats[k];
      if (!V.solid) holoMats[k].uniforms.uColor.value.set(V.color);
      parts[k].renderOrder = V.solid ? 0 : 2;
    });
    edgeMat.color.set(V.edge); edgeMat.opacity = V.solid ? .18 : .55; edgeMatS.color.set(V.solid ? V.edge : '#ffffff'); edgeMatS.opacity = V.solid ? .15 : 1;
    beamU.uColor.value.set(V.beam); lensU.uColor.value.set(V.beam); dustU.uColor.value.set(V.dust);
    haloU.uColor.value.set(V.solid ? V.glow : V.color); haloU.uOpacity.value = V.solid ? .2 : .16;
    rim.color.set(V.solid ? (V.gold ? '#ffd27a' : '#8fd6ff') : V.color);
    scene.environment = V.solid ? envTex : null;
  }

  function layout() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
    const q = S.quality, prCap = [2, 1.6, 1.3, 1][q] || 1;
    const pr = Math.min(window.devicePixelRatio || 1, prCap);
    if (w !== S.w || h !== S.h || pr !== S.pr) {
      S.w = w; S.h = h; S.pr = pr;
      renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      const bw = Math.max(2, Math.round(w * pr / 4)), bh = Math.max(2, Math.round(h * pr / 4));
      if (rtA) { rtA.setSize(bw, bh); rtB.setSize(bw, bh); } else { rtA = new THREE.WebGLRenderTarget(bw, bh); rtB = new THREE.WebGLRenderTarget(bw, bh); }
      dustU.uPR.value = pr * (h / 700);
    }
    place();
  }
  /* Put the camera so the shield is sizeFrac of the canvas width, then unproject lens + shield screen targets. */
  const _v = new THREE.Vector3();
  function unproject(px, py, zPlane) {
    _v.set(px * 2 - 1, -(py * 2 - 1), .5).unproject(camera);
    const dir = _v.sub(camera.position).normalize(), t = (zPlane - camera.position.z) / dir.z;
    return camera.position.clone().add(dir.multiplyScalar(t));
  }
  function place() {
    const aspect = S.w / S.h, frac = S.sizeFrac * S.zoom, fovR = camera.fov * Math.PI / 180;
    const zS = 1.1, visW = 2.1 / frac, visH = visW / aspect, dist = visH / 2 / Math.tan(fovR / 2);
    camera.position.set(0, 0, zS + dist); camera.lookAt(0, 0, zS); camera.updateMatrixWorld();
    const L = unproject(S.lensPx[0], S.lensPx[1], 0), P = unproject(S.shieldPx[0], S.shieldPx[1], zS);
    rig.position.copy(P);
    lens.position.copy(L); lens.scale.setScalar(.55);
    const dir = P.clone().sub(L), len = dir.length();
    cone.position.copy(L).add(dir.clone().multiplyScalar(.5));
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    cone.scale.set(1.05, len, 1.05); beamU.uH.value = 1;
    dust.position.copy(L).add(dir.clone().multiplyScalar(.62)); dust.quaternion.copy(cone.quaternion);
    dustU.uH.value = len * 1.3;
  }

  function setQuality(q) {
    S.quality = q; S.bloom = q <= 1;
    dGeo.setDrawRange(0, [900, 560, 300, 140][q] || 140);
    S.w = 0; if (S.visible) layout();
  }

  function show(mode, parent, cfg) {
    S.mode = mode; S.visible = true;
    if (canvas.parentNode !== parent) parent.appendChild(canvas);
    canvas.dataset.mode = mode;
    Object.assign(S, cfg || {});
    S.zoom = 1; S.w = 0;
    requestAnimationFrame(layout); layout();
    S.t0 = performance.now();
  }
  function hide() { S.visible = false; S.mode = null; if (canvas.parentNode) canvas.parentNode.removeChild(canvas); S.pointers.clear(); }

  function frame(now) {
    if (!S.visible || document.hidden) return false;
    const t = now / 1000, dt = Math.min(.05, S.lastT ? t - S.lastT : .016); S.lastT = t;
    uniforms.uTime.value = t;
    /* intro ramp */
    const k = Math.min(1, (now - (S.t0 || now)) / 900), e = 1 - Math.pow(1 - k, 3);
    uniforms.uOpacity.value = e; shield.scale.setScalar(.6 + .4 * e); beamU.uOpacity.value = e; lensU.uOpacity.value = e;
    /* flicker + glitch */
    let fl = .92 + .08 * Math.sin(t * 31) * Math.sin(t * 17.3);
    if (Math.random() < .006) fl *= .55;
    uniforms.uFlicker.value = fl;
    if (t > S.nextGlitch) { S.glitchUntil = t + .16 + Math.random() * .12; S.nextGlitch = t + 2.5 + Math.random() * 4; }
    uniforms.uGlitch.value = t < S.glitchUntil ? 1 : Math.max(0, uniforms.uGlitch.value - dt * 8);
    if (VARIANTS[S.variant].solid) uniforms.uGlitch.value *= .35;
    /* motion */
    if (!S.pointers.size) { S.velY += (.55 - S.velY) * Math.min(1, dt * 1.2); S.dragTilt *= Math.pow(.2, dt); }
    S.rotY += S.velY * dt;
    const dev = S.devTilt;
    spin.rotation.set(S.dragTilt + dev[1] * .5 + Math.sin(t * .8) * .05, S.rotY, dev[0] * .25);
    rig.rotation.y = dev[0] * .35; shield.position.y = Math.sin(t * 1.3) * .05;
    edgeGroup.visible = true;
    if (VARIANTS[S.variant].solid) { halo.visible = true; } else halo.visible = true;
    halo.lookAt(camera.position); lens.lookAt(camera.position);
    render();
    S.frames++; return true;
  }
  function render() {
    const t0 = performance.now();
    renderer.setRenderTarget(null); renderer.autoClear = true; renderer.render(scene, camera);
    if (S.bloom && rtA) {
      camera.layers.disable(2); if (!VARIANTS[S.variant].solid) camera.layers.disable(3);
      renderer.setRenderTarget(rtA); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera);
      camera.layers.enable(2); camera.layers.enable(3);
      quad.material = blurMat;
      for (let i = 0; i < 2; i++) {
        const r = 1 + i * 1.6;
        blurMat.uniforms.tMap.value = rtA.texture; blurMat.uniforms.uDir.value.set(r / rtA.width, 0); renderer.setRenderTarget(rtB); renderer.render(quadScene, quadCam);
        blurMat.uniforms.tMap.value = rtB.texture; blurMat.uniforms.uDir.value.set(0, r / rtA.height); renderer.setRenderTarget(rtA); renderer.render(quadScene, quadCam);
      }
      renderer.setRenderTarget(null); renderer.autoClear = false;
      quad.material = compMat; compMat.uniforms.tMap.value = rtA.texture; compMat.uniforms.uStrength.value = VARIANTS[S.variant].solid ? .4 : 1.25;
      renderer.render(quadScene, quadCam); renderer.autoClear = true;
    }
    S.ms = S.ms * .9 + (performance.now() - t0) * .1;
  }

  /* interaction */
  function pDown(e) {
    S.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (S.pointers.size === 2) { const [a, b] = [...S.pointers.values()]; S.pinch0 = Math.hypot(a.x - b.x, a.y - b.y); S.zoom0 = S.zoom; }
    try { e.target.setPointerCapture(e.pointerId); } catch (_) { }
  }
  function pMove(e) {
    const p = S.pointers.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (S.pointers.size === 1) { S.velY = dx * .35; S.rotY += dx * .012; S.dragTilt = Math.max(-.7, Math.min(.7, S.dragTilt + dy * .008)); }
    else if (S.pointers.size === 2) { const [a, b] = [...S.pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (S.pinch0 > 0) setZoom(S.zoom0 * d / S.pinch0); }
  }
  function pUp(e) { S.pointers.delete(e.pointerId); if (S.pointers.size < 2) S.pinch0 = 0; }
  function setZoom(z) { S.zoom = Math.max(.55, Math.min(2.2, z)); if (S.w) place(); }
  function wheel(e) { e.preventDefault(); setZoom(S.zoom * Math.exp(-e.deltaY * .0015)); }
  canvas.addEventListener('pointerdown', pDown); canvas.addEventListener('pointermove', pMove);
  canvas.addEventListener('pointerup', pUp); canvas.addEventListener('pointercancel', pUp);
  canvas.addEventListener('wheel', wheel, { passive: false });
  function onTilt(e) { if (e.gamma == null) return; S.devTilt = [Math.max(-1, Math.min(1, e.gamma / 40)), Math.max(-1, Math.min(1, (e.beta - 45) / 40))]; }
  addEventListener('deviceorientation', onTilt);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); S.lost = true; if (opts.onLost) opts.onLost(); });
  canvas.addEventListener('webglcontextrestored', () => { S.lost = false; });

  setVariant('cyan'); setQuality(0);
  return {
    canvas, state: S, VARIANTS, _parts: parts, show, hide, frame, setVariant, setQuality, layout, setZoom,
    pointerDown: pDown, pointerMove: pMove, pointerUp: pUp,
    drawTo(ctx, x, y, w, h) { if (!S.visible) return false; render(); ctx.drawImage(canvas, x, y, w, h); return true; },
    info() { return { renderer: 'three.js r' + THREE.REVISION, w: S.w, h: S.h, pr: S.pr, ms: S.ms, frames: S.frames, dust: dGeo.drawRange.count, bloom: S.bloom, variant: S.variant, mode: S.mode, zoom: S.zoom }; }
  };
}
