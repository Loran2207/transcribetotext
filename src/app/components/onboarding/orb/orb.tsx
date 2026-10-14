import { useEffect, useRef } from "react";
import fragmentCode from "./orb-shader.frag?raw";
import vertexCode from "./orb-shader.vert?raw";
import { cn } from "../../ui/utils";
import { voiceLevel } from "@/lib/voice";

/* The guide's face: a blue orb that breathes on its own and swells while the
   guide speaks. One WebGL2 quad, the shader does the rest (orb-shader.frag,
   after the ElevenLabs widget orb, MIT). The level comes from the voice module
   (an AnalyserNode on the guide's audio), read every frame, no React state.
   Without WebGL2 (or with reduced motion) a still gradient disc stands in. */

const NOISE = "/images/orb-noise.png";
const QUAD = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
/* the two brand blues of the ramp, sRGB */
const COLOR_A = "#2563EB";
const COLOR_B = "#93C5FD";

class OrbGL {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private raf: number | null = null;
  private clock = 0;
  private last = performance.now();
  private speed = 1;
  private level = 0;
  private offsets = new Float32Array(7).map(() => Math.random() * Math.PI * 2);
  private static noise: HTMLImageElement | null = null;
  private uTime: WebGLUniformLocation | null;
  private uVolume: WebGLUniformLocation | null;

  constructor(private canvas: HTMLCanvasElement, private read: () => number) {
    const gl = canvas.getContext("webgl2", { depth: false, stencil: false, antialias: true, premultipliedAlpha: false });
    if (!gl) throw new Error("no webgl2");
    this.gl = gl;
    this.program = this.link();
    this.uTime = gl.getUniformLocation(this.program, "uTime");
    this.uVolume = gl.getUniformLocation(this.program, "uVolume");

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 128, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    if (!OrbGL.noise) { OrbGL.noise = new Image(); OrbGL.noise.src = NOISE; }
    const img = OrbGL.noise;
    const copy = () => { if (!this.gl) return; this.gl.bindTexture(this.gl.TEXTURE_2D, tex); this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img); this.gl.generateMipmap(this.gl.TEXTURE_2D); };
    if (img.complete && img.naturalWidth) copy(); else img.addEventListener("load", copy, { once: true });

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    this.color("uColor1", COLOR_A); this.color("uColor2", COLOR_B);
    this.raf = requestAnimationFrame(this.frame);
  }

  resize(w: number, h: number) { this.canvas.width = w; this.canvas.height = h; this.gl.viewport(0, 0, w, h); }

  dispose() { if (this.raf !== null) cancelAnimationFrame(this.raf); this.gl = null as unknown as WebGL2RenderingContext; }

  private color(name: string, hex: string) {
    const c = [1, 3, 5].map((i) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2));
    this.gl.uniform3fv(this.gl.getUniformLocation(this.program, name), c);
  }

  private link() {
    const gl = this.gl;
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader"); return s; };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vertexCode));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fragmentCode));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("link");
    gl.useProgram(p);
    gl.uniform1i(gl.getUniformLocation(p, "uPerlinTexture"), 0);
    gl.uniform1fv(gl.getUniformLocation(p, "uOffsets"), this.offsets);
    return p;
  }

  private frame = (now: number) => {
    if (!this.gl) { this.raf = null; return; }
    const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
    const target = Math.max(0, Math.min(1, this.read()));
    /* the level follows the voice up at once and falls back slowly, like a breath */
    this.level += (target - this.level) * (target > this.level ? 0.5 : 0.08);
    const wanted = 1 + this.level * 3;
    this.speed += (wanted - this.speed) * 0.1;
    this.clock += dt * this.speed;
    this.gl.uniform1f(this.uTime, this.clock);
    this.gl.uniform1f(this.uVolume, this.level);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    this.raf = requestAnimationFrame(this.frame);
  };
}

export function Orb({ size = 34, className, still = false }: { size?: number; className?: string; still?: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const live = !still && !reduce;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !live) return;
    let orb: OrbGL | null = null;
    try { orb = new OrbGL(canvas, () => voiceLevel.current); } catch { return; }
    const px = Math.min(512, Math.round(size * Math.min(2, window.devicePixelRatio || 1)));
    orb.resize(px, px);
    return () => orb?.dispose();
  }, [live, size]);
  return (
    <span aria-hidden className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_30%_30%,#93C5FD,#2563EB_60%,#1E3A8A)] ring-2 ring-primary/15", className)} style={{ width: size, height: size }}>
      {/* the shader draws hard petals; a blur the size of the orb melts them into a glow, and the
          canvas is drawn a little larger so the blurred rim stays outside the circle */}
      {live && <canvas ref={ref} className="absolute block" style={{ left: "-8%", top: "-8%", width: "116%", height: "116%", filter: `blur(${Math.max(2, size * 0.075)}px) saturate(1.15)` }} />}
      <span className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0) 45%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 58%, rgba(30,58,138,0.35) 100%)" }} />
    </span>
  );
}
