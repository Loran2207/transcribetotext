import { Mic01Icon, VolumeHighIcon } from "@hugeicons/core-free-icons";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { SettingsCard, SettingsCardTitle } from "../calendar-settings";
import { useDemo, useShell } from "./shell";
import { useSystemSettings, type SystemSettings } from "./notetaker-settings";
import { Row, Rows } from "./notetaker-settings-page";

const APP_VERSION = "1.0.0";

/* The System section of Settings: the app as a program on this computer.
   Nothing here is about a call; that is the Notetaker section. */
export function SystemSettingsPanel() {
  const { settings, update } = useSystemSettings();
  const { os, machine } = useShell();
  const perm = useDemo("perm");
  const mac = os !== "win";
  const allowed = { mic: perm !== "1", sys: !mac || (perm !== "1" && perm !== "mic") };
  const shortcuts: Record<SystemSettings["shortcut"], string> = mac
    ? { primary: "\u2325 \u2318 R", secondary: "\u2303 \u2325 R", tertiary: "\u21E7 \u2318 R" }
    : { primary: "Ctrl + Alt + R", secondary: "Ctrl + Shift + R", tertiary: "Alt + R" };
  return (
    <div className="flex flex-col gap-4">
      <SettingsCard>
        <SettingsCardTitle title="Startup" subtitle={`How the app behaves on ${machine}.`} />
        <Rows>
          <Row title="Open at login" desc={`Starts with ${machine}, ready before the first call.`}><Switch checked={settings.openAtLogin} onCheckedChange={(v) => update({ openAtLogin: v })} /></Row>
          <Row title="Keep running when the window is closed" desc={mac ? "Stays in the menu bar, so calls are still noticed and the shortcut still works." : "Stays in the tray, so calls are still noticed and the shortcut still works."}><Switch checked={settings.keepRunning} onCheckedChange={(v) => update({ keepRunning: v })} /></Row>
        </Rows>
      </SettingsCard>

      <SettingsCard>
        <SettingsCardTitle title="Shortcut" />
        <Rows>
          <Row title="Start or stop a recording" desc="Works from any app while this one is running.">
            <Select value={settings.shortcut} onValueChange={(v) => update({ shortcut: v as SystemSettings["shortcut"] })}>
              <SelectTrigger className="h-[34px] w-[160px] rounded-[10px] text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent className="z-[120]">{(Object.keys(shortcuts) as SystemSettings["shortcut"][]).map((k) => <SelectItem key={k} value={k} className="text-[13px]">{shortcuts[k]}</SelectItem>)}</SelectContent>
            </Select>
          </Row>
        </Rows>
      </SettingsCard>

      <SettingsCard>
        <SettingsCardTitle title="Updates" />
        <Rows>
          <Row title="Update on its own" desc="New versions install quietly between recordings, never during one."><Switch checked={settings.autoUpdate} onCheckedChange={(v) => update({ autoUpdate: v })} /></Row>
          <Row title={`Version ${APP_VERSION}`} desc="Checked today."><span className="text-[13px] font-medium text-[#1F9D55]">Up to date</span></Row>
        </Rows>
      </SettingsCard>

      <SettingsCard>
        <SettingsCardTitle title={`Permissions on ${machine}`} subtitle={mac ? "Asked once. Both are needed to hear the whole call." : "Asked once. The call's sound needs no permission on Windows."} />
        <Rows>
          {[{ icon: Mic01Icon, title: "Microphone", desc: "Your side of the call.", ok: allowed.mic }, ...(mac ? [{ icon: VolumeHighIcon, title: "System audio", desc: "The other side, as it plays on this computer.", ok: allowed.sys }] : [])].map((r) => (
            <Row key={r.title} title={r.title} desc={r.desc} icon={r.icon}>
              {r.ok ? <span className="text-[13px] font-medium text-[#1F9D55]">Allowed</span> : <button type="button" className="h-[32px] rounded-full bg-primary px-[14px] text-[13px] font-semibold text-primary-foreground">Allow</button>}
            </Row>
          ))}
        </Rows>
      </SettingsCard>
    </div>
  );
}
