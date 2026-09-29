import { Icon } from "./ui/icon";
import { cn } from "./ui/utils";
import { Calendar02Icon, FolderOpenIcon, Link01Icon, Mic01Icon, Search01Icon, Tick02Icon, UserMultiple02Icon } from "@hugeicons/core-free-icons";

/* Academy covers, in the marketing site's feature-block language (Kirill,
   review 54, 29.09): THE PHOTOGRAPH IS THE ENVIRONMENT, the product is the
   only sharp thing. Each cover is the lesson's photograph with a white panel
   carrying a real, tiny piece of the interface the lesson is about. The panel
   has no shadow (depth on dark is contrast), type on the photo is small and
   heavy, the accent out-brightens the frame.

   Everything is drawn in code so it stays crisp at any card size and never
   goes stale when the product changes. */

const PANEL = "rounded-[8px] bg-white p-[10px] ring-1 ring-black/[0.04]";
const INK = "#0A1630";

function Line({ w, strong }: { w: string; strong?: boolean }) {
  return <span className={cn("block h-[5px] rounded-full", strong ? "bg-[#0A1630]/70" : "bg-[#0A1630]/[0.14]")} style={{ width: w }} />;
}
function Row({ who, color, w }: { who: string; color: string; w: string }) {
  return (
    <div className="flex items-start gap-[6px]">
      <span className="mt-[1px] size-[10px] shrink-0 rounded-full" style={{ background: color }} />
      <span className="min-w-0 flex-1">
        <span className="block text-[8.5px] font-bold leading-[10px]" style={{ color }}>{who}</span>
        <span className="mt-[3px] block"><Line w={w} /></span>
      </span>
    </div>
  );
}
function Pill({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return <span className={cn("inline-flex h-[18px] items-center gap-[4px] rounded-full px-[7px] text-[9px] font-bold", dark ? "bg-[#0A1630] text-white" : "bg-[#0A1630]/[0.06] text-[#0A1630]")}>{children}</span>;
}
function Primary({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex h-[20px] items-center rounded-full bg-primary px-[9px] text-[9.5px] font-bold text-white">{children}</span>;
}

/* the scene inside the white panel, one per lesson */
function Scene({ id }: { id: string }) {
  switch (id) {
    case "first-record":
      return (
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center justify-between"><span className="text-[9.5px] font-bold text-[#0A1630]">New transcript</span><Pill>MP3 · MP4 · WAV</Pill></div>
          <div className="flex h-[44px] items-center justify-center rounded-[6px] border border-dashed border-[#0A1630]/25 text-[9px] font-semibold text-[#0A1630]/60">Drop a file here</div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-[4px] text-[9px] font-semibold text-[#0A1630]/60"><Icon icon={Mic01Icon} size={10} />Instant speech</span><Primary>Upload</Primary></div>
        </div>
      );
    case "meetings":
      return (
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center justify-between"><span className="text-[9.5px] font-bold text-[#0A1630]">Thu, 2 Apr</span><Pill><Icon icon={Calendar02Icon} size={9} />Connected</Pill></div>
          {[["14:00", "Product sync", true], ["16:00", "Customer call", false]].map(([t, n, on]) => (
            <div key={String(n)} className="flex items-center gap-[6px] rounded-[6px] bg-[#0A1630]/[0.04] px-[7px] py-[5px]">
              <span className="text-[8.5px] font-bold tabular-nums text-[#0A1630]/60">{String(t)}</span>
              <span className="flex-1 text-[9px] font-semibold text-[#0A1630]">{String(n)}</span>
              <span className={cn("flex h-[12px] w-[20px] items-center rounded-full p-[2px]", on ? "justify-end bg-primary" : "bg-[#0A1630]/[0.15]")}><span className="size-[8px] rounded-full bg-white" /></span>
            </div>
          ))}
        </div>
      );
    case "read-transcript":
      return (
        <div className="flex flex-col gap-[7px]">
          <div className="flex gap-[10px] border-b border-[#0A1630]/10 pb-[4px] text-[9px] font-bold"><span className="border-b-2 border-primary pb-[3px] text-primary">Transcript</span><span className="text-[#0A1630]/50">Summary</span></div>
          <div className="flex gap-[6px]"><span className="text-[8.5px] font-bold tabular-nums text-primary">0:16</span><span className="flex-1 space-y-[4px] pt-[2px]"><Line w="100%" strong /><Line w="82%" /></span></div>
          <div className="flex gap-[6px]"><span className="text-[8.5px] font-bold tabular-nums text-[#0A1630]/45">0:31</span><span className="flex-1 space-y-[4px] pt-[2px]"><Line w="64%" /></span></div>
        </div>
      );
    case "edit-transcript":
      return (
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center justify-between"><span className="text-[9.5px] font-bold text-[#0A1630]">Edit transcript</span><span className="flex gap-[4px]"><Pill>Cancel</Pill><Primary>Save</Primary></span></div>
          <div className="rounded-[6px] border border-primary/60 bg-primary/[0.04] px-[7px] py-[6px]"><span className="text-[9px] leading-[13px] text-[#0A1630]">Ship the booking flow by <span className="rounded bg-primary/15 px-[2px] text-primary">Monday</span>|</span></div>
          <Line w="70%" />
        </div>
      );
    case "speakers":
      return (
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center justify-between"><span className="text-[9.5px] font-bold text-[#0A1630]">Speakers</span><Pill><Icon icon={UserMultiple02Icon} size={9} />2</Pill></div>
          <Row who="Sam Rivera" color="#2563eb" w="88%" />
          <div className="flex items-center gap-[6px]"><span className="size-[10px] rounded-full bg-[#a855f7]" /><span className="flex h-[18px] flex-1 items-center rounded-[5px] border border-primary bg-white px-[6px] text-[9px] font-semibold text-[#0A1630]">Speaker 2 <span className="ml-auto text-primary">Rename</span></span></div>
        </div>
      );
    case "summary":
      return (
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center justify-between"><span className="text-[9.5px] font-bold text-[#0A1630]">Apply template</span><Primary>Meeting notes</Primary></div>
          {["Decisions", "Action items", "Next steps"].map((s, i) => (
            <div key={s} className="flex items-center gap-[6px]"><span className={cn("flex size-[12px] items-center justify-center rounded-[3px]", i < 2 ? "bg-primary text-white" : "border border-[#0A1630]/25")}>{i < 2 && <Icon icon={Tick02Icon} size={8} strokeWidth={3} />}</span><span className="text-[9px] font-semibold text-[#0A1630]">{s}</span></div>
          ))}
        </div>
      );
    case "export":
      return (
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center justify-between"><span className="text-[9.5px] font-bold text-[#0A1630]">Export</span><Primary>Export</Primary></div>
          {[["Transcript", "PDF", true], ["Summary", "", true], ["Audio", "", false]].map(([n, f, on]) => (
            <div key={String(n)} className="flex items-center gap-[6px]"><span className="flex-1 text-[9px] font-semibold text-[#0A1630]">{String(n)}</span>{f ? <Pill>{String(f)}</Pill> : null}<span className={cn("flex h-[12px] w-[20px] items-center rounded-full p-[2px]", on ? "justify-end bg-primary" : "bg-[#0A1630]/[0.15]")}><span className="size-[8px] rounded-full bg-white" /></span></div>
          ))}
        </div>
      );
    case "share":
      return (
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center justify-between"><span className="text-[9.5px] font-bold text-[#0A1630]">Share</span><Pill><Icon icon={Link01Icon} size={9} />Copy link</Pill></div>
          <div className="flex items-center gap-[6px] rounded-[6px] border border-[#0A1630]/15 px-[7px] py-[5px]"><span className="flex-1 text-[9px] text-[#0A1630]/50">name@company.com</span><Primary>Invite</Primary></div>
          <div className="flex items-center gap-[5px]"><span className="flex -space-x-[4px]">{["#2563eb", "#a855f7", "#0ea5e9"].map((c) => <span key={c} className="size-[12px] rounded-full ring-2 ring-white" style={{ background: c }} />)}</span><span className="text-[8.5px] font-semibold text-[#0A1630]/60">3 people can view</span></div>
        </div>
      );
    case "folders":
      return (
        <div className="flex flex-col gap-[6px]">
          {[["Client meetings", "#3B82F6", 12], ["Interviews", "#22C55E", 4], ["Podcast", "#F59E0B", 9]].map(([n, c, k]) => (
            <div key={String(n)} className="flex items-center gap-[6px] rounded-[6px] bg-[#0A1630]/[0.04] px-[7px] py-[5px]"><Icon icon={FolderOpenIcon} size={11} style={{ color: String(c) }} /><span className="flex-1 text-[9px] font-semibold text-[#0A1630]">{String(n)}</span><span className="text-[8.5px] font-bold tabular-nums text-[#0A1630]/45">{String(k)}</span></div>
          ))}
        </div>
      );
    case "find":
      return (
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center gap-[6px] rounded-[6px] border border-primary/60 px-[7px] py-[5px]"><Icon icon={Search01Icon} size={10} className="text-[#0A1630]/50" /><span className="text-[9px] font-semibold text-[#0A1630]">booking flow<span className="text-primary">|</span></span></div>
          {["Product sync · 0:16", "Sales call · 12:40"].map((r) => (
            <div key={r} className="flex items-center gap-[6px]"><span className="size-[8px] rounded-full bg-primary/70" /><span className="text-[9px] font-semibold text-[#0A1630]">{r.split(" · ")[0]}</span><span className="ml-auto text-[8.5px] font-bold tabular-nums text-[#0A1630]/45">{r.split(" · ")[1]}</span></div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

/* the cover: photograph + wash + the panel, sized by its container */
export function LessonCover({ id, photo, className, badge }: { id: string; photo: string; className?: string; badge?: React.ReactNode }) {
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: INK }}>
      <img src={photo} alt="" aria-hidden className="absolute inset-0 h-full w-full select-none object-cover" loading="lazy" />
      <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,22,48,0.15) 0%, rgba(10,22,48,0.55) 100%)" }} />
      {badge && <span className="absolute left-[10px] top-[10px] z-[2]">{badge}</span>}
      <div className={cn(PANEL, "absolute bottom-[12px] left-[12px] right-[12px] z-[1]")}>
        <Scene id={id} />
      </div>
    </div>
  );
}
