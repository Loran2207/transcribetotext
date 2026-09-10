import type { ReactNode } from "react";
import { Icon } from "../ui/icon";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { LanguageSelector, SpeakerSection } from "../transcription-modals";
import { SettingsCard, SettingsCardTitle } from "../calendar-settings";
import { useShell } from "./shell";
import { useNotetakerSettings, type NotetakerSettings } from "./notetaker-settings";

/* The Notetaker section of Settings: how calls are noticed, recorded, written
   up and shared. The same cards the Meetings section uses, one sentence per
   row, the one control that changes it on the right. What the app does as a
   program (startup, shortcut, updates, permissions) lives in System. */
export function NotetakerSettingsPanel() {
  const { settings, update } = useNotetakerSettings();
  const { machine } = useShell();
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
          <div className="py-3 first:pt-0 last:pb-0"><SpeakerSection enabled={settings.speakers} onToggle={() => update({ speakers: !settings.speakers })} count={settings.speakerCount} onCountChange={(v) => update({ speakerCount: v })} /></div>
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
        </Rows>
      </SettingsCard>

      <SettingsCard>
        <SettingsCardTitle title="Sharing" subtitle="My thoughts are never shared." />
        <Rows>
          <Row title="Who can see a note" desc="Transcripts and summaries stay in this account unless you share them.">
            <Select value={settings.visibility} onValueChange={(v) => update({ visibility: v as NotetakerSettings["visibility"] })}>
              <SelectTrigger className="h-[34px] w-[190px] rounded-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[120]"><SelectItem value="private">Only people I invite</SelectItem><SelectItem value="link">Anyone with the link</SelectItem></SelectContent>
            </Select>
          </Row>
          <Row title="Share notes when they are ready" desc="Everyone on the calendar invite gets the summary and the transcript."><Switch checked={settings.autoShare} onCheckedChange={(v) => update({ autoShare: v })} /></Row>
        </Rows>
      </SettingsCard>

    </div>
  );
}

/* the first row starts where the title's margin ends and the last one ends at the card's padding, so the gap above and below the rows is the same 16px */
export function Rows({ children }: { children: ReactNode }) { return <div className="divide-y divide-border">{children}</div>; }

export function Row({ title, desc, icon, children }: { title: string; desc: string; icon?: unknown; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
      {icon ? <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon icon={icon} className="size-[18px]" strokeWidth={1.7} /></span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold text-foreground">{title}</span>
        <span className="block text-[12.5px] leading-[17px] text-muted-foreground">{desc}</span>
      </span>
      <span className="shrink-0">{children}</span>
    </div>
  );
}
