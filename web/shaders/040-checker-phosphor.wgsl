// @id 040
// @name CHECKER_PHOSPHOR
// @category CHECKER
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.0000, 0.4000, 0.1000) + vec3<f32>(0.1000, 0.5000, 0.1000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.2500, 0.1000))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 0.9000 * u.params.x;
  let sc = 7.8000 * u.params.y;
  let c = floor(uv * sc + vec2<f32>(t * 0.2, 0.0));
  let s = c.x + c.y;
  let parity = s - 2.0 * floor(s * 0.5);
  return pal(parity * 0.5 + length(uv) * 0.4 + t * 0.1);
}
