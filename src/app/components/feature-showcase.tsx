import { useEffect, useState, useCallback, useRef } from "react"
import {
  Upload,
  LanguageCircleIcon,
  CameraVideoIcon,
  Link,
  Mic,
  FileAudioIcon,
  CheckCircle,
  Globe,
} from "@hugeicons/core-free-icons"
import { Icon } from "@/app/components/ui/icon"

/* ═══════════════════════════════════════════════════════════════════════════
   Feature demos
   ═══════════════════════════════════════════════════════════════════════════ */

function FileUploadDemo() {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<"uploading" | "processing" | "done">("uploading")

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (stage === "uploading") { setStage("processing"); return 0 }
          if (stage === "processing") { setStage("done"); return 100 }
          return 100
        }
        return prev + (stage === "uploading" ? 2.5 : 4)
      })
    }, 50)
    return () => clearInterval(interval)
  }, [stage])

  return (
    <div className="space-y-6">
      {/* File card */}
      <div className="relative overflow-hidden rounded-2xl p-5 transition-all duration-500" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, rgba(139,149,255,0.2), rgba(139,149,255,0.05))", border: "1px solid rgba(139,149,255,0.1)" }}>
              <Icon icon={FileAudioIcon} size={20} style={{ color: "#8B95FF" }} />
            </div>
            {stage === "done" && (
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: "rgba(52,211,153,0.9)", boxShadow: "0 0 0 2px #060818" }}>
                <svg className="h-3 w-3 text-white" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-[15px] font-medium text-white/95 tracking-[-0.01em]">quarterly_review.mp4</p>
            <p className="text-[13px] text-white/40 mt-0.5">248.3 MB</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-3 px-1">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-white/50">{stage === "uploading" ? "Uploading" : stage === "processing" ? "Transcribing" : "Complete"}</span>
          <span className="text-[13px] font-mono text-white/70 tabular-nums">{stage === "done" ? "100" : progress.toFixed(0)}%</span>
        </div>
        <div className="relative h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out" style={{ width: `${stage === "done" ? 100 : progress}%`, background: "linear-gradient(to right, rgba(139,149,255,0.8), #8B95FF, rgba(139,149,255,0.8))" }} />
          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out" style={{ width: `${stage === "done" ? 100 : progress}%`, background: "rgba(255,255,255,0.2)", filter: "blur(4px)" }} />
        </div>
      </div>

      {/* Formats */}
      <div className="flex items-center gap-2 px-1">
        {["MP3", "MP4", "WAV", "M4A", "WEBM"].map((fmt) => (
          <span key={fmt} className="text-[11px] font-medium tracking-wide text-white/30 uppercase">{fmt}</span>
        ))}
      </div>
    </div>
  )
}

function TranslationDemo() {
  const [currentLang, setCurrentLang] = useState(0)
  const languages = [
    { code: "ES", name: "Spanish", text: "Los resultados trimestrales superaron las expectativas con un crecimiento del 23%." },
    { code: "DE", name: "German", text: "Die Quartalsergebnisse übertrafen die Erwartungen mit einem Wachstum von 23%." },
    { code: "JA", name: "Japanese", text: "四半期の業績は23%の成長で予想を上回りました。" },
    { code: "FR", name: "French", text: "Les résultats trimestriels ont dépassé les attentes avec une croissance de 23%." },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLang((prev) => (prev + 1) % languages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [languages.length])

  const current = languages[currentLang]

  return (
    <div className="space-y-6">
      {/* Language selector */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 items-center gap-2 px-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-[13px] font-medium text-white/90">EN</span>
          <span className="text-[11px] text-white/40">English</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)" }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(139,149,255,0.6)" }} />
          <div className="w-6 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)" }} />
        </div>
        <div className="flex h-9 items-center gap-2 px-4 rounded-xl" style={{ background: "rgba(139,149,255,0.08)", border: "1px solid rgba(139,149,255,0.2)" }}>
          <span className="text-[13px] font-semibold" style={{ color: "#8B95FF" }}>{current.code}</span>
          <span className="text-[11px]" style={{ color: "rgba(139,149,255,0.7)" }}>{current.name}</span>
        </div>
      </div>

      {/* Translation card */}
      <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p key={currentLang} className="text-[15px] text-white/85 leading-relaxed" style={{ animation: "fadeInUp 0.5s ease forwards" }}>
          {current.text}
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(139,149,255,0.2), transparent)" }} />
      </div>

      {/* Languages count */}
      <div className="flex items-center gap-3 px-1">
        <Icon icon={Globe} size={14} style={{ color: "rgba(255,255,255,0.35)" }} />
        <span className="text-[12px] text-white/35">100+ languages supported</span>
      </div>
    </div>
  )
}

