// @id 055
// @name INTERFERE_PHOSPHOR
// @category INTERFERE
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.0000, 0.4000, 0.1000) + vec3<f32>(0.1000, 0.5000, 0.1000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.2500, 0.1000))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 0.9000 * u.params.x;
  let sc = 20.8000 * u.params.y;
  let s1 = sin(length(uv - vec2<f32>(0.45, 0.0)) * sc - t * 2.0);
  let s2 = sin(length(uv + vec2<f32>(0.45, 0.0)) * sc - t * 2.0);
  return pal((s1 + s2) * 0.25 + 0.5);
}
