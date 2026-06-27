import svgPaths from "../../imports/svg-nwsvf5ddzt";
import { imgGroup, imgGroup1 } from "../../imports/svg-lixh6";
import { Icon } from "./ui/icon";
import { Video01Icon, File01Icon } from "@hugeicons/core-free-icons";

export type SourceType =
  | "google-sheets"
  | "zoom"
  | "teams"
  | "google-meet"
  | "dropbox"
  | "youtube"
  | "microphone"
  | "folder"
  | "mp4"
  | "mp3" | "meeting" | "file" | "instagram";

/** Google Sheets icon */
function GoogleSheetsIcon() {
  return (
    <div className="overflow-clip relative shrink-0 size-[18px]">
      <div
        className="absolute inset-[11.11%_5.55%_11.11%_5.56%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_0px] mask-size-[16px_14px]"
        style={{ maskImage: `url('${imgGroup}')` }}
      >
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

/** Zoom icon */
function ZoomIcon() {
  return (
    <div className="overflow-clip relative shrink-0 size-[18px]">
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

/** Microsoft Teams icon */
function TeamsIcon() {
  return (
    <div className="overflow-clip relative shrink-0 size-[18px]">
      <div
        className="absolute inset-[5.56%_0] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_0px] mask-size-[18px_16px]"
        style={{ maskImage: `url('${imgGroup1}')` }}
      >
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

/** Google Meet icon */
function GoogleMeetIcon() {
  return (
    <div className="relative shrink-0 size-[18px] flex items-center justify-center">
      <svg width="16" height="13" viewBox="0 0 87.5 72" fill="none" className="block">
        <path fill="#00832d" d="M49.5 36l8.53 9.75 11.47 7.33 2-17.02-2-16.64-11.69 6.44z" />
        <path fill="#0066da" d="M0 51.5V66c0 3.315 2.685 6 6 6h14.5l3-10.96-3-9.54-9.95-3z" />
        <path fill="#e94235" d="M20.5 0L0 20.5l10.55 3 9.95-3 2.95-9.41z" />
        <path fill="#2684fc" d="M20.5 20.5H0v31h20.5z" />
        <path fill="#00ac47" d="M82.6 8.68L69.5 19.42v33.66l13.16 10.79c1.97 1.54 4.85.135 4.85-2.37V11c0-2.535-2.945-3.925-4.91-2.32zM49.5 36v15.5h-29V72h43c3.315 0 6-2.685 6-6V53.08z" />
        <path fill="#ffba00" d="M63.5 0h-43v20.5h29V36l20-16.57V6c0-3.315-2.685-6-6-6z" />
      </svg>
    </div>
  );
}

/** Dropbox icon */
function DropboxIcon() {
  return (
    <div className="relative shrink-0 size-[18px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <path d={svgPaths.pb1c100} fill="#0061FF" />
      </svg>
    </div>
  );
}

/** YouTube icon */
function YouTubeIcon() {
  return (
    <div className="relative shrink-0 size-[18px]">
      <div className="-translate-y-1/2 absolute h-[12.656px] left-0 top-[calc(50%-0.39px)] w-[18px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 12.6562">
          <g clipPath="url(#clip_yt)">
            <path d={svgPaths.p2a3bae00} fill="#FF0000" />
            <path d={svgPaths.p31007600} fill="white" />
          </g>
          <defs>
            <clipPath id="clip_yt">
              <rect fill="white" height="12.6562" width="18" />
            </clipPath>
          </defs>
        </svg>
      </div>
    </div>
  );
}

/** Microphone icon */
function MicrophoneIcon() {
  return (
    <div className="overflow-clip relative shrink-0 size-[18px]">
      <div className="absolute inset-[4.17%_16.67%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16.5">
          <path clipRule="evenodd" d={svgPaths.p227a9f00} fill="#0061FF" fillRule="evenodd" />
        </svg>
      </div>
    </div>
  );
}

/** Folder icon */
function FolderIcon() {
  return (
    <div className="overflow-clip relative shrink-0 size-[18px]">
      <div className="absolute inset-[16.67%_8.33%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 12.0001">
          <path d={svgPaths.pd7d8b00} fill="#FFBA00" />
        </svg>
      </div>
    </div>
  );
}

/** MP4 file icon */
function Mp4Icon() {
  return (
    <div className="relative shrink-0 size-[18px]">
      <div className="absolute inset-[0_2.5%_0_17.5%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.4 18">
          <path d={svgPaths.p324a8570} stroke="#D0D5DD" strokeWidth="0.675" />
          <path d={svgPaths.p387ac400} stroke="#D0D5DD" strokeWidth="0.675" />
        </svg>
      </div>
      <div className="absolute bg-[#155eef] bottom-[15%] flex items-start left-[2.5%] px-[1.35px] py-[0.9px] right-1/4 rounded-[0.9px] top-[45%]">
        <p className="font-['Inter',sans-serif] shrink-0 text-[4.5px] text-center text-white whitespace-nowrap" style={{ fontWeight: 700 }}>MP4</p>
      </div>
    </div>
  );
}

/** MP3 file icon */
function Mp3Icon() {
  return (
    <div className="relative shrink-0 size-[18px]">
      <div className="absolute inset-[0_2.5%_0_17.5%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.4 18">
          <path d={svgPaths.p324a8570} stroke="#D0D5DD" strokeWidth="0.675" />
          <path d={svgPaths.p387ac400} stroke="#D0D5DD" strokeWidth="0.675" />
        </svg>
      </div>
      <div className="absolute bg-[#dd2590] bottom-[15%] flex items-start left-[2.5%] px-[1.35px] py-[0.9px] right-1/4 rounded-[0.9px] top-[45%]">
        <p className="font-['Inter',sans-serif] shrink-0 text-[4.5px] text-center text-white whitespace-nowrap" style={{ fontWeight: 700 }}>MP3</p>
      </div>
    </div>
  );
}

/** Meeting (video call) icon - distinct from a plain file */
function MeetingSourceIcon() {
  return (
    <div className="relative shrink-0 size-[18px] flex items-center justify-center text-primary">
      <Icon icon={Video01Icon} size={17} strokeWidth={1.7} />
    </div>
  );
}

/** Generic file icon */
function FileSourceIcon() {
  return (
    <div className="relative shrink-0 size-[18px] flex items-center justify-center text-muted-foreground">
      <Icon icon={File01Icon} size={16} strokeWidth={1.7} />
    </div>
  );
}

/** Instagram icon */
function InstagramSourceIcon() {
  return (
    <img
      src="/instagram-logo.webp"
      alt="Instagram"
      width={18}
      height={18}
      className="shrink-0 size-[18px] rounded-[4px] object-contain"
      draggable={false}
    />
  );
}

/** Universal source icon component */
export function SourceIcon({ source }: { source: SourceType }) {
  switch (source) {
    case "google-sheets": return <GoogleSheetsIcon />;
    case "zoom": return <ZoomIcon />;
    case "teams": return <TeamsIcon />;
    case "google-meet": return <GoogleMeetIcon />;
    case "dropbox": return <DropboxIcon />;
    case "youtube": return <YouTubeIcon />;
    case "microphone": return <MicrophoneIcon />;
    case "folder": return <FolderIcon />;
    case "mp4": return <Mp4Icon />;
    case "mp3": return <Mp3Icon />;
    case "meeting": return <MeetingSourceIcon />;
    case "file": return <FileSourceIcon />;
    case "instagram": return <InstagramSourceIcon />;
    default: return <MicrophoneIcon />;
  }
}
