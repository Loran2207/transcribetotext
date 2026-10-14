#version 300 es
precision highp float;

/* The guide's orb. Seven soft ovals drift around the centre over a perlin
   texture, two noisy rings sit at the rim, and a grey ramp turns into the two
   brand blues. Based on the ElevenLabs widget orb shader (MIT); uVolume is
   ours: speech swells the shapes and the rings. */

uniform float uTime;
uniform float uVolume;
uniform float uOffsets[7];
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform sampler2D uPerlinTexture;

in vec2 vUv;
out vec4 outColor;

const float PI = 3.14159265358979323846;

bool drawOval(vec2 polarUv, vec2 polarCenter, float a, float b, bool reverseGradient, float softness, out vec4 color) {
  vec2 p = polarUv - polarCenter;
  float oval = (p.x * p.x) / (a * a) + (p.y * p.y) / (b * b);
  float edge = smoothstep(1.0, 1.0 - softness, oval);
  if (edge > 0.0) {
    float gradient = reverseGradient ? (1.0 - (p.x / a + 1.0) / 2.0) : ((p.x / a + 1.0) / 2.0);
    color = vec4(vec3(gradient), 0.8 * edge);
    return true;
  }
  return false;
}

vec3 colorRamp(float g, vec3 c1, vec3 c2, vec3 c3, vec3 c4) {
  if (g < 0.33) return mix(c1, c2, g * 3.0);
  if (g < 0.66) return mix(c2, c3, (g - 0.33) * 3.0);
  return mix(c3, c4, (g - 0.66) * 3.0);
}

vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

float noise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float n = mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)), dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
  return 0.5 + 0.5 * n;
}

float sharpRing(float theta, float time) {
  vec2 noiseCoord = vec2(theta / (2.0 * PI), time * 0.1) * 5.0;
  float noise = (noise2D(noiseCoord) - 0.5) * 4.0;
  return 1.0 + noise * 0.5 * 1.5;
}

float smoothRing(vec2 uv, float time) {
  float angle = atan(uv.y, uv.x);
  if (angle < 0.0) angle += 2.0 * PI;
  vec2 noiseCoord = vec2(angle / (2.0 * PI), time * 0.1) * 6.0;
  float noise = (noise2D(noiseCoord) - 0.5) * 8.0;
  return 0.9 + noise * 0.3;
}

void main() {
  /* speech pulls the picture in, so every shape grows with the voice */
  vec2 uv = (vUv * 2.0 - 1.0) * (1.0 - uVolume * 0.22);
  float radius = length(uv);
  float theta = atan(uv.y, uv.x);
  if (theta < 0.0) theta += 2.0 * PI;

  vec4 color = vec4(1.0);
  float originalCenters[7] = float[7](0.0, 0.5 * PI, 1.0 * PI, 1.5 * PI, 2.0 * PI, 2.5 * PI, 3.0 * PI);
  float centers[7];
  for (int i = 0; i < 7; i++) centers[i] = originalCenters[i] + 0.5 * sin(uTime / 20.0 + uOffsets[i]);

  float a, b;
  vec4 ovalColor;
  for (int i = 0; i < 7; i++) {
    float noise = texture(uPerlinTexture, vec2(mod(centers[i] + uTime * 0.05, 1.0), 0.5)).r;
    a = noise * 1.5 + uVolume * 0.3;
    b = noise * 4.5;
    bool reverseGradient = (i % 2 == 1);
    float distTheta = abs(theta - centers[i]);
    if (distTheta > PI) distTheta = 2.0 * PI - distTheta;
    if (drawOval(vec2(distTheta, radius), vec2(0.0), a, b, reverseGradient, 0.4, ovalColor)) {
      color.rgb = mix(color.rgb, ovalColor.rgb, ovalColor.a);
      color.a = max(color.a, ovalColor.a);
    }
  }

  float ringRadius1 = sharpRing(theta, uTime);
  float ringRadius2 = smoothRing(uv, uTime);
  float ringAlpha1 = (radius >= ringRadius1) ? 0.3 : 0.0;
  float ringAlpha2 = smoothstep(ringRadius2 - 0.05, ringRadius2 + 0.05, radius) * (0.25 + uVolume * 0.35);
  float totalRingAlpha = max(ringAlpha1, ringAlpha2);
  color.rgb = 1.0 - (1.0 - color.rgb) * (1.0 - vec3(1.0) * totalRingAlpha);

  float luminance = color.r;
  color.rgb = colorRamp(luminance, vec3(0.0), uColor1, uColor2, vec3(1.0));
  outColor = color;
}
