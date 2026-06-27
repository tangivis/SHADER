// @id 002
// @name PLASMA_PRISM
// @category PLASMA
// @knob WARP 0.0000 1.0000 0.0000
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.5000, 0.5000, 0.5000) + vec3<f32>(0.5000, 0.5000, 0.5000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.3300, 0.6700))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 1.4000 * u.params.x;
  let sc = 13.6000 * u.params.y;
  let w = u.extra.x * 0.6;
  let v = sin(uv.x * sc + t + sin(uv.y * 2.0 + t) * w) + sin(uv.y * sc - t) + sin((uv.x + uv.y) * sc * 0.5 + t) + sin(length(uv) * sc - t * 1.3);
  return pal(v * 0.25 + 0.5);
}