function LiveMeetingDemo() {
  const [time, setTime] = useState(0)
  const [pulseOpacity, setPulseOpacity] = useState(1)

  useEffect(() => {
    const timeTimer = setInterval(() => setTime((t) => t + 1), 1000)
    const pulseTimer = setInterval(() => setPulseOpacity((o) => (o === 1 ? 0.4 : 1)), 800)
    return () => { clearInterval(timeTimer); clearInterval(pulseTimer) }
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  const participants = [
    { initials: "SC", name: "Sarah", color: "linear-gradient(135deg, rgba(96,165,250,0.8), rgba(59,130,246,0.8))" },
    { initials: "MR", name: "Marcus", color: "linear-gradient(135deg, rgba(52,211,153,0.8), rgba(16,185,129,0.8))" },
    { initials: "AK", name: "Alex", color: "linear-gradient(135deg, rgba(251,191,36,0.8), rgba(245,158,11,0.8))" },
  ]

  return (
    <div className="space-y-6">
      {/* Recording header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex items-center justify-center">
            <span className="absolute h-2 w-2 rounded-full bg-red-500 transition-opacity duration-500" style={{ opacity: pulseOpacity }} />
            <span className="h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="text-[13px] font-medium text-red-400/90">Recording</span>
        </div>
        <span className="text-[13px] font-mono text-white/60 tabular-nums">{formatTime(time)}</span>
      </div>

      {/* Participants card */}
      <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[12px] text-white/35 uppercase tracking-wider">Participants</span>
          <span className="text-[12px] text-white/40">{participants.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {participants.map((p, i) => (
              <div
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: p.color, zIndex: participants.length - i, boxShadow: "0 0 0 2px #060818" }}
              >
                <span className="text-[11px] font-semibold text-white">{p.initials}</span>
              </div>
            ))}
          </div>
          <span className="text-[13px] text-white/60">{participants.map((p) => p.name).join(", ")}</span>
        </div>
      </div>

      {/* Transcribing indicator */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1 h-3 rounded-full" style={{ background: "rgba(139,149,255,0.6)", animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite` }} />
          ))}
        </div>
        <span className="text-[13px] text-white/40">Transcribing in real-time</span>
      </div>
    </div>
  )
}

