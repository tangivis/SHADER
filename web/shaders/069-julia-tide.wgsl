// @id 069
// @name JULIA_TIDE
// @category JULIA
// @knob MORPH -1.0000 1.0000 0.0000
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.2000, 0.5000, 0.6000) + vec3<f32>(0.3000, 0.4000, 0.5000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.1500, 0.3000))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 1.1000 * u.params.x;
  let sc = 0.9100 * u.params.y;
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
