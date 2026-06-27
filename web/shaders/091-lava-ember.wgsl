// @id 091
// @name LAVA_EMBER
// @category LAVA
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.5000, 0.5000, 0.5000) + vec3<f32>(0.5000, 0.5000, 0.5000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.1000, 0.2000))); }
fn h21(p: vec2<f32>) -> f32 { return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453); }
fn vnoise(p: vec2<f32>) -> f32 {
  let i = floor(p); let fp = fract(p);
  let w = fp * fp * (3.0 - 2.0 * fp);
  let a = h21(i);
  let b = h21(i + vec2<f32>(1.0, 0.0));
  let c = h21(i + vec2<f32>(0.0, 1.0));
  let d = h21(i + vec2<f32>(1.0, 1.0));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}
fn fbm(p: vec2<f32>) -> f32 {
  var v = 0.0; var amp = 0.5; var q = p;
  for (var i: i32 = 0; i < 5; i = i + 1) { v = v + amp * vnoise(q); q = q * 2.0; amp = amp * 0.5; }
  return v;
}
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 1.0000 * u.params.x;
  let sc = 3.0000 * u.params.y;
  let p = uv * sc;
  let q = vec2<f32>(fbm(p + vec2<f32>(0.0, t * 0.15)), fbm(p + vec2<f32>(5.2, 1.3)));
  let n = fbm(p + 4.0 * q);
  return pal(n * 1.3 + t * 0.05);
}
