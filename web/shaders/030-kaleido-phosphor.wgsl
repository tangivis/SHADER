// @id 030
// @name KALEIDO_PHOSPHOR
// @category KALEIDO
// @knob FOLD 0.0000 8.0000 0.0000
fn pal(t: f32) -> vec3<f32> { let s = t + u.params.z; return vec3<f32>(0.0000, 0.4000, 0.1000) + vec3<f32>(0.1000, 0.5000, 0.1000) * cos(6.28318 * (vec3<f32>(1.0000, 1.0000, 1.0000) * s + vec3<f32>(0.0000, 0.2500, 0.1000))); }
fn mainImage(frag_coord: vec2<f32>) -> vec3<f32> {
  let R = u.resolution;
  let uv = (frag_coord - 0.5 * R) / R.y;
  let t = u.time * 0.9000 * u.params.x;
  let sc = 7.8000 * u.params.y;
  let r = length(uv);
  var a = atan2(uv.y, uv.x);
  a = abs(fract(a / 6.28318 * (sc + u.extra.x) + t * 0.1) - 0.5);
  let v = sin(a * 18.0) + sin(r * 10.0 - t);
  return pal(v * 0.25 + 0.5);
}
