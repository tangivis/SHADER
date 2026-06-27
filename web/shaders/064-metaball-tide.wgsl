// @id 064
// @name METABALL_TIDE
// @category METABALL
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.2000, 0.5000, 0.6000) + vec3<f32>(0.3000, 0.4000, 0.5000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.1500, 0.3000))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 1.1000 * u.params.x;
  let sc = 0.7000 * u.params.y;
  var s = 0.0;
  for (var i: i32 = 0; i < 6; i = i + 1) {
    let fi = f32(i);
    let c = vec2<f32>(sin(t * 0.8 + fi * 1.3) * 0.6, cos(t * 0.9 + fi * 2.1) * 0.5);
    let d = uv - c;
    s = s + 0.05 / (dot(d, d) + 0.01);
  }
  return pal(s * sc * 0.2 + t * 0.1);
}
