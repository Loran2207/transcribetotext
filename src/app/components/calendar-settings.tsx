import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { cn } from "@/app/components/ui/utils";
import { ProviderLogo, ConnectingSpinner } from "./calendar-connect";
import {
  useCalendarAccounts,
  PROVIDER_NAMES,
  type CalendarProvider,
  type CalendarAccount,
} from "./calendar-accounts";

/* ═══════════════════════════════════════════
   Auto-record mode — shared between the
   meetings list bar and the Settings tab
   ═══════════════════════════════════════════ */

export type AutoRecordMode = "all" | "internal" | "internal_no_1on1" | "manual";

export interface AutoRecordOption {
  value: AutoRecordMode;
  /** Short label for the inline bar on the meetings list */
  barLabel: string;
  /** Full label for the Settings tab */
  label: string;
  /** Tooltip shown next to the bar option */
  hint?: string;
  /** Description under the Settings radio */
  description?: string;
}

export const AUTO_RECORD_OPTIONS: AutoRecordOption[] = [
  {
    value: "all",
    barLabel: "All meetings",
    label: "All meetings",
    hint: "Every meeting on your calendar that you own",
  },
  {
    value: "internal",
    barLabel: "Internal meetings",
    label: "Internal meetings",
    hint: "Meetings you own where every invitee has your workspace email, like @northwindlabs.com",
    description: "All invitees are in your workspace or have an @northwindlabs.com email.",
  },
  {
    value: "internal_no_1on1",
    barLabel: "Internal, excluding one-on-ones",
    label: "Internal meetings, excluding one-on-ones",
    hint: "Meetings you own where every invitee has your workspace email, like @northwindlabs.com",
    description: "All invitees are in your workspace or have an @northwindlabs.com email.",
  },
  {
    value: "manual",
    barLabel: "Manually select",
    label: "Manually-selected meetings",
    description: "Select meetings you want to record with the toggle on each meeting.",
  },
];

const AUTO_RECORD_KEY = "ttt_autorecord_mode";
const MODE_VALUES = new Set<string>(AUTO_RECORD_OPTIONS.map((o) => o.value));

export function loadAutoRecordMode(): AutoRecordMode {
  try {
    const v = localStorage.getItem(AUTO_RECORD_KEY);
    if (v && MODE_VALUES.has(v)) return v as AutoRecordMode;
  } catch { /* ignore */ }
  return "all";
}

export function saveAutoRecordMode(mode: AutoRecordMode) {
  try { localStorage.setItem(AUTO_RECORD_KEY, mode); } catch { /* ignore */ }
}

/* ═══════════════════════════════════════════
   Other meeting settings (demo, persisted)
   ═══════════════════════════════════════════ */

interface MeetingSettings {
  recap: "all" | "internal" | "me";
  language: "auto" | "default";
}

const SETTINGS_KEY = "ttt_meeting_settings";

const DEFAULT_SETTINGS: MeetingSettings = {
  recap: "internal",
  language: "auto",
};

function loadSettings(): MeetingSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: MeetingSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

/* ═══════════════════════════════════════════
   Building blocks
   ═══════════════════════════════════════════ */

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card px-6 py-5">
      {children}
    </section>
  );
}

function SettingsCardTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[15px] font-semibold text-foreground tracking-tight">{title}</h3>
      {subtitle && (
        <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

interface RadioRowProps {
  id: string;
  value: string;
  label: string;
  description?: string;
}

function RadioRow({ id, value, label, description }: RadioRowProps) {
  return (
    <div className="flex items-start gap-2.5">
      <RadioGroupItem value={value} id={id} className="mt-[3px]" />
      <label htmlFor={id} className="flex flex-col gap-0.5 cursor-pointer">
        <span className="text-[13px] font-medium text-foreground leading-tight">{label}</span>
        {description && (
          <span className="text-[12px] text-muted-foreground leading-snug">{description}</span>
        )}
      </label>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Calendar section — providers and accounts
   ═══════════════════════════════════════════ */

const PROVIDER_ORDER: CalendarProvider[] = ["google", "outlook"];

interface CalendarSectionProps {
  accounts: CalendarAccount[];
  connecting: CalendarProvider | null;
  onConnect: (provider: CalendarProvider) => void;
  onDisconnect: (accountId: string) => void;
}

function CalendarSection({ accounts, connecting, onConnect, onDisconnect }: CalendarSectionProps) {
  return (
    <SettingsCard>
      <SettingsCardTitle
        title="Calendar"
        subtitle="Connect calendars to see and record your meetings."
      />
      <div className="flex flex-col">
        {PROVIDER_ORDER.map((provider, idx) => {
          const providerAccounts = accounts.filter((a) => a.provider === provider);
          const isConnecting = connecting === provider;

          return (
            <div
              key={provider}
              className={cn("py-4 last:pb-0", idx > 0 && "border-t border-border/50")}
            >
              <div className="flex items-center gap-3">
                <ProviderLogo provider={provider} size={22} />
                <span className="text-[14px] font-semibold text-foreground flex-1 min-w-0 truncate">
                  {PROVIDER_NAMES[provider]}
                </span>
                <Button
                  variant="pill-outline"
                  className="h-8 px-4 text-[12px] font-medium shrink-0 gap-1.5"
                  disabled={connecting !== null}
                  onClick={() => onConnect(provider)}
                >
                  {isConnecting && <ConnectingSpinner size={11} />}
                  {isConnecting
                    ? "Connecting..."
                    : providerAccounts.length > 0
                      ? "Add account"
                      : "Connect"}
                </Button>
              </div>

              {providerAccounts.length === 0 ? (
                <p className="text-[12px] text-muted-foreground/60 mt-2 pl-[34px]">
                  Not connected
                </p>
              ) : (
                <div className="flex flex-col mt-1 pl-[34px]">
                  {providerAccounts.map((account) => (
                    <div key={account.id} className="flex items-center gap-3 py-1.5">
                      <span className="text-[13px] text-foreground/80 truncate flex-1 min-w-0">
                        {account.email}
                      </span>
                      <Button
                        variant="pill-outline"
                        className="h-7 px-3.5 text-[12px] font-medium shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive/40"
                        onClick={() => onDisconnect(account.id)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SettingsCard>
  );
}

/* ═══════════════════════════════════════════
   Settings tab
   ═══════════════════════════════════════════ */

interface MeetingsSettingsTabProps {
  accounts: CalendarAccount[];
  connecting: CalendarProvider | null;
  onConnect: (provider: CalendarProvider) => void;
  onDisconnect: (accountId: string) => void;
  autoRecordMode: AutoRecordMode;
  onAutoRecordModeChange: (mode: AutoRecordMode) => void;
}

export function MeetingsSettingsContent({
  accounts,
  connecting,
  onConnect,
  onDisconnect,
  autoRecordMode,
  onAutoRecordModeChange,
}: MeetingsSettingsTabProps) {
  const [settings, setSettings] = useState<MeetingSettings>(loadSettings);

  const updateSetting = <K extends keyof MeetingSettings>(key: K, value: MeetingSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
        <CalendarSection
          accounts={accounts}
          connecting={connecting}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />

        {/* Auto-recording */}
        <SettingsCard>
          <SettingsCardTitle
            title="Auto-recording"
            subtitle="Only available for meetings you own."
          />
          <RadioGroup
            value={autoRecordMode}
            onValueChange={(v) => onAutoRecordModeChange(v as AutoRecordMode)}
            className="gap-4"
          >
            {AUTO_RECORD_OPTIONS.map((o) => (
              <RadioRow
                key={o.value}
                id={`autorecord_${o.value}`}
                value={o.value}
                label={o.label}
                description={o.description}
              />
            ))}
          </RadioGroup>
        </SettingsCard>

        {/* After-meeting settings */}
        <SettingsCard>
          <SettingsCardTitle title="After-meeting settings" />

          <div className="flex flex-col gap-6">
            <div>
              <h4 className="text-[13px] font-semibold text-foreground">Meeting recap</h4>
              <p className="text-[12px] text-muted-foreground mt-0.5 mb-3.5">
                Send a meeting recap email and allow access to the recording.
              </p>
              <RadioGroup
                value={settings.recap}
                onValueChange={(v) => updateSetting("recap", v as MeetingSettings["recap"])}
                className="gap-4"
              >
                <RadioRow id="recap_all" value="all" label="All meeting invitees" />
                <RadioRow
                  id="recap_internal"
                  value="internal"
                  label="Only internal invitees"
                  description="All invitees are in your workspace or have an @northwindlabs.com email."
                />
                <RadioRow id="recap_me" value="me" label="Just me" />
              </RadioGroup>
            </div>

            <div className="border-t border-border/50 pt-5">
              <h4 className="text-[13px] font-semibold text-foreground">Language setting</h4>
              <p className="text-[12px] text-muted-foreground mt-0.5 mb-3.5">
                Only applies to the meeting recap.
              </p>
              <RadioGroup
                value={settings.language}
                onValueChange={(v) => updateSetting("language", v as MeetingSettings["language"])}
                className="gap-4"
              >
                <RadioRow id="lang_auto" value="auto" label="Auto-detect language" />
                <RadioRow id="lang_default" value="default" label="Set default language" />
              </RadioGroup>
            </div>
          </div>
        </SettingsCard>
    </div>
  );
}

/* Wrapper used on the Meetings page (scrollable column) */
export function MeetingsSettingsTab(props: MeetingsSettingsTabProps) {
  return (
    <div className="flex-1 overflow-y-auto mt-5 pb-8 scrollbar-hide">
      <MeetingsSettingsContent {...props} />
    </div>
  );
}

/* Self-contained panel for the app settings modal */
export function MeetingsSettingsPanel() {
  const { accounts, connecting, connectAccount, disconnectAccount } = useCalendarAccounts();
  const [mode, setMode] = useState<AutoRecordMode>(loadAutoRecordMode);

  const handleModeChange = (m: AutoRecordMode) => {
    setMode(m);
    saveAutoRecordMode(m);
  };

  return (
    <MeetingsSettingsContent
      accounts={accounts}
      connecting={connecting}
      onConnect={connectAccount}
      onDisconnect={disconnectAccount}
      autoRecordMode={mode}
      onAutoRecordModeChange={handleModeChange}
    />
  );
}
