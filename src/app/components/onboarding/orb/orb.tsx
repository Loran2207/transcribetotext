import { useEffect, useState } from "react";
import { SiriSheet } from "./vendor/siri-sheet";
import { cn } from "../../ui/utils";
import { isSpeaking, onSpeaking, voiceLevel } from "@/lib/voice";

/* The guide's face: the Siri Sheet orb from voiceorbs (MIT), a glass sphere
   with a sheet of light inside. Idle it breathes; while the guide speaks it
   goes to the "speaking" state and follows the loudness of the voice
   (voiceLevel, an AnalyserNode on the guide's audio). `still` keeps it idle
   where nothing is said (a hint strip, a dialog corner). Without WebGL the
   component draws its own CSS fallback. */

const FROM = "#93C5FD";
const TO = "#2563EB";

export function Orb({ size = 34, className, still = false }: { size?: number; className?: string; still?: boolean }) {
  const [speaking, setSpeaking] = useState(() => !still && isSpeaking());
  useEffect(() => {
    if (still) return;
    return onSpeaking(setSpeaking);
  }, [still]);
  return (
    <span aria-hidden className={cn("relative inline-flex shrink-0 rounded-full", className)} style={{ width: size, height: size }}>
      <SiriSheet state={speaking ? "speaking" : "idle"} size={size} levelRef={still ? undefined : voiceLevel} colorFrom={FROM} colorTo={TO} label="Guide" />
    </span>
  );
}
