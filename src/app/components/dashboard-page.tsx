import { useState } from "react";
import svgPaths from "../../imports/svg-i3wf63n6gj";
import svgCardPaths from "../../imports/svg-ckrcce85th";
const imgMainCard = "";
import { imgGroup, imgGroup1 } from "../../imports/svg-rnxzz";
import { RecordsTable } from "./records-table";
import { RightPanel } from "./right-panel";
import { motion } from "motion/react";
import { useTheme } from "./theme-context";
import { useLanguage } from "./language-context";
import { useTranscriptionModals } from "./transcription-modals";

/* ═══════════════════════════════════════════
   Card 1: Instant Speach
   ═══════════════════════════════════════════ */
function InstantSpeachCard() {
  const [hovered, setHovered] = useState(false);
  const { isDark } = useTheme();
  const cardBg = isDark ? "#1e1e26" : "#f5f5f5";
  const labelColor = isDark ? "#e5e7eb" : "black";
  const borderColor = isDark ? "#2a2a35" : "white";
  const noteBg = isDark ? "#1a2a4d" : "#e3f0fe";
  const lineBg = isDark ? "rgba(0,97,255,0.25)" : "rgba(0,97,255,0.16)";
  return (
    <div
      style={{ backgroundColor: cardBg }}
      className="flex flex-1 flex-col h-[210px] items-center justify-end rounded-[16px] overflow-hidden min-w-0 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Illustration */}
      <div className="flex-1 w-full relative overflow-hidden">
        <div className="absolute" style={{ left: "50%", top: "51px", transform: "translateX(calc(-50% + 4.5px))" }}>
        <motion.div animate={hovered ? { y: -3, rotate: -2 } : { y: 0, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <div style={{ backgroundColor: noteBg }} className="rounded-[6px] w-[70px] h-[60px] relative">
            <div className="absolute h-[64px] left-[-2px] rounded-[8px] top-[-2px] w-[74px]" style={{ border: `2px solid ${borderColor}` }} />
            <div style={{ backgroundColor: lineBg }} className="absolute h-[5px] left-[8px] rounded-[100px] top-[9px] w-[46px]" />
            <div style={{ backgroundColor: lineBg }} className="absolute h-[5px] left-[8px] rounded-[100px] top-[20px] w-[27px]" />
            <div style={{ backgroundColor: lineBg }} className="absolute h-[5px] left-[8px] rounded-[100px] top-[31px] w-[37px]" />
            <div className="absolute bg-[#0061ff] h-[6px] left-[42px] rounded-[100px] top-[46px] w-[20px]" />
          </div>
        </motion.div>
        </div>
        <div className="absolute" style={{ left: "50%", top: "41px", transform: "translateX(calc(-50% + 37.5px))" }}>
        <motion.div className="bg-[#0061ff] rounded-full size-[32px] relative" animate={hovered ? { y: -5, scale: 1.12 } : { y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
          <div className="flex items-center justify-center size-full p-[3px]">
            <svg className="size-[18px]" fill="none" viewBox="0 0 12 16.5"><path clipRule="evenodd" d={svgCardPaths.p227a9f00} fill="white" fillRule="evenodd" /></svg>
          </div>
          <div className="absolute inset-[-2px] pointer-events-none rounded-full" style={{ border: `2px solid ${borderColor}` }} />
        </motion.div>
        </div>
        {/* Waveform bar */}
        <div className="absolute" style={{ left: "50%", top: "107px", transform: "translateX(calc(-50% - 18px))" }}>
        <motion.div animate={hovered ? { y: -3, x: 2 } : { y: 0, x: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.04 }}>
          <div className="bg-[#0061ff] h-[20px] w-[52px] rounded-[100px] relative overflow-hidden">
            <div className="absolute bg-white h-[12px] left-[7px] rounded-[100px] top-[4px] w-[2px]" />
            <div className="absolute bg-white h-[12px] left-[11px] rounded-[100px] top-[4px] w-[2px]" />
            <div className="absolute bg-white h-[8px] left-[15px] rounded-[100px] top-[6px] w-[2px]" />
            <div className="absolute bg-white h-[10px] left-[19px] rounded-[100px] top-[5px] w-[2px]" />
            <div className="absolute bg-white h-[5px] left-[23px] rounded-[100px] top-[7.5px] w-[2px]" />
            <div className="absolute bg-white h-[5px] left-[27px] rounded-[100px] top-[7.5px] w-[2px]" />
            <div className="absolute bg-white h-[8px] left-[31px] rounded-[100px] top-[6px] w-[2px]" />
            <div className="absolute bg-white h-[10px] left-[35px] rounded-[100px] top-[5px] w-[2px]" />
            <div className="absolute bg-white h-[12px] left-[39px] rounded-[100px] top-[4px] w-[2px]" />
            <div className="absolute bg-white h-[12px] left-[43px] rounded-[100px] top-[4px] w-[2px]" />
            <div className="absolute inset-[-2px] pointer-events-none rounded-[102px]" style={{ border: `2px solid ${borderColor}` }} />
          </div>
        </motion.div>
        </div>
      </div>
      <div className="w-full px-[20px] pb-[20px]">
        <p className="text-center" style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 500, fontSize: "16px", lineHeight: 1.3, color: labelColor }}>{useLanguage().t("dash.card.instantSpeech")}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Card 2: Meeting Recorder
   ═══════════════════════════════════════════ */

function GoogleMeetIcon() {
  return (
    <div className="overflow-hidden relative shrink-0 size-[18px]" style={{ maskImage: `url('${imgGroup}')`, WebkitMaskImage: `url('${imgGroup}')`, maskSize: "16px 14px", WebkitMaskSize: "16px 14px", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "0px 0px", WebkitMaskPosition: "0px 0px" }}>
      <div className="absolute inset-[11.11%_5.55%_11.11%_5.56%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.0019 14.0009">
          <path d={svgPaths.p9cb4e00} fill="#00832D" />
          <path d={svgPaths.p2f589a00} fill="#0066DA" />
          <path d={svgPaths.p3051ddc0} fill="#E94235" />
          <path d={svgPaths.p3897d380} fill="#2684FC" />
          <path d={svgPaths.p1e609b00} fill="#00AC47" />
          <path d={svgPaths.p3f2567f0} fill="#FFBA00" />
        </svg>
      </div>
    </div>
  );
}

function ZoomIcon() {
  return (
    <div className="overflow-hidden relative shrink-0 size-[18px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <path d={svgPaths.p1dc0b8c0} fill="#2196F3" />
      </svg>
      <div className="absolute inset-[33.43%_19.96%_35.71%_22.73%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.3172 5.55522">
          <path clipRule="evenodd" d={svgPaths.p604de80} fill="white" fillRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}

function TeamsIcon() {
  return (
    <div className="overflow-hidden relative shrink-0 size-[18px]" style={{ maskImage: `url('${imgGroup1}')`, WebkitMaskImage: `url('${imgGroup1}')`, maskSize: "18px 16px", WebkitMaskSize: "18px 16px", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "0px 0px", WebkitMaskPosition: "0px 0px" }}>
      <div className="absolute inset-[5.56%_0]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9999 16.0001">
          <path d={svgPaths.p43f25f0} fill="#5059C9" />
          <path d={svgPaths.p27423a80} fill="#5059C9" />
          <path d={svgPaths.p32667a00} fill="#7B83EB" />
          <path d={svgPaths.p5b8d80} fill="#7B83EB" />
          <path d={svgPaths.p253be6b0} fill="black" opacity="0.1" />
          <path d={svgPaths.p6eab600} fill="black" opacity="0.2" />
          <path d={svgPaths.p3652b600} fill="black" opacity="0.2" />
          <path d={svgPaths.p272e7a00} fill="black" opacity="0.2" />
          <path d={svgPaths.p6c92700} fill="black" opacity="0.1" />
          <path d={svgPaths.p3a855300} fill="black" opacity="0.2" />
          <path d={svgPaths.p3a855300} fill="black" opacity="0.2" />
          <path d={svgPaths.p2e28ad00} fill="black" opacity="0.2" />
          <path d={svgPaths.p8825480} fill="url(#paint0_linear_teams)" />
          <path d={svgPaths.p29fcb300} fill="white" />
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_teams" x1="1.59984" x2="7.20899" y1="3.0275" y2="13.1943">
              <stop stopColor="#5A62C3" />
              <stop offset="0.5" stopColor="#4D55BD" />
              <stop offset="1" stopColor="#3940AB" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function MeetingRecorderCard() {
  const [hovered, setHovered] = useState(false);
  const { isDark } = useTheme();
  const cardBg = isDark ? "#1e1e26" : "#f5f5f5";
  const labelColor = isDark ? "#e5e7eb" : "black";
  const borderColor = isDark ? "#2a2a35" : "white";
  const pillBg = isDark ? "#2a2a35" : "white";
  return (
    <div
      style={{ backgroundColor: cardBg }}
      className="flex flex-1 flex-col h-[210px] items-center justify-end rounded-[16px] overflow-hidden min-w-0 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Illustration */}
      <div className="flex-1 w-full relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative" style={{ width: "118px", height: "128px", marginLeft: "-15px" }}>
            {/* Photo — offset right and down within composition */}
            <motion.div
              className="absolute"
              style={{ left: "30px", top: "15px" }}
              animate={hovered ? { rotate: 6, scale: 1.05 } : { rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
            >
              <div className="h-[112px] relative rounded-[6px] w-[88px] pointer-events-none">
                <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[6px] size-full" src={imgMainCard} />
                <div className="absolute inset-[-2px] rounded-[8px]" style={{ border: `2px solid ${borderColor}` }} />
              </div>
            </motion.div>
            {/* Icons pill — top-left corner of composition */}
            <motion.div
              className="absolute left-0 top-0 flex gap-[8px] items-center justify-center p-[8px] rounded-[6px]"
              style={{ backgroundColor: pillBg }}
              animate={hovered ? { y: -4, x: 3, scale: 1.05 } : { y: 0, x: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 22, delay: 0.02 }}
            >
              <div className="absolute inset-[-2px] pointer-events-none rounded-[8px]" style={{ border: `2px solid ${borderColor}` }} />
              <GoogleMeetIcon /><ZoomIcon /><TeamsIcon />
            </motion.div>
          </div>
        </div>
      </div>
      {/* Label */}
      <div className="w-full px-[20px] pb-[20px]">
        <p className="text-center" style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 500, fontSize: "16px", lineHeight: 1.3, color: labelColor }}>{useLanguage().t("dash.card.meetingRecorder")}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Card 3: Transcribe from Link
   ══════════════════════════════════════════ */
function TranscribeFromLinkCard() {
  const [hovered, setHovered] = useState(false);
  const { isDark } = useTheme();
  const cardBg = isDark ? "#1e1e26" : "#f5f5f5";
  const labelColor = isDark ? "#e5e7eb" : "black";
  const borderColor = isDark ? "#2a2a35" : "white";
  const dropboxBg = isDark ? "#152540" : "#e3f0fe";
  const driveBg = isDark ? "#3d2e10" : "#fff3d5";
  const youtubeBg = isDark ? "#3d1a18" : "#feeceb";
  const iconBg = isDark ? "#2a2a35" : "white";
  const serviceTextDark = isDark ? "#a5b3c5" : "#0a3380";
  const serviceTextWarm = isDark ? "#c9a87c" : "#602706";
  return (
    <div
      style={{ backgroundColor: cardBg }}
      className="flex flex-1 flex-col h-[210px] items-center justify-end rounded-[16px] overflow-hidden min-w-0 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex-1 w-full relative overflow-hidden">
        {/* Dropbox card (behind, left) */}
        <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(calc(-50% - 33.86px), calc(-50% + 2px))", width: "57.273px" }}>
        <motion.div className="flex flex-col h-[81px] items-start justify-between p-[6px] rounded-[4.909px] opacity-60 relative" style={{ backgroundColor: dropboxBg, width: "57.273px" }} animate={hovered ? { x: -10.14, y: -4, rotate: -4 } : { x: 0, y: 0, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
          <div className="absolute inset-[-1.636px] pointer-events-none rounded-[6.545px]" style={{ border: `1.636px solid ${borderColor}` }} />
          <div className="flex flex-col items-center justify-center p-[2px] rounded-full shrink-0 size-[17px]" style={{ backgroundColor: iconBg }}>
            <div className="relative shrink-0 size-[10px]"><svg className="block size-full" fill="none" viewBox="0 0 11 8.9375"><path d={svgCardPaths.pd852f80} fill="#0061FF" /></svg></div>
          </div>
          <p style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 500, fontSize: "9.818px", lineHeight: 1.2, color: serviceTextDark, whiteSpace: "nowrap" }}>Dropbox</p>
        </motion.div>
        </div>

        {/* Google Drive card (middle) */}
        <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(calc(-50% - 10.36px), calc(-50% + 2px))", width: "70px" }}>
        <motion.div className="flex flex-col h-[99px] items-start justify-between p-[7px] rounded-[6px] relative" style={{ backgroundColor: driveBg, width: "70px" }} animate={hovered ? { y: -5, scale: 1.04 } : { y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.03 }}>
          <div className="absolute inset-[-2px] pointer-events-none rounded-[8px]" style={{ border: `2px solid ${borderColor}` }} />
          <div className="flex flex-col items-center justify-center p-[4px] rounded-full shrink-0 size-[26px]" style={{ backgroundColor: iconBg }}>
            <svg className="size-[14px]" fill="none" viewBox="0 0 14 14">
              <path d={svgCardPaths.p36aae932} fill="#0066DA" /><path d={svgCardPaths.p68d8080} fill="#00AC47" /><path d={svgCardPaths.p80f7a80} fill="#EA4335" /><path d={svgCardPaths.p185b5480} fill="#00832D" /><path d={svgCardPaths.p230cab00} fill="#2684FC" /><path d={svgCardPaths.p1e6a9c80} fill="#FFBA00" />
            </svg>
          </div>
          <p style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 500, fontSize: "12px", lineHeight: 1.2, color: serviceTextWarm, width: "44px" }}>Google Drive</p>
        </motion.div>
        </div>

        {/* YouTube card (front, right) */}
        <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(calc(-50% + 22.75px), calc(-50% + 0.5px))", width: "82px" }}>
        <motion.div className="flex flex-col h-[110px] items-start justify-between p-[8px] rounded-[6px] relative" style={{ backgroundColor: youtubeBg, width: "82px" }} animate={hovered ? { x: 10.25, y: -3.5, rotate: 3 } : { x: 0, y: 0, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.05 }}>
          <div className="absolute inset-[-2px] pointer-events-none rounded-[8px]" style={{ border: `2px solid ${borderColor}` }} />
          <div className="flex flex-col items-center justify-center p-[6px] rounded-full shrink-0 size-[30px]" style={{ backgroundColor: iconBg }}>
            <svg className="size-[18px]" fill="none" viewBox="0 0 18 12.606"><path d={svgCardPaths.p2d68c000} fill="#FF0000" /><path d={svgCardPaths.p29053100} fill="white" transform="translate(6.25 3.6)" /></svg>
          </div>
          <p style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 500, fontSize: "12px", lineHeight: 1.2, color: serviceTextWarm, whiteSpace: "nowrap" }}>YouTube</p>
        </motion.div>
        </div>
      </div>
      <div className="w-full px-[20px] pb-[14px]">
        <p className="text-center" style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 500, fontSize: "16px", lineHeight: 1.3, color: labelColor }}>{useLanguage().t("dash.card.transcribeFromLink")}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Card 4: Audio & Video Files
   ═══════════════════════════════════════════ */

function FilePageIcon({ label, bgColor, textColor, earmarkPath, pagePath }: {
  label: string; bgColor: string; textColor: string; earmarkPath: string; pagePath: string;
}) {
  const { isDark } = useTheme();
  const strokeC = isDark ? "#2a2a35" : "white";
  const earmarkFill = isDark ? "#3a3a48" : "white";
  return (
    <div className="relative size-[59px]">
      <div className="absolute inset-[0_10%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 47.164 58.954">
          <path d={pagePath} fill={bgColor} stroke={strokeC} strokeWidth="1.474" />
          <path d={earmarkPath} fill={earmarkFill} />
        </svg>
      </div>
      <p className="absolute text-center" style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13.265px", color: textColor,
        inset: "57.5% 10% 15.36% 10%", lineHeight: "normal",
      }}>{label}</p>
    </div>
  );
}

function AudioVideoFilesCard() {
  const [hovered, setHovered] = useState(false);
  const { isDark } = useTheme();
  const cardBg = isDark ? "#1e1e26" : "#f5f5f5";
  const labelColor = isDark ? "#e5e7eb" : "black";
  const mp4Bg = isDark ? "#2d2650" : "#E6E1FE";
  const movBg = isDark ? "#152540" : "#E3F0FE";
  const plusBg = isDark ? "#2a2a35" : "#E5E5E5";
  const movOrangeBg = isDark ? "#3d2e10" : "#FFEAD2";
  const movPinkBg = isDark ? "#3d1a18" : "#FEECEB";
  return (
    <div
      style={{ backgroundColor: cardBg }}
      className="flex flex-1 flex-col h-[210px] items-center justify-end rounded-[16px] overflow-hidden min-w-0 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Illustration */}
      <div className="flex-1 w-full relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative" style={{ width: "155px", height: "82px" }}>
            {/* Back row — partially hidden behind front row */}
            {/* Orange MOV (back left) */}
            <motion.div
              className="absolute z-0"
              style={{ left: "18px", top: "0px" }}
              animate={hovered ? { rotate: -14, x: -4, y: -2 } : { rotate: -10, x: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <FilePageIcon label="MOV" bgColor={movOrangeBg} textColor={isDark ? "#c9a87c" : "#0a3380"} earmarkPath={svgCardPaths.p2d2d7200} pagePath={svgCardPaths.p30371700} />
            </motion.div>
            {/* Pink MOV (back right) */}
            <motion.div
              className="absolute z-0"
              style={{ left: "78px", top: "0px" }}
              animate={hovered ? { rotate: 14, x: 4, y: -2 } : { rotate: 10, x: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <FilePageIcon label="MOV" bgColor={movPinkBg} textColor={isDark ? "#d4918a" : "#0a3380"} earmarkPath={svgCardPaths.p2d2d7200} pagePath={svgCardPaths.p30371700} />
            </motion.div>
            {/* Front row */}
            {/* Purple MP4 (front left) */}
            <motion.div
              className="absolute z-10"
              style={{ left: "0px", top: "22px" }}
              animate={hovered ? { rotate: -16, x: -8, y: -3 } : { rotate: -10, x: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.02 }}
            >
              <FilePageIcon label="MP4" bgColor={mp4Bg} textColor={isDark ? "#b6a0f0" : "#15105b"} earmarkPath={svgCardPaths.p15607c00} pagePath={svgCardPaths.p28f449c0} />
            </motion.div>
            {/* Blue MOV (front center) */}
            <motion.div
              className="absolute z-10"
              style={{ left: "48px", top: "20px" }}
              animate={hovered ? { y: -6, scale: 1.06 } : { y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 22, delay: 0.04 }}
            >
              <FilePageIcon label="MOV" bgColor={movBg} textColor={isDark ? "#7db3f0" : "#0a3380"} earmarkPath={svgCardPaths.p2d2d7200} pagePath={svgCardPaths.p30371700} />
            </motion.div>
            {/* Gray +10 (front right) */}
            <motion.div
              className="absolute z-10"
              style={{ left: "96px", top: "22px" }}
              animate={hovered ? { rotate: 16, x: 8, y: -3 } : { rotate: 10, x: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 20, delay: 0.05 }}
            >
              <FilePageIcon label="+10" bgColor={plusBg} textColor={isDark ? "#9ca3af" : "#504e4e"} earmarkPath={svgCardPaths.p2d2d7200} pagePath={svgCardPaths.p30371700} />
            </motion.div>
          </div>
        </div>
      </div>
      {/* Label */}
      <div className="w-full px-[20px] pb-[20px]">
        <p className="text-center" style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif", fontWeight: 500, fontSize: "16px", lineHeight: 1.3, color: labelColor }}>{useLanguage().t("dash.card.audioVideoFiles")}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Dashboard Page
   ═══════════════════════════════════════════ */
function useGreeting() {
  const { t } = useLanguage();
  const h = new Date().getHours();
  if (h < 12) return t("dash.greeting.morning");
  if (h < 18) return t("dash.greeting.afternoon");
  return t("dash.greeting.evening");
}

export function DashboardPage() {
  const { isDark } = useTheme();
  const greeting = useGreeting();
  const { setOpenModal } = useTranscriptionModals();
  const mainBg = isDark ? "#111115" : "white";
  const greetingColor = isDark ? "#f3f4f6" : "#02082d";
  const hotkeyBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.8)";
  const hotkeyText = isDark ? "#9ca3af" : "#6a7383";
  const hotkeyShadow = isDark
    ? "0px 1px 3px 0px rgba(0,0,0,0.25), 0px 0px 0px 0.5px rgba(255,255,255,0.06)"
    : "0px 1px 3px 0px rgba(0,0,0,0.08), 0px 0px 0px 0.5px rgba(0,0,0,0.06)";

  const ease = [0.16, 1, 0.3, 1] as const;
  const fadeUp = (delay: number, distance = 60) => ({
    initial: { opacity: 0, y: distance, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.9, ease, delay },
  });

  const cards = [
    { card: <AudioVideoFilesCard />, key: "1", modal: "upload" as const },
    { card: <InstantSpeachCard />, key: "2", modal: "record" as const },
    { card: <MeetingRecorderCard />, key: "3", modal: "meeting" as const },
    { card: <TranscribeFromLinkCard />, key: "4", modal: "link" as const },
  ];

  return (
    <div className="flex-1 overflow-hidden flex transition-colors duration-200" style={{ backgroundColor: mainBg }}>
      <div className="flex-1 overflow-auto min-w-0">
        <div className="px-[32px] pt-[28px]">
          <motion.p
            className="whitespace-nowrap"
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "28px", lineHeight: "33.6px", color: greetingColor, letterSpacing: "-0.56px" }}
            {...fadeUp(0.72, 30)}
          >
            {greeting}
          </motion.p>
          <motion.div className="flex gap-[12px] mt-[34px]" {...fadeUp(0.48, 50)}>
            {cards.map(({ card, key, modal }) => (
              <div
                key={key}
                className="relative flex-1 min-w-0 group cursor-pointer"
                onClick={() => setOpenModal(modal)}
              >
                {card}
                <div className="absolute top-[10px] right-[10px] flex items-center gap-[3px] backdrop-blur-sm rounded-[6px] px-[6px] h-[22px] transition-opacity duration-200 pointer-events-none z-10" style={{ backgroundColor: hotkeyBg, boxShadow: hotkeyShadow }}>
                  <span style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: hotkeyText, letterSpacing: "0.2px" }}>⌘</span>
                  <span style={{ fontFamily: "'SF Pro Text', 'Inter', sans-serif", fontWeight: 500, fontSize: "11px", color: hotkeyText, letterSpacing: "0.2px" }}>{key}</span>
                </div>
              </div>
            ))}
          </motion.div>
          <motion.div {...fadeUp(0.18, 70)}>
            <RecordsTable />
          </motion.div>
        </div>
      </div>
      <motion.div {...fadeUp(0.1, 70)}>
        <RightPanel />
      </motion.div>
    </div>
  );
}