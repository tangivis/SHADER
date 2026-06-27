// @id 050
// @name WAVES_PHOSPHOR
// @category WAVES
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.0000, 0.4000, 0.1000) + vec3<f32>(0.1000, 0.5000, 0.1000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.2500, 0.1000))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 0.9000 * u.params.x;
  let sc = 10.4000 * u.params.y;
  let w = sin(uv.x * sc + sin(uv.y * sc * 0.5 + t) * 2.0 + t);
  return pal(w * 0.5 + 0.5 + uv.y * 0.3);
}
