// Generates web/shaders/*.wgsl : 20 families x 5 variants = 100 templates.
// Each file is a `mainImage` body (+ helpers) honoring the host contract in src/lib.rs.
// Run:  node web/scripts/gen-shaders.mjs
import { writeFileSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'shaders');

const f = (x) => Number(x).toFixed(4);
const v3 = ([a, b, c]) => `vec3<f32>(${f(a)}, ${f(b)}, ${f(c)})`;

// Inigo Quilez cosine palettes: color(t) = a + b*cos(2pi*(c*t + d))
const PALETTES = {
  EMBER:    { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1.0, 1.0, 1.0], d: [0.00, 0.10, 0.20] },
  PRISM:    { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1.0, 1.0, 1.0], d: [0.00, 0.33, 0.67] },
  NEON:     { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [2.0, 1.0, 0.0], d: [0.50, 0.20, 0.25] },
  TIDE:     { a: [0.2, 0.5, 0.6], b: [0.3, 0.4, 0.5], c: [1.0, 1.0, 1.0], d: [0.00, 0.15, 0.30] },
  PHOSPHOR: { a: [0.0, 0.4, 0.1], b: [0.1, 0.5, 0.1], c: [1.0, 1.0, 1.0], d: [0.00, 0.25, 0.10] },
};

const VARIANTS = [
  { suffix: 'EMBER',    pal: 'EMBER',    speed: 1.0, scale: 1.0 },
  { suffix: 'PRISM',    pal: 'PRISM',    speed: 1.4, scale: 1.7 },
  { suffix: 'NEON',     pal: 'NEON',     speed: 0.7, scale: 2.4 },
  { suffix: 'TIDE',     pal: 'TIDE',     speed: 1.1, scale: 0.7 },
  { suffix: 'PHOSPHOR', pal: 'PHOSPHOR', speed: 0.9, scale: 1.3 },
];

// Reusable WGSL helpers (declared before use; pal is added separately).
const H = {
  rot: `fn rot(a: f32) -> mat2x2<f32> { let s = sin(a); let c = cos(a); return mat2x2<f32>(c, s, -s, c); }`,
  h21: `fn h21(p: vec2<f32>) -> f32 { return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453); }`,
  h22: `fn h22(p: vec2<f32>) -> vec2<f32> { let q = vec2<f32>(dot(p, vec2<f32>(127.1, 311.7)), dot(p, vec2<f32>(269.5, 183.3))); return fract(sin(q) * 43758.5453); }`,
  vnoise: `fn vnoise(p: vec2<f32>) -> f32 {
  let i = floor(p); let fp = fract(p);
  let w = fp * fp * (3.0 - 2.0 * fp);
  let a = h21(i);
  let b = h21(i + vec2<f32>(1.0, 0.0));
  let c = h21(i + vec2<f32>(0.0, 1.0));
  let d = h21(i + vec2<f32>(1.0, 1.0));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}`,
  fbm: `fn fbm(p: vec2<f32>) -> f32 {
  var v = 0.0; var amp = 0.5; var q = p;
  for (var i: i32 = 0; i < 5; i = i + 1) { v = v + amp * vnoise(q); q = q * 2.0; amp = amp * 0.5; }
  return v;
}`,
};

