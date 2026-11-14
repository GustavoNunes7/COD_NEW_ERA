/*
 * COD New Era — Hero 3D
 * Uma fita vermelha em formato de nuvem (eco da marca) + poeira de dados.
 * Bundle: `npm run build` (esbuild) -> js/hero3d.js (IIFE, expõe window.CODHero).
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Points, BufferGeometry,
  Float32BufferAttribute, TubeGeometry, CatmullRomCurve3, Vector3, Color,
  MeshPhysicalMaterial, ShaderMaterial, DoubleSide, AdditiveBlending, PMREMGenerator,
  PointLight, AmbientLight, SRGBColorSpace, ACESFilmicToneMapping, MathUtils,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const RED = new Color('#ff1c2b');

function cloudCurve() {
  const p = [
    [-1.55, -0.55, 0.15], [-1.78, 0.02, 0.45], [-1.38, 0.5, 0.55], [-0.78, 0.58, 0.2],
    [-0.52, 1.05, -0.3], [0.02, 1.34, -0.6], [0.6, 1.04, -0.25], [0.86, 0.58, 0.25],
    [1.42, 0.52, 0.55], [1.82, 0.02, 0.3], [1.55, -0.52, -0.3], [0.8, -0.72, -0.6],
    [0.0, -0.68, -0.25],
  ].map(([x, y, z]) => new Vector3(x, y, z));
  return new CatmullRomCurve3(p, true, 'centripetal');
}

function swoosh() {
  const p = [[-1.25, -0.62, 0.7], [-0.4, -0.5, 0.55], [0.5, -0.2, 0.6], [1.35, 0.1, 0.8]]
    .map(([x, y, z]) => new Vector3(x, y, z));
  return new CatmullRomCurve3(p, false, 'centripetal');
}


/* Fita plana com perfil "squircle" e afunilamento opcional nas pontas */
function ribbonGeometry(curve, segs, width, thick, closed, taper) {
  const pts = [], idx = [];
  const prof = 12, n = 4; // pontos no perfil e expoente do squircle
  const up = new Vector3(0, 0, 1), tan = new Vector3(), side = new Vector3(), nor = new Vector3(), c = new Vector3();
  const sp = (v) => Math.sign(v) * Math.pow(Math.abs(v), 2 / n);
  for (let i = 0; i <= segs; i++) {
    const u = closed ? (i % segs) / segs : i / segs;
    curve.getPointAt(u, c); curve.getTangentAt(u, tan);
    side.crossVectors(tan, up).normalize();
    nor.crossVectors(side, tan).normalize();
    const k = taper ? Math.pow(Math.sin(Math.PI * u), 0.55) : 1;
    for (let j = 0; j < prof; j++) {
      const a = (j / prof) * Math.PI * 2;
      const ca = sp(Math.cos(a)) * width * k, sa = sp(Math.sin(a)) * thick * (0.4 + 0.6 * k);
      pts.push(c.x + side.x * ca + nor.x * sa, c.y + side.y * ca + nor.y * sa, c.z + side.z * ca + nor.z * sa);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < prof; j++) {
    const a = i * prof + j, b = i * prof + ((j + 1) % prof), d = (i + 1) * prof + j, e = (i + 1) * prof + ((j + 1) % prof);
    idx.push(a, d, b, b, d, e);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pts, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

const dustVS = `
  attribute float aSize; attribute float aSeed;
  uniform float uTime; uniform float uPx;
  varying float vA;
  void main(){
    vec3 p = position;
    p.y += sin(uTime*.4 + aSeed*6.28)*.08;
    p.x += cos(uTime*.3 + aSeed*12.5)*.06;
    vec4 mv = modelViewMatrix * vec4(p,1.);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPx * (4.2 / -mv.z);
    vA = .25 + .75 * fract(aSeed*7.13);
  }`;
const dustFS = `
  precision mediump float; varying float vA; uniform vec3 uColor;
  void main(){
    float d = length(gl_PointCoord-.5);
    float a = smoothstep(.5,.0,d) * vA;
    if(a<.01) discard;
    gl_FragColor = vec4(uColor, a);
  }`;

function init(canvas, opts = {}) {
  const lite = !!opts.lite;
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: !lite, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  if (!renderer.getContext()) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const camera = new PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.set(0, 0, 7.2);

  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  scene.add(new AmbientLight(0xffffff, 0.15));
  const key = new PointLight(0xff2a3a, 60, 14, 2); key.position.set(-2.6, 2.4, 3.4); scene.add(key);
  const rim = new PointLight(0xffe2d6, 28, 14, 2); rim.position.set(3.2, -1.4, 2.2); scene.add(rim);

  const mat = new MeshPhysicalMaterial({
    color: RED, metalness: 0.3, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, side: DoubleSide,
    emissive: new Color('#5a0008'), emissiveIntensity: 0.9,
  });
  const g = new Group();
  const seg = lite ? 220 : 420;
  const ribbon = new Mesh(ribbonGeometry(cloudCurve(), seg, 0.2, 0.07, true, false), mat);
  const sw = new Mesh(ribbonGeometry(swoosh(), seg / 2, 0.26, 0.08, false, true), mat);
  g.add(ribbon, sw);
  g.rotation.set(0.12, -0.35, 0);
  scene.add(g);

  // poeira de dados
  const N = lite ? 380 : 1100;
  const pos = new Float32Array(N * 3), size = new Float32Array(N), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = 2.4 + Math.pow(Math.random(), 0.7) * 4.6;
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th) * 1.25;
    pos[i * 3 + 1] = r * Math.cos(ph) * 0.8;
    pos[i * 3 + 2] = Math.min(r * Math.sin(ph) * Math.sin(th) - 1.5, 2.2);
    size[i] = Math.random() < 0.06 ? 2.2 + Math.random() * 2 : 0.35 + Math.random() * 0.9; seed[i] = Math.random();
  }
  const dg = new BufferGeometry();
  dg.setAttribute('position', new Float32BufferAttribute(pos, 3));
  dg.setAttribute('aSize', new Float32BufferAttribute(size, 1));
  dg.setAttribute('aSeed', new Float32BufferAttribute(seed, 1));
  const dm = new ShaderMaterial({
    vertexShader: dustVS, fragmentShader: dustFS, transparent: true, depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: dpr * 26 }, uColor: { value: new Color('#ff5a4a') } },
  });
  const dust = new Points(dg, dm);
  scene.add(dust);

  // estado
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let baseX = 0, baseY = 0, baseS = 1;
  let scrollP = 0, visible = true, running = false, raf = 0, w = 0, h = 0;
  const reduced = !!opts.reduced;

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // em telas estreitas afasta a câmera para a nuvem caber inteira
    camera.position.z = w / h < 0.8 ? 10.2 : w / h < 1.2 ? 8.4 : 7.2;
    const wide = w / h > 1.25;
    baseX = wide ? 1.75 : 0; baseY = wide ? 0.7 : (w / h < 0.8 ? 2.35 : 0.9); baseS = wide ? 0.78 : (w / h < 0.8 ? 0.6 : 0.8);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  const onMove = (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  if (!lite) window.addEventListener('pointermove', onMove, { passive: true });

  let t0 = performance.now();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = (now - t0) / 1000;
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    const float = reduced ? 0 : Math.sin(t * 0.8) * 0.08;
    g.rotation.y = -0.35 + mouse.x * 0.5 + (reduced ? 0 : Math.sin(t * 0.35) * 0.18);
    g.rotation.x = 0.12 + mouse.y * 0.25 + (reduced ? 0 : Math.cos(t * 0.3) * 0.06);
    g.position.y = baseY + float - scrollP * 0.8;
    g.position.x = baseX;
    g.scale.setScalar(baseS * (1 - scrollP * 0.25));
    dust.rotation.y = t * 0.02 + mouse.x * 0.08;
    dust.rotation.x = mouse.y * 0.05;
    dm.uniforms.uTime.value = reduced ? 0 : t;
    key.position.x = -2.6 + mouse.x * 2.2; key.position.y = 2.4 - mouse.y * 1.6;
    renderer.render(scene, camera);
  }
  function start() { if (!running && visible && !document.hidden) { running = true; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();

  return {
    setScroll(p) { scrollP = MathUtils.clamp(p, 0, 1); },
    destroy() {
      stop(); io.disconnect(); ro.disconnect(); window.removeEventListener('pointermove', onMove);
      dg.dispose(); dm.dispose(); mat.dispose(); ribbon.geometry.dispose(); sw.geometry.dispose();
      pmrem.dispose(); renderer.dispose();
    },
  };
}

window.CODHero = { init };
