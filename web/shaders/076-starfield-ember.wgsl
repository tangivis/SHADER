// @id 076
// @name STARFIELD_EMBER
// @category STARFIELD
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.5000, 0.5000, 0.5000) + vec3<f32>(0.5000, 0.5000, 0.5000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.1000, 0.2000))); }
fn h21(p: vec2<f32>) -> f32 { return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 1.0000 * u.params.x;
  let sc = 10.0000 * u.params.y;
  let g = uv * sc;
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
  return neb + star_col * (star + glow) * tw;
}
