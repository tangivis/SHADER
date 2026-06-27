// @id 048
// @name WAVES_NEON
// @category WAVES
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.5000, 0.5000, 0.5000) + vec3<f32>(0.5000, 0.5000, 0.5000) * cos(6.28318 * (vec3<f32>(2.0000, 1.0000, 0.0000) * s + vec3<f32>(0.5000, 0.2000, 0.2500))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 0.7000 * u.params.x;
  let sc = 19.2000 * u.params.y;
  let w = sin(uv.x * sc + sin(uv.y * sc * 0.5 + t) * 2.0 + t);
  return pal(w * 0.5 + 0.5 + uv.y * 0.3);
}
