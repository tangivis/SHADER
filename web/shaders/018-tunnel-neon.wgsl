// @id 018
// @name TUNNEL_NEON
// @category TUNNEL
// @knob TWIST -1.0000 1.0000 0.0000
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.5000, 0.5000, 0.5000) + vec3<f32>(0.5000, 0.5000, 0.5000) * cos(6.28318 * (vec3<f32>(2.0000, 1.0000, 0.0000) * s + vec3<f32>(0.5000, 0.2000, 0.2500))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 0.7000 * u.params.x;
  let sc = 19.2000 * u.params.y;
  let r = max(length(uv), 0.001);
  let a = atan2(uv.y, uv.x);
  let v = sin(a * sc + r * u.extra.x * 8.0) + sin(1.0 / r * 3.0 - t * 2.0);
  return pal(v * 0.25 + t * 0.1 + 0.5);
}
