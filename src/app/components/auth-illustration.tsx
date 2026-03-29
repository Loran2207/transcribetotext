import { useEffect, useRef } from "react"
import { FeatureShowcase } from "./feature-showcase"
import {
  siZoom,
  siGooglemeet,
  siYoutube,
  siGoogledrive,
  siDropbox,
} from "simple-icons"

/* ═══════════════════════════════════════════════════════════════════════════
   Data
   ═══════════════════════════════════════════════════════════════════════════ */

const TEAMS_PATH =
  "M20.625 3.6h-7.5a1.125 1.125 0 00-1.125 1.125v7.5A1.125 1.125 0 0013.125 13.35h7.5A1.125 1.125 0 0021.75 12.225v-7.5A1.125 1.125 0 0020.625 3.6zm-1.5 6.75h-1.5v3h-1.5v-3h-1.5V8.85h4.5v1.5zM17.25 3.15a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6zm5.25 4.2a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm.75.9h-2.7v4.5a2.25 2.25 0 01-2.25 2.25h-4.05a3.6 3.6 0 003.45 2.55h3.3a2.25 2.25 0 002.25-2.25v-5.1a1.95 1.95 0 00-2-1.95zM9.75 14.475v-9a2.25 2.25 0 012.25-2.25h4.35a3.6 3.6 0 00-3.6-3.075H5.4A2.25 2.25 0 003.15 2.4v10.35a3.6 3.6 0 003.075 3.563 3.6 3.6 0 003.525-1.838z"

const platformLogos = [
  { si: siZoom, name: "Zoom" },
  { si: siGooglemeet, name: "Meet" },
  { si: siYoutube, name: "YouTube" },
  { path: TEAMS_PATH, name: "Teams" },
  { si: siGoogledrive, name: "Drive" },
  { si: siDropbox, name: "Dropbox" },
]

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function AuthIllustration() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Canvas waveform animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener("resize", resize)

    const draw = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      ctx.clearRect(0, 0, width, height)
      const centerY = height / 2
      const bars = 80
      const barWidth = width / bars
      const maxHeight = height * 0.6

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + barWidth / 2
        const wave1 = Math.sin(i * 0.15 + time * 0.02) * 0.5
        const wave2 = Math.sin(i * 0.08 + time * 0.015) * 0.3
        const wave3 = Math.sin(i * 0.25 + time * 0.025) * 0.2
        const amplitude = (wave1 + wave2 + wave3 + 1) / 2
        const barHeight = Math.max(4, amplitude * maxHeight)

        const gradient = ctx.createLinearGradient(x, centerY - barHeight / 2, x, centerY + barHeight / 2)
        gradient.addColorStop(0, `rgba(99, 102, 241, ${0.12 + amplitude * 0.35})`)
        gradient.addColorStop(0.5, `rgba(129, 140, 248, ${0.18 + amplitude * 0.45})`)
        gradient.addColorStop(1, `rgba(99, 102, 241, ${0.12 + amplitude * 0.35})`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.roundRect(
          x - barWidth * 0.3,
          centerY - barHeight / 2,
          barWidth * 0.6,
          barHeight,
          barWidth * 0.3
        )
        ctx.fill()

        ctx.shadowColor = "rgba(99, 102, 241, 0.4)"
        ctx.shadowBlur = 15
      }
      time++
      animationId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden p-8 lg:p-12" style={{ background: "linear-gradient(160deg, #060818 0%, #030410 100%)" }}>
      {/* Animated waveform background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.6, filter: "blur(1px)" }}
      />

      {/* Dark gradient overlays */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #060818 0%, transparent 30%, transparent 70%, #030410 100%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(6,8,24,0.6) 0%, transparent 40%, transparent 60%, rgba(3,4,16,0.6) 100%)" }} />

      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(88,101,242,0.05)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.06em", color: "white" }}>
            TRANSCRIBETOTEXT<span style={{ color: "var(--primary)" }}>.AI</span>
          </span>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Headline */}
          <div className="mb-8 lg:mb-10">
            <h1 style={{ color: "white", fontSize: 48, fontWeight: 800, lineHeight: 1.1, margin: 0 }}>
              Audio & Video to Text
              <br />
              <span style={{ color: "var(--primary)" }}>in Seconds</span>
            </h1>
            <p className="mt-4 text-base lg:text-lg max-w-md leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              Transcribe files, translate to 100+ languages, record meetings, and capture voice notes. All powered by AI.
            </p>
          </div>

          {/* Feature showcase carousel */}
          <div className="max-w-lg">
            <FeatureShowcase />
          </div>
        </div>

        {/* Bottom section: Rating and platforms */}
        <div className="relative z-10 mt-auto" style={{ paddingTop: 24 }}>
          {/* Star rating */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{ color: "#FBBF24", fontSize: 18 }}>&#9733;</span>
              ))}
            </div>
            <span style={{ color: "white", fontSize: 15, fontWeight: 700 }}>4.9</span>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>from 2,400+ reviews</span>
          </div>

          {/* Platform logos */}
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const }}>
              Integrates with
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
              {platformLogos.map((platform) => (
                <div
                  key={platform.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <svg viewBox="0 0 24 24" width={18} height={18} fill="rgba(255,255,255,0.55)">
                    <path d={"si" in platform ? platform.si.path : platform.path} />
                  </svg>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 500, whiteSpace: "nowrap" }}>
                    {platform.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
