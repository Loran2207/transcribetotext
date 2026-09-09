import type { ReactNode } from "react";
import { Mic01Icon, VolumeHighIcon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { LanguageSelector, SpeakerSection } from "../transcription-modals";
import { SettingsCard, SettingsCardTitle } from "../calendar-settings";
import { readDemo, useShell } from "./shell";
import { useNotetakerSettings, type NotetakerSettings } from "./notetaker-settings";

/* The Notetaker section of Settings: the same cards the Meetings section uses,
   one sentence per row, the one control that changes it on the right. */
export function NotetakerSettingsPanel() {
  const { settings, update } = useNotetakerSettings();
  const { machine, os } = useShell();
  const perm = readDemo("perm");
  const allowed = { mic: perm !== "1", sys: perm !== "1" && perm !== "mic" };
  const shortcut = os === "win" ? "Ctrl + Shift + R" : "\u2318 + \u21e7 + R";
  return (
    <div className="flex flex-col gap-4">
      <SettingsCard>
        <SettingsCardTitle title="Meetings" subtitle={`How calls are noticed on ${machine}.`} />
        <Rows>
          <Row title="Tell me before a scheduled call starts" desc="A notice from the calendar, with Join and record on it.">
            <Select value={settings.notifyBefore} onValueChange={(v) => update({ notifyBefore: v as NotetakerSettings["notifyBefore"] })}>
              <SelectTrigger className="h-[34px] w-[130px] rounded-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[120]"><SelectItem value="off">Off</SelectItem><SelectItem value="15s">15 seconds</SelectItem><SelectItem value="1m">1 minute</SelectItem><SelectItem value="5m">5 minutes</SelectItem></SelectContent>
            </Select>
          </Row>
          <Row title="Notice any call" desc="When Zoom, Meet or Teams takes the microphone, ask whether to record it here."><Switch checked={settings.detectCalls} onCheckedChange={(v) => update({ detectCalls: v })} /></Row>
          <Row title="Stop when the call ends" desc="Ten seconds to keep recording, then the note is written."><Switch checked={settings.stopOnCallEnd} onCheckedChange={(v) => update({ stopOnCallEnd: v })} /></Row>
        </Rows>
      </SettingsCard>

      <SettingsCard>
        <SettingsCardTitle title="Recording" subtitle="Defaults for every call. Each recording can change them from its bar." />
        <Rows>
          <Row title="Transcription language" desc="Auto-detect works for most calls. Set it when a call mixes two languages.">
            <div className="w-[220px]"><LanguageSelector value={settings.language} onChange={(v) => update({ language: v })} /></div>
          </Row>
          <div className="py-3"><SpeakerSection enabled={settings.speakers} onToggle={() => update({ speakers: !settings.speakers })} count={settings.speakerCount} onCountChange={(v) => update({ speakerCount: v })} /></div>
          <Row title="Longest recording" desc="Stops on its own at this length, with a warning shortly before.">
            <Select value={settings.maxLength} onValueChange={(v) => update({ maxLength: v as NotetakerSettings["maxLength"] })}>
              <SelectTrigger className="h-[34px] w-[130px] rounded-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[120]"><SelectItem value="1h">1 hour</SelectItem><SelectItem value="2h">2 hours</SelectItem><SelectItem value="4h">4 hours</SelectItem></SelectContent>
            </Select>
          </Row>
          <Row title="Keep the note out of screen sharing" desc="The note and the recording widget stay off screenshots and shared screens."><Switch checked={settings.hideFromScreenShare} onCheckedChange={(v) => update({ hideFromScreenShare: v })} /></Row>
        </Rows>
      </SettingsCard>

      <SettingsCard>
        <SettingsCardTitle title="The note" />
        <Rows>
          <Row title="Open the note when recording starts" desc="Otherwise only the widget shows, and the note waits in the app."><Switch checked={settings.openNoteOnStart} onCheckedChange={(v) => update({ openNoteOnStart: v })} /></Row>
          <Row title="Side by side when joining" desc="The call on the left, the note on the right."><Switch checked={settings.splitOnJoin} onCheckedChange={(v) => update({ splitOnJoin: v })} /></Row>
          <Row title="Show the live transcript" desc="Words appear on the Transcript tab as they are said."><Switch checked={settings.liveTranscript} onCheckedChange={(v) => update({ liveTranscript: v })} /></Row>
          <Row title="Keyboard shortcut" desc="Start or stop recording from any window."><kbd className="rounded-[8px] border border-border bg-muted px-[10px] py-[5px] font-mono text-[12.5px] text-foreground">{shortcut}</kbd></Row>
        </Rows>
      </SettingsCard>

      <SettingsCard>
        <SettingsCardTitle title="Sharing" subtitle="My thoughts are never shared." />
        <Rows>
          <Row title="Share notes when they are ready" desc="Everyone on the calendar invite gets the summary and the transcript."><Switch checked={settings.autoShare} onCheckedChange={(v) => update({ autoShare: v })} /></Row>
        </Rows>
      </SettingsCard>

      <SettingsCard>
        <SettingsCardTitle title={`Permissions on ${machine}`} subtitle="Asked once. Both are needed to hear the whole call." />
        <Rows>
          {[{ icon: Mic01Icon, title: "Microphone", desc: "Your side of the call.", ok: allowed.mic }, { icon: VolumeHighIcon, title: "System audio", desc: "The other side, as it plays on this computer.", ok: allowed.sys }].map((r) => (
            <Row key={r.title} title={r.title} desc={r.desc} icon={r.icon}>
              {r.ok ? <span className="text-[13px] font-medium text-[#1F9D55]">Allowed</span> : <button type="button" className="h-[32px] rounded-full bg-primary px-[14px] text-[13px] font-semibold text-primary-foreground">Allow</button>}
            </Row>
          ))}
        </Rows>
      </SettingsCard>
    </div>
  );
}

function Rows({ children }: { children: ReactNode }) { return <div className="-my-1 divide-y divide-border">{children}</div>; }

function Row({ title, desc, icon, children }: { title: string; desc: string; icon?: unknown; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3">
      {icon ? <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon icon={icon} className="size-[18px]" strokeWidth={1.7} /></span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold text-foreground">{title}</span>
        <span className="block text-[12.5px] leading-[17px] text-muted-foreground">{desc}</span>
      </span>
      <span className="shrink-0">{children}</span>
    </div>
  );
}
