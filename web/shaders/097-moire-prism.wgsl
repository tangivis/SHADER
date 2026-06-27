// @id 097
// @name MOIRE_PRISM
// @category MOIRE
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.5000, 0.5000, 0.5000) + vec3<f32>(0.5000, 0.5000, 0.5000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.3300, 0.6700))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 1.4000 * u.params.x;
  let sc = 34.0000 * u.params.y;
  let a = sin(length(uv) * sc - t);
  let b = sin(length(uv - vec2<f32>(0.12, 0.0)) * sc + t * 1.2);
  return pal(a * b * 0.5 + 0.5);
}
