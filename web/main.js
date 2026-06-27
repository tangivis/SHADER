import init, { Playground } from './pkg/shadersmith.js';

// Load every shader template at build time as a raw string (Vite glob).
const files = import.meta.glob('./shaders/*.wgsl', { query: '?raw', import: 'default', eager: true });

const meta = (code, re) => (code.match(re)?.[1] ?? '').trim();
const SHADERS = Object.values(files)
  .map((code) => ({
    id: meta(code, /@id\s+(.+)/),
    name: meta(code, /@name\s+(.+)/),
    category: meta(code, /@category\s+(.+)/),
    code,
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

let playground = null;
let filtered = SHADERS.slice();
let current = 0;

const $ = (id) => document.getElementById(id);

async function boot() {
  await init();
  const canvas = $('stage');
  setupResize(canvas);
  playground = await Playground.create(canvas);

  buildList();
  loadIndex(0);
  pushParams();
  wireInput(canvas);
}

function setupResize(canvas) {
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
  };
  window.addEventListener('resize', resize);
  resize();
}

function buildList() {
  const list = $('list');
  list.innerHTML = '';
  filtered.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML =
      `<span class="marker"></span>` +
      `<span class="id">[${s.id}]</span>` +
      `<span class="nm">${s.name}</span>` +
      `<span class="cat">${s.category}</span>`;
    row.addEventListener('click', () => loadIndex(i));
    list.appendChild(row);
  });
  $('count').textContent = `[${filtered.length} entries]`;
}

function loadIndex(i) {
  if (!filtered.length) return;
  current = Math.max(0, Math.min(i, filtered.length - 1));
  const s = filtered[current];
  try {
    playground.set_shader(s.code);
  } catch (err) {
    console.error('shader failed (should not happen, all are pre-validated):', err);
    $('status').textContent = `> [${s.id}] ${s.name} · COMPILE ERROR`;
    return;
  }
  const rows = $('list').children;
  for (let k = 0; k < rows.length; k++) rows[k].classList.toggle('sel', k === current);
  rows[current]?.scrollIntoView({ block: 'nearest' });
  $('status').textContent = `> [${s.id}] ${s.name} · ${s.category} · ● LIVE`;
  resetParams();
  buildExtras(s);
}

function applyFilter(q) {
  q = q.trim().toLowerCase();
  filtered = q
    ? SHADERS.filter((s) => `${s.id} ${s.name} ${s.category}`.toLowerCase().includes(q))
    : SHADERS.slice();
  buildList();
  loadIndex(0);
}

const PARAMS = [
  { key: 'speed', def: 1 },
  { key: 'scale', def: 1 },
  { key: 'hue', def: 0 },
  { key: 'bright', def: 1 },
];

function pushParams() {
  const v = PARAMS.map((p) => parseFloat($(`p-${p.key}`).value));
  playground.set_params(v[0], v[1], v[2], v[3]);
  PARAMS.forEach((p, i) => { $(`v-${p.key}`).textContent = v[i].toFixed(2); });
}

function resetParams() {
  PARAMS.forEach((p) => { $(`p-${p.key}`).value = p.def; });
  pushParams();
}

let currentKnobs = [];

// Build per-shader custom sliders from the file's `// @knob LABEL min max def` headers.
function buildExtras(shader) {
  const box = $('extras');
  box.innerHTML = '';
  currentKnobs = [...shader.code.matchAll(/@knob\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/g)]
    .map((m) => ({ label: m[1], min: parseFloat(m[2]), max: parseFloat(m[3]), def: parseFloat(m[4]) }));

  if (currentKnobs.length) {
    const h = document.createElement('div');
    h.className = 'ln dim';
    h.textContent = `── ${shader.category} KNOBS ──`;
    box.appendChild(h);
  }
  currentKnobs.forEach((k, i) => {
    const row = document.createElement('label');
    row.className = 'prm';
    row.innerHTML =
      `<span class="pk">${k.label}</span>` +
      `<input type="range" id="e-${i}" min="${k.min}" max="${k.max}" step="0.01" value="${k.def}" />` +
      `<span class="pv" id="v-e-${i}">${k.def.toFixed(2)}</span>`;
    box.appendChild(row);
    $(`e-${i}`).addEventListener('input', pushExtras);
  });
  pushExtras();
}

function pushExtras() {
  const v = [0, 0, 0, 0];
  currentKnobs.forEach((k, i) => {
    v[i] = parseFloat($(`e-${i}`).value);
    $(`v-e-${i}`).textContent = v[i].toFixed(2);
  });
  playground.set_extra(v[0], v[1], v[2], v[3]);
}

function wireInput(canvas) {
  $('filter').addEventListener('input', (e) => applyFilter(e.target.value));

  for (const p of PARAMS) {
    $(`p-${p.key}`).addEventListener('input', pushParams);
  }

  document.addEventListener('keydown', (e) => {
    const inInput = document.activeElement.tagName === 'INPUT';
    if (e.key === 'ArrowDown' && !inInput) { e.preventDefault(); loadIndex(current + 1); }
    else if (e.key === 'ArrowUp' && !inInput) { e.preventDefault(); loadIndex(current - 1); }
    else if (e.key === 'Enter') { loadIndex(current); }
    else if ((e.key === 'r' || e.key === 'R') && !inInput) { loadIndex(Math.floor(Math.random() * filtered.length)); }
    else if (e.key === '0' && !inInput) { resetParams(); buildExtras(filtered[current]); }
  });

  const sendMouse = (e, down) => {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;   // device px per css px
    const sy = canvas.height / r.height;
    const x = (e.clientX - r.left) * sx;
    const y = canvas.height - (e.clientY - r.top) * sy; // flip to bottom-left origin
    playground.set_mouse(x, y, down ?? e.buttons > 0);
  };
  canvas.addEventListener('pointermove', (e) => sendMouse(e));
  canvas.addEventListener('pointerdown', (e) => sendMouse(e, true));
  canvas.addEventListener('pointerup', (e) => sendMouse(e, false));
}

boot();
