// @id 073
// @name MANDEL_NEON
// @category MANDEL
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.5000, 0.5000, 0.5000) + vec3<f32>(0.5000, 0.5000, 0.5000) * cos(6.28318 * (vec3<f32>(2.0000, 1.0000, 0.0000) * s + vec3<f32>(0.5000, 0.2000, 0.2500))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 0.7000 * u.params.x;
  let sc = 5.2800 * u.params.y;
  let zoom = sc * (0.7 + 0.3 * sin(t * 0.15));
  let cc = uv * (1.0 / zoom) + vec2<f32>(-0.745, 0.115);
  var z = vec2<f32>(0.0, 0.0);
  var n = 0.0;
  for (var i: i32 = 0; i < 96; i = i + 1) {
    z = vec2<f32>(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + cc;
    if (dot(z, z) > 4.0) { break; }
    n = n + 1.0;
  }
  return pal(n * 0.03);
}
