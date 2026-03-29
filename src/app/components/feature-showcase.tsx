import { useEffect, useState, useCallback } from "react"
import {
  Upload,
  LanguageCircleIcon,
  CameraVideoIcon,
  Link,
  Mic,
  FileAudioIcon,
  ArrowRight01Icon,
  CheckCircle,
  Globe,
} from "@hugeicons/core-free-icons"
import { Icon } from "@/app/components/ui/icon"

interface Feature {
  id: string
  icon: React.ReactNode
  title: string
  subtitle: string
  demo: React.ReactNode
}

function FileUploadDemo() {
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<"uploading" | "processing" | "done">("uploading")

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (stage === "uploading") {
            setStage("processing")
            return 0
          } else if (stage === "processing") {
            setStage("done")
            return 100
          }
          return 100
        }
        return prev + (stage === "uploading" ? 4 : 6)
      })
    }, 80)
    return () => clearInterval(interval)
  }, [stage])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(88,101,242,0.2)" }}>
          <Icon icon={FileAudioIcon} size={20} style={{ color: "var(--primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">quarterly_meeting.mp4</p>
          <p className="text-xs text-muted-foreground">248 MB</p>
        </div>
        {stage === "done" && <Icon icon={CheckCircle} size={20} style={{ color: "#34d399" }} />}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {stage === "uploading" ? "Uploading..." : stage === "processing" ? "Transcribing..." : "Complete"}
          </span>
          <span className="text-foreground font-mono">{stage === "done" ? "100" : progress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${stage === "done" ? 100 : progress}%`,
              background: "linear-gradient(to right, var(--primary), #60A5FA)",
            }}
          />
        </div>
      </div>
    </div>
  )
}

function TranslationDemo() {
  const [currentLang, setCurrentLang] = useState(0)
  const languages = [
    { code: "EN", name: "English", text: "The quarterly results exceeded expectations..." },
    { code: "ES", name: "Spanish", text: "Los resultados trimestrales superaron las expectativas..." },
    { code: "DE", name: "German", text: "Die Quartalsergebnisse übertrafen die Erwartungen..." },
    { code: "JA", name: "Japanese", text: "四半期の業績は予想を上回りました..." },
    { code: "ZH", name: "Chinese", text: "季度业绩超出预期..." },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLang((prev) => (prev + 1) % languages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [languages.length])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon icon={Globe} size={16} style={{ color: "var(--primary)" }} />
        <span className="text-xs text-muted-foreground">100+ languages supported</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-8 items-center gap-1.5 px-3 rounded-lg" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <span className="text-xs font-medium text-foreground">EN</span>
        </div>
        <Icon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" />
        <div className="flex h-8 items-center gap-1.5 px-3 rounded-lg" style={{ background: "rgba(88,101,242,0.2)", border: "1px solid rgba(88,101,242,0.3)" }}>
          <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>{languages[currentLang].code}</span>
        </div>
      </div>

      <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <p className="text-xs text-muted-foreground mb-1">{languages[currentLang].name}</p>
        <p className="text-sm text-foreground leading-relaxed" key={currentLang} style={{ animation: "fadeInUp 0.5s ease forwards" }}>
          {languages[currentLang].text}
        </p>
      </div>
    </div>
  )
}

function LiveMeetingDemo() {
  const [dots, setDots] = useState("")
  const [time, setTime] = useState(0)

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 400)
    const timeInterval = setInterval(() => {
      setTime((prev) => prev + 1)
    }, 1000)
    return () => {
      clearInterval(dotsInterval)
      clearInterval(timeInterval)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="text-xs font-medium text-red-400">Recording</span>
        </div>
        <span className="text-xs font-mono text-foreground">{formatTime(time)}</span>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex -space-x-2">
          {["S", "M", "A"].map((initial, i) => (
            <div
              key={i}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background text-xs font-medium text-foreground"
              style={{ background: "rgba(88,101,242,0.3)" }}
            >
              {initial}
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-1">3 participants</span>
      </div>

      <div className="p-3 rounded-xl" style={{ background: "rgba(88,101,242,0.1)", border: "1px solid rgba(88,101,242,0.2)" }}>
        <p className="text-sm text-foreground">Transcribing in real-time{dots}</p>
      </div>
    </div>
  )
}

function UrlDemo() {
  const [status, setStatus] = useState<"paste" | "fetching" | "done">("paste")
  const [showUrl, setShowUrl] = useState(false)

  useEffect(() => {
    const sequence = async () => {
      await new Promise((r) => setTimeout(r, 500))
      setShowUrl(true)
      await new Promise((r) => setTimeout(r, 800))
      setStatus("fetching")
      await new Promise((r) => setTimeout(r, 1500))
      setStatus("done")
    }
    sequence()
  }, [])

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Icon icon={Link} size={16} className="text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {showUrl ? (
              <span className="text-sm text-foreground truncate block" style={{ animation: "fadeInUp 0.3s ease forwards" }}>
                youtube.com/watch?v=dQw4w9WgXcQ
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Paste any video URL...</span>
            )}
          </div>
        </div>
      </div>

      {status !== "paste" && (
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(88,101,242,0.1)", border: "1px solid rgba(88,101,242,0.2)", animation: "fadeInUp 0.3s ease forwards" }}>
          {status === "fetching" ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
              <span className="text-sm text-foreground">Fetching video...</span>
            </>
          ) : (
            <>
              <Icon icon={CheckCircle} size={16} style={{ color: "#34d399" }} />
              <span className="text-sm text-foreground">Ready to transcribe</span>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {["YouTube", "Vimeo", "Loom"].map((platform) => (
          <span key={platform} className="px-2 py-1 text-xs rounded-md text-muted-foreground" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {platform}
          </span>
        ))}
      </div>
    </div>
  )
}

function MicrophoneDemo() {
  const [isRecording, setIsRecording] = useState(false)
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(12).fill(0.2))

  useEffect(() => {
    const startTimeout = setTimeout(() => setIsRecording(true), 500)
    return () => clearTimeout(startTimeout)
  }, [])

  useEffect(() => {
    if (!isRecording) return
    const interval = setInterval(() => {
      setWaveHeights(Array(12).fill(0).map(() => 0.2 + Math.random() * 0.8))
    }, 100)
    return () => clearInterval(interval)
  }, [isRecording])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <button
          className={`relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 ${
            isRecording ? "border-2 border-red-500" : "border-2"
          }`}
          style={{
            background: isRecording ? "rgba(239,68,68,0.2)" : "rgba(88,101,242,0.2)",
            borderColor: isRecording ? undefined : "var(--primary)",
          }}
        >
          {isRecording && <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(239,68,68,0.2)" }} />}
          <Icon icon={Mic} size={24} style={{ color: isRecording ? "#f87171" : "var(--primary)" }} />
        </button>
      </div>

      {isRecording && (
        <div className="flex items-center justify-center gap-1 h-8">
          {waveHeights.map((height, i) => (
            <div
              key={i}
              className="w-1 rounded-full transition-all duration-100"
              style={{ height: `${height * 100}%`, background: "linear-gradient(to top, var(--primary), #60A5FA)" }}
            />
          ))}
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {isRecording ? "Listening and transcribing..." : "Click to start recording"}
      </p>
    </div>
  )
}

const features: Feature[] = [
  {
    id: "upload",
    icon: <Icon icon={Upload} size={20} />,
    title: "Any File Format",
    subtitle: "MP3, MP4, WAV, M4A, and more",
    demo: <FileUploadDemo />,
  },
  {
    id: "translate",
    icon: <Icon icon={LanguageCircleIcon} size={20} />,
    title: "Instant Translation",
    subtitle: "Transcribe and translate simultaneously",
    demo: <TranslationDemo />,
  },
  {
    id: "meeting",
    icon: <Icon icon={CameraVideoIcon} size={20} />,
    title: "Live Meetings",
    subtitle: "Real-time meeting transcription",
    demo: <LiveMeetingDemo />,
  },
  {
    id: "url",
    icon: <Icon icon={Link} size={20} />,
    title: "URL Import",
    subtitle: "Paste any video link",
    demo: <UrlDemo />,
  },
  {
    id: "mic",
    icon: <Icon icon={Mic} size={20} />,
    title: "Voice Recording",
    subtitle: "Record directly from your mic",
    demo: <MicrophoneDemo />,
  },
]

export function FeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [key, setKey] = useState(0)

  const nextFeature = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % features.length)
    setKey((prev) => prev + 1)
  }, [])

  useEffect(() => {
    const interval = setInterval(nextFeature, 5000)
    return () => clearInterval(interval)
  }, [nextFeature])

  const activeFeature = features[activeIndex]

  return (
    <div className="relative">
      {/* Glass card container */}
      <div className="relative rounded-2xl border border-white/10 backdrop-blur-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
        {/* Header with feature tabs */}
        <div className="flex items-center gap-1 p-2 border-b border-white/5 overflow-x-auto">
          {features.map((feature, index) => (
            <button
              key={feature.id}
              onClick={() => {
                setActiveIndex(index)
                setKey((prev) => prev + 1)
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 flex-shrink-0 ${
                index === activeIndex ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
              style={index === activeIndex ? { background: "rgba(88,101,242,0.2)", color: "var(--primary)" } : undefined}
            >
              {feature.icon}
              <span className="text-xs font-medium hidden sm:inline">{feature.title.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Feature content */}
        <div className="p-6" key={key}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">{activeFeature.title}</h3>
            <p className="text-sm text-muted-foreground">{activeFeature.subtitle}</p>
          </div>
          <div style={{ animation: "fadeInUp 0.5s ease forwards" }}>{activeFeature.demo}</div>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1.5 p-4 pt-0">
          {features.map((_, index) => (
            <div key={index} className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={
                  index < activeIndex
                    ? { width: "100%", background: "rgba(88,101,242,0.5)" }
                    : index === activeIndex
                      ? { background: "var(--primary)", animation: "progress 5s linear forwards" }
                      : { width: 0 }
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Outer glow */}
      <div
        className="absolute -inset-1 rounded-2xl blur-xl -z-10"
        style={{ background: "linear-gradient(to right, rgba(88,101,242,0.2), rgba(59,130,246,0.1), rgba(88,101,242,0.2))", opacity: 0.4 }}
      />
    </div>
  )
}