// Each family: scalar `base`/`speed`, optional `helpers`, and a `pattern` body
// that ends in `return pal(...)`. `{SCALE}` is substituted per variant.
const FAMILIES = [
  { name: 'PLASMA', base: 8, speed: 1, knobs: [{ label: 'WARP', min: 0, max: 1, def: 0 }], pattern: `
  let w = u.extra.x * 0.6;
  let v = sin(uv.x * {SCALE} + t + sin(uv.y * 2.0 + t) * w) + sin(uv.y * {SCALE} - t) + sin((uv.x + uv.y) * {SCALE} * 0.5 + t) + sin(length(uv) * {SCALE} - t * 1.3);
  return pal(v * 0.25 + 0.5);` },

  { name: 'RIPPLE', base: 14, speed: 1, pattern: `
  let r = length(uv);
  let v = sin(r * {SCALE} - t * 2.0);
  return pal(v * 0.5 + 0.5 + r * 0.5);` },

  { name: 'SWIRL', base: 6, speed: 1, helpers: ['rot'], knobs: [{ label: 'TWIST', min: -1, max: 1, def: 0 }], pattern: `
  let r = length(uv);
  let p = rot(r * {SCALE} * 0.3 - t + r * u.extra.x * 4.0) * uv;
  let v = sin(p.x * 10.0) + sin(p.y * 10.0);
  return pal(v * 0.25 + 0.5);` },

  { name: 'TUNNEL', base: 8, speed: 1, knobs: [{ label: 'TWIST', min: -1, max: 1, def: 0 }], pattern: `
  let r = max(length(uv), 0.001);
  let a = atan2(uv.y, uv.x);
  let v = sin(a * {SCALE} + r * u.extra.x * 8.0) + sin(1.0 / r * 3.0 - t * 2.0);
  return pal(v * 0.25 + t * 0.1 + 0.5);` },

  { name: 'SPIRAL', base: 8, speed: 1, pattern: `
  let r = max(length(uv), 0.001);
  let a = atan2(uv.y, uv.x);
  let v = sin(a * {SCALE} + log(r) * 5.0 - t * 2.0);
  return pal(v * 0.5 + 0.5);` },

  { name: 'KALEIDO', base: 6, speed: 1, knobs: [{ label: 'FOLD', min: 0, max: 8, def: 0 }], pattern: `
  let r = length(uv);
  var a = atan2(uv.y, uv.x);
  a = abs(fract(a / 6.28318 * ({SCALE} + u.extra.x) + t * 0.1) - 0.5);
  let v = sin(a * 18.0) + sin(r * 10.0 - t);
  return pal(v * 0.25 + 0.5);` },

  { name: 'GRID', base: 6, speed: 1, pattern: `
  let g = abs(fract(uv * {SCALE} + vec2<f32>(t * 0.1)) - 0.5);
  let line = smoothstep(0.0, 0.04, min(g.x, g.y));
  return pal((1.0 - line) * 0.6 + length(uv) * 0.5 + t * 0.05);` },

  { name: 'CHECKER', base: 6, speed: 1, pattern: `
  let c = floor(uv * {SCALE} + vec2<f32>(t * 0.2, 0.0));
  let s = c.x + c.y;
  let parity = s - 2.0 * floor(s * 0.5);
  return pal(parity * 0.5 + length(uv) * 0.4 + t * 0.1);` },

  { name: 'STRIPES', base: 18, speed: 1, pattern: `
  let v = sin(dot(uv, vec2<f32>(0.8, 0.6)) * {SCALE} - t * 2.0);
  return pal(v * 0.5 + 0.5);` },

  { name: 'WAVES', base: 8, speed: 1, pattern: `
  let w = sin(uv.x * {SCALE} + sin(uv.y * {SCALE} * 0.5 + t) * 2.0 + t);
  return pal(w * 0.5 + 0.5 + uv.y * 0.3);` },

  { name: 'INTERFERE', base: 16, speed: 1, pattern: `
  let s1 = sin(length(uv - vec2<f32>(0.45, 0.0)) * {SCALE} - t * 2.0);
  let s2 = sin(length(uv + vec2<f32>(0.45, 0.0)) * {SCALE} - t * 2.0);
  return pal((s1 + s2) * 0.25 + 0.5);` },

  { name: 'DOTS', base: 10, speed: 1, pattern: `
  let cell = fract(uv * {SCALE}) - 0.5;
  let id = floor(uv * {SCALE});
  let pulse = 0.35 + 0.15 * sin(t * 2.0 + id.x * 0.7 + id.y * 1.3);
  let v = smoothstep(pulse, pulse - 0.05, length(cell));
  return pal(v * 0.7 + (id.x + id.y) * 0.04 + t * 0.1);` },

  { name: 'METABALL', base: 1, speed: 1, pattern: `
  var s = 0.0;
  for (var i: i32 = 0; i < 6; i = i + 1) {
    let fi = f32(i);
    let c = vec2<f32>(sin(t * 0.8 + fi * 1.3) * 0.6, cos(t * 0.9 + fi * 2.1) * 0.5);
    let d = uv - c;
    s = s + 0.05 / (dot(d, d) + 0.01);
  }
  return pal(s * {SCALE} * 0.2 + t * 0.1);` },

  { name: 'JULIA', base: 1.3, speed: 1, knobs: [{ label: 'MORPH', min: -1, max: 1, def: 0 }], pattern: `
  let c = vec2<f32>(0.355 * cos(t * 0.3), 0.355 * sin(t * 0.3)) + vec2<f32>(u.extra.x * 0.25);
  var z = uv * {SCALE};
  var n = 0.0;
  for (var i: i32 = 0; i < 64; i = i + 1) {
    z = vec2<f32>(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 4.0) { break; }
    n = n + 1.0;
  }
  return pal(n * 0.025 + t * 0.05);` },

  { name: 'MANDEL', base: 2.2, speed: 1, pattern: `
  let zoom = {SCALE} * (0.7 + 0.3 * sin(t * 0.15));
  let cc = uv * (1.0 / zoom) + vec2<f32>(-0.745, 0.115);
  var z = vec2<f32>(0.0, 0.0);
  var n = 0.0;
  for (var i: i32 = 0; i < 96; i = i + 1) {
    z = vec2<f32>(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + cc;
    if (dot(z, z) > 4.0) { break; }
    n = n + 1.0;
  }
  return pal(n * 0.03);` },

  { name: 'STARFIELD', base: 10, speed: 1, helpers: ['h21'], pattern: `
  let g = uv * {SCALE};
  let id = floor(g);
  let fp = fract(g) - 0.5;
  let rnd = h21(id);
  let bright = step(0.78, rnd);
  let d = length(fp);
  let star = bright * smoothstep(0.18, 0.0, d);
  let glow = bright * 0.16 / (d * d * 26.0 + 0.35);
  let tw = 0.6 + 0.4 * sin(t * 3.0 + rnd * 30.0);
  let neb = pal(fract(rnd + length(uv) * 0.25 + t * 0.03)) * 0.22;
  let star_col = pal(0.55 + rnd * 0.35);
  return neb + star_col * (star + glow) * tw;` },

  { name: 'VORONOI', base: 6, speed: 1, helpers: ['h22'], knobs: [{ label: 'JITTER', min: -1, max: 1, def: 0 }], pattern: `
  let g = uv * {SCALE};
  let id = floor(g);
  let fp = fract(g);
  var md = 8.0;
  for (var j: i32 = -1; j <= 1; j = j + 1) {
    for (var i: i32 = -1; i <= 1; i = i + 1) {
      let o = vec2<f32>(f32(i), f32(j));
      let rnd = h22(id + o);
      let pt = o + vec2<f32>(0.5) + (0.5 + u.extra.x * 0.4) * sin(vec2<f32>(t) + 6.28318 * rnd);
      md = min(md, length(fp - pt));
    }
  }
  return pal(md + t * 0.1);` },

  { name: 'CLOUDS', base: 3, speed: 1, helpers: ['h21', 'vnoise', 'fbm'], pattern: `
  let p = uv * {SCALE};
  let n = fbm(p + vec2<f32>(t * 0.2, t * 0.1));
  return pal(n * 1.2 + t * 0.05);` },

  { name: 'LAVA', base: 3, speed: 1, helpers: ['h21', 'vnoise', 'fbm'], pattern: `
  let p = uv * {SCALE};
  let q = vec2<f32>(fbm(p + vec2<f32>(0.0, t * 0.15)), fbm(p + vec2<f32>(5.2, 1.3)));
  let n = fbm(p + 4.0 * q);
  return pal(n * 1.3 + t * 0.05);` },

  { name: 'MOIRE', base: 20, speed: 1, pattern: `
  let a = sin(length(uv) * {SCALE} - t);
  let b = sin(length(uv - vec2<f32>(0.12, 0.0)) * {SCALE} + t * 1.2);
  return pal(a * b * 0.5 + 0.5);` },
];

