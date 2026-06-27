// @id 067
// @name JULIA_PRISM
// @category JULIA
// @knob MORPH -1.0000 1.0000 0.0000
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.5000, 0.5000, 0.5000) + vec3<f32>(0.5000, 0.5000, 0.5000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.3300, 0.6700))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 1.4000 * u.params.x;
  let sc = 2.2100 * u.params.y;
  let c = vec2<f32>(0.355 * cos(t * 0.3), 0.355 * sin(t * 0.3)) + vec2<f32>(u.extra.x * 0.25);
  var z = uv * sc;
  var n = 0.0;
  for (var i: i32 = 0; i < 64; i = i + 1) {
    z = vec2<f32>(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 4.0) { break; }
    n = n + 1.0;
  }
  return pal(n * 0.025 + t * 0.05);
}
