// @id 041
// @name STRIPES_EMBER
// @category STRIPES
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.5000, 0.5000, 0.5000) + vec3<f32>(0.5000, 0.5000, 0.5000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.1000, 0.2000))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 1.0000 * u.params.x;
  let sc = 18.0000 * u.params.y;
  let v = sin(dot(uv, vec2<f32>(0.8, 0.6)) * sc - t * 2.0);
  return pal(v * 0.5 + 0.5);
}
