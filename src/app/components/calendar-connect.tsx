import { Calendar, Shield01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { PROVIDER_NAMES, type CalendarProvider } from "./calendar-accounts";

interface ProviderInfo {
  id: CalendarProvider;
  name: string;
  description: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: "google",
    name: PROVIDER_NAMES.google,
    description: "Gmail and Google Workspace accounts",
  },
  {
    id: "outlook",
    name: PROVIDER_NAMES.outlook,
    description: "Outlook.com and Microsoft 365 accounts",
  },
];

export function GoogleCalendarLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className="shrink-0">
      <path fill="#fff" d="M152.6 47.4H47.4v105.2h105.2z" />
      <path fill="#ea4335" d="M152.6 200 200 152.6h-47.4z" />
      <path fill="#fbbc04" d="M200 47.4h-47.4v105.2H200z" />
      <path fill="#34a853" d="M152.6 152.6H47.4V200h105.2z" />
      <path fill="#188038" d="M0 152.6v31.6A15.8 15.8 0 0 0 15.8 200h31.6v-47.4z" />
      <path fill="#1967d2" d="M200 15.8A15.8 15.8 0 0 0 184.2 0h-31.6v47.4H200z" />
      <path fill="#4285f4" d="M152.6 0H15.8A15.8 15.8 0 0 0 0 15.8v136.8h47.4V47.4h105.2z" />
      <path
        fill="#4285f4"
        d="M68.6 129.1c-3.9-2.6-6.6-6.5-8.1-11.5l9.1-3.7c.8 3.1 2.3 5.5 4.3 7.2 2 1.7 4.5 2.5 7.4 2.5 2.9 0 5.5-.9 7.6-2.7 2.1-1.8 3.2-4.1 3.2-6.9 0-2.9-1.1-5.2-3.4-7-2.3-1.8-5.1-2.7-8.5-2.7h-5.2v-9h4.7c2.9 0 5.4-.8 7.4-2.4 2-1.6 3-3.7 3-6.5 0-2.4-.9-4.4-2.7-5.8-1.8-1.5-4.1-2.2-6.9-2.2-2.7 0-4.9.7-6.5 2.2-1.6 1.5-2.8 3.2-3.5 5.3l-9-3.7c1.2-3.4 3.4-6.4 6.6-9 3.2-2.6 7.4-3.9 12.4-3.9 3.7 0 7.1.7 10 2.1 3 1.4 5.3 3.4 7 6 1.7 2.5 2.5 5.4 2.5 8.5 0 3.2-.8 5.9-2.3 8.1-1.5 2.2-3.4 3.9-5.7 5.1v.5c3 1.2 5.4 3.1 7.3 5.6 1.9 2.5 2.8 5.6 2.8 9.1s-.9 6.7-2.7 9.4c-1.8 2.8-4.3 4.9-7.5 6.5s-6.8 2.4-10.8 2.4c-4.6.1-8.9-1.3-12.8-3.9zM116.3 87.7l-10 7.2-5-7.6 17.9-12.9h6.9v61h-9.8z"
      />
    </svg>
  );
}

export function OutlookLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className="shrink-0">
      <rect x="20" y="9" width="23" height="30" rx="3" fill="#50b5f1" />
      <path d="M20 9h23v11H20z" fill="#9fddff" />
      <path d="M20 24h23v12a3 3 0 0 1-3 3H23a3 3 0 0 1-3-3V24Z" fill="#1b8ce3" />
      <rect x="4" y="13" width="25" height="25" rx="4" fill="#106ebe" />
      <circle cx="16.5" cy="25.5" r="6.8" stroke="#fff" strokeWidth="3.4" />
    </svg>
  );
}

export function ProviderLogo({ provider, size = 28 }: { provider: CalendarProvider; size?: number }) {
  return provider === "google" ? <GoogleCalendarLogo size={size} /> : <OutlookLogo size={size} />;
}

export function ConnectingSpinner({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="shrink-0 animate-spin">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 10" />
    </svg>
  );
}

