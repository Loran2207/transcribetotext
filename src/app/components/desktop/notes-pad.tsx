import { forwardRef, useEffect, useRef, useState } from "react";
import { Heading01Icon, LeftToRightListBulletIcon, CheckListIcon, GridViewIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { templateEmoji, templateAudience, hueForCategory, categorize } from "@/lib/template-meta";
import type { Template } from "@/lib/templates";

/* Your own notes while the call runs: a block notepad the way Granola does it.
   Plain lines, a heading, a bullet, a checkbox, and "/" on an empty line opens
   the short menu with those three and the templates. The line kinds and the
   slash menu come from the desktop prototype (TTT-MAC-WIN, NoteCanvas); the
   surface, colours and menu are the portal's own. */

export type PadLine = { kind: "p" | "h" | "li" | "todo"; text: string; done?: boolean };
export const EMPTY_PAD: PadLine[] = [{ kind: "p", text: "" }];

export function padToText(lines: PadLine[]) {
  return lines.map((l) => (l.kind === "h" ? `# ${l.text}` : l.kind === "li" ? `- ${l.text}` : l.kind === "todo" ? `${l.done ? "[x]" : "[ ]"} ${l.text}` : l.text)).join("\n");
}

const KINDS = [
  { id: "h", name: "Heading", icon: Heading01Icon },
  { id: "li", name: "Bullet list", icon: LeftToRightListBulletIcon },
  { id: "todo", name: "Checkbox", icon: CheckListIcon },
];

type MenuItem = { id: string; name: string; icon?: typeof Heading01Icon; emoji?: string; head?: boolean; rule?: boolean; tpl?: Template };

export function NotesPad({ lines, onChange, templates, onTemplate, autoFocus = false, hint }: {
  lines: PadLine[];
  onChange: (lines: PadLine[]) => void;
  /* the same templates the picker lists, in the same order */
  templates: Template[];
  /* a template chosen from the slash menu, or "all" for the library */
  onTemplate: (id: string) => void;
  autoFocus?: boolean;
  hint?: string;
}) {
  const [focus, setFocus] = useState<number | null>(autoFocus ? 0 : null);
  const [pick, setPick] = useState(0);
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => {
    if (focus === null) return;
    const el = refs.current[focus];
    if (el && document.activeElement !== el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }, [focus, lines.length]);

  const set = (i: number, patch: Partial<PadLine>) => onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const insertAfter = (i: number, line: PadLine) => { const n = [...lines]; n.splice(i + 1, 0, line); onChange(n); setFocus(i + 1); };
  const remove = (i: number) => { const n = lines.filter((_, j) => j !== i); onChange(n.length ? n : EMPTY_PAD); setFocus(Math.max(0, i - 1)); };

  const slashAt = focus !== null && lines[focus]?.text.startsWith("/") ? focus : null;
  const query = slashAt !== null ? lines[slashAt].text.slice(1).toLowerCase() : "";
  const kinds = KINDS.filter((k) => k.name.toLowerCase().includes(query));
  const tpls = templates.filter((t) => t.name.toLowerCase().includes(query));
  const items: MenuItem[] = [
    ...kinds,
    ...(tpls.length ? [{ id: "thead", name: "Templates", head: true }] : []),
    ...tpls.map((t) => ({ id: "t:" + t.id, name: t.name, emoji: templateEmoji(t.name), tpl: t })),
    ...(templates.length ? [{ id: "tall", name: "All templates", icon: GridViewIcon, rule: true }] : []),
  ];
  const choices = items.filter((it) => !it.head);
  const active = choices[Math.min(pick, choices.length - 1)]?.id;

  const choose = (id: string) => {
    if (slashAt === null) return;
    if (id === "tall") { set(slashAt, { text: "" }); onTemplate("all"); return; }
    if (id.startsWith("t:")) { set(slashAt, { text: "" }); onTemplate(id.slice(2)); return; }
    set(slashAt, { kind: id as PadLine["kind"], text: "" });
    setPick(0);
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const l = lines[i];
    if (slashAt === i) {
      if (e.key === "ArrowDown") { e.preventDefault(); setPick((p) => Math.min(choices.length - 1, p + 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setPick((p) => Math.max(0, p - 1)); return; }
      if (e.key === "Enter") { e.preventDefault(); if (active) choose(active); return; }
      if (e.key === "Escape") { e.preventDefault(); set(i, { text: "" }); return; }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if ((l.kind === "li" || l.kind === "todo") && !l.text.trim()) { set(i, { kind: "p" }); return; }
      insertAfter(i, { kind: l.kind === "li" || l.kind === "todo" ? l.kind : "p", text: "" });
    } else if (e.key === "Backspace" && !l.text) {
      e.preventDefault();
      if (l.kind !== "p") set(i, { kind: "p" });
      else if (i > 0) remove(i);
    } else if (e.key === "ArrowUp" && i > 0 && e.currentTarget.selectionStart === 0) { e.preventDefault(); setFocus(i - 1); }
    else if (e.key === "ArrowDown" && i < lines.length - 1 && e.currentTarget.selectionStart === l.text.length) { e.preventDefault(); setFocus(i + 1); }
  };

  const onText = (i: number, v: string) => {
    if (v.includes("\n")) {
      const parts = v.split("\n");
      const n = [...lines];
      n.splice(i, 1, ...parts.map((t, k) => ({ ...lines[i], text: t, ...(k ? { kind: "p" as const } : {}) })));
      onChange(n); setFocus(i + parts.length - 1); return;
    }
    if (lines[i].kind === "p") {
      if (v === "# ") return set(i, { kind: "h", text: "" });
      if (v === "- " || v === "* ") return set(i, { kind: "li", text: "" });
      if (v === "[] " || v === "[ ] ") return set(i, { kind: "todo", text: "" });
    }
    set(i, { text: v });
    if (v.startsWith("/")) setPick(0);
  };

  const empty = lines.length === 1 && !lines[0].text && lines[0].kind === "p";

  return (
    <div className="pl-7">
      {lines.map((l, i) => (
        <div key={i} className={l.kind === "h" ? (i ? "pb-1 pt-5" : "pb-1") : "py-[2px]"}>
          <div className="relative">
            {l.kind === "h" && <Gutter left={-26} w={16}><span className="text-[15px] font-medium text-muted-foreground/70">#</span></Gutter>}
            {l.kind === "li" && <Gutter left={-20} w={9}><span className="block size-[5px] rounded-full bg-muted-foreground/70" /></Gutter>}
            {l.kind === "todo" && (
              <Gutter left={-26} w={16}>
                <button type="button" aria-label={l.done ? "Reopen" : "Done"} onMouseDown={(e) => e.preventDefault()} onClick={() => set(i, { done: !l.done })} className="flex items-center justify-center">
                  {l.done ? (
                    <span className="flex size-[16px] items-center justify-center rounded-[5px] bg-primary text-primary-foreground"><Icon icon={Tick02Icon} className="size-[11px]" strokeWidth={2.4} /></span>
                  ) : (
                    <span className="block size-[16px] rounded-[5px] border border-input transition-colors hover:border-primary" />
                  )}
                </button>
              </Gutter>
            )}
            <AutoArea
              ref={(el) => { refs.current[i] = el; }}
              value={l.text}
              onChange={(v) => onText(i, v)}
              onKeyDown={(e) => onKey(i, e)}
              onFocus={() => setFocus(i)}
              placeholder={i === 0 && lines.length === 1 ? (templates.length ? "Write notes, or press / for a heading, a list or a template" : "Write notes, or press / for a heading or a list") : l.kind === "h" ? "Heading" : ""}
              className={
                "block w-full resize-none bg-transparent leading-[1.7] outline-none placeholder:text-muted-foreground " +
                (l.kind === "h" ? "text-[16px] font-semibold text-foreground" : l.kind === "todo" && l.done ? "text-[15px] text-muted-foreground line-through" : "text-[15px] text-foreground")
              }
            />
            {slashAt === i && (
              /* the menu scrolls once the template list outgrows it; the kinds stay on top, "All templates" at the foot */
              <div className="absolute left-0 z-40 w-[320px] max-h-[400px] overflow-y-auto rounded-[12px] border border-border bg-popover p-1 shadow-md" style={{ top: 34 }}>
                {items.map((it) =>
                  it.head ? (
                    <div key={it.id} className="px-2 pb-1 pt-2.5 text-[11px] font-medium text-muted-foreground">{it.name}</div>
                  ) : (
                    <div key={it.id}>
                      {it.rule && <div className="-mx-1 my-1 h-px bg-border" />}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => choose(it.id)}
                        className={"flex w-full items-center gap-2.5 rounded-[8px] px-2 py-1.5 text-left text-[13px] " + (it.id === "tall" ? "font-medium text-primary " : "") + (active === it.id ? "bg-muted" : "hover:bg-muted") + (it.id === "tall" ? "" : " text-foreground")}
                      >
                        {it.tpl ? (
                          /* a template row, the way the picker draws it: coloured tile, name, who it is for */
                          <>
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[16px]" style={{ background: hueForCategory(categorize(it.tpl)).bg }}>{it.emoji}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium leading-snug">{it.name}</span>
                              <span className="block truncate text-[11px] leading-snug text-muted-foreground">{templateAudience(it.tpl)}</span>
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="flex w-4 shrink-0 items-center justify-center">
                              {it.icon && <Icon icon={it.icon} className={"size-4 " + (it.id === "tall" ? "text-primary" : "text-muted-foreground")} strokeWidth={1.6} />}
                            </span>
                            <span className="truncate">{it.name}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      {hint && empty && <p className="max-w-[440px] pt-2 text-[13px] leading-[1.6] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Gutter({ left, w, children }: { left: number; w: number; children: React.ReactNode }) {
  return (
    <span className="absolute top-0 flex h-[27px] items-center justify-center" style={{ left, width: w }}>{children}</span>
  );
}

const AutoArea = forwardRef<HTMLTextAreaElement, { value: string; onChange: (v: string) => void; onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void; onFocus: () => void; placeholder?: string; className: string }>(
  function AutoArea({ value, onChange, onKeyDown, onFocus, placeholder, className }, ref) {
    const inner = useRef<HTMLTextAreaElement | null>(null);
    useEffect(() => {
      const el = inner.current;
      if (!el) return;
      el.style.height = "0px";
      el.style.height = el.scrollHeight + "px";
    }, [value]);
    return (
      <textarea
        ref={(el) => { inner.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; }}
        value={value}
        rows={1}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        className={className}
      />
    );
  },
);

/* Notes live with the record, on this machine. */
export function loadPad(recordId: string): PadLine[] {
  try {
    const raw = window.localStorage.getItem(`ttt_notes:${recordId}`);
    const parsed = raw ? (JSON.parse(raw) as PadLine[]) : null;
    return parsed && parsed.length ? parsed : EMPTY_PAD;
  } catch { return EMPTY_PAD; }
}
export function savePad(recordId: string, lines: PadLine[]) {
  try { window.localStorage.setItem(`ttt_notes:${recordId}`, JSON.stringify(lines)); } catch { /* full or private */ }
}
