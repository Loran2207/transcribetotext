import { useEffect, useRef, useState } from "react"
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
   Animated Waveform — 3-layer canvas (light blue/indigo palette)
   ═══════════════════════════════════════════════════════════════════════════ */

function AnimatedWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener("resize", resize)

    const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

    const draw = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      ctx.clearRect(0, 0, width, height)

      const centerY = height * 0.5
      const bars = 120
      const barWidth = width / bars
      const maxHeight = height * 0.65

      // Layer 1 — Main prominent waveform
      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + barWidth / 2
        const normalizedX = i / bars
        const distFromCenter = Math.abs(normalizedX - 0.5) * 2
        const centerFalloff = 1 - easeInOutSine(distFromCenter) * 0.3

        const wave1 = Math.sin(i * 0.08 + time * 0.006) * 0.4
        const wave2 = Math.sin(i * 0.05 + time * 0.004 + Math.PI * 0.5) * 0.45
        const wave3 = Math.sin(i * 0.15 + time * 0.009) * 0.3
        const wave4 = Math.sin(i * 0.03 + time * 0.002) * 0.2
        const amplitude = ((wave1 + wave2 + wave3 + wave4 + 1.6) / 3.5) * centerFalloff
        const barHeight = Math.max(6, amplitude * maxHeight)

        const gradient = ctx.createLinearGradient(x, centerY - barHeight / 2, x, centerY + barHeight / 2)
        const alpha = 0.15 + amplitude * 0.5
        gradient.addColorStop(0, `rgba(0, 97, 255, ${alpha * 0.3})`)
        gradient.addColorStop(0.2, `rgba(37, 99, 235, ${alpha * 0.8})`)
        gradient.addColorStop(0.5, `rgba(59, 130, 246, ${alpha})`)
        gradient.addColorStop(0.8, `rgba(37, 99, 235, ${alpha * 0.8})`)
        gradient.addColorStop(1, `rgba(0, 97, 255, ${alpha * 0.3})`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.roundRect(x - barWidth * 0.35, centerY - barHeight / 2, barWidth * 0.7, barHeight, barWidth * 0.35)
        ctx.fill()
      }

      // Layer 2 — Ghost waveform above
      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + barWidth / 2
        const normalizedX = i / bars
        const distFromCenter = Math.abs(normalizedX - 0.5) * 2
        const centerFalloff = 1 - easeInOutSine(distFromCenter) * 0.5

        const wave1 = Math.sin(i * 0.07 + time * 0.005 + 0.5) * 0.35
        const wave2 = Math.sin(i * 0.11 + time * 0.008 + Math.PI) * 0.3
        const amplitude = ((wave1 + wave2 + 1) / 2.5) * centerFalloff
        const barHeight = Math.max(3, amplitude * maxHeight * 0.5)

        ctx.fillStyle = `rgba(59, 130, 246, ${0.06 + amplitude * 0.12})`
        ctx.beginPath()
        ctx.roundRect(x - barWidth * 0.2, centerY - barHeight / 2 - maxHeight * 0.35, barWidth * 0.4, barHeight, barWidth * 0.2)
        ctx.fill()
      }

      // Layer 3 — Ghost waveform below
      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + barWidth / 2
        const normalizedX = i / bars
        const distFromCenter = Math.abs(normalizedX - 0.5) * 2
        const centerFalloff = 1 - easeInOutSine(distFromCenter) * 0.6

        const wave1 = Math.sin(i * 0.09 + time * 0.007 - 0.3) * 0.3
        const wave2 = Math.sin(i * 0.13 + time * 0.006 + Math.PI * 0.7) * 0.25
        const amplitude = ((wave1 + wave2 + 1) / 2.5) * centerFalloff
        const barHeight = Math.max(2, amplitude * maxHeight * 0.4)

        ctx.fillStyle = `rgba(37, 99, 235, ${0.04 + amplitude * 0.08})`
        ctx.beginPath()
        ctx.roundRect(x - barWidth * 0.15, centerY - barHeight / 2 + maxHeight * 0.4, barWidth * 0.3, barHeight, barWidth * 0.15)
        ctx.fill()
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
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.9 }}
    />
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Light Beams — subtle moonlight effects
   ═══════════════════════════════════════════════════════════════════════════ */