function fileContent(id, name, fam, variant) {
  const scale = f(fam.base * variant.scale);
  const speed = f(fam.speed * variant.speed);
  const p = PALETTES[variant.pal];
  const palFn = `fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return ${v3(p.a)} + ${v3(p.b)} * cos(6.28318 * (${v3(p.c)} * s + ${v3(p.d)})); }`;
  const helpers = (fam.helpers || []).map((h) => H[h]).join('\n');
  const pattern = fam.pattern.replaceAll('{SCALE}', 'sc');
  const knobLines = (fam.knobs || [])
    .map((k) => `// @knob ${k.label} ${f(k.min)} ${f(k.max)} ${f(k.def)}`)
    .join('\n');
  return `// @id ${id}
// @name ${name}
// @category ${fam.name}${knobLines ? '\n' + knobLines : ''}
${palFn}${helpers ? '\n' + helpers : ''}
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * ${speed} * u.params.x;
  let sc = ${scale} * u.params.y;${pattern}
}
`;
}

// fresh output dir
mkdirSync(OUT, { recursive: true });
for (const fn of readdirSync(OUT)) {
  if (fn.endsWith('.wgsl')) rmSync(join(OUT, fn));
}

let id = 0;
for (const fam of FAMILIES) {
  for (const variant of VARIANTS) {
    id += 1;
    const idStr = String(id).padStart(3, '0');
    const name = `${fam.name}_${variant.suffix}`;
    const fname = `${idStr}-${fam.name.toLowerCase()}-${variant.suffix.toLowerCase()}.wgsl`;
    writeFileSync(join(OUT, fname), fileContent(idStr, name, fam, variant));
  }
}

console.log(`generated ${id} shaders into ${OUT}`);
