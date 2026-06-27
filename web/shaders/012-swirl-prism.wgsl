// @id 012
// @name SWIRL_PRISM
// @category SWIRL
// @knob TWIST -1.0000 1.0000 0.0000
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.5000, 0.5000, 0.5000) + vec3<f32>(0.5000, 0.5000, 0.5000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.3300, 0.6700))); }
fn rot(a: f32) -> mat2x2<f32> { let s = sin(a); let c = cos(a); return mat2x2<f32>(c, s, -s, c); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 1.4000 * u.params.x;
  let sc = 10.2000 * u.params.y;
  let r = length(uv);
  let p = rot(r * sc * 0.3 - t + r * u.extra.x * 4.0) * uv;
  let v = sin(p.x * 10.0) + sin(p.y * 10.0);
  return pal(v * 0.25 + 0.5);
}
