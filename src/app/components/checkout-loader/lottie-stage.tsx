import { useEffect, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";

/**
 * Loads a Lottie JSON from a public URL and plays it on loop. The JSON lives in
 * `/public/lottie` so it stays out of the main bundle and is fetched only when
 * this preview route is opened. Shows a soft placeholder while loading and a
 * quiet fallback if the file can't be read.
 */
export function LottieStage({
  src,
  w,
  h,
  speed = 1,
  reducedMotionFrame = 0,
  className,
}: {
  src: string;
  w: number;
  h: number;
  speed?: number;
  reducedMotionFrame?: number;
  className?: string;
}) {
  const [data, setData] = useState<object | null>(null);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const ref = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let active = true;
    setData(null);
    setFailed(false);
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (active) setData(json);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [src]);

  useEffect(() => {
    const player = ref.current;
    if (!player) return;
    player.setSpeed(speed);
    if (reducedMotion) player.goToAndStop(reducedMotionFrame, true);
    else player.play();
  }, [speed, data, reducedMotion, reducedMotionFrame]);

  // Dev only: register the player so the Figma capture script can freeze each
  // animation on a representative frame (Figma renders a still, not the loop).
  useEffect(() => {
    if (!data || !import.meta.env.DEV) return;
    const w = window as unknown as { __lotties?: LottieRefCurrentProps[] };
    w.__lotties = w.__lotties ?? [];
    const inst = ref.current;
    if (inst) w.__lotties.push(inst);
    return () => {
      if (w.__lotties && inst) w.__lotties = w.__lotties.filter((x) => x !== inst);
    };
  }, [data]);

  if (failed) {
    return (
      <div
        style={{ width: w, height: h }}
        className="flex items-center justify-center rounded-lg border border-dashed border-zinc-300 text-[11px] text-zinc-400"
      >
        animation unavailable
      </div>
    );
  }

  if (!data) {
    return <div style={{ width: w, height: h }} className="animate-pulse rounded-lg bg-zinc-100" />;
  }

  return (
    <Lottie
      lottieRef={ref}
      animationData={data}
      loop={!reducedMotion}
      autoplay={!reducedMotion}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
      style={{ width: w, height: h }}
      className={className}
    />
  );
}