function LightBeams() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Main moonlight beam */}
      <div
        className="absolute"
        style={{
          width: "250%",
          height: 180,
          top: "-5%",
          right: "-80%",
          background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.01) 15%, rgba(220,230,255,0.04) 30%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 55%, rgba(220,230,255,0.04) 70%, rgba(255,255,255,0.01) 85%, transparent 100%)",
          transform: "rotate(-35deg)",
          transformOrigin: "top right",
          filter: "blur(40px)",
          animation: "moonbeam 12s ease-in-out infinite",
        }}
      />

      {/* Secondary moonbeam */}
      <div
        className="absolute"
        style={{
          width: "220%",
          height: 120,
          top: "10%",
          right: "-70%",
          background: "linear-gradient(180deg, transparent 0%, rgba(200,210,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(200,210,255,0.02) 75%, transparent 100%)",
          transform: "rotate(-35deg)",
          transformOrigin: "top right",
          filter: "blur(50px)",
          animation: "moonbeam 16s ease-in-out 2s infinite",
        }}
      />

      {/* Soft highlight flicker */}
      <div
        className="absolute"
        style={{
          width: "200%",
          height: 100,
          top: "2%",
          right: "-75%",
          background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 60%, transparent 100%)",
          transform: "rotate(-35deg)",
          transformOrigin: "top right",
          filter: "blur(30px)",
          animation: "flicker 4s ease-in-out infinite",
        }}
      />

      {/* Moon glow source in top right */}
      <div
        className="absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          top: -150,
          right: -100,
          background: "radial-gradient(circle, rgba(220,230,255,0.15) 0%, rgba(180,200,255,0.05) 40%, transparent 70%)",
          filter: "blur(60px)",
          animation: "pulseGlow 6s ease-in-out infinite",
        }}
      />

      {/* Ambient glow at bottom left */}
      <div
        className="absolute rounded-full"
        style={{
          width: 350,
          height: 350,
          bottom: "0%",
          left: "-5%",
          background: "radial-gradient(circle, rgba(0,97,255,0.06) 0%, transparent 60%)",
          filter: "blur(50px)",
          animation: "pulseGlow 8s ease-in-out 3s infinite",
        }}
      />

      {/* Floating dust particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 1 + (i % 2),
            height: 1 + (i % 2),
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
            background: "rgba(220,230,255,0.4)",
            boxShadow: "0 0 6px rgba(180,200,255,0.3)",
            animation: `float ${8 + i * 2}s ease-in-out ${i * 1.5}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function AuthIllustration() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden p-6 lg:p-8 2xl:p-12" style={{ background: "linear-gradient(160deg, #060818 0%, #030410 100%)" }}>
      {/* 3-layer animated waveform background */}
      <AnimatedWaveform />

      {/* Light beam effects */}
      <LightBeams />

      {/* Layered gradient overlays for depth */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(6,8,24,0.7) 0%, rgba(6,8,24,0.4) 30%, rgba(6,8,24,0.4) 70%, rgba(3,4,16,0.7) 100%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, rgba(6,8,24,0.6) 0%, transparent 40%, transparent 60%, rgba(3,4,16,0.6) 100%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 0%, rgba(4,6,18,1) 80%)" }} />

      {/* Central accent glow — blue */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(0,97,255,0.04)" }} />

      {/* Top edge highlight */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: "linear-gradient(to right, transparent, rgba(59,130,246,0.2), transparent)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center mb-5 2xl:mb-8">
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.06em", color: "white" }}>
            TRANSCRIBETOTEXT<span style={{ color: "#3B82F6" }}>.AI</span>
          </span>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col justify-center min-h-0">
          {/* Headline */}
          <div className="mb-5 lg:mb-6 2xl:mb-10">
            <h1 className="text-[32px] lg:text-[36px] 2xl:text-[48px]" style={{ color: "white", fontWeight: 800, lineHeight: 1.1, margin: 0, letterSpacing: "-0.03em" }}>
              Audio & Video to Text
              <br />
              <span style={{ background: "linear-gradient(to right, #0061FF, #3B82F6, #60A5FA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent" }}>
                in Seconds
              </span>
            </h1>
            <p className="mt-3 2xl:mt-5 text-[13px] 2xl:text-base max-w-[400px] leading-[1.55]" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "-0.01em" }}>
              Transcribe files, translate to 100+ languages, record meetings,
              and capture voice notes. All powered by AI.
            </p>
          </div>

          {/* Feature showcase carousel */}
          <div className="max-w-[520px]">
            <FeatureShowcase />
          </div>
        </div>

        {/* Bottom section: Rating and platforms */}
        <div className="relative z-10 mt-auto pt-4 2xl:pt-6">
          {/* Star rating */}
          <div className="flex items-center gap-4 mb-3 2xl:mb-6">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{ color: "rgba(251,191,36,0.9)", fontSize: 14 }}>&#9733;</span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>4.9</span>
              <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                from 2,400+ reviews
              </span>
            </div>
          </div>

          {/* Platform logos — large cards with icon + name */}
          <div className="flex flex-col gap-2 2xl:gap-3">
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const }}>
              Integrates with
            </span>
            <div className="flex flex-wrap gap-2 2xl:gap-3 mt-1">
              {platformLogos.map((platform) => (
                <div
                  key={platform.name}
                  className="flex items-center gap-2 px-3 py-1.5 2xl:px-3.5 2xl:py-2 rounded-lg"
                  style={{
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

      {/* Keyframe animations */}
      <style>{`
        @keyframes moonbeam {
          0%, 100% { opacity: 0.6; transform: rotate(-35deg) translateY(0); }
          50% { opacity: 1; transform: rotate(-35deg) translateY(-10px); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-15px) translateX(5px); opacity: 0.7; }
          50% { transform: translateY(-8px) translateX(-3px); opacity: 0.5; }
          75% { transform: translateY(-20px) translateX(8px); opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