interface ProviderRowProps {
  provider: ProviderInfo;
  connecting: CalendarProvider | null;
  onConnect: (provider: CalendarProvider) => void;
}

function ProviderRow({ provider, connecting, onConnect }: ProviderRowProps) {
  const isConnecting = connecting === provider.id;
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5 text-left">
      <ProviderLogo provider={provider.id} />
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-foreground">{provider.name}</div>
        <div className="text-[12px] text-muted-foreground truncate">{provider.description}</div>
      </div>
      <Button
        variant="pill-outline"
        className="h-8 px-4 text-[12px] font-medium shrink-0 gap-1.5"
        disabled={connecting !== null}
        onClick={() => onConnect(provider.id)}
      >
        {isConnecting && <ConnectingSpinner />}
        {isConnecting ? "Connecting..." : "Connect"}
      </Button>
    </div>
  );
}

function PrivacyNote() {
  return (
    <p className="flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground/70">
      <Icon icon={Shield01Icon} size={13} className="shrink-0" />
      We only read your meeting schedule. You can disconnect anytime.
    </p>
  );
}

/* Connect screen — shown when no calendar account is connected */

interface CalendarConnectScreenProps {
  connecting: CalendarProvider | null;
  onConnect: (provider: CalendarProvider) => void;
}

export function CalendarConnectScreen({ connecting, onConnect }: CalendarConnectScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center pb-20">
      <div className="w-full max-w-[460px] flex flex-col items-center text-center px-4">
        <div className="size-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-5">
          <Icon icon={Calendar} size={30} className="text-primary" />
        </div>
        <h2 className="text-[20px] font-semibold text-foreground tracking-tight">
          Connect your calendar
        </h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed mt-2 max-w-[360px]">
          See your meetings here and let TranscribeToText join, record, and
          transcribe them automatically.
        </p>

        <div className="w-full flex flex-col gap-2.5 mt-7">
          {PROVIDERS.map((p) => (
            <ProviderRow key={p.id} provider={p} connecting={connecting} onConnect={onConnect} />
          ))}
        </div>

        <div className="mt-6">
          <PrivacyNote />
        </div>
      </div>
    </div>
  );
}

/* Add calendar dialog — provider chooser */

interface AddCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connecting: CalendarProvider | null;
  onConnect: (provider: CalendarProvider) => Promise<boolean>;
}

export function AddCalendarDialog({ open, onOpenChange, connecting, onConnect }: AddCalendarDialogProps) {
  const handleConnect = async (provider: CalendarProvider) => {
    const connected = await onConnect(provider);
    if (connected) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (connecting === null) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[440px] p-6 gap-0">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-[17px] font-semibold tracking-tight">
            Add a calendar
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            Choose a provider to sync your meetings.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2.5 mt-5">
          {PROVIDERS.map((p) => (
            <ProviderRow key={p.id} provider={p} connecting={connecting} onConnect={handleConnect} />
          ))}
        </div>
        <div className="mt-5">
          <PrivacyNote />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* Empty state — calendar connected but no meetings */

interface CalendarEmptyStateProps {
  onAddCalendar: () => void;
  onRecordMeeting: () => void;
}

export function CalendarEmptyState({ onAddCalendar, onRecordMeeting }: CalendarEmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center pb-16">
      <div className="flex flex-col items-center text-center max-w-[400px] px-4">
        <div className="size-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-5">
          <Icon icon={Calendar} size={30} className="text-primary" />
        </div>
        <h2 className="text-[18px] font-semibold text-foreground tracking-tight">
          No meetings yet
        </h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">
          Upcoming events from your connected calendars will appear here
          automatically.
        </p>
        <div className="flex items-center gap-2.5 mt-6">
          <Button className="rounded-full h-9 px-4 text-[13px] font-medium" onClick={onRecordMeeting}>
            Record a meeting
          </Button>
          <Button
            variant="pill-outline"
            className="h-9 px-4 text-[13px] font-medium"
            onClick={onAddCalendar}
          >
            Add calendar
          </Button>
        </div>
      </div>
    </div>
  );
}