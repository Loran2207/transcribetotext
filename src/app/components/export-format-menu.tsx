import { Icon } from "./ui/icon";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "./ui/dropdown-menu";
import {
  Doc01Icon,
  Pdf02Icon,
  File02Icon,
  SubtitleIcon,
  ClosedCaptionIcon,
  Upload,
} from "@hugeicons/core-free-icons";
import type { ExportFormat } from "@/lib/export-formats";

interface FormatOption {
  format: ExportFormat;
  icon: typeof Doc01Icon;
  label: string;
  description: string;
  /** Tailwind classes for the colored icon tile background + foreground. */
  tile: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    format: "docx",
    icon: Doc01Icon,
    label: "Word document",
    description: "Editable, .docx",
    tile: "bg-blue-50 text-blue-600",
  },
  {
    format: "pdf",
    icon: Pdf02Icon,
    label: "PDF",
    description: "Print-ready, .pdf",
    tile: "bg-rose-50 text-rose-600",
  },
  {
    format: "txt",
    icon: File02Icon,
    label: "Plain text",
    description: "Universal, .txt",
    tile: "bg-slate-100 text-slate-600",
  },
  {
    format: "srt",
    icon: SubtitleIcon,
    label: "SRT subtitles",
    description: "Video editors, .srt",
    tile: "bg-amber-50 text-amber-600",
  },
  {
    format: "vtt",
    icon: ClosedCaptionIcon,
    label: "WebVTT",
    description: "HTML5 captions, .vtt",
    tile: "bg-emerald-50 text-emerald-600",
  },
];

/** Items only — drop into any open DropdownMenuContent / DropdownMenuSubContent. */
export function ExportFormatMenuItems({
  onSelect,
}: {
  onSelect: (format: ExportFormat) => void;
}) {
  return (
    <>
      {FORMAT_OPTIONS.map((opt) => (
        <DropdownMenuItem
          key={opt.format}
          className="gap-2.5 py-2"
          onSelect={(e) => {
            e.preventDefault();
            onSelect(opt.format);
          }}
        >
          <div
            className={`flex size-7 shrink-0 items-center justify-center rounded-md ${opt.tile}`}
          >
            <Icon icon={opt.icon} className="size-[15px]" strokeWidth={1.6} />
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="text-[13px] font-medium text-foreground">{opt.label}</span>
            <span className="text-[11px] text-muted-foreground">{opt.description}</span>
          </div>
        </DropdownMenuItem>
      ))}
    </>
  );
}

/** Full Sub: trigger labeled "Export" + flyout with 5 format items. Use inside a shadcn DropdownMenu. */
export function ExportFormatSubMenu({
  onSelect,
  triggerLabel = "Export",
}: {
  onSelect: (format: ExportFormat) => void;
  triggerLabel?: string;
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        <Icon icon={Upload} className="size-4 text-muted-foreground" strokeWidth={1.6} />
        {triggerLabel}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-[230px]">
        <ExportFormatMenuItems onSelect={onSelect} />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
