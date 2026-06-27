// @id 053
// @name INTERFERE_NEON
// @category INTERFERE
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.5000, 0.5000, 0.5000) + vec3<f32>(0.5000, 0.5000, 0.5000) * cos(6.28318 * (vec3<f32>(2.0000, 1.0000, 0.0000) * s + vec3<f32>(0.5000, 0.2000, 0.2500))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 0.7000 * u.params.x;
  let sc = 38.4000 * u.params.y;
  let s1 = sin(length(uv - vec2<f32>(0.45, 0.0)) * sc - t * 2.0);
  let s2 = sin(length(uv + vec2<f32>(0.45, 0.0)) * sc - t * 2.0);
  return pal((s1 + s2) * 0.25 + 0.5);
}