function UrlDemo() {
  const [phase, setPhase] = useState<"idle" | "typing" | "loading" | "done">("idle")
  const [typedUrl, setTypedUrl] = useState("")
  const fullUrl = "youtube.com/watch?v=dQw4w..."

  useEffect(() => {
    const sequence = async () => {
      await new Promise((r) => setTimeout(r, 600))
      setPhase("typing")
      for (let i = 0; i <= fullUrl.length; i++) {
        await new Promise((r) => setTimeout(r, 35))
        setTypedUrl(fullUrl.slice(0, i))
      }
      await new Promise((r) => setTimeout(r, 400))
      setPhase("loading")
      await new Promise((r) => setTimeout(r, 1800))
      setPhase("done")
    }
    sequence()
  }, [])

  return (
    <div className="space-y-6">
      {/* URL input */}
      <div className="rounded-2xl p-4 overflow-hidden transition-all duration-500" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <Icon icon={Link} size={16} style={{ color: "rgba(255,255,255,0.35)" }} />
          <div className="flex-1 min-w-0">
            {phase === "idle" ? (
              <span className="text-[14px] text-white/30">Paste any video URL...</span>
            ) : (
              <span className="text-[14px] text-white/80">
                {typedUrl}
                {phase === "typing" && <span className="inline-block w-0.5 h-4 ml-0.5 animate-pulse" style={{ background: "rgba(139,149,255,0.8)" }} />}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status card */}
      {phase !== "idle" && phase !== "typing" && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(139,149,255,0.05)", border: "1px solid rgba(139,149,255,0.1)", animation: "fadeInUp 0.5s ease forwards" }}>
          <div className="flex items-center gap-3">
            {phase === "loading" ? (
              <>
                <div className="h-4 w-4 rounded-full border-[1.5px] animate-spin" style={{ borderColor: "rgba(139,149,255,0.6)", borderTopColor: "transparent" }} />
                <span className="text-[14px] text-white/60">Fetching video metadata...</span>
              </>
            ) : (
              <>
                <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: "rgba(52,211,153,0.2)" }}>
                  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" /></svg>
                </div>
                <span className="text-[14px] text-white/60">Ready to transcribe</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Supported platforms */}
      <div className="flex items-center gap-3 px-1">
        {["YouTube", "Vimeo", "Loom", "Drive"].map((p, i) => (
          <span key={p} className="text-[11px] text-white/30 font-medium tracking-wide" style={{ opacity: 0.4 + i * 0.15 }}>{p}</span>
        ))}
      </div>
    </div>
  )
}

function MicrophoneDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsActive(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isActive) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let time = 0

    const draw = () => {
      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)
      const centerY = height / 2
      const bars = 32
      const barWidth = width / bars
      const maxHeight = height * 0.7

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + barWidth / 2
        const distFromCenter = Math.abs(i - bars / 2) / (bars / 2)
        const baseAmplitude = 1 - distFromCenter * 0.6
        const wave = Math.sin(i * 0.3 + time * 0.08) * 0.5 + 0.5
        const amplitude = baseAmplitude * wave * (0.3 + Math.random() * 0.4)
        const barHeight = Math.max(2, amplitude * maxHeight)

        const gradient = ctx.createLinearGradient(x, centerY - barHeight / 2, x, centerY + barHeight / 2)
        gradient.addColorStop(0, `rgba(99, 102, 241, ${0.2 + amplitude * 0.6})`)
        gradient.addColorStop(0.5, `rgba(139, 149, 255, ${0.3 + amplitude * 0.5})`)
        gradient.addColorStop(1, `rgba(99, 102, 241, ${0.2 + amplitude * 0.6})`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.roundRect(x - 1.5, centerY - barHeight / 2, 3, barHeight, 1.5)
        ctx.fill()
      }

      time++
      animationId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animationId)
  }, [isActive])

  return (
    <div className="space-y-6">
      {/* Mic button */}
      <div className="flex items-center justify-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-700" style={{
          background: isActive ? "rgba(139,149,255,0.1)" : "rgba(255,255,255,0.03)",
          border: isActive ? "1px solid rgba(139,149,255,0.2)" : "1px solid rgba(255,255,255,0.06)",
        }}>
          {isActive && <div className="absolute inset-0 rounded-2xl animate-ping" style={{ background: "rgba(139,149,255,0.05)", animationDuration: "2s" }} />}
          <Icon icon={Mic} size={24} style={{ color: isActive ? "#8B95FF" : "rgba(255,255,255,0.35)" }} />
        </div>
      </div>

      {/* Waveform */}
      <div className="flex items-center justify-center h-12">
        {isActive && <canvas ref={canvasRef} width={280} height={48} style={{ animation: "fadeInUp 0.5s ease forwards" }} />}
      </div>

      {/* Status */}
      <p className="text-center text-[13px] text-white/40">{isActive ? "Listening and transcribing..." : "Click to start"}</p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Feature tabs config
   ═══════════════════════════════════════════════════════════════════════════ */

interface FeatureTab {
  id: string
  icon: React.ReactNode
  label: string
}

const featureTabs: FeatureTab[] = [
  { id: "upload", icon: <Icon icon={Upload} size={16} />, label: "Files" },
  { id: "translate", icon: <Icon icon={LanguageCircleIcon} size={16} />, label: "Translate" },
  { id: "meeting", icon: <Icon icon={CameraVideoIcon} size={16} />, label: "Meetings" },
  { id: "url", icon: <Icon icon={Link} size={16} />, label: "URL" },
  { id: "mic", icon: <Icon icon={Mic} size={16} />, label: "Record" },
]

const demos: Record<string, React.ReactNode> = {
  upload: <FileUploadDemo />,
  translate: <TranslationDemo />,
  meeting: <LiveMeetingDemo />,
  url: <UrlDemo />,
  mic: <MicrophoneDemo />,
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main FeatureShowcase
   ═══════════════════════════════════════════════════════════════════════════ */

const DURATION = 6000

export function FeatureShowcase() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [demoKey, setDemoKey] = useState(0)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const progressRef = useRef<ReturnType<typeof setInterval>>()

  const goToFeature = useCallback((idx: number) => {
    setActiveIdx(idx)
    setDemoKey((k) => k + 1)
    setProgress(0)
  }, [])

  const startTimers = useCallback(() => {
    clearInterval(intervalRef.current)
    clearInterval(progressRef.current)
    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % featureTabs.length)
      setDemoKey((k) => k + 1)
      setProgress(0)
    }, DURATION)
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + 100 / (DURATION / 50), 100))
    }, 50)
  }, [])

  useEffect(() => {
    startTimers()
    return () => { clearInterval(intervalRef.current); clearInterval(progressRef.current) }
  }, [startTimers])

  const handleClick = (idx: number) => {
    goToFeature(idx)
    startTimers()
  }

  return (
    <div className="relative w-full">
      {/* Main card */}
      <div className="relative overflow-hidden rounded-3xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.01))", backdropFilter: "blur(40px)" }}>
        {/* Top gradient line */}
        <div className="absolute top-0 left-8 right-8 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)" }} />

        {/* Navigation tabs */}
        <div className="flex items-center p-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          {featureTabs.map((feature, idx) => (
            <button
              key={feature.id}
              onClick={() => handleClick(idx)}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-500"
              style={{ color: idx === activeIdx ? "white" : "rgba(255,255,255,0.4)" }}
            >
              {idx === activeIdx && (
                <div className="absolute inset-0 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", animation: "fadeInUp 0.3s ease forwards" }} />
              )}
              <span className="relative z-10 flex-shrink-0">{feature.icon}</span>
              <span className="relative z-10 text-[11px] font-medium whitespace-nowrap">{feature.label}</span>
            </button>
          ))}
        </div>

        {/* Demo content */}
        <div className="p-6 min-h-[300px]" key={demoKey}>
          <div style={{ animation: "fadeInUp 0.5s ease forwards" }}>
            {demos[featureTabs[activeIdx].id]}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div
            className="h-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%`, background: "linear-gradient(to right, rgba(139,149,255,0.4), rgba(139,149,255,0.6), rgba(139,149,255,0.4))" }}
          />
        </div>
      </div>

      {/* Ambient glow behind card */}
      <div className="absolute inset-0 rounded-3xl blur-2xl -z-10" style={{ background: "rgba(139,149,255,0.03)", transform: "scale(1.05)" }} />

      {/* Keyframe animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scaleY(0.4); opacity: 0.4; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes progress {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}
